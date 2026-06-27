import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CircleAlert, PenSquare, Plus, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { AddRoleModal } from "../components/roles/AddRoleModal";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { IconButton } from "../components/ui/IconButton";
import { FilterField } from "../components/shared/Filters";
import { useRoles } from "../features/staff/use-roles";
import type { StaffRole } from "../features/staff/staff-directory-service";

type RoleTypeFilter = "All" | "System" | "Custom";

function formatDate(value: string) {
  const parsed = parseISO(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return format(parsed, "MMM d, yyyy");
}

function accessBadgeClass(accessLevel: string) {
  if (/full access/i.test(accessLevel)) {
    return "bg-xroads-50 text-xroads-700 ring-xroads-200 dark:bg-zinc-900 dark:text-xroads-200 dark:ring-zinc-700";
  }

  if (/operational access/i.test(accessLevel)) {
    return "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-zinc-900 dark:text-sky-200 dark:ring-zinc-700";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-700";
}

function typeBadgeClass(isSystemRole: boolean) {
  return isSystemRole
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-zinc-900 dark:text-emerald-200 dark:ring-zinc-700"
    : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-700";
}

export function RolesPage() {
  const { roles, isLoading, error, refetch } = useRoles();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<RoleTypeFilter>("All");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<StaffRole | null>(null);

  const directoryRoles = useMemo(() => {
    return [...roles].sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [roles]);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return directoryRoles.filter((role) => {
      const typeMatch =
        typeFilter === "All" ||
        (typeFilter === "System" && role.isSystemRole) ||
        (typeFilter === "Custom" && !role.isSystemRole);
      const queryMatch = !query || [role.name, role.description ?? "", role.accessLevel, role.appointmentMarker].join(" ").toLowerCase().includes(query);

      return typeMatch && queryMatch;
    });
  }, [directoryRoles, search, typeFilter]);

  const hasFilters = search.trim().length > 0 || typeFilter !== "All";

  function clearFilters() {
    setSearch("");
    setTypeFilter("All");
  }

  function openCreateModal() {
    setEditingRole(null);
    setEditorOpen(true);
  }

  function openEditModal(role: StaffRole) {
    setEditingRole(role);
    setEditorOpen(true);
  }

  const isEmpty = !isLoading && !error && filteredRoles.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Roles</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Define access levels and permissions for each staff role.</p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          <Plus size={17} />
          Add role
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4 bg-slate-50/70 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-xroads-700 ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-xroads-300 dark:ring-zinc-800">
                <ShieldCheck size={18} />
              </div>
              <div>
                <CardTitle>Role catalog</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {filteredRoles.length} of {directoryRoles.length} roles shown
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" className="h-10 w-full px-3 lg:w-auto" onClick={clearFilters} disabled={!hasFilters}>
              <RotateCcw size={16} />
              Reset
            </Button>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <FilterField label="Search" className="lg:flex-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={19} />
                <input
                  className="input h-12 pl-11 text-base lg:min-w-[420px]"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search role name, description, or access level"
                />
              </div>
            </FilterField>
            <FilterField label="Type" className="lg:w-[220px]">
              <select className="input h-12 text-base lg:w-[220px]" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as RoleTypeFilter)}>
                <option value="All">All roles</option>
                <option value="System">System</option>
                <option value="Custom">Custom</option>
              </select>
            </FilterField>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <RolesGridSkeleton />
          ) : error ? (
            <DirectoryErrorState title="Roles could not be loaded" message={error} actionLabel="Try again" onAction={refetch} />
          ) : isEmpty ? (
            <DirectoryEmptyState
              title={hasFilters ? "No matching roles" : "No roles found"}
              description={
                hasFilters
                  ? "Try a different search term or clear the filters to see every role."
                  : "No roles were returned from Supabase."
              }
              actionLabel={hasFilters ? "Clear filters" : undefined}
              onAction={hasFilters ? clearFilters : undefined}
            />
          ) : (
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredRoles.map((role) => (
                <Card key={role.id} className="border-slate-200 shadow-none">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle>{role.name}</CardTitle>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{role.description ?? "No description available."}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge className={typeBadgeClass(role.isSystemRole)}>{role.isSystemRole ? "System" : "Custom"}</Badge>
                        <IconButton icon={<PenSquare size={18} />} label={`Edit ${role.name}`} onClick={() => openEditModal(role)} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Assigned users</span>
                      <span className="font-semibold text-slate-950 dark:text-slate-50">{role.assignedUserCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Access level</span>
                      <Badge className={accessBadgeClass(role.accessLevel)}>{role.accessLevel}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Created</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{formatDate(role.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddRoleModal
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingRole(null);
        }}
        onSaved={() => {
          refetch();
        }}
        role={editingRole}
        existingRoles={directoryRoles}
      />
    </div>
  );
}

function RolesGridSkeleton() {
  return (
    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index} className="border-slate-200 shadow-none">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-5 w-40 rounded bg-slate-100 dark:bg-zinc-800" />
                <div className="h-4 w-56 rounded bg-slate-100 dark:bg-zinc-800" />
              </div>
              <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-zinc-800" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-100 dark:bg-zinc-800" />
              <div className="h-4 w-10 rounded bg-slate-100 dark:bg-zinc-800" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-100 dark:bg-zinc-800" />
              <div className="h-6 w-32 rounded-full bg-slate-100 dark:bg-zinc-800" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-slate-100 dark:bg-zinc-800" />
              <div className="h-4 w-28 rounded bg-slate-100 dark:bg-zinc-800" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DirectoryEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-xroads-50 p-3 text-xroads-700 dark:bg-zinc-900 dark:text-xroads-200">
        <ShieldCheck size={22} />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button type="button" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function DirectoryErrorState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-rose-50 p-3 text-rose-700 dark:bg-zinc-900 dark:text-rose-300">
        <CircleAlert size={22} />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      </div>
      <Button type="button" variant="outline" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
