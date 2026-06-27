import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PencilLine, ShieldPlus, X } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useToast } from "../shared/ToastProvider";
import type { StaffRole } from "../../features/staff/staff-directory-service";
import { saveRole, type RoleAccessLevel, type RoleFormValues } from "../../features/staff/roles-service";
import { ROLE_APPOINTMENT_MARKERS, type RoleAppointmentMarker } from "../../features/staff/role-types";

type RoleForm = RoleFormValues;

const initialForm: RoleForm = {
  name: "",
  description: "",
  accessLevel: "Operational access",
  appointmentMarker: "Staff",
};

const accessLevelOptions: RoleAccessLevel[] = ["Full access", "Operational access", "Limited access"];

export function AddRoleModal({
  open,
  onClose,
  onSaved,
  role,
  existingRoles,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (role: StaffRole) => void;
  role?: StaffRole | null;
  existingRoles: StaffRole[];
}) {
  const [form, setForm] = useState<RoleForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      role
        ? {
            name: role.name,
            description: role.description ?? "",
            accessLevel: role.accessLevel as RoleAccessLevel,
            appointmentMarker: role.appointmentMarker,
          }
        : initialForm,
    );
    setIsSaving(false);
  }, [open, role]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  function update<K extends keyof RoleForm>(key: K, value: RoleForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const normalizedName = name.toLowerCase();
    const duplicate = existingRoles.some((existingRole) => existingRole.id !== role?.id && existingRole.name.toLowerCase() === normalizedName);

    if (duplicate) {
      showToast({
        title: "Role already exists",
        description: "Use a different role name before saving this role.",
        variant: "warning",
      });
      return;
    }

    setIsSaving(true);
    const result = await saveRole(form, role);
    setIsSaving(false);

    if (result.error || !result.data) {
      showToast({
        title: role ? "Role could not be updated" : "Role could not be created",
        description: result.error ?? "An unknown error occurred while saving the role.",
        variant: "error",
      });
      return;
    }

    onSaved(result.data);
    showToast({
      title: role ? "Role updated" : "Role created",
      description: `${result.data.name} is now available in the roles list.`,
      variant: "success",
    });
    onClose();
  }

  const permissionsPreview = form.accessLevel === "Full access" ? ["Users", "Roles", "Branches", "Reports"] : form.accessLevel === "Operational access" ? ["Appointments", "Patients", "Calendar"] : ["Reports", "Billing"];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-xroads-50 p-2 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-200">
              {role ? <PencilLine size={20} /> : <ShieldPlus size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{role ? "Edit role" : "Create role"}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Define the role details used in the staff access catalog.</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-11 w-11 rounded-xl p-0" onClick={onClose} aria-label={`Close ${role ? "edit" : "create"} role modal`}>
            <X size={28} strokeWidth={2.2} />
          </Button>
        </div>

        <form onSubmit={submitRole} className="flex flex-1 flex-col overflow-y-auto">
          <div className="grid gap-5 p-5">
            <Field label="Role name">
              <input
                className="input"
                required
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Receptionist"
              />
            </Field>
            <Field label="Description">
              <textarea className="input min-h-28 py-3" required value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Describe what this role can do in the clinic" />
            </Field>
            <Field label="Access level">
              <select className="input" value={form.accessLevel} onChange={(event) => update("accessLevel", event.target.value as RoleAccessLevel)}>
                {accessLevelOptions.map((accessLevel) => (
                  <option key={accessLevel} value={accessLevel}>
                    {accessLevel}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Appointment marker">
              <select className="input" value={form.appointmentMarker} onChange={(event) => update("appointmentMarker", event.target.value as RoleAppointmentMarker)}>
                {ROLE_APPOINTMENT_MARKERS.map((marker) => (
                  <option key={marker} value={marker}>
                    {marker}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose Dentist for roles that should appear on appointment schedules.</p>
            </Field>
            <Field label="Coverage preview">
              <div className="flex flex-wrap gap-2">
                {permissionsPreview.map((permission) => (
                  <Badge key={permission} className="bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-800">
                    {permission}
                  </Badge>
                ))}
              </div>
            </Field>
          </div>
          <div className="border-t border-slate-100 p-5 dark:border-neutral-800">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? "Saving..." : role ? "Save changes" : "Create role"}
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
