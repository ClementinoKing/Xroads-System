import { createPortal } from "react-dom";
import { Building2, Mail, ShieldCheck, X, type LucideIcon } from "lucide-react";
import type { StaffUser } from "../../features/staff/staff-directory-service";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

function statusBadgeClass(status: StaffUser["status"]) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-zinc-900 dark:text-emerald-200 dark:ring-zinc-700";
    case "invited":
      return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-zinc-900 dark:text-amber-200 dark:ring-zinc-700";
    case "suspended":
      return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-700";
  }
}

function statusLabel(status: StaffUser["status"]) {
  switch (status) {
    case "active":
      return "Active";
    case "invited":
      return "Invited";
    case "suspended":
      return "Suspended";
  }
}

export function UserProfileModal({ open, user, onClose }: { open: boolean; user: StaffUser | null; onClose: () => void }) {
  if (!open || !user || typeof document === "undefined") {
    return null;
  }

  const branchName = user.branchName ?? user.department ?? "No branch assigned";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-950" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-neutral-800 sm:px-7">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">User profile</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Compact account overview.</p>
          </div>
          <Button type="button" variant="outline" className="h-10 w-10 rounded-xl p-0" onClick={onClose} aria-label="Close profile modal">
            <X size={20} />
          </Button>
        </div>

        <div className="overflow-y-auto px-6 py-6 sm:px-7">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-xroads-500 text-lg font-bold text-white shadow-sm">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" /> : user.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="truncate text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{user.fullName}</h3>
                      <Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200">{user.roleName}</Badge>
                      <Badge className={statusBadgeClass(user.status)}>{statusLabel(user.status)}</Badge>
                    </div>
                    <p className="mt-2 truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Account details</p>
              <div className="mt-4 divide-y divide-slate-100 dark:divide-neutral-800">
                <DetailRow label="Email" value={user.email} />
                <DetailRow label="Branch" value={branchName} />
                <DetailRow label="Access level" value={user.accessLevel} />
                <DetailRow label="Department" value={user.department ?? "Unassigned"} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DetailRow({ icon: Icon = Mail, label, value }: { icon?: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
      <div className="rounded-lg bg-xroads-50 p-2 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-200">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-slate-950 dark:text-slate-50">{value}</p>
      </div>
    </div>
  );
}
