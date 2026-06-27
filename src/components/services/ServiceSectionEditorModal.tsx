import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Layers3, PencilLine } from "lucide-react";
import type { ServiceCategoryRecord, ServiceSectionRecord } from "../../data/services";
import { saveServiceSection, type ServiceSectionFormValues } from "../../features/services/services-service";
import { useToast } from "../shared/ToastProvider";
import { Button } from "../ui/Button";
import { CatalogField, CatalogModalShell } from "./CatalogModalShell";

const initialForm: ServiceSectionFormValues = {
  categoryId: "",
  name: "",
  description: "",
  sortOrder: "0",
  isActive: true,
};

export function ServiceSectionEditorModal({
  open,
  section,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  section: ServiceSectionRecord | null;
  categories: ServiceCategoryRecord[];
  onClose: () => void;
  onSaved: (section: ServiceSectionRecord) => void;
}) {
  const [form, setForm] = useState<ServiceSectionFormValues>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.isActive || category.id === section?.categoryId),
    [categories, section?.categoryId],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      section
        ? {
            categoryId: section.categoryId,
            name: section.name,
            description: section.description ?? "",
            sortOrder: String(section.sortOrder),
            isActive: section.isActive,
          }
        : {
            ...initialForm,
            categoryId: categoryOptions[0]?.id ?? "",
          },
    );
    setIsSaving(false);
  }, [categoryOptions, open, section]);

  function update<K extends keyof ServiceSectionFormValues>(key: K, value: ServiceSectionFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const result = await saveServiceSection(form, section?.id);
    setIsSaving(false);

    if (result.error || !result.data) {
      showToast({
        title: section ? "Section could not be updated" : "Section could not be created",
        description: result.error ?? "An unknown error occurred while saving the section.",
        variant: "error",
      });
      return;
    }

    onSaved(result.data);
    showToast({
      title: section ? "Section updated" : "Section created",
      description: `${result.data.name} is now available for service grouping.`,
      variant: "success",
    });
    onClose();
  }

  return (
    <CatalogModalShell
      open={open}
      onClose={onClose}
      icon={section ? <PencilLine size={20} /> : <Layers3 size={20} />}
      title={section ? "Edit section" : "Create section"}
      description="Sections provide optional, category-scoped sub-grouping within the service catalog."
      widthClass="max-w-2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form="service-section-form" disabled={isSaving || categoryOptions.length === 0}>
            {isSaving ? "Saving..." : section ? "Update section" : "Create section"}
          </Button>
        </div>
      }
    >
      <form id="service-section-form" onSubmit={handleSubmit} className="grid gap-5 p-5">
        <CatalogField label="Category">
          <select className="input" required value={form.categoryId} onChange={(event) => update("categoryId", event.target.value)}>
            <option value="">Select a category</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </CatalogField>
        <CatalogField label="Section name">
          <input className="input" required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Diagnostics" />
        </CatalogField>
        <CatalogField label="Description">
          <textarea className="input min-h-28 py-3" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Clarify which services should live under this section." />
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
