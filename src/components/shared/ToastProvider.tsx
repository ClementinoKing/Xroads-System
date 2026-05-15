import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "../ui/Button";

type Toast = { id: number; title: string; description?: string };
type ToastContextValue = { showToast: (toast: Omit<Toast, "id">) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((current) => [...current, { id, ...toast }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-lg border border-xroads-100 bg-white p-4 shadow-soft dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 text-xroads-700" size={20} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{toast.description}</p> : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0"
                aria-label="Dismiss toast"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
