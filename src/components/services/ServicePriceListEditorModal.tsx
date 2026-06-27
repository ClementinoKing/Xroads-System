import { useEffect, useState, type FormEvent } from "react";
import { BadgeDollarSign, PencilLine } from "lucide-react";
import type { ServicePriceListRecord } from "../../data/services";
import { saveServicePriceList, type ServicePriceListFormValues } from "../../features/services/services-service";
import { useToast } from "../shared/ToastProvider";
import { Button } from "../ui/Button";
import { CatalogField, CatalogModalShell } from "./CatalogModalShell";

const initialForm: ServicePriceListFormValues = {
  name: "",
  description: "",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: "",
  currencyCode: "MWK",
  isActive: true,
};

export function ServicePriceListEditorModal({
  open,
  priceList,
  onClose,
  onSaved,
}: {
  open: boolean;
  priceList: ServicePriceListRecord | null;
  onClose: () => void;
  onSaved: (priceList: ServicePriceListRecord) => void;
}) {
  const [form, setForm] = useState<ServicePriceListFormValues>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      priceList
        ? {
            name: priceList.name,
            description: priceList.description ?? "",
            effectiveFrom: priceList.effectiveFrom,
            effectiveTo: priceList.effectiveTo ?? "",
            currencyCode: priceList.currencyCode,
            isActive: priceList.isActive,
          }
        : initialForm,
    );
    setIsSaving(false);
  }, [open, priceList]);

  function update<K extends keyof ServicePriceListFormValues>(key: K, value: ServicePriceListFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const result = await saveServicePriceList(form, priceList?.id);
    setIsSaving(false);

    if (result.error || !result.data) {
      showToast({
        title: priceList ? "Price list could not be updated" : "Price list could not be created",
        description: result.error ?? "An unknown error occurred while saving the price list.",
        variant: "error",
      });
      return;
    }

    onSaved(result.data);
    showToast({
      title: priceList ? "Price list updated" : "Price list created",
      description: `${result.data.name} is now available for service pricing.`,
      variant: "success",
    });
    onClose();
  }

  return (
    <CatalogModalShell
      open={open}
      onClose={onClose}
      icon={priceList ? <PencilLine size={20} /> : <BadgeDollarSign size={20} />}
      title={priceList ? "Edit price list" : "Create price list"}
      description="Price lists let the clinic maintain rates over time without mutating historical catalog setup."
      widthClass="max-w-2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form="service-price-list-form" disabled={isSaving}>
            {isSaving ? "Saving..." : priceList ? "Update price list" : "Create price list"}
          </Button>
        </div>
      }
    >
      <form id="service-price-list-form" onSubmit={handleSubmit} className="grid gap-5 p-5">
        <CatalogField label="Price list name">
          <input className="input" required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="2026 Standard Tariff" />
        </CatalogField>
        <CatalogField label="Description">
          <textarea className="input min-h-28 py-3" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Explain when this price list is used and who owns it." />
        </CatalogField>
        <div className="grid gap-5 sm:grid-cols-2">
          <CatalogField label="Effective from">
            <input className="input" required type="date" value={form.effectiveFrom} onChange={(event) => update("effectiveFrom", event.target.value)} />
          </CatalogField>
          <CatalogField label="Effective to" hint="Leave blank if this list is open-ended.">
            <input className="input" type="date" value={form.effectiveTo} onChange={(event) => update("effectiveTo", event.target.value)} />
          </CatalogField>
          <CatalogField label="Currency code">
            <input className="input uppercase" required maxLength={3} value={form.currencyCode} onChange={(event) => update("currencyCode", event.target.value.toUpperCase())} placeholder="MWK" />
          </CatalogField>
          <CatalogField label="Status">
            <select className="input" value={form.isActive ? "active" : "inactive"} onChange={(event) => update("isActive", event.target.value === "active")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </CatalogField>
        </div>
      </form>
    </CatalogModalShell>
  );
}
