import { useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ShieldPlus, X } from "lucide-react";
import type { RoleDefinition } from "../../data/roles";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useToast } from "../shared/ToastProvider";

type RoleForm = {
  name: string;
  description: string;
  accessLevel: RoleDefinition["accessLevel"];
  permissions: string;
};

const initialForm: RoleForm = {
  name: "",
  description: "",
  accessLevel: "Operational access",
  permissions: "",
};

const accessLevelOptions: RoleDefinition["accessLevel"][] = ["Full access", "Operational access", "Limited access"];

export function AddRoleModal({
  open,
  onClose,
  onCreate,
  existingRoleNames,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (role: RoleDefinition) => void;
  existingRoleNames: string[];
}) {
  const [form, setForm] = useState<RoleForm>(initialForm);
  const { showToast } = useToast();

  if (!open) return null;
  if (typeof document === "undefined") return null;

  function update<K extends keyof RoleForm>(key: K, value: RoleForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submitRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const normalizedName = name.toLowerCase();
    const duplicate = existingRoleNames.some((roleName) => roleName.toLowerCase() === normalizedName);

    if (duplicate) {
      showToast({
        title: "Role already exists",
        description: "Use a different role name before creating this role.",
      });
      return;
    }

    const permissions = form.permissions
      .split(",")
      .map((permission) => permission.trim())
      .filter(Boolean);

    const role: RoleDefinition = {
      id: `ROLE-${Date.now().toString().slice(-4)}`,
      name,
      description: form.description.trim(),
      userCount: 0,
      accessLevel: form.accessLevel,
      permissions,
    };

    onCreate(role);
    showToast({
      title: "Role created",
      description: `${role.name} is now available in the roles list.`,
    });
    setForm(initialForm);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/35 p-4" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-xroads-50 p-2 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-200">
              <ShieldPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Create role</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Define a staff role and its access permissions.</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-11 w-11 rounded-lg p-0" onClick={onClose} aria-label="Close create role modal">
            <X size={28} strokeWidth={2.2} />
          </Button>
        </div>

        <form onSubmit={submitRole} className="flex flex-1 flex-col overflow-y-auto">
          <div className="grid gap-5 p-5">
            <Field label="Role name">
              <input className="input" required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Receptionist" />
            </Field>
            <Field label="Description">
              <textarea className="input min-h-28 py-3" required value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Describe what this role can do in the clinic" />
            </Field>
            <Field label="Access level">
              <select className="input" value={form.accessLevel} onChange={(event) => update("accessLevel", event.target.value as RoleDefinition["accessLevel"])}>
                {accessLevelOptions.map((accessLevel) => (
                  <option key={accessLevel} value={accessLevel}>
                    {accessLevel}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Permissions">
              <input className="input" value={form.permissions} onChange={(event) => update("permissions", event.target.value)} placeholder="Bookings, Patients, Calendar" />
            </Field>
            <div className="flex flex-wrap gap-2">
              {form.permissions
                .split(",")
                .map((permission) => permission.trim())
                .filter(Boolean)
                .map((permission) => (
                  <Badge key={permission} className="bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-800">
                    {permission}
                  </Badge>
                ))}
            </div>
          </div>
          <div className="border-t border-slate-100 p-5 dark:border-neutral-800">
            <Button type="submit" className="w-full sm:w-auto">
              Create role
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
