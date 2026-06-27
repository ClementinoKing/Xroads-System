import { useMemo } from "react";
import { branches, type Branch } from "../../data/branches";
import { useAuth } from "./auth-context";

export type BranchAccess = {
  branchId: string | null;
  branchLabel: string | null;
  branch: Branch | null;
  branchOptions: Branch[];
  isBranchLocked: boolean;
};

export function useBranchAccess() {
  const { profile } = useAuth();

  return useMemo(() => getBranchAccess(profile?.branch_id ?? null), [profile?.branch_id]);
}

export function getBranchAccess(branchId: string | null) {
  const normalizedBranchId = branchId?.trim() || null;
  const branch = normalizedBranchId ? branches.find((item) => item.id === normalizedBranchId) ?? null : null;

  return {
    branchId: normalizedBranchId,
    branchLabel: branch?.name ?? normalizedBranchId,
    branch,
    branchOptions: branch ? [branch] : branches,
    isBranchLocked: Boolean(normalizedBranchId),
  } satisfies BranchAccess;
}
