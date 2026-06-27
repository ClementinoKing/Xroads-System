import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleAlert, FolderTree, HeartPulse, Plus, RotateCcw, Search, ShieldCheck, Tag, WalletCards } from "lucide-react";
import { AddServiceModal } from "../components/services/AddServiceModal";
import { ConfirmDeleteServiceModal } from "../components/services/ConfirmDeleteServiceModal";
import { ServiceAdminOnlyState } from "../components/services/ServiceAdminOnlyState";
import { DataTable } from "../components/shared/DataTable";
import { FilterField } from "../components/shared/Filters";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import type { DentalService } from "../data/services";
import { useAuth } from "../features/auth/auth-context";
import { canManageServiceCatalog } from "../features/services/catalog-admin";
import { createServiceColumns } from "../features/services/catalog-display";
import { useServiceCatalog } from "../features/services/use-service-catalog";
import { deleteServiceRecord } from "../features/services/services-service";

type StatusFilter = "All" | "Active" | "Inactive";

export function ServicesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { services, categories, sections, priceLists, isLoading, error, refetch } = useServiceCatalog();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DentalService | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DentalService | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = canManageServiceCatalog(profile?.role_id);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services.filter((service) => {
      const statusMatch = statusFilter === "All" || (statusFilter === "Active" ? service.active : !service.active);
      const categoryMatch = categoryFilter === "All" || service.categoryId === categoryFilter;
      const sectionMatch = sectionFilter === "All" || service.sectionId === sectionFilter;
      const queryMatch =
        !query ||
        [
          service.serviceCode,
          service.name,
          service.description,
          service.category,
          service.sectionName ?? "",
          String(service.duration),
          ...service.prices.map((price) => [price.priceListName, price.pricingUnit, price.notes ?? "", String(price.amount)].join(" ")),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return statusMatch && categoryMatch && sectionMatch && queryMatch;
    });
  }, [categoryFilter, search, sectionFilter, services, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter, sectionFilter]);

  const metrics = useMemo(() => {
    const activeServices = services.filter((service) => service.active).length;
    const activeCategories = categories.filter((category) => category.isActive).length;
    const activePriceLists = priceLists.filter((priceList) => priceList.isActive).length;
    const pricedServices = services.filter((service) => service.prices.some((price) => price.isActive)).length;

    return {
      totalServices: services.length,
      activeServices,
      activeCategories,
      activePriceLists,
      pricedServices,
    };
  }, [categories, priceLists, services]);

  const serviceColumns = useMemo(
    () =>
      createServiceColumns({
        onEdit: (service, event) => {
          event.stopPropagation();
          setEditTarget(service);
        },
        onDelete: (service, event) => {
          event.stopPropagation();
          setDeleteTarget(service);
        },
      }),
    [],
  );

  const hasFilters = search.trim().length > 0 || statusFilter !== "All" || categoryFilter !== "All" || sectionFilter !== "All";

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setSectionFilter("All");
  }

  async function handleDeleteService() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteServiceRecord(deleteTarget.id);

      if (result.error || !result.data) {
        return;
      }

      setDeleteTarget(null);
      refetch();
    } finally {
      setIsDeleting(false);
    }
  }

  if (!canManage) {
    return <ServiceAdminOnlyState title="Services" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            <ShieldCheck size={14} />
            Administration
          </div>
          <h1 className="page-title mt-2">Service catalog</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Manage the clinic’s live service catalog, including the codes, routing, and price coverage used during billing.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => navigate("/services/categories")}>
            <FolderTree size={18} />
            Categories
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/services/sections")}>
            <Tag size={18} />
            Sections
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/services/price-lists")}>
            <WalletCards size={18} />
            Price lists
          </Button>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={18} />
            Create service
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {[
          { label: "Total services", value: metrics.totalServices, icon: HeartPulse },
          { label: "Active services", value: metrics.activeServices, icon: HeartPulse },
          { label: "Active categories", value: metrics.activeCategories, icon: FolderTree },
          { label: "Active price lists", value: metrics.activePriceLists, icon: WalletCards },
          { label: "Priced services", value: metrics.pricedServices, icon: CircleAlert },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
                <item.icon size={16} className="text-xroads-500" />
              </div>
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
                <HeartPulse size={18} />
              </div>
              <div>
                <CardTitle>Catalog records</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {filteredServices.length} of {services.length} services shown
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" className="h-10 w-full px-3 lg:w-auto" onClick={clearFilters} disabled={!hasFilters}>
              <RotateCcw size={16} />
              Reset
            </Button>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_220px_220px_220px]">
            <FilterField label="Search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={19} />
                <input
                  className="input h-12 pl-11 text-base"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search service, section, price list, or code"
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
            <FilterField label="Section">
              <select className="input h-12 text-base" value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
                <option value="All">All sections</option>
                {sections
                  .filter((section) => categoryFilter === "All" || section.categoryId === categoryFilter)
                  .map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
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
              rows={filteredServices}
              columns={serviceColumns}
              getRowKey={(service) => service.id}
              minWidth="100%"
              tableClassName="table-fixed"
              emptyTitle={hasFilters ? "No matching services" : "No services found"}
              emptyDescription={
                hasFilters ? "Try a different search term or clear the filters to see the full catalog." : "Create your first service to start building the live clinic catalog."
              }
              onRowClick={(service) => navigate(`/services/${service.id}`)}
              pagination={{
                page,
                pageSize,
                onPageChange: setPage,
                onPageSizeChange: setPageSize,
                itemLabel: "services",
              }}
            />
          )}
          {isLoading ? <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500 dark:border-neutral-800 dark:text-slate-400">Loading catalog…</div> : null}
        </CardContent>
      </Card>

      <AddServiceModal
        open={createOpen || editTarget !== null}
        service={editTarget}
        categories={categories}
        sections={sections}
        priceLists={priceLists}
        onClose={() => {
          setCreateOpen(false);
          setEditTarget(null);
        }}
        onSaved={() => {
          refetch();
        }}
      />

      <ConfirmDeleteServiceModal
        open={deleteTarget !== null}
        service={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleDeleteService();
        }}
      />
    </div>
  );
}
