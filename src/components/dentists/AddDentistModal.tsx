import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, Stethoscope, X } from "lucide-react";
import { branches } from "../../data/branches";
import { Button } from "../ui/Button";
import { useToast } from "../shared/ToastProvider";
import { useBranchScope } from "../../features/auth/branch-scope";
import { createStaffAccount } from "../../features/staff/staff-admin-service";
import { loadUserById, type StaffUser } from "../../features/staff/staff-directory-service";
import { Badge } from "../ui/Badge";
import type { UserAccount } from "../../data/users";

type DentistForm = {
  name: string;
  email: string;
  branchId: string | "All branches";
  status: UserAccount["status"];
};

const initialForm: DentistForm = {
  name: "",
  email: "",
  branchId: "xroads-dental",
  status: "Active",
};

export function AddDentistModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (dentist: StaffUser) => void;
}) {
  const [form, setForm] = useState<DentistForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const branchScope = useBranchScope();
  const isBranchLocked = branchScope.isBranchLocked;
  const availableBranches = useMemo(() => branchScope.branchOptions, [branchScope.branchOptions]);

  useEffect(() => {
    if (open) {
      setForm((current) => ({
        ...current,
        branchId: branchScope.branchId ?? current.branchId,
      }));
      setIsSaving(false);
    }
  }, [branchScope.branchId, open]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  function update<K extends keyof DentistForm>(key: K, value: DentistForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitDentist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    const result = await createStaffAccount({
      name,
      email,
      roleId: "dentist",
      branchId: form.branchId,
      status: form.status,
    });

    if (result.error || !result.data) {
      showToast({
        title: "Dentist could not be created",
        description: result.error ?? "An unknown error occurred while creating the dentist profile.",
        variant: "error",
      });
      setIsSaving(false);
      return;
    }

    const profile = await loadUserById(result.data.profileId);

    if (profile.error || !profile.data) {
      showToast({
        title: "Dentist created",
        description: `${name} was created, but the profile could not be reloaded right now.`,
        variant: "warning",
      });
      onCreate({
        id: result.data.profileId,
        fullName: name,
        email,
        avatarUrl: null,
        initials: name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? "")
          .join("")
          .slice(0, 2) || "D",
        roleId: "dentist",
        roleName: "Dentist",
        roleDescription: null,
        roleAppointmentMarker: "Dentist",
        accessLevel: "Operational access",
        isSystemRole: false,
        status: form.status.toLowerCase() as StaffUser["status"],
        branchId: form.branchId === "All branches" ? null : form.branchId,
        branchName: form.branchId === "All branches" ? null : branches.find((branch) => branch.id === form.branchId)?.name ?? null,
        department: null,
        createdAt: new Date().toISOString(),
      });
      setForm({ ...initialForm, branchId: branchScope.branchId ?? initialForm.branchId });
      setIsSaving(false);
      onClose();
      return;
    }

    onCreate(profile.data);
    showToast({
      title: "Dentist profile created",
      description: `${profile.data.fullName} has been added to the clinical team.`,
      variant: "success",
    });
    setForm({ ...initialForm, branchId: branchScope.branchId ?? initialForm.branchId });
    setIsSaving(false);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-xroads-50 p-2 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-200">
              <Stethoscope size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Create dentist</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Create a dentist-role staff profile for scheduling and access.</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-11 w-11 rounded-xl p-0" onClick={onClose} aria-label="Close create dentist modal">
            <X size={28} strokeWidth={2.2} />
          </Button>
        </div>

        <form onSubmit={submitDentist} className="flex flex-1 flex-col overflow-y-auto">
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Dentist name">
              <input className="input" required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Enter full name" />
            </Field>
            <Field label="Email address">
              <input className="input" type="email" required value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@xroads.health" />
            </Field>
            <Field label="Branch">
              {isBranchLocked ? (
                <input className="input bg-slate-50 text-slate-600 dark:bg-zinc-900 dark:text-slate-300" value={branchScope.branchLabel} readOnly />
              ) : (
                <select className="input" value={form.branchId} onChange={(event) => update("branchId", event.target.value)}>
                  <option value="All branches">All branches</option>
                  {availableBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(event) => update("status", event.target.value as UserAccount["status"])}>
                <option value="Active">Active</option>
                <option value="Invited">Invited</option>
                <option value="Suspended">Suspended</option>
              </select>
            </Field>
            <div className="grid gap-1.5">
              <span className="label">Preview</span>
              <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-neutral-800 dark:bg-neutral-950">
                <Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200">Dentist</Badge>
                <Badge
                  className={
                    form.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : form.status === "Invited"
                        ? "bg-amber-50 text-amber-700 ring-amber-200"
                        : "bg-slate-100 text-slate-700 ring-slate-200"
                  }
                >
                  {form.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 p-5 dark:border-neutral-800">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Creating
                </>
              ) : (
                "Create dentist profile"
              )}
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
