import { useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { UserPlus, X } from "lucide-react";
import type { BranchId } from "../../data/branches";
import { branches } from "../../data/branches";
import type { UserAccount, UserRole } from "../../data/users";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useToast } from "../shared/ToastProvider";

type UserForm = {
  name: string;
  email: string;
  role: UserRole;
  branchId: BranchId | "All branches";
  status: UserAccount["status"];
};

const initialForm: UserForm = {
  name: "",
  email: "",
  role: "Receptionist",
  branchId: "All branches",
  status: "Invited",
};

const roleOptions: UserRole[] = ["Super Admin", "Branch Admin", "Receptionist", "Dentist", "Finance"];
const statusOptions: UserAccount["status"][] = ["Active", "Invited", "Suspended"];

export function AddUserModal({
  open,
  onClose,
  onCreate,
  existingEmails,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (user: UserAccount) => void;
  existingEmails: string[];
}) {
  const [form, setForm] = useState<UserForm>(initialForm);
  const { showToast } = useToast();

  if (!open) return null;
  if (typeof document === "undefined") return null;

  function update<K extends keyof UserForm>(key: K, value: UserForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (existingEmails.some((existingEmail) => existingEmail.toLowerCase() === email)) {
      showToast({
        title: "Email already exists",
        description: "Use a different email address before creating this user.",
        variant: "warning",
      });
      return;
    }

    const user: UserAccount = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name,
      email,
      role: form.role,
      branchId: form.branchId,
      status: form.status,
      lastLogin: "Never",
    };

    onCreate(user);
    showToast({
      title: "User created",
      description: `${user.name} has been added to the staff list.`,
      variant: "success",
    });
    setForm(initialForm);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/35 p-4" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-xroads-50 p-2 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-200">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Create user</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Add a staff account and assign access details.</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-11 w-11 rounded-lg p-0" onClick={onClose} aria-label="Close create user modal">
            <X size={28} strokeWidth={2.2} />
          </Button>
        </div>

        <form onSubmit={submitUser} className="flex flex-1 flex-col overflow-y-auto">
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Full name">
              <input className="input" required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Enter full name" />
            </Field>
            <Field label="Email address">
              <input className="input" type="email" required value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@xroads.health" />
            </Field>
            <Field label="Role">
              <select className="input" value={form.role} onChange={(event) => update("role", event.target.value as UserRole)}>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Branch assignment">
              <select className="input" value={form.branchId} onChange={(event) => update("branchId", event.target.value as UserForm["branchId"])}>
                <option value="All branches">All branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(event) => update("status", event.target.value as UserAccount["status"])}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-1.5">
              <span className="label">Preview</span>
              <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-neutral-800 dark:bg-neutral-950">
                <Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200">{form.role}</Badge>
                <Badge className={form.status === "Active" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : form.status === "Invited" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-slate-100 text-slate-700 ring-slate-200"}>
                  {form.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 p-5 dark:border-neutral-800">
            <Button type="submit" className="w-full sm:w-auto">
              Create user
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
