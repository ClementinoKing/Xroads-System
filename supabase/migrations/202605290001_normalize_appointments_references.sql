-- Normalize appointments to store only foreign keys for patient, dentist, and service.
-- Existing rows are backfilled before the redundant snapshot columns are dropped.

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
    id,
    patient_code,
    full_name,
    phone,
    email,
    branch_id,
    payment_method,
    scheme_name
  into patient_row
  from public.patients
  where id = new.patient_id
    and deleted_at is null;

  if not found then
    raise exception 'Patient % does not exist', new.patient_id;
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
    id,
    service_code,
    name,
    duration_minutes
  into service_row
  from public.services
  where id = new.service_id
    and deleted_at is null;

  if not found then
    raise exception 'Service % does not exist', new.service_id;
  end if;

  resolved_branch_id := coalesce(new.branch_id, patient_row.branch_id, dentist_row.branch_id);

  if resolved_branch_id is null then
    raise exception 'Appointment branch could not be resolved';
  end if;

  if dentist_row.branch_id <> resolved_branch_id then
    raise exception 'Dentist % is not assigned to branch %', new.dentist_id, resolved_branch_id;
  end if;

  if patient_row.branch_id is not null and patient_row.branch_id <> resolved_branch_id then
    raise exception 'Patient % belongs to branch %, not %', patient_row.patient_code, patient_row.branch_id, resolved_branch_id;
  end if;

  new.branch_id := resolved_branch_id;

  if new.duration_minutes is null then
    new.duration_minutes := service_row.duration_minutes;
  end if;

  if new.duration_minutes < 30 or new.duration_minutes > 240 or mod(new.duration_minutes, 30) <> 0 then
    raise exception 'Appointment duration must be a 30-minute increment between 30 and 240 minutes';
  end if;

  return new;
end;
$$;

alter table public.appointments
  add column if not exists patient_id uuid,
  add column if not exists service_id uuid;

update public.appointments a
set
  patient_id = p.id,
  service_id = s.id
from public.patients p,
     public.services s
where a.patient_id is null
  and a.service_id is null
  and a.patient_code = p.patient_code
  and p.deleted_at is null
  and a.service_code = s.service_code
  and s.deleted_at is null;

update public.appointments
set duration_minutes = coalesce(duration_minutes, 30)
where duration_minutes is null;

alter table public.appointments
  alter column patient_id set not null,
  alter column service_id set not null;

do $$
begin
  alter table public.appointments
    add constraint appointments_patient_id_fkey foreign key (patient_id) references public.patients (id) on delete restrict;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.appointments
    add constraint appointments_service_id_fkey foreign key (service_id) references public.services (id) on delete restrict;
exception
  when duplicate_object then null;
end $$;

drop index if exists public.appointments_patient_idx;
create index if not exists appointments_patient_idx
  on public.appointments (patient_id)
  where deleted_at is null;

drop index if exists public.appointments_dentist_idx;
create index if not exists appointments_dentist_idx
  on public.appointments (dentist_id)
  where deleted_at is null;

drop index if exists public.appointments_date_idx;
create index if not exists appointments_date_idx
  on public.appointments (appointment_date)
  where deleted_at is null;

create index if not exists appointments_service_idx
  on public.appointments (service_id)
  where deleted_at is null;

drop index if exists public.appointments_code_idx;

drop view if exists public.appointments_read;
create view public.appointments_read
with (security_invoker = true)
as
select
  a.appointment_code,
  a.patient_id,
  p.patient_code,
  p.full_name as patient_name,
  p.phone as patient_phone,
  p.email as patient_email,
  p.branch_id as patient_branch_id,
  a.branch_id,
  a.dentist_id,
  d.full_name as dentist_name,
  d.role_id as dentist_role,
  a.service_id,
  s.service_code,
  s.name as service_name,
  a.appointment_date,
  a.start_time,
  a.duration_minutes,
  a.status,
  p.payment_method::public.payment_type as payment_type,
  case
    when p.payment_method = 'Medical Scheme' then p.scheme_name
    else null
  end as scheme_name,
  a.emergency,
  a.notes,
  a.metadata,
  a.deleted_at,
  a.created_at,
  a.updated_at
from public.appointments a
join public.patients p on p.id = a.patient_id and p.deleted_at is null
join public.profiles d on d.id = a.dentist_id and d.deleted_at is null
join public.services s on s.id = a.service_id and s.deleted_at is null
where a.deleted_at is null;

grant select on public.appointments_read to authenticated;

comment on view public.appointments_read is 'Joined appointment read model with patient, dentist, and service details.';

alter table public.appointments
  drop column if exists patient_code,
  drop column if exists patient_name,
  drop column if exists patient_phone,
  drop column if exists patient_email,
  drop column if exists patient_branch_id,
  drop column if exists dentist_name,
  drop column if exists dentist_role,
  drop column if exists service_code,
  drop column if exists service_name,
  drop column if exists payment_type,
  drop column if exists scheme_name;

comment on table public.appointments is 'Branch-scoped appointment bookings keyed by patient, dentist, and service IDs.';
