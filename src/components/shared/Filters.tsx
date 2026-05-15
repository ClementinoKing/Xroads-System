import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function FilterField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 dark:text-slate-500">{label}</span>
      {children}
    </label>
  );
}
