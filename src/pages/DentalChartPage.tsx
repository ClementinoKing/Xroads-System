import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardList, Plus, RotateCcw, Search, Sparkles } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { useAuth } from "../features/auth/auth-context";
import { useBranchScope } from "../features/auth/branch-scope";
import { usePatients } from "../features/patients/use-patients";
import { useAppointments } from "../features/appointments/use-appointments";
import { loadDentalChartSession, loadDentalChartSessions, saveDentalChartSession } from "../features/dental-chart/dental-chart-service";
import type {
  DentalChartSession,
  DentalChartSessionDetail,
  DentalChartTooth,
  DentalDentitionType,
  ToothSurfaceCode,
} from "../features/dental-chart/dental-chart-types";
import { DENTITION_OPTIONS, PERMANENT_ODONTOGRAM, PRIMARY_ODONTOGRAM } from "../features/dental-chart/dental-chart-types";
import { loadRoleAppointmentMarker } from "../features/staff/role-access";
import type { RoleAppointmentMarker } from "../features/staff/role-types";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DataTable } from "../components/shared/DataTable";
import { EmptyState } from "../components/shared/EmptyState";
import { DentalOdontogram } from "../components/dental-chart/DentalOdontogram";
import { ToothInspector } from "../components/dental-chart/ToothInspector";
import { cn } from "../lib/utils";
import { branches } from "../data/branches";
import type { Appointment } from "../data/appointments";

type SessionRow = DentalChartSession & {
  patientName: string;
  appointmentLabel: string;
};

type ToothDraftSurface = {
  surfaceCode: ToothSurfaceCode;
  note: string;
};

function blankTooth(toothCode: string): DentalChartTooth {
  return {
    toothCode,
    condition: "Healthy",
    plannedTreatment: "",
    completedTreatment: "",
    surfaceNotes: [],
  };
}

function defaultToothCode(dentitionType: DentalDentitionType) {
  return dentitionType === "primary" ? PRIMARY_ODONTOGRAM[0]?.[0] ?? "55" : PERMANENT_ODONTOGRAM[0]?.[0] ?? "18";
}

function formatSessionLabel(session: DentalChartSession) {
  const parsedDate = parseISO(session.updatedAt);

  if (isValid(parsedDate)) {
    return format(parsedDate, "MMM d, yyyy");
  }

  return session.updatedAt;
}

