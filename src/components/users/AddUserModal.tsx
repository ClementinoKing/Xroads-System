import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, UserPlus, X } from "lucide-react";
import type { BranchId } from "../../data/branches";
import { branches } from "../../data/branches";
import type { UserAccount } from "../../data/users";
import type { StaffRole, StaffUser } from "../../features/staff/staff-directory-service";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useToast } from "../shared/ToastProvider";
import { createStaffAccount, updateStaffAccount } from "../../features/staff/staff-admin-service";

type UserForm = {
  name: string;
  email: string;
  roleId: string;
  branchId: BranchId | "All branches";
  status: UserAccount["status"];
};

const initialForm: UserForm = {
  name: "",
  email: "",
  roleId: "receptionist",
  branchId: "All branches",
  status: "Invited",
};

const statusOptions: UserAccount["status"][] = ["Active", "Invited", "Suspended"];

function statusToForm(status: StaffUser["status"]): UserAccount["status"] {
  switch (status) {
    case "active":
      return "Active";
    case "invited":
      return "Invited";
    case "suspended":
      return "Suspended";
  }
}

function formFromUser(user: StaffUser | null | undefined): UserForm {
  if (!user) {
    return initialForm;
  }

  return {
    name: user.fullName,
    email: user.email,
    roleId: user.roleId,
    branchId: user.branchId ?? "All branches",
    status: statusToForm(user.status),
  };
}

export function AddUserModal({
  open,
  onClose,
  onCreated,
  existingEmails,
  roles,
  user,
  initialRoleId = "receptionist",
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  existingEmails: string[];
  roles: StaffRole[];
  user?: StaffUser | null;
  initialRoleId?: string;
}) {
  const [form, setForm] = useState<UserForm>(() => formFromUser(user) ?? { ...initialForm, roleId: initialRoleId });
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const isEditing = Boolean(user);

  const selectedRole = roles.find((role) => role.id === form.roleId) ?? null;

  useEffect(() => {
    if (open) {
      setForm(user ? formFromUser(user) : { ...initialForm, roleId: roles[0]?.id ?? initialRoleId });
      setIsSaving(false);
    }
  }, [initialRoleId, open, roles, user]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  function update<K extends keyof UserForm>(key: K, value: UserForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (existingEmails.some((existingEmail) => existingEmail.toLowerCase() === email && existingEmail.toLowerCase() !== user?.email.toLowerCase())) {
      showToast({
        title: "Email already exists",
        description: "Use a different email address before creating this user.",
        variant: "warning",
      });
      setIsSaving(false);
      return;
    }

    const result = isEditing && user
      ? await updateStaffAccount({
          userId: user.id,
          name,
          email,
          roleId: form.roleId,
          branchId: form.branchId,
          status: form.status,
        })
      : await createStaffAccount({
          name,
          email,
          roleId: form.roleId,
          branchId: form.branchId,
          status: form.status,
        });

    if (result.error || !result.data) {
      showToast({
        title: isEditing ? "User could not be updated" : "User could not be created",
        description: result.error ?? (isEditing ? "An unknown error occurred while updating the user." : "An unknown error occurred while creating the user."),
        variant: "error",
      });
      setIsSaving(false);
      return;
    }

    onCreated();
    const successDescription = isEditing
      ? `${name}'s account details were updated.`
      : `${name} has been created with temporary password ${"temporaryPassword" in result.data ? (result.data.temporaryPassword ?? "set by the server") : "set by the server"} and must change it on first login.`;
    showToast({
      title: isEditing ? "User updated" : "User created",
      description: successDescription,
      variant: "success",
    });
    setForm(isEditing && user ? formFromUser(user) : { ...initialForm, roleId: roles[0]?.id ?? initialRoleId });
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
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{isEditing ? "Edit user" : "Create user"}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isEditing
                  ? "Update the staff account details, access, and assignment."
                  : "Add a staff account and assign access details. New accounts start with a server-issued temporary password."}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-11 rounded-xl p-0"
            onClick={onClose}
            aria-label={isEditing ? "Close edit user modal" : "Close create user modal"}
          >
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
              <select className="input" value={form.roleId} onChange={(event) => update("roleId", event.target.value)} disabled={roles.length === 0}>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
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
                <Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200">{selectedRole?.name ?? "Role"}</Badge>
                <Badge className={form.status === "Active" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : form.status === "Invited" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-slate-100 text-slate-700 ring-slate-200"}>
                  {form.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 p-5 dark:border-neutral-800">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || roles.length === 0}>
              {isSaving ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  {isEditing ? "Saving" : "Creating"}
                </>
              ) : (
                isEditing ? "Save changes" : "Create user"
              )}
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
