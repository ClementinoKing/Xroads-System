export const CREATE_EVENTS = {
  appointment: "xroads:create-appointment",
  patient: "xroads:create-patient",
  dentist: "xroads:create-dentist",
  branch: "xroads:create-branch",
  service: "xroads:create-service",
} as const;

export const CREATED_EVENTS = {
  appointment: "xroads:created-appointment",
  patient: "xroads:created-patient",
  dentist: "xroads:created-dentist",
  branch: "xroads:created-branch",
  service: "xroads:created-service",
} as const;

export type CreateEventKey = keyof typeof CREATE_EVENTS;
