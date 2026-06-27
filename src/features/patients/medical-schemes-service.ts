import { supabase } from "../../lib/supabase";
import { isNetworkErrorMessage, toConnectivityError } from "../../lib/network-errors";

export type MedicalSchemeType = "provider" | "plan";

export type MedicalSchemeOption = {
  id: string;
  name: string;
  providerName: string;
  schemeType: MedicalSchemeType;
  description: string | null;
  sourceUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

type MedicalSchemeRow = {
  id: string;
  name: string;
  provider_name: string;
  scheme_type: MedicalSchemeType;
  description: string | null;
  source_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

type MedicalSchemeAdminRow = MedicalSchemeRow & {
  deleted_at: string | null;
  updated_at: string;
};

export type MedicalSchemeRecord = MedicalSchemeOption & {
  deletedAt: string | null;
  updatedAt: string;
};

export type MedicalSchemeFormValues = {
  name: string;
  providerName: string;
  schemeType: MedicalSchemeType;
  description: string;
  sourceUrl: string;
  sortOrder: string;
  isActive: boolean;
};

function toFriendlyError(message: string) {
  if (isNetworkErrorMessage(message)) {
    return toConnectivityError("load or save medical schemes");
  }

  if (/permission denied|row-level security|not authorized/i.test(message)) {
    return "You do not have permission to view medical schemes.";
  }

  if (/relation .* does not exist/i.test(message) || /could not find the table/i.test(message)) {
    return "The medical schemes table is missing from Supabase. Apply the medical scheme migration first.";
  }

  return `We could not load medical schemes right now. ${message}`;
}

function mapAdminRow(row: MedicalSchemeAdminRow): MedicalSchemeRecord {
  return {
    id: row.id,
    name: row.name,
    providerName: row.provider_name,
    schemeType: row.scheme_type,
    description: row.description,
    sourceUrl: row.source_url,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    updatedAt: row.updated_at,
  };
}

export async function loadMedicalSchemes() {
  const { data, error } = await supabase
    .from("medical_schemes")
    .select("id, name, provider_name, scheme_type, description, source_url, is_active, sort_order, created_at")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("provider_name", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return { data: [] as MedicalSchemeOption[], error: toFriendlyError(error.message) };
  }

  return {
    data: ((data as MedicalSchemeRow[] | null) ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      providerName: row.provider_name,
      schemeType: row.scheme_type,
      description: row.description,
      sourceUrl: row.source_url,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
    })),
    error: null as string | null,
  };
}

export async function loadMedicalSchemesAdmin() {
  const { data, error } = await supabase
    .from("medical_schemes")
    .select("id, name, provider_name, scheme_type, description, source_url, is_active, sort_order, created_at, updated_at, deleted_at")
    .order("provider_name", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return { data: [] as MedicalSchemeRecord[], error: toFriendlyError(error.message) };
  }

  return {
    data: ((data as MedicalSchemeAdminRow[] | null) ?? []).map(mapAdminRow),
    error: null as string | null,
  };
}

export async function saveMedicalScheme(values: MedicalSchemeFormValues, id?: string) {
  const payload = {
    name: values.name.trim(),
    provider_name: values.providerName.trim(),
    scheme_type: values.schemeType,
    description: values.description.trim() || null,
    source_url: values.sourceUrl.trim() || null,
    sort_order: Number.isFinite(Number(values.sortOrder)) ? Number(values.sortOrder) : 0,
    is_active: values.isActive,
  };

  const query = id ? supabase.from("medical_schemes").update(payload).eq("id", id) : supabase.from("medical_schemes").insert(payload);
  const { data, error } = await query
    .select("id, name, provider_name, scheme_type, description, source_url, is_active, sort_order, created_at, updated_at, deleted_at")
    .single();

  if (error) {
    return { data: null as MedicalSchemeRecord | null, error: toFriendlyError(error.message) };
  }

  return {
    data: mapAdminRow(data as MedicalSchemeAdminRow),
    error: null as string | null,
  };
}

export async function archiveMedicalScheme(id: string) {
  const { data, error } = await supabase
    .from("medical_schemes")
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("id", id)
    .select("id, name, provider_name, scheme_type, description, source_url, is_active, sort_order, created_at, updated_at, deleted_at")
    .single();

  if (error) {
    return { data: null as MedicalSchemeRecord | null, error: toFriendlyError(error.message) };
  }

  return {
    data: mapAdminRow(data as MedicalSchemeAdminRow),
    error: null as string | null,
  };
}

export async function restoreMedicalScheme(id: string) {
  const { data, error } = await supabase
    .from("medical_schemes")
    .update({
      deleted_at: null,
      is_active: true,
    })
    .eq("id", id)
    .select("id, name, provider_name, scheme_type, description, source_url, is_active, sort_order, created_at, updated_at, deleted_at")
    .single();

  if (error) {
    return { data: null as MedicalSchemeRecord | null, error: toFriendlyError(error.message) };
  }

  return {
    data: mapAdminRow(data as MedicalSchemeAdminRow),
    error: null as string | null,
  };
}
