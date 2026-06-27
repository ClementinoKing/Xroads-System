import { addMinutes, format, isValid, parse } from "date-fns";
import type { Appointment } from "../../data/appointments";
import { normalizeTimeString } from "../../lib/time";

export const SLOT_INTERVAL_MINUTES = 30;
export const DEFAULT_WORKDAY_START = "08:00";
export const DEFAULT_WORKDAY_END = "18:00";
export const DURATION_OPTIONS_MINUTES = Array.from({ length: 8 }, (_, index) => (index + 1) * SLOT_INTERVAL_MINUTES);
export const SCHEDULER_TIME_COLUMN_WIDTH = 92;
export const SCHEDULER_HEADER_HEIGHT = 88;
export const SCHEDULER_SLOT_ROW_HEIGHT = 62;

export type AppointmentSeed = Partial<{
  source: "slot" | "toolbar";
  patientId: string;
  serviceId: string;
  dentistId: string;
  date: string;
  time: string;
  durationMinutes: number;
  notes: string;
}>;

export function buildTimeSlots(startTime: string, endTime: string, intervalMinutes = SLOT_INTERVAL_MINUTES) {
  const slots: string[] = [];
  const start = minutesFromTime(startTime);
  const end = minutesFromTime(endTime);

  for (let minutes = start; minutes < end; minutes += intervalMinutes) {
    slots.push(timeFromMinutes(minutes));
  }

  return slots;
}

export function minutesFromTime(time: string) {
  const normalized = normalizeTimeString(time);
  if (!normalized) {
    return Number.NaN;
  }

  const [hours, minutes] = normalized.split(":").map((segment) => Number.parseInt(segment, 10));
  return hours * 60 + minutes;
}

export function timeFromMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function formatTimeRange(startTime: string, durationMinutes: number) {
  const normalized = normalizeTimeString(startTime);
  if (!normalized) {
    return "—";
  }

  const reference = parse(normalized, "HH:mm", new Date());
  if (!isValid(reference)) {
    return "—";
  }

  return `${format(reference, "h:mma").toLowerCase()} - ${format(addMinutes(reference, durationMinutes), "h:mma").toLowerCase()}`;
}

export function formatDurationLabel(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

export function getServiceDurationMinutes(serviceId: string) {
  return SLOT_INTERVAL_MINUTES;
}

export function getDefaultDurationMinutes(serviceId: string) {
  return roundToDurationStep(getServiceDurationMinutes(serviceId));
}

export function getAppointmentDurationMinutes(appointment: Pick<Appointment, "service" | "durationMinutes">) {
  return appointment.durationMinutes ?? getServiceDurationMinutes(appointment.service);
}

export function getAppointmentSlotSpan(durationMinutes: number) {
  return Math.max(1, Math.ceil(durationMinutes / SLOT_INTERVAL_MINUTES));
}

export function roundToDurationStep(durationMinutes: number) {
  return Math.max(SLOT_INTERVAL_MINUTES, Math.ceil(durationMinutes / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES);
}

export function clampSlotIndex(slotIndex: number, totalSlots: number, span = 1) {
  const maxStartIndex = Math.max(0, totalSlots - Math.max(1, span));
  return Math.min(Math.max(0, slotIndex), maxStartIndex);
}

export function parseClinicHours(hours: string) {
  const match = hours.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return null;

  const [, startHour, startMinute = "0", startPeriod, endHour, endMinute = "0", endPeriod] = match;
  return {
    start: toTwentyFourHour(startHour, startMinute, startPeriod),
    end: toTwentyFourHour(endHour, endMinute, endPeriod),
  };
}

function toTwentyFourHour(hour: string, minute: string, period: string) {
  const parsedHour = Number.parseInt(hour, 10);
  const parsedMinute = Number.parseInt(minute, 10);
  const isPm = period.toUpperCase() === "PM";

  let normalizedHour = parsedHour % 12;
  if (isPm) {
    normalizedHour += 12;
  }

  return `${String(normalizedHour).padStart(2, "0")}:${String(parsedMinute).padStart(2, "0")}`;
}
