import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Building2, X } from "lucide-react";

import type { Branch } from "../../data/branches";
import { Button } from "../ui/Button";
import { useToast } from "../shared/ToastProvider";

type BranchForm = {
  name: string;
  address: string;
  hours: string;
  status: Branch["status"];
};

const initialForm: BranchForm = {
  name: "",
  address: "",
  hours: "Monday to Friday, 8AM - 6PM",
  status: "Open",
};

export function AddBranchModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (branch: Branch) => void;
}) {
  const [form, setForm] = useState<BranchForm>(initialForm);
  const { showToast } = useToast();

  if (!open || typeof document === "undefined") return null;

  function update<K extends keyof BranchForm>(key: K, value: BranchForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submitBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const branch: Branch = {
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "branch"}-${Date.now().toString().slice(-4)}`,
      name,
      address: form.address.trim(),
      status: form.status,
      hours: form.hours.trim(),
    };

    onCreate(branch);
    showToast({
      title: "Mock branch created",
      description: `${branch.name} has been added to the branch list.`,
      variant: "success",
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
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Create branch</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Add a new clinic branch to the mock directory.</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-11 w-11 rounded-lg p-0" onClick={onClose} aria-label="Close create branch modal">
            <X size={28} strokeWidth={2.2} />
          </Button>
        </div>

        <form onSubmit={submitBranch} className="flex flex-1 flex-col overflow-y-auto">
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Branch name">
              <input className="input" required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Gateway Dental" />
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(event) => update("status", event.target.value as Branch["status"])}>
                <option>Open</option>
                <option>Closed</option>
              </select>
            </Field>
            <Field label="Address">
              <input className="input" required value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Lilongwe, Malawi" />
            </Field>
            <Field label="Operating hours">
              <input className="input" required value={form.hours} onChange={(event) => update("hours", event.target.value)} placeholder="Monday to Friday, 8AM - 6PM" />
            </Field>
          </div>
          <div className="border-t border-slate-100 p-5 dark:border-neutral-800">
            <Button type="submit" className="w-full sm:w-auto">
              Create branch
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
