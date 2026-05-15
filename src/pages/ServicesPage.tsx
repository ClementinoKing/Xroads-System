import { Clock, HeartPulse } from "lucide-react";
import { services } from "../data/services";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export function ServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Services</h1>
        <p className="mt-1 text-sm text-slate-500">Dental service catalog with durations, categories, and availability status.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="rounded-lg bg-xroads-50 p-3 text-xroads-700"><HeartPulse size={22} /></div>
              <Badge className={service.active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-200"}>{service.active ? "Active" : "Inactive"}</Badge>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-950">{service.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{service.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"><Clock size={14} /> {service.duration} min</span>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">{service.category}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
