import { useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

type CalendarProps = {
  mode: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  defaultMonth?: Date;
  className?: string;
};

const weekdayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function Calendar({ mode, selected, onSelect, defaultMonth, className }: CalendarProps) {
  const [month, setMonth] = useState<Date>(defaultMonth ?? selected ?? new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  if (mode !== "single") return null;

  return (
    <div className={cn("w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-900", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{format(month, "MMMM yyyy")}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Select a date</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            className="h-9 w-9 shrink-0 rounded-md px-0"
            onClick={() => setMonth((current) => subMonths(current, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-9 shrink-0 rounded-md px-0"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const selectedDay = selected ? isSameDay(day, selected) : false;
          const currentMonth = isSameMonth(day, month);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect?.(day)}
              className={cn(
                "flex h-10 items-center justify-center rounded-md text-sm font-medium transition",
                currentMonth
                  ? "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-zinc-900"
                  : "text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-zinc-900/60",
                today && !selectedDay && "border border-xroads-200 text-xroads-700 dark:border-xroads-500/40 dark:text-xroads-200",
                selectedDay && "bg-xroads-500 text-white shadow-sm hover:bg-xroads-600",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
