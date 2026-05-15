import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  addDays,
  addMonths,
  addYears,
  addWeeks,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subWeeks,
  subYears,
} from "date-fns";
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  X,
} from "lucide-react";
import { appointments, type Appointment, type AppointmentStatus } from "../data/appointments";
import { branches } from "../data/branches";
import { dentists } from "../data/dentists";
import { NewBookingModal } from "../components/appointments/NewBookingModal";
import { Badge, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { EmptyState } from "../components/shared/EmptyState";
import { FilterField } from "../components/shared/Filters";
import { cn } from "../lib/utils";

type CalendarView = "day" | "week" | "month" | "year";
type FilterValue = "All" | string;

const viewOptions: Array<{ view: CalendarView; label: string; icon: typeof Calendar }> = [
  { view: "day", label: "Day", icon: CalendarClock },
  { view: "week", label: "Week", icon: CalendarRange },
  { view: "month", label: "Month", icon: CalendarDays },
  { view: "year", label: "Year", icon: Calendar },
];

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

export function CalendarPage() {
  const [view, setView] = useState<CalendarView>("month");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [branch, setBranch] = useState<FilterValue>("All");
  const [dentist, setDentist] = useState<FilterValue>("All");
  const [status, setStatus] = useState<AppointmentStatus | "All">("All");
  const [bookingOpen, setBookingOpen] = useState(false);

  const filteredAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => {
          const branchMatch = branch === "All" || appointment.branchId === branch;
          const dentistMatch = dentist === "All" || appointment.dentistId === dentist;
          const statusMatch = status === "All" || appointment.status === status;
          return branchMatch && dentistMatch && statusMatch;
        })
        .sort(sortAppointments),
    [branch, dentist, status],
  );

  const range = useMemo(() => getViewRange(view, anchorDate), [view, anchorDate]);
  const appointmentsInView = useMemo(
    () => filteredAppointments.filter((appointment) => isWithinInterval(parseISO(appointment.date), range)),
    [filteredAppointments, range],
  );
  const selectedDayAppointments = useMemo(
    () => filteredAppointments.filter((appointment) => isSameDay(parseISO(appointment.date), anchorDate)),
    [anchorDate, filteredAppointments],
  );

  const selectedBranch = branch === "All" ? "All branches" : branches.find((item) => item.id === branch)?.name ?? "All branches";
  const selectedDentist = dentist === "All" ? "All dentists" : dentists.find((item) => item.id === dentist)?.name ?? "All dentists";

  const periodLabel = getPeriodLabel(view, anchorDate);

  function movePeriod(direction: -1 | 1) {
    setAnchorDate((current) => shiftDate(current, view, direction));
  }

  function jumpToToday() {
    setAnchorDate(new Date());
  }

  function openAgenda(date: Date) {
    setAnchorDate(date);
    setAgendaOpen(true);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAgendaOpen(false);
      }
    }

    if (agendaOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [agendaOpen]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="page-title">Appointment calendar</h1>
          <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Real calendar scheduling with day, week, month, and year views for branch operations.
          </p>
        </div>
        <Button onClick={() => setBookingOpen(true)}>
          <CirclePlus size={18} />
          New booking
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle>{periodLabel}</CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedBranch} · {selectedDentist}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ViewSwitcher view={view} onChange={setView} />
              <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
                <Button variant="ghost" className="h-10 w-10 p-0" aria-label="Previous period" onClick={() => movePeriod(-1)}>
                  <ChevronLeft size={18} />
                </Button>
                <Button variant="ghost" className="h-10 px-3" onClick={jumpToToday}>
                  Today
                </Button>
                <Button variant="ghost" className="h-10 w-10 p-0" aria-label="Next period" onClick={() => movePeriod(1)}>
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="grid gap-4 xl:grid-cols-[1.05fr_1.05fr_1.05fr_auto] xl:items-end">
              <FilterField label="Branch">
                <select className="input" value={branch} onChange={(event) => setBranch(event.target.value)}>
                  <option value="All">All branches</option>
                  {branches.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Dentist">
                <select className="input" value={dentist} onChange={(event) => setDentist(event.target.value)}>
                  <option value="All">All dentists</option>
                  {dentists.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Status">
                <select className="input" value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus | "All")}>
                  {statusOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </FilterField>
              <div className="flex items-center gap-2 xl:justify-end">
                <Badge className="bg-white text-slate-700 ring-slate-200 dark:bg-zinc-950 dark:text-slate-200 dark:ring-zinc-800">{appointmentsInView.length} visible</Badge>
                <Badge className="bg-white text-slate-700 ring-slate-200 dark:bg-zinc-950 dark:text-slate-200 dark:ring-zinc-800">{selectedDayAppointments.length} selected day</Badge>
              </div>
            </div>
          </div>

          {view === "day" ? (
            <DayView
              date={anchorDate}
              appointments={appointmentsInView}
              onSelectDate={openAgenda}
            />
          ) : null}
          {view === "week" ? (
            <WeekView
              date={anchorDate}
              appointments={appointmentsInView}
              onSelectDate={openAgenda}
            />
          ) : null}
          {view === "month" ? (
            <MonthView
              date={anchorDate}
              appointments={appointmentsInView}
              onSelectDate={openAgenda}
            />
          ) : null}
          {view === "year" ? (
            <YearView
              date={anchorDate}
              appointments={appointmentsInView}
              onSelectDate={(date) => {
                openAgenda(date);
                setView("month");
              }}
            />
          ) : null}
        </CardContent>
      </Card>

      <NewBookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
      <AgendaModal
        open={agendaOpen}
        date={anchorDate}
        appointments={selectedDayAppointments}
        onClose={() => setAgendaOpen(false)}
      />
    </div>
  );
}

