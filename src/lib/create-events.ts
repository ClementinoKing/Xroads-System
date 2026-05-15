export const CREATE_EVENTS = {
  booking: "xroads:create-booking",
  patient: "xroads:create-patient",
  dentist: "xroads:create-dentist",
  branch: "xroads:create-branch",
  service: "xroads:create-service",
} as const;

export const CREATED_EVENTS = {
  booking: "xroads:created-booking",
  patient: "xroads:created-patient",
  dentist: "xroads:created-dentist",
  branch: "xroads:created-branch",
  service: "xroads:created-service",
} as const;

export type CreateEventKey = keyof typeof CREATE_EVENTS;
