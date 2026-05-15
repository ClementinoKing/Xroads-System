import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { appointments, type AppointmentStatus } from "../data/appointments";
import { branches } from "../data/branches";
import { dentists } from "../data/dentists";
import { BookingDetailModal } from "../components/appointments/BookingDetailModal";
import { NewBookingModal } from "../components/appointments/NewBookingModal";
import { Badge, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { EmptyState } from "../components/shared/EmptyState";
import { FilterField } from "../components/shared/Filters";

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

export function BookingPage() {
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState<BranchFilter>("All");
  const [status, setStatus] = useState<AppointmentStatus | "All">("All");
  const [open, setOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments
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
  }, [branch, search, status]);

  const selectedBooking = useMemo(
    () => filteredBookings.find((booking) => booking.id === selectedBookingId) ?? null,
    [filteredBookings, selectedBookingId],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="page-title">Bookings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">All appointment bookings in a single operational table.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={18} />
          Create booking
        </Button>
      </div>

      <Card>
        <CardHeader className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
            <input className="input pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient, service, date, or phone" />
          </label>
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
          <FilterField label="Status">
            <select className="input" value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus | "All")}>
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FilterField>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {filteredBookings.length ? (
            <table className="w-full min-w-[1020px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Dentist</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredBookings.map((booking) => {
                  const branchName = branches.find((item) => item.id === booking.branchId)?.name ?? "Branch";
                  const dentistName = dentists.find((item) => item.id === booking.dentistId)?.name ?? "Dentist";

                  return (
                    <tr
                      key={booking.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedBookingId(booking.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedBookingId(booking.id);
                        }
                      }}
                      className="cursor-pointer hover:bg-xroads-50/40 focus:outline-none focus-visible:bg-xroads-50/60 dark:hover:bg-zinc-900/60 dark:focus-visible:bg-zinc-900/60"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-950 dark:text-slate-50">
                        <div>{booking.id}</div>
                        <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{booking.date} at {booking.time}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-950 dark:text-slate-50">{booking.patientName}</div>
                        <div className="text-slate-600 dark:text-slate-300">{booking.phone}</div>
                        <div className="mt-1 text-xs text-slate-400">{booking.service}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{branchName}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{dentistName}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={booking.status} />
                        {booking.emergency ? (
                          <div className="mt-2">
                            <Badge className="bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:ring-rose-900/60">Emergency</Badge>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        {booking.paymentType}
                        <div className="mt-1 text-xs text-slate-400">{booking.schemeName ?? "Direct payment"}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-5">
              <EmptyState title="No bookings found" description="Try a different search term, branch, or status filter." />
            </div>
          )}
        </CardContent>
      </Card>

      <NewBookingModal open={open} onClose={() => setOpen(false)} />
      <BookingDetailModal open={Boolean(selectedBooking)} booking={selectedBooking} onClose={() => setSelectedBookingId(null)} />
    </div>
  );
}