function ViewSwitcher({
  view,
  onChange,
}: {
  view: CalendarView;
  onChange: (view: CalendarView) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {viewOptions.map((item) => {
        const Icon = item.icon;
        const active = view === item.view;
        return (
          <button
            key={item.view}
            type="button"
            onClick={() => onChange(item.view)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
              active
                ? "bg-xroads-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-zinc-900 dark:hover:text-slate-50",
            )}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function DayView({
  date,
  appointments,
  onSelectDate,
}: {
  date: Date;
  appointments: Appointment[];
  onSelectDate: (date: Date) => void;
}) {
  const grouped = groupByHour(appointments);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span className="font-semibold text-slate-950 dark:text-slate-50">{format(date, "EEEE, MMMM d")}</span>
        <button type="button" className="text-xroads-700 transition hover:text-xroads-600 dark:text-xroads-200" onClick={() => onSelectDate(date)}>
          Focus today
        </button>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 24 }, (_, hour) => {
          const slot = new Date(date);
          slot.setHours(hour, 0, 0, 0);

          return (
            <div key={hour} className="grid gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-[72px_minmax(0,1fr)]">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{format(slot, "ha")}</div>
              <div className="space-y-2">
                {grouped[hour]?.length ? (
                  grouped[hour].map((appointment) => (
                    <div
                      key={appointment.id}
                      className={cn(
                        "grid gap-3 rounded-lg border px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center",
                        appointment.emergency
                          ? "border-rose-200 bg-rose-50/80 dark:border-rose-900/70 dark:bg-rose-950/30"
                          : "border-slate-100 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-950 dark:text-slate-50">{appointment.patientName}</p>
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                          {appointment.service} · {appointment.time}
                        </p>
                      </div>
                      <StatusBadge status={appointment.status} />
                    </div>
                  ))
                ) : (
                  <div className="h-10 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  date,
  appointments,
  onSelectDate,
}: {
  date: Date;
  appointments: Appointment[];
  onSelectDate: (date: Date) => void;
}) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[920px] space-y-3">
        <div className="grid grid-cols-7 gap-3">
          {days.map((day) => (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                "rounded-lg border px-3 py-3 text-left transition",
                isSameDay(day, date)
                  ? "border-xroads-300 bg-xroads-50 dark:border-xroads-500/40 dark:bg-xroads-500/10"
                  : "border-slate-100 bg-white hover:border-xroads-200 hover:bg-xroads-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900",
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{format(day, "EEE")}</p>
              <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{format(day, "d")}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{format(day, "MMM")}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {days.map((day) => {
            const dayAppointments = appointments
              .filter((appointment) => isSameDay(parseISO(appointment.date), day))
              .sort(sortAppointments);

            return (
              <div key={day.toISOString()} className="min-h-[320px] rounded-lg border border-slate-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-950 dark:text-slate-50">{format(day, "EEEE")}</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{dayAppointments.length}</span>
                </div>
                <div className="space-y-2">
                  {dayAppointments.length ? (
                    dayAppointments.slice(0, 5).map((appointment) => <CalendarChip key={appointment.id} appointment={appointment} />)
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-400 dark:border-zinc-800">No bookings</div>
                  )}
                  {dayAppointments.length > 5 ? (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-400">
                      +{dayAppointments.length - 5} more
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthView({
  date,
  appointments,
  onSelectDate,
}: {
  date: Date;
  appointments: Appointment[];
  onSelectDate: (date: Date) => void;
}) {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[860px] space-y-3">
        <div className="grid grid-cols-7 gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
            <div key={label} className="px-2 py-1">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayAppointments = appointments.filter((appointment) => isSameDay(parseISO(appointment.date), day)).sort(sortAppointments);
            const isCurrentMonth = isSameMonth(day, date);
            const isSelected = isSameDay(day, date);

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDate(day)}
                className={cn(
                  "min-h-[146px] rounded-lg border p-3 text-left transition",
                  isSelected
                    ? "border-xroads-300 bg-xroads-50 dark:border-xroads-500/40 dark:bg-xroads-500/10"
                    : "border-slate-100 bg-white hover:border-xroads-200 hover:bg-xroads-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900",
                  !isCurrentMonth && "opacity-45",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-semibold", isCurrentMonth ? "text-slate-950 dark:text-slate-50" : "text-slate-400 dark:text-slate-500")}>{format(day, "d")}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{dayAppointments.length}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {dayAppointments.slice(0, 3).map((appointment) => (
                    <CalendarChip key={appointment.id} appointment={appointment} compact />
                  ))}
                  {dayAppointments.length > 3 ? (
                    <div className="text-xs font-semibold text-xroads-700 dark:text-xroads-200">+{dayAppointments.length - 3} more</div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function YearView({
  date,
  appointments,
  onSelectDate,
}: {
  date: Date;
  appointments: Appointment[];
  onSelectDate: (date: Date) => void;
}) {
  const months = eachMonthOfInterval({
    start: startOfYear(date),
    end: endOfYear(date),
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {months.map((month) => {
        const monthAppointments = appointments.filter((appointment) => isSameMonth(parseISO(appointment.date), month));
        const selected = isSameMonth(month, date);
        const emergencyCount = monthAppointments.filter((appointment) => appointment.emergency).length;

        return (
          <button
            key={month.toISOString()}
            type="button"
            onClick={() => onSelectDate(month)}
            className={cn(
              "rounded-lg border p-4 text-left transition",
              selected
                ? "border-xroads-300 bg-xroads-50 dark:border-xroads-500/40 dark:bg-xroads-500/10"
                : "border-slate-100 bg-white hover:border-xroads-200 hover:bg-xroads-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900",
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-slate-950 dark:text-slate-50">{format(month, "MMMM")}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{monthAppointments.length} appointments</p>
              </div>
              <Badge className="bg-xroads-50 text-xroads-700 ring-xroads-100 dark:bg-zinc-900 dark:text-xroads-200 dark:ring-zinc-800">
                {emergencyCount}
              </Badge>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-zinc-800">
              <div
                className="h-2 rounded-full bg-xroads-500"
                style={{
                  width: `${Math.min(Math.max(monthAppointments.length * 10, 18), 100)}%`,
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CalendarChip({ appointment, compact = false }: { appointment: Appointment; compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border px-2 py-2 text-left text-xs",
        appointment.emergency
          ? "border-rose-200 bg-rose-50/90 text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100"
          : "border-slate-100 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-200",
        compact && "py-1.5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{appointment.time}</span>
        {appointment.emergency ? <AlertTriangle size={12} className="shrink-0" /> : null}
      </div>
      <div className="truncate font-medium">{appointment.patientName}</div>
      {!compact ? <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">{appointment.service}</div> : null}
    </div>
  );
}

function AgendaModal({
  open,
  date,
  appointments,
  onClose,
}: {
  open: boolean;
  date: Date;
  appointments: Appointment[];
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="agenda-title"
          className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-background shadow-soft dark:border-zinc-800"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-zinc-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Selected day agenda</p>
              <h2 id="agenda-title" className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">
                {format(date, "EEEE, MMMM d")}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{appointments.length} appointments on this date</p>
            </div>
            <Button variant="outline" className="h-11 w-11 rounded-lg p-0" onClick={onClose} aria-label="Close agenda modal">
              <X size={28} strokeWidth={2.2} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {appointments.length ? (
              <div className="space-y-4">
                {appointments.map((appointment, index) => (
                  <AgendaBookingCard key={appointment.id} appointment={appointment} index={index} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No appointments on this day"
                description="Use the calendar to choose another date or adjust the branch, dentist, or status filters."
              />
            )}
          </div>
        </div>
      </div>,
      document.body,
    )
  );
}

function AgendaBookingCard({ appointment, index }: { appointment: Appointment; index: number }) {
  return (
    <article
      className={cn(
        "grid grid-cols-[72px_1fr_auto] items-center gap-4 rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
        appointment.emergency ? "border-rose-200 ring-4 ring-rose-50 dark:border-rose-900/70 dark:ring-rose-950/30" : "border-slate-200",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-xroads-50 text-sm font-semibold text-xroads-700 dark:bg-zinc-800 dark:text-xroads-200">
        {index + 1}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-slate-950 dark:text-slate-50">
          {appointment.time} - {appointment.patientName}
        </p>
        <p className="truncate text-sm text-slate-500 dark:text-slate-400">
          {appointment.service} with {dentists.find((item) => item.id === appointment.dentistId)?.name ?? "Dentist"}
        </p>
      </div>
      <div className="flex justify-start md:justify-end">
        <StatusBadge status={appointment.status} />
      </div>
    </article>
  );
}

function sortAppointments(left: Appointment, right: Appointment) {
  const leftDate = `${left.date}T${left.time}`;
  const rightDate = `${right.date}T${right.time}`;
  return leftDate.localeCompare(rightDate);
}

function groupByHour(items: Appointment[]) {
  return items.reduce<Record<number, Appointment[]>>((groups, appointment) => {
    const hour = Number.parseInt(appointment.time.slice(0, 2), 10);
    if (!groups[hour]) {
      groups[hour] = [];
    }
    groups[hour].push(appointment);
    return groups;
  }, {});
}

function getViewRange(view: CalendarView, date: Date) {
  switch (view) {
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "week":
      return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
    case "month":
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case "year":
      return { start: startOfYear(date), end: endOfYear(date) };
  }
}

function getPeriodLabel(view: CalendarView, date: Date) {
  switch (view) {
    case "day":
      return format(date, "EEEE, MMMM d");
    case "week": {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    case "month":
      return format(date, "MMMM yyyy");
    case "year":
      return format(date, "yyyy");
  }
}

function shiftDate(date: Date, view: CalendarView, direction: -1 | 1) {
  switch (view) {
    case "day":
      return direction === -1 ? subDays(date, 1) : addDays(date, 1);
    case "week":
      return direction === -1 ? subWeeks(date, 1) : addWeeks(date, 1);
    case "month":
      return direction === -1 ? addMonths(date, -1) : addMonths(date, 1);
    case "year":
      return direction === -1 ? subYears(date, 1) : addYears(date, 1);
  }
}
