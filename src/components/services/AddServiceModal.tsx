import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { HeartPulse, X } from "lucide-react";

import type { DentalService, ServiceCategory } from "../../data/services";
import { Button } from "../ui/Button";
import { useToast } from "../shared/ToastProvider";

type ServiceForm = {
  name: string;
  description: string;
  duration: string;
  category: ServiceCategory;
  active: boolean;
};

const initialForm: ServiceForm = {
  name: "",
  description: "",
  duration: "30",
  category: "General",
  active: true,
};

const categoryOptions: ServiceCategory[] = ["General", "Cosmetic", "Emergency", "Orthodontics", "Pediatric", "Preventive"];

export function AddServiceModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (service: DentalService) => void;
}) {
  const [form, setForm] = useState<ServiceForm>(initialForm);
  const { showToast } = useToast();

  if (!open || typeof document === "undefined") return null;

  function update<K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submitService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const service: DentalService = {
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "service"}-${Date.now().toString().slice(-4)}`,
      name,
      duration: Number.parseInt(form.duration, 10) || 30,
      category: form.category,
      active: form.active,
      description: form.description.trim(),
    };

    onCreate(service);
    showToast({
      title: "Mock service created",
      description: `${service.name} has been added to the service catalog.`,
    });
    setForm(initialForm);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/35 p-4" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-xroads-50 p-2 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-200">
              <HeartPulse size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Create service</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Add a service to the mock dental catalog.</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-11 w-11 rounded-lg p-0" onClick={onClose} aria-label="Close create service modal">
            <X size={28} strokeWidth={2.2} />
          </Button>
        </div>

        <form onSubmit={submitService} className="flex flex-1 flex-col overflow-y-auto">
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Service name">
              <input className="input" required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Routine cleaning" />
            </Field>
            <Field label="Duration (minutes)">
              <input className="input" required type="number" min={10} step={5} value={form.duration} onChange={(event) => update("duration", event.target.value)} placeholder="30" />
            </Field>
            <Field label="Category">
              <select className="input" value={form.category} onChange={(event) => update("category", event.target.value as ServiceCategory)}>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className="input" value={form.active ? "Active" : "Inactive"} onChange={(event) => update("active", event.target.value === "Active")}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </Field>
            <Field label="Description">
              <textarea className="input min-h-28 py-3 sm:col-span-2" required value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Describe the service" />
            </Field>
          </div>
          <div className="border-t border-slate-100 p-5 dark:border-neutral-800">
            <Button type="submit" className="w-full sm:w-auto">
              Create service
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
