import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, format, isSameDay, isValid, parseISO } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarClock } from "lucide-react";
import type { Appointment, AppointmentStatus } from "../data/appointments";
import { branches } from "../data/branches";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DatePicker } from "../components/ui/date-picker";
import { EmptyState } from "../components/shared/EmptyState";
import { useToast } from "../components/shared/ToastProvider";
import { getBranchBadgeClass } from "../lib/branch-badges";
import { useAppointments } from "../features/appointments/use-appointments";
import { useBranchScope } from "../features/auth/branch-scope";
import { useDentists } from "../features/dentists/use-dentists";
import { ConsultationTableView } from "../components/appointments/ConsultationTableView";
import { ConsultationWorkspaceModal, type ConsultationAction } from "../components/appointments/ConsultationWorkspaceModal";
import { updateAppointmentRecord, updateAppointmentStatus } from "../features/appointments/appointments-service";
import { UPDATED_EVENTS } from "../lib/create-events";

const CONSULTATION_STATUSES: AppointmentStatus[] = ["Arrived", "In Consultation"];

export function ConsultationsPage() {
  const navigate = useNavigate();
  const branchScope = useBranchScope();
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ConsultationAction | null>(null);
  const [busyAppointmentId, setBusyAppointmentId] = useState<string | null>(null);

  const activeBranchId = branchScope.branchId;
  const { appointments, isLoading, error, refetch } = useAppointments();
  const { dentists: visibleDentists } = useDentists(activeBranchId);

  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => isSameDay(parseISO(appointment.date), selectedDate))
        .filter((appointment) => !activeBranchId || appointment.branchId === activeBranchId)
        .sort(sortAppointments),
    [activeBranchId, appointments, selectedDate],
  );

  const consultationAppointments = useMemo(
    () => dayAppointments.filter((appointment) => CONSULTATION_STATUSES.includes(appointment.status)),
    [dayAppointments],
  );

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId],
  );

  const selectedBranchLabel = branchScope.branchLabel;
  const branchName = activeBranchId ? branches.find((item) => item.id === activeBranchId)?.name ?? selectedBranchLabel : "All branches";

  useEffect(() => {
    setSelectedAppointmentId(null);
  }, [activeBranchId, selectedDate]);

  const arrivedCount = consultationAppointments.filter((appointment) => appointment.status === "Arrived").length;
  const inConsultationCount = consultationAppointments.filter((appointment) => appointment.status === "In Consultation").length;
  const completedCount = dayAppointments.filter((appointment) => appointment.status === "Completed").length;
  const waitingCount = dayAppointments.filter((appointment) => appointment.status === "Arrived").length;

  async function handleConsultationAction(action: ConsultationAction, appointment: Appointment, treatmentNotes: string) {
    if (activeAction) {
      return false;
    }

    setActiveAction(action);
    setBusyAppointmentId(appointment.id);

    try {
      const noteResult = await updateAppointmentRecord({
        appointmentCode: appointment.id,
        patientId: appointment.patientId ?? appointment.patientCode ?? appointment.id,
        dentistId: appointment.dentistId,
        serviceId: appointment.serviceId ?? appointment.serviceCode ?? appointment.id,
        date: appointment.date,
        time: appointment.time,
        durationMinutes: appointment.durationMinutes ?? 30,
        notes: treatmentNotes,
        emergency: appointment.emergency,
      });

      if (noteResult.error) {
        showToast({
          title: "Could not save consultation notes",
          description: noteResult.error,
          variant: "error",
        });
        return false;
      }

      if (action === "save") {
        dispatchAppointmentUpdate(noteResult.data);
        void refetch();
        showToast({
          title: "Consultation notes saved",
          description: `${appointment.patientName}'s treatment plan has been updated.`,
        });
        return true;
      }

      const nextStatus = action === "start" ? "In Consultation" : "Completed";
      const statusResult = await updateAppointmentStatus({
        appointmentCode: appointment.id,
        status: nextStatus,
      });

      if (statusResult.error || !statusResult.data) {
        showToast({
          title: "Could not update consultation status",
          description: statusResult.error ?? "We could not move the appointment forward.",
          variant: "error",
        });
        return false;
      }

      window.dispatchEvent(new CustomEvent(UPDATED_EVENTS.appointment, { detail: statusResult.data }));
      void refetch();
      showToast({
        title: action === "start" ? "Consultation started" : "Consultation completed",
        description:
          action === "start"
            ? `${statusResult.data.patientName} is now with the doctor.`
            : `${statusResult.data.patientName}'s treatment plan has been recorded.`,
      });

      if (action === "complete") {
        setSelectedAppointmentId(null);
      }

      return true;
    } finally {
      setActiveAction(null);
      setBusyAppointmentId(null);
    }
  }

  async function handleStartConsultation(appointment: Appointment, treatmentNotes: string) {
    const success = await handleConsultationAction("start", appointment, treatmentNotes);
    if (!success) {
      return;
    }

    navigate(
      `/dental-chart?patientId=${encodeURIComponent(appointment.patientId ?? appointment.patientCode ?? "")}&appointmentCode=${encodeURIComponent(appointment.id)}`,
    );
    setSelectedAppointmentId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="page-title">Consultations</h1>
          <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Record treatment plans, capture clinical notes, and move each patient through the consultation workflow.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3 bg-slate-50/70 px-3 py-3 dark:bg-zinc-950 sm:px-4 sm:py-4">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock size={16} className="text-xroads-600" />
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </CardTitle>
                <Badge className={`${getBranchBadgeClass(branchName)} px-2 py-0.5 text-[11px] font-semibold`}>
                  {branchName}
                </Badge>
                <Badge className="bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-900/50">
                  {waitingCount} waiting
                </Badge>
                <Badge className="bg-xroads-50 px-2 py-0.5 text-[11px] text-xroads-700 ring-xroads-200 dark:bg-xroads-500/10 dark:text-xroads-100 dark:ring-xroads-900/50">
                  {inConsultationCount} in consult
                </Badge>
                <Badge className="bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-100 dark:ring-emerald-900/50">
                  {completedCount} completed
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {visibleDentists.length} dentists · {arrivedCount} ready to see the doctor
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="h-9 w-9 p-0" aria-label="Previous day" onClick={() => setSelectedDate((current) => addDays(current, -1))}>
                <ArrowLeft size={16} />
              </Button>
              <DatePicker
                value={format(selectedDate, "yyyy-MM-dd")}
                onChange={(value) => {
                  const nextDate = parseISO(value);
                  if (isValid(nextDate)) {
                    setSelectedDate(nextDate);
                  }
                }}
                placeholder="Select date"
                className="h-9 min-w-[172px] justify-center border-transparent bg-white px-2.5 text-sm shadow-none dark:bg-zinc-950"
              />
              <Button type="button" variant="outline" className="h-9 w-9 p-0" aria-label="Next day" onClick={() => setSelectedDate((current) => addDays(current, 1))}>
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          {isLoading && appointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
              <EmptyState
                title="Loading consultations"
                description="Fetching today's appointments and consultation queue from the database."
              />
            </div>
          ) : null}

          {!error && !isLoading && consultationAppointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
              <EmptyState
                title="No consultations yet"
                description="Once patients arrive from check-in, they will appear here for treatment planning and clinical notes."
              />
            </div>
          ) : null}

          <ConsultationTableView
            appointments={consultationAppointments}
            onAppointmentClick={setSelectedAppointmentId}
            onAdvanceStatus={(appointment, nextStatus) => {
              const action: ConsultationAction = nextStatus === "In Consultation" ? "start" : "complete";
              void handleConsultationAction(action, appointment, appointment.notes);
            }}
            updatingAppointmentId={busyAppointmentId}
          />
        </CardContent>
      </Card>

      <ConsultationWorkspaceModal
        open={Boolean(selectedAppointment)}
        booking={selectedAppointment}
        activeAction={activeAction}
        onClose={() => setSelectedAppointmentId(null)}
        onAction={(action, appointment, treatmentNotes) => void handleConsultationAction(action, appointment, treatmentNotes)}
        onStartConsultation={(appointment, treatmentNotes) => void handleStartConsultation(appointment, treatmentNotes)}
        onOpenDentalChart={(appointment) => {
          navigate(
            `/dental-chart?patientId=${encodeURIComponent(appointment.patientId ?? appointment.patientCode ?? "")}&appointmentCode=${encodeURIComponent(appointment.id)}`,
          );
          setSelectedAppointmentId(null);
        }}
      />
    </div>
  );
}

function sortAppointments(left: Appointment, right: Appointment) {
  const leftDate = `${left.date}T${left.time}`;
  const rightDate = `${right.date}T${right.time}`;
  return leftDate.localeCompare(rightDate);
}

function dispatchAppointmentUpdate(appointment: Appointment | null) {
  if (!appointment) {
    return;
  }

  window.dispatchEvent(new CustomEvent(UPDATED_EVENTS.appointment, { detail: appointment }));
}
