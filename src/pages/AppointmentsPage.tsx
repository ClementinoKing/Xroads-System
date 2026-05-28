import { useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { appointments, type Appointment, type AppointmentStatus } from "../data/appointments";
import { branches } from "../data/branches";
import { dentists } from "../data/dentists";
import { BookingDetailModal } from "../components/appointments/BookingDetailModal";
import { NewBookingModal } from "../components/appointments/NewBookingModal";
import { Badge, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DataTable, type DataTableColumn } from "../components/shared/DataTable";
import { FilterField } from "../components/shared/Filters";
import { CREATED_EVENTS } from "../lib/create-events";

type BranchFilter = "All" | string;

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

const appointmentColumns: Array<DataTableColumn<Appointment>> = [
  {
    key: "appointment",
    header: "Appointment",
    className: "font-semibold text-slate-950 dark:text-slate-50",
    cell: (appointment) => (
      <>
        <div>{appointment.id}</div>
        <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
          {appointment.date} at {appointment.time}
        </div>
      </>
    ),
  },
  {
    key: "patient",
    header: "Patient",
    cell: (appointment) => (
      <>
        <div className="font-semibold text-slate-950 dark:text-slate-50">{appointment.patientName}</div>
        <div className="text-slate-600 dark:text-slate-300">{appointment.phone}</div>
        <div className="mt-1 text-xs text-slate-400">{appointment.service}</div>
      </>
    ),
  },
  {
    key: "branch",
    header: "Branch",
    className: "text-slate-600 dark:text-slate-300",
    cell: (appointment) => branches.find((item) => item.id === appointment.branchId)?.name ?? "Branch",
  },
  {
    key: "dentist",
    header: "Dentist",
    className: "text-slate-600 dark:text-slate-300",
    cell: (appointment) => dentists.find((item) => item.id === appointment.dentistId)?.name ?? "Dentist",
  },
  {
    key: "status",
    header: "Status",
    cell: (appointment) => (
      <>
        <StatusBadge status={appointment.status} />
        {appointment.emergency ? (
          <div className="mt-2">
            <Badge className="bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:ring-rose-900/60">Emergency</Badge>
          </div>
        ) : null}
      </>
    ),
  },
  {
    key: "payment",
    header: "Payment",
    className: "text-slate-600 dark:text-slate-300",
    cell: (appointment) => (
      <>
        {appointment.paymentType}
        <div className="mt-1 text-xs text-slate-400">{appointment.schemeName ?? "Direct payment"}</div>
      </>
    ),
  },
];

export function AppointmentsPage() {
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState<BranchFilter>("All");
  const [status, setStatus] = useState<AppointmentStatus | "All">("All");
  const [open, setOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [appointmentList, setAppointmentList] = useState<Appointment[]>(appointments);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointmentList
      .filter((appointment) => {
        const branchMatch = branch === "All" || appointment.branchId === branch;
        const statusMatch = status === "All" || appointment.status === status;
        const queryMatch =
          !query ||
          [appointment.patientName, appointment.phone, appointment.service, appointment.time, appointment.date]
            .join(" ")
            .toLowerCase()
            .includes(query);

        return branchMatch && statusMatch && queryMatch;
      })
      .sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
  }, [appointmentList, branch, search, status]);

  const selectedAppointment = useMemo(
    () => filteredAppointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [filteredAppointments, selectedAppointmentId],
  );
  const hasActiveFilters = search.trim() !== "" || branch !== "All" || status !== "All";

  function clearFilters() {
    setSearch("");
    setBranch("All");
    setStatus("All");
  }

  function createAppointment(appointment: Appointment) {
    setAppointmentList((current) => [appointment, ...current]);
  }

  useEffect(() => {
    const handleCreated = (event: Event) => {
      const customEvent = event as CustomEvent<Appointment>;
      if (!customEvent.detail?.id) return;
      setAppointmentList((current) =>
        current.some((item) => item.id === customEvent.detail.id) ? current : [customEvent.detail, ...current],
      );
    };

    window.addEventListener(CREATED_EVENTS.appointment, handleCreated);
    return () => window.removeEventListener(CREATED_EVENTS.appointment, handleCreated);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="page-title">Appointments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">All appointments in a single operational table.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={18} />
          Create appointment
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4 bg-slate-50/70 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-xroads-700 ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-xroads-300 dark:ring-zinc-800">
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <CardTitle>Search & filters</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">{filteredAppointments.length} of {appointments.length} appointments shown</p>
                </div>
              </div>
            <Button type="button" variant="outline" className="h-10 w-full px-3 lg:w-auto" onClick={clearFilters} disabled={!hasActiveFilters}>
              <RotateCcw size={16} />
              Reset
            </Button>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(320px,1fr)_240px_220px] xl:items-end">
            <FilterField label="Search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={19} />
                <input
                  className="input h-12 pl-11 text-base"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search patient, service, date, or phone"
                />
              </div>
            </FilterField>
            <FilterField label="Branch">
              <select className="input h-12 text-base" value={branch} onChange={(event) => setBranch(event.target.value)}>
                <option value="All">All branches</option>
                {branches.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Status">
              <select className="input h-12 text-base" value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus | "All")}>
                {statusOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            rows={filteredAppointments}
            columns={appointmentColumns}
            getRowKey={(appointment) => appointment.id}
            minWidth="1020px"
            emptyTitle="No appointments found"
            emptyDescription="Try a different search term, branch, or status filter."
            onRowClick={(appointment) => setSelectedAppointmentId(appointment.id)}
          />
        </CardContent>
      </Card>

      <NewBookingModal open={open} onClose={() => setOpen(false)} onCreate={createAppointment} />
      <BookingDetailModal open={Boolean(selectedAppointment)} booking={selectedAppointment} onClose={() => setSelectedAppointmentId(null)} />
    </div>
  );
}
