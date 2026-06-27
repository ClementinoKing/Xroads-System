import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, CircleAlert, Info, X } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

type ToastVariant = "success" | "error" | "warning" | "info";
type Toast = { id: number; title: string; description?: string; variant?: ToastVariant };
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
      <div className="pointer-events-none fixed right-4 top-4 z-[100000] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-lg border p-4 shadow-soft backdrop-blur-sm",
              toast.variant === "error"
                ? "border-rose-200 bg-rose-50/95 dark:border-rose-900/50 dark:bg-rose-950/35"
                : toast.variant === "warning"
                  ? "border-orange-200 bg-orange-50/95 dark:border-orange-900/50 dark:bg-orange-950/30"
                  : toast.variant === "info"
                    ? "border-emerald-200 bg-emerald-50/95 dark:border-emerald-900/50 dark:bg-emerald-950/30"
                    : "border-emerald-200 bg-emerald-50/95 dark:border-emerald-900/50 dark:bg-emerald-950/30",
            )}
          >
            <div className="flex items-start gap-3">
              <ToastIcon variant={toast.variant} />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    toast.variant === "error"
                      ? "text-rose-900 dark:text-rose-100"
                      : toast.variant === "warning"
                        ? "text-orange-900 dark:text-orange-100"
                        : toast.variant === "info"
                          ? "text-emerald-900 dark:text-emerald-100"
                          : "text-emerald-900 dark:text-emerald-100",
                  )}
                >
                  {toast.title}
                </p>
                {toast.description ? (
                  <p
                    className={cn(
                      "mt-1 text-sm",
                      toast.variant === "error"
                        ? "text-rose-800 dark:text-rose-200"
                        : toast.variant === "warning"
                          ? "text-orange-800 dark:text-orange-200"
                          : toast.variant === "info"
                            ? "text-emerald-800 dark:text-emerald-200"
                            : "text-emerald-800 dark:text-emerald-200",
                    )}
                  >
                    {toast.description}
                  </p>
                ) : null}
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

function ToastIcon({ variant }: { variant?: ToastVariant }) {
  const className =
    variant === "error"
      ? "mt-0.5 text-rose-600 dark:text-rose-300"
      : variant === "warning"
        ? "mt-0.5 text-orange-600 dark:text-orange-300"
        : variant === "info"
          ? "mt-0.5 text-emerald-600 dark:text-emerald-300"
          : "mt-0.5 text-emerald-600 dark:text-emerald-300";

  switch (variant) {
    case "error":
      return <CircleAlert className={className} size={20} />;
    case "warning":
      return <AlertTriangle className={className} size={20} />;
    case "info":
      return <Info className={className} size={20} />;
    default:
      return <CheckCircle2 className={className} size={20} />;
  }
}
