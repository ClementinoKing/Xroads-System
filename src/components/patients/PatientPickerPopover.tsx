import { useEffect, useMemo, useState } from "react";
import { Check, Search, UserRound, X } from "lucide-react";
import type { Patient } from "../../data/patients";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../lib/utils";

type PatientPickerPopoverProps = {
  patients: Patient[];
  value: Patient | null;
  onSelect: (patient: Patient) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function PatientPickerPopover({
  patients,
  value,
  onSelect,
  onClear,
  placeholder = "Search and select a patient",
  disabled = false,
  isLoading = false,
  error = null,
  onRetry,
}: PatientPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...patients]
      .sort((left, right) => left.name.localeCompare(right.name))
      .filter((patient) => {
        if (!query) return true;

        return [patient.patientCode ?? "", patient.id, patient.name, patient.phone, patient.email ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
  }, [patients, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-start px-3 text-left font-normal",
            !value && "text-slate-400",
          )}
        >
          <UserRound size={16} className="shrink-0 text-slate-400" />
          <span className="min-w-0 flex-1 truncate">
            {value ? (
              <span className="flex min-w-0 flex-col text-left">
                <span className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{value.name}</span>
                <span className="truncate text-xs text-slate-500 dark:text-slate-400">{value.phone}</span>
              </span>
            ) : (
              placeholder
            )}
          </span>
          {value && onClear ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selected patient"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onClear();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onClear();
                }
              }}
              className="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-slate-200"
            >
              <X size={14} />
            </span>
          ) : null}
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
              placeholder="Search by name, phone, email, or patient code"
            />
          </div>
        </div>

        <div className="max-h-[19rem] overflow-y-auto p-2">
          {isLoading ? (
            <MessageState title="Loading patients" description="Fetching the patient directory." />
          ) : error ? (
            <div className="space-y-3 rounded-xl p-3">
              <MessageState title="Patients could not be loaded" description={error} />
              {onRetry ? (
                <Button type="button" variant="outline" className="w-full" onClick={onRetry}>
                  Retry
                </Button>
              ) : null}
            </div>
          ) : filteredPatients.length === 0 ? (
            <MessageState
              title="No patients found"
              description={search.trim() ? "Try a different search term." : "No patients are available for this branch."}
            />
          ) : (
            <div className="space-y-1">
              {filteredPatients.map((patient) => {
                const isSelected = value?.id === patient.id;

                return (
                  <button
                    key={patient.id}
                    type="button"
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-zinc-800/80",
                      isSelected && "bg-xroads-50 dark:bg-zinc-800",
                    )}
                    onClick={() => {
                      onSelect(patient);
                      setOpen(false);
                    }}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{patient.name}</span>
                        <Badge className="bg-slate-100 text-slate-600 ring-slate-200 dark:bg-zinc-900 dark:text-slate-300 dark:ring-zinc-700">
                          {patient.patientCode ?? patient.id}
                        </Badge>
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{patient.phone}</div>
                      {patient.email ? <div className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">{patient.email}</div> : null}
                    </div>
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

function MessageState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl px-3 py-4 text-center">
      <div className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</div>
    </div>
  );
}
