import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BadgeDollarSign, Clock3, FolderTree, HeartPulse, Layers3, PenSquare, ShieldCheck, Trash2 } from "lucide-react";
import { AddServiceModal } from "../components/services/AddServiceModal";
import { ConfirmDeleteServiceModal } from "../components/services/ConfirmDeleteServiceModal";
import { PageLoader } from "../components/shared/PageLoader";
import { useToast } from "../components/shared/ToastProvider";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import type { DentalService } from "../data/services";
import { useAuth } from "../features/auth/auth-context";
import { canManageServiceCatalog } from "../features/services/catalog-admin";
import { catalogStatusClass, formatCatalogDate, formatCatalogMoney } from "../features/services/catalog-display";
import { loadServiceCatalogOptions, loadServiceRecord, deleteServiceRecord } from "../features/services/services-service";
import type { ServiceCategoryRecord, ServicePriceListRecord, ServiceSectionRecord } from "../data/services";
import { cn } from "../lib/utils";

export function ServiceDetailPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [service, setService] = useState<DentalService | null>(null);
  const [categories, setCategories] = useState<ServiceCategoryRecord[]>([]);
  const [sections, setSections] = useState<ServiceSectionRecord[]>([]);
  const [priceLists, setPriceLists] = useState<ServicePriceListRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = canManageServiceCatalog(profile?.role_id);

  async function loadPage() {
    if (!serviceId) {
      setService(null);
      setError("The requested service could not be found.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const [serviceResult, optionsResult] = await Promise.all([loadServiceRecord(serviceId), loadServiceCatalogOptions()]);

    setService(serviceResult.data);
    setError(serviceResult.error ?? optionsResult.error);
    setCategories(optionsResult.data.categories);
    setSections(optionsResult.data.sections);
    setPriceLists(optionsResult.data.priceLists);
    setIsLoading(false);
  }

  useEffect(() => {
    void loadPage();
  }, [serviceId]);

  const metrics = useMemo(() => {
    if (!service) {
      return null;
    }

    const activePrice = service.prices.find((price) => price.isActive) ?? service.prices[0] ?? null;

    return {
      duration: `${service.defaultDurationMinutes} min`,
      pricing: activePrice ? formatCatalogMoney(activePrice.amount, activePrice.currencyCode) : "No active price",
      priceList: activePrice ? activePrice.priceListName : "Not assigned",
    };
  }, [service]);

  async function handleDelete() {
    if (!service) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteServiceRecord(service.id);
    setIsDeleting(false);

    if (result.error || !result.data) {
      showToast({
        title: "Service could not be archived",
        description: result.error ?? "An unknown error occurred while archiving the service.",
        variant: "error",
      });
      return;
    }

    showToast({
      title: "Service archived",
      description: `${service.name} has been archived.`,
      variant: "success",
    });
    navigate("/services");
  }

  if (isLoading) {
    return <PageLoader />;
  }

  if (!service) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Service unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">{error ?? "The requested service could not be found."}</p>
            <Button type="button" variant="outline" onClick={() => navigate("/services")}>
              <ArrowLeft size={16} />
              Back to service catalog
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button type="button" variant="outline" className="w-fit" onClick={() => navigate("/services")}>
            <ArrowLeft size={16} />
            Back to service catalog
          </Button>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
              <ShieldCheck size={14} />
              Service detail
            </div>
            <h1 className="page-title mt-2">{service.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span>{service.serviceCode}</span>
              <span>•</span>
              <span>Sort {service.sortOrder}</span>
              <span>•</span>
              <span>Updated {formatCatalogDate(service.updatedAt)}</span>
            </div>
          </div>
        </div>

        {canManage ? (
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setEditorOpen(true)}>
              <PenSquare size={18} />
              Edit service
            </Button>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={18} />
              Archive
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={HeartPulse} label="Status" value={service.active ? "Active" : "Inactive"} badgeClass={catalogStatusClass(service.active)} />
        <MetricCard icon={Clock3} label="Default duration" value={metrics?.duration ?? "—"} />
        <MetricCard icon={BadgeDollarSign} label="Current pricing" value={metrics?.pricing ?? "—"} />
        <MetricCard icon={FolderTree} label="Category" value={service.category} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Service overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">Description</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{service.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailBlock icon={FolderTree} label="Category" value={service.category} />
              <DetailBlock icon={Layers3} label="Section" value={service.sectionName ?? "No section assigned"} />
              <DetailBlock icon={Clock3} label="Duration" value={`${service.defaultDurationMinutes} minutes`} />
              <DetailBlock icon={ShieldCheck} label="Status" value={service.active ? "Active" : "Inactive"} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Record metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetaRow label="Created" value={formatCatalogDate(service.createdAt)} />
            <MetaRow label="Updated" value={formatCatalogDate(service.updatedAt)} />
            <MetaRow label="Price list" value={metrics?.priceList ?? "Not assigned"} />
            <MetaRow label="Source" value={String(service.metadata.source ?? "Manual")} />
            <MetaRow label="Effective from" value={String(service.metadata.effective_from ?? "—")} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {service.prices.length === 0 ? (
            <div className="p-5 text-sm text-slate-500 dark:text-slate-400">No pricing has been configured for this service yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Price list</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Unit</th>
                    <th className="px-5 py-3">Window</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {service.prices.map((price) => (
                    <tr key={price.id}>
                      <td className="px-5 py-4 font-medium text-slate-950 dark:text-slate-50">{price.priceListName}</td>
                      <td className="px-5 py-4">{formatCatalogMoney(price.amount, price.currencyCode)}</td>
                      <td className="px-5 py-4">{price.pricingUnit}</td>
                      <td className="px-5 py-4">
                        {price.effectiveFrom}
                        {price.effectiveTo ? ` to ${price.effectiveTo}` : " onward"}
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={cn("ring-1", catalogStatusClass(price.isActive))}>{price.isActive ? "Active" : "Inactive"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {canManage ? (
        <>
          <AddServiceModal
            open={editorOpen}
            service={service}
            categories={categories}
            sections={sections}
            priceLists={priceLists}
            onClose={() => setEditorOpen(false)}
            onSaved={(savedService) => {
              setService(savedService);
              setEditorOpen(false);
              showToast({
                title: "Service updated",
                description: `${savedService.name} has been updated.`,
                variant: "success",
              });
            }}
          />

          <ConfirmDeleteServiceModal
            open={deleteOpen}
            service={service}
            isDeleting={isDeleting}
            onClose={() => setDeleteOpen(false)}
            onConfirm={() => {
              void handleDelete();
            }}
          />
        </>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  badgeClass,
}: {
  icon: typeof HeartPulse;
  label: string;
  value: string;
  badgeClass?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <Icon size={16} className="text-xroads-500" />
        </div>
        <div className="mt-3">
          {badgeClass ? <Badge className={cn("ring-1", badgeClass)}>{value}</Badge> : <p className="text-xl font-semibold text-slate-950 dark:text-slate-50">{value}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof HeartPulse;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Icon size={14} />
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-slate-950 dark:text-slate-50">{value}</div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm last:border-b-0 last:pb-0 dark:border-neutral-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-950 dark:text-slate-50">{value}</span>
    </div>
  );
}
