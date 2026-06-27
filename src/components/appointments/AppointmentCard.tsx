import { AlertTriangle, Clock, MapPin, UserRound } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import type { Appointment } from "../../data/appointments";
import { branches } from "../../data/branches";
import { Badge, StatusBadge } from "../ui/Badge";
import { cn } from "../../lib/utils";
import { getBranchBadgeClass } from "../../lib/branch-badges";

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const branch = branches.find((item) => item.id === appointment.branchId);
  const parsedDate = parseISO(appointment.date);
  const dateLabel = isValid(parsedDate) ? format(parsedDate, "MMM d") : "Unknown date";

  return (
    <article className={cn("rounded-lg border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950", appointment.emergency ? "border-rose-200 ring-4 ring-rose-50" : "border-slate-200")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-950 dark:text-slate-50">{appointment.patientName}</h3>
            {appointment.emergency ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                <AlertTriangle size={13} /> Emergency
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{appointment.service}</p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
        <span className="flex items-center gap-2"><Clock size={15} /> {dateLabel} at {appointment.time}</span>
        <span className="flex items-center gap-2">
          <MapPin size={15} />
          <Badge className={`${getBranchBadgeClass(branch?.name)} px-2 py-0.5 text-[11px] font-semibold`}>
            {branch?.name}
          </Badge>
        </span>
        <span className="flex items-center gap-2">
          <UserRound size={15} />
          <span className="min-w-0 truncate">
            {appointment.dentistName ?? "Assigned dentist"}
            {appointment.dentistRole ? <span className="text-slate-400"> · {appointment.dentistRole}</span> : null}
          </span>
        </span>
        <span>{appointment.paymentType}{appointment.schemeName ? ` - ${appointment.schemeName}` : ""}</span>
      </div>
    </article>
  );
}
