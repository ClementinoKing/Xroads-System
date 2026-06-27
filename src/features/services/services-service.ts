import type {
  DentalService,
  ServiceCatalog,
  ServiceCategoryRecord,
  ServicePriceListRecord,
  ServicePriceRecord,
  ServiceSectionRecord,
} from "../../data/services";
import { supabase } from "../../lib/supabase";
import { isNetworkErrorMessage, toConnectivityError } from "../../lib/network-errors";

type ServiceRow = {
  id: string;
  service_code: string;
  name: string;
  description: string;
  duration_minutes: number;
  default_duration_minutes: number | null;
  category: string;
  category_id: string;
  section_id: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ServiceCategoryRow = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ServiceSectionRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ServicePriceListRow = {
  id: string;
  name: string;
  description: string | null;
  effective_from: string;
  effective_to: string | null;
  currency_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ServicePriceRow = {
  id: string;
  service_id: string;
  price_list_id: string;
  amount: number | string;
  pricing_unit: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ServiceInsertRow = {
  service_code: string;
  name: string;
  description: string;
  duration_minutes: number;
  default_duration_minutes: number;
  category_id: string;
  section_id: string | null;
  sort_order: number;
  is_active: boolean;
  metadata?: Record<string, unknown>;
};

type ServiceCategoryInsertRow = {
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

type ServiceSectionInsertRow = {
  category_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

type ServicePriceListInsertRow = {
  name: string;
  description: string | null;
  effective_from: string;
  effective_to: string | null;
  currency_code: string;
  is_active: boolean;
};

type ServicePriceUpsertRow = {
  service_id: string;
  price_list_id: string;
  amount: number;
  pricing_unit: string;
  notes: string | null;
  is_active: boolean;
};

export type ServicePriceFormValue = {
  priceListId: string;
  amount: string;
  pricingUnit: string;
  notes: string;
  isActive: boolean;
};

export type ServiceFormValues = {
  serviceCode: string;
  name: string;
  description: string;
  duration: string;
  categoryId: string;
  sectionId: string;
  sortOrder: string;
  active: boolean;
  prices: ServicePriceFormValue[];
};

export type ServiceCategoryFormValues = {
  name: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
};

export type ServiceSectionFormValues = {
  categoryId: string;
  name: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
};

export type ServicePriceListFormValues = {
  name: string;
  description: string;
  effectiveFrom: string;
  effectiveTo: string;
  currencyCode: string;
  isActive: boolean;
};

type Result<T> = {
  data: T;
  error: string | null;
};

type CatalogLookups = {
  categories: ServiceCategoryRecord[];
  sections: ServiceSectionRecord[];
  priceLists: ServicePriceListRecord[];
  categoryMap: Map<string, ServiceCategoryRecord>;
  sectionMap: Map<string, ServiceSectionRecord>;
  priceListMap: Map<string, ServicePriceListRecord>;
};

function toFriendlyError(message: string) {
  if (isNetworkErrorMessage(message)) {
    return toConnectivityError("load or save service records");
  }

  if (/permission denied|row-level security|not authorized/i.test(message)) {
    return "You do not have permission to view or edit service records.";
  }

  if (/relation .* does not exist/i.test(message) || /could not find the table/i.test(message)) {
    return "The service catalog tables are missing from Supabase. Apply the latest service migration first.";
  }

  return `We could not load service records right now. ${message}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

function mapCategoryRow(row: ServiceCategoryRow): ServiceCategoryRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPriceListRow(row: ServicePriceListRow): ServicePriceListRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    currencyCode: row.currency_code,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSectionRow(row: ServiceSectionRow, categoryMap: Map<string, ServiceCategoryRecord>): ServiceSectionRecord {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: categoryMap.get(row.category_id)?.name ?? "Unassigned",
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPriceRow(row: ServicePriceRow, priceListMap: Map<string, ServicePriceListRecord>): ServicePriceRecord | null {
  const priceList = priceListMap.get(row.price_list_id);

  if (!priceList) {
    return null;
  }

  return {
    id: row.id,
    serviceId: row.service_id,
    priceListId: row.price_list_id,
    priceListName: priceList.name,
    currencyCode: priceList.currencyCode,
    effectiveFrom: priceList.effectiveFrom,
    effectiveTo: priceList.effectiveTo,
    amount: toNumber(row.amount),
    pricingUnit: row.pricing_unit,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapServiceRow(
  row: ServiceRow,
  categoryMap: Map<string, ServiceCategoryRecord>,
  sectionMap: Map<string, ServiceSectionRecord>,
  pricesByServiceId: Map<string, ServicePriceRecord[]>,
): DentalService {
  return {
    id: row.id,
    serviceCode: row.service_code,
    name: row.name,
    description: row.description,
    duration: row.default_duration_minutes ?? row.duration_minutes,
    defaultDurationMinutes: row.default_duration_minutes ?? row.duration_minutes,
    category: categoryMap.get(row.category_id)?.name ?? row.category,
    categoryId: row.category_id,
    sectionId: row.section_id,
    sectionName: row.section_id ? sectionMap.get(row.section_id)?.name ?? null : null,
    sortOrder: row.sort_order,
    active: row.is_active,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    prices: pricesByServiceId.get(row.id) ?? [],
  };
}

function buildCategoryMap(rows: ServiceCategoryRow[]) {
  const categories = rows.map(mapCategoryRow);
  return {
    categories,
    categoryMap: new Map(categories.map((category) => [category.id, category])),
  };
}

async function loadCatalogLookups(): Promise<Result<CatalogLookups>> {
  const [categoriesResult, sectionsResult, priceListsResult] = await Promise.all([
    supabase
      .from("service_categories")
      .select("id, name, description, sort_order, is_active, created_at, updated_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("service_sections")
      .select("id, category_id, name, description, sort_order, is_active, created_at, updated_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("service_price_lists")
      .select("id, name, description, effective_from, effective_to, currency_code, is_active, created_at, updated_at")
      .order("is_active", { ascending: false })
      .order("effective_from", { ascending: false })
      .order("name", { ascending: true }),
  ]);

  if (categoriesResult.error) {
    return { data: null as never, error: toFriendlyError(categoriesResult.error.message) };
  }

  if (sectionsResult.error) {
    return { data: null as never, error: toFriendlyError(sectionsResult.error.message) };
  }

  if (priceListsResult.error) {
    return { data: null as never, error: toFriendlyError(priceListsResult.error.message) };
  }

  const { categories, categoryMap } = buildCategoryMap((categoriesResult.data as ServiceCategoryRow[] | null) ?? []);
  const sections = ((sectionsResult.data as ServiceSectionRow[] | null) ?? []).map((row) => mapSectionRow(row, categoryMap));
  const priceLists = ((priceListsResult.data as ServicePriceListRow[] | null) ?? []).map(mapPriceListRow);

  return {
    data: {
      categories,
      sections,
      priceLists,
      categoryMap,
      sectionMap: new Map(sections.map((section) => [section.id, section])),
      priceListMap: new Map(priceLists.map((priceList) => [priceList.id, priceList])),
    },
    error: null,
  };
}

async function loadServiceRows(serviceId?: string): Promise<Result<ServiceRow[]>> {
  let query = supabase
    .from("services")
    .select(
      "id, service_code, name, description, duration_minutes, default_duration_minutes, category, category_id, section_id, sort_order, is_active, metadata, created_at, updated_at, deleted_at",
    )
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (serviceId) {
    query = query.eq("id", serviceId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [] as ServiceRow[], error: toFriendlyError(error.message) };
  }

  return { data: (data as ServiceRow[] | null) ?? [], error: null };
}

async function loadServicePriceRows(serviceId?: string): Promise<Result<ServicePriceRow[]>> {
  let query = supabase
    .from("service_prices")
    .select("id, service_id, price_list_id, amount, pricing_unit, notes, is_active, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (serviceId) {
    query = query.eq("service_id", serviceId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [] as ServicePriceRow[], error: toFriendlyError(error.message) };
  }

  return { data: (data as ServicePriceRow[] | null) ?? [], error: null };
}

function buildPricesByServiceId(rows: ServicePriceRow[], priceListMap: Map<string, ServicePriceListRecord>) {
  const pricesByServiceId = new Map<string, ServicePriceRecord[]>();

  rows.forEach((row) => {
    const mapped = mapPriceRow(row, priceListMap);

    if (!mapped) {
      return;
    }

    const current = pricesByServiceId.get(row.service_id) ?? [];
    current.push(mapped);
    pricesByServiceId.set(row.service_id, current);
  });

  pricesByServiceId.forEach((prices, serviceId) => {
    pricesByServiceId.set(
      serviceId,
      [...prices].sort((left, right) => {
        if (left.isActive !== right.isActive) {
          return left.isActive ? -1 : 1;
        }

        return right.effectiveFrom.localeCompare(left.effectiveFrom);
      }),
    );
  });

  return pricesByServiceId;
}

export async function loadServiceRecord(serviceId: string): Promise<Result<DentalService | null>> {
  const [lookupsResult, servicesResult, pricesResult] = await Promise.all([
    loadCatalogLookups(),
    loadServiceRows(serviceId),
    loadServicePriceRows(serviceId),
  ]);

  if (lookupsResult.error) {
    return { data: null, error: lookupsResult.error };
  }

  if (servicesResult.error) {
    return { data: null, error: servicesResult.error };
  }

  if (pricesResult.error) {
    return { data: null, error: pricesResult.error };
  }

  const serviceRow = servicesResult.data[0];

  if (!serviceRow) {
    return { data: null, error: "The requested service could not be found." };
  }

  const pricesByServiceId = buildPricesByServiceId(pricesResult.data, lookupsResult.data.priceListMap);

  return {
    data: mapServiceRow(serviceRow, lookupsResult.data.categoryMap, lookupsResult.data.sectionMap, pricesByServiceId),
    error: null,
  };
}

function buildServicePayload(values: ServiceFormValues): Result<ServiceInsertRow> {
  const name = values.name.trim();
  const description = values.description.trim();
  const serviceCode = slugify(values.serviceCode || name) || `service-${Date.now().toString().slice(-6)}`;
  const duration = Number.parseInt(values.duration, 10);
  const sortOrder = Number.parseInt(values.sortOrder, 10);

  if (!name) {
    return { data: null as never, error: "Service name is required." };
  }

  if (!description) {
    return { data: null as never, error: "Service description is required." };
  }

  if (!values.categoryId) {
    return { data: null as never, error: "Choose a category before saving this service." };
  }

  if (!Number.isFinite(duration) || duration < 10 || duration > 240) {
    return { data: null as never, error: "Duration must be between 10 and 240 minutes." };
  }

  if (!Number.isFinite(sortOrder) || sortOrder < 0) {
    return { data: null as never, error: "Sort order must be zero or greater." };
  }

  return {
    data: {
      service_code: serviceCode,
      name,
      description,
      duration_minutes: duration,
      default_duration_minutes: duration,
      category_id: values.categoryId,
      section_id: values.sectionId || null,
      sort_order: sortOrder,
      is_active: values.active,
      metadata: {},
    },
    error: null,
  };
}

function validatePrices(prices: ServicePriceFormValue[]): string | null {
  for (const price of prices) {
    if (!price.amount.trim()) {
      continue;
    }

    const parsed = Number.parseFloat(price.amount);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return "Every service price must be zero or greater.";
    }
  }

  return null;
}

async function syncServicePrices(serviceId: string, prices: ServicePriceFormValue[]): Promise<string | null> {
  const validationError = validatePrices(prices);

  if (validationError) {
    return validationError;
  }

  const upsertRows: ServicePriceUpsertRow[] = prices
    .filter((price) => price.amount.trim())
    .map((price) => ({
      service_id: serviceId,
      price_list_id: price.priceListId,
      amount: Number.parseFloat(price.amount),
      pricing_unit: price.pricingUnit.trim() || "per procedure",
      notes: price.notes.trim() || null,
      is_active: price.isActive,
    }));

  const deletePriceListIds = prices.filter((price) => !price.amount.trim()).map((price) => price.priceListId);

  if (upsertRows.length > 0) {
    const { error } = await supabase.from("service_prices").upsert(upsertRows, { onConflict: "service_id,price_list_id" });

    if (error) {
      return toFriendlyError(error.message);
    }
  }

  if (deletePriceListIds.length > 0) {
    const { error } = await supabase.from("service_prices").delete().eq("service_id", serviceId).in("price_list_id", deletePriceListIds);

    if (error) {
      return toFriendlyError(error.message);
    }
  }

  return null;
}

function buildCategoryPayload(values: ServiceCategoryFormValues): Result<ServiceCategoryInsertRow> {
  const name = values.name.trim();
  const sortOrder = Number.parseInt(values.sortOrder, 10);

  if (!name) {
    return { data: null as never, error: "Category name is required." };
  }

  if (!Number.isFinite(sortOrder) || sortOrder < 0) {
    return { data: null as never, error: "Category sort order must be zero or greater." };
  }

  return {
    data: {
      name,
      description: values.description.trim() || null,
      sort_order: sortOrder,
      is_active: values.isActive,
    },
    error: null,
  };
}

function buildSectionPayload(values: ServiceSectionFormValues): Result<ServiceSectionInsertRow> {
  const name = values.name.trim();
  const sortOrder = Number.parseInt(values.sortOrder, 10);

  if (!values.categoryId) {
    return { data: null as never, error: "Choose a category before saving this section." };
  }

  if (!name) {
    return { data: null as never, error: "Section name is required." };
  }

  if (!Number.isFinite(sortOrder) || sortOrder < 0) {
    return { data: null as never, error: "Section sort order must be zero or greater." };
  }

  return {
    data: {
      category_id: values.categoryId,
      name,
      description: values.description.trim() || null,
      sort_order: sortOrder,
      is_active: values.isActive,
    },
    error: null,
  };
}

function buildPriceListPayload(values: ServicePriceListFormValues): Result<ServicePriceListInsertRow> {
  const name = values.name.trim();
  const currencyCode = values.currencyCode.trim().toUpperCase();

  if (!name) {
    return { data: null as never, error: "Price list name is required." };
  }

  if (!values.effectiveFrom) {
    return { data: null as never, error: "Choose an effective-from date." };
  }

  if (!currencyCode || currencyCode.length !== 3) {
    return { data: null as never, error: "Currency code must be a 3-letter ISO code." };
  }

  if (values.effectiveTo && values.effectiveTo < values.effectiveFrom) {
    return { data: null as never, error: "Effective-to date must be on or after the effective-from date." };
  }

  return {
    data: {
      name,
      description: values.description.trim() || null,
      effective_from: values.effectiveFrom,
      effective_to: values.effectiveTo || null,
      currency_code: currencyCode,
      is_active: values.isActive,
    },
    error: null,
  };
}

export async function loadServices() {
  const [lookupsResult, servicesResult] = await Promise.all([loadCatalogLookups(), loadServiceRows()]);

  if (lookupsResult.error) {
    return { data: [] as DentalService[], error: lookupsResult.error };
  }

  if (servicesResult.error) {
    return { data: [] as DentalService[], error: servicesResult.error };
  }

  const pricesByServiceId = new Map<string, ServicePriceRecord[]>();

  return {
    data: servicesResult.data.map((row) => mapServiceRow(row, lookupsResult.data.categoryMap, lookupsResult.data.sectionMap, pricesByServiceId)),
    error: null as string | null,
  };
}

export async function loadServiceCatalog() {
  const [lookupsResult, servicesResult, pricesResult] = await Promise.all([loadCatalogLookups(), loadServiceRows(), loadServicePriceRows()]);

  if (lookupsResult.error) {
    return { data: null as ServiceCatalog | null, error: lookupsResult.error };
  }

  if (servicesResult.error) {
    return { data: null as ServiceCatalog | null, error: servicesResult.error };
  }

  if (pricesResult.error) {
    return { data: null as ServiceCatalog | null, error: pricesResult.error };
  }

  const pricesByServiceId = buildPricesByServiceId(pricesResult.data, lookupsResult.data.priceListMap);

  return {
    data: {
      services: servicesResult.data.map((row) => mapServiceRow(row, lookupsResult.data.categoryMap, lookupsResult.data.sectionMap, pricesByServiceId)),
      categories: lookupsResult.data.categories,
      sections: lookupsResult.data.sections,
      priceLists: lookupsResult.data.priceLists,
    },
    error: null as string | null,
  };
}

export async function loadServiceCatalogOptions() {
  const lookupsResult = await loadCatalogLookups();

  if (lookupsResult.error) {
    return {
      data: {
        categories: [] as ServiceCategoryRecord[],
        sections: [] as ServiceSectionRecord[],
        priceLists: [] as ServicePriceListRecord[],
      },
      error: lookupsResult.error,
    };
  }

  return {
    data: {
      categories: lookupsResult.data.categories,
      sections: lookupsResult.data.sections,
      priceLists: lookupsResult.data.priceLists,
    },
    error: null as string | null,
  };
}

export async function saveServiceRecord(values: ServiceFormValues, serviceId?: string) {
  const payload = buildServicePayload(values);

  if (payload.error) {
    return { data: null as DentalService | null, error: payload.error };
  }

  const query = serviceId ? supabase.from("services").update(payload.data).eq("id", serviceId) : supabase.from("services").insert(payload.data);
  const { data, error } = await query.select("id").single();

  if (error) {
    return { data: null as DentalService | null, error: toFriendlyError(error.message) };
  }

  const persistedServiceId = (data as { id: string }).id;
  const pricesError = await syncServicePrices(persistedServiceId, values.prices);

  if (pricesError) {
    return { data: null as DentalService | null, error: pricesError };
  }

  return loadServiceRecord(persistedServiceId);
}

export async function saveServiceCategory(values: ServiceCategoryFormValues, categoryId?: string) {
  const payload = buildCategoryPayload(values);

  if (payload.error) {
    return { data: null as ServiceCategoryRecord | null, error: payload.error };
  }

  const query = categoryId
    ? supabase.from("service_categories").update(payload.data).eq("id", categoryId)
    : supabase.from("service_categories").insert(payload.data);

  const { data, error } = await query
    .select("id, name, description, sort_order, is_active, created_at, updated_at")
    .single();

  if (error) {
    return { data: null as ServiceCategoryRecord | null, error: toFriendlyError(error.message) };
  }

  return {
    data: mapCategoryRow(data as ServiceCategoryRow),
    error: null as string | null,
  };
}

export async function saveServiceSection(values: ServiceSectionFormValues, sectionId?: string) {
  const payload = buildSectionPayload(values);

  if (payload.error) {
    return { data: null as ServiceSectionRecord | null, error: payload.error };
  }

  const query = sectionId
    ? supabase.from("service_sections").update(payload.data).eq("id", sectionId)
    : supabase.from("service_sections").insert(payload.data);

  const { data, error } = await query
    .select("id, category_id, name, description, sort_order, is_active, created_at, updated_at")
    .single();

  if (error) {
    return { data: null as ServiceSectionRecord | null, error: toFriendlyError(error.message) };
  }

  const lookupsResult = await loadCatalogLookups();

  if (lookupsResult.error) {
    return { data: null as ServiceSectionRecord | null, error: lookupsResult.error };
  }

  return {
    data: mapSectionRow(data as ServiceSectionRow, lookupsResult.data.categoryMap),
    error: null as string | null,
  };
}

export async function saveServicePriceList(values: ServicePriceListFormValues, priceListId?: string) {
  const payload = buildPriceListPayload(values);

  if (payload.error) {
    return { data: null as ServicePriceListRecord | null, error: payload.error };
  }

  const query = priceListId
    ? supabase.from("service_price_lists").update(payload.data).eq("id", priceListId)
    : supabase.from("service_price_lists").insert(payload.data);

  const { data, error } = await query
    .select("id, name, description, effective_from, effective_to, currency_code, is_active, created_at, updated_at")
    .single();

  if (error) {
    return { data: null as ServicePriceListRecord | null, error: toFriendlyError(error.message) };
  }

  return {
    data: mapPriceListRow(data as ServicePriceListRow),
    error: null as string | null,
  };
}

export async function deleteServiceRecord(serviceId: string) {
  const { error } = await supabase
    .from("services")
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("id", serviceId)
    .is("deleted_at", null);

  if (error) {
    return {
      data: null as true | null,
      error: toFriendlyError(error.message),
    };
  }

  return {
    data: true,
    error: null as string | null,
  };
}
