import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import type { AppointmentStatus } from "../../data/appointments";

const statusClasses: Record<AppointmentStatus, string> = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Confirmed: "bg-sky-50 text-sky-700 ring-sky-200",
  Arrived: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "In Consultation": "bg-violet-50 text-violet-700 ring-violet-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  "No-show": "bg-slate-100 text-slate-700 ring-slate-200",
  Rescheduled: "bg-cyan-50 text-cyan-700 ring-cyan-200",
};

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge className={statusClasses[status]}>{status}</Badge>;
}
