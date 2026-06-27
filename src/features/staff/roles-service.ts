import { supabase } from "../../lib/supabase";
import { isNetworkErrorMessage, toConnectivityError } from "../../lib/network-errors";
import type { StaffRole } from "./staff-directory-service";
import type { RoleAppointmentMarker } from "./role-types";

export type RoleAccessLevel = "Full access" | "Operational access" | "Limited access";

export type RoleFormValues = {
  name: string;
  description: string;
  accessLevel: RoleAccessLevel;
  appointmentMarker: RoleAppointmentMarker;
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

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toFriendlyError(message: string) {
  if (isNetworkErrorMessage(message)) {
    return toConnectivityError("save the role");
  }

  if (/permission denied|row-level security|not authorized/i.test(message)) {
    return "You do not have permission to manage roles.";
  }

  if (/duplicate key value|unique constraint|already exists/i.test(message)) {
    return "A role with that name already exists.";
  }

  return `We could not save the role right now. ${message}`;
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

async function loadAssignmentCount(roleId: string) {
  const { data, error } = await supabase.from("profiles").select("role_id").eq("role_id", roleId).is("deleted_at", null);

  if (error) {
    return { count: 0, error: toFriendlyError(error.message) };
  }

  return { count: (data as RoleAssignmentRow[] | null)?.length ?? 0, error: null as string | null };
}

export async function saveRole(values: RoleFormValues, existingRole?: StaffRole | null) {
  const payload = {
    name: values.name.trim(),
    description: values.description.trim() || null,
    access_level: values.accessLevel,
    appointment_marker: values.appointmentMarker,
  };

  if (!payload.name) {
    return { data: null as StaffRole | null, error: "Role name is required." };
  }

  const targetId = existingRole?.id ?? slugify(payload.name);

  if (!targetId) {
    return { data: null as StaffRole | null, error: "Role name must contain letters or numbers." };
  }

  if (existingRole) {
    const { data, error } = await supabase
      .from("roles")
      .update(payload)
      .eq("id", existingRole.id)
      .select("id, name, description, access_level, appointment_marker, is_system_role, created_at")
      .maybeSingle();

    if (error || !data) {
      return { data: null as StaffRole | null, error: toFriendlyError(error?.message ?? "The role could not be updated.") };
    }

    return {
      data: mapRoleRow(data as RoleRow, existingRole.assignedUserCount),
      error: null as string | null,
    };
  }

  const { data, error } = await supabase
    .from("roles")
    .insert({
      id: targetId,
      name: payload.name,
      description: payload.description,
      access_level: payload.access_level,
      appointment_marker: payload.appointment_marker,
      is_system_role: false,
    })
    .select("id, name, description, access_level, appointment_marker, is_system_role, created_at")
    .maybeSingle();

  if (error || !data) {
    return { data: null as StaffRole | null, error: toFriendlyError(error?.message ?? "The role could not be created.") };
  }

  const assignmentCount = await loadAssignmentCount(targetId);

  if (assignmentCount.error) {
    return { data: mapRoleRow(data as RoleRow, 0), error: null as string | null };
  }

  return {
    data: mapRoleRow(data as RoleRow, assignmentCount.count),
    error: null as string | null,
  };
}
