-- Archive staff accounts without breaking appointment history.
-- The app treats deleted staff as removed from active lists, while appointment snapshots preserve historical dentist names.

alter table public.appointments
  add column if not exists patient_code text,
  add column if not exists patient_name text not null default '',
  add column if not exists patient_phone text not null default '',
  add column if not exists patient_email text null,
  add column if not exists patient_branch_id text null,
  add column if not exists dentist_name text not null default '',
  add column if not exists dentist_role text not null default '',
  add column if not exists service_code text,
  add column if not exists service_name text not null default '',
  add column if not exists payment_type public.payment_type,
  add column if not exists scheme_name text null;

create or replace function public.sync_appointment_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  patient_row record;
  dentist_row record;
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

  if coalesce(dentist_row.role_id, '') <> 'dentist' then
    raise exception 'Profile % is not a dentist', new.dentist_id;
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
  new.dentist_role := 'Dentist';
  new.service_name := service_row.name;
  new.duration_minutes := coalesce(new.duration_minutes, service_row.duration_minutes);
  new.metadata := coalesce(new.metadata, '{}'::jsonb)
    || jsonb_build_object(
      'dentist_name', dentist_row.full_name,
      'dentist_role', dentist_row.role_id
    );

  if new.duration_minutes < 30 or new.duration_minutes > 240 or mod(new.duration_minutes, 30) <> 0 then
    raise exception 'Appointment duration must be a 30-minute increment between 30 and 240 minutes';
  end if;

  return new;
end;
$$;

update public.appointments a
set
  patient_code = p.patient_code,
  patient_name = p.full_name,
  patient_phone = p.phone,
  patient_email = p.email,
  patient_branch_id = p.branch_id,
  dentist_name = d.full_name,
  dentist_role = d.role_id,
  service_code = s.service_code,
  service_name = s.name,
  payment_type = p.payment_method::public.payment_type,
  scheme_name = case
    when p.payment_method = 'Medical Scheme' then p.scheme_name
    else null
  end
from public.patients p,
     public.profiles d,
     public.services s
where a.patient_id = p.id
  and a.dentist_id = d.id
  and a.service_id = s.id
  and a.deleted_at is null;

update public.appointments a
set metadata = coalesce(a.metadata, '{}'::jsonb)
  || jsonb_build_object(
    'dentist_name', d.full_name,
    'dentist_role', d.role_id
  )
from public.profiles d
where a.dentist_id = d.id
  and a.deleted_at is null
  and (
    coalesce(a.metadata ->> 'dentist_name', '') = ''
    or coalesce(a.metadata ->> 'dentist_role', '') = ''
  );

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

comment on view public.appointments_read is 'Snapshot appointment read model with preserved patient, dentist, and service details.';
