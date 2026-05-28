import { supabase } from "../../lib/supabase";

export type ProfileRecord = {
  id: string;
  full_name: string;
  email: string;
  role_id: string;
  status: "active" | "invited" | "suspended";
  branch_id: string | null;
  phone: string | null;
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RoleRecord = {
  id: string;
  name: string;
  description: string | null;
  access_level: string;
  is_system_role: boolean;
};

export type BranchRecord = {
  id: string;
  name: string;
  address: string;
  status: "open" | "closed";
  hours: string | null;
};

export type ProfileFormValues = {
  fullName: string;
  phone: string;
  avatarUrl: string;
  roleId: string;
  branchId: string;
};

export async function loadProfile(userId: string) {
  const [profileResult, rolesResult, branchesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role_id, status, branch_id, phone, avatar_url, last_login_at, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("roles").select("id, name, description, access_level, is_system_role").order("name", { ascending: true }),
    supabase.from("branches").select("id, name, address, status, hours").order("name", { ascending: true }),
  ]);

  if (profileResult.error) {
    return { profile: null, roles: [], branches: [], error: profileResult.error.message };
  }

  if (rolesResult.error) {
    return { profile: profileResult.data as ProfileRecord | null, roles: [], branches: [], error: rolesResult.error.message };
  }

  if (branchesResult.error) {
    return { profile: profileResult.data as ProfileRecord | null, roles: rolesResult.data ?? [], branches: [], error: branchesResult.error.message };
  }

  return {
    profile: (profileResult.data as ProfileRecord | null) ?? null,
    roles: (rolesResult.data as RoleRecord[]) ?? [],
    branches: (branchesResult.data as BranchRecord[]) ?? [],
    error: null,
  };
}

export async function saveProfile(userId: string, values: ProfileFormValues) {
  const [profileResult, authResult] = await Promise.all([
    supabase
      .from("profiles")
      .update({
        full_name: values.fullName,
        phone: values.phone || null,
        avatar_url: values.avatarUrl || null,
        role_id: values.roleId,
        branch_id: values.branchId || null,
      })
      .eq("id", userId)
      .select("id, full_name, email, role_id, status, branch_id, phone, avatar_url, last_login_at, created_at, updated_at")
      .maybeSingle(),
    supabase.auth.updateUser({
      data: {
        full_name: values.fullName,
        name: values.fullName,
        phone: values.phone || "",
        avatar_url: values.avatarUrl || "",
        role_id: values.roleId,
        branch_id: values.branchId || "",
      },
    }),
  ]);

  if (profileResult.error) {
    return { profile: null, error: profileResult.error.message };
  }

  if (authResult.error) {
    return { profile: null, error: authResult.error.message };
  }

  return {
    profile: profileResult.data as ProfileRecord | null,
    error: null,
  };
}

