import { Activity, AlertTriangle, ArrowUpRight, CalendarCheck, CalendarClock, CheckCircle2, Clock3, TrendingUp, UserX } from "lucide-react";
import { format } from "date-fns";
import { appointments } from "../data/appointments";
import { branches } from "../data/branches";
import { dentists } from "../data/dentists";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/Badge";
import { reports } from "../data/reports";
import { cn } from "../lib/utils";

const today = new Date().toISOString().slice(0, 10);
const todaysAppointments = appointments.filter((item) => item.date === today);
const todaysCount = todaysAppointments.length;
const completedCount = appointments.filter((item) => item.status === "Completed").length;
const pendingCount = appointments.filter((item) => item.status === "Pending").length;
const cancelledCount = appointments.filter((item) => item.status === "Cancelled").length;
const emergencyCount = appointments.filter((item) => item.emergency).length;
const noShowCount = appointments.filter((item) => item.status === "No-show").length;

const kpis = [
  { label: "Today's Appointments", value: todaysCount, icon: CalendarCheck, tone: "from-xroads-50 to-white", iconTone: "bg-xroads-500 text-white", delta: "+12%" },
  { label: "Pending Appointments", value: pendingCount, icon: Clock3, tone: "from-amber-50 to-white", iconTone: "bg-amber-100 text-amber-700", delta: "-4%" },
  { label: "Completed", value: completedCount, icon: CheckCircle2, tone: "from-emerald-50 to-white", iconTone: "bg-emerald-100 text-emerald-700", delta: "+18%" },
  { label: "Cancelled", value: cancelledCount, icon: UserX, tone: "from-rose-50 to-white", iconTone: "bg-rose-100 text-rose-700", delta: "-2%" },
  { label: "No Shows", value: noShowCount, icon: CalendarClock, tone: "from-slate-100 to-white", iconTone: "bg-slate-100 text-slate-700", delta: "+1%" },
  { label: "Emergency Cases", value: emergencyCount, icon: AlertTriangle, tone: "from-red-50 to-white", iconTone: "bg-red-100 text-red-700", delta: "+3%" },
];

