import { format, isValid, parseISO } from "date-fns";
import { CalendarClock, Clock3, Eye, UserRound } from "lucide-react";
import type { Appointment } from "../../data/appointments";
import { branches } from "../../data/branches";
import { Badge, StatusBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { DataTable, type DataTableColumn } from "../shared/DataTable";
import { getBranchBadgeClass } from "../../lib/branch-badges";
import { formatTimeRange, getAppointmentDurationMinutes } from "./scheduler-utils";

export function AppointmentTableView({
  appointments,
  onAppointmentClick,
}: {
  appointments: Appointment[];
  onAppointmentClick: (appointmentId: string) => void;
}) {
  const columns: Array<DataTableColumn<Appointment>> = [
    {
      key: "time",
      header: "Time",
      className: "whitespace-nowrap",
      cell: (appointment) => {
        const parsedDate = parseISO(appointment.date);
        const dateLabel = isValid(parsedDate) ? format(parsedDate, "MMM d") : "Unknown date";

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
              <CalendarClock size={15} className="text-slate-400" />
              <span>{dateLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Clock3 size={13} className="text-slate-400" />
              <span>{formatTimeRange(appointment.time, getAppointmentDurationMinutes(appointment))}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "patient",
      header: "Patient",
      className: "min-w-[240px]",
      cell: (appointment) => (
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-slate-950 dark:text-slate-50">{appointment.patientName}</div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <UserRound size={13} className="text-slate-400" />
            <span>{appointment.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: "dentist",
      header: "Dentist",
      className: "min-w-[220px]",
      cell: (appointment) => (
        <div className="text-sm text-slate-600 dark:text-slate-300">
          <div className="font-semibold text-slate-950 dark:text-slate-50">{appointment.dentistName ?? "Assigned dentist"}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{appointment.dentistRole ?? "Clinical staff"}</div>
        </div>
      ),
    },
    {
      key: "branch",
      header: "Branch",
      className: "whitespace-nowrap",
      cell: (appointment) => {
        const branch = branches.find((item) => item.id === appointment.branchId);

        return (
          <Badge className={`${getBranchBadgeClass(branch?.name)} px-2 py-0.5 text-[11px] font-semibold`}>
            {branch?.name ?? "Branch"}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      className: "whitespace-nowrap",
      cell: (appointment) => <StatusBadge status={appointment.status} />,
    },
    {
      key: "service",
      header: "Service",
      className: "min-w-[180px]",
      cell: (appointment) => (
        <div className="text-sm text-slate-600 dark:text-slate-300">
          <div className="font-semibold text-slate-950 dark:text-slate-50">{appointment.service}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{appointment.paymentType}</div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-[110px]",
      cell: (appointment) => (
        <Button
          type="button"
          variant="outline"
          className="h-9 px-3 text-xs"
          onClick={(event) => {
            event.stopPropagation();
            onAppointmentClick(appointment.id);
          }}
        >
          <Eye size={15} />
          Open
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      rows={appointments}
      columns={columns}
      getRowKey={(appointment) => appointment.id}
      minWidth="1120px"
      emptyTitle="No appointments on this day"
      emptyDescription="Create a booking or switch the date to review another day's schedule."
      onRowClick={(appointment) => onAppointmentClick(appointment.id)}
    />
  );
}

