import { useEffect, useState } from "react";
import { CalendarDays, Clock, Plus, Stethoscope, X } from "lucide-react";
import { branches } from "../data/branches";
import { dentists, type Dentist } from "../data/dentists";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { AddDentistModal } from "../components/dentists/AddDentistModal";
import { CREATED_EVENTS } from "../lib/create-events";

export function DentistsPage() {
  const [dentistList, setDentistList] = useState<Dentist[]>(dentists);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  function createDentist(dentist: Dentist) {
    setDentistList((current) => [dentist, ...current]);
  }

  useEffect(() => {
    const handleCreated = (event: Event) => {
      const customEvent = event as CustomEvent<Dentist>;
      if (!customEvent.detail?.id) return;
      setDentistList((current) =>
        current.some((item) => item.id === customEvent.detail.id) ? current : [customEvent.detail, ...current],
      );
    };

    window.addEventListener(CREATED_EVENTS.dentist, handleCreated);
    return () => window.removeEventListener(CREATED_EVENTS.dentist, handleCreated);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="page-title">Dentists</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Team availability and daily schedules across both branches.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={18} />
          Create dentist
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dentistList.map((dentist) => (
          <Card key={dentist.id} className="p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-xroads-50 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-200">
                <Stethoscope size={22} />
              </div>
              <Badge
                className={
                  dentist.availability === "Available"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-neutral-800 dark:text-emerald-200 dark:ring-neutral-700"
                    : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-neutral-800 dark:text-slate-200 dark:ring-neutral-700"
                }
              >
                {dentist.availability}
              </Badge>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-950 dark:text-slate-50">{dentist.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{dentist.role}</p>
            <div className="mt-5 grid gap-3 text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><CalendarDays size={16} /> {branches.find((item) => item.id === dentist.branchId)?.name}</span>
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Clock size={16} /> {dentist.todayAppointments} appointments today</span>
            </div>
            <Button variant="outline" className="mt-5 w-full" onClick={() => setSelectedDentist(dentist)}>View schedule</Button>
          </Card>
        ))}
      </div>
      {selectedDentist ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30" onClick={() => setSelectedDentist(null)}>
          <aside className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl dark:bg-neutral-900" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">{selectedDentist.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedDentist.role} schedule</p>
              </div>
              <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => setSelectedDentist(null)} aria-label="Close schedule"><X size={18} /></Button>
            </div>
            <div className="mt-6 space-y-3">
              {selectedDentist.schedule.map((item) => (
                <div key={`${item.time}-${item.patient}`} className="rounded-xl border border-slate-200 p-4 dark:border-neutral-800 dark:bg-neutral-800">
                  <p className="font-semibold text-slate-950 dark:text-slate-50">{item.time} - {item.patient}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.service}</p>
                  <p className="mt-3 text-xs font-semibold uppercase text-xroads-700">{item.status}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
      <AddDentistModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createDentist} />
    </div>
  );
}