export function DentalChartPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();
  const branchScope = useBranchScope();
  const { patients, isLoading: patientsLoading, error: patientsError, refetch: refetchPatients } = usePatients();
  const { appointments, error: appointmentsError } = useAppointments();
  const [roleMarker, setRoleMarker] = useState<RoleAppointmentMarker | null>(null);
  const [roleAccessError, setRoleAccessError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(searchParams.get("patientId"));
  const [selectedAppointmentCode, setSelectedAppointmentCode] = useState<string | null>(searchParams.get("appointmentCode"));
  const [chartSessions, setChartSessions] = useState<DentalChartSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<DentalChartSessionDetail | null>(null);
  const [draftDentitionType, setDraftDentitionType] = useState<DentalDentitionType>("permanent");
  const [draftTeeth, setDraftTeeth] = useState<DentalChartTooth[]>([]);
  const [selectedToothCode, setSelectedToothCode] = useState<string | null>(defaultToothCode("permanent"));
  const [surfaceDraft, setSurfaceDraft] = useState<ToothDraftSurface>({ surfaceCode: "Mesial", note: "" });
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [chartRefreshIndex, setChartRefreshIndex] = useState(0);

  const activeBranchId = branchScope.branchId;
  const currentPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId],
  );
  const branchPatients = useMemo(
    () => patients.filter((patient) => !activeBranchId || patient.branchId === activeBranchId),
    [activeBranchId, patients],
  );
  const patientQuery = useMemo(() => {
    const normalized = searchParams.get("q")?.trim().toLowerCase() ?? "";
    return normalized;
  }, [searchParams]);
  const filteredPatients = useMemo(
    () =>
      branchPatients.filter((patient) => {
        if (!patientQuery) return true;

        return [patient.name, patient.phone, patient.email ?? "", patient.patientCode ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(patientQuery);
      }),
    [branchPatients, patientQuery],
  );

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.id === selectedAppointmentCode) ?? null,
    [appointments, selectedAppointmentCode],
  );

  const currentSession = useMemo(
    () => selectedSessionDetail ?? null,
    [selectedSessionDetail],
  );

  const teethByCode = useMemo(() => {
    const map = new Map<string, DentalChartTooth>();
    for (const tooth of draftTeeth) {
      map.set(tooth.toothCode, tooth);
    }
    return map;
  }, [draftTeeth]);

  const canEdit = roleMarker === "Dentist";
  const selectedTooth = selectedToothCode ? teethByCode.get(selectedToothCode) ?? blankTooth(selectedToothCode) : null;
  const selectedPatientAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) => !selectedPatientId || appointment.patientId === selectedPatientId || appointment.patientCode === currentPatient?.patientCode,
      ),
    [appointments, currentPatient?.patientCode, selectedPatientId],
  );

  useEffect(() => {
    void (async () => {
      if (!profile?.role_id) {
        setRoleMarker(null);
        return;
      }

      const result = await loadRoleAppointmentMarker(profile.role_id);
      setRoleMarker(result.data);
      setRoleAccessError(result.error);
    })();
  }, [profile?.role_id]);

  useEffect(() => {
    if (branchPatients.length === 0) {
      setSelectedPatientId(null);
      return;
    }

    if (selectedPatientId && branchPatients.some((patient) => patient.id === selectedPatientId)) {
      return;
    }

    if (selectedAppointmentCode) {
      const appointmentPatient = appointments.find((appointment) => appointment.id === selectedAppointmentCode)?.patientId;
      if (appointmentPatient && branchPatients.some((patient) => patient.id === appointmentPatient)) {
        setSelectedPatientId(appointmentPatient);
        return;
      }
    }

    setSelectedPatientId(branchPatients[0]?.id ?? null);
  }, [appointments, branchPatients, selectedAppointmentCode, selectedPatientId]);

  useEffect(() => {
    if (!selectedPatientId) {
      setChartSessions([]);
      setSelectedSessionId(null);
      setSelectedSessionDetail(null);
      setDraftTeeth([]);
      setDraftDentitionType("permanent");
      setSelectedToothCode(null);
      return;
    }

    let active = true;

    async function run() {
      setIsChartLoading(true);
      setChartError(null);

      const sessionsResult = await loadDentalChartSessions({
        branchId: activeBranchId,
        patientId: selectedPatientId,
      });

      if (!active) {
        return;
      }

      if (sessionsResult.error) {
        setChartError(sessionsResult.error);
        setChartSessions([]);
        setSelectedSessionId(null);
        setSelectedSessionDetail(null);
        setDraftTeeth([]);
        setDraftDentitionType("permanent");
        setSelectedToothCode(defaultToothCode("permanent"));
        setIsChartLoading(false);
        return;
      }

      setChartSessions(sessionsResult.data);

      const appointmentSession =
        selectedAppointmentCode ? sessionsResult.data.find((session) => session.appointmentCode === selectedAppointmentCode) : null;
      const nextSession = appointmentSession ?? (selectedAppointmentCode ? null : sessionsResult.data[0] ?? null);

      if (!nextSession) {
        setSelectedSessionId(null);
        setSelectedSessionDetail(null);
        setDraftDentitionType("permanent");
        setDraftTeeth([]);
        setSelectedToothCode(defaultToothCode("permanent"));
        setIsChartLoading(false);
        return;
      }

      setSelectedSessionId(nextSession.id);

      const detailResult = await loadDentalChartSession(nextSession.id);

      if (!active) {
        return;
      }

      if (detailResult.error || !detailResult.data) {
        setChartError(detailResult.error);
        setSelectedSessionDetail(null);
        setDraftDentitionType(nextSession.dentitionType);
        setDraftTeeth([]);
        setSelectedToothCode(defaultToothCode(nextSession.dentitionType));
        setIsChartLoading(false);
        return;
      }

      setSelectedSessionDetail(detailResult.data);
      setDraftDentitionType(detailResult.data.dentitionType);
      setDraftTeeth(detailResult.data.teeth);
      setSelectedToothCode(detailResult.data.teeth[0]?.toothCode ?? defaultToothCode(detailResult.data.dentitionType));
      setIsChartLoading(false);
    }

    void run();

    return () => {
      active = false;
    };
  }, [activeBranchId, chartRefreshIndex, selectedAppointmentCode, selectedPatientId]);

  useEffect(() => {
    const resolvedSearchPatient = searchParams.get("patientId");
    if (resolvedSearchPatient !== selectedPatientId) {
      const next = new URLSearchParams(searchParams);
      if (selectedPatientId) {
        next.set("patientId", selectedPatientId);
      } else {
        next.delete("patientId");
      }
      if (selectedAppointmentCode) {
        next.set("appointmentCode", selectedAppointmentCode);
      } else {
        next.delete("appointmentCode");
      }
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, selectedAppointmentCode, selectedPatientId, setSearchParams]);

  useEffect(() => {
    if (!selectedToothCode && draftTeeth.length > 0) {
      setSelectedToothCode(draftTeeth[0].toothCode);
    }
  }, [draftTeeth, selectedToothCode]);

  useEffect(() => {
    if (!selectedToothCode) {
      return;
    }

    const selected = teethByCode.get(selectedToothCode) ?? blankTooth(selectedToothCode);
    const existingSurface = selected.surfaceNotes[0];
    setSurfaceDraft({
      surfaceCode: existingSurface?.surfaceCode ?? "Mesial",
      note: existingSurface?.note ?? "",
    });
  }, [selectedToothCode, teethByCode]);

  function setSearchValue(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value.trim()) {
      next.set("q", value);
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  }

  function updateSelectedTooth(updater: (current: DentalChartTooth) => DentalChartTooth) {
    if (!selectedToothCode) return;

    setDraftTeeth((current) => {
      const index = current.findIndex((tooth) => tooth.toothCode === selectedToothCode);
      const base = index >= 0 ? current[index] : blankTooth(selectedToothCode);
      const next = updater(base);

      if (index >= 0) {
        const copy = [...current];
        copy[index] = next;
        return copy;
      }

      return [...current, next];
    });
  }

  async function handleSaveChart() {
    if (!currentPatient) {
      return;
    }

    setIsSaving(true);
    setChartError(null);

    try {
      const result = await saveDentalChartSession({
        sessionId: selectedSessionDetail?.id ?? null,
        patientId: currentPatient.id,
        patientCode: currentPatient.patientCode ?? currentPatient.id,
        branchId: currentPatient.branchId,
        appointmentCode: selectedAppointmentCode ?? selectedSessionDetail?.appointmentCode ?? null,
        dentitionType: draftDentitionType,
        teeth: draftTeeth,
      });

      if (result.error || !result.data) {
        setChartError(result.error);
        return;
      }

      await refetchPatients();
      setSelectedSessionId(result.data);
      setChartRefreshIndex((current) => current + 1);
    } finally {
      setIsSaving(false);
    }
  }

  function handleNewChart() {
    setSelectedSessionId(null);
    setSelectedSessionDetail(null);
    setSelectedAppointmentCode(null);
    setDraftDentitionType("permanent");
    setDraftTeeth([]);
    setSelectedToothCode(defaultToothCode("permanent"));
    setSurfaceDraft({ surfaceCode: "Mesial", note: "" });
  }

  function handleDentitionChange(nextDentitionType: DentalDentitionType) {
    setDraftDentitionType(nextDentitionType);
    const nextDefault = defaultToothCode(nextDentitionType);
    if (nextDentitionType !== "mixed") {
      setSelectedToothCode(nextDefault);
    }
    if (draftTeeth.length === 0) {
      setSelectedToothCode(nextDefault);
    }
  }

  function handleAppointmentSelection(appointment: Appointment | null) {
    if (!appointment) {
      setSelectedAppointmentCode(null);
      return;
    }

    setSelectedAppointmentCode(appointment.id);
    setSelectedPatientId(appointment.patientId ?? null);
  }

  function openSession(sessionId: string) {
    void (async () => {
      setIsChartLoading(true);
      setChartError(null);
      setSelectedSessionId(sessionId);
      const result = await loadDentalChartSession(sessionId);
      if (!result.data) {
        setChartError(result.error);
        setIsChartLoading(false);
        return;
      }

      setSelectedSessionDetail(result.data);
      setDraftDentitionType(result.data.dentitionType);
      setDraftTeeth(result.data.teeth);
      setSelectedToothCode(result.data.teeth[0]?.toothCode ?? defaultToothCode(result.data.dentitionType));
      setSelectedAppointmentCode(result.data.appointmentCode);
      setSelectedPatientId(result.data.patientId);
      setIsChartLoading(false);
    })();
  }

  const sessionRows = useMemo(
    () =>
      chartSessions.map((session) => ({
        ...session,
        patientName: currentPatient?.id === session.patientId ? currentPatient.name : patients.find((patient) => patient.id === session.patientId)?.name ?? "Unknown patient",
        appointmentLabel: session.appointmentCode ?? "Patient chart",
      })),
    [chartSessions, currentPatient?.id, currentPatient?.name, patients],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="page-title">Dental chart</h1>
          <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Record tooth condition, surface-level notes, and treatment plans in a single clinical chart linked to the patient and visit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleNewChart}>
            <Plus size={16} />
            New chart
          </Button>
          <Button type="button" onClick={() => void handleSaveChart()} disabled={!currentPatient || !canEdit || isSaving}>
            <Sparkles size={16} />
            {isSaving ? "Saving..." : "Save chart"}
          </Button>
        </div>
      </div>

      {!canEdit ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          You can view charts for this branch, but only clinicians with a Dentist appointment marker can create or edit them.
        </div>
      ) : null}

      {roleAccessError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100">
          {roleAccessError}
        </div>
      ) : null}

      {patientsError || appointmentsError || chartError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100">
          {patientsError ?? appointmentsError ?? chartError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-xroads-50 text-xroads-700 ring-1 ring-xroads-100 dark:bg-xroads-500/15 dark:text-xroads-100 dark:ring-xroads-900/50">
                <ClipboardList size={18} />
              </div>
              <div>
                <CardTitle>Patients in scope</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {branchScope.branchId ? branchScope.branchLabel : "All branches"} · {filteredPatients.length} patients
                </p>
              </div>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
              <input
                className="input h-11 pl-10 text-sm"
                value={patientQuery}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search patient name, phone, or code"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {patientsLoading ? (
              <EmptyState title="Loading patients" description="Fetching patients available for charting." />
            ) : filteredPatients.length === 0 ? (
              <EmptyState title="No patients found" description="Try a different search term or branch scope." />
            ) : (
              filteredPatients.map((patient) => {
                const active = patient.id === currentPatient?.id;

                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => setSelectedPatientId(patient.id)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left transition",
                      active
                        ? "border-xroads-300 bg-xroads-50 shadow-sm dark:border-xroads-500/50 dark:bg-xroads-500/10"
                        : "border-slate-200 bg-white hover:border-xroads-200 hover:bg-xroads-50/40 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-xroads-900/60 dark:hover:bg-zinc-900",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{patient.name}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{patient.patientCode ?? patient.id}</div>
                      </div>
                      {active ? (
                        <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:ring-emerald-900/50">
                          Active
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200 dark:bg-xroads-500/15 dark:text-xroads-100 dark:ring-xroads-900/50">
                        {branches.find((branch) => branch.id === patient.branchId)?.name ?? patient.branchId}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{patient.phone}</span>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-4 bg-slate-50/70 dark:bg-zinc-950">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-xl">
                      {currentPatient ? currentPatient.name : "Select a patient"}
                    </CardTitle>
                    {currentPatient ? (
                      <Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200 dark:bg-xroads-500/15 dark:text-xroads-100 dark:ring-xroads-900/50">
                        {branches.find((branch) => branch.id === currentPatient.branchId)?.name ?? currentPatient.branchId}
                      </Badge>
                    ) : null}
                    {selectedSessionDetail?.appointmentCode ? (
                      <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:ring-emerald-900/50">
                        Linked to {selectedSessionDetail.appointmentCode}
                      </Badge>
                    ) : selectedAppointment ? (
                      <Badge className="bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-100 dark:ring-sky-900/50">
                        Appointment {selectedAppointment.id}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {currentSession
                      ? `Last updated ${formatSessionLabel(currentSession)} by ${currentSession.recorderName}.`
                      : "Start a new chart or load a previous consultation snapshot."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    className="input h-11 min-w-[180px] text-sm"
                    value={draftDentitionType}
                    disabled={!canEdit}
                    onChange={(event) => handleDentitionChange(event.target.value as DentalDentitionType)}
                  >
                    {DENTITION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} dentition
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-4 lg:p-5">
              {currentPatient ? (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                  <div className="space-y-4">
                    {isChartLoading ? (
                      <EmptyState title="Loading chart" description="Fetching the latest patient chart and surface notes." />
                    ) : (
                      <DentalOdontogram
                        dentitionType={draftDentitionType}
                        selectedToothCode={selectedToothCode}
                        teethByCode={teethByCode}
                        onSelectTooth={setSelectedToothCode}
                        onSurfaceSelect={(_, surfaceCode) =>
                          setSurfaceDraft((current) => ({
                            ...current,
                            surfaceCode,
                          }))
                        }
                        readOnly={!canEdit}
                      />
                    )}
                  </div>

                  <ToothInspector
                    toothCode={selectedToothCode}
                    tooth={selectedTooth}
                    canEdit={canEdit}
                    surfaceDraft={surfaceDraft}
                    onSurfaceDraftChange={setSurfaceDraft}
                    onConditionChange={(condition) =>
                      updateSelectedTooth((current) => ({
                        ...current,
                        condition,
                      }))
                    }
                    onPlannedTreatmentChange={(value) =>
                      updateSelectedTooth((current) => ({
                        ...current,
                        plannedTreatment: value,
                      }))
                    }
                    onCompletedTreatmentChange={(value) =>
                      updateSelectedTooth((current) => ({
                        ...current,
                        completedTreatment: value,
                      }))
                    }
                    onAddSurfaceNote={() => {
                      if (!selectedToothCode || surfaceDraft.note.trim() === "") {
                        return;
                      }

                      updateSelectedTooth((current) => {
                        const surfaceNotes = current.surfaceNotes.filter((note) => note.surfaceCode !== surfaceDraft.surfaceCode);
                        return {
                          ...current,
                          surfaceNotes: [...surfaceNotes, { ...surfaceDraft, note: surfaceDraft.note.trim() }],
                        };
                      });

                      setSurfaceDraft((current) => ({ ...current, note: "" }));
                    }}
                    onRemoveSurfaceNote={(surfaceCode) =>
                      updateSelectedTooth((current) => ({
                        ...current,
                        surfaceNotes: current.surfaceNotes.filter((note) => note.surfaceCode !== surfaceCode),
                      }))
                    }
                  />
                </div>
              ) : (
                <EmptyState title="No patient selected" description="Choose a patient from the list to open or create a chart." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Chart history</CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Previous chart sessions for the selected patient and visit snapshots tied to appointments.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={handleNewChart} disabled={!currentPatient}>
                  <RotateCcw size={16} />
                  Reset draft
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                rows={sessionRows}
                columns={[
                  {
                    key: "session",
                    header: "Session",
                    className: "min-w-[220px]",
                    cell: (session) => (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-slate-950 dark:text-slate-50">{session.chartCode}</div>
                          {selectedSessionId === session.id ? (
                            <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:ring-emerald-900/50">
                              Active
                            </Badge>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{session.appointmentLabel}</div>
                      </div>
                    ),
                  },
                  {
                    key: "dentition",
                    header: "Dentition",
                    cell: (session) => (
                      <Badge className="bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-700">
                        {session.dentitionType}
                      </Badge>
                    ),
                  },
                  {
                    key: "recorder",
                    header: "Recorder",
                    className: "min-w-[160px]",
                    cell: (session) => <span className="text-slate-600 dark:text-slate-300">{session.recorderName}</span>,
                  },
                  {
                    key: "updated",
                    header: "Updated",
                    className: "whitespace-nowrap",
                    cell: (session) => formatSessionLabel(session),
                  },
                  {
                    key: "actions",
                    header: "Actions",
                    className: "w-[120px]",
                    cell: (session) => (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 px-3 text-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          openSession(session.id);
                        }}
                      >
                        Open
                      </Button>
                    ),
                  },
                ]}
                getRowKey={(session) => session.id}
                minWidth="920px"
                emptyTitle="No chart history yet"
                emptyDescription="The selected patient has not been charted yet."
                onRowClick={(session) => {
                  openSession(session.id);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appointment context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedPatientAppointments.length > 0 ? (
                selectedPatientAppointments.slice(0, 4).map((appointment) => (
                  <button
                    type="button"
                    key={appointment.id}
                    onClick={() => handleAppointmentSelection(appointment)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition",
                      selectedAppointment?.id === appointment.id
                        ? "border-xroads-300 bg-xroads-50 dark:border-xroads-500/50 dark:bg-xroads-500/10"
                        : "border-slate-200 bg-white hover:border-xroads-200 hover:bg-xroads-50/40 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-xroads-900/60 dark:hover:bg-zinc-900",
                    )}
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-950 dark:text-slate-50">{appointment.service}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {appointment.patientName} · {appointment.dentistName}
                      </div>
                    </div>
                    <Badge className="bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-100 dark:ring-sky-900/50">
                      {appointment.status}
                    </Badge>
                  </button>
                ))
              ) : (
                <EmptyState title="No appointment context" description="There are no appointments for the selected patient in the current scope." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
