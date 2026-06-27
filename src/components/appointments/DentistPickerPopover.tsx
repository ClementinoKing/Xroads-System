import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Search, Stethoscope } from "lucide-react";
import type { Appointment } from "../../data/appointments";
import { branches } from "../../data/branches";
import type { Dentist } from "../../data/dentists";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { getBranchBadgeClass } from "../../lib/branch-badges";
import { cn } from "../../lib/utils";
import { formatDurationLabel, getAppointmentDurationMinutes, minutesFromTime } from "./scheduler-utils";

type AvailabilityState = "Available" | "Busy" | "Off duty" | "In consultation";

type DentistPickerPopoverProps = {
  dentists: Dentist[];
  appointments?: Appointment[];
  value: Dentist | null;
  date: string;
  time: string;
  durationMinutes: number;
  onSelect: (dentist: Dentist) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function DentistPickerPopover({
  dentists,
  appointments = [],
  value,
  date,
  time,
  durationMinutes,
  onSelect,
  placeholder = "Select a dentist",
  disabled = false,
}: DentistPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const filteredDentists = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...dentists]
      .sort((left, right) => left.name.localeCompare(right.name))
      .filter((dentist) => {
        if (!query) return true;
        return [dentist.name, dentist.role, dentist.appointmentMarker ?? "", dentist.availability, dentist.branchId].join(" ").toLowerCase().includes(query);
      });
  }, [dentists, search]);

  const todayAppointmentsByDentist = useMemo(() => {
    const counts = new Map<string, number>();

    for (const appointment of appointments) {
      if (appointment.date !== date) continue;
      if (appointment.status === "Cancelled" || appointment.status === "No-show") continue;

      counts.set(appointment.dentistId, (counts.get(appointment.dentistId) ?? 0) + 1);
    }

    return counts;
  }, [appointments, date]);

  const availabilityByDentistId = useMemo(() => {
    const targetStart = minutesFromTime(time);
    const targetEnd = targetStart + durationMinutes;
    const map = new Map<string, { state: AvailabilityState; label: string; available: boolean }>();

    for (const dentist of dentists) {
      const baseState = dentist.availability;
      const slotConflict = appointments.some((appointment) => {
        if (appointment.dentistId !== dentist.id) return false;
        if (appointment.date !== date) return false;

        const appointmentStart = minutesFromTime(appointment.time);
        const appointmentDuration = getAppointmentDurationMinutes(appointment);
        const appointmentEnd = appointmentStart + appointmentDuration;

        return targetStart < appointmentEnd && targetEnd > appointmentStart;
      });

      if (baseState === "Off duty") {
        map.set(dentist.id, { state: "Off duty", label: "Off duty", available: false });
        continue;
      }

      if (baseState === "In consultation") {
        map.set(dentist.id, { state: "In consultation", label: "In consultation", available: false });
        continue;
      }

      if (slotConflict) {
        map.set(dentist.id, { state: "Busy", label: "Busy", available: false });
        continue;
      }

      map.set(dentist.id, { state: "Available", label: `Available · ${formatDurationLabel(durationMinutes)}`, available: true });
    }

    return map;
  }, [appointments, date, dentists, durationMinutes, time]);

  const selectedAvailability = value ? availabilityByDentistId.get(value.id) ?? null : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-between px-3 text-left font-normal",
            !value && "text-slate-400",
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Stethoscope size={16} className="shrink-0 text-slate-400" />
            <span className="min-w-0 flex-1 truncate">
              {value ? (
                <span className="flex min-w-0 flex-col text-left">
                  <span className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{value.name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate">{value.role}</span>
                  </span>
                </span>
              ) : (
                placeholder
              )}
            </span>
          </span>
          {selectedAvailability ? (
            <Badge
              className={cn(
                "ml-2 shrink-0 border px-2 py-0.5 text-[11px] font-semibold",
                selectedAvailability.available
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-100"
                  : "border-slate-200 bg-slate-100 text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300",
              )}
            >
              {selectedAvailability.label}
            </Badge>
          ) : (
            <ChevronDown size={16} className="shrink-0 text-slate-400" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="z-[10000] w-[min(92vw,36rem)] rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="border-b border-slate-100 p-3 dark:border-neutral-800">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input h-11 pl-9"
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, role, or status"
            />
          </div>
        </div>

        <div className="max-h-[19rem] overflow-y-auto p-2">
          {filteredDentists.length === 0 ? (
            <PopoverMessage title="No dentists found" description="Try a different search term." />
          ) : (
            <div className="space-y-1">
              {filteredDentists.map((dentist) => {
                const availability = availabilityByDentistId.get(dentist.id) ?? { state: dentist.availability, label: dentist.availability, available: dentist.availability === "Available" };
                const isSelected = value?.id === dentist.id;
                const branchName = branches.find((branch) => branch.id === dentist.branchId)?.name ?? dentist.branchId;

                return (
                  <button
                    key={dentist.id}
                    type="button"
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-zinc-800/80",
                      isSelected && "bg-xroads-50 dark:bg-zinc-800",
                    )}
                    onClick={() => {
                      onSelect(dentist);
                      setOpen(false);
                    }}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{dentist.name}</span>
                        <Badge className="bg-slate-100 text-slate-600 ring-slate-200 dark:bg-zinc-900 dark:text-slate-300 dark:ring-zinc-700">
                          {dentist.role}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Badge className={`${getBranchBadgeClass(branchName)} px-2 py-0.5 text-[10px] font-semibold`}>
                          {branchName}
                        </Badge>
                        <span className="truncate">{todayAppointmentsByDentist.get(dentist.id) ?? dentist.todayAppointments} appointments today</span>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "shrink-0 border px-2 py-0.5 text-[11px] font-semibold",
                        availability.available
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-100"
                          : "border-slate-200 bg-slate-100 text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300",
                      )}
                    >
                      {availability.label}
                    </Badge>
                    {isSelected ? <Check size={16} className="mt-0.5 shrink-0 text-xroads-600" /> : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PopoverMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl px-3 py-4 text-center">
      <div className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</div>
    </div>
  );
}
