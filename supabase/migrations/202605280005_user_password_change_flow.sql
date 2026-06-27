-- Enforce a first-login password change for newly created staff accounts.

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

comment on column public.profiles.must_change_password is 'When true, the user must change their temporary password before accessing the app.';

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  raw_role text;
  mapped_role text;
  must_change_password boolean;
begin
  raw_role := lower(coalesce(new.raw_user_meta_data ->> 'role', ''));
  must_change_password := lower(coalesce(new.raw_user_meta_data ->> 'must_change_password', 'false')) = 'true';

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
    must_change_password,
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
    must_change_password,
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
    must_change_password = excluded.must_change_password,
    metadata = public.profiles.metadata || excluded.metadata,
    updated_at = timezone('utc', now());

  return new;
end;
$$;
