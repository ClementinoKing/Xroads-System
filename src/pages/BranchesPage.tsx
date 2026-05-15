import { Building2 } from "lucide-react";
import { appointments } from "../data/appointments";
import { branches } from "../data/branches";
import { dentists } from "../data/dentists";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export function BranchesPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Branches</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Operational snapshot for Xroads Dental and Gateway Dental.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {branches.map((branch) => {
          const branchAppointments = appointments.filter((item) => item.branchId === branch.id && item.date === today);
          return (
            <Card key={branch.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-xroads-50 p-3 text-xroads-700"><Building2 size={24} /></div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">{branch.name}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{branch.address}</p>
                  </div>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">{branch.status}</Badge>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Metric label="Today's bookings" value={branchAppointments.length} />
                <Metric label="Available dentists" value={dentists.filter((item) => item.branchId === branch.id && item.availability === "Available").length} />
                <Metric label="Completed" value={branchAppointments.filter((item) => item.status === "Completed").length} />
                <Metric label="Pending" value={branchAppointments.filter((item) => item.status === "Pending").length} />
              </div>
              <p className="mt-5 rounded-md bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-600 dark:text-slate-300">{branch.hours}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-4"><p className="text-2xl font-bold text-slate-950 dark:text-slate-50">{value}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{label}</p></div>;
}
