import { format, parseISO } from "date-fns";
import { Building2, CircleAlert, LoaderCircle, RotateCcw } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useBranches } from "../features/branches/use-branches";
import { getFriendlyPalette } from "../lib/color-palettes";

function formatDate(value: string) {
  const parsed = parseISO(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return format(parsed, "MMM d, yyyy");
}

function statusBadgeClass(status: "open" | "closed") {
  return status === "open"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-zinc-900 dark:text-emerald-200 dark:ring-zinc-700"
    : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-700";
}

export function BranchesPage() {
  const { branches, isLoading, error, refetch } = useBranches();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Branches</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Operational snapshot for branch records and assigned staff.</p>
      </div>

      {isLoading ? (
        <BranchesSkeleton />
      ) : error ? (
        <BranchesErrorState message={error} onRetry={refetch} />
      ) : branches.length === 0 ? (
        <BranchesEmptyState />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {branches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} />
          ))}
        </div>
      )}
    </div>
  );
}

function BranchCard({ branch }: { branch: { id: string; name: string; address: string; status: "open" | "closed"; staffCount: number; activeStaffCount: number; dentistCount: number; branchAdminCount: number; receptionistCount: number; createdAt: string; hours?: string | null } }) {
  const palette = getFriendlyPalette(branch.id);

  return (
    <Card className={`relative overflow-hidden border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${palette.card}`}>
      <div className={`absolute inset-x-0 top-0 h-1 ${palette.accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-3 ${palette.avatar}`}>
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">{branch.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{branch.address}</p>
          </div>
        </div>
        <Badge className={statusBadgeClass(branch.status)}>{branch.status === "open" ? "Open" : "Closed"}</Badge>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Metric label="Assigned staff" value={branch.staffCount} palette={palette} />
        <Metric label="Active staff" value={branch.activeStaffCount} palette={palette} />
        <Metric label="Dentists" value={branch.dentistCount} palette={palette} />
        <Metric label="Branch admins" value={branch.branchAdminCount} palette={palette} />
      </div>

      <div className={`mt-6 grid gap-3 rounded-2xl border p-4 sm:grid-cols-2 ${palette.panel}`}>
        <InfoRow label="Receptionists" value={branch.receptionistCount.toString()} palette={palette} />
        <InfoRow label="Created" value={formatDate(branch.createdAt)} palette={palette} />
      </div>

      <p className={`mt-5 rounded-2xl border p-3 text-sm ${palette.panel}`}>{branch.hours ?? "No operating hours available."}</p>
    </Card>
  );
}

function Metric({
  label,
  value,
  palette,
}: {
  label: string;
  value: number;
  palette: { panel: string };
}) {
  return (
    <div className={`rounded-xl border p-4 backdrop-blur ${palette.panel}`}>
      <p className="text-2xl font-bold text-slate-950 dark:text-slate-50">{value}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{label}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: { panel: string };
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

function BranchesSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {Array.from({ length: 2 }, (_, index) => (
        <Card key={index} className="relative overflow-hidden border p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="absolute inset-x-0 top-0 h-1 bg-slate-200 dark:bg-zinc-800" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-zinc-800" />
              <div className="space-y-2">
                <div className="h-5 w-40 rounded bg-slate-100 dark:bg-zinc-800" />
                <div className="h-4 w-52 rounded bg-slate-100 dark:bg-zinc-800" />
              </div>
            </div>
            <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-zinc-800" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }, (_, metricIndex) => (
              <div key={metricIndex} className="rounded-lg border border-slate-100 p-4 dark:border-slate-800">
                <div className="h-8 w-12 rounded bg-slate-100 dark:bg-zinc-800" />
                <div className="mt-3 h-4 w-20 rounded bg-slate-100 dark:bg-zinc-800" />
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 rounded-md bg-slate-50 p-4 dark:bg-slate-900 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-slate-100 dark:bg-zinc-800" />
              <div className="h-4 w-16 rounded bg-slate-100 dark:bg-zinc-800" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-slate-100 dark:bg-zinc-800" />
              <div className="h-4 w-24 rounded bg-slate-100 dark:bg-zinc-800" />
            </div>
          </div>

          <div className="mt-5 h-16 rounded-md bg-slate-100 dark:bg-zinc-800" />
        </Card>
      ))}
    </div>
  );
}

function BranchesEmptyState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <div className="rounded-full bg-xroads-50 p-3 text-xroads-700 dark:bg-zinc-900 dark:text-xroads-200">
        <Building2 size={22} />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">No branches found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Supabase returned no branch records for the current account.</p>
      </div>
    </div>
  );
}

function BranchesErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <div className="rounded-full bg-rose-50 p-3 text-rose-700 dark:bg-zinc-900 dark:text-rose-300">
        <CircleAlert size={22} />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">Branches could not be loaded</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      </div>
      <Button type="button" variant="outline" onClick={onRetry}>
        <RotateCcw size={16} />
        Try again
      </Button>
    </div>
  );
}
