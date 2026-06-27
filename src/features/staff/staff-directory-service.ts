import { supabase } from "../../lib/supabase";
import { isNetworkErrorMessage, toConnectivityError } from "../../lib/network-errors";
import type { RoleAppointmentMarker } from "./role-types";

export type StaffUserStatus = "active" | "invited" | "suspended";

export type StaffUser = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  initials: string;
  roleId: string;
  roleName: string;
  roleAppointmentMarker: RoleAppointmentMarker | null;
  roleDescription: string | null;
  accessLevel: string;
  isSystemRole: boolean;
  status: StaffUserStatus;
  branchId: string | null;
  branchName: string | null;
  department: string | null;
  createdAt: string;
};

export type StaffRole = {
  id: string;
  name: string;
  description: string | null;
  accessLevel: string;
  appointmentMarker: RoleAppointmentMarker;
  isSystemRole: boolean;
  assignedUserCount: number;
  createdAt: string;
};

type ProfileStatus = StaffUserStatus;

type ProfileRoleRelation =
  | {
      id: string;
      name: string;
      description: string | null;
      access_level: string;
      appointment_marker: RoleAppointmentMarker;
      is_system_role: boolean;
    }
  | Array<{
      id: string;
      name: string;
      description: string | null;
      access_level: string;
      appointment_marker: RoleAppointmentMarker;
      is_system_role: boolean;
    }>
  | null;

type ProfileBranchRelation =
  | {
      id: string;
      name: string;
    }
  | Array<{
      id: string;
      name: string;
    }>
  | null;

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  status: ProfileStatus;
  branch_id: string | null;
  role_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  role: ProfileRoleRelation;
  branch: ProfileBranchRelation;
};

type RoleRow = {
  id: string;
  name: string;
  description: string | null;
  access_level: string;
  appointment_marker: RoleAppointmentMarker;
  is_system_role: boolean;
  created_at: string;
};

type RoleAssignmentRow = {
  role_id: string;
};

function normalizeRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function readStringMetadata(metadata: Record<string, unknown> | null, keys: string[]) {
  if (!metadata) {
    return null;
  }

  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function toInitials(fullName: string, fallbackEmail: string) {
  const source = fullName.trim().length > 0 ? fullName : fallbackEmail.split("@")[0] ?? fallbackEmail;
  const parts = source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "U";
  }

  return parts
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapProfileRow(row: ProfileRow): StaffUser {
  const role = normalizeRelation(row.role);
  const branch = normalizeRelation(row.branch);
  const department =
    readStringMetadata(row.metadata, ["department", "department_name", "team", "organization", "organization_name", "org_name"]) ??
    null;

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    initials: toInitials(row.full_name, row.email),
    roleId: row.role_id,
    roleName: role?.name ?? toTitleCase(row.role_id),
    roleAppointmentMarker: role?.appointment_marker ?? null,
    roleDescription: role?.description ?? null,
    accessLevel: role?.access_level ?? "Operational access",
    isSystemRole: role?.is_system_role ?? false,
    status: row.status,
    branchId: row.branch_id,
    branchName: branch?.name ?? null,
    department,
    createdAt: row.created_at,
  };
}

function mapRoleRow(row: RoleRow, assignedUserCount: number): StaffRole {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    accessLevel: row.access_level,
    appointmentMarker: row.appointment_marker,
    isSystemRole: row.is_system_role,
    assignedUserCount,
    createdAt: row.created_at,
  };
}

function toFriendlyError(message: string, subject: string) {
  if (isNetworkErrorMessage(message)) {
    return toConnectivityError(`load ${subject}`);
  }

  if (/permission denied|row-level security|not authorized/i.test(message)) {
    return `You do not have permission to view ${subject}.`;
  }

  if (/relation .* does not exist/i.test(message) || /could not find the table/i.test(message)) {
    return `The staff directory data model is incomplete. Check the Supabase schema for the required tables.`;
  }

  return `We could not load ${subject} right now. ${message}`;
}

export async function loadUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, avatar_url, status, branch_id, role_id, metadata, created_at, role:roles(id, name, description, access_level, appointment_marker, is_system_role), branch:branches(id, name)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [] as StaffUser[], error: toFriendlyError(error.message, "users") };
  }

  return {
    data: ((data as ProfileRow[] | null) ?? []).map(mapProfileRow),
    error: null as string | null,
  };
}

export async function loadUserById(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, avatar_url, status, branch_id, role_id, metadata, created_at, role:roles(id, name, description, access_level, appointment_marker, is_system_role), branch:branches(id, name)",
    )
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return { data: null as StaffUser | null, error: toFriendlyError(error.message, "this user") };
  }

  return {
    data: data ? mapProfileRow(data as ProfileRow) : null,
    error: null as string | null,
  };
}

export async function loadRoles() {
  const [rolesResult, assignmentsResult] = await Promise.all([
    supabase.from("roles").select("id, name, description, access_level, appointment_marker, is_system_role, created_at").order("name", { ascending: true }),
    supabase.from("profiles").select("role_id").is("deleted_at", null),
  ]);

  if (rolesResult.error) {
    return { data: [] as StaffRole[], error: toFriendlyError(rolesResult.error.message, "roles") };
  }

  if (assignmentsResult.error) {
    return { data: [] as StaffRole[], error: toFriendlyError(assignmentsResult.error.message, "role assignments") };
  }

  const roleCounts = ((assignmentsResult.data as RoleAssignmentRow[] | null) ?? []).reduce<Record<string, number>>((counts, row) => {
    counts[row.role_id] = (counts[row.role_id] ?? 0) + 1;
    return counts;
  }, {});

  return {
    data: ((rolesResult.data as RoleRow[] | null) ?? []).map((row) => mapRoleRow(row, roleCounts[row.id] ?? 0)),
    error: null as string | null,
  };
}
