-- Expand the service catalog into normalized categories, sections, and price lists
-- while preserving the existing services primary keys used by appointments.

create extension if not exists pgcrypto;

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_sections (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories (id) on delete restrict,
  name text not null,
  description text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint service_sections_unique unique (category_id, name)
);

create table if not exists public.service_price_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text null,
  effective_from date not null default current_date,
  effective_to date null,
  currency_code text not null default 'MWK',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint service_price_lists_unique unique (name, effective_from),
  constraint service_price_lists_effective_window_check check (effective_to is null or effective_to >= effective_from)
);

create table if not exists public.service_prices (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  price_list_id uuid not null references public.service_price_lists (id) on delete cascade,
  amount numeric(14, 2) not null,
  pricing_unit text not null default 'per procedure',
  notes text null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint service_prices_amount_check check (amount >= 0),
  constraint service_prices_unique unique (service_id, price_list_id)
);

create index if not exists service_categories_sort_idx
  on public.service_categories (sort_order, name);

create index if not exists service_sections_category_idx
  on public.service_sections (category_id, sort_order, name);

create index if not exists service_price_lists_effective_idx
  on public.service_price_lists (effective_from desc, effective_to desc);

create index if not exists service_prices_service_idx
  on public.service_prices (service_id);

create index if not exists service_prices_price_list_idx
  on public.service_prices (price_list_id);

alter table public.services
  add column if not exists category_id uuid,
  add column if not exists section_id uuid,
  add column if not exists default_duration_minutes integer,
  add column if not exists sort_order integer not null default 0;

insert into public.service_categories (name, description, sort_order, is_active)
select distinct
  s.category,
  s.category || ' services',
  0,
  true
from public.services s
where s.deleted_at is null
  and nullif(trim(s.category), '') is not null
on conflict (name) do update
set
  description = excluded.description,
  is_active = true;

update public.services s
set default_duration_minutes = coalesce(s.default_duration_minutes, s.duration_minutes)
where s.default_duration_minutes is null;

update public.services s
set category_id = c.id
from public.service_categories c
where s.category_id is null
  and lower(c.name) = lower(s.category);

do $$
begin
  alter table public.services
    add constraint services_category_id_fkey foreign key (category_id) references public.service_categories (id) on delete restrict;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.services
    add constraint services_section_id_fkey foreign key (section_id) references public.service_sections (id) on delete set null;
exception
  when duplicate_object then null;
end $$;

update public.services
set sort_order = coalesce(sort_order, 0)
where sort_order is null;

alter table public.services
  alter column category_id set not null,
  alter column default_duration_minutes set not null;

alter table public.services
  add constraint services_default_duration_minutes_check
    check (default_duration_minutes between 10 and 240);

create index if not exists services_category_id_idx
  on public.services (category_id)
  where deleted_at is null;

create index if not exists services_section_id_idx
  on public.services (section_id)
  where deleted_at is null;

create index if not exists services_sort_order_idx
  on public.services (sort_order)
  where deleted_at is null;

create or replace function public.set_service_catalog_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_service_catalog_legacy_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_row record;
  section_row record;
begin
  select id, name
  into category_row
  from public.service_categories
  where id = new.category_id;

  if not found then
    raise exception 'Service category % does not exist', new.category_id;
  end if;

  new.category := category_row.name;
  new.duration_minutes := coalesce(new.default_duration_minutes, new.duration_minutes);
  new.default_duration_minutes := coalesce(new.default_duration_minutes, new.duration_minutes);

  if new.duration_minutes is null or new.duration_minutes < 10 or new.duration_minutes > 240 then
    raise exception 'Service duration must be between 10 and 240 minutes';
  end if;

  if new.section_id is not null then
    select id, category_id
    into section_row
    from public.service_sections
    where id = new.section_id;

    if not found then
      raise exception 'Service section % does not exist', new.section_id;
    end if;

    if section_row.category_id <> new.category_id then
      raise exception 'Service section % does not belong to category %', new.section_id, new.category_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists set_service_categories_updated_at on public.service_categories;
create trigger set_service_categories_updated_at
before update on public.service_categories
for each row
execute function public.set_service_catalog_updated_at();

drop trigger if exists set_service_sections_updated_at on public.service_sections;
create trigger set_service_sections_updated_at
before update on public.service_sections
for each row
execute function public.set_service_catalog_updated_at();

drop trigger if exists set_service_price_lists_updated_at on public.service_price_lists;
create trigger set_service_price_lists_updated_at
before update on public.service_price_lists
for each row
execute function public.set_service_catalog_updated_at();

drop trigger if exists set_service_prices_updated_at on public.service_prices;
create trigger set_service_prices_updated_at
before update on public.service_prices
for each row
execute function public.set_service_catalog_updated_at();

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at
before update on public.services
for each row
execute function public.set_service_catalog_updated_at();

drop trigger if exists sync_service_catalog_legacy_columns on public.services;
create trigger sync_service_catalog_legacy_columns
before insert or update on public.services
for each row
execute function public.sync_service_catalog_legacy_columns();

update public.services
set category_id = category_id;

alter table public.service_categories enable row level security;
alter table public.service_sections enable row level security;
alter table public.service_price_lists enable row level security;
alter table public.service_prices enable row level security;

drop policy if exists "services_manage_authenticated" on public.services;
create policy "services_manage_authenticated"
on public.services
for all
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "service_categories_select_authenticated" on public.service_categories;
create policy "service_categories_select_authenticated"
on public.service_categories
for select
using (auth.uid() is not null);

drop policy if exists "service_categories_manage_authenticated" on public.service_categories;
create policy "service_categories_manage_authenticated"
on public.service_categories
for all
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "service_sections_select_authenticated" on public.service_sections;
create policy "service_sections_select_authenticated"
on public.service_sections
for select
using (auth.uid() is not null);

drop policy if exists "service_sections_manage_authenticated" on public.service_sections;
create policy "service_sections_manage_authenticated"
on public.service_sections
for all
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "service_price_lists_select_authenticated" on public.service_price_lists;
create policy "service_price_lists_select_authenticated"
on public.service_price_lists
for select
using (auth.uid() is not null);

drop policy if exists "service_price_lists_manage_authenticated" on public.service_price_lists;
create policy "service_price_lists_manage_authenticated"
on public.service_price_lists
for all
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "service_prices_select_authenticated" on public.service_prices;
create policy "service_prices_select_authenticated"
on public.service_prices
for select
using (auth.uid() is not null);

drop policy if exists "service_prices_manage_authenticated" on public.service_prices;
create policy "service_prices_manage_authenticated"
on public.service_prices
for all
using (auth.uid() is not null)
with check (auth.uid() is not null);

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
    coalesce(default_duration_minutes, duration_minutes) as duration_minutes
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

comment on table public.service_categories is 'Top-level service catalog categories used to organize clinic offerings.';
comment on table public.service_sections is 'Optional category-scoped sections for finer grouping within the service catalog.';
comment on table public.service_price_lists is 'Named price books with effective windows for service pricing over time.';
comment on table public.service_prices is 'Per-service prices within a specific price list.';
