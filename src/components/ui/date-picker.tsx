import { useMemo, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type DatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

function toDate(value?: string) {
  if (!value) return undefined;
  const date = parseISO(value);
  if (!isValid(date)) {
    return undefined;
  }
  return date;
}

function toValue(date?: Date) {
  return date ? format(date, "yyyy-MM-dd") : "";
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", className, disabled = false }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => toDate(value), [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          data-empty={!selectedDate}
          className={cn("w-full justify-between text-left font-normal data-[empty=true]:text-slate-400", className)}
        >
          {selectedDate ? format(selectedDate, "PPP") : <span>{placeholder}</span>}
          <ChevronDownIcon size={16} className="shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[100] w-auto border-0 bg-transparent p-0 shadow-none" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(toValue(date));
            setOpen(false);
          }}
          defaultMonth={selectedDate}
        />
      </PopoverContent>
    </Popover>
  );
}
