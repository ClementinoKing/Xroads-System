import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, CreditCard, Mail, MapPin, Phone, UserRound, X } from "lucide-react";
import type { Patient } from "../../data/patients";
import { branches } from "../../data/branches";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

export function PatientDetailModal({ patient, open, onClose }: { patient: Patient | null; open: boolean; onClose: () => void }) {
  if (!open || !patient) return null;
  if (typeof document === "undefined") return null;

  const branch = branches.find((item) => item.id === patient.branchId);
  const paymentLabel = patient.schemeName ?? patient.paymentMethod;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto flex h-full w-full max-w-4xl items-center" onClick={(event) => event.stopPropagation()}>
        <div className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-xroads-500 text-lg font-bold text-white">
                {patient.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Patient detail</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-50">{patient.name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200 dark:bg-zinc-900 dark:text-xroads-200 dark:ring-zinc-700">
                    {patient.patientCode ?? patient.id}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-700">{paymentLabel}</Badge>
                </div>
              </div>
            </div>
            <Button type="button" variant="outline" className="h-11 w-11 shrink-0 rounded-xl p-0" onClick={onClose} aria-label="Close patient detail modal">
              <X size={28} strokeWidth={2.2} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="p-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserRound size={18} className="text-xroads-600" />
                    Contact profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <DetailItem icon={Phone} label="Phone" value={patient.phone} />
                  <DetailItem icon={Mail} label="Email" value={patient.email ?? "Not provided"} />
                  <DetailItem icon={MapPin} label="Branch" value={branch?.name ?? "Unknown branch"} />
                  <DetailItem icon={CreditCard} label="Payment" value={paymentLabel} />
                </CardContent>
              </Card>

              <Card className="p-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-xroads-600" />
                    Appointment history
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Metric label="Last visit" value={patient.lastVisit} />
                  <Metric label="Next appointment" value={patient.nextAppointment} />
                  <Metric label="Payment method" value={patient.paymentMethod} />
                  <Metric label="Medical scheme" value={patient.schemeName ?? "None"} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
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
