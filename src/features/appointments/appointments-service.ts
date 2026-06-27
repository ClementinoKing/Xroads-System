import { supabase } from "../../lib/supabase";
import type { Appointment, AppointmentStatus, PaymentType } from "../../data/appointments";
import { isNetworkErrorMessage, toConnectivityError } from "../../lib/network-errors";
import { normalizeTimeString } from "../../lib/time";

export type AppointmentRecordInput = {
  patientId: string;
  dentistId: string;
  serviceId: string;
  date: string;
  time: string;
  durationMinutes: number;
  notes: string;
  emergency?: boolean;
};

export type AppointmentUpdateInput = {
  appointmentCode: string;
  dentistId: string;
  date: string;
  time: string;
  durationMinutes: number;
  patientId?: string;
  serviceId?: string;
  notes?: string;
  emergency?: boolean;
};

export type AppointmentStatusUpdateInput = {
  appointmentCode: string;
  status: AppointmentStatus;
};

type AppointmentRow = {
  appointment_code: string;
  patient_id: string;
  patient_code: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  patient_branch_id: string | null;
  branch_id: string;
  dentist_id: string;
  dentist_name: string;
  dentist_role: string;
  dentist_marker: string | null;
  service_id: string;
  service_code: string;
  service_name: string;
  appointment_date: string;
  start_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  payment_type: PaymentType;
  scheme_name: string | null;
  emergency: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

function toFriendlyError(message: string) {
  if (isNetworkErrorMessage(message)) {
    return toConnectivityError("load or save appointments");
  }

  if (/appointments_no_overlap|exclusion constraint|conflicting key value/i.test(message)) {
    return "That slot is already booked for this dentist. Choose a different time or dentist.";
  }

  if (/permission denied|row-level security|not authorized/i.test(message)) {
    return "You do not have permission to view or edit appointment records.";
  }

  if (/not a dentist role|is not a dentist/i.test(message)) {
    return "The selected clinician must have an appointment marker of Dentist before bookings can be created.";
  }

  if (/relation .* does not exist/i.test(message) || /could not find the table/i.test(message)) {
    return "The appointments table is missing from Supabase. Apply the appointments migration first.";
  }

  return `We could not load appointment records right now. ${message}`;
}

function mapRow(row: AppointmentRow): Appointment {
  return {
    id: row.appointment_code,
    patientId: row.patient_id,
    patientCode: row.patient_code,
    patientName: row.patient_name,
    phone: row.patient_phone,
    patientEmail: row.patient_email ?? undefined,
    branchId: row.branch_id,
    dentistId: row.dentist_id,
    dentistName: row.dentist_name,
    dentistRole: row.dentist_role,
    dentistMarker: row.dentist_marker ?? undefined,
    serviceId: row.service_id,
    serviceCode: row.service_code,
    service: row.service_name,
    durationMinutes: row.duration_minutes,
    date: row.appointment_date,
    time: normalizeTimeString(row.start_time) || row.start_time,
    status: row.status,
    paymentType: row.payment_type,
    schemeName: row.scheme_name ?? undefined,
    emergency: row.emergency,
    notes: row.notes,
  };
}

export async function loadAppointments() {
  const { data, error } = await supabase
    .from("appointments_read")
    .select(
      "appointment_code, patient_id, patient_code, patient_name, patient_phone, patient_email, patient_branch_id, branch_id, dentist_id, dentist_name, dentist_role, dentist_marker, service_id, service_code, service_name, appointment_date, start_time, duration_minutes, status, payment_type, scheme_name, emergency, notes, created_at, updated_at",
    )
    .is("deleted_at", null)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (error) {
    return { data: [] as Appointment[], error: toFriendlyError(error.message) };
  }

  return {
    data: ((data as AppointmentRow[] | null) ?? []).map(mapRow),
    error: null as string | null,
  };
}

export async function createAppointmentRecord(input: AppointmentRecordInput) {
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: input.patientId,
      dentist_id: input.dentistId,
      service_id: input.serviceId,
      appointment_date: input.date,
      start_time: normalizeTimeString(input.time) || input.time,
      duration_minutes: input.durationMinutes,
      notes: input.notes,
      emergency: input.emergency ?? false,
    })
    .select("appointment_code")
    .single();

  if (error) {
    return { data: null as Appointment | null, error: toFriendlyError(error.message) };
  }

  const appointmentCode = data?.appointment_code;
  if (!appointmentCode) {
    return {
      data: null as Appointment | null,
      error: "We could not load the created appointment. Please refresh the page.",
    };
  }

  const { data: createdRow, error: fetchError } = await supabase
    .from("appointments_read")
    .select(
      "appointment_code, patient_id, patient_code, patient_name, patient_phone, patient_email, patient_branch_id, branch_id, dentist_id, dentist_name, dentist_role, dentist_marker, service_id, service_code, service_name, appointment_date, start_time, duration_minutes, status, payment_type, scheme_name, emergency, notes, created_at, updated_at",
    )
    .eq("appointment_code", appointmentCode)
    .single();

  if (fetchError) {
    return { data: null as Appointment | null, error: toFriendlyError(fetchError.message) };
  }

  return {
    data: mapRow(createdRow as AppointmentRow),
    error: null as string | null,
  };
}

