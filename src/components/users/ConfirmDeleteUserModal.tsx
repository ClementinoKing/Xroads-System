import { createPortal } from "react-dom";
import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";
import type { StaffUser } from "../../features/staff/staff-directory-service";
import { Button } from "../ui/Button";

export function ConfirmDeleteUserModal({
  open,
  user,
  isDeleting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  user: StaffUser | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open || !user) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-50 p-2 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Delete user</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">This action will remove the staff account.</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-11 w-11 rounded-xl p-0" onClick={onClose} aria-label="Close delete user modal">
            <X size={24} />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Delete <span className="font-semibold text-slate-950 dark:text-slate-50">{user.fullName}</span> and remove the associated login access?
          </p>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-100">
            This is permanent and cannot be undone from the app.
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-5 py-4 dark:border-neutral-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isDeleting} className="bg-rose-600 text-white hover:bg-rose-700">
            {isDeleting ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Deleting
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete user
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
