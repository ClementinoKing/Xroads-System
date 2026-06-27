import { supabase } from "../../lib/supabase";
import { isNetworkErrorMessage, toConnectivityError } from "../../lib/network-errors";
import type { BranchId } from "../../data/branches";
import type { Patient } from "../../data/patients";

export type PatientPaymentMethod = Patient["paymentMethod"];

export type PatientFormValues = {
  name: string;
  phone: string;
  email: string;
  branchId: BranchId;
  paymentMethod: PatientPaymentMethod;
  medicalSchemeId: string;
  schemeName: string;
  nextAppointment: string;
};

type PatientRow = {
  id: string;
  patient_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  branch_id: string | null;
  last_visit: string;
  next_appointment: string;
  payment_method: PatientPaymentMethod;
  scheme_name: string | null;
  medical_scheme_id: string | null;
  medical_scheme:
    | {
        id: string;
        name: string;
        provider_name: string;
      }
    | Array<{
        id: string;
        name: string;
        provider_name: string;
      }>
    | null;
  created_at: string;
};

type PatientInsertRow = {
  full_name: string;
  phone: string;
  email: string | null;
  branch_id: string;
  last_visit: string;
  next_appointment: string;
  payment_method: PatientPaymentMethod;
  medical_scheme_id: string | null;
  scheme_name: string | null;
};

type PatientPayloadResult =
  | {
      value: PatientInsertRow;
      error: null;
    }
  | {
      value: null;
      error: string;
    };

function toFriendlyError(message: string) {
  if (isNetworkErrorMessage(message)) {
    return toConnectivityError("load or save patient records");
  }

  if (/permission denied|row-level security|not authorized/i.test(message)) {
    return "You do not have permission to view or edit patient records.";
  }

  if (/relation .* does not exist/i.test(message) || /could not find the table/i.test(message)) {
    return "The patients table is missing from Supabase. Apply the patient database migration first.";
  }

  return `We could not load patient records right now. ${message}`;
}

function normalizeRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function mapRow(row: PatientRow): Patient {
  const medicalScheme = normalizeRelation(row.medical_scheme);

  return {
    id: row.id,
    patientCode: row.patient_code,
    name: row.full_name,
    phone: row.phone,
    email: row.email ?? undefined,
    branchId: row.branch_id ?? "xroads-dental",
    lastVisit: row.last_visit,
    nextAppointment: row.next_appointment,
    paymentMethod: row.payment_method,
    schemeName: row.scheme_name ?? medicalScheme?.name ?? undefined,
  };
}

export async function loadPatients() {
  const { data, error } = await supabase
    .from("patients")
    .select(
      "id, patient_code, full_name, phone, email, branch_id, last_visit, next_appointment, payment_method, scheme_name, medical_scheme_id, created_at, medical_scheme:medical_schemes(id, name, provider_name)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [] as Patient[], error: toFriendlyError(error.message) };
  }

  return {
    data: ((data as PatientRow[] | null) ?? []).map(mapRow),
    error: null as string | null,
  };
}

export async function createPatientRecord(values: PatientFormValues) {
  const payload = buildPatientPayload(values);

  if (payload.value === null) {
    return {
      data: null as Patient | null,
      error: payload.error,
    };
  }

  const { data, error } = await supabase
    .from("patients")
    .insert(payload.value)
    .select(
      "id, patient_code, full_name, phone, email, branch_id, last_visit, next_appointment, payment_method, scheme_name, medical_scheme_id, created_at, medical_scheme:medical_schemes(id, name, provider_name)",
    )
    .single();

  if (error) {
    return { data: null as Patient | null, error: toFriendlyError(error.message) };
  }

  return {
    data: mapRow(data as PatientRow),
    error: null as string | null,
  };
}

export async function updatePatientRecord(patientId: string, values: PatientFormValues) {
  const payload = buildPatientPayload(values);

  if (payload.value === null) {
    return {
      data: null as Patient | null,
      error: payload.error,
    };
  }

  const { data, error } = await supabase
    .from("patients")
    .update(payload.value)
    .eq("id", patientId)
    .is("deleted_at", null)
    .select(
      "id, patient_code, full_name, phone, email, branch_id, last_visit, next_appointment, payment_method, scheme_name, medical_scheme_id, created_at, medical_scheme:medical_schemes(id, name, provider_name)",
    )
    .single();

  if (error) {
    return { data: null as Patient | null, error: toFriendlyError(error.message) };
  }

  return {
    data: mapRow(data as PatientRow),
    error: null as string | null,
  };
}

export async function deletePatientRecord(patientId: string) {
  const { error } = await supabase
    .from("patients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", patientId)
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

function buildPatientPayload(values: PatientFormValues): PatientPayloadResult {
  const name = values.name.trim();
  const phone = values.phone.trim();
  const email = values.email.trim();
  const schemeName = values.paymentMethod === "Medical Scheme" ? values.schemeName.trim() : "";
  const medicalSchemeId = values.paymentMethod === "Medical Scheme" ? values.medicalSchemeId.trim() : "";

  if (!name || !phone) {
    return { value: null, error: "Patient name and phone number are required." };
  }

  if (values.paymentMethod === "Medical Scheme" && !medicalSchemeId) {
    return {
      value: null,
      error: "Please choose a medical scheme from the list before saving this patient.",
    };
  }

  return {
    value: {
      full_name: name,
      phone,
      email: email.length > 0 ? email : null,
      branch_id: values.branchId,
      last_visit: "New patient",
      next_appointment: values.nextAppointment.trim() || "No upcoming",
      payment_method: values.paymentMethod,
      medical_scheme_id: medicalSchemeId.length > 0 ? medicalSchemeId : null,
      scheme_name: schemeName.length > 0 ? schemeName : null,
    },
    error: null,
  };
}
