import { useMemo, useState, type FormEvent } from "react";
import { CalendarPlus, X } from "lucide-react";
import { branches } from "../../data/branches";
import { dentists } from "../../data/dentists";
import { services } from "../../data/services";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { useToast } from "../shared/ToastProvider";

const timeSlots = ["08:00", "08:30", "09:00", "10:00", "11:00", "12:00", "14:00", "15:30", "16:30", "17:00"];

type BookingForm = {
  patientName: string;
  phone: string;
  email: string;
  branchId: string;
  serviceId: string;
  dentistId: string;
  date: string;
  time: string;
  paymentType: "Cash" | "Medical Scheme";
  schemeName: string;
  notes: string;
};

const initialForm: BookingForm = {
  patientName: "",
  phone: "",
  email: "",
  branchId: "xroads-dental",
  serviceId: "consultation",
  dentistId: "osman-wisk",
  date: new Date().toISOString().slice(0, 10),
  time: "08:30",
  paymentType: "Cash",
  schemeName: "",
  notes: "",
};

export function NewBookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<BookingForm>(initialForm);
  const { showToast } = useToast();

  const branchDentists = useMemo(() => dentists.filter((dentist) => dentist.branchId === form.branchId), [form.branchId]);
  const selectedService = services.find((service) => service.id === form.serviceId);
  const selectedBranch = branches.find((branch) => branch.id === form.branchId);
  const selectedDentist = dentists.find((dentist) => dentist.id === form.dentistId);

  if (!open) return null;

  function update<K extends keyof BookingForm>(key: K, value: BookingForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    showToast({
      title: "Mock booking created",
      description: `${form.patientName || "Patient"} is scheduled for ${selectedService?.name} at ${form.time}.`,
    });
    setForm(initialForm);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-xroads-50 p-2 text-xroads-700">
              <CalendarPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">New appointment booking</h2>
              <p className="text-sm text-slate-500">Frontend-only booking form using mock clinic data.</p>
            </div>
          </div>
          <Button type="button" variant="ghost" className="h-9 w-9 p-0" onClick={onClose} aria-label="Close booking modal">
            <X size={18} />
          </Button>
        </div>
        <form onSubmit={submitBooking} className="grid max-h-[calc(92vh-73px)] gap-0 overflow-y-auto lg:grid-cols-[1fr_340px]">
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Patient name">
              <input className="input" required value={form.patientName} onChange={(event) => update("patientName", event.target.value)} placeholder="Enter full name" />
            </Field>
            <Field label="Phone number">
              <input className="input" required value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+265 ..." />
            </Field>
            <Field label="Email optional">
              <input className="input" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="patient@email.com" />
            </Field>
            <Field label="Branch">
              <select
                className="input"
                value={form.branchId}
                onChange={(event) => {
                  const nextBranch = event.target.value;
                  const firstDentist = dentists.find((dentist) => dentist.branchId === nextBranch)?.id ?? form.dentistId;
                  setForm((current) => ({ ...current, branchId: nextBranch, dentistId: firstDentist }));
                }}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Service">
              <select className="input" value={form.serviceId} onChange={(event) => update("serviceId", event.target.value)}>
                {services.filter((service) => service.active).map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Dentist">
              <select className="input" value={form.dentistId} onChange={(event) => update("dentistId", event.target.value)}>
                {branchDentists.map((dentist) => (
                  <option key={dentist.id} value={dentist.id}>
                    {dentist.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input className="input" type="date" value={form.date} onChange={(event) => update("date", event.target.value)} required />
            </Field>
            <Field label="Time slot">
              <select className="input" value={form.time} onChange={(event) => update("time", event.target.value)}>
                {timeSlots.map((slot) => (
                  <option key={slot}>{slot}</option>
                ))}
              </select>
            </Field>
            <Field label="Payment type">
              <select className="input" value={form.paymentType} onChange={(event) => update("paymentType", event.target.value as BookingForm["paymentType"])}>
                <option>Cash</option>
                <option>Medical Scheme</option>
              </select>
            </Field>
            <Field label="Medical scheme name">
              <input
                className="input"
                disabled={form.paymentType === "Cash"}
                value={form.schemeName}
                onChange={(event) => update("schemeName", event.target.value)}
                placeholder="MASM, AON, Liberty Health"
              />
            </Field>
            <label className="grid gap-1.5 sm:col-span-2">
              <span className="label">Appointment notes</span>
              <textarea className="input min-h-28 py-3" value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Symptoms, preferences, referral notes" />
            </label>
          </div>
          <aside className="border-t border-slate-100 bg-slate-50 p-5 lg:border-l lg:border-t-0">
            <Card className="sticky top-5 p-5">
              <p className="text-sm font-semibold text-slate-950">Booking summary</p>
              <div className="mt-4 space-y-3 text-sm">
                <Summary label="Patient" value={form.patientName || "Not entered"} />
                <Summary label="Branch" value={selectedBranch?.name ?? "Not selected"} />
                <Summary label="Service" value={selectedService ? `${selectedService.name} (${selectedService.duration} min)` : "Not selected"} />
                <Summary label="Dentist" value={selectedDentist?.name ?? "Not selected"} />
                <Summary label="Date & time" value={`${form.date} at ${form.time}`} />
                <Summary label="Payment" value={form.paymentType === "Medical Scheme" ? form.schemeName || "Medical Scheme" : "Cash"} />
              </div>
              <Button type="submit" className="mt-6 w-full">Create mock booking</Button>
            </Card>
          </aside>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
}
