import { useEffect, useMemo, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { addDays, addMinutes, format, isSameDay, isValid, parseISO } from "date-fns";
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarClock, Clock3, LayoutGrid, Plus, Table2 } from "lucide-react";
import type { Appointment, AppointmentStatus } from "../data/appointments";
import { branches } from "../data/branches";
import type { Dentist } from "../data/dentists";
import { BookingDetailModal } from "../components/appointments/BookingDetailModal";
import { AppointmentTableView } from "../components/appointments/AppointmentTableView";
import { ConfirmDeleteAppointmentModal } from "../components/appointments/ConfirmDeleteAppointmentModal";
import { NewBookingModal, type NewBookingInitialValues } from "../components/appointments/NewBookingModal";
import { Badge, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DatePicker } from "../components/ui/date-picker";
import { EmptyState } from "../components/shared/EmptyState";
import { FilterField } from "../components/shared/Filters";
import { useToast } from "../components/shared/ToastProvider";
import { cn } from "../lib/utils";
import { getBranchBadgeClass } from "../lib/branch-badges";
import { normalizeTimeString } from "../lib/time";
import { deleteAppointmentRecord, updateAppointmentRecord } from "../features/appointments/appointments-service";
import { useAppointments } from "../features/appointments/use-appointments";
import { useDentists } from "../features/dentists/use-dentists";
import { UPDATED_EVENTS } from "../lib/create-events";
import { useBranchScope } from "../features/auth/branch-scope";
import {
  DEFAULT_WORKDAY_END,
  DEFAULT_WORKDAY_START,
  SLOT_INTERVAL_MINUTES,
  SCHEDULER_HEADER_HEIGHT,
  SCHEDULER_SLOT_ROW_HEIGHT,
  buildTimeSlots,
  clampSlotIndex,
  getAppointmentDurationMinutes,
  getAppointmentSlotSpan,
  formatTimeRange,
  minutesFromTime,
  parseClinicHours,
  timeFromMinutes,
} from "../components/appointments/scheduler-utils";

type AppointmentEditMode = "move" | "resize-start" | "resize-end";

type AppointmentPreview = {
  appointmentId: string;
  dentistId: string;
  time: string;
  durationMinutes: number;
};

type DragSession = {
  appointmentId: string;
  mode: AppointmentEditMode;
  pointerId: number;
  originalDentistId: string;
  originalStartIndex: number;
  originalSpan: number;
  initialDentistIndex: number;
  initialPointerX: number;
  initialPointerY: number;
  initialOffsetX: number;
  initialOffsetY: number;
  active: boolean;
};

const statusOptions: Array<AppointmentStatus | "All"> = [
  "All",
  "Pending",
  "Confirmed",
  "Arrived",
  "In Consultation",
  "Completed",
  "Cancelled",
  "No-show",
  "Rescheduled",
];

