import { useMemo } from "react";
import { eachDayOfInterval, format, isAfter, isSameDay, isValid, parseISO, startOfDay, subDays } from "date-fns";
import { Activity, AlertTriangle, ArrowUpRight, CalendarCheck, CalendarClock, CheckCircle2, Clock3, TrendingUp, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/Badge";
import { EmptyState } from "../components/shared/EmptyState";
import { PageLoader } from "../components/shared/PageLoader";
import { cn } from "../lib/utils";
import { useAppointments } from "../features/appointments/use-appointments";
import { useDentists } from "../features/dentists/use-dentists";
import { useBranches } from "../features/branches/use-branches";
import { useBranchScope } from "../features/auth/branch-scope";
import type { Appointment } from "../data/appointments";
import { DEFAULT_WORKDAY_END, DEFAULT_WORKDAY_START, getAppointmentDurationMinutes, minutesFromTime } from "../components/appointments/scheduler-utils";

const CHART_COLORS = ["#7eb928", "#38bdf8", "#6366f1", "#8b5cf6", "#10b981"];
const BRANCH_DOT_COLORS = ["bg-xroads-500", "bg-sky-500", "bg-indigo-500", "bg-violet-500", "bg-emerald-500"];
const STATUS_COLORS: Record<string, string> = {
  Confirmed: "bg-sky-500",
  Arrived: "bg-indigo-500",
  "In Consultation": "bg-violet-500",
  Completed: "bg-emerald-500",
  Pending: "bg-amber-500",
};

const dashboardStatuses = ["Confirmed", "Arrived", "In Consultation", "Completed", "Pending"] as const;
const WORKDAY_DURATION_MINUTES = minutesFromTime(DEFAULT_WORKDAY_END) - minutesFromTime(DEFAULT_WORKDAY_START);

export function DashboardPage() {
  const branchScope = useBranchScope();
  const { appointments, isLoading: isAppointmentsLoading, error: appointmentsError, refetch: refetchAppointments } = useAppointments();
  const { dentists, isLoading: isDentistsLoading, error: dentistsError, refetch: refetchDentists } = useDentists(branchScope.branchId ?? null);
  const { branches: branchDirectory, isLoading: isBranchesLoading, error: branchesError, refetch: refetchBranches } = useBranches();

  const isInitialLoading =
    (isAppointmentsLoading && appointments.length === 0) ||
    (isDentistsLoading && dentists.length === 0) ||
    (isBranchesLoading && branchDirectory.length === 0);

  const today = startOfDay(new Date());
  const weeklyDays = useMemo(() => eachDayOfInterval({ start: subDays(today, 6), end: today }), [today]);
  const previousWeeklyDays = useMemo(() => eachDayOfInterval({ start: subDays(today, 13), end: subDays(today, 7) }), [today]);

  const visibleBranches = useMemo(
    () => (branchScope.branchId ? branchDirectory.filter((branch) => branch.id === branchScope.branchId) : branchDirectory),
    [branchDirectory, branchScope.branchId],
  );

  const visibleAppointments = useMemo(
    () => appointments.filter((appointment) => !branchScope.branchId || appointment.branchId === branchScope.branchId),
    [appointments, branchScope.branchId],
  );

  const dentistNameById = useMemo(
    () =>
      new Map(
        dentists.map((dentist) => [
          dentist.id,
          {
            name: dentist.name,
            branchId: dentist.branchId,
          },
        ]),
      ),
    [dentists],
  );

  const branchNameById = useMemo(() => new Map(visibleBranches.map((branch) => [branch.id, branch.name])), [visibleBranches]);

  const todaysAppointments = useMemo(
    () =>
      [...visibleAppointments]
        .filter((appointment) => isAppointmentOnDay(appointment, today))
        .sort(compareAppointmentsAscending),
    [today, visibleAppointments],
  );

  const futureAppointments = useMemo(
    () =>
      [...visibleAppointments]
        .filter((appointment) => {
          const appointmentDate = parseAppointmentDate(appointment.date);
          return appointmentDate ? isAfter(appointmentDate, today) : false;
        })
        .sort(compareAppointmentsAscending),
    [today, visibleAppointments],
  );

  const weeklyAppointments = useMemo(
    () =>
      visibleAppointments.filter((appointment) => {
        const appointmentDate = parseAppointmentDate(appointment.date);
        return appointmentDate ? appointmentDate >= weeklyDays[0] && appointmentDate <= weeklyDays[weeklyDays.length - 1] : false;
      }),
    [visibleAppointments, weeklyDays],
  );

  const previousWeeklyAppointments = useMemo(
    () =>
      visibleAppointments.filter((appointment) => {
        const appointmentDate = parseAppointmentDate(appointment.date);
        return appointmentDate ? appointmentDate >= previousWeeklyDays[0] && appointmentDate <= previousWeeklyDays[previousWeeklyDays.length - 1] : false;
      }),
    [previousWeeklyDays, visibleAppointments],
  );

  const todaysCount = todaysAppointments.length;
  const todaysPendingCount = countMatchingAppointments(todaysAppointments, (appointment) => appointment.status === "Pending");
  const todaysCompletedCount = countMatchingAppointments(todaysAppointments, (appointment) => appointment.status === "Completed");
  const todaysCancelledCount = countMatchingAppointments(todaysAppointments, (appointment) => appointment.status === "Cancelled");
  const todaysEmergencyCount = countMatchingAppointments(todaysAppointments, (appointment) => Boolean(appointment.emergency));
  const todaysNoShowCount = countMatchingAppointments(todaysAppointments, (appointment) => appointment.status === "No-show");
  const weeklyCompletedCount = countMatchingAppointments(weeklyAppointments, (appointment) => appointment.status === "Completed");
  const completionRate = todaysCount === 0 ? 0 : Math.round((todaysCompletedCount / todaysCount) * 100);

  const yesterday = subDays(today, 1);
  const previousMetrics = {
    todaysCount: countMatchingAppointments(visibleAppointments, (appointment) => isAppointmentOnDay(appointment, yesterday)),
    pending: countMatchingAppointments(visibleAppointments, (appointment) => isAppointmentOnDay(appointment, yesterday) && appointment.status === "Pending"),
    completed: countMatchingAppointments(visibleAppointments, (appointment) => isAppointmentOnDay(appointment, yesterday) && appointment.status === "Completed"),
    cancelled: countMatchingAppointments(visibleAppointments, (appointment) => isAppointmentOnDay(appointment, yesterday) && appointment.status === "Cancelled"),
    noShow: countMatchingAppointments(visibleAppointments, (appointment) => isAppointmentOnDay(appointment, yesterday) && appointment.status === "No-show"),
    emergency: countMatchingAppointments(visibleAppointments, (appointment) => isAppointmentOnDay(appointment, yesterday) && Boolean(appointment.emergency)),
  };

  const kpis = [
    {
      label: "Today's Appointments",
      value: todaysCount,
      icon: CalendarCheck,
      tone: "from-xroads-50 to-white dark:from-zinc-900 dark:to-zinc-950",
      iconTone: "bg-xroads-500 text-white dark:bg-zinc-800 dark:text-xroads-200",
      delta: formatDeltaLabel(todaysCount, previousMetrics.todaysCount),
    },
    {
      label: "Pending Appointments",
      value: todaysPendingCount,
      icon: Clock3,
      tone: "from-amber-50 to-white dark:from-zinc-900 dark:to-zinc-950",
      iconTone: "bg-amber-100 text-amber-700 dark:bg-zinc-800 dark:text-amber-200",
      delta: formatDeltaLabel(todaysPendingCount, previousMetrics.pending),
    },
    {
      label: "Completed",
      value: todaysCompletedCount,
      icon: CheckCircle2,
      tone: "from-emerald-50 to-white dark:from-zinc-900 dark:to-zinc-950",
      iconTone: "bg-emerald-100 text-emerald-700 dark:bg-zinc-800 dark:text-emerald-200",
      delta: formatDeltaLabel(todaysCompletedCount, previousMetrics.completed),
    },
    {
      label: "Cancelled",
      value: todaysCancelledCount,
      icon: UserX,
      tone: "from-rose-50 to-white dark:from-zinc-900 dark:to-zinc-950",
      iconTone: "bg-rose-100 text-rose-700 dark:bg-zinc-800 dark:text-rose-200",
      delta: formatDeltaLabel(todaysCancelledCount, previousMetrics.cancelled),
    },
    {
      label: "No Shows",
      value: todaysNoShowCount,
      icon: CalendarClock,
      tone: "from-slate-100 to-white dark:from-zinc-900 dark:to-zinc-950",
      iconTone: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-200",
      delta: formatDeltaLabel(todaysNoShowCount, previousMetrics.noShow),
    },
    {
      label: "Emergency Cases",
      value: todaysEmergencyCount,
      icon: AlertTriangle,
      tone: "from-red-50 to-white dark:from-zinc-900 dark:to-zinc-950",
      iconTone: "bg-red-100 text-red-700 dark:bg-zinc-800 dark:text-red-200",
      delta: formatDeltaLabel(todaysEmergencyCount, previousMetrics.emergency),
    },
  ];

  const weeklyTrend = useMemo(
    () => weeklyDays.map((day) => countMatchingAppointments(visibleAppointments, (appointment) => isAppointmentOnDay(appointment, day))),
    [visibleAppointments, weeklyDays],
  );

  const branchSplit = useMemo(() => {
    const data = visibleBranches.map((branch) => {
      const value = countMatchingAppointments(
        weeklyAppointments,
        (appointment) => appointment.branchId === branch.id,
      );

      return {
        label: branch.name,
        value,
      };
    });

    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map((item) => ({
      ...item,
      share: total === 0 ? 0 : Math.round((item.value / total) * 100),
    }));
  }, [visibleBranches, weeklyAppointments]);

  const statusBreakdown = useMemo(() => {
    const total = weeklyAppointments.length;
    return dashboardStatuses.map((status) => {
      const value = countMatchingAppointments(weeklyAppointments, (appointment) => appointment.status === status);
      return {
        label: status,
        value,
        width: total === 0 ? 0 : Math.max(Math.round((value / total) * 100), value > 0 ? 8 : 0),
        color: STATUS_COLORS[status],
      };
    });
  }, [weeklyAppointments]);

  const workload = useMemo(() => {
    return dentists
      .map((dentist) => {
        const todaysDentistAppointments = todaysAppointments.filter((appointment) => appointment.dentistId === dentist.id);
        const occupiedMinutes = todaysDentistAppointments.reduce((sum, appointment) => sum + getAppointmentDurationMinutes(appointment), 0);

        return {
          label: dentist.name,
          value: WORKDAY_DURATION_MINUTES > 0 ? Math.min(100, Math.round((occupiedMinutes / WORKDAY_DURATION_MINUTES) * 100)) : 0,
          appointmentCount: todaysDentistAppointments.length,
        };
      })
      .sort((left, right) => right.value - left.value || right.appointmentCount - left.appointmentCount || left.label.localeCompare(right.label));
  }, [dentists, todaysAppointments]);

  const recentActivity = useMemo(() => {
    const source = visibleAppointments
      .filter((appointment) => {
        const appointmentDate = parseAppointmentDate(appointment.date);
        return appointmentDate ? appointmentDate >= weeklyDays[0] : false;
      })
      .sort(compareAppointmentsDescending)
      .slice(0, 4);

    return source.map((appointment) => {
      const dentistName = appointment.dentistName ?? dentistNameById.get(appointment.dentistId)?.name ?? "Dentist";
      return `${formatActivityHeadline(appointment)} ${formatActivityTail(appointment, dentistName)}`;
    });
  }, [dentistNameById, visibleAppointments, weeklyDays]);

  const totalChairMinutesToday = todaysAppointments.reduce((sum, appointment) => sum + getAppointmentDurationMinutes(appointment), 0);
  const chairUtilization = dentists.length === 0 || WORKDAY_DURATION_MINUTES <= 0
    ? 0
    : Math.round((totalChairMinutesToday / (dentists.length * WORKDAY_DURATION_MINUTES)) * 100);

  const weeklyTrendLabel = formatDeltaComparison(
    weeklyTrend.reduce((sum, value) => sum + value, 0),
    previousWeeklyAppointments.length,
    "vs previous 7 days",
  );

  const dashboardErrors = [appointmentsError, dentistsError, branchesError].filter(Boolean);
  const scopeDescription = branchScope.branchId
    ? `Live view of appointment flow, chair utilization, and schedule health for ${branchScope.branchLabel}.`
    : "Live view of appointment flow, branch productivity, chair utilization, and schedule health across all active branches.";

  if (isInitialLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {dashboardErrors.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="font-semibold">Some live dashboard data could not be loaded.</p>
              {dashboardErrors.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
            <button
              type="button"
              className="rounded-full border border-amber-300 px-3 py-1.5 font-semibold transition hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/40"
              onClick={() => {
                void refetchAppointments();
                void refetchDentists();
                void refetchBranches();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <Card className="overflow-hidden border-xroads-100 bg-gradient-to-br from-white via-white to-xroads-50/60 p-0 shadow-soft dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
        <div className="grid gap-6 p-6 xl:grid-cols-[1.2fr_0.8fr] xl:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-xroads-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-xroads-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-xroads-200">
              {branchScope.branchId ? `${branchScope.branchLabel} operations overview` : "Executive operations overview"}
            </div>
            <div>
              <p className="text-sm font-semibold text-xroads-700">{format(new Date(), "EEEE, MMMM d")}</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Clinic performance dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{scopeDescription}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <BadgePill label="Today" value={todaysCount.toString()} />
              <BadgePill label="Completed" value={todaysCompletedCount.toString()} tone="emerald" />
              <BadgePill label="Emergency" value={todaysEmergencyCount.toString()} tone="rose" />
              <BadgePill label="No-show" value={todaysNoShowCount.toString()} tone="slate" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <MiniMetric label="Completion rate" value={`${completionRate}%`} note="Today" icon={TrendingUp} />
            <MiniMetric label="Pending queue" value={todaysPendingCount.toString()} note="Needs attention today" icon={Clock3} />
            <MiniMetric label="Chair utilization" value={`${chairUtilization}%`} note="Scheduled chair time today" icon={AlertTriangle} />
            <MiniMetric label="Branch coverage" value={`${visibleBranches.length}`} note={branchScope.branchId ? branchScope.branchLabel : "Active locations"} icon={ArrowUpRight} />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map((stat) => (
          <Card key={stat.label} className={cn("border-slate-200 bg-gradient-to-br p-4 shadow-sm dark:border-zinc-800", stat.tone)}>
            <div className="flex items-start justify-between gap-3">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", stat.iconTone)}>
                <stat.icon size={20} />
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-zinc-800 dark:text-slate-300">{stat.delta}</span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Appointment flow</CardTitle>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Daily appointment volume over the last 7 days.</p>
            </div>
            <span className="rounded-full bg-xroads-50 px-3 py-1 text-xs font-semibold text-xroads-700 dark:bg-zinc-900 dark:text-xroads-200">7-day trend</span>
          </CardHeader>
          <CardContent>
            <LineChart title="Appointments" data={weeklyTrend} accent="#7eb928" trendLabel={weeklyTrendLabel} />
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <StatBand label="Completed appointments" value={`${weeklyCompletedCount}`} sublabel="Last 7 days" tone="bg-emerald-50 text-emerald-700 dark:bg-zinc-900 dark:text-emerald-200" />
              <StatBand label="Scheduled chair utilization" value={`${chairUtilization}%`} sublabel="Across active dentists today" tone="bg-xroads-50 text-xroads-700 dark:bg-zinc-900 dark:text-xroads-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branch split</CardTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Appointment volume by branch over the last 7 days.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <DonutChart data={branchSplit} />
            <div className="space-y-3">
              {branchSplit.map((item, index) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center gap-3">
                    <span className={cn("h-2.5 w-2.5 rounded-full", BRANCH_DOT_COLORS[index % BRANCH_DOT_COLORS.length])} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-950 dark:text-slate-50">{item.share}%</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.value} appointments</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Today's schedule</CardTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Priority appointments by time and status.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysAppointments.length === 0 ? (
              <EmptyState title="No appointments today" description="As live bookings come in, today's schedule will appear here." />
            ) : (
              todaysAppointments.slice(0, 6).map((appointment, index) => (
                <div key={appointment.id} className="grid grid-cols-[72px_1fr_auto] items-center gap-4 rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-xroads-50 text-sm font-semibold text-xroads-700">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950 dark:text-slate-50">{appointment.time} - {appointment.patientName}</p>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {appointment.service} with {appointment.dentistName ?? dentistNameById.get(appointment.dentistId)?.name ?? "Dentist"}
                    </p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dentist workload</CardTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Daily load and chair occupancy by clinician.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {workload.length === 0 ? (
              <EmptyState title="No active dentists" description="Dentist workload will appear here once clinician profiles are available." />
            ) : (
              workload.map((item, index) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.label}</span>
                    <span className="text-slate-500 dark:text-slate-400">{item.value}% · {item.appointmentCount} appointments</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 dark:bg-zinc-800">
                    <div
                      className={cn("h-3 rounded-full", BRANCH_DOT_COLORS[index % BRANCH_DOT_COLORS.length])}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Status breakdown</CardTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Appointment lifecycle mix over the last 7 days.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusBreakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{item.label}</span>
                  <span className="text-slate-500 dark:text-slate-400">{item.value}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 dark:bg-zinc-800">
                  <div className={cn("h-3 rounded-full", item.color)} style={{ width: `${item.width}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming appointments</CardTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Forward look at tomorrow and beyond.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {futureAppointments.length === 0 ? (
              <EmptyState title="No upcoming appointments" description="Future bookings will appear here as they are created." />
            ) : (
              futureAppointments.slice(0, 6).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-slate-50">{appointment.patientName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatAppointmentDate(appointment.date)} at {appointment.time}
                      {branchNameById.get(appointment.branchId) ? ` · ${branchNameById.get(appointment.branchId)}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-xroads-700 dark:bg-zinc-950 dark:text-xroads-200">{appointment.service}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Operational events pulled from the live appointment feed.</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {recentActivity.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-4">
              <EmptyState title="No activity yet" description="Recent appointment changes and outcomes will appear here once live records are available." />
            </div>
          ) : (
            recentActivity.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xroads-700 shadow-sm dark:bg-zinc-950 dark:text-xroads-200">
                  <Activity size={16} />
                </div>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof TrendingUp;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-xroads-50 text-xroads-700 dark:bg-zinc-800 dark:text-xroads-200">
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{note}</p>
    </div>
  );
}

function BadgePill({ label, value, tone = "xroads" }: { label: string; value: string; tone?: "xroads" | "emerald" | "rose" | "slate" }) {
  const tones: Record<typeof tone, string> = {
    xroads: "bg-xroads-50 text-xroads-700 border-xroads-100 dark:bg-zinc-900 dark:text-xroads-200 dark:border-zinc-800",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-zinc-900 dark:text-emerald-200 dark:border-zinc-800",
    rose: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-zinc-900 dark:text-rose-200 dark:border-zinc-800",
    slate: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:border-zinc-800",
  };

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold", tones[tone])}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function StatBand({ label, value, sublabel, tone }: { label: string; value: string; sublabel: string; tone: string }) {
  return (
    <div className={cn("rounded-lg px-4 py-4", tone)}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{sublabel}</p>
    </div>
  );
}

function DonutChart({ data }: { data: Array<{ label: string; value: number; share: number }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const gradientStops = buildConicGradient(data.map((item) => item.value));

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative flex h-48 w-48 items-center justify-center rounded-full"
        style={{
          background: gradientStops.length > 0 ? `conic-gradient(${gradientStops.join(", ")})` : "conic-gradient(#e2e8f0 0% 100%)",
        }}
      >
        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-950">
          <span className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{total}</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">appointments</span>
        </div>
      </div>
    </div>
  );
}

function LineChart({ title, data, accent, trendLabel }: { title: string; data: number[]; accent: string; trendLabel: string }) {
  const width = 600;
  const height = 220;
  const padding = 24;
  const max = Math.max(...data, 1) + 2;
  const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - (value / max) * (height - padding * 2);
    return `${x},${y}`;
  });
  const areaPoints = `${padding},${height - padding} ${points.join(" ")} ${width - padding},${height - padding}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{title}</span>
        <span className="text-sm font-semibold text-xroads-700 dark:text-xroads-200">{trendLabel}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full overflow-visible">
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7eb928" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#7eb928" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#trendFill)" />
        <polyline points={points.join(" ")} fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((value, index) => {
          const x = padding + index * step;
          const y = height - padding - (value / max) * (height - padding * 2);
          return <circle key={`${value}-${index}`} cx={x} cy={y} r="5.5" fill="hsl(var(--background))" stroke="#7eb928" strokeWidth="4" />;
        })}
      </svg>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, index) => (
          <div key={label} className="space-y-1">
            <div className="text-slate-400 dark:text-slate-500">{label}</div>
            <div className={cn("h-2 rounded-full bg-slate-100 dark:bg-zinc-800", index === 4 && "bg-xroads-500/30 dark:bg-xroads-500/30")} />
          </div>
        ))}
      </div>
    </div>
  );
}

function buildConicGradient(values: number[]) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total === 0) {
    return [];
  }

  let current = 0;
  return values.map((value, index) => {
    const start = current;
    const percentage = (value / total) * 100;
    current += percentage;
    return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${current}%`;
  });
}

function parseAppointmentDate(value: string) {
  const parsed = parseISO(value);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

function isAppointmentOnDay(appointment: Appointment, day: Date) {
  const appointmentDate = parseAppointmentDate(appointment.date);
  return appointmentDate ? isSameDay(appointmentDate, day) : false;
}

function countMatchingAppointments(appointments: Appointment[], predicate: (appointment: Appointment) => boolean) {
  return appointments.reduce((count, appointment) => count + (predicate(appointment) ? 1 : 0), 0);
}

function compareAppointmentsAscending(left: Appointment, right: Appointment) {
  const leftDate = parseAppointmentDate(left.date);
  const rightDate = parseAppointmentDate(right.date);

  if (!leftDate || !rightDate) {
    return left.date.localeCompare(right.date) || left.time.localeCompare(right.time);
  }

  return leftDate.getTime() - rightDate.getTime() || minutesFromTime(left.time) - minutesFromTime(right.time);
}

function compareAppointmentsDescending(left: Appointment, right: Appointment) {
  return compareAppointmentsAscending(right, left);
}

function formatDeltaLabel(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? "0%" : "New";
  }

  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(delta));
  return `${delta >= 0 ? "+" : "-"}${rounded}%`;
}

function formatDeltaComparison(current: number, previous: number, suffix: string) {
  if (previous === 0) {
    return current === 0 ? `0% ${suffix}` : `New ${suffix}`;
  }

  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(delta));
  return `${delta >= 0 ? "+" : "-"}${rounded}% ${suffix}`;
}

function formatAppointmentDate(value: string) {
  const parsed = parseAppointmentDate(value);
  return parsed ? format(parsed, "MMM d") : value;
}

function formatActivityHeadline(appointment: Appointment) {
  if (appointment.emergency) {
    return `Emergency booking for ${appointment.patientName}.`;
  }

  switch (appointment.status) {
    case "Completed":
      return `${appointment.service} completed for ${appointment.patientName}.`;
    case "In Consultation":
      return `${appointment.patientName} is in consultation.`;
    case "Cancelled":
      return `${appointment.patientName} cancelled ${appointment.service}.`;
    case "No-show":
      return `No-show logged for ${appointment.patientName}.`;
    default:
      return `${appointment.service} scheduled for ${appointment.patientName}.`;
  }
}

function formatActivityTail(appointment: Appointment, dentistName: string) {
  return `${formatAppointmentDate(appointment.date)} at ${appointment.time} with ${dentistName}`;
}
