import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CircleAlert, HeartPulse, PencilLine } from "lucide-react";
import type { DentalService, ServiceCategoryRecord, ServicePriceListRecord, ServiceSectionRecord } from "../../data/services";
import { useServiceCatalogOptions } from "../../features/services/use-service-catalog-options";
import { saveServiceRecord, type ServiceFormValues, type ServicePriceFormValue } from "../../features/services/services-service";
import { useToast } from "../shared/ToastProvider";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Switch } from "../ui/switch";
import { CatalogField, CatalogModalShell } from "./CatalogModalShell";

type ServiceForm = ServiceFormValues;

const initialForm: ServiceForm = {
  serviceCode: "",
  name: "",
  description: "",
  duration: "30",
  categoryId: "",
  sectionId: "",
  sortOrder: "0",
  active: true,
  prices: [],
};

function buildPriceRows(priceLists: ServicePriceListRecord[], service?: DentalService | null): ServicePriceFormValue[] {
  return priceLists.map((priceList) => {
    const existing = service?.prices.find((price) => price.priceListId === priceList.id);

    return {
      priceListId: priceList.id,
      amount: existing ? String(existing.amount) : "",
      pricingUnit: existing?.pricingUnit ?? "per procedure",
      notes: existing?.notes ?? "",
      isActive: existing?.isActive ?? true,
    };
  });
}

function buildForm(priceLists: ServicePriceListRecord[], service?: DentalService | null): ServiceForm {
  if (!service) {
    return {
      ...initialForm,
      prices: buildPriceRows(priceLists, null),
    };
  }

  return {
    serviceCode: service.serviceCode,
    name: service.name,
    description: service.description,
    duration: String(service.defaultDurationMinutes || service.duration),
    categoryId: service.categoryId,
    sectionId: service.sectionId ?? "",
    sortOrder: String(service.sortOrder),
    active: service.active,
    prices: buildPriceRows(priceLists, service),
  };
}

