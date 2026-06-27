import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, isValid, parseISO } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarClock, Plus } from "lucide-react";
import type { Appointment, AppointmentStatus } from "../data/appointments";
import { branches } from "../data/branches";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DatePicker } from "../components/ui/date-picker";
import { EmptyState } from "../components/shared/EmptyState";
import { useToast } from "../components/shared/ToastProvider";
import { getBranchBadgeClass } from "../lib/branch-badges";
import { CheckInTableView } from "../components/appointments/CheckInTableView";
import { BookingDetailModal } from "../components/appointments/BookingDetailModal";
import { ConfirmDeleteAppointmentModal } from "../components/appointments/ConfirmDeleteAppointmentModal";
import { NewBookingModal, type NewBookingInitialValues } from "../components/appointments/NewBookingModal";
import { useAppointments } from "../features/appointments/use-appointments";
import { useDentists } from "../features/dentists/use-dentists";
import { useBranchScope } from "../features/auth/branch-scope";
import {
  deleteAppointmentRecord,
  updateAppointmentStatus,
} from "../features/appointments/appointments-service";
import { UPDATED_EVENTS } from "../lib/create-events";
const QUICK_STATUSES: AppointmentStatus[] = ["Pending", "Confirmed", "Arrived", "In Consultation"];

export function CheckInsPage() {
  const branchScope = useBranchScope();
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [createSeed, setCreateSeed] = useState<NewBookingInitialValues | undefined>(undefined);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null);
  const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);

  const activeBranchId = branchScope.branchId;
  const { appointments, isLoading, error, refetch } = useAppointments();
  const { dentists: visibleDentists, isLoading: isDentistsLoading, error: dentistsError } = useDentists(activeBranchId);

  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => isSameDay(parseISO(appointment.date), selectedDate))
        .filter((appointment) => !activeBranchId || appointment.branchId === activeBranchId)
        .sort(sortAppointments),
    [activeBranchId, appointments, selectedDate],
  );

  const actionableAppointments = useMemo(
    () => dayAppointments.filter((appointment) => QUICK_STATUSES.includes(appointment.status)),
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

  function handleCreateAppointment() {
    setCreateSeed({
      source: "toolbar",
      date: format(selectedDate, "yyyy-MM-dd"),
      time: "08:30",
      dentistId: visibleDentists[0]?.id,
    });
    setCreateOpen(true);
  }

  function handleAppointmentCreated(booking: Appointment) {
    setSelectedDate(parseISO(booking.date));
    void refetch();
  }

  function handleAppointmentUpdated() {
    void refetch();
    setEditTarget(null);
  }

  async function handleAdvanceStatus(appointment: Appointment, nextStatus: AppointmentStatus) {
    if (updatingAppointmentId) {
      return;
    }

    setUpdatingAppointmentId(appointment.id);

    try {
      const result = await updateAppointmentStatus({
        appointmentCode: appointment.id,
        status: nextStatus,
      });

      if (result.error || !result.data) {
        showToast({
          title: "Could not update check-in status",
          description: result.error ?? "We could not move the appointment to the next stage.",
          variant: "error",
        });
        return;
      }

      window.dispatchEvent(new CustomEvent(UPDATED_EVENTS.appointment, { detail: result.data }));
      void refetch();
      showToast({
        title: queueStatusToastTitle(nextStatus),
        description: `${result.data.patientName} is now ${queueStatusToastDescription(nextStatus)}.`,
      });
    } finally {
      setUpdatingAppointmentId(null);
    }
  }

  async function handleDeleteAppointment() {
    if (!deleteTarget) {
      return;
    }

    setIsDeletingAppointment(true);

    try {
      const result = await deleteAppointmentRecord(deleteTarget.id);

      if (result.error) {
        showToast({
          title: "Could not delete appointment",
          description: result.error,
          variant: "error",
        });
        return;
      }

      setDeleteTarget(null);
      setSelectedAppointmentId(null);
      setEditTarget(null);
      void refetch();
      showToast({
        title: "Appointment deleted",
        description: `${deleteTarget.patientName}'s appointment was removed from the schedule.`,
      });
    } finally {
      setIsDeletingAppointment(false);
    }
  }

  const actionableCount = actionableAppointments.length;
  const arrivedCount = actionableAppointments.filter((appointment) => appointment.status === "Arrived").length;
  const consultationCount = actionableAppointments.filter((appointment) => appointment.status === "In Consultation").length;
  const bookedCount = dayAppointments.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="page-title">Check-ins</h1>
          <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Move patients from arrival to consultation and completion from one dedicated workflow screen.
          </p>
        </div>
        <Button type="button" onClick={handleCreateAppointment} className="h-10">
          <Plus size={16} />
          Create appointment
        </Button>
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
                <Badge className="bg-white px-2 py-0.5 text-[11px] text-slate-700 ring-slate-200 dark:bg-zinc-950 dark:text-slate-200 dark:ring-zinc-800">
                  {actionableCount} ready
                </Badge>
                <Badge className="bg-white px-2 py-0.5 text-[11px] text-slate-700 ring-slate-200 dark:bg-zinc-950 dark:text-slate-200 dark:ring-zinc-800">
                  {bookedCount} booked
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {visibleDentists.length} dentists · {arrivedCount} arrived · {consultationCount} in consultation
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
          {dentistsError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              {dentistsError}
            </div>
          ) : null}
          {isDentistsLoading && visibleDentists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
              <EmptyState title="Loading dentists" description="Fetching branch dentist profiles from the database." />
            </div>
          ) : null}

          <CheckInTableView
            appointments={dayAppointments}
            onAppointmentClick={setSelectedAppointmentId}
            onAdvanceStatus={handleAdvanceStatus}
            updatingAppointmentId={updatingAppointmentId}
          />
        </CardContent>
      </Card>

      <NewBookingModal
        open={createOpen || editTarget !== null}
        appointment={editTarget}
        mode={editTarget ? "edit" : "create"}
        initialValues={createSeed}
        appointments={appointments}
        appointmentsLoading={isLoading}
        appointmentsError={error}
        onClose={() => {
          setCreateOpen(false);
          setEditTarget(null);
        }}
        onCreate={handleAppointmentCreated}
        onUpdate={handleAppointmentUpdated}
      />
      <BookingDetailModal
        open={Boolean(selectedAppointment)}
        booking={selectedAppointment}
        onClose={() => setSelectedAppointmentId(null)}
        onEdit={(appointment) => {
          setSelectedAppointmentId(null);
          setEditTarget(appointment);
        }}
        onDelete={(appointment) => {
          setSelectedAppointmentId(null);
          setDeleteTarget(appointment);
        }}
      />
      <ConfirmDeleteAppointmentModal
        open={deleteTarget !== null}
        appointment={deleteTarget}
        isDeleting={isDeletingAppointment}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteAppointment()}
      />
    </div>
  );
}

function sortAppointments(left: Appointment, right: Appointment) {
  const leftDate = `${left.date}T${left.time}`;
  const rightDate = `${right.date}T${right.time}`;
  return leftDate.localeCompare(rightDate);
}

function queueStatusToastTitle(status: AppointmentStatus) {
  switch (status) {
    case "Arrived":
      return "Patient checked in";
    case "In Consultation":
      return "Consultation started";
    case "Completed":
      return "Appointment completed";
    default:
      return "Appointment updated";
  }
}

function queueStatusToastDescription(status: AppointmentStatus) {
  switch (status) {
    case "Arrived":
      return "ready to be seen";
    case "In Consultation":
      return "with the doctor";
    case "Completed":
      return "and marked complete";
    default:
      return "updated";
  }
}
