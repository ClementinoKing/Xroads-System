import { reports } from "../data/reports";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Visual operational reporting using lightweight mock stat layouts.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ReportBars title="Appointments by branch" data={reports.appointmentsByBranch} />
        <ReportBars title="Appointments by service" data={reports.appointmentsByService.map((item) => ({ ...item, color: "bg-xroads-500" }))} />
        <ReportBars title="Dentist workload" data={reports.dentistWorkload.map((item) => ({ ...item, color: "bg-sky-500" }))} />
        <Card>
          <CardHeader><CardTitle>Cash vs Medical Scheme</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {reports.paymentSplit.map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 dark:bg-slate-900 p-4">
                <div className="flex justify-between text-sm font-semibold"><span>{item.label}</span><span>{item.value}%</span></div>
                <div className="mt-3 h-3 rounded-full bg-white dark:bg-slate-900"><div className="h-3 rounded-full bg-xroads-600" style={{ width: `${item.value}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>No-show rate</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-2xl bg-rose-50 p-6 text-rose-900">
              <p className="text-4xl font-bold">{reports.noShowRate}</p>
              <p className="mt-2 text-sm text-rose-700">Current mock no-show rate across both branches.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Daily completed appointments</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-3">
              {reports.dailyCompleted.map((value, index) => (
                <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-lg bg-xroads-600" style={{ height: `${value * 6}px` }} />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">Day {index + 1}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReportBars({ title, data }: { title: string; data: Array<{ label: string; value: number; color: string }> }) {
  const max = Math.max(...data.map((item) => item.value));
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{item.label}</span>
              <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{item.value}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100">
              <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