export async function updateAppointmentRecord(input: AppointmentUpdateInput) {
  const updatePayload: Record<string, string | number | boolean> = {
    dentist_id: input.dentistId,
    appointment_date: input.date,
    start_time: normalizeTimeString(input.time) || input.time,
    duration_minutes: input.durationMinutes,
  };

  if (input.patientId) {
    updatePayload.patient_id = input.patientId;
  }

  if (input.serviceId) {
    updatePayload.service_id = input.serviceId;
  }

  if (typeof input.notes === "string") {
    updatePayload.notes = input.notes;
  }

  if (typeof input.emergency === "boolean") {
    updatePayload.emergency = input.emergency;
  }

  const { data, error } = await supabase
    .from("appointments")
    .update(updatePayload)
    .eq("appointment_code", input.appointmentCode)
    .is("deleted_at", null)
    .select("appointment_code")
    .single();

  if (error) {
    return { data: null as Appointment | null, error: toFriendlyError(error.message) };
  }

  const appointmentCode = data?.appointment_code;
  if (!appointmentCode) {
    return {
      data: null as Appointment | null,
      error: "We could not load the updated appointment. Please refresh the page.",
    };
  }

  const { data: updatedRow, error: fetchError } = await supabase
    .from("appointments_read")
    .select(
      "appointment_code, patient_id, patient_code, patient_name, patient_phone, patient_email, patient_branch_id, branch_id, dentist_id, dentist_name, dentist_role, dentist_marker, service_id, service_code, service_name, appointment_date, start_time, duration_minutes, status, payment_type, scheme_name, emergency, notes, created_at, updated_at",
    )
    .eq("appointment_code", appointmentCode)
    .single();

  if (fetchError) {
    return { data: null as Appointment | null, error: toFriendlyError(fetchError.message) };
  }

  return {
    data: mapRow(updatedRow as AppointmentRow),
    error: null as string | null,
  };
}

export async function deleteAppointmentRecord(appointmentCode: string) {
  const { data, error } = await supabase
    .from("appointments")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("appointment_code", appointmentCode)
    .is("deleted_at", null)
    .select("appointment_code")
    .single();

  if (error) {
    return { data: null as Appointment | null, error: toFriendlyError(error.message) };
  }

  return {
    data: data?.appointment_code ? ({ id: data.appointment_code } as Appointment) : null,
    error: null as string | null,
  };
}

export async function updateAppointmentStatus(input: AppointmentStatusUpdateInput) {
  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: input.status,
    })
    .eq("appointment_code", input.appointmentCode)
    .is("deleted_at", null)
    .select("appointment_code")
    .single();

  if (error) {
    return { data: null as Appointment | null, error: toFriendlyError(error.message) };
  }

  const appointmentCode = data?.appointment_code;
  if (!appointmentCode) {
    return {
      data: null as Appointment | null,
      error: "We could not load the updated appointment. Please refresh the page.",
    };
  }

  const { data: updatedRow, error: fetchError } = await supabase
    .from("appointments_read")
    .select(
      "appointment_code, patient_id, patient_code, patient_name, patient_phone, patient_email, patient_branch_id, branch_id, dentist_id, dentist_name, dentist_role, dentist_marker, service_id, service_code, service_name, appointment_date, start_time, duration_minutes, status, payment_type, scheme_name, emergency, notes, created_at, updated_at",
    )
    .eq("appointment_code", appointmentCode)
    .single();

  if (fetchError) {
    return { data: null as Appointment | null, error: toFriendlyError(fetchError.message) };
  }

  return {
    data: mapRow(updatedRow as AppointmentRow),
    error: null as string | null,
  };
}
