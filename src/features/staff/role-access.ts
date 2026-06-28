import { supabase } from "../../lib/supabase";
import { isNetworkErrorMessage, toConnectivityError } from "../../lib/network-errors";
import type { RoleAppointmentMarker } from "./role-types";

type RoleMarkerRow = {
  appointment_marker: RoleAppointmentMarker;
};

function toFriendlyError(message: string) {
  if (isNetworkErrorMessage(message)) {
    return toConnectivityError("load role access");
  }

  if (/permission denied|row-level security|not authorized/i.test(message)) {
    return "You do not have permission to view role access settings.";
  }

  return `We could not determine role access right now. ${message}`;
}

export async function loadRoleAppointmentMarker(roleId: string | null) {
  if (!roleId) {
    return { data: null as RoleAppointmentMarker | null, error: null as string | null };
  }

  const { data, error } = await supabase.from("roles").select("appointment_marker").eq("id", roleId).maybeSingle();

  if (error) {
    return { data: null as RoleAppointmentMarker | null, error: toFriendlyError(error.message) };
  }

  return {
    data: (data as RoleMarkerRow | null)?.appointment_marker ?? null,
    error: null as string | null,
  };
}

