-- Service catalog records for Xroads.
-- These rows back the Services page and appointment/service selection flows.

create extension if not exists pgcrypto;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  service_code text not null unique,
  name text not null,
  description text not null,
  duration_minutes integer not null check (duration_minutes between 10 and 240),
  category text not null check (category in ('General', 'Cosmetic', 'Emergency', 'Orthodontics', 'Pediatric', 'Preventive')),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists services_service_code_unique
  on public.services (service_code)
  where deleted_at is null;

create index if not exists services_category_idx
  on public.services (category)
  where deleted_at is null;

create index if not exists services_active_idx
  on public.services (is_active)
  where deleted_at is null;

create index if not exists services_deleted_at_idx
  on public.services (deleted_at);

create or replace function public.set_service_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at
before update on public.services
for each row
execute function public.set_service_updated_at();

create or replace function public.generate_service_code()
returns text
language sql
stable
as $$
  select 'svc-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
$$;

alter table public.services
  alter column service_code set default public.generate_service_code();

alter table public.services enable row level security;

drop policy if exists "services_select_authenticated" on public.services;
create policy "services_select_authenticated"
on public.services
for select
using (auth.uid() is not null and deleted_at is null);

drop policy if exists "services_manage_authenticated" on public.services;
create policy "services_manage_authenticated"
on public.services
for all
using (auth.uid() is not null and deleted_at is null)
with check (auth.uid() is not null and deleted_at is null);

insert into public.services (
  service_code,
  name,
  description,
  duration_minutes,
  category,
  is_active
)
values
  ('consultation', 'Consultation', 'Initial assessment and care planning.', 30, 'General', true),
  ('cleaning', 'Cleaning', 'Professional scaling and polish.', 45, 'Preventive', true),
  ('checkup', 'Checkup', 'Routine oral health review.', 30, 'Preventive', true),
  ('emergency', 'Emergency', 'Urgent pain, trauma, or swelling support.', 60, 'Emergency', true),
  ('general-dentistry', 'General Dentistry', 'Everyday dental treatment and care.', 45, 'General', true),
  ('cosmetic-dentistry', 'Cosmetic Dentistry', 'Smile design and appearance-focused care.', 60, 'Cosmetic', true),
  ('orthodontics', 'Orthodontics', 'Alignment reviews and treatment follow-ups.', 60, 'Orthodontics', true),
  ('pediatric-dentistry', 'Pediatric Dentistry', 'Child-friendly dental care.', 45, 'Pediatric', true),
  ('restorative-dentistry', 'Restorative Dentistry', 'Fillings, crowns, and repair treatment.', 60, 'General', false)
on conflict (service_code) where deleted_at is null do update set
  name = excluded.name,
  description = excluded.description,
  duration_minutes = excluded.duration_minutes,
  category = excluded.category,
  is_active = excluded.is_active,
  deleted_at = null,
  updated_at = timezone('utc', now());

comment on table public.services is 'Service catalog records for clinic operations.';
