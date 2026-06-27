-- Allow authenticated users to read dentist profiles for appointment scheduling.
-- Existing profiles RLS only permits self/admin access, which blocks receptionist slot loading.

drop policy if exists "profiles_select_dentist_branch_scoped" on public.profiles;
create policy "profiles_select_dentist_branch_scoped"
on public.profiles
for select
using (
  auth.uid() is not null
  and deleted_at is null
  and role_id = 'dentist'
  and public.can_access_branch(branch_id)
);
