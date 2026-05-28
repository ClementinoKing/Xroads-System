-- Lookup tables for staff roles and clinic branches.
-- Profiles link to these records through stable string IDs.

create extension if not exists pgcrypto;

create table if not exists public.roles (
  id text primary key,
  name text not null unique,
  description text null,
  access_level text not null default 'Operational access',
  is_system_role boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.branches (
  id text primary key,
  name text not null unique,
  address text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  hours text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_lookup_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_roles_updated_at on public.roles;
create trigger set_roles_updated_at
before update on public.roles
for each row
execute function public.set_lookup_updated_at();

drop trigger if exists set_branches_updated_at on public.branches;
create trigger set_branches_updated_at
before update on public.branches
for each row
execute function public.set_lookup_updated_at();

insert into public.roles (id, name, description, access_level, is_system_role)
values
  ('super_admin', 'Super Admin', 'Owns the platform, configuration, and clinic-wide oversight.', 'Full access', true),
  ('branch_admin', 'Branch Admin', 'Manages branch operations, appointments, and local staff activity.', 'Full access', true),
  ('receptionist', 'Receptionist', 'Handles front-desk scheduling and patient coordination.', 'Operational access', true),
  ('dentist', 'Dentist', 'Accesses clinical schedules, appointments, and patient context.', 'Operational access', true),
  ('finance', 'Finance', 'Works with payments, balances, and finance reports.', 'Limited access', true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  access_level = excluded.access_level,
  is_system_role = excluded.is_system_role,
  updated_at = timezone('utc', now());

insert into public.branches (id, name, address, status, hours)
values
  ('xroads-dental', 'Xroads Dental', 'Lilongwe, Malawi', 'open', 'Monday to Friday, 8AM - 6PM'),
  ('gateway-dental', 'Gateway Dental', 'Gateway Mall, Lilongwe', 'open', 'Monday to Friday, 8AM - 6PM')
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  status = excluded.status,
  hours = excluded.hours,
  updated_at = timezone('utc', now());

alter table public.profiles
  add column if not exists role_id text;

update public.profiles
set role_id = lower(role::text)
where role_id is null;

update public.profiles
set branch_id = null
where branch_id = 'All branches';

update public.profiles
set branch_id = lower(branch_id)
where branch_id is not null
  and branch_id <> lower(branch_id);

alter table public.profiles
  alter column role_id set default 'receptionist';

update public.profiles
set role_id = 'receptionist'
where role_id is null;

alter table public.profiles
  alter column role_id set not null;

do $$
begin
  alter table public.profiles
    add constraint profiles_role_id_fkey
    foreign key (role_id) references public.roles (id) on delete restrict;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_branch_id_fkey
    foreign key (branch_id) references public.branches (id) on delete set null;
exception
  when duplicate_object then null;
end $$;

create index if not exists profiles_role_id_idx
  on public.profiles (role_id);

create index if not exists profiles_branch_id_link_idx
  on public.profiles (branch_id);

drop policy if exists "roles_select_authenticated" on public.roles;
create policy "roles_select_authenticated"
on public.roles
for select
using (auth.uid() is not null);

drop policy if exists "roles_manage_admin" on public.roles;
create policy "roles_manage_admin"
on public.roles
for all
using (public.is_profile_admin())
with check (public.is_profile_admin());

drop policy if exists "branches_select_authenticated" on public.branches;
create policy "branches_select_authenticated"
on public.branches
for select
using (auth.uid() is not null);

drop policy if exists "branches_manage_admin" on public.branches;
create policy "branches_manage_admin"
on public.branches
for all
using (public.is_profile_admin())
with check (public.is_profile_admin());

alter table public.roles enable row level security;
alter table public.branches enable row level security;

create or replace function public.is_profile_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles profiles
    where profiles.id = auth.uid()
      and profiles.deleted_at is null
      and coalesce(profiles.role_id, lower(profiles.role::text)) in ('super_admin', 'branch_admin')
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  raw_role text;
  mapped_role text;
begin
  raw_role := lower(coalesce(new.raw_user_meta_data ->> 'role', ''));

  mapped_role := case raw_role
    when 'super_admin' then 'super_admin'
    when 'branch_admin' then 'branch_admin'
    when 'receptionist' then 'receptionist'
    when 'dentist' then 'dentist'
    when 'finance' then 'finance'
    else 'receptionist'
  end;

  insert into public.profiles (
    id,
    full_name,
    email,
    role,
    role_id,
    status,
    branch_id,
    phone,
    avatar_url,
    metadata
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.email,
    mapped_role::public.user_role,
    mapped_role,
    case
      when coalesce(new.raw_user_meta_data ->> 'status', '') = 'invited' then 'invited'::public.profile_status
      else 'active'::public.profile_status
    end,
    nullif(new.raw_user_meta_data ->> 'branch_id', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    role_id = excluded.role_id,
    branch_id = excluded.branch_id,
    phone = excluded.phone,
    avatar_url = excluded.avatar_url,
    metadata = public.profiles.metadata || excluded.metadata,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (
  deleted_at is null
  and (auth.uid() = id or public.is_profile_admin())
);

drop policy if exists "profiles_insert_own_or_admin" on public.profiles;
create policy "profiles_insert_own_or_admin"
on public.profiles
for insert
with check (
  deleted_at is null
  and (auth.uid() = id or public.is_profile_admin())
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (
  deleted_at is null
  and (auth.uid() = id or public.is_profile_admin())
)
with check (
  deleted_at is null
  and (auth.uid() = id or public.is_profile_admin())
);

comment on table public.roles is 'Canonical role lookup table for profile permissions.';
comment on table public.branches is 'Clinic branch lookup table linked from profiles.';
