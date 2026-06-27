import type { MouseEvent } from "react";
import { format } from "date-fns";
import { PenSquare, Trash2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { IconButton } from "../../components/ui/IconButton";
import type { DataTableColumn } from "../../components/shared/DataTable";
import type { DentalService, ServiceCategoryRecord, ServicePriceListRecord, ServiceSectionRecord } from "../../data/services";
import { cn } from "../../lib/utils";

export type ServiceCategoryTableRow = ServiceCategoryRecord & {
  serviceCount: number;
  sectionCount: number;
};

export type ServiceSectionTableRow = ServiceSectionRecord & {
  serviceCount: number;
};

export type ServicePriceListTableRow = ServicePriceListRecord & {
  linkedServices: number;
};

export function formatCatalogDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, "MMM d, yyyy");
}

export function formatCatalogMoney(amount: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export function catalogStatusClass(active: boolean) {
  return active
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
    : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-300 dark:ring-zinc-700";
}

export function catalogStatusLabel(active: boolean) {
  return active ? "Active" : "Inactive";
}

export function getPrimaryServicePrice(service: DentalService) {
  return service.prices.find((price) => price.isActive) ?? service.prices[0] ?? null;
}

export function buildCategoryRows(
  categories: ServiceCategoryRecord[],
  sections: ServiceSectionRecord[],
  services: DentalService[],
): ServiceCategoryTableRow[] {
  return categories.map((category) => ({
    ...category,
    serviceCount: services.filter((service) => service.categoryId === category.id).length,
    sectionCount: sections.filter((section) => section.categoryId === category.id).length,
  }));
}

export function buildSectionRows(sections: ServiceSectionRecord[], services: DentalService[]): ServiceSectionTableRow[] {
  return sections.map((section) => ({
    ...section,
    serviceCount: services.filter((service) => service.sectionId === section.id).length,
  }));
}

export function buildPriceListRows(priceLists: ServicePriceListRecord[], services: DentalService[]): ServicePriceListTableRow[] {
  return priceLists.map((priceList) => ({
    ...priceList,
    linkedServices: services.filter((service) => service.prices.some((price) => price.priceListId === priceList.id)).length,
  }));
}

export function createServiceColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (service: DentalService, event: MouseEvent<HTMLButtonElement>) => void;
  onDelete: (service: DentalService, event: MouseEvent<HTMLButtonElement>) => void;
}): Array<DataTableColumn<DentalService>> {
  return [
    {
      key: "code",
      header: "Code",
      className: "w-[104px] whitespace-nowrap",
      cell: (service) => <span className="font-medium text-slate-700 dark:text-slate-200">{service.serviceCode}</span>,
    },
    {
      key: "service",
      header: "Service",
      className: "w-[320px]",
      cell: (service) => (
        <span title={service.name} className="block max-w-[320px] truncate font-semibold text-slate-950 dark:text-slate-50">
          {service.name}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      className: "w-[180px]",
      cell: (service) => <span title={service.category} className="block truncate text-slate-600 dark:text-slate-300">{service.category}</span>,
    },
    {
      key: "pricing",
      header: "Pricing",
      className: "w-[170px]",
      cell: (service) => {
        const primaryPrice = getPrimaryServicePrice(service);

        return (
          <span className="block whitespace-nowrap font-medium text-slate-950 dark:text-slate-50">
            {primaryPrice ? formatCatalogMoney(primaryPrice.amount, primaryPrice.currencyCode) : "No price"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-[118px]",
      cell: (service) => (
        <div className="flex justify-end gap-2">
          <IconButton icon={<PenSquare size={18} />} label={`Edit ${service.name}`} onClick={(event) => onEdit(service, event)} />
          <IconButton icon={<Trash2 size={18} />} label={`Archive ${service.name}`} onClick={(event) => onDelete(service, event)} />
        </div>
      ),
    },
  ];
}

export function createCategoryColumns({
  onEdit,
}: {
  onEdit: (category: ServiceCategoryTableRow) => void;
}): Array<DataTableColumn<ServiceCategoryTableRow>> {
  return [
    {
      key: "name",
      header: "Category",
      cell: (category) => (
        <div>
          <div className="font-semibold text-slate-950 dark:text-slate-50">{category.name}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{category.description ?? "No description provided"}</div>
        </div>
      ),
    },
    {
      key: "coverage",
      header: "Coverage",
      cell: (category) => (
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {category.serviceCount} services · {category.sectionCount} sections
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (category) => <Badge className={cn("ring-1", catalogStatusClass(category.isActive))}>{catalogStatusLabel(category.isActive)}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-[72px]",
      cell: (category) => (
        <div className="flex justify-end">
          <IconButton icon={<PenSquare size={18} />} label={`Edit ${category.name}`} onClick={() => onEdit(category)} />
        </div>
      ),
    },
  ];
}

export function createSectionColumns({
  onEdit,
}: {
  onEdit: (section: ServiceSectionTableRow) => void;
}): Array<DataTableColumn<ServiceSectionTableRow>> {
  return [
    {
      key: "name",
      header: "Section",
      cell: (section) => (
        <div>
          <div className="font-semibold text-slate-950 dark:text-slate-50">{section.name}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{section.categoryName}</div>
        </div>
      ),
    },
    {
      key: "services",
      header: "Services",
      cell: (section) => section.serviceCount,
    },
    {
      key: "status",
      header: "Status",
      cell: (section) => <Badge className={cn("ring-1", catalogStatusClass(section.isActive))}>{catalogStatusLabel(section.isActive)}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-[72px]",
      cell: (section) => (
        <div className="flex justify-end">
          <IconButton icon={<PenSquare size={18} />} label={`Edit ${section.name}`} onClick={() => onEdit(section)} />
        </div>
      ),
    },
  ];
}

export function createPriceListColumns({
  onEdit,
}: {
  onEdit: (priceList: ServicePriceListTableRow) => void;
}): Array<DataTableColumn<ServicePriceListTableRow>> {
  return [
    {
      key: "name",
      header: "Price list",
      cell: (priceList) => (
        <div>
          <div className="font-semibold text-slate-950 dark:text-slate-50">{priceList.name}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{priceList.description ?? "No description provided"}</div>
        </div>
      ),
    },
    {
      key: "window",
      header: "Effective window",
      cell: (priceList) => (
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {priceList.effectiveFrom}
          {priceList.effectiveTo ? ` to ${priceList.effectiveTo}` : " onward"}
        </div>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      cell: (priceList) => priceList.currencyCode,
    },
    {
      key: "coverage",
      header: "Linked services",
      cell: (priceList) => priceList.linkedServices,
    },
    {
      key: "status",
      header: "Status",
      cell: (priceList) => <Badge className={cn("ring-1", catalogStatusClass(priceList.isActive))}>{catalogStatusLabel(priceList.isActive)}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-[72px]",
      cell: (priceList) => (
        <div className="flex justify-end">
          <IconButton icon={<PenSquare size={18} />} label={`Edit ${priceList.name}`} onClick={() => onEdit(priceList)} />
        </div>
      ),
    },
  ];
}
