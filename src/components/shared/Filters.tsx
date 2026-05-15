import type { ReactNode } from "react";

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 dark:text-slate-500">{label}</span>
      {children}
    </label>
  );
}