export function AddServiceModal({
  open,
  service,
  categories: providedCategories,
  sections: providedSections,
  priceLists: providedPriceLists,
  onClose,
  onSaved,
}: {
  open: boolean;
  service?: DentalService | null;
  categories?: ServiceCategoryRecord[];
  sections?: ServiceSectionRecord[];
  priceLists?: ServicePriceListRecord[];
  onClose: () => void;
  onSaved: (service: DentalService) => void;
}) {
  const [form, setForm] = useState<ServiceForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const { categories: loadedCategories, sections: loadedSections, priceLists: loadedPriceLists, isLoading, error } = useServiceCatalogOptions(
    open && (!providedCategories || !providedSections || !providedPriceLists),
  );

  const categories = providedCategories ?? loadedCategories;
  const sections = providedSections ?? loadedSections;
  const priceLists = providedPriceLists ?? loadedPriceLists;

  const activeSections = useMemo(
    () =>
      sections.filter((section) => {
        if (!form.categoryId) {
          return false;
        }

        if (section.id === service?.sectionId) {
          return true;
        }

        return section.categoryId === form.categoryId && section.isActive;
      }),
    [form.categoryId, sections, service?.sectionId],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(buildForm(priceLists, service));
    setIsSaving(false);
  }, [open, priceLists, service]);

  function update<K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updatePrice(priceListId: string, patch: Partial<ServicePriceFormValue>) {
    setForm((current) => ({
      ...current,
      prices: current.prices.map((price) => (price.priceListId === priceListId ? { ...price, ...patch } : price)),
    }));
  }

  async function submitService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!categories.length) {
      showToast({
        title: "Create a category first",
        description: "The catalog needs at least one active category before a service can be saved.",
        variant: "warning",
      });
      return;
    }

    setIsSaving(true);
    const result = await saveServiceRecord(form, service?.id);
    setIsSaving(false);

    if (result.error || !result.data) {
      showToast({
        title: service ? "Service could not be updated" : "Service could not be created",
        description: result.error ?? "An unknown error occurred while saving the service.",
        variant: "error",
      });
      return;
    }

    onSaved(result.data);
    showToast({
      title: service ? "Service updated" : "Service created",
      description: `${result.data.name} has been saved to the catalog.`,
      variant: "success",
    });
    onClose();
  }

  const categoryOptions = categories.filter((category) => category.isActive || category.id === service?.categoryId);
  const hasCategoryOptions = categoryOptions.length > 0;
  const hasPriceLists = priceLists.length > 0;

  return (
    <CatalogModalShell
      open={open}
      onClose={onClose}
      icon={service ? <PencilLine size={20} /> : <HeartPulse size={20} />}
      title={service ? "Edit service" : "Create service"}
      description={service ? "Update service details, classification, and pricing." : "Add a service to the clinic catalog with pricing and routing details."}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {hasPriceLists ? "Pricing entries are optional and can be left blank until the service goes live." : "Create a price list later to start attaching billable rates."}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" form="service-editor-form" disabled={isSaving || isLoading || !hasCategoryOptions}>
              {isSaving ? "Saving..." : service ? "Update service" : "Create service"}
            </Button>
          </div>
        </div>
      }
    >
      <form id="service-editor-form" onSubmit={submitService} className="space-y-6 p-5">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {!hasCategoryOptions ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
            Create at least one active category before adding services.
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <CatalogField label="Service name">
            <input className="input" required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Routine cleaning" />
          </CatalogField>
          <CatalogField label="Service code" hint={service ? undefined : "Used for integrations and internal lookups. Letters, numbers, and dashes are safest."}>
            <input className="input" value={form.serviceCode} onChange={(event) => update("serviceCode", event.target.value)} placeholder="routine-cleaning" />
          </CatalogField>
          <CatalogField label="Category">
            <select
              className="input"
              required
              value={form.categoryId}
              onChange={(event) => {
                const nextCategoryId = event.target.value;
                const sectionStillValid = sections.some((section) => section.id === form.sectionId && section.categoryId === nextCategoryId);
                setForm((current) => ({
                  ...current,
                  categoryId: nextCategoryId,
                  sectionId: sectionStillValid ? current.sectionId : "",
                }));
              }}
            >
              <option value="">Select a category</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </CatalogField>
          <CatalogField label="Section" hint={service ? undefined : "Optional sub-grouping within the selected category."}>
            <select className="input" value={form.sectionId} onChange={(event) => update("sectionId", event.target.value)}>
              <option value="">No section</option>
              {activeSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </CatalogField>
          <CatalogField label="Default duration (minutes)">
            <input className="input" required type="number" min={10} max={240} step={5} value={form.duration} onChange={(event) => update("duration", event.target.value)} placeholder="30" />
          </CatalogField>
          <CatalogField label="Sort order" hint={service ? undefined : "Lower numbers rise to the top of service lists."}>
            <input className="input" required type="number" min={0} step={1} value={form.sortOrder} onChange={(event) => update("sortOrder", event.target.value)} placeholder="0" />
          </CatalogField>
          <CatalogField label="Status">
            <label className="inline-flex h-[52px] items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-200">
              <span>{form.active ? "Active" : "Inactive"}</span>
              <Switch checked={form.active} onCheckedChange={(checked) => update("active", checked)} aria-label="Toggle service status" />
            </label>
          </CatalogField>
          <CatalogField label="Description">
            <input
              className="input lg:col-span-2"
              required
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Describe what this service includes, when it is used, and any clinical notes staff should understand."
            />
          </CatalogField>
        </div>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">Pricing</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage billable prices by price list. Blank amounts are treated as not configured.</p>
            </div>
            <Badge className="bg-white text-slate-600 ring-slate-200 dark:bg-neutral-900 dark:text-slate-300 dark:ring-neutral-700">
              {form.prices.filter((price) => price.amount.trim()).length} configured
            </Badge>
          </div>

          {!hasPriceLists ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-400">
              No price lists are available yet. Save the service now, then create a price list from the Services page to add billing rates.
            </div>
          ) : (
            <div className="space-y-3">
              {priceLists.map((priceList) => {
                const price = form.prices.find((item) => item.priceListId === priceList.id);

                if (!price) {
                  return null;
                }

                return (
                  <div key={priceList.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="font-semibold text-slate-950 dark:text-slate-50">{priceList.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {priceList.currencyCode} · Effective {priceList.effectiveFrom}
                          {priceList.effectiveTo ? ` to ${priceList.effectiveTo}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
                        <CircleAlert size={14} />
                        {priceList.isActive ? "Active list" : "Inactive list"}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-4">
                      <CatalogField label="Amount">
                        <input
                          className="input"
                          type="number"
                          min={0}
                          step="0.01"
                          value={price.amount}
                          onChange={(event) => updatePrice(priceList.id, { amount: event.target.value })}
                          placeholder="0.00"
                        />
                      </CatalogField>
                      <CatalogField label="Pricing unit">
                        <input
                          className="input"
                          value={price.pricingUnit}
                          onChange={(event) => updatePrice(priceList.id, { pricingUnit: event.target.value })}
                          placeholder="per procedure"
                        />
                      </CatalogField>
                      <CatalogField label="Notes">
                        <input
                          className="input"
                          value={price.notes}
                          onChange={(event) => updatePrice(priceList.id, { notes: event.target.value })}
                          placeholder="Optional billing note"
                        />
                      </CatalogField>
                      <CatalogField label="Status">
                        <label className="inline-flex h-[52px] w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-200">
                          <span>{price.isActive ? "Active" : "Inactive"}</span>
                          <Switch checked={price.isActive} onCheckedChange={(checked) => updatePrice(priceList.id, { isActive: checked })} aria-label={`Toggle ${priceList.name} price status`} />
                        </label>
                      </CatalogField>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </form>
    </CatalogModalShell>
  );
}
