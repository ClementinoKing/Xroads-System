import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { AlertTriangle, CalendarDays, Clock3, FileText, MapPin, ShieldCheck, UserRound, X } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import type { Appointment } from "../../data/appointments";
import { branches } from "../../data/branches";
import { Badge, StatusBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { cn } from "../../lib/utils";
import { getBranchBadgeClass } from "../../lib/branch-badges";
import { formatDurationLabel, formatTimeRange, getAppointmentDurationMinutes } from "./scheduler-utils";

export function BookingDetailModal({
  booking,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  booking: Appointment | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointment: Appointment) => void;
}) {
  if (!open || !booking) return null;
  if (typeof document === "undefined") return null;

  const branch = branches.find((item) => item.id === booking.branchId);
  const durationMinutes = getAppointmentDurationMinutes(booking);
  const parsedDate = parseISO(booking.date);
  const dateLabel = isValid(parsedDate) ? format(parsedDate, "EEEE, MMMM d") : "Unknown date";

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/50 p-3 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div className="mx-auto flex h-full w-full max-w-4xl items-center" onClick={(event) => event.stopPropagation()}>
        <div className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-neutral-800 sm:px-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Appointment detail</p>
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
            <div className="flex items-center gap-2">
              {onEdit ? (
                <Button type="button" variant="outline" className="h-10 px-3 text-sm" onClick={() => onEdit(booking)}>
                  Edit
                </Button>
              ) : null}
              {onDelete ? (
                <Button type="button" variant="outline" className="h-10 px-3 text-sm text-rose-700 hover:border-rose-200 hover:bg-rose-50 dark:text-rose-200 dark:hover:border-rose-900/40 dark:hover:bg-rose-950/20" onClick={() => onDelete(booking)}>
                  Delete
                </Button>
              ) : null}
              <Button type="button" variant="outline" className="h-10 w-10 rounded-xl p-0" onClick={onClose} aria-label="Close appointment detail modal">
                <X size={18} strokeWidth={2.2} />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <Card className="p-0">
                <CardHeader className="px-4 py-3 sm:px-5">
                  <CardTitle className="flex items-center gap-2 text-[1.05rem]">
                    <CalendarDays size={17} className="text-xroads-600" />
                    Appointment overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                  <DetailItem
                    className="sm:col-span-2"
                    icon={Clock3}
                    label="Date & time"
                    value={`${dateLabel} · ${formatTimeRange(booking.time, durationMinutes)}`}
                  />
                  <DetailItem icon={Clock3} label="Duration" value={formatDurationLabel(durationMinutes)} />
                  <DetailItem
                    icon={MapPin}
                    label="Branch"
                    value={
                      <Badge className={`${getBranchBadgeClass(branch?.name)} px-2 py-0.5 text-[11px] font-semibold`}>
                        {branch?.name ?? "Unknown branch"}
                      </Badge>
                    }
                  />
                  <DetailItem icon={UserRound} label="Dentist" value={booking.dentistName ?? "Unknown dentist"} />
                  {booking.dentistRole ? <DetailItem icon={ShieldCheck} label="Role" value={booking.dentistRole} /> : null}
                  <DetailItem icon={ShieldCheck} label="Payment" value={booking.paymentType === "Medical Scheme" ? `Medical Scheme - ${booking.schemeName ?? "Unknown"}` : "Cash"} />
                </CardContent>
              </Card>

              <Card className="p-0">
                <CardHeader className="px-4 py-3 sm:px-5">
                  <CardTitle className="text-[1.05rem]">At a glance</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-1">
                  <Metric label="Patient" value={booking.patientName} />
                  <Metric label="Phone" value={booking.phone} />
                  <Metric label="Status" value={booking.status} />
                  <Metric label="Emergency" value={booking.emergency ? "Yes" : "No"} />
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4 p-0">
              <CardHeader className="px-4 py-3 sm:px-5">
                <CardTitle className="flex items-center gap-2 text-[1.05rem]">
                  <FileText size={17} className="text-xroads-600" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
                <p className="text-sm leading-5 text-slate-600 dark:text-slate-300">
                  {booking.notes || "No appointment notes were provided for this appointment."}
                </p>
              </CardContent>
            </Card>
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
  className,
}: {
  icon: typeof Clock3;
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-neutral-800 dark:bg-neutral-800", className)}>
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
