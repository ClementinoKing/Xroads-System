import { useEffect, useState } from "react";
import { Clock, HeartPulse } from "lucide-react";
import { services, type DentalService } from "../data/services";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { CREATED_EVENTS } from "../lib/create-events";

export function ServicesPage() {
  const [serviceList, setServiceList] = useState<DentalService[]>(services);

  useEffect(() => {
    const handleCreated = (event: Event) => {
      const customEvent = event as CustomEvent<DentalService>;
      if (!customEvent.detail?.id) return;
      setServiceList((current) =>
        current.some((item) => item.id === customEvent.detail.id) ? current : [customEvent.detail, ...current],
      );
    };

    window.addEventListener(CREATED_EVENTS.service, handleCreated);
    return () => window.removeEventListener(CREATED_EVENTS.service, handleCreated);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Services</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Dental service catalog with durations, categories, and availability status.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {serviceList.map((service) => (
          <Card key={service.id} className="p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-4">
              <div className="rounded-lg bg-xroads-50 p-3 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-200">
                <HeartPulse size={22} />
              </div>
              <Badge className={service.active ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-neutral-800 dark:text-emerald-200 dark:ring-neutral-700" : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-neutral-800 dark:text-slate-200 dark:ring-neutral-700"}>
                {service.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-950 dark:text-slate-50">{service.name}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{service.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-neutral-800 dark:text-slate-200">
                <Clock size={14} /> {service.duration} min
              </span>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700 dark:bg-neutral-800 dark:text-sky-200">
                {service.category}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
