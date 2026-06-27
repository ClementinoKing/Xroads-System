import { isAfter, isBefore, isValid, parseISO, startOfDay, subMonths } from "date-fns";
import type { Appointment, AppointmentStatus } from "../../data/appointments";
import type { DentalService } from "../../data/services";

type ServiceSummary = Pick<DentalService, "id" | "name" | "serviceCode">;

const FRONT_DESK_ROLE_ID = "receptionist";
const CONSULTATION_SERVICE_CODES = new Set(["consultation", "98101", "98103"]);
const CHECKUP_SERVICE_CODES = new Set(["checkup", "98102"]);
const NON_QUALIFYING_STATUSES = new Set<AppointmentStatus>(["Cancelled", "No-show"]);
const CONSULTATION_NAME_PATTERNS = [/consultation/i, /initial.*charting/i, /case history/i];
const CHECKUP_NAME_PATTERNS = [/checkup/i, /periodic after initial visit/i, /follow[-\s]?up/i];

export type CheckupEligibility = {
  eligible: boolean;
  qualifyingAppointment: Appointment | null;
};

function normalizeServiceIdentifier(value: string | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, "-") ?? "";
}

function resolveServiceCode(service: ServiceSummary | null | undefined) {
  return normalizeServiceIdentifier(service?.serviceCode) || normalizeServiceIdentifier(service?.name);
}

function resolveServiceName(service: ServiceSummary | null | undefined) {
  return service?.name?.trim().toLowerCase() ?? "";
}

function matchesServicePattern(serviceName: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(serviceName));
}

function classifyFrontDeskService(service: ServiceSummary | null | undefined) {
  const serviceCode = resolveServiceCode(service);
  const serviceName = resolveServiceName(service);

  if (CONSULTATION_SERVICE_CODES.has(serviceCode) || matchesServicePattern(serviceName, CONSULTATION_NAME_PATTERNS)) {
    return "consultation";
  }

  if (CHECKUP_SERVICE_CODES.has(serviceCode) || matchesServicePattern(serviceName, CHECKUP_NAME_PATTERNS)) {
    return "checkup";
  }

  return null;
}

function resolveAppointmentDay(value: string) {
  const parsed = parseISO(value);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

export function isFrontDeskRole(roleId: string | null | undefined) {
  return normalizeServiceIdentifier(roleId ?? undefined) === FRONT_DESK_ROLE_ID;
}

export function isConsultationService(service: ServiceSummary | null | undefined) {
  return classifyFrontDeskService(service) === "consultation";
}

export function isCheckupService(service: ServiceSummary | null | undefined) {
  return classifyFrontDeskService(service) === "checkup";
}

export function isFrontDeskBookableService(service: ServiceSummary | null | undefined) {
  return classifyFrontDeskService(service) !== null;
}

export function getBookableServices(services: DentalService[], roleId: string | null | undefined) {
  if (!isFrontDeskRole(roleId)) {
    return services;
  }

  return services.filter((service) => isFrontDeskBookableService(service));
}

export function findPreferredBookingService(services: DentalService[], roleId: string | null | undefined) {
  const bookableServices = getBookableServices(services, roleId);

  return bookableServices.find((service) => isConsultationService(service)) ?? bookableServices[0] ?? null;
}

export function isServiceAllowedForRole(service: ServiceSummary | null | undefined, roleId: string | null | undefined) {
  if (!service) {
    return false;
  }

  return !isFrontDeskRole(roleId) || isFrontDeskBookableService(service);
}

export function getCheckupEligibility({
  appointments,
  patientId,
  scheduledDate,
  service,
}: {
  appointments: Appointment[];
  patientId: string | null | undefined;
  scheduledDate: string;
  service: ServiceSummary | null | undefined;
}): CheckupEligibility {
  if (!patientId || !isCheckupService(service)) {
    return { eligible: false, qualifyingAppointment: null };
  }

  const scheduledDay = resolveAppointmentDay(scheduledDate);
  if (!scheduledDay) {
    return { eligible: false, qualifyingAppointment: null };
  }

  const lookbackStart = subMonths(scheduledDay, 6);
  const qualifyingAppointment = [...appointments]
    .filter((appointment) => appointment.patientId === patientId)
    .filter((appointment) => !NON_QUALIFYING_STATUSES.has(appointment.status))
    .map((appointment) => ({
      appointment,
      day: resolveAppointmentDay(appointment.date),
    }))
    .filter((entry): entry is { appointment: Appointment; day: Date } => entry.day !== null)
    .filter((entry) => !isAfter(entry.day, scheduledDay) && !isBefore(entry.day, lookbackStart))
    .sort((left, right) => right.day.getTime() - left.day.getTime())[0]?.appointment ?? null;

  return {
    eligible: qualifyingAppointment !== null,
    qualifyingAppointment,
  };
}
