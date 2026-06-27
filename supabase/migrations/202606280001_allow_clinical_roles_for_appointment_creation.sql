-- Allow custom staff roles marked as Dentist to be booked into appointments.
-- This keeps the appointment insert trigger aligned with the role marker system.

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

  if coalesce(dentist_role_row.appointment_marker, 'Staff') <> 'Dentist' then
    raise exception 'Profile % is not a dentist role', new.dentist_id;
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

drop trigger if exists sync_appointment_snapshot on public.appointments;
create trigger sync_appointment_snapshot
before insert or update on public.appointments
for each row
execute function public.sync_appointment_snapshot();

comment on function public.sync_appointment_snapshot() is 'Appointment snapshot trigger that accepts custom clinical roles marked as Dentist.';
