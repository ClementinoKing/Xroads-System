import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { MedicalSchemeOption } from "../../features/patients/medical-schemes-service";
import type { PatientFormValues } from "../../features/patients/patients-service";
import { cn } from "../../lib/utils";

type MedicalSchemePopoverProps = {
  form: PatientFormValues;
  update: <K extends keyof PatientFormValues>(key: K, value: PatientFormValues[K]) => void;
  schemes: MedicalSchemeOption[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

export function MedicalSchemePopover({ form, update, schemes, isLoading, error, onRetry }: MedicalSchemePopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedScheme = useMemo(
    () => schemes.find((scheme) => scheme.id === form.medicalSchemeId) ?? null,
    [form.medicalSchemeId, schemes],
  );

  const filteredSchemes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return schemes;
    }

    return schemes.filter((scheme) =>
      [scheme.name, scheme.providerName, scheme.schemeType, scheme.description ?? ""].join(" ").toLowerCase().includes(query),
    );
  }, [schemes, search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    if (form.paymentMethod === "Cash" && open) {
      setOpen(false);
    }
  }, [form.paymentMethod, open]);

  function selectScheme(scheme: MedicalSchemeOption) {
    update("medicalSchemeId", scheme.id);
    update("schemeName", scheme.name);
    setOpen(false);
  }

  function clearSelection() {
    update("medicalSchemeId", "");
    update("schemeName", "");
  }

  const disabled = form.paymentMethod === "Cash";

  return (
    <div className="grid gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-12 w-full justify-between px-3 text-left font-normal",
              disabled && "cursor-not-allowed opacity-60",
              !selectedScheme && form.paymentMethod === "Medical Scheme" && "text-slate-400 dark:text-slate-500",
            )}
            disabled={disabled}
          >
            <span className="truncate">
              {disabled
                ? "Not required for cash payments"
                : selectedScheme
                  ? selectedScheme.name
                  : "Search and select a medical scheme"}
            </span>
            <ChevronDown size={16} className="shrink-0 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="z-[10000] w-[min(92vw,32rem)] rounded-lg border border-slate-200 bg-white p-0 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
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
                placeholder="Search by scheme or provider"
              />
            </div>
          </div>

          <div className="max-h-[18rem] overflow-y-auto p-2">
            {isLoading ? (
              <PopoverMessage title="Loading schemes" description="Fetching the latest medical schemes from Supabase." />
            ) : error ? (
              <div className="space-y-3 rounded-md p-3">
                <PopoverMessage title="Schemes could not be loaded" description={error} />
                <Button type="button" variant="outline" className="w-full" onClick={onRetry}>
                  Retry
                </Button>
              </div>
            ) : filteredSchemes.length === 0 ? (
              <PopoverMessage title="No schemes found" description="Try a different search term." />
            ) : (
              <div className="space-y-1">
                {filteredSchemes.map((scheme) => {
                  const isSelected = scheme.id === form.medicalSchemeId;

                  return (
                    <button
                      key={scheme.id}
                      type="button"
                      className={cn(
                        "flex w-full items-start justify-between gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-zinc-800/80",
                        isSelected && "bg-xroads-50 dark:bg-zinc-800",
                      )}
                      onClick={() => selectScheme(scheme)}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{scheme.name}</span>
                          <Badge className="bg-slate-100 text-slate-600 ring-slate-200 dark:bg-zinc-900 dark:text-slate-300 dark:ring-zinc-700">
                            {scheme.schemeType === "provider" ? "Provider" : "Plan"}
                          </Badge>
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{scheme.providerName}</div>
                        {scheme.description ? <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{scheme.description}</div> : null}
                      </div>
                      {isSelected ? <Check size={16} className="mt-0.5 shrink-0 text-xroads-600" /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2.5 text-xs text-slate-500 dark:border-neutral-800 dark:text-slate-400">
            <span>{selectedScheme ? `Selected: ${selectedScheme.name}` : "No scheme selected"}</span>
            {selectedScheme ? (
              <Button type="button" variant="ghost" className="h-8 px-2 text-xs" onClick={clearSelection}>
                Clear
              </Button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

    </div>
  );
}

function PopoverMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-md px-3 py-4 text-center">
      <div className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</div>
    </div>
  );
}
