import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, PenSquare, Plus, X } from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { type MedicalSchemeFormValues, type MedicalSchemeRecord } from "../../features/patients/medical-schemes-service";
import { cn } from "../../lib/utils";

const EMPTY_FORM: MedicalSchemeFormValues = {
  name: "",
  providerName: "",
  schemeType: "provider",
  description: "",
  sourceUrl: "",
  sortOrder: "0",
  isActive: true,
};

type MedicalSchemeEditorModalProps = {
  open: boolean;
  scheme: MedicalSchemeRecord | null;
  onClose: () => void;
  onSave: (values: MedicalSchemeFormValues, schemeId: string | null) => Promise<string | null>;
};

export function MedicalSchemeEditorModal({ open, scheme, onClose, onSave }: MedicalSchemeEditorModalProps) {
  const [form, setForm] = useState<MedicalSchemeFormValues>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
    setForm(
      scheme
        ? {
            name: scheme.name,
            providerName: scheme.providerName,
            schemeType: scheme.schemeType,
            description: scheme.description ?? "",
            sourceUrl: scheme.sourceUrl ?? "",
            sortOrder: String(scheme.sortOrder),
            isActive: scheme.isActive,
          }
        : EMPTY_FORM,
    );
  }, [open, scheme]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  function update<K extends keyof MedicalSchemeFormValues>(key: K, value: MedicalSchemeFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const result = await onSave(form, scheme?.id ?? null);
      if (result) {
        setError(result);
        return;
      }

      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-xroads-50 p-2 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-200">
              {scheme ? <PenSquare size={20} /> : <Plus size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{scheme ? "Edit medical scheme" : "Add medical scheme"}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Maintain the scheme directory used by the patient intake form.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-11 w-11 rounded-xl p-0" onClick={onClose} aria-label="Close medical scheme editor">
            <X size={28} strokeWidth={2.2} />
          </Button>
        </div>

        <form onSubmit={submit} className="flex flex-1 flex-col overflow-y-auto">
          <Card className="m-0 rounded-none border-0 shadow-none">
            <CardContent className="grid gap-5 p-5 sm:grid-cols-2">
              <Field label="Scheme name">
                <input
                  className="input"
                  required
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="MASM, VIP Premier, Blue Cover"
                />
              </Field>
              <Field label="Provider name">
                <input
                  className="input"
                  required
                  value={form.providerName}
                  onChange={(event) => update("providerName", event.target.value)}
                  placeholder="MASM, UHCI, Central Health"
                />
              </Field>
              <Field label="Scheme type">
                <select className="input" value={form.schemeType} onChange={(event) => update("schemeType", event.target.value as MedicalSchemeFormValues["schemeType"])}>
                  <option value="provider">Provider</option>
                  <option value="plan">Plan</option>
                </select>
              </Field>
              <Field label="Sort order">
                <input
                  className="input"
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => update("sortOrder", event.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Source URL" className="sm:col-span-2">
                <input
                  className="input"
                  value={form.sourceUrl}
                  onChange={(event) => update("sourceUrl", event.target.value)}
                  placeholder="https://..."
                />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea
                  className="input min-h-28 py-3"
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="Short internal note for admins and search results."
                />
              </Field>
              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => update("isActive", event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-xroads-600"
                  />
                  Active in patient selection
                </label>
              </div>
              {error ? <p className="sm:col-span-2 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
            </CardContent>
          </Card>

          <div className="border-t border-slate-100 p-5 dark:border-neutral-800">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Saving
                </>
              ) : (
                "Save scheme"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
