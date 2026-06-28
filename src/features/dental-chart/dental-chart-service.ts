import { supabase } from "../../lib/supabase";
import { isNetworkErrorMessage, toConnectivityError } from "../../lib/network-errors";
import type { DentalChartSession, DentalChartSessionDetail, DentalChartTooth, DentalDentitionType, SurfaceNote } from "./dental-chart-types";

type SessionRow = {
  id: string;
  chart_code: string;
  patient_id: string;
  patient_code: string;
  branch_id: string;
  appointment_code: string | null;
  dentition_type: DentalDentitionType;
  recorded_by: string;
  recorder_name: string;
  created_at: string;
  updated_at: string;
};

type ToothRow = {
  id: string;
  chart_session_id: string;
  tooth_code: string;
  condition: string;
  planned_treatment: string;
  completed_treatment: string;
};

type SurfaceNoteRow = {
  id: string;
  chart_tooth_id: string;
  surface_code: string;
  note: string;
};

function toFriendlyError(message: string) {
  if (isNetworkErrorMessage(message)) {
    return toConnectivityError("load or save dental charts");
  }

  if (/permission denied|row-level security|not authorized/i.test(message)) {
    return "You do not have permission to view or edit dental chart records.";
  }

  if (/relation .* does not exist/i.test(message) || /could not find the table/i.test(message)) {
    return "The dental chart tables are missing from Supabase. Apply the dental chart migration first.";
  }

  return `We could not load dental chart data right now. ${message}`;
}

function normalizeTooth(rows: ToothRow[], surfaceRows: SurfaceNoteRow[]): DentalChartTooth[] {
  return rows.map((row) => ({
    toothCode: row.tooth_code,
    condition: row.condition as DentalChartTooth["condition"],
    plannedTreatment: row.planned_treatment,
    completedTreatment: row.completed_treatment,
    surfaceNotes: surfaceRows
      .filter((surfaceRow) => surfaceRow.chart_tooth_id === row.id)
      .map((surfaceRow) => ({
        surfaceCode: surfaceRow.surface_code as SurfaceNote["surfaceCode"],
        note: surfaceRow.note,
      })),
  }));
}

export async function loadDentalChartSessions(filters: { branchId?: string | null; patientId?: string | null }) {
  let query = supabase
    .from("dental_chart_sessions")
    .select("id, chart_code, patient_id, patient_code, branch_id, appointment_code, dentition_type, recorded_by, recorder_name, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (filters.branchId) {
    query = query.eq("branch_id", filters.branchId);
  }

  if (filters.patientId) {
    query = query.eq("patient_id", filters.patientId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [] as DentalChartSession[], error: toFriendlyError(error.message) };
  }

  return {
    data: ((data as SessionRow[] | null) ?? []).map(mapSessionRow),
    error: null as string | null,
  };
}

export async function loadDentalChartSession(sessionId: string) {
  const { data: sessionData, error: sessionError } = await supabase
    .from("dental_chart_sessions")
    .select("id, chart_code, patient_id, patient_code, branch_id, appointment_code, dentition_type, recorded_by, recorder_name, created_at, updated_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) {
    return { data: null as DentalChartSessionDetail | null, error: toFriendlyError(sessionError.message) };
  }

  if (!sessionData) {
    return {
      data: null as DentalChartSessionDetail | null,
      error: "The selected dental chart could not be found.",
    };
  }

  const { data: toothData, error: toothError } = await supabase
    .from("dental_chart_teeth")
    .select("id, chart_session_id, tooth_code, condition, planned_treatment, completed_treatment")
    .eq("chart_session_id", sessionId)
    .order("tooth_code", { ascending: true });

  if (toothError) {
    return { data: null as DentalChartSessionDetail | null, error: toFriendlyError(toothError.message) };
  }

  const toothRows = (toothData as ToothRow[] | null) ?? [];
  const toothIds = toothRows.map((row) => row.id);

  const { data: surfaceData, error: surfaceError } = toothIds.length
    ? await supabase
        .from("dental_chart_surface_notes")
        .select("id, chart_tooth_id, surface_code, note")
        .in("chart_tooth_id", toothIds)
        .order("surface_code", { ascending: true })
    : { data: [] as SurfaceNoteRow[] | null, error: null };

  if (surfaceError) {
    return { data: null as DentalChartSessionDetail | null, error: toFriendlyError(surfaceError.message) };
  }

  return {
    data: {
      ...mapSessionRow(sessionData as SessionRow),
      teeth: normalizeTooth(toothRows, (surfaceData as SurfaceNoteRow[] | null) ?? []),
    },
    error: null as string | null,
  };
}

export async function saveDentalChartSession(input: {
  sessionId?: string | null;
  patientId: string;
  patientCode: string;
  branchId: string;
  appointmentCode?: string | null;
  dentitionType: DentalDentitionType;
  teeth: DentalChartTooth[];
}) {
  const { data, error } = await supabase.rpc("save_dental_chart_session", {
    payload: {
      session_id: input.sessionId ?? null,
      patient_id: input.patientId,
      patient_code: input.patientCode,
      branch_id: input.branchId,
      appointment_code: input.appointmentCode ?? null,
      dentition_type: input.dentitionType,
      teeth: input.teeth.map((tooth) => ({
        tooth_code: tooth.toothCode,
        condition: tooth.condition,
        planned_treatment: tooth.plannedTreatment,
        completed_treatment: tooth.completedTreatment,
        surface_notes: tooth.surfaceNotes.map((surface) => ({
          surface_code: surface.surfaceCode,
          note: surface.note,
        })),
      })),
    },
  });

  if (error) {
    return { data: null as string | null, error: toFriendlyError(error.message) };
  }

  return {
    data: (data as string | null) ?? null,
    error: null as string | null,
  };
}

function mapSessionRow(row: SessionRow): DentalChartSession {
  return {
    id: row.id,
    chartCode: row.chart_code,
    patientId: row.patient_id,
    patientCode: row.patient_code,
    branchId: row.branch_id,
    appointmentCode: row.appointment_code,
    dentitionType: row.dentition_type,
    recordedBy: row.recorded_by,
    recorderName: row.recorder_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

