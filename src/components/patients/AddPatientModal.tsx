import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { UserPlus, X } from "lucide-react";
import type { Patient } from "../../data/patients";
import { branches } from "../../data/branches";
import { Button } from "../ui/Button";
import { useToast } from "../shared/ToastProvider";

type PatientForm = {
  name: string;
  phone: string;
  email: string;
  branchId: Patient["branchId"];
  paymentMethod: Patient["paymentMethod"];
  schemeName: string;
  nextAppointment: string;
};

const initialForm: PatientForm = {
  name: "",
  phone: "",
  email: "",
  branchId: "xroads-dental",
  paymentMethod: "Cash",
  schemeName: "",
  nextAppointment: "No upcoming",
};

export function AddPatientModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (patient: Patient) => void;
}) {
  const [form, setForm] = useState<PatientForm>(initialForm);
  const { showToast } = useToast();

  if (!open) return null;
  if (typeof document === "undefined") return null;

  function update<K extends keyof PatientForm>(key: K, value: PatientForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submitPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const patient: Patient = {
      id: `PAT-${Date.now().toString().slice(-4)}`,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      branchId: form.branchId,
      lastVisit: "New patient",
      nextAppointment: form.nextAppointment.trim() || "No upcoming",
      paymentMethod: form.paymentMethod,
      schemeName: form.paymentMethod === "Medical Scheme" ? form.schemeName.trim() || undefined : undefined,
    };

    onCreate(patient);
    showToast({
      title: "Mock patient created",
      description: `${patient.name} has been added to the patient list.`,
    });
    setForm(initialForm);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/35 p-4" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-xroads-50 p-2 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-200">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Create patient</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Add a frontend-only mock patient profile.</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-11 w-11 rounded-lg p-0" onClick={onClose} aria-label="Close create patient modal">
            <X size={28} strokeWidth={2.2} />
          </Button>
        </div>

        <form onSubmit={submitPatient} className="flex flex-1 flex-col overflow-y-auto">
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Patient name">
              <input className="input" required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Enter full name" />
            </Field>
            <Field label="Phone number">
              <input className="input" required value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+265 ..." />
            </Field>
            <Field label="Email optional">
              <input className="input" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="patient@email.com" />
            </Field>
            <Field label="Branch">
              <select className="input" value={form.branchId} onChange={(event) => update("branchId", event.target.value as Patient["branchId"])}>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Payment method">
              <select className="input" value={form.paymentMethod} onChange={(event) => update("paymentMethod", event.target.value as Patient["paymentMethod"])}>
                <option>Cash</option>
                <option>Medical Scheme</option>
              </select>
            </Field>
            <Field label="Medical scheme name">
              <input
                className="input"
                disabled={form.paymentMethod === "Cash"}
                value={form.schemeName}
                onChange={(event) => update("schemeName", event.target.value)}
                placeholder="MASM, AON, Liberty Health"
              />
            </Field>
            <Field label="Next appointment">
              <input className="input" value={form.nextAppointment} onChange={(event) => update("nextAppointment", event.target.value)} placeholder="No upcoming" />
            </Field>
          </div>
          <div className="border-t border-slate-100 p-5 dark:border-neutral-800">
            <Button type="submit" className="w-full sm:w-auto">
              Create patient
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
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
