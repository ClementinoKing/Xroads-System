import { supabase } from "../../lib/supabase";
import { isNetworkErrorMessage, toConnectivityError } from "../../lib/network-errors";
import type { Dentist } from "../../data/dentists";
import type { RoleAppointmentMarker } from "../staff/role-types";

type DentistRow = {
  id: string;
  full_name: string;
  branch_id: string | null;
  status: "active" | "invited" | "suspended";
  role:
    | {
        id: string;
        name: string;
        appointment_marker: RoleAppointmentMarker;
      }
    | Array<{
        id: string;
        name: string;
        appointment_marker: RoleAppointmentMarker;
      }>
    | null;
};

function toFriendlyError(message: string) {
  if (isNetworkErrorMessage(message)) {
    return toConnectivityError("load dentist records");
  }

  if (/permission denied|row-level security|not authorized/i.test(message)) {
    return "You do not have permission to view dentist records.";
  }

  if (/relation .* does not exist/i.test(message) || /could not find the table/i.test(message)) {
    return "The dentist profiles are missing from Supabase. Apply the profile and appointments migrations first.";
  }

  return `We could not load dentist records right now. ${message}`;
}

function normalizeRelation<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function mapRow(row: DentistRow): Dentist {
  const role = normalizeRelation(row.role);

  return {
    id: row.id,
    name: row.full_name,
    role: role?.name ?? "Dentist",
    appointmentMarker: role?.appointment_marker ?? null,
    branchId: row.branch_id ?? "",
    availability: row.status === "active" ? "Available" : "Off duty",
    todayAppointments: 0,
    schedule: [],
  };
}

export async function loadDentists(branchId?: string | null) {
  let query = supabase
    .from("profiles")
    .select("id, full_name, branch_id, status, role:roles(id, name, appointment_marker)")
    .is("deleted_at", null)
    .not("branch_id", "is", null)
    .order("full_name", { ascending: true });

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [] as Dentist[], error: toFriendlyError(error.message) };
  }

  const dentists = ((data as DentistRow[] | null) ?? [])
    .filter((row) => {
      const role = normalizeRelation(row.role);
      return role?.appointment_marker === "Dentist" || role?.id === "dentist";
    })
    .map(mapRow);

  return {
    data: dentists,
    error: null as string | null,
  };
}
