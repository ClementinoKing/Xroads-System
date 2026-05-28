import { createPortal } from "react-dom";
import { AlertTriangle, CalendarDays, Clock3, FileText, MapPin, ShieldCheck, UserRound, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Appointment } from "../../data/appointments";
import { branches } from "../../data/branches";
import { dentists } from "../../data/dentists";
import { Badge, StatusBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

export function BookingDetailModal({ booking, open, onClose }: { booking: Appointment | null; open: boolean; onClose: () => void }) {
  if (!open || !booking) return null;
  if (typeof document === "undefined") return null;

  const branch = branches.find((item) => item.id === booking.branchId);
  const dentist = dentists.find((item) => item.id === booking.dentistId);

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/35 p-4" onClick={onClose}>
      <div className="mx-auto flex h-full w-full max-w-4xl items-center" onClick={(event) => event.stopPropagation()}>
        <div className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Appointment detail</p>
                <StatusBadge status={booking.status} />
                {booking.emergency ? (
                  <Badge className="bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:ring-rose-900/60">
                    <AlertTriangle size={13} /> Emergency
                  </Badge>
                ) : null}
              </div>
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{booking.patientName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {booking.service} · {booking.id}
              </p>
            </div>
            <Button type="button" variant="outline" className="h-11 w-11 rounded-lg p-0" onClick={onClose} aria-label="Close appointment detail modal">
              <X size={28} strokeWidth={2.2} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="p-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-xroads-600" />
                    Appointment overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <DetailItem icon={Clock3} label="Date & time" value={`${format(parseISO(booking.date), "EEEE, MMMM d")} at ${booking.time}`} />
                  <DetailItem icon={MapPin} label="Branch" value={branch?.name ?? "Unknown branch"} />
                  <DetailItem icon={UserRound} label="Dentist" value={dentist?.name ?? "Unknown dentist"} />
                  <DetailItem icon={ShieldCheck} label="Payment" value={booking.paymentType === "Medical Scheme" ? `Medical Scheme - ${booking.schemeName ?? "Unknown"}` : "Cash"} />
                </CardContent>
              </Card>

              <Card className="p-0">
                <CardHeader>
                  <CardTitle>At a glance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Metric label="Patient" value={booking.patientName} />
                  <Metric label="Phone" value={booking.phone} />
                  <Metric label="Status" value={booking.status} />
                  <Metric label="Emergency" value={booking.emergency ? "Yes" : "No"} />
                </CardContent>
              </Card>
            </div>

            <Card className="mt-5 p-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={18} className="text-xroads-600" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{booking.notes || "No appointment notes were provided for this appointment."}</p>
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
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-800">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        <Icon size={15} className="text-xroads-600" />
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 dark:border-neutral-800">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-950 dark:text-slate-50">{value}</span>
    </div>
  );
}
