import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Stethoscope, X } from "lucide-react";
import type { Dentist } from "../../data/dentists";
import { branches } from "../../data/branches";
import { Button } from "../ui/Button";
import { useToast } from "../shared/ToastProvider";

type DentistForm = {
  name: string;
  role: string;
  branchId: Dentist["branchId"];
  availability: Dentist["availability"];
  todayAppointments: string;
};

const initialForm: DentistForm = {
  name: "",
  role: "Dentist",
  branchId: "xroads-dental",
  availability: "Available",
  todayAppointments: "0",
};

export function AddDentistModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (dentist: Dentist) => void;
}) {
  const [form, setForm] = useState<DentistForm>(initialForm);
  const { showToast } = useToast();

  if (!open) return null;
  if (typeof document === "undefined") return null;

  function update<K extends keyof DentistForm>(key: K, value: DentistForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submitDentist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const dentist: Dentist = {
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString().slice(-4)}`,
      name,
      role: form.role.trim(),
      branchId: form.branchId,
      availability: form.availability,
      todayAppointments: Number.parseInt(form.todayAppointments, 10) || 0,
      schedule: [],
    };

    onCreate(dentist);
    showToast({
      title: "Mock dentist created",
      description: `${dentist.name} has been added to the clinical team.`,
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
              <Stethoscope size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Create dentist</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Add a frontend-only mock clinical team member.</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-11 w-11 rounded-lg p-0" onClick={onClose} aria-label="Close create dentist modal">
            <X size={28} strokeWidth={2.2} />
          </Button>
        </div>

        <form onSubmit={submitDentist} className="flex flex-1 flex-col overflow-y-auto">
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Dentist name">
              <input className="input" required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Enter full name" />
            </Field>
            <Field label="Role">
              <input className="input" required value={form.role} onChange={(event) => update("role", event.target.value)} placeholder="Dentist, Orthodontist, Therapist" />
            </Field>
            <Field label="Branch">
              <select className="input" value={form.branchId} onChange={(event) => update("branchId", event.target.value as Dentist["branchId"])}>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Availability">
              <select className="input" value={form.availability} onChange={(event) => update("availability", event.target.value as Dentist["availability"])}>
                <option>Available</option>
                <option>In consultation</option>
                <option>Off duty</option>
              </select>
            </Field>
            <Field label="Today's appointments">
              <input
                className="input"
                min={0}
                type="number"
                value={form.todayAppointments}
                onChange={(event) => update("todayAppointments", event.target.value)}
                placeholder="0"
              />
            </Field>
          </div>
          <div className="border-t border-slate-100 p-5 dark:border-neutral-800">
            <Button type="submit" className="w-full sm:w-auto">
              Create dentist
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
