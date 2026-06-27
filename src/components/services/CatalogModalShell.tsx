import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/Button";

export function CatalogModalShell({
  open,
  onClose,
  icon,
  title,
  description,
  children,
  footer,
  widthClass = "max-w-3xl",
}: {
  open: boolean;
  onClose: () => void;
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  widthClass?: string;
}) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`flex max-h-[92dvh] w-full ${widthClass} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-xroads-50 p-2 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-200">{icon}</div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-11 w-11 rounded-xl p-0" onClick={onClose} aria-label={`Close ${title}`}>
            <X size={28} strokeWidth={2.2} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>
        <div className="border-t border-slate-100 p-5 dark:border-neutral-800">{footer}</div>
      </div>
    </div>,
    document.body,
  );
}

export function CatalogField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span> : null}
    </label>
  );
}
