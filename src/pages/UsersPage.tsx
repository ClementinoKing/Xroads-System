import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { CalendarDays, CircleAlert, Eye, PenSquare, Plus, RotateCcw, Search, Trash2, UserCircle2 } from "lucide-react";
import { AddUserModal } from "../components/users/AddUserModal";
import { ConfirmDeleteUserModal } from "../components/users/ConfirmDeleteUserModal";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { FilterField } from "../components/shared/Filters";
import { IconButton } from "../components/ui/IconButton";
import { TablePagination } from "../components/shared/TablePagination";
import { useToast } from "../components/shared/ToastProvider";
import { useAuth } from "../features/auth/auth-context";
import { deleteStaffAccount } from "../features/staff/staff-admin-service";
import { useRoles } from "../features/staff/use-roles";
import { useUsers } from "../features/staff/use-users";
import type { StaffUser } from "../features/staff/staff-directory-service";
import { getBranchBadgeClass } from "../lib/branch-badges";

type UserStatusFilter = "All" | StaffUser["status"];

function formatDate(value: string) {
  const parsed = parseISO(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return format(parsed, "MMM d, yyyy");
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

function roleBadgeClass(accessLevel: string) {
  if (/full access/i.test(accessLevel)) {
    return "bg-xroads-50 text-xroads-700 ring-xroads-200 dark:bg-zinc-900 dark:text-xroads-200 dark:ring-zinc-700";
  }

  if (/operational access/i.test(accessLevel)) {
    return "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-zinc-900 dark:text-sky-200 dark:ring-zinc-700";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-700";
}

export function UsersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { profile } = useAuth();
  const { users, isLoading, error, refetch } = useUsers();
  const { roles } = useRoles();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const canManageUsers = profile?.role_id === "super_admin" || profile?.role_id === "branch_admin";

  const directoryUsers = useMemo(() => {
    return [...users].sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return directoryUsers.filter((user) => {
      const statusMatch = statusFilter === "All" || user.status === statusFilter;
      const queryMatch =
        !query ||
        [user.fullName, user.email, user.roleName, user.branchName ?? "", user.department ?? ""].join(" ").toLowerCase().includes(query);

      return statusMatch && queryMatch;
    });
  }, [directoryUsers, search, statusFilter]);

  const hasFilters = search.trim().length > 0 || statusFilter !== "All";

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
  }

  const isEmpty = !isLoading && !error && filteredUsers.length === 0;
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);

  async function handleDeleteUser() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteStaffAccount(deleteTarget.id);

      if (result.error || !result.data) {
        showToast({
          title: "User could not be deleted",
          description: result.error ?? "An unknown error occurred while deleting the user.",
          variant: "error",
        });
        return;
      }

      showToast({
        title: "User deleted",
        description: `${deleteTarget.fullName} has been removed.`,
        variant: "success",
      });
      setDeleteTarget(null);
      refetch();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Manage staff accounts, assignments, and access status.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus size={17} />
          Add user
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4 bg-slate-50/70 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-xroads-700 ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-xroads-300 dark:ring-zinc-800">
                <UserCircle2 size={18} />
              </div>
              <div>
                <CardTitle>Staff accounts</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {filteredUsers.length} of {directoryUsers.length} users shown
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
                  placeholder="Search by name, email, role, branch, or department"
                />
              </div>
            </FilterField>
            <FilterField label="Status" className="lg:w-[220px]">
              <select className="input h-12 text-base lg:w-[220px]" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as UserStatusFilter)}>
                <option value="All">All statuses</option>
                <option value="active">Active</option>
                <option value="invited">Invited</option>
                <option value="suspended">Suspended</option>
              </select>
            </FilterField>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto p-0">
          {isLoading ? (
            <UsersTableSkeleton showActions={canManageUsers} />
          ) : error ? (
            <DirectoryErrorState
              title="Users could not be loaded"
              message={error}
              actionLabel="Try again"
              onAction={refetch}
            />
          ) : isEmpty ? (
            <DirectoryEmptyState
              title={hasFilters ? "No matching users" : "No users found"}
              description={
                hasFilters
                  ? "Try a different search term or clear the filters to see every staff account."
                  : "No staff accounts were returned from Supabase."
              }
              actionLabel={hasFilters ? "Clear filters" : undefined}
              onAction={hasFilters ? clearFilters : undefined}
            />
          ) : (
            <>
              <table className={`w-full text-left text-sm ${canManageUsers ? "min-w-[1040px]" : "min-w-[920px]"}`}>
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500 dark:text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Org / department</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">{canManageUsers ? "Actions" : "Profile"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="transition hover:bg-slate-50 dark:hover:bg-zinc-900/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-xroads-500 text-sm font-bold text-white">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                          ) : (
                            user.initials
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-slate-50">{user.fullName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={roleBadgeClass(user.accessLevel)}>{user.roleName}</Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{user.accessLevel}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {user.branchName ? (
                        <Badge className={`${getBranchBadgeClass(user.branchName)} px-2 py-0.5 text-[11px] font-semibold`}>
                          {user.branchName}
                        </Badge>
                      ) : (
                        user.department ?? "Unassigned"
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge className={statusBadgeClass(user.status)}>{statusLabel(user.status)}</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={14} className="shrink-0" />
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </td>
                      <td className="px-5 py-4">
                      {canManageUsers ? (
                        <div className="flex flex-wrap gap-2">
                          <IconButton icon={<Eye size={18} />} label={`Open ${user.fullName} profile`} onClick={() => navigate(`/users/${user.id}`)} />
                          <IconButton icon={<PenSquare size={18} />} label={`Edit ${user.fullName}`} onClick={() => setEditTarget(user)} />
                          <IconButton icon={<Trash2 size={18} />} label={`Delete ${user.fullName}`} onClick={() => setDeleteTarget(user)} />
                        </div>
                      ) : (
                        <Button type="button" variant="outline" className="h-9 px-3 text-xs" onClick={() => navigate(`/users/${user.id}`)}>
                          View profile
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
              <TablePagination
                totalItems={filteredUsers.length}
                page={safePage}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  setPage(1);
                }}
                pageSizeOptions={[10, 20, 50]}
                itemLabel="users"
              />
            </>
          )}
        </CardContent>
      </Card>

      <AddUserModal
        open={createOpen || editTarget !== null}
        onClose={() => {
          setCreateOpen(false);
          setEditTarget(null);
        }}
        onCreated={() => void refetch()}
        existingEmails={directoryUsers.map((user) => user.email)}
        roles={roles}
        user={editTarget}
      />
      <ConfirmDeleteUserModal
        open={deleteTarget !== null}
        user={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteUser()}
      />
    </div>
  );
}

