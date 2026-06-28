create extension if not exists pgcrypto;

create or replace function public.generate_dental_chart_code()
returns text
language sql
stable
as $$
  select 'DCH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

create or replace function public.set_dental_chart_session_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_dental_chart_tooth_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_dental_chart_surface_note_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_profile_role_marker()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(roles.appointment_marker, 'Staff')
  from public.profiles profiles
  left join public.roles roles on roles.id = profiles.role_id
  where profiles.id = auth.uid()
    and profiles.deleted_at is null
$$;

do $$
begin
  alter table public.appointments
    add constraint appointments_appointment_code_unique unique (appointment_code);
exception
  when duplicate_object then null;
end $$;

create or replace function public.can_view_dental_chart(target_branch_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select auth.uid() is not null and public.can_access_branch(target_branch_id);
$$;

create or replace function public.can_manage_dental_chart(target_branch_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select auth.uid() is not null
    and public.can_access_branch(target_branch_id)
    and public.current_profile_role_marker() = 'Dentist';
$$;

create table if not exists public.dental_chart_sessions (
  id uuid primary key default gen_random_uuid(),
  chart_code text not null default public.generate_dental_chart_code(),
  patient_id uuid not null references public.patients (id) on delete restrict,
  patient_code text not null references public.patients (patient_code) on delete restrict,
  branch_id text not null references public.branches (id) on delete restrict,
  appointment_code text null references public.appointments (appointment_code) on delete set null,
  dentition_type text not null default 'permanent' check (dentition_type in ('permanent', 'primary', 'mixed')),
  recorded_by uuid not null references public.profiles (id) on delete restrict,
  recorder_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.dental_chart_teeth (
  id uuid primary key default gen_random_uuid(),
  chart_session_id uuid not null references public.dental_chart_sessions (id) on delete cascade,
  tooth_code text not null,
  condition text not null default 'Healthy',
  planned_treatment text not null default '',
  completed_treatment text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.dental_chart_surface_notes (
  id uuid primary key default gen_random_uuid(),
  chart_tooth_id uuid not null references public.dental_chart_teeth (id) on delete cascade,
  surface_code text not null,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists dental_chart_sessions_chart_code_idx
  on public.dental_chart_sessions (chart_code);

create unique index if not exists dental_chart_sessions_appointment_code_idx
  on public.dental_chart_sessions (appointment_code)
  where appointment_code is not null;

create index if not exists dental_chart_sessions_patient_idx
  on public.dental_chart_sessions (patient_id);

create index if not exists dental_chart_sessions_branch_idx
  on public.dental_chart_sessions (branch_id);

create index if not exists dental_chart_sessions_created_at_idx
  on public.dental_chart_sessions (created_at desc);

create unique index if not exists dental_chart_teeth_session_tooth_idx
  on public.dental_chart_teeth (chart_session_id, tooth_code);

create index if not exists dental_chart_teeth_session_idx
  on public.dental_chart_teeth (chart_session_id);

create index if not exists dental_chart_surface_notes_tooth_idx
  on public.dental_chart_surface_notes (chart_tooth_id);

create unique index if not exists dental_chart_surface_notes_unique_idx
  on public.dental_chart_surface_notes (chart_tooth_id, surface_code);

drop trigger if exists set_dental_chart_sessions_updated_at on public.dental_chart_sessions;
create trigger set_dental_chart_sessions_updated_at
before update on public.dental_chart_sessions
for each row
execute function public.set_dental_chart_session_updated_at();

drop trigger if exists set_dental_chart_teeth_updated_at on public.dental_chart_teeth;
create trigger set_dental_chart_teeth_updated_at
before update on public.dental_chart_teeth
for each row
execute function public.set_dental_chart_tooth_updated_at();

drop trigger if exists set_dental_chart_surface_notes_updated_at on public.dental_chart_surface_notes;
create trigger set_dental_chart_surface_notes_updated_at
before update on public.dental_chart_surface_notes
for each row
execute function public.set_dental_chart_surface_note_updated_at();

alter table public.dental_chart_sessions enable row level security;
alter table public.dental_chart_teeth enable row level security;
alter table public.dental_chart_surface_notes enable row level security;

drop policy if exists "dental_chart_sessions_select_branch_scoped" on public.dental_chart_sessions;
create policy "dental_chart_sessions_select_branch_scoped"
on public.dental_chart_sessions
for select
using (public.can_view_dental_chart(branch_id));

drop policy if exists "dental_chart_sessions_manage_clinical" on public.dental_chart_sessions;
create policy "dental_chart_sessions_manage_clinical"
on public.dental_chart_sessions
for all
using (public.can_manage_dental_chart(branch_id))
with check (public.can_manage_dental_chart(branch_id));

drop policy if exists "dental_chart_teeth_select_branch_scoped" on public.dental_chart_teeth;
create policy "dental_chart_teeth_select_branch_scoped"
on public.dental_chart_teeth
for select
using (
  exists (
    select 1
    from public.dental_chart_sessions sessions
    where sessions.id = dental_chart_teeth.chart_session_id
      and public.can_view_dental_chart(sessions.branch_id)
  )
);

drop policy if exists "dental_chart_teeth_manage_clinical" on public.dental_chart_teeth;
create policy "dental_chart_teeth_manage_clinical"
on public.dental_chart_teeth
for all
using (
  exists (
    select 1
    from public.dental_chart_sessions sessions
    where sessions.id = dental_chart_teeth.chart_session_id
      and public.can_manage_dental_chart(sessions.branch_id)
  )
)
with check (
  exists (
    select 1
    from public.dental_chart_sessions sessions
    where sessions.id = dental_chart_teeth.chart_session_id
      and public.can_manage_dental_chart(sessions.branch_id)
  )
);

drop policy if exists "dental_chart_surface_notes_select_branch_scoped" on public.dental_chart_surface_notes;
create policy "dental_chart_surface_notes_select_branch_scoped"
on public.dental_chart_surface_notes
for select
using (
  exists (
    select 1
    from public.dental_chart_teeth teeth
    join public.dental_chart_sessions sessions on sessions.id = teeth.chart_session_id
    where teeth.id = dental_chart_surface_notes.chart_tooth_id
      and public.can_view_dental_chart(sessions.branch_id)
  )
);

drop policy if exists "dental_chart_surface_notes_manage_clinical" on public.dental_chart_surface_notes;
create policy "dental_chart_surface_notes_manage_clinical"
on public.dental_chart_surface_notes
for all
using (
  exists (
    select 1
    from public.dental_chart_teeth teeth
    join public.dental_chart_sessions sessions on sessions.id = teeth.chart_session_id
    where teeth.id = dental_chart_surface_notes.chart_tooth_id
      and public.can_manage_dental_chart(sessions.branch_id)
  )
)
with check (
  exists (
    select 1
    from public.dental_chart_teeth teeth
    join public.dental_chart_sessions sessions on sessions.id = teeth.chart_session_id
    where teeth.id = dental_chart_surface_notes.chart_tooth_id
      and public.can_manage_dental_chart(sessions.branch_id)
  )
);

create or replace function public.save_dental_chart_session(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_session_id uuid;
  v_patient_id uuid;
  v_patient_code text;
  v_branch_id text;
  v_appointment_code text;
  v_dentition_type text;
  v_current_user_id uuid;
  v_current_name text;
  v_teeth jsonb;
begin
  v_current_user_id := auth.uid();

  if v_current_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_patient_id := nullif(payload->>'patient_id', '')::uuid;
  v_patient_code := nullif(payload->>'patient_code', '');
  v_branch_id := nullif(payload->>'branch_id', '');
  v_appointment_code := nullif(payload->>'appointment_code', '');
  v_dentition_type := coalesce(nullif(payload->>'dentition_type', ''), 'permanent');
  v_teeth := coalesce(payload->'teeth', '[]'::jsonb);

  if v_patient_id is null then
    raise exception 'Patient is required';
  end if;

  if v_patient_code is null then
    raise exception 'Patient code is required';
  end if;

  if v_branch_id is null then
    raise exception 'Branch is required';
  end if;

  if public.can_manage_dental_chart(v_branch_id) is not true then
    raise exception 'You do not have permission to edit dental charts for branch %', v_branch_id;
  end if;

  select profiles.full_name
  into v_current_name
  from public.profiles profiles
  where profiles.id = v_current_user_id
    and profiles.deleted_at is null;

  if not found then
    raise exception 'Recorder profile not found';
  end if;

  if nullif(payload->>'session_id', '') is not null then
    v_session_id := (payload->>'session_id')::uuid;
  elsif v_appointment_code is not null then
    select sessions.id
    into v_session_id
    from public.dental_chart_sessions sessions
    where sessions.appointment_code = v_appointment_code
    limit 1;
  end if;

  if v_session_id is null then
    insert into public.dental_chart_sessions (
      patient_id,
      patient_code,
      branch_id,
      appointment_code,
      dentition_type,
      recorded_by,
      recorder_name
    )
    values (
      v_patient_id,
      v_patient_code,
      v_branch_id,
      v_appointment_code,
      v_dentition_type,
      v_current_user_id,
      v_current_name
    )
    returning id into v_session_id;
  else
    update public.dental_chart_sessions
    set patient_id = v_patient_id,
        patient_code = v_patient_code,
        branch_id = v_branch_id,
        appointment_code = v_appointment_code,
        dentition_type = v_dentition_type,
        recorder_name = v_current_name,
        updated_at = timezone('utc', now())
    where id = v_session_id;
  end if;

  delete from public.dental_chart_surface_notes
  where chart_tooth_id in (
    select teeth.id
    from public.dental_chart_teeth teeth
    where teeth.chart_session_id = v_session_id
  );

  delete from public.dental_chart_teeth
  where chart_session_id = v_session_id;

  insert into public.dental_chart_teeth (
    chart_session_id,
    tooth_code,
    condition,
    planned_treatment,
    completed_treatment
  )
  select
    v_session_id,
    tooth_data.tooth_code,
    coalesce(nullif(tooth_data.condition, ''), 'Healthy'),
    coalesce(tooth_data.planned_treatment, ''),
    coalesce(tooth_data.completed_treatment, '')
  from jsonb_to_recordset(v_teeth) as tooth_data(
    tooth_code text,
    condition text,
    planned_treatment text,
    completed_treatment text,
    surface_notes jsonb
  );

  insert into public.dental_chart_surface_notes (
    chart_tooth_id,
    surface_code,
    note
  )
  select
    teeth.id,
    surface_data.surface_code,
    coalesce(surface_data.note, '')
  from jsonb_to_recordset(v_teeth) as tooth_data(
    tooth_code text,
    condition text,
    planned_treatment text,
    completed_treatment text,
    surface_notes jsonb
  )
  join public.dental_chart_teeth teeth
    on teeth.chart_session_id = v_session_id
   and teeth.tooth_code = tooth_data.tooth_code
  cross join lateral jsonb_to_recordset(coalesce(tooth_data.surface_notes, '[]'::jsonb)) as surface_data(
    surface_code text,
    note text
  )
  where coalesce(surface_data.note, '') <> '';

  return v_session_id;
end;
$$;

comment on table public.dental_chart_sessions is 'Patient dental chart sessions and appointment-linked snapshots.';
comment on table public.dental_chart_teeth is 'Tooth-level chart data for each dental chart session.';
comment on table public.dental_chart_surface_notes is 'Surface-level clinical notes for each charted tooth.';
comment on function public.save_dental_chart_session(jsonb) is 'Atomically saves a dental chart session with tooth and surface note rows.';
