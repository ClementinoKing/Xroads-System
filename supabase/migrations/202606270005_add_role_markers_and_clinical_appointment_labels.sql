-- Add an appointment marker to staff roles so custom clinical titles can still appear in scheduling.

alter table public.roles
  add column if not exists appointment_marker text not null default 'Staff';

do $$
begin
  alter table public.roles
    add constraint roles_appointment_marker_check
    check (appointment_marker in ('Dentist', 'Staff'));
exception
  when duplicate_object then null;
end $$;

update public.roles
set appointment_marker = case
  when id = 'dentist' then 'Dentist'
  when lower(name) like '%dentist%'
    or lower(name) like '%therapist%'
    or lower(name) like '%dental%'
    or lower(coalesce(description, '')) like '%dentist%'
    or lower(coalesce(description, '')) like '%therapist%'
    or lower(coalesce(description, '')) like '%dental%'
    then 'Dentist'
  else 'Staff'
end
where appointment_marker = 'Staff'
  or appointment_marker is null;

alter table public.appointments
  add column if not exists dentist_marker text not null default 'Dentist';

create or replace function public.sync_appointment_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  patient_row record;
  dentist_row record;
  dentist_role_row record;
  service_row record;
  resolved_branch_id text;
begin
  select
    patient_code,
    full_name,
    phone,
    email,
    branch_id,
    payment_method,
    scheme_name
  into patient_row
  from public.patients
  where patient_code = new.patient_code
    and deleted_at is null;

  if not found then
    raise exception 'Patient % does not exist', new.patient_code;
  end if;

  select
    id,
    full_name,
    role_id,
    branch_id,
    status
  into dentist_row
  from public.profiles
  where id = new.dentist_id
    and deleted_at is null;

  if not found then
    raise exception 'Dentist % does not exist', new.dentist_id;
  end if;

  select
    id,
    name,
    appointment_marker
  into dentist_role_row
  from public.roles
  where id = dentist_row.role_id;

  if not found then
    raise exception 'Role % does not exist', dentist_row.role_id;
  end if;

  if coalesce(dentist_role_row.appointment_marker, 'Staff') <> 'Dentist' and dentist_row.role_id <> 'dentist' then
    raise exception 'Profile % is not a dentist role', new.dentist_id;
  end if;

  select
    service_code,
    name,
    duration_minutes
  into service_row
  from public.services
  where service_code = new.service_code
    and deleted_at is null;

  if not found then
    raise exception 'Service % does not exist', new.service_code;
  end if;

  resolved_branch_id := coalesce(new.branch_id, patient_row.branch_id, dentist_row.branch_id);

  if resolved_branch_id is null then
    raise exception 'Appointment branch could not be resolved';
  end if;

  if dentist_row.branch_id <> resolved_branch_id then
    raise exception 'Dentist % is not assigned to branch %', new.dentist_id, resolved_branch_id;
  end if;

  if patient_row.branch_id is not null and patient_row.branch_id <> resolved_branch_id then
    raise exception 'Patient % belongs to branch %, not %', new.patient_code, patient_row.branch_id, resolved_branch_id;
  end if;

  new.branch_id := resolved_branch_id;
  new.patient_name := patient_row.full_name;
  new.patient_phone := patient_row.phone;
  new.patient_email := patient_row.email;
  new.patient_branch_id := patient_row.branch_id;
  new.payment_type := patient_row.payment_method::public.payment_type;
  new.scheme_name := case
    when patient_row.payment_method = 'Medical Scheme' then patient_row.scheme_name
    else null
  end;
  new.dentist_name := dentist_row.full_name;
  new.dentist_role := dentist_role_row.name;
  new.dentist_marker := dentist_role_row.appointment_marker;
  new.service_name := service_row.name;
  new.duration_minutes := coalesce(new.duration_minutes, service_row.duration_minutes);
  new.metadata := coalesce(new.metadata, '{}'::jsonb)
    || jsonb_build_object(
      'dentist_name', dentist_row.full_name,
      'dentist_role', dentist_role_row.name,
      'dentist_marker', dentist_role_row.appointment_marker
    );

  if new.duration_minutes < 30 or new.duration_minutes > 240 or mod(new.duration_minutes, 30) <> 0 then
    raise exception 'Appointment duration must be a 30-minute increment between 30 and 240 minutes';
  end if;

  return new;
end;
$$;

update public.appointments a
set
  patient_name = p.full_name,
  patient_phone = p.phone,
  patient_email = p.email,
  patient_branch_id = p.branch_id,
  dentist_name = d.full_name,
  dentist_role = r.name,
  dentist_marker = r.appointment_marker,
  service_name = s.name,
  payment_type = p.payment_method::public.payment_type,
  scheme_name = case
    when p.payment_method = 'Medical Scheme' then p.scheme_name
    else null
  end,
  metadata = coalesce(a.metadata, '{}'::jsonb)
    || jsonb_build_object(
      'dentist_name', d.full_name,
      'dentist_role', r.name,
      'dentist_marker', r.appointment_marker
    )
from public.patients p,
     public.profiles d,
     public.roles r,
     public.services s
where a.patient_code = p.patient_code
  and a.dentist_id = d.id
  and d.deleted_at is null
  and d.role_id = r.id
  and a.service_code = s.service_code
  and p.deleted_at is null
  and s.deleted_at is null
  and a.deleted_at is null;

drop view if exists public.appointments_read;
create view public.appointments_read
with (security_invoker = true)
as
select
  a.appointment_code,
  a.patient_id,
  a.patient_code,
  a.patient_name,
  a.patient_phone,
  a.patient_email,
  a.patient_branch_id,
  a.branch_id,
  a.dentist_id,
  a.dentist_name,
  a.dentist_role,
  a.dentist_marker,
  a.service_id,
  a.service_code,
  a.service_name,
  a.appointment_date,
  a.start_time,
  a.duration_minutes,
  a.status,
  a.payment_type,
  a.scheme_name,
  a.emergency,
  a.notes,
  a.metadata,
  a.deleted_at,
  a.created_at,
  a.updated_at
from public.appointments a
where a.deleted_at is null;

grant select on public.appointments_read to authenticated;

comment on view public.appointments_read is 'Snapshot appointment read model with preserved patient, dentist, marker, and service details.';

drop policy if exists "profiles_select_dentist_branch_scoped" on public.profiles;
create policy "profiles_select_dentist_branch_scoped"
on public.profiles
for select
using (
  auth.uid() is not null
  and deleted_at is null
  and exists (
    select 1
    from public.roles roles
    where roles.id = profiles.role_id
      and (roles.appointment_marker = 'Dentist' or roles.id = 'dentist')
  )
  and public.can_access_branch(branch_id)
);

comment on table public.roles is 'Role catalog with appointment markers for clinical scheduling.';
