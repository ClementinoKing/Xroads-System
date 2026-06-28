import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CalendarDays, ClipboardList, Clock3, MapPin, Stethoscope, UserRound, X } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import type { Appointment } from "../../data/appointments";
import { branches } from "../../data/branches";
import { Badge, StatusBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { cn } from "../../lib/utils";
import { getBranchBadgeClass } from "../../lib/branch-badges";
import { formatDurationLabel, formatTimeRange, getAppointmentDurationMinutes } from "./scheduler-utils";

export type ConsultationAction = "save" | "start" | "complete";

export function ConsultationWorkspaceModal({
  booking,
  open,
  onClose,
  onAction,
  activeAction,
  onOpenDentalChart,
  onStartConsultation,
}: {
  booking: Appointment | null;
  open: boolean;
  onClose: () => void;
  onAction: (action: ConsultationAction, appointment: Appointment, treatmentNotes: string) => void;
  activeAction: ConsultationAction | null;
  onOpenDentalChart?: (appointment: Appointment) => void;
  onStartConsultation?: (appointment: Appointment, treatmentNotes: string) => void;
}) {
  const [notesDraft, setNotesDraft] = useState("");

  useEffect(() => {
    if (!booking) {
      setNotesDraft("");
      return;
    }

    setNotesDraft(booking.notes ?? "");
  }, [booking]);

  if (!open || !booking) return null;
  if (typeof document === "undefined") return null;

  const branch = branches.find((item) => item.id === booking.branchId);
  const durationMinutes = getAppointmentDurationMinutes(booking);
  const parsedDate = parseISO(booking.date);
  const dateLabel = isValid(parsedDate) ? format(parsedDate, "EEEE, MMMM d") : "Unknown date";
  const treatmentNotes = notesDraft.trim();
  const isArrived = booking.status === "Arrived";
  const isInConsultation = booking.status === "In Consultation";
  const isBusy = activeAction !== null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/50 p-3 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div className="mx-auto flex h-full w-full max-w-5xl items-center" onClick={(event) => event.stopPropagation()}>
        <div className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-neutral-800 sm:px-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Consultation workspace</p>
                <StatusBadge status={booking.status} />
                {booking.emergency ? (
                  <Badge className="bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:ring-rose-900/60">
                    <AlertTriangle size={12} /> Emergency
                  </Badge>
                ) : null}
              </div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50 sm:text-[1.75rem]">
                {booking.patientName}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {booking.service} · {booking.id}
              </p>
            </div>
            <Button type="button" variant="outline" className="h-10 w-10 rounded-xl p-0" onClick={onClose} aria-label="Close consultation workspace">
              <X size={18} strokeWidth={2.2} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <Card className="p-0">
                <CardHeader className="px-4 py-3 sm:px-5">
                  <CardTitle className="flex items-center gap-2 text-[1.05rem]">
                    <Stethoscope size={17} className="text-xroads-600" />
                    Consultation notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailItem
                      icon={CalendarDays}
                      label="Date"
                      value={dateLabel}
                    />
                    <DetailItem
                      icon={Clock3}
                      label="Time"
                      value={`${formatTimeRange(booking.time, durationMinutes)} · ${formatDurationLabel(durationMinutes)}`}
                    />
                    <DetailItem
                      icon={MapPin}
                      label="Branch"
                      value={
                        <Badge className={cn(`${getBranchBadgeClass(branch?.name)} px-2 py-0.5 text-[11px] font-semibold`)}>
                          {branch?.name ?? "Unknown branch"}
                        </Badge>
                      }
                    />
                    <DetailItem
                      icon={UserRound}
                      label="Dentist"
                      value={booking.dentistName ?? "Assigned dentist"}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      Treatment plan and notes
                    </label>
                    <textarea
                      className="input min-h-56 py-3"
                      value={notesDraft}
                      onChange={(event) => setNotesDraft(event.target.value)}
                      placeholder="Document the findings, explain the treatment the patient needs to undergo, and capture any follow-up instructions."
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      These notes will be saved on the appointment record and visible to the care team.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-0">
                <CardHeader className="px-4 py-3 sm:px-5">
                  <CardTitle className="text-[1.05rem]">At a glance</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 p-4 sm:p-5">
                  <Metric label="Patient" value={booking.patientName} />
                  <Metric label="Phone" value={booking.phone} />
                  <Metric label="Service" value={booking.service} />
                  <Metric label="Payment" value={booking.paymentType === "Medical Scheme" ? `Medical Scheme - ${booking.schemeName ?? "Unknown"}` : "Cash"} />
                  <Metric label="Emergency" value={booking.emergency ? "Yes" : "No"} />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArrived ? "Start the consultation when the patient is ready." : isInConsultation ? "Finish the clinical notes before completing the visit." : "This consultation has already been completed."}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {onOpenDentalChart ? (
                <Button type="button" variant="outline" onClick={() => onOpenDentalChart(booking)} disabled={isBusy}>
                  <ClipboardList size={16} />
                  Open chart
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => onAction("save", booking, treatmentNotes)}
                disabled={isBusy}
              >
                Save notes
              </Button>
              {isArrived ? (
                <Button
                  type="button"
                  className="bg-sky-500 text-white shadow-sm hover:bg-sky-600"
                  onClick={() => {
                    if (onStartConsultation) {
                      onStartConsultation(booking, treatmentNotes);
                      return;
                    }

                    onAction("start", booking, treatmentNotes);
                  }}
                  disabled={isBusy}
                >
                  Start consultation
                </Button>
              ) : null}
              {isInConsultation ? (
                <Button
                  type="button"
                  className="bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                  onClick={() => onAction("complete", booking, treatmentNotes)}
                  disabled={isBusy}
                >
                  Complete consultation
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-neutral-800 dark:bg-neutral-800">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        <Icon size={14} className="text-xroads-600" />
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-slate-50">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-800">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-950 dark:text-slate-50">{value}</span>
    </div>
  );
}