const weeklyTrend = [12, 16, 14, 20, 19, 24, 21];
const branchSplit = reports.appointmentsByBranch;
const statusBreakdown = [
  { label: "Confirmed", value: appointments.filter((item) => item.status === "Confirmed").length, color: "bg-sky-500" },
  { label: "Arrived", value: appointments.filter((item) => item.status === "Arrived").length, color: "bg-indigo-500" },
  { label: "In Consultation", value: appointments.filter((item) => item.status === "In Consultation").length, color: "bg-violet-500" },
  { label: "Completed", value: appointments.filter((item) => item.status === "Completed").length, color: "bg-emerald-500" },
  { label: "Pending", value: pendingCount, color: "bg-amber-500" },
];
const workload = reports.dentistWorkload;

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-xroads-100 bg-gradient-to-br from-white via-white to-xroads-50/60 p-0 shadow-soft">
        <div className="grid gap-6 p-6 xl:grid-cols-[1.2fr_0.8fr] xl:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-xroads-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-xroads-700">
              Executive operations overview
            </div>
            <div>
              <p className="text-sm font-semibold text-xroads-700">{format(new Date(), "EEEE, MMMM d")}</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Clinic performance dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Real-time view of appointment flow, branch productivity, chair utilization, and financial mix across Xroads Dental and Gateway Dental.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <BadgePill label="Today" value={todaysCount.toString()} />
              <BadgePill label="Completed" value={completedCount.toString()} tone="emerald" />
              <BadgePill label="Emergency" value={emergencyCount.toString()} tone="rose" />
              <BadgePill label="No-show" value={noShowCount.toString()} tone="slate" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <MiniMetric label="Completion rate" value={`${Math.round((completedCount / appointments.length) * 100)}%`} note="Across all branches" icon={TrendingUp} />
            <MiniMetric label="Pending queue" value={pendingCount.toString()} note="Needs attention today" icon={Clock3} />
            <MiniMetric label="Emergency load" value={emergencyCount.toString()} note="High priority cases" icon={AlertTriangle} />
            <MiniMetric label="Branch coverage" value={`${branches.length}`} note="Active locations" icon={ArrowUpRight} />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map((stat) => (
          <Card key={stat.label} className={cn("border-slate-200 bg-gradient-to-br p-4 shadow-sm", stat.tone)}>
            <div className="flex items-start justify-between gap-3">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", stat.iconTone)}>
                <stat.icon size={20} />
              </div>
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-slate-600">{stat.delta}</span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-600">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Appointment flow</CardTitle>
              <p className="mt-1 text-sm text-slate-500">This week’s volume and completed appointments.</p>
            </div>
            <span className="rounded-full bg-xroads-50 px-3 py-1 text-xs font-semibold text-xroads-700">7-day trend</span>
          </CardHeader>
          <CardContent>
            <LineChart title="Appointments" data={weeklyTrend} accent="#7eb928" />
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <StatBand label="Completed appointments" value={`${completedCount}`} sublabel="Clinic-wide" tone="bg-emerald-50 text-emerald-700" />
              <StatBand label="Scheduled capacity" value={`${todaysCount + pendingCount}`} sublabel="Open slots and queued cases" tone="bg-xroads-50 text-xroads-700" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branch split</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Volume distribution by branch.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <DonutChart data={branchSplit} />
            <div className="space-y-3">
              {branchSplit.map((item, index) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className={cn("h-2.5 w-2.5 rounded-full", index === 0 ? "bg-xroads-500" : "bg-sky-500")} />
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-950">{item.value}%</span>
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
            <p className="mt-1 text-sm text-slate-500">Priority appointments by time and status.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysAppointments.slice(0, 6).map((appointment, index) => (
              <div key={appointment.id} className="grid grid-cols-[72px_1fr_auto] items-center gap-4 rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-xroads-50 text-sm font-semibold text-xroads-700">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{appointment.time} - {appointment.patientName}</p>
                  <p className="truncate text-sm text-slate-500">{appointment.service} with {dentists.find((item) => item.id === appointment.dentistId)?.name}</p>
                </div>
                <StatusBadge status={appointment.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dentist workload</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Daily load and chair occupancy by clinician.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {workload.map((item, index) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-900">{item.label}</span>
                  <span className="text-slate-500">{item.value}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className={cn("h-3 rounded-full", index === 0 ? "bg-xroads-500" : index === 1 ? "bg-sky-500" : index === 2 ? "bg-indigo-500" : "bg-violet-500")}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Status breakdown</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Current appointment lifecycle mix.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusBreakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-900">{item.label}</span>
                  <span className="text-slate-500">{item.value}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className={cn("h-3 rounded-full", item.color)} style={{ width: `${Math.max(item.value * 12, 10)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming appointments</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Forward look at tomorrow and beyond.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.filter((item) => item.date > today).map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-950">{appointment.patientName}</p>
                  <p className="text-sm text-slate-500">{appointment.date} at {appointment.time}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-xroads-700">{appointment.service}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Operational events that matter to front desk and branch leads.</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            "Booking confirmed for Grace Banda",
            "Emergency case moved to consultation",
            "Gateway Dental completed morning reconciliation",
            "No-show logged for Mercy Zimba",
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xroads-700 shadow-sm">
                <Activity size={16} />
              </div>
              <p className="text-sm leading-6 text-slate-600">{item}</p>
            </div>
          ))}
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
    <div className="rounded-lg border border-slate-100 bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-xroads-50 text-xroads-700">
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">{note}</p>
    </div>
  );
}

function BadgePill({ label, value, tone = "xroads" }: { label: string; value: string; tone?: "xroads" | "emerald" | "rose" | "slate" }) {
  const tones: Record<typeof tone, string> = {
    xroads: "bg-xroads-50 text-xroads-700 border-xroads-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
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
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{sublabel}</p>
    </div>
  );
}

function DonutChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const first = (data[0]?.value / total) * 100;
  const second = (data[1]?.value / total) * 100;

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative flex h-48 w-48 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(#7eb928 0% ${first}%, #38bdf8 ${first}% ${first + second}%, #e2e8f0 ${first + second}% 100%)`,
        }}
      >
        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-sm">
          <span className="text-2xl font-semibold text-slate-950">{total}</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">appointments</span>
        </div>
      </div>
    </div>
  );
}

function LineChart({ title, data, accent }: { title: string; data: number[]; accent: string }) {
  const width = 600;
  const height = 220;
  const padding = 24;
  const max = Math.max(...data) + 2;
  const step = (width - padding * 2) / (data.length - 1);
  const points = data.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - (value / max) * (height - padding * 2);
    return `${x},${y}`;
  });
  const areaPoints = `${padding},${height - padding} ${points.join(" ")} ${width - padding},${height - padding}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</span>
        <span className="text-sm font-semibold text-xroads-700">+14% vs last week</span>
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
          return <circle key={`${value}-${index}`} cx={x} cy={y} r="5.5" fill="#fff" stroke="#7eb928" strokeWidth="4" />;
        })}
      </svg>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, index) => (
          <div key={label} className="space-y-1">
            <div className="text-slate-400">{label}</div>
            <div className={cn("h-2 rounded-full bg-slate-100", index === 4 && "bg-xroads-500/30")} />
          </div>
        ))}
      </div>
    </div>
  );
}