function UsersTableSkeleton({ showActions }: { showActions: boolean }) {
  return (
    <div className="space-y-0">
      <div
        className={`grid border-b border-slate-100 px-5 py-3 text-xs uppercase text-slate-400 dark:border-zinc-800 dark:text-slate-500 ${showActions ? "grid-cols-[1.45fr_0.95fr_0.9fr_0.65fr_0.75fr_0.85fr]" : "grid-cols-[1.45fr_0.95fr_0.9fr_0.65fr_0.75fr_0.65fr]"}`}
      >
        <span>User</span>
        <span>Role</span>
        <span>Org / department</span>
        <span>Status</span>
        <span>Created</span>
        <span>{showActions ? "Actions" : "Profile"}</span>
      </div>
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className={`grid animate-pulse items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 dark:border-zinc-800 ${showActions ? "grid-cols-[1.45fr_0.95fr_0.9fr_0.65fr_0.75fr_0.85fr]" : "grid-cols-[1.45fr_0.95fr_0.9fr_0.65fr_0.75fr_0.65fr]"}`}
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-slate-100 dark:bg-zinc-800" />
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-slate-100 dark:bg-zinc-800" />
              <div className="h-3 w-48 rounded bg-slate-100 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="h-6 w-28 rounded-full bg-slate-100 dark:bg-zinc-800" />
          <div className="h-4 w-28 rounded bg-slate-100 dark:bg-zinc-800" />
          <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-zinc-800" />
          <div className="h-4 w-24 rounded bg-slate-100 dark:bg-zinc-800" />
          <div className="h-9 w-32 rounded-md bg-slate-100 dark:bg-zinc-800" />
        </div>
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
        <UserCircle2 size={22} />
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
