-- Appointment booking records for Xroads.
-- Dentists are sourced from public.profiles rows with role_id = 'dentist'.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$
begin
  create type public.appointment_status as enum (
    'Pending',
    'Confirmed',
    'Arrived',
    'In Consultation',
    'Completed',
    'Cancelled',
    'No-show',
    'Rescheduled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_type as enum (
    'Cash',
    'Medical Scheme'
  );
exception
  when duplicate_object then null;
end $$;

create or replace function public.current_profile_branch_id()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select branch_id
  from public.profiles
  where id = auth.uid()
    and deleted_at is null
$$;

create or replace function public.can_access_branch(target_branch_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    public.is_profile_admin()
    or public.current_profile_branch_id() is null
    or target_branch_id = public.current_profile_branch_id();
$$;
create or replace function public.generate_appointment_code()
returns text
language sql
stable
as $$
  select 'APT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

create or replace function public.set_appointment_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

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

  if new.duration_minutes < 30 or new.duration_minutes > 240 or mod(new.duration_minutes, 30) <> 0 then
    raise exception 'Appointment duration must be a 30-minute increment between 30 and 240 minutes';
  end if;

  return new;
end;
$$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  appointment_code text not null default public.generate_appointment_code(),
  patient_code text not null references public.patients (patient_code) on delete restrict,
  patient_name text not null,
  patient_phone text not null,
  patient_email text null,
  patient_branch_id text null references public.branches (id) on delete set null,
  branch_id text not null references public.branches (id) on delete restrict,
  dentist_id uuid not null references public.profiles (id) on delete restrict,
  dentist_name text not null,
  dentist_role text not null,
  service_code text not null references public.services (service_code) on delete restrict,
  service_name text not null,
  appointment_date date not null,
  start_time time not null,
  duration_minutes integer not null check (duration_minutes between 30 and 240 and mod(duration_minutes, 30) = 0),
  status public.appointment_status not null default 'Pending',
  payment_type public.payment_type not null default 'Cash',
  scheme_name text null,
  emergency boolean not null default false,
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  slot_range tsrange generated always as (
    tsrange(
      appointment_date::timestamp + start_time,
      appointment_date::timestamp + start_time + make_interval(mins => duration_minutes),
      '[)'
    )
  ) stored
);

create unique index if not exists appointments_appointment_code_idx
  on public.appointments (appointment_code)
  where deleted_at is null;

create index if not exists appointments_branch_idx
  on public.appointments (branch_id)
  where deleted_at is null;

create index if not exists appointments_dentist_idx
  on public.appointments (dentist_id)
  where deleted_at is null;

create index if not exists appointments_patient_idx
  on public.appointments (patient_code)
  where deleted_at is null;

create index if not exists appointments_date_idx
  on public.appointments (appointment_date)
  where deleted_at is null;

create index if not exists appointments_deleted_at_idx
  on public.appointments (deleted_at);

create unique index if not exists appointments_code_idx
  on public.appointments (appointment_code)
  where deleted_at is null;

do $$
begin
  alter table public.appointments
    add constraint appointments_no_overlap
    exclude using gist (dentist_id with =, slot_range with &&)
    where (deleted_at is null);
exception
  when duplicate_object then null;
end $$;

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
before update on public.appointments
for each row
execute function public.set_appointment_updated_at();

drop trigger if exists sync_appointment_snapshot on public.appointments;
create trigger sync_appointment_snapshot
before insert or update on public.appointments
for each row
execute function public.sync_appointment_snapshot();

alter table public.appointments enable row level security;

drop policy if exists "appointments_select_branch_scoped" on public.appointments;
create policy "appointments_select_branch_scoped"
on public.appointments
for select
using (
  auth.uid() is not null
  and deleted_at is null
  and public.can_access_branch(branch_id)
);

drop policy if exists "appointments_manage_branch_scoped" on public.appointments;
create policy "appointments_manage_branch_scoped"
on public.appointments
for all
using (
  auth.uid() is not null
  and deleted_at is null
  and public.can_access_branch(branch_id)
)
with check (
  auth.uid() is not null
  and deleted_at is null
  and public.can_access_branch(branch_id)
);

comment on table public.appointments is 'Branch-scoped appointment bookings with patient and staff snapshots.';
