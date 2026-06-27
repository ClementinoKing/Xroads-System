-- Verified medical schemes and plan names used by the patient directory.
-- This keeps billing choices normalized while preserving a readable scheme_name fallback.

create extension if not exists pgcrypto;

create table if not exists public.medical_schemes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider_name text not null,
  scheme_type text not null check (scheme_type in ('provider', 'plan')),
  description text null,
  source_url text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists medical_schemes_provider_name_unique
  on public.medical_schemes (provider_name, name)
  where deleted_at is null;

create index if not exists medical_schemes_provider_idx
  on public.medical_schemes (provider_name)
  where deleted_at is null;

create index if not exists medical_schemes_name_idx
  on public.medical_schemes (name)
  where deleted_at is null;

create index if not exists medical_schemes_active_idx
  on public.medical_schemes (is_active)
  where deleted_at is null;

create index if not exists medical_schemes_deleted_at_idx
  on public.medical_schemes (deleted_at);

create or replace function public.set_medical_schemes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_medical_schemes_updated_at on public.medical_schemes;
create trigger set_medical_schemes_updated_at
before update on public.medical_schemes
for each row
execute function public.set_medical_schemes_updated_at();

alter table public.medical_schemes enable row level security;

drop policy if exists "medical_schemes_select_authenticated" on public.medical_schemes;
create policy "medical_schemes_select_authenticated"
on public.medical_schemes
for select
using (auth.uid() is not null and deleted_at is null);

drop policy if exists "medical_schemes_manage_authenticated" on public.medical_schemes;
create policy "medical_schemes_manage_authenticated"
on public.medical_schemes
for all
using (auth.uid() is not null and deleted_at is null)
with check (auth.uid() is not null and deleted_at is null);

