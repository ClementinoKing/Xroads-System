-- Patient directory records for Xroads.
-- These rows back the Patients page and create-patient flow.

create extension if not exists pgcrypto;

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  patient_code text not null unique,
  full_name text not null,
  phone text not null,
  email text null,
  branch_id text null references public.branches (id) on delete set null,
  last_visit text not null default 'New patient',
  next_appointment text not null default 'No upcoming',
  payment_method text not null check (payment_method in ('Cash', 'Medical Scheme')),
  scheme_name text null,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists patients_patient_code_unique
  on public.patients (patient_code)
  where deleted_at is null;

create index if not exists patients_branch_idx
  on public.patients (branch_id)
  where deleted_at is null;

create index if not exists patients_payment_method_idx
  on public.patients (payment_method)
  where deleted_at is null;

create index if not exists patients_deleted_at_idx
  on public.patients (deleted_at);

create or replace function public.set_patient_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_patients_updated_at on public.patients;
create trigger set_patients_updated_at
before update on public.patients
for each row
execute function public.set_patient_updated_at();

create or replace function public.generate_patient_code()
returns text
language sql
stable
as $$
  select 'PAT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

alter table public.patients
  alter column patient_code set default public.generate_patient_code();

alter table public.patients enable row level security;

drop policy if exists "patients_select_authenticated" on public.patients;
create policy "patients_select_authenticated"
on public.patients
for select
using (auth.uid() is not null and deleted_at is null);

drop policy if exists "patients_manage_authenticated" on public.patients;
create policy "patients_manage_authenticated"
on public.patients
for all
using (auth.uid() is not null and deleted_at is null)
with check (auth.uid() is not null and deleted_at is null);

insert into public.patients (
  patient_code,
  full_name,
  phone,
  email,
  branch_id,
  last_visit,
  next_appointment,
  payment_method,
  scheme_name
)
values
  ('PAT-001', 'Grace Banda', '+265 888 201 430', 'grace@example.com', 'xroads-dental', '2026-04-21', 'Today 08:30', 'Medical Scheme', 'MASM'),
  ('PAT-002', 'Thoko Phiri', '+265 999 118 045', null, 'xroads-dental', '2026-05-01', 'Today 11:00', 'Cash', null),
  ('PAT-003', 'Mary Tembo', '+265 887 443 902', 'mary@example.com', 'gateway-dental', 'New patient', 'Today 09:00', 'Cash', null),
  ('PAT-004', 'Patrick Zulu', '+265 884 871 223', null, 'gateway-dental', '2026-04-14', 'Tomorrow 14:00', 'Medical Scheme', 'AON'),
  ('PAT-005', 'Ruth Mbewe', '+265 991 320 884', null, 'xroads-dental', 'Today', 'No upcoming', 'Medical Scheme', 'Liberty Health'),
  ('PAT-006', 'Linda Chirwa', '+265 995 020 111', null, 'gateway-dental', '2026-03-30', 'Today 12:00', 'Cash', null)
on conflict (patient_code) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  email = excluded.email,
  branch_id = excluded.branch_id,
  last_visit = excluded.last_visit,
  next_appointment = excluded.next_appointment,
  payment_method = excluded.payment_method,
  scheme_name = excluded.scheme_name,
  updated_at = timezone('utc', now());

comment on table public.patients is 'Patient directory records for clinic staff.';
