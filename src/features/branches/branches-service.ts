import { supabase } from "../../lib/supabase";
import { isNetworkErrorMessage, toConnectivityError } from "../../lib/network-errors";

export type BranchDirectoryItem = {
  id: string;
  name: string;
  address: string;
  status: "open" | "closed";
  hours: string | null;
  createdAt: string;
  staffCount: number;
  activeStaffCount: number;
  dentistCount: number;
  branchAdminCount: number;
  receptionistCount: number;
};

type BranchRow = {
  id: string;
  name: string;
  address: string;
  status: "open" | "closed";
  hours: string | null;
  created_at: string;
};

type ProfileBranchCountRow = {
  branch_id: string | null;
  status: "active" | "invited" | "suspended";
  role:
    | {
        id: string;
        appointment_marker: "Dentist" | "Staff";
      }
    | Array<{
        id: string;
        appointment_marker: "Dentist" | "Staff";
      }>
    | null;
};

function normalizeRelation<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function toFriendlyError(message: string) {
  if (isNetworkErrorMessage(message)) {
    return toConnectivityError("load branches");
  }

  if (/permission denied|row-level security|not authorized/i.test(message)) {
    return "You do not have permission to view branch data.";
  }

  if (/relation .* does not exist/i.test(message) || /could not find the table/i.test(message)) {
    return "The branch data model is incomplete. Check that the branches and profiles tables exist in Supabase.";
  }

  return `We could not load branches right now. ${message}`;
}

export async function loadBranches() {
  const [branchesResult, profilesResult] = await Promise.all([
    supabase.from("branches").select("id, name, address, status, hours, created_at").order("name", { ascending: true }),
    supabase.from("profiles").select("branch_id, status, role:roles(id, appointment_marker)").is("deleted_at", null),
  ]);

  if (branchesResult.error) {
    return { data: [] as BranchDirectoryItem[], error: toFriendlyError(branchesResult.error.message) };
  }

  if (profilesResult.error) {
    return { data: [] as BranchDirectoryItem[], error: toFriendlyError(profilesResult.error.message) };
  }

  const branchCounts = new Map<
    string,
    { staffCount: number; activeStaffCount: number; dentistCount: number; branchAdminCount: number; receptionistCount: number }
  >();

  for (const profile of (profilesResult.data as ProfileBranchCountRow[] | null) ?? []) {
    if (!profile.branch_id) {
      continue;
    }

    const counts =
      branchCounts.get(profile.branch_id) ??
      { staffCount: 0, activeStaffCount: 0, dentistCount: 0, branchAdminCount: 0, receptionistCount: 0 };

    counts.staffCount += 1;
    if (profile.status === "active") {
      counts.activeStaffCount += 1;
    }

    const role = normalizeRelation(profile.role);

    if (role?.appointment_marker === "Dentist" || role?.id === "dentist") {
      counts.dentistCount += 1;
    } else if (role?.id === "branch_admin") {
      counts.branchAdminCount += 1;
    } else if (role?.id === "receptionist") {
      counts.receptionistCount += 1;
    }

    branchCounts.set(profile.branch_id, counts);
  }

  return {
    data: ((branchesResult.data as BranchRow[] | null) ?? []).map((branch) => {
      const counts = branchCounts.get(branch.id) ?? {
        staffCount: 0,
        activeStaffCount: 0,
        dentistCount: 0,
        branchAdminCount: 0,
        receptionistCount: 0,
      };

      return {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        status: branch.status,
        hours: branch.hours,
        createdAt: branch.created_at,
        ...counts,
      };
    }),
    error: null as string | null,
  };
}
