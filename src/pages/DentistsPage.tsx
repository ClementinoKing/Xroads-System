import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, CircleAlert, Plus, Search, Stethoscope } from "lucide-react";
import { AddDentistModal } from "../components/dentists/AddDentistModal";
import { UserProfileModal } from "../components/users/UserProfileModal";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { getBranchBadgeClass } from "../lib/branch-badges";
import { getFriendlyPalette } from "../lib/color-palettes";
import { useUsers } from "../features/staff/use-users";
import type { StaffUser } from "../features/staff/staff-directory-service";

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

export function DentistsPage() {
  const { users, isLoading, error, refetch } = useUsers();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState<StaffUser | null>(null);

  const dentistUsers = useMemo(() => {
    return users
      .filter((user) => user.roleAppointmentMarker === "Dentist" || user.roleId === "dentist")
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [users]);

  const isEmpty = !isLoading && !error && dentistUsers.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="page-title">Dentists</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Live dentist profiles from the staff directory.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={18} />
          Create dentist
        </Button>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-xroads-700 ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-xroads-300 dark:ring-zinc-800">
              <Stethoscope size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Dentist users</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {dentistUsers.length} dentist{dentistUsers.length === 1 ? "" : "s"} found
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-400 md:flex">
            <Search size={16} />
            <span>Filtered from staff accounts</span>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <DentistGridSkeleton />
          ) : error ? (
            <DentistState
              title="Dentists could not be loaded"
              description={error}
              actionLabel="Try again"
              onAction={refetch}
              icon={<CircleAlert size={22} />}
              tone="error"
            />
          ) : isEmpty ? (
            <DentistState
              title="No dentist users found"
              description="Create a staff account with the Dentist role to have it appear here."
              actionLabel="Create dentist"
              onAction={() => setCreateOpen(true)}
              icon={<Stethoscope size={22} />}
            />
          ) : (
            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">
              {dentistUsers.map((dentist) => (
                <Card
                  key={dentist.id}
                  className={`relative overflow-hidden border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${getFriendlyPalette(dentist.id).card}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 ${getFriendlyPalette(dentist.id).accent}`} />
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl ${getFriendlyPalette(dentist.id).avatar}`}>
                      {dentist.avatarUrl ? (
                        <img src={dentist.avatarUrl} alt={dentist.fullName} className="h-full w-full object-cover" />
                      ) : (
                        dentist.initials
                      )}
                    </div>
                    <Badge className={`${statusBadgeClass(dentist.status)} px-2.5 py-1 text-xs`}>{statusLabel(dentist.status)}</Badge>
                  </div>

                  <h2 className="mt-4 text-base font-semibold text-slate-950 dark:text-slate-50">{dentist.fullName}</h2>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">{dentist.email}</p>

                  <div className="mt-4 space-y-2.5 text-sm">
                    <Row
                      label="Branch"
                      value={
                        dentist.branchName ? (
                          <Badge className={`${getBranchBadgeClass(dentist.branchName)} px-2 py-0.5 text-[11px] font-semibold`}>
                            {dentist.branchName}
                          </Badge>
                        ) : (
                          dentist.department ?? "Unassigned"
                        )
                      }
                    />
                  </div>

                  <Button variant="outline" className="mt-4 h-10 w-full" onClick={() => setSelectedDentist(dentist)}>
                    View profile
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddDentistModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={() => {
          setCreateOpen(false);
          refetch();
        }}
      />

      <UserProfileModal open={selectedDentist !== null} user={selectedDentist} onClose={() => setSelectedDentist(null)} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="min-w-0 max-w-[60%] text-right text-sm text-slate-700 dark:text-slate-200">{value}</div>
    </div>
  );
}

function DentistState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  tone = "default",
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon: ReactNode;
  tone?: "default" | "error";
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className={tone === "error" ? "rounded-full bg-rose-50 p-3 text-rose-700 dark:bg-zinc-900 dark:text-rose-300" : "rounded-full bg-xroads-50 p-3 text-xroads-700 dark:bg-zinc-900 dark:text-xroads-200"}>
        {icon}
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

function DentistGridSkeleton() {
  return (
    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index} className="relative overflow-hidden border p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="absolute inset-x-0 top-0 h-1 bg-slate-200 dark:bg-zinc-800" />
          <div className="animate-pulse">
            <div className="flex items-start justify-between gap-3">
              <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-zinc-800" />
              <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-zinc-800" />
            </div>

            <div className="mt-4 h-5 w-32 rounded bg-slate-100 dark:bg-zinc-800" />
            <div className="mt-2 h-4 w-48 rounded bg-slate-100 dark:bg-zinc-800" />

            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="h-3 w-12 rounded bg-slate-200 dark:bg-zinc-700" />
                <div className="h-4 w-28 rounded bg-slate-100 dark:bg-zinc-800" />
              </div>
            </div>

            <div className="mt-5 h-10 w-full rounded-md border border-slate-100 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-950" />
          </div>
        </Card>
      ))}
    </div>
  );
}
