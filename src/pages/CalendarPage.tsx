import { useMemo, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { appointments, type AppointmentStatus } from "../data/appointments";
import { branches } from "../data/branches";
import { dentists } from "../data/dentists";
import { AppointmentCard } from "../components/appointments/AppointmentCard";
import { NewBookingModal } from "../components/appointments/NewBookingModal";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/shared/EmptyState";
import { FilterField } from "../components/shared/Filters";

const statuses: Array<AppointmentStatus | "All"> = ["All", "Pending", "Confirmed", "Arrived", "In Consultation", "Completed", "Cancelled", "No-show", "Rescheduled"];

export function CalendarPage() {
  const [branch, setBranch] = useState("All");
  const [dentist, setDentist] = useState("All");
  const [status, setStatus] = useState<AppointmentStatus | "All">("All");
  const [bookingOpen, setBookingOpen] = useState(false);

  const visibleAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const branchMatch = branch === "All" || appointment.branchId === branch;
        const dentistMatch = dentist === "All" || appointment.dentistId === dentist;
        const statusMatch = status === "All" || appointment.status === status;
        return branchMatch && dentistMatch && statusMatch;
      }),
    [branch, dentist, status],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Appointment calendar</h1>
          <p className="mt-1 text-sm text-slate-500">Calendar/list hybrid view for daily branch operations.</p>
        </div>
        <Button onClick={() => setBookingOpen(true)}><Plus size={17} /> New booking</Button>
      </div>
      <Card className="grid gap-4 p-4 lg:grid-cols-4">
        <FilterField label="Branch">
          <select className="input" value={branch} onChange={(event) => setBranch(event.target.value)}>
            <option>All</option>
            {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </FilterField>
        <FilterField label="Dentist">
          <select className="input" value={dentist} onChange={(event) => setDentist(event.target.value)}>
            <option>All</option>
            {dentists.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </FilterField>
        <FilterField label="Status">
          <select className="input" value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus | "All")}>
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </FilterField>
        <div className="rounded-xl bg-xroads-50 p-4 text-xroads-900">
          <CalendarDays size={18} />
          <p className="mt-2 text-sm font-semibold">{visibleAppointments.length} appointments visible</p>
        </div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {visibleAppointments.length ? visibleAppointments.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />) : <div className="xl:col-span-2"><EmptyState title="No appointments found" description="Adjust branch, dentist, or status filters to view appointments." /></div>}
      </div>
      <NewBookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
}
