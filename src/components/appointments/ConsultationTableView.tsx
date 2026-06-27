import { useMemo } from "react";
import { format, isValid, parseISO } from "date-fns";
import { CheckCircle2, ClipboardList, Clock3, LoaderCircle, Stethoscope, UserRound } from "lucide-react";
import type { Appointment, AppointmentStatus } from "../../data/appointments";
import { branches } from "../../data/branches";
import { Badge, StatusBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { EmptyState } from "../shared/EmptyState";
import { cn } from "../../lib/utils";
import { formatTimeRange, getAppointmentDurationMinutes } from "./scheduler-utils";
import { getBranchBadgeClass } from "../../lib/branch-badges";

type ConsultationStatus = Extract<AppointmentStatus, "Arrived" | "In Consultation">;

type ConsultationAction = {
  label: string;
  nextStatus: AppointmentStatus;
  helper: string;
  className: string;
};

const actionByStatus: Record<ConsultationStatus, ConsultationAction> = {
  Arrived: {
    label: "Start consultation",
    nextStatus: "In Consultation",
    helper: "Move into the chair",
    className: "bg-sky-500 text-white hover:bg-sky-600 border-sky-500 hover:border-sky-600",
  },
  "In Consultation": {
    label: "Complete",
    nextStatus: "Completed",
    helper: "Close the visit",
    className: "bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500 hover:border-emerald-600",
  },
};

export function ConsultationTableView({
  appointments,
  onAppointmentClick,
  onAdvanceStatus,
  updatingAppointmentId,
}: {
  appointments: Appointment[];
  onAppointmentClick: (appointmentId: string) => void;
  onAdvanceStatus: (appointment: Appointment, nextStatus: AppointmentStatus) => void;
  updatingAppointmentId: string | null;
}) {
  const consultationAppointments = useMemo(
    () => appointments.filter((appointment): appointment is Appointment & { status: ConsultationStatus } => appointment.status in actionByStatus),
    [appointments],
  );

  const counts = consultationAppointments.reduce(
    (accumulator, appointment) => {
      accumulator[appointment.status] += 1;
      return accumulator;
    },
    {
      Arrived: 0,
      "In Consultation": 0,
    },
  );

  if (consultationAppointments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <EmptyState
          title="No patients in consultation"
          description="Patients move here after check-in. Use the consultation screen to document the treatment plan and complete the visit."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-slate-100 px-4 py-4 dark:border-zinc-800 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-xroads-600" />
              <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Consultation board</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Open each patient, document the treatment plan, and complete the visit when finished.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <SummaryPill label="Arrived" value={counts.Arrived} tone="sky" />
            <SummaryPill label="In consultation" value={counts["In Consultation"]} tone="emerald" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
          <thead className="bg-slate-50 dark:bg-zinc-900">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Dentist</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Treatment plan</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {consultationAppointments.map((appointment) => {
              const action = actionByStatus[appointment.status];
              const branch = branches.find((item) => item.id === appointment.branchId);
              const parsedDate = parseISO(appointment.date);
              const dateLabel = isValid(parsedDate) ? format(parsedDate, "MMM d") : "Unknown date";
              const isUpdating = updatingAppointmentId === appointment.id;

              return (
                <tr
                  key={appointment.id}
                  className="cursor-pointer bg-white transition hover:bg-xroads-50/40 dark:bg-zinc-950 dark:hover:bg-zinc-900/60"
                  onClick={() => onAppointmentClick(appointment.id)}
                >
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-950 dark:text-slate-50">
                    <div className="flex items-center gap-2">
                      <Clock3 size={15} className="text-slate-400" />
                      <span>
                        {dateLabel} · {formatTimeRange(appointment.time, getAppointmentDurationMinutes(appointment))}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <div className="font-semibold text-slate-950 dark:text-slate-50">{appointment.patientName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{appointment.phone}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex flex-wrap items-center gap-2">
                      <UserRound size={15} className="shrink-0 text-slate-400" />
                      <span className="min-w-0 truncate">{appointment.dentistName ?? "Assigned dentist"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <Badge className={`${getBranchBadgeClass(branch?.name)} px-2 py-0.5 text-[11px] font-semibold`}>
                      {branch?.name ?? "Branch"}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={appointment.status} />
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                    <button type="button" className="max-w-[24rem] truncate text-left" onClick={(event) => {
                      event.stopPropagation();
                      onAppointmentClick(appointment.id);
                    }} title={appointment.notes || "No treatment plan recorded yet"}>
                      {appointment.notes || "No treatment plan recorded yet"}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <Button
                      type="button"
                      className={cn("h-9 px-3 text-xs font-semibold", action.className)}
                      disabled={isUpdating}
                      onClick={(event) => {
                        event.stopPropagation();
                        onAdvanceStatus(appointment, action.nextStatus);
                      }}
                    >
                      {isUpdating ? <LoaderCircle size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      {action.label}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "sky" | "emerald";
}) {
  const toneClass =
    tone === "sky"
      ? "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-900/50"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-100 dark:ring-emerald-900/50";

  return <Badge className={`${toneClass} px-3 py-1 text-[11px] font-semibold`}>{label} {value}</Badge>;
}

