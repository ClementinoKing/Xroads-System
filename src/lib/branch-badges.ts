export function getBranchBadgeClass(branch: string | null | undefined) {
  const normalized = branch?.toLowerCase() ?? "";

  if (normalized.includes("xroads")) {
    return "whitespace-nowrap bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-100 dark:ring-emerald-900/50";
  }

  if (normalized.includes("gateway")) {
    return "whitespace-nowrap bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-100 dark:ring-orange-900/50";
  }

  return "whitespace-nowrap bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-700";
}
