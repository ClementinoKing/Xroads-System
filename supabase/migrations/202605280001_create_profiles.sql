-- User profiles for Xroads staff and authenticated users.
-- This schema is intentionally conservative so the frontend can grow into it
-- without rewriting the core account model later.

create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum (
    'super_admin',
    'branch_admin',
    'receptionist',
    'dentist',
    'finance'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.profile_status as enum (
    'active',
    'invited',
    'suspended'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.user_role not null default 'receptionist',
  status public.profile_status not null default 'active',
  branch_id text null,
  phone text null,
  avatar_url text null,
  last_login_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists profiles_email_unique
  on public.profiles (lower(email))
  where deleted_at is null;

create index if not exists profiles_role_idx
  on public.profiles (role)
  where deleted_at is null;

create index if not exists profiles_status_idx
  on public.profiles (status)
  where deleted_at is null;

create index if not exists profiles_branch_idx
  on public.profiles (branch_id)
  where deleted_at is null;

create index if not exists profiles_deleted_at_idx
  on public.profiles (deleted_at);

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profile_updated_at();

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
      and profiles.role in ('super_admin', 'branch_admin')
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
  mapped_role public.user_role;
begin
  raw_role := lower(coalesce(new.raw_user_meta_data ->> 'role', ''));

  mapped_role := case raw_role
    when 'super_admin' then 'super_admin'::public.user_role
    when 'branch_admin' then 'branch_admin'::public.user_role
    when 'receptionist' then 'receptionist'::public.user_role
    when 'dentist' then 'dentist'::public.user_role
    when 'finance' then 'finance'::public.user_role
    else 'receptionist'::public.user_role
  end;

  insert into public.profiles (
    id,
    full_name,
    email,
    role,
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
    branch_id = excluded.branch_id,
    phone = excluded.phone,
    avatar_url = excluded.avatar_url,
    metadata = public.profiles.metadata || excluded.metadata,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;

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

comment on table public.profiles is 'Authenticated user and staff profile records for Xroads.';
comment on column public.profiles.role is 'Canonical backend role slug used for permissions and app mapping.';
comment on column public.profiles.status is 'Account lifecycle state for invitations and access control.';
