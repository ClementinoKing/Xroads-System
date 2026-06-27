import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { branches, type Branch } from "../../data/branches";
import { useBranchAccess } from "./branch-access";

const BRANCH_SCOPE_STORAGE_KEY = "xroads.selected-branch-id";

type BranchScopeValue = {
  branchId: string | null;
  branchLabel: string;
  branch: Branch | null;
  branchOptions: Branch[];
  isBranchLocked: boolean;
  setBranchId: (branchId: string | null) => void;
};

const BranchScopeContext = createContext<BranchScopeValue | undefined>(undefined);

function readStoredBranchId() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedBranchId = window.localStorage.getItem(BRANCH_SCOPE_STORAGE_KEY);
  const normalizedBranchId = storedBranchId?.trim() || null;

  return normalizedBranchId && branches.some((branch) => branch.id === normalizedBranchId) ? normalizedBranchId : null;
}

function writeStoredBranchId(branchId: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (branchId) {
    window.localStorage.setItem(BRANCH_SCOPE_STORAGE_KEY, branchId);
    return;
  }

  window.localStorage.removeItem(BRANCH_SCOPE_STORAGE_KEY);
}

export function BranchScopeProvider({ children }: { children: ReactNode }) {
  const branchAccess = useBranchAccess();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(() => readStoredBranchId());

  useEffect(() => {
    if (branchAccess.isBranchLocked) {
      setSelectedBranchId(branchAccess.branchId);
      return;
    }

    setSelectedBranchId(readStoredBranchId());
  }, [branchAccess.branchId, branchAccess.isBranchLocked]);

  const branchId = branchAccess.isBranchLocked ? branchAccess.branchId : selectedBranchId;
  const branch = branchId ? branches.find((item) => item.id === branchId) ?? null : null;
  const branchLabel = branch?.name ?? (branchId ? branchId : "All branches");
  const branchOptions = branchAccess.isBranchLocked ? (branch ? [branch] : branches) : branches;

  const setBranchId = useCallback(
    (nextBranchId: string | null) => {
      if (branchAccess.isBranchLocked) {
        return;
      }

      const normalizedBranchId = nextBranchId?.trim() || null;
      const nextResolvedBranchId = normalizedBranchId && branches.some((branch) => branch.id === normalizedBranchId) ? normalizedBranchId : null;
      setSelectedBranchId(nextResolvedBranchId);
      writeStoredBranchId(nextResolvedBranchId);
    },
    [branchAccess.isBranchLocked],
  );

  const value = useMemo<BranchScopeValue>(
    () => ({
      branchId,
      branchLabel,
      branch,
      branchOptions,
      isBranchLocked: branchAccess.isBranchLocked,
      setBranchId,
    }),
    [branch, branchAccess.isBranchLocked, branchId, branchLabel, branchOptions, setBranchId],
  );

  return <BranchScopeContext.Provider value={value}>{children}</BranchScopeContext.Provider>;
}

export function useBranchScope() {
  const context = useContext(BranchScopeContext);

  if (!context) {
    throw new Error("useBranchScope must be used within a BranchScopeProvider.");
  }

  return context;
}
