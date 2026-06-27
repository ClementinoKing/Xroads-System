import { useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Search, ShieldCheck, WalletCards } from "lucide-react";
import { ServiceAdminOnlyState } from "../components/services/ServiceAdminOnlyState";
import { ServicePriceListEditorModal } from "../components/services/ServicePriceListEditorModal";
import { DataTable } from "../components/shared/DataTable";
import { FilterField } from "../components/shared/Filters";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import type { ServicePriceListRecord } from "../data/services";
import { useAuth } from "../features/auth/auth-context";
import { canManageServiceCatalog } from "../features/services/catalog-admin";
import { buildPriceListRows, createPriceListColumns } from "../features/services/catalog-display";
import { useServiceCatalog } from "../features/services/use-service-catalog";

type StatusFilter = "All" | "Active" | "Inactive";

export function ServicePriceListsPage() {
  const { profile } = useAuth();
  const { priceLists, services, isLoading, error, refetch } = useServiceCatalog();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [priceListModalOpen, setPriceListModalOpen] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<ServicePriceListRecord | null>(null);

  const canManage = canManageServiceCatalog(profile?.role_id);

  const rows = useMemo(() => buildPriceListRows(priceLists, services), [priceLists, services]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((priceList) => {
      const statusMatch = statusFilter === "All" || (statusFilter === "Active" ? priceList.isActive : !priceList.isActive);
      const queryMatch =
        !query ||
        [priceList.name, priceList.description ?? "", priceList.currencyCode, priceList.effectiveFrom, priceList.effectiveTo ?? ""].join(" ").toLowerCase().includes(query);

      return statusMatch && queryMatch;
    });
  }, [rows, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const metrics = useMemo(
    () => ({
      totalPriceLists: priceLists.length,
      activePriceLists: priceLists.filter((priceList) => priceList.isActive).length,
      linkedServices: services.filter((service) => service.prices.length > 0).length,
      currencies: new Set(priceLists.map((priceList) => priceList.currencyCode)).size,
    }),
    [priceLists, services],
  );

  const columns = useMemo(
    () =>
      createPriceListColumns({
        onEdit: (priceList) => {
          setEditingPriceList(priceList);
          setPriceListModalOpen(true);
        },
      }),
    [],
  );

  const hasFilters = search.trim().length > 0 || statusFilter !== "All";

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
  }

  if (!canManage) {
    return <ServiceAdminOnlyState title="Price lists" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            <ShieldCheck size={14} />
            Services
          </div>
          <h1 className="page-title mt-2">Price lists</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Maintain the pricing schedules that services can reference so billing changes over time remain controlled and auditable.
          </p>
        </div>
        <Button type="button" onClick={() => setPriceListModalOpen(true)}>
          <Plus size={18} />
          Add price list
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total price lists", value: metrics.totalPriceLists },
          { label: "Active price lists", value: metrics.activePriceLists },
          { label: "Services priced", value: metrics.linkedServices },
          { label: "Currencies", value: metrics.currencies },
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
                <WalletCards size={18} />
              </div>
              <div>
                <CardTitle>Price list registry</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {filteredRows.length} of {rows.length} price lists shown
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" className="h-10 w-full px-3 lg:w-auto" onClick={clearFilters} disabled={!hasFilters}>
              <RotateCcw size={16} />
              Reset
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <FilterField label="Search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={19} />
                <input
                  className="input h-12 pl-11 text-base"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search price list, currency, or effective date"
                />
              </div>
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
              getRowKey={(priceList) => priceList.id}
              emptyTitle={hasFilters ? "No matching price lists" : "No price lists"}
              emptyDescription={
                hasFilters ? "Try a different search term or clear the filters to see all price lists." : "Create a price list so services can carry billable rates over time."
              }
              minWidth="980px"
              pagination={{
                page,
                pageSize,
                onPageChange: setPage,
                onPageSizeChange: setPageSize,
                itemLabel: "price lists",
              }}
            />
          )}
          {isLoading ? <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500 dark:border-neutral-800 dark:text-slate-400">Loading price lists…</div> : null}
        </CardContent>
      </Card>

      <ServicePriceListEditorModal
        open={priceListModalOpen}
        priceList={editingPriceList}
        onClose={() => {
          setPriceListModalOpen(false);
          setEditingPriceList(null);
        }}
        onSaved={() => {
          refetch();
        }}
      />
    </div>
  );
}
