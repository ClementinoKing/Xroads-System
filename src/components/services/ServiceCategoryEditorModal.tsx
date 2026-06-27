import { useEffect, useState, type FormEvent } from "react";
import { FolderTree, PencilLine } from "lucide-react";
import type { ServiceCategoryRecord } from "../../data/services";
import { saveServiceCategory, type ServiceCategoryFormValues } from "../../features/services/services-service";
import { useToast } from "../shared/ToastProvider";
import { Button } from "../ui/Button";
import { CatalogField, CatalogModalShell } from "./CatalogModalShell";

const initialForm: ServiceCategoryFormValues = {
  name: "",
  description: "",
  sortOrder: "0",
  isActive: true,
};

export function ServiceCategoryEditorModal({
  open,
  category,
  onClose,
  onSaved,
}: {
  open: boolean;
  category: ServiceCategoryRecord | null;
  onClose: () => void;
  onSaved: (category: ServiceCategoryRecord) => void;
}) {
  const [form, setForm] = useState<ServiceCategoryFormValues>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      category
        ? {
            name: category.name,
            description: category.description ?? "",
            sortOrder: String(category.sortOrder),
            isActive: category.isActive,
          }
        : initialForm,
    );
    setIsSaving(false);
  }, [category, open]);

  function update<K extends keyof ServiceCategoryFormValues>(key: K, value: ServiceCategoryFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const result = await saveServiceCategory(form, category?.id);
    setIsSaving(false);

    if (result.error || !result.data) {
      showToast({
        title: category ? "Category could not be updated" : "Category could not be created",
        description: result.error ?? "An unknown error occurred while saving the category.",
        variant: "error",
      });
      return;
    }

    onSaved(result.data);
    showToast({
      title: category ? "Category updated" : "Category created",
      description: `${result.data.name} is now available in the service catalog.`,
      variant: "success",
    });
    onClose();
  }

  return (
    <CatalogModalShell
      open={open}
      onClose={onClose}
      icon={category ? <PencilLine size={20} /> : <FolderTree size={20} />}
      title={category ? "Edit category" : "Create category"}
      description="Categories organize the top level of the service catalog."
      widthClass="max-w-2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form="service-category-form" disabled={isSaving}>
            {isSaving ? "Saving..." : category ? "Update category" : "Create category"}
          </Button>
        </div>
      }
    >
      <form id="service-category-form" onSubmit={handleSubmit} className="grid gap-5 p-5">
        <CatalogField label="Category name">
          <input className="input" required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Preventive" />
        </CatalogField>
        <CatalogField label="Description">
          <textarea className="input min-h-28 py-3" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Explain how this category should be used across the clinic." />
        </CatalogField>
        <div className="grid gap-5 sm:grid-cols-2">
          <CatalogField label="Sort order">
            <input className="input" required type="number" min={0} step={1} value={form.sortOrder} onChange={(event) => update("sortOrder", event.target.value)} />
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
