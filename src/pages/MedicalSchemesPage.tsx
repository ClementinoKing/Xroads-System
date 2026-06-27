import { useEffect, useMemo, useState } from "react";
import { Archive, ArchiveRestore, CircleAlert, PenSquare, Plus, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { IconButton } from "../components/ui/IconButton";
import { DataTable, type DataTableColumn } from "../components/shared/DataTable";
import { FilterField } from "../components/shared/Filters";
import { useToast } from "../components/shared/ToastProvider";
import { useAuth } from "../features/auth/auth-context";
import { MedicalSchemeEditorModal } from "../components/medical-schemes/MedicalSchemeEditorModal";
import {
  archiveMedicalScheme,
  restoreMedicalScheme,
  saveMedicalScheme,
  type MedicalSchemeFormValues,
  type MedicalSchemeRecord,
} from "../features/patients/medical-schemes-service";
import { useMedicalSchemesAdmin } from "../features/patients/use-medical-schemes-admin";
import { cn } from "../lib/utils";

type StatusFilter = "All" | "Active" | "Inactive" | "Archived";
type TypeFilter = "All" | "provider" | "plan";

const ADMIN_ROLE_IDS = new Set(["super_admin", "branch_admin"]);

const INITIAL_FORM_OPEN = false;

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, "MMM d, yyyy");
}

function getSchemeStatus(scheme: MedicalSchemeRecord) {
  if (scheme.deletedAt) {
    return "Archived" as const;
  }

  if (!scheme.isActive) {
    return "Inactive" as const;
  }

  return "Active" as const;
}

const columns: Array<DataTableColumn<MedicalSchemeRecord>> = [
  {
    key: "scheme",
    header: "Medical scheme",
    cell: (scheme) => (
      <div>
        <div className="font-semibold text-slate-950 dark:text-slate-50">{scheme.name}</div>
        <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{scheme.description ?? "No description provided"}</div>
      </div>
    ),
  },
  {
    key: "provider",
    header: "Provider",
    cell: (scheme) => scheme.providerName,
  },
  {
    key: "type",
    header: "Type",
    cell: (scheme) => (
      <Badge className="bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-700">
        {scheme.schemeType === "provider" ? "Provider" : "Plan"}
      </Badge>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (scheme) => {
      const status = getSchemeStatus(scheme);
      return (
        <Badge
          className={cn(
            "ring-1",
            status === "Active"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
              : status === "Inactive"
                ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20"
                : "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-zinc-900 dark:text-slate-300 dark:ring-zinc-700",
          )}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    key: "sort",
    header: "Sort",
    className: "w-20",
    cell: (scheme) => scheme.sortOrder,
  },
  {
    key: "updated",
    header: "Updated",
    cell: (scheme) => formatDate(scheme.updatedAt),
  },
];

export function MedicalSchemesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { schemes, isLoading, error, refetch } = useMedicalSchemesAdmin();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editorOpen, setEditorOpen] = useState(INITIAL_FORM_OPEN);
  const [editingScheme, setEditingScheme] = useState<MedicalSchemeRecord | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<MedicalSchemeRecord | null>(null);

  const canManage = ADMIN_ROLE_IDS.has(profile?.role_id ?? "");

  const filteredSchemes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return schemes.filter((scheme) => {
      const status = getSchemeStatus(scheme);
      const matchesSearch =
        !query ||
        [scheme.name, scheme.providerName, scheme.description ?? "", scheme.sourceUrl ?? ""].join(" ").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const matchesType = typeFilter === "All" || scheme.schemeType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [schemes, search, statusFilter, typeFilter]);

  const hasFilters = search.trim() !== "" || statusFilter !== "All" || typeFilter !== "All";

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);

  const metrics = useMemo(() => {
    const total = schemes.length;
    const active = schemes.filter((scheme) => getSchemeStatus(scheme) === "Active").length;
    const archived = schemes.filter((scheme) => getSchemeStatus(scheme) === "Archived").length;
    const providers = schemes.filter((scheme) => scheme.schemeType === "provider").length;

    return { total, active, archived, providers };
  }, [schemes]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
  }

  function openCreate() {
    setEditingScheme(null);
    setEditorOpen(true);
  }

  function openEdit(scheme: MedicalSchemeRecord) {
    setEditingScheme(scheme);
    setEditorOpen(true);
  }

  async function handleSave(values: MedicalSchemeFormValues, schemeId: string | null) {
    const result = await saveMedicalScheme(values, schemeId ?? undefined);

    if (result.error || !result.data) {
      return result.error ?? "We could not save this medical scheme.";
    }

    showToast({
      title: schemeId ? "Medical scheme updated" : "Medical scheme created",
      description: `${result.data.name} is now available in the directory.`,
      variant: "success",
    });
    refetch();
    return null;
  }

  async function handleArchiveToggle() {
    if (!archiveTarget) {
      return;
    }

    const result = archiveTarget.deletedAt ? await restoreMedicalScheme(archiveTarget.id) : await archiveMedicalScheme(archiveTarget.id);

    if (result.error || !result.data) {
      showToast({
        title: archiveTarget.deletedAt ? "Scheme could not be restored" : "Scheme could not be archived",
        description: result.error ?? "An unknown error occurred while updating the scheme.",
        variant: "error",
      });
      return;
    }

    showToast({
      title: archiveTarget.deletedAt ? "Medical scheme restored" : "Medical scheme archived",
      description: archiveTarget.deletedAt ? `${result.data.name} is active again.` : `${result.data.name} has been archived.`,
      variant: "info",
    });
    setArchiveTarget(null);
    refetch();
  }

  if (!canManage) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Medical schemes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Only administrators can manage the scheme directory.</p>
            <Button type="button" variant="outline" onClick={() => navigate("/settings")}>
              Back to settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            <ShieldCheck size={14} />
            Administration
          </div>
          <h1 className="page-title mt-2">Medical schemes</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage the verified Malawi medical scheme list used by patient intake.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/settings")}>
            Back to settings
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus size={18} />
            Add scheme
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          { label: "Total schemes", value: metrics.total },
          { label: "Active schemes", value: metrics.active },
          { label: "Providers", value: metrics.providers },
          { label: "Archived", value: metrics.archived },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-4 bg-slate-50/70 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-xroads-700 ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-xroads-300 dark:ring-zinc-800">
                <Search size={18} />
              </div>
              <div>
                <CardTitle>Search & filters</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {filteredSchemes.length} of {schemes.length} schemes shown
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
                  placeholder="Search scheme name, provider, or URL"
                />
              </div>
            </FilterField>
            <FilterField label="Type" className="lg:w-[220px]">
              <select className="input h-12 text-base lg:w-[220px]" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}>
                <option value="All">All types</option>
                <option value="provider">Providers</option>
                <option value="plan">Plans</option>
              </select>
            </FilterField>
            <FilterField label="Status" className="lg:w-[220px]">
              <select className="input h-12 text-base lg:w-[220px]" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Archived">Archived</option>
              </select>
            </FilterField>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <SchemesSkeleton />
          ) : error ? (
            <SchemesErrorState message={error} onRetry={refetch} />
          ) : (
            <DataTable
              rows={filteredSchemes}
              columns={[
                ...columns,
                {
                  key: "actions",
                  header: "Actions",
                  className: "w-28",
                  cell: (scheme) => (
                    <div className="flex items-center gap-2">
                      <IconButton icon={<PenSquare size={18} />} label={`Edit ${scheme.name}`} onClick={() => openEdit(scheme)} />
                      <IconButton
                        icon={scheme.deletedAt ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                        label={scheme.deletedAt ? `Restore ${scheme.name}` : `Archive ${scheme.name}`}
                        onClick={() => setArchiveTarget(scheme)}
                      />
                    </div>
                  ),
                },
              ]}
              getRowKey={(scheme) => scheme.id}
              minWidth="1180px"
              emptyTitle="No medical schemes found"
              emptyDescription="Try a different search term or reset the filters."
              pagination={{
                page,
                pageSize,
                onPageChange: setPage,
                onPageSizeChange: (nextPageSize) => {
                  setPageSize(nextPageSize);
                  setPage(1);
                },
                pageSizeOptions: [10, 20, 50],
                itemLabel: "medical schemes",
              }}
            />
          )}
        </CardContent>
      </Card>

      <MedicalSchemeEditorModal
        open={editorOpen}
        scheme={editingScheme}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />

      <ConfirmArchiveModal
        open={archiveTarget !== null}
        scheme={archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchiveToggle}
      />
    </div>
  );
}

function SchemesErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-rose-50 p-3 text-rose-700 dark:bg-zinc-900 dark:text-rose-300">
        <CircleAlert size={22} />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">Medical schemes could not be loaded</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      </div>
      <Button type="button" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function SchemesSkeleton() {
  return (
    <div className="space-y-0">
      <div className="grid grid-cols-[1.25fr_0.9fr_0.6fr_0.65fr_0.5fr_0.7fr_0.9fr] border-b border-slate-100 px-5 py-3 text-xs uppercase text-slate-400 dark:border-zinc-800 dark:text-slate-500">
        <span>Scheme</span>
        <span>Provider</span>
        <span>Type</span>
        <span>Status</span>
        <span>Sort</span>
        <span>Updated</span>
        <span>Actions</span>
      </div>
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="grid animate-pulse grid-cols-[1.25fr_0.9fr_0.6fr_0.65fr_0.5fr_0.7fr_0.9fr] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 dark:border-zinc-800"
        >
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-slate-100 dark:bg-zinc-800" />
            <div className="h-3 w-64 rounded bg-slate-100 dark:bg-zinc-800" />
          </div>
          <div className="h-4 w-28 rounded bg-slate-100 dark:bg-zinc-800" />
          <div className="h-7 w-20 rounded-full bg-slate-100 dark:bg-zinc-800" />
          <div className="h-7 w-20 rounded-full bg-slate-100 dark:bg-zinc-800" />
          <div className="h-4 w-10 rounded bg-slate-100 dark:bg-zinc-800" />
          <div className="h-4 w-24 rounded bg-slate-100 dark:bg-zinc-800" />
          <div className="flex gap-2">
            <div className="h-9 w-20 rounded-lg bg-slate-100 dark:bg-zinc-800" />
            <div className="h-9 w-24 rounded-lg bg-slate-100 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfirmArchiveModal({
  open,
  scheme,
  onClose,
  onConfirm,
}: {
  open: boolean;
  scheme: MedicalSchemeRecord | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open || !scheme) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-neutral-900" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{scheme.deletedAt ? "Restore scheme" : "Archive scheme"}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {scheme.deletedAt
              ? `Restore ${scheme.name} so it becomes available again in the patient selector.`
              : `Archive ${scheme.name} so it no longer appears in the active patient selector.`}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            {scheme.deletedAt ? "Restore" : "Archive"}
          </Button>
        </div>
      </div>
    </div>
  );
}