insert into public.medical_schemes (
  name,
  provider_name,
  scheme_type,
  description,
  source_url,
  sort_order,
  metadata
)
values
  ('MASM', 'MASM', 'provider', 'Medical Aid Society of Malawi provider entry.', 'https://masm.mw/schemes/', 0, '{"source":"official site","category":"provider"}'::jsonb),
  ('VIP Premier', 'MASM', 'plan', 'Top-tier MASM scheme.', 'https://masm.mw/schemes/', 1, '{"source":"official site","category":"plan"}'::jsonb),
  ('VIP', 'MASM', 'plan', 'MASM VIP scheme.', 'https://masm.mw/schemes/', 2, '{"source":"official site","category":"plan"}'::jsonb),
  ('Executive', 'MASM', 'plan', 'MASM Executive scheme.', 'https://masm.mw/schemes/', 3, '{"source":"official site","category":"plan"}'::jsonb),
  ('Econoplan', 'MASM', 'plan', 'MASM Econoplan scheme.', 'https://masm.mw/schemes/', 4, '{"source":"official site","category":"plan"}'::jsonb),
  ('EconoSpecial', 'MASM', 'plan', 'MASM EconoSpecial scheme.', 'https://masm.mw/schemes/', 5, '{"source":"official site","category":"plan"}'::jsonb),
  ('Snr Citizen VIP', 'MASM', 'plan', 'MASM senior citizen VIP scheme.', 'https://masm.mw/schemes/', 6, '{"source":"official site","category":"plan"}'::jsonb),
  ('Snr Citizen EXE', 'MASM', 'plan', 'MASM senior citizen executive scheme.', 'https://masm.mw/schemes/', 7, '{"source":"official site","category":"plan"}'::jsonb),
  ('Snr Citizen ECONO', 'MASM', 'plan', 'MASM senior citizen econo scheme.', 'https://masm.mw/schemes/', 8, '{"source":"official site","category":"plan"}'::jsonb),

  ('WEMAS', 'WEMAS', 'provider', 'Wella Medical Aid Society provider entry.', 'https://wemasmw.com/', 0, '{"source":"official site","category":"provider"}'::jsonb),
  ('Corporate Medical Scheme', 'WEMAS', 'plan', 'WEMAS corporate medical scheme.', 'https://wemasmw.com/', 1, '{"source":"official site","category":"plan"}'::jsonb),
  ('Family Medical Scheme', 'WEMAS', 'plan', 'WEMAS family medical scheme.', 'https://wemasmw.com/', 2, '{"source":"official site","category":"plan"}'::jsonb),
  ('Pensioners Medical Scheme', 'WEMAS', 'plan', 'WEMAS pensioners medical scheme.', 'https://wemasmw.com/', 3, '{"source":"official site","category":"plan"}'::jsonb),

  ('UHCI', 'UHCI', 'provider', 'Umoyo Health Care Insurance provider entry.', 'https://uhci.mw/products', 0, '{"source":"official site","category":"provider"}'::jsonb),
  ('Blue Cover', 'UHCI', 'plan', 'UHCI Blue Cover plan.', 'https://uhci.mw/products', 1, '{"source":"official site","category":"plan"}'::jsonb),
  ('Blue Plus Cover', 'UHCI', 'plan', 'UHCI Blue Plus Cover plan.', 'https://uhci.mw/products', 2, '{"source":"official site","category":"plan"}'::jsonb),
  ('Bronze Cover', 'UHCI', 'plan', 'UHCI Bronze Cover plan.', 'https://uhci.mw/products', 3, '{"source":"official site","category":"plan"}'::jsonb),
  ('Silver Cover', 'UHCI', 'plan', 'UHCI Silver Cover plan.', 'https://uhci.mw/products', 4, '{"source":"official site","category":"plan"}'::jsonb),
  ('Gold Cover', 'UHCI', 'plan', 'UHCI Gold Cover plan.', 'https://uhci.mw/products', 5, '{"source":"official site","category":"plan"}'::jsonb),
  ('Platinum Cover', 'UHCI', 'plan', 'UHCI Platinum Cover plan.', 'https://uhci.mw/products', 6, '{"source":"official site","category":"plan"}'::jsonb),

  ('Central Health', 'Central Health', 'provider', 'Central Health Medical Aid provider entry.', 'https://www.centralhealthmw.org/', 0, '{"source":"official site","category":"provider"}'::jsonb),
  ('Silver Plan', 'Central Health', 'plan', 'Central Health Silver Plan.', 'https://www.centralhealthmw.org/', 1, '{"source":"official site","category":"plan"}'::jsonb),
  ('Gold Plan', 'Central Health', 'plan', 'Central Health Gold Plan.', 'https://www.centralhealthmw.org/', 2, '{"source":"official site","category":"plan"}'::jsonb),
  ('Diamond Plan', 'Central Health', 'plan', 'Central Health Diamond Plan.', 'https://www.centralhealthmw.org/', 3, '{"source":"official site","category":"plan"}'::jsonb),
  ('Diamond Plus', 'Central Health', 'plan', 'Central Health Diamond Plus.', 'https://www.centralhealthmw.org/', 4, '{"source":"official site","category":"plan"}'::jsonb),
  ('Emerald Plus', 'Central Health', 'plan', 'Central Health Emerald Plus.', 'https://www.centralhealthmw.org/', 5, '{"source":"official site","category":"plan"}'::jsonb),
  ('Cismed Plan', 'Central Health', 'plan', 'Central Health Cismed plan.', 'https://www.centralhealthmw.org/', 6, '{"source":"official site","category":"plan"}'::jsonb),

  ('UNIMED', 'UNIMED', 'provider', 'University of Malawi Medical Scheme provider entry.', 'https://unimed.unima.ac.mw/schemes/', 0, '{"source":"official site","category":"provider"}'::jsonb),
  ('Comprehensive Cover', 'UNIMED', 'plan', 'UNIMED Comprehensive Cover.', 'https://unimed.unima.ac.mw/schemes/', 1, '{"source":"official site","category":"plan"}'::jsonb),
  ('Comprehensive Ex Cover', 'UNIMED', 'plan', 'UNIMED Comprehensive Ex Cover.', 'https://unimed.unima.ac.mw/schemes/', 2, '{"source":"official site","category":"plan"}'::jsonb),
  ('Zikomo Cover', 'UNIMED', 'plan', 'UNIMED Zikomo Cover.', 'https://unimed.unima.ac.mw/schemes/', 3, '{"source":"official site","category":"plan"}'::jsonb),
  ('Standard Cover', 'UNIMED', 'plan', 'UNIMED Standard Cover.', 'https://unimed.unima.ac.mw/schemes/', 4, '{"source":"official site","category":"plan"}'::jsonb),
  ('Standard-Ex Cover', 'UNIMED', 'plan', 'UNIMED Standard-Ex Cover.', 'https://unimed.unima.ac.mw/schemes/', 5, '{"source":"official site","category":"plan"}'::jsonb),
  ('Abale Cover', 'UNIMED', 'plan', 'UNIMED Abale Cover.', 'https://unimed.unima.ac.mw/schemes/', 6, '{"source":"official site","category":"plan"}'::jsonb),
  ('Student Cover', 'UNIMED', 'plan', 'UNIMED Student Cover.', 'https://unimed.unima.ac.mw/schemes/', 7, '{"source":"official site","category":"plan"}'::jsonb),

  ('MedHealth', 'MedHealth', 'provider', 'MedHealth Malawi provider entry.', 'https://www.medhealth.mw/', 0, '{"source":"official site","category":"provider"}'::jsonb),
  ('MediPlus Option', 'MedHealth', 'plan', 'MedHealth MediPlus Option.', 'https://www.medhealth.mw/', 1, '{"source":"official site","category":"plan"}'::jsonb),
  ('PremiumCare Option', 'MedHealth', 'plan', 'MedHealth PremiumCare Option.', 'https://www.medhealth.mw/', 2, '{"source":"official site","category":"plan"}'::jsonb),
  ('MediSave Option', 'MedHealth', 'plan', 'MedHealth MediSave Option.', 'https://www.medhealth.mw/', 3, '{"source":"official site","category":"plan"}'::jsonb),
  ('MediCare Option', 'MedHealth', 'plan', 'MedHealth MediCare Option.', 'https://www.medhealth.mw/', 4, '{"source":"official site","category":"plan"}'::jsonb),
  ('Care Option', 'MedHealth', 'plan', 'MedHealth Care Option.', 'https://www.medhealth.mw/', 5, '{"source":"official site","category":"plan"}'::jsonb),
  ('CarePlus Option', 'MedHealth', 'plan', 'MedHealth CarePlus Option.', 'https://www.medhealth.mw/', 6, '{"source":"official site","category":"plan"}'::jsonb)
on conflict (provider_name, name) where deleted_at is null do update set
  scheme_type = excluded.scheme_type,
  description = excluded.description,
  source_url = excluded.source_url,
  sort_order = excluded.sort_order,
  is_active = true,
  metadata = excluded.metadata,
  deleted_at = null,
  updated_at = timezone('utc', now());

alter table public.patients
  add column if not exists medical_scheme_id uuid null references public.medical_schemes (id) on delete set null;

create index if not exists patients_medical_scheme_idx
  on public.patients (medical_scheme_id)
  where deleted_at is null;

update public.patients p
set medical_scheme_id = ms.id
from public.medical_schemes ms
where p.deleted_at is null
  and p.medical_scheme_id is null
  and p.scheme_name = ms.name;

comment on table public.medical_schemes is 'Verified Malawi medical schemes and plan names for patient billing.';