export function AppointmentsPage() {
  const branchScope = useBranchScope();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [status, setStatus] = useState<AppointmentStatus | "All">("All");
  const [viewMode, setViewMode] = useState<"slots" | "table">("slots");
  const [createOpen, setCreateOpen] = useState(false);
  const [createSeed, setCreateSeed] = useState<NewBookingInitialValues | undefined>(undefined);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [appointmentPreview, setAppointmentPreview] = useState<AppointmentPreview | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);
  const [dragSession, setDragSession] = useState<DragSession | null>(null);
  const { showToast } = useToast();
  const { appointments: appointmentList, isLoading: isAppointmentsLoading, error: appointmentsError, refetch } = useAppointments();
  const activeBranchId = branchScope.branchId;
  const { dentists: visibleDentists, isLoading: isDentistsLoading, error: dentistsError } = useDentists(activeBranchId);
  const schedulerGridRef = useRef<HTMLDivElement | null>(null);
  const dentistColumnRefs = useRef(new Map<string, HTMLDivElement | null>());
  const pendingLongPressRef = useRef<number | null>(null);
  const longPressOriginRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  const workdayHours = useMemo(() => {
    const branchScope = activeBranchId ? branches.filter((item) => item.id === activeBranchId) : branches;
    const parsedHours = branchScope
      .map((item) => parseClinicHours(item.hours))
      .filter((item): item is { start: string; end: string } => item !== null);

    if (!parsedHours.length) {
      return {
        start: DEFAULT_WORKDAY_START,
        end: DEFAULT_WORKDAY_END,
      };
    }

    const start = Math.min(...parsedHours.map((item) => minutesFromTime(item.start)));
    const end = Math.max(...parsedHours.map((item) => minutesFromTime(item.end)));

    return {
      start: timeFromMinutes(start),
      end: timeFromMinutes(end),
    };
  }, [activeBranchId]);

  const timeSlots = useMemo(() => buildTimeSlots(workdayHours.start, workdayHours.end, SLOT_INTERVAL_MINUTES), [workdayHours]);

  const visibleAppointments = useMemo(() => {
    return appointmentList
      .filter((appointment) => {
        const dateMatch = isSameDay(parseISO(appointment.date), selectedDate);
        const branchMatch = !activeBranchId || appointment.branchId === activeBranchId;
        const statusMatch = status === "All" || appointment.status === status;

        return dateMatch && branchMatch && statusMatch;
      })
      .sort(sortAppointments);
  }, [activeBranchId, appointmentList, selectedDate, status]);

  const appointmentPreviewData = useMemo(() => {
    if (!appointmentPreview) {
      return null;
    }

    const baseAppointment = appointmentList.find((appointment) => appointment.id === appointmentPreview.appointmentId) ?? null;
    if (!baseAppointment) {
      return null;
    }

    const previewDentist = visibleDentists.find((dentist) => dentist.id === appointmentPreview.dentistId) ?? null;

    return {
      ...baseAppointment,
      dentistId: appointmentPreview.dentistId,
      dentistName: previewDentist?.name ?? baseAppointment.dentistName,
      dentistRole: previewDentist?.role ?? baseAppointment.dentistRole,
      dentistMarker: previewDentist?.appointmentMarker ?? baseAppointment.dentistMarker ?? null,
      time: appointmentPreview.time,
      durationMinutes: appointmentPreview.durationMinutes,
    } satisfies Appointment;
  }, [appointmentList, appointmentPreview, visibleDentists]);

  const selectedAppointment = useMemo(
    () => appointmentList.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [appointmentList, selectedAppointmentId],
  );

  const positionedAppointments = useMemo(() => {
    const gridStartRow = 2;

    return visibleAppointments.flatMap((appointment) => {
      const liveAppointment = appointmentPreviewData?.id === appointment.id ? appointmentPreviewData : appointment;
      const dentistColumn = visibleDentists.findIndex((dentist) => dentist.id === liveAppointment.dentistId);
      const startIndex = timeSlots.indexOf(liveAppointment.time);
      if (dentistColumn === -1 || startIndex === -1) {
        return [];
      }

      const durationMinutes = getAppointmentDurationMinutes(liveAppointment);
      const span = getAppointmentSlotSpan(durationMinutes);
      const rowStart = gridStartRow + startIndex;
      const rowSpan = Math.min(span, timeSlots.length - startIndex);
      const columnStart = dentistColumn + 2;

      return [
        {
          appointment: liveAppointment,
          columnStart,
          rowStart,
          rowSpan,
        },
      ];
    });
  }, [appointmentPreviewData, timeSlots, visibleAppointments, visibleDentists]);

  const occupiedSlots = useMemo(() => {
    const map = new Map<string, Set<number>>();

    for (const item of positionedAppointments) {
      const dentistId = item.appointment.dentistId;
      const slots = map.get(dentistId) ?? new Set<number>();
      const startIndex = timeSlots.indexOf(item.appointment.time);
      const durationMinutes = getAppointmentDurationMinutes(item.appointment);
      const span = getAppointmentSlotSpan(durationMinutes);

      for (let index = startIndex; index < Math.min(timeSlots.length, startIndex + span); index += 1) {
        slots.add(index);
      }

      map.set(dentistId, slots);
    }

    return map;
  }, [positionedAppointments, timeSlots]);

  const totalSlots = timeSlots.length * visibleDentists.length;
  const bookedSlots = positionedAppointments.reduce((count, item) => count + item.rowSpan, 0);
  const availableSlots = Math.max(0, totalSlots - bookedSlots);

  const hasVisibleDentists = visibleDentists.length > 0;
  const selectedDayLabel = format(selectedDate, "EEEE, MMMM d, yyyy");
  const selectedBranchLabel = branchScope.branchLabel;

  useEffect(() => {
    setSelectedAppointmentId(null);
  }, [activeBranchId, selectedDate, status]);

  function openAppointmentModal(seed?: NewBookingInitialValues) {
    setCreateSeed(seed);
    setCreateOpen(true);
  }

  function handleCreateFromToolbar() {
    const fallbackDentist = visibleDentists[0];
    if (!fallbackDentist) return;

    openAppointmentModal({
      source: "toolbar",
      dentistId: fallbackDentist.id,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: timeSlots[0] ?? DEFAULT_WORKDAY_START,
    });
  }

  function handleSlotClick(dentistId: string, dateTime: string) {
    const dentist = visibleDentists.find((item) => item.id === dentistId);
    if (!dentist) return;

    openAppointmentModal({
      source: "slot",
      dentistId: dentist.id,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: dateTime,
    });
  }

  function handleAppointmentCreated() {
    void refetch();
    setViewMode("table");
  }

  function handleAppointmentUpdated() {
    void refetch();
    setEditTarget(null);
  }

  function handleEditAppointment(appointment: Appointment) {
    setEditTarget(appointment);
  }

  function handleDeleteAppointment(appointment: Appointment) {
    setDeleteTarget(appointment);
  }

  async function confirmDeleteAppointment() {
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
        variant: "success",
      });
    } finally {
      setIsDeletingAppointment(false);
    }
  }

  function handleAppointmentClick(appointmentId: string) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    if (editingAppointmentId === appointmentId || dragSession || isSavingEdit) {
      return;
    }

    setSelectedAppointmentId(appointmentId);
  }

  function clearLongPressTimer() {
    if (pendingLongPressRef.current !== null) {
      window.clearTimeout(pendingLongPressRef.current);
      pendingLongPressRef.current = null;
    }
    longPressOriginRef.current = null;
  }

  function clearEditState() {
    clearLongPressTimer();
    setDragSession(null);
    setEditingAppointmentId(null);
    setAppointmentPreview(null);
    setIsSavingEdit(false);
    suppressClickRef.current = false;
  }

  function getDentistIndexFromClientX(clientX: number) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    visibleDentists.forEach((dentist, index) => {
      const column = dentistColumnRefs.current.get(dentist.id);
      if (!column) return;

      const rect = column.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(clientX - center);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    return bestIndex;
  }

  function getSlotIndexFromClientY(clientY: number, offsetY = 0) {
    const gridRect = schedulerGridRef.current?.getBoundingClientRect();
    if (!gridRect) {
      return 0;
    }

    const relativeY = clientY - gridRect.top - SCHEDULER_HEADER_HEIGHT - offsetY;
    const slotIndex = Math.round(relativeY / SCHEDULER_SLOT_ROW_HEIGHT);
    return clampSlotIndex(slotIndex, timeSlots.length);
  }

  function handleAppointmentPointerDown(appointment: Appointment, event: ReactPointerEvent<HTMLButtonElement>) {
    if (isSavingEdit) return;
    if (event.button !== 0) return;

    if (editingAppointmentId === appointment.id) {
      beginDragSession(appointment, "move", event);
      return;
    }

    clearLongPressTimer();
    longPressOriginRef.current = { x: event.clientX, y: event.clientY };
    pendingLongPressRef.current = window.setTimeout(() => {
      suppressClickRef.current = true;
      setEditingAppointmentId(appointment.id);
      setAppointmentPreview(null);
      pendingLongPressRef.current = null;
      longPressOriginRef.current = null;
    }, 260);
  }

  function handleAppointmentPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!pendingLongPressRef.current || !longPressOriginRef.current) {
      return;
    }

    const distance = Math.hypot(event.clientX - longPressOriginRef.current.x, event.clientY - longPressOriginRef.current.y);
    if (distance > 8) {
      clearLongPressTimer();
    }
  }

  function handleAppointmentPointerEnd() {
    clearLongPressTimer();
  }

  function beginDragSession(appointment: Appointment, mode: AppointmentEditMode, event: ReactPointerEvent<HTMLElement>) {
    if (isSavingEdit) return;
    event.preventDefault();
    event.stopPropagation();

    const startIndex = timeSlots.indexOf(appointment.time);
    if (startIndex === -1) return;

    const dentistIndex = visibleDentists.findIndex((dentist) => dentist.id === appointment.dentistId);
    if (dentistIndex === -1) return;

    const span = getAppointmentSlotSpan(getAppointmentDurationMinutes(appointment));
    const nextSession: DragSession = {
      appointmentId: appointment.id,
      mode,
      pointerId: event.pointerId,
      originalDentistId: appointment.dentistId,
      originalStartIndex: startIndex,
      originalSpan: span,
      initialDentistIndex: dentistIndex,
      initialPointerX: event.clientX,
      initialPointerY: event.clientY,
      initialOffsetX: 0,
      initialOffsetY:
        event.clientY -
        (schedulerGridRef.current?.getBoundingClientRect().top ?? 0) -
        SCHEDULER_HEADER_HEIGHT -
        startIndex * SCHEDULER_SLOT_ROW_HEIGHT,
      active: true,
    };
    if (event.currentTarget && "setPointerCapture" in event.currentTarget) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Ignore pointer-capture failures; document listeners still handle the drag.
      }
    }
    setDragSession(nextSession);
    suppressClickRef.current = true;

    const previewDuration = span * SLOT_INTERVAL_MINUTES;
    setEditingAppointmentId(appointment.id);
    setAppointmentPreview({
      appointmentId: appointment.id,
      dentistId: appointment.dentistId,
      time: appointment.time,
      durationMinutes: previewDuration,
    });
  }

  function buildPreviewForSession(session: DragSession, clientX: number, clientY: number) {
    const appointment = appointmentList.find((item) => item.id === session.appointmentId);
    if (!appointment) {
      return null;
    }

    const totalSlots = timeSlots.length;
    const rowIndex = getSlotIndexFromClientY(clientY, session.mode === "move" ? session.initialOffsetY : 0);
    const dentistIndex = getDentistIndexFromClientX(clientX);
    const normalizedDentist = visibleDentists[dentistIndex] ?? visibleDentists[session.initialDentistIndex] ?? null;

    if (session.mode === "resize-start") {
      const fixedEndIndex = session.originalStartIndex + session.originalSpan;
      const nextStartIndex = Math.min(Math.max(0, rowIndex), fixedEndIndex - 1);
      const nextSpan = Math.max(1, fixedEndIndex - nextStartIndex);

      return {
        appointmentId: appointment.id,
        dentistId: appointment.dentistId,
        time: timeSlots[nextStartIndex] ?? appointment.time,
        durationMinutes: nextSpan * SLOT_INTERVAL_MINUTES,
      } satisfies AppointmentPreview;
    }

    if (session.mode === "resize-end") {
      const minEndIndex = session.originalStartIndex + 1;
      const nextEndIndex = Math.min(totalSlots, Math.max(minEndIndex, rowIndex + 1));
      const nextSpan = Math.max(1, nextEndIndex - session.originalStartIndex);

      return {
        appointmentId: appointment.id,
        dentistId: appointment.dentistId,
        time: timeSlots[session.originalStartIndex] ?? appointment.time,
        durationMinutes: nextSpan * SLOT_INTERVAL_MINUTES,
      } satisfies AppointmentPreview;
    }

    const nextStartIndex = clampSlotIndex(rowIndex, totalSlots, session.originalSpan);
    const nextStartTime = timeSlots[nextStartIndex] ?? appointment.time;
    return {
      appointmentId: appointment.id,
      dentistId: normalizedDentist?.id ?? appointment.dentistId,
      time: nextStartTime,
      durationMinutes: session.originalSpan * SLOT_INTERVAL_MINUTES,
    } satisfies AppointmentPreview;
  }

  useEffect(() => {
    if (!dragSession) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      if (event.pointerId !== dragSession.pointerId) {
        return;
      }

      const preview = buildPreviewForSession(dragSession, event.clientX, event.clientY);
      if (preview) {
        setAppointmentPreview(preview);
      }
    };

    const handleUp = async (event: PointerEvent) => {
      if (event.pointerId !== dragSession.pointerId) {
        return;
      }

      const preview = buildPreviewForSession(dragSession, event.clientX, event.clientY);
      const baseAppointment = appointmentList.find((item) => item.id === dragSession.appointmentId);
      setDragSession(null);

      if (!baseAppointment || !preview) {
        clearEditState();
        return;
      }

      const changed =
        preview.dentistId !== baseAppointment.dentistId ||
        preview.time !== baseAppointment.time ||
        preview.durationMinutes !== getAppointmentDurationMinutes(baseAppointment);

      if (!changed) {
        setAppointmentPreview(null);
        setEditingAppointmentId(baseAppointment.id);
        return;
      }

      setIsSavingEdit(true);
      const result = await updateAppointmentRecord({
        appointmentCode: baseAppointment.id,
        dentistId: preview.dentistId,
        date: baseAppointment.date,
        time: preview.time,
        durationMinutes: preview.durationMinutes,
      });

      setIsSavingEdit(false);

      if (result.error || !result.data) {
        setAppointmentPreview(null);
        setEditingAppointmentId(baseAppointment.id);
        showToast({
          title: "Could not update appointment",
          description: result.error ?? "We could not update the appointment. Please try again.",
          variant: "error",
        });
        return;
      }

      window.dispatchEvent(new CustomEvent(UPDATED_EVENTS.appointment, { detail: result.data }));
      clearEditState();
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    document.addEventListener("pointercancel", handleUp);

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("pointercancel", handleUp);
    };
  }, [appointmentList, dragSession, timeSlots, visibleDentists]);

  useEffect(() => {
    if (!editingAppointmentId) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(`[data-appointment-id="${editingAppointmentId}"]`)) {
        return;
      }

      clearEditState();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearEditState();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingAppointmentId]);

  useEffect(() => {
    clearEditState();
  }, [activeBranchId, selectedDate, status, viewMode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="space-y-1">
          <h1 className="page-title">Appointments</h1>
          <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            A day scheduler for clinic operations with time slots, resource columns, and quick appointment creation.
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
                  {selectedDayLabel}
                </CardTitle>
                <Badge className={`${getBranchBadgeClass(selectedBranchLabel)} px-2 py-0.5 text-[11px] font-semibold`}>
                  {selectedBranchLabel}
                </Badge>
                <Badge className="bg-white px-2 py-0.5 text-[11px] text-slate-700 ring-slate-200 dark:bg-zinc-950 dark:text-slate-200 dark:ring-zinc-800">
                  Booked {bookedSlots} slots
                </Badge>
                <Badge className="bg-white px-2 py-0.5 text-[11px] text-slate-700 ring-slate-200 dark:bg-zinc-950 dark:text-slate-200 dark:ring-zinc-800">
                  Open {availableSlots} slots
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {visibleDentists.length} dentists · {visibleAppointments.length} appointments
              </p>
            </div>

            <Button type="button" onClick={handleCreateFromToolbar} className="h-9 w-full px-3 lg:w-auto">
              <Plus size={15} />
              Create appointment
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-3">
            <div className="flex flex-col gap-2.5 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex flex-wrap items-end gap-2.5">
                <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <Button
                    variant="ghost"
                    className="h-9 w-9 rounded-lg p-0"
                    aria-label="Previous day"
                    onClick={() => setSelectedDate((current) => addDays(current, -1))}
                  >
                    <ArrowLeft size={18} strokeWidth={2.5} className="text-slate-600 dark:text-slate-300" />
                  </Button>
                  <DatePicker
                    value={format(selectedDate, "yyyy-MM-dd")}
                    onChange={(value) => {
                      const nextDate = parseISO(value);
                      if (!Number.isNaN(nextDate.getTime())) {
                        setSelectedDate(nextDate);
                      }
                    }}
                    placeholder="Select date"
                    className="h-8 min-w-[172px] justify-center border-transparent bg-white px-2.5 text-sm shadow-none dark:bg-zinc-950"
                  />
                  <Button
                    variant="ghost"
                    className="h-9 w-9 rounded-lg p-0"
                    aria-label="Next day"
                    onClick={() => setSelectedDate((current) => addDays(current, 1))}
                  >
                    <ArrowRight size={18} strokeWidth={2.5} className="text-slate-600 dark:text-slate-300" />
                  </Button>
                </div>
                <FilterField label="Status" className="gap-1 min-w-[180px]">
                  <select className="input h-9 text-sm" value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus | "All")}>
                    {statusOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </FilterField>
              </div>

              <div className="flex items-center xl:justify-end">
                <ViewSwitch value={viewMode} onChange={setViewMode} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          {appointmentsError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
              {appointmentsError}
            </div>
          ) : null}
          {dentistsError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              {dentistsError}
            </div>
          ) : null}

          {isDentistsLoading && !hasVisibleDentists ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
              <EmptyState title="Loading dentists" description="Fetching branch dentist profiles from the database." />
            </div>
          ) : null}

          {viewMode === "slots" ? (
            hasVisibleDentists ? (
              <AppointmentSchedulerGrid
                gridRef={schedulerGridRef}
                resourceDentists={visibleDentists}
                timeSlots={timeSlots}
                occupiedSlots={occupiedSlots}
                positionedAppointments={positionedAppointments}
                onSlotClick={handleSlotClick}
                onAppointmentClick={handleAppointmentClick}
                editingAppointmentId={editingAppointmentId}
                onAppointmentPointerDown={handleAppointmentPointerDown}
                onAppointmentPointerMove={handleAppointmentPointerMove}
                onAppointmentPointerUp={handleAppointmentPointerEnd}
                onAppointmentHandleDragStart={beginDragSession}
                columnRefs={dentistColumnRefs}
              />
            ) : null
          ) : (
            <AppointmentTableView appointments={visibleAppointments} onAppointmentClick={handleAppointmentClick} />
          )}
        </CardContent>
      </Card>

      <NewBookingModal
        open={createOpen || editTarget !== null}
        initialValues={createSeed}
        appointment={editTarget}
        mode={editTarget ? "edit" : "create"}
        appointments={appointmentList}
        appointmentsLoading={isAppointmentsLoading}
        appointmentsError={appointmentsError}
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
        onConfirm={() => void confirmDeleteAppointment()}
      />
    </div>
  );
}

