import { useEffect, useMemo, useState } from "react";
import { Layers3, Plus, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { ServiceAdminOnlyState } from "../components/services/ServiceAdminOnlyState";
import { ServiceSectionEditorModal } from "../components/services/ServiceSectionEditorModal";
import { DataTable } from "../components/shared/DataTable";
import { FilterField } from "../components/shared/Filters";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import type { ServiceSectionRecord } from "../data/services";
import { useAuth } from "../features/auth/auth-context";
import { canManageServiceCatalog } from "../features/services/catalog-admin";
import { buildSectionRows, createSectionColumns } from "../features/services/catalog-display";
import { useServiceCatalog } from "../features/services/use-service-catalog";

type StatusFilter = "All" | "Active" | "Inactive";

export function ServiceSectionsPage() {
  const { profile } = useAuth();
  const { categories, sections, services, isLoading, error, refetch } = useServiceCatalog();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ServiceSectionRecord | null>(null);

  const canManage = canManageServiceCatalog(profile?.role_id);

  const rows = useMemo(() => buildSectionRows(sections, services), [sections, services]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((section) => {
      const statusMatch = statusFilter === "All" || (statusFilter === "Active" ? section.isActive : !section.isActive);
      const categoryMatch = categoryFilter === "All" || section.categoryId === categoryFilter;
      const queryMatch = !query || [section.name, section.categoryName, section.description ?? ""].join(" ").toLowerCase().includes(query);

      return statusMatch && categoryMatch && queryMatch;
    });
  }, [categoryFilter, rows, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter]);

  const metrics = useMemo(
    () => ({
      totalSections: sections.length,
      activeSections: sections.filter((section) => section.isActive).length,
      categoriesCovered: new Set(sections.map((section) => section.categoryId)).size,
      linkedServices: services.filter((service) => service.sectionId).length,
    }),
    [sections, services],
  );

  const columns = useMemo(
    () =>
      createSectionColumns({
        onEdit: (section) => {
          setEditingSection(section);
          setSectionModalOpen(true);
        },
      }),
    [],
  );

  const hasFilters = search.trim().length > 0 || statusFilter !== "All" || categoryFilter !== "All";

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
  }

  if (!canManage) {
    return <ServiceAdminOnlyState title="Sections" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            <ShieldCheck size={14} />
            Services
          </div>
          <h1 className="page-title mt-2">Sections</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Manage the optional sub-groupings within each category so the service catalog stays structured and easy to navigate.
          </p>
        </div>
        <Button type="button" onClick={() => setSectionModalOpen(true)} disabled={categories.length === 0}>
          <Plus size={18} />
          Add section
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total sections", value: metrics.totalSections },
          { label: "Active sections", value: metrics.activeSections },
          { label: "Categories covered", value: metrics.categoriesCovered },
          { label: "Services assigned", value: metrics.linkedServices },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-slate-50">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-4 bg-slate-50/70 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-xroads-700 ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-xroads-300 dark:ring-zinc-800">
                <Layers3 size={18} />
              </div>
              <div>
                <CardTitle>Section registry</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {filteredRows.length} of {rows.length} sections shown
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" className="h-10 w-full px-3 lg:w-auto" onClick={clearFilters} disabled={!hasFilters}>
              <RotateCcw size={16} />
              Reset
            </Button>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_220px_220px]">
            <FilterField label="Search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={19} />
                <input
                  className="input h-12 pl-11 text-base"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search section name, category, or description"
                />
              </div>
            </FilterField>
            <FilterField label="Category">
              <select className="input h-12 text-base" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="All">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Status">
              <select className="input h-12 text-base" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </FilterField>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error ? (
            <div className="p-5">
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                {error}
              </div>
            </div>
          ) : (
            <DataTable
              rows={filteredRows}
              columns={columns}
              getRowKey={(section) => section.id}
              emptyTitle={hasFilters ? "No matching sections" : "No sections"}
              emptyDescription={
                hasFilters ? "Try a different search term or clear the filters to see all sections." : "Create sections when categories need more granular grouping."
              }
              minWidth="760px"
              pagination={{
                page,
                pageSize,
                onPageChange: setPage,
                onPageSizeChange: setPageSize,
                itemLabel: "sections",
              }}
            />
          )}
          {isLoading ? <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500 dark:border-neutral-800 dark:text-slate-400">Loading sections…</div> : null}
        </CardContent>
      </Card>

      <ServiceSectionEditorModal
        open={sectionModalOpen}
        section={editingSection}
        categories={categories}
        onClose={() => {
          setSectionModalOpen(false);
          setEditingSection(null);
        }}
        onSaved={() => {
          refetch();
        }}
      />
    </div>
  );
}
