import { supabase } from "../../lib/supabase";
import { isNetworkErrorMessage, toConnectivityError } from "../../lib/network-errors";
import type { BranchId } from "../../data/branches";
import type { UserAccount } from "../../data/users";

export type CreateStaffAccountInput = {
  name: string;
  email: string;
  roleId: string;
  branchId: BranchId | "All branches";
  status: UserAccount["status"];
};

type CreateStaffAccountResponse = {
  userId: string;
  email: string | null;
  profileId: string;
  temporaryPassword?: string;
};

type UpdateStaffAccountResponse = {
  userId: string;
  email: string | null;
  profileId: string;
};

type DeleteStaffAccountResponse = {
  userId: string;
};

function toFriendlyError(message: string) {
  if (isNetworkErrorMessage(message)) {
    return toConnectivityError("complete this staff update");
  }

  if (/permission denied|row-level security|not authorized/i.test(message)) {
    return "You do not have permission to perform this action.";
  }

  if (/already registered|duplicate key value|unique constraint/i.test(message)) {
    return "A user with that email address already exists.";
  }

  return `We could not complete this staff update right now. ${message}`;
}

export async function createStaffAccount(input: CreateStaffAccountInput) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    return { data: null as CreateStaffAccountResponse | null, error: "You must be signed in to create staff accounts." };
  }

  const { data, error } = await supabase.functions.invoke<CreateStaffAccountResponse>("create-staff-user", {
    body: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      roleId: input.roleId,
      branchId: input.branchId === "All branches" ? null : input.branchId,
      status: input.status.toLowerCase(),
    },
  });

  if (error) {
    return { data: null as CreateStaffAccountResponse | null, error: toFriendlyError(error.message) };
  }

  return {
    data: data ?? null,
    error: null as string | null,
  };
}

export type UpdateStaffAccountInput = {
  userId: string;
  name: string;
  email: string;
  roleId: string;
  branchId: BranchId | "All branches";
  status: UserAccount["status"];
};

export async function updateStaffAccount(input: UpdateStaffAccountInput) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    return { data: null as UpdateStaffAccountResponse | null, error: "You must be signed in to update staff accounts." };
  }

  const { data, error } = await supabase.functions.invoke<UpdateStaffAccountResponse>("update-staff-user", {
    body: {
      userId: input.userId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      roleId: input.roleId,
      branchId: input.branchId === "All branches" ? null : input.branchId,
      status: input.status,
    },
  });

  if (error) {
    return { data: null as UpdateStaffAccountResponse | null, error: toFriendlyError(error.message) };
  }

  return {
    data: data ?? null,
    error: null as string | null,
  };
}

export async function deleteStaffAccount(userId: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    return { data: null as DeleteStaffAccountResponse | null, error: "You must be signed in to delete staff accounts." };
  }

  const { data, error } = await supabase.functions.invoke<DeleteStaffAccountResponse>("delete-staff-user", {
    body: { userId },
  });

  if (error) {
    return { data: null as DeleteStaffAccountResponse | null, error: toFriendlyError(error.message) };
  }

  return {
    data: data ?? null,
    error: null as string | null,
  };
}