function AppointmentSchedulerGrid({
  gridRef,
  resourceDentists,
  timeSlots,
  occupiedSlots,
  positionedAppointments,
  onSlotClick,
  onAppointmentClick,
  editingAppointmentId,
  onAppointmentPointerDown,
  onAppointmentPointerMove,
  onAppointmentPointerUp,
  onAppointmentHandleDragStart,
  columnRefs,
}: {
  gridRef: RefObject<HTMLDivElement | null>;
  resourceDentists: Dentist[];
  timeSlots: string[];
  occupiedSlots: Map<string, Set<number>>;
  positionedAppointments: Array<{
    appointment: Appointment;
    columnStart: number;
    rowStart: number;
    rowSpan: number;
  }>;
  onSlotClick: (dentistId: string, dateTime: string) => void;
  onAppointmentClick: (appointmentId: string) => void;
  editingAppointmentId: string | null;
  onAppointmentPointerDown: (appointment: Appointment, event: ReactPointerEvent<HTMLButtonElement>) => void;
  onAppointmentPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onAppointmentPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onAppointmentHandleDragStart: (appointment: Appointment, mode: AppointmentEditMode, event: ReactPointerEvent<HTMLElement>) => void;
  columnRefs: MutableRefObject<Map<string, HTMLDivElement | null>>;
}) {
  const gridTemplateColumns = `92px repeat(${resourceDentists.length}, minmax(220px, 1fr))`;
  const gridTemplateRows = `${SCHEDULER_HEADER_HEIGHT}px repeat(${timeSlots.length}, 62px)`;

  return (
    <div className="overflow-x-auto">
      <div
        ref={gridRef}
        className="relative min-w-[1120px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        style={{ gridTemplateColumns, gridTemplateRows, display: "grid" }}
      >
        <div className="sticky left-0 top-0 z-40 flex items-center justify-center border-b border-r border-slate-200 bg-slate-50 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-400">
          Time
        </div>

        {resourceDentists.map((dentist, index) => (
          <div
            key={dentist.id}
            ref={(node) => {
              columnRefs.current.set(dentist.id, node);
            }}
            className={cn(
              "sticky top-0 z-30 border-b border-r border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900",
              index === resourceDentists.length - 1 && "border-r-0",
            )}
            style={{ gridColumn: index + 2, gridRow: 1 }}
          >
            <div className="flex h-full min-w-0 flex-col justify-center gap-0.5">
              <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{dentist.name}</div>
              <div className="flex min-w-0 flex-col text-xs leading-4 text-slate-500 dark:text-slate-400">
                <span className="truncate">{dentist.role}</span>
                <Badge className={`${getBranchBadgeClass(branches.find((item) => item.id === dentist.branchId)?.name)} px-2 py-0.5 text-[10px] font-semibold`}>
                  {branches.find((item) => item.id === dentist.branchId)?.name ?? "Branch"}
                </Badge>
              </div>
            </div>
          </div>
        ))}

        {timeSlots.map((timeSlot, slotIndex) => {
          const row = slotIndex + 2;
          const slotTimeLabel = format(parseISO(`2024-01-01T${timeSlot}:00`), "h:mma").toLowerCase();

          return (
            <div key={timeSlot} className="contents">
              <div
                className="sticky left-0 z-30 flex items-center justify-end border-b border-r border-slate-200 bg-slate-50 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-400"
                style={{ gridColumn: 1, gridRow: row }}
              >
                {slotTimeLabel}
              </div>

              {resourceDentists.map((dentist, dentistIndex) => {
                const isOccupied = occupiedSlots.get(dentist.id)?.has(slotIndex) ?? false;

                return (
                  <div
                    key={`${dentist.id}-${timeSlot}`}
                    className={cn(
                      "group relative border-b border-r border-slate-100 bg-white transition dark:border-zinc-800 dark:bg-zinc-950",
                      !isOccupied && "hover:bg-xroads-50/35 dark:hover:bg-zinc-900/70",
                    )}
                    style={{ gridColumn: dentistIndex + 2, gridRow: row }}
                  >
                    {!isOccupied ? (
                      <button
                        type="button"
                        className="absolute inset-0 z-10 text-left outline-none transition focus-visible:bg-xroads-50/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-xroads-300"
                        aria-label={`Create appointment at ${slotTimeLabel} for ${dentist.name}`}
                        onClick={() => onSlotClick(dentist.id, timeSlot)}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}

        {positionedAppointments.map(({ appointment, columnStart, rowStart, rowSpan }) => {
          const serviceDuration = getAppointmentDurationMinutes(appointment);
          const normalizedTime = normalizeTimeString(appointment.time);
          const endTime = normalizedTime
            ? format(addMinutes(parseISO(`2024-01-01T${normalizedTime}:00`), serviceDuration), "h:mma").toLowerCase()
            : "—";
          const isEditing = editingAppointmentId === appointment.id;

          return (
            <button
              key={appointment.id}
              type="button"
              data-appointment-id={appointment.id}
              onPointerDown={(event) => {
                if (editingAppointmentId === appointment.id) {
                  onAppointmentHandleDragStart(appointment, "move", event);
                  return;
                }

                onAppointmentPointerDown(appointment, event);
              }}
              onPointerMove={onAppointmentPointerMove}
              onPointerUp={onAppointmentPointerUp}
              onPointerCancel={onAppointmentPointerUp}
              onClick={() => onAppointmentClick(appointment.id)}
              style={{ gridColumn: columnStart, gridRow: `${rowStart} / span ${rowSpan}` }}
              className={cn(
                "group relative z-20 mx-1 my-1 overflow-hidden rounded-xl border px-3 py-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-xroads-300 touch-none select-none",
                isEditing && "ring-2 ring-xroads-300 shadow-lg",
                getAppointmentBlockStyle(appointment),
                isEditing && "cursor-move",
              )}
            >
              {isEditing ? (
                <>
                  <div
                    data-resize-handle="start"
                    className="absolute inset-x-0 top-0 z-30 h-5 cursor-ns-resize touch-none"
                    onPointerDown={(event) => onAppointmentHandleDragStart(appointment, "resize-start", event)}
                  />
                  <div
                    data-resize-handle="end"
                    className="absolute inset-x-0 bottom-0 z-30 h-5 cursor-ns-resize touch-none"
                    onPointerDown={(event) => onAppointmentHandleDragStart(appointment, "resize-end", event)}
                  />
                  <div className="pointer-events-none absolute inset-x-3 top-1.5 flex justify-center">
                    <div className="h-1.5 w-14 rounded-full bg-white/70 shadow-sm dark:bg-white/20" />
                  </div>
                  <div className="pointer-events-none absolute inset-x-3 bottom-1.5 flex justify-center">
                    <div className="h-1.5 w-14 rounded-full bg-white/70 shadow-sm dark:bg-white/20" />
                  </div>
                </>
              ) : null}
              <div className="flex h-full flex-col justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{appointment.patientName}</p>
                      <p className="truncate text-[11px] font-medium uppercase tracking-[0.16em] opacity-80">
                        {appointment.service}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <p className="text-xs font-medium opacity-85">
                    {formatTimeRange(appointment.time, serviceDuration)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] font-medium opacity-80">
                  <span className="flex items-center gap-1">
                    <Clock3 size={12} />
                    {endTime}
                  </span>
                  {appointment.emergency ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
                      <AlertTriangle size={11} />
                      Urgent
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ViewSwitch({
  value,
  onChange,
}: {
  value: "slots" | "table";
  onChange: (value: "slots" | "table") => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        onClick={() => onChange("slots")}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold transition",
          value === "slots"
            ? "bg-xroads-500 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-zinc-900 dark:hover:text-slate-50",
        )}
      >
        <LayoutGrid size={15} />
        Slots
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold transition",
          value === "table"
            ? "bg-xroads-500 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-zinc-900 dark:hover:text-slate-50",
        )}
      >
        <Table2 size={15} />
        Table
      </button>
    </div>
  );
}

function getAppointmentBlockStyle(appointment: Appointment) {
  if (appointment.emergency) {
    return "border-rose-200 bg-rose-500/90 text-white dark:border-rose-700 dark:bg-rose-950 dark:text-rose-50";
  }

  switch (appointment.status) {
    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100";
    case "Confirmed":
      return "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-100";
    case "Arrived":
      return "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-100";
    case "In Consultation":
      return "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-100";
    case "Completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100";
    case "Cancelled":
      return "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-100";
    case "No-show":
      return "border-slate-200 bg-slate-50 text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100";
    case "Rescheduled":
      return "border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950 dark:text-cyan-100";
    default:
      return "border-slate-200 bg-slate-50 text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100";
  }
}

function sortAppointments(left: Appointment, right: Appointment) {
  const leftDate = `${left.date}T${normalizeTimeString(left.time) || left.time}`;
  const rightDate = `${right.date}T${normalizeTimeString(right.time) || right.time}`;
  return leftDate.localeCompare(rightDate);
}
