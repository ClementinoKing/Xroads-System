import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, Mail, X } from "lucide-react";
import { Button } from "../ui/Button";

type ChangeEmailModalProps = {
  open: boolean;
  currentEmail: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
};

export function ChangeEmailModal({ open, currentEmail, isSaving, onClose, onSubmit }: ChangeEmailModalProps) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (open) {
      setEmail("");
    }
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail) {
      return;
    }

    await onSubmit(nextEmail);
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-xroads-50 p-2 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-200">
              <Mail size={18} />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Change email</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We will send a confirmation link to the new address before the change takes effect.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-11 rounded-xl p-0"
            onClick={onClose}
            aria-label="Close email change modal"
          >
            <X size={28} strokeWidth={2.2} />
          </Button>
        </div>

        <form className="space-y-5 p-5" onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="label">Current email</span>
              <input className="input bg-slate-50 text-slate-500 dark:bg-neutral-950" value={currentEmail} readOnly aria-readonly="true" />
            </label>
            <label className="grid gap-1.5">
              <span className="label">New email address</span>
              <input
                className="input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
              />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Sending confirmation
                </>
              ) : (
                "Send confirmation"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
