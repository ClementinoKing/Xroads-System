export type RoleDefinition = {
  id: string;
  name: string;
  description: string;
  userCount: number;
  accessLevel: "Full access" | "Operational access" | "Limited access";
  permissions: string[];
};

export const roles: RoleDefinition[] = [
  {
    id: "ROLE-001",
    name: "Super Admin",
    description: "Owns the platform, configuration, and clinic-wide oversight.",
    userCount: 1,
    accessLevel: "Full access",
    permissions: ["Users", "Roles", "Branches", "Reports", "Settings"],
  },
  {
    id: "ROLE-002",
    name: "Branch Admin",
    description: "Manages branch operations, appointments, and local staff activity.",
    userCount: 1,
    accessLevel: "Full access",
    permissions: ["Appointments", "Patients", "Calendar", "Branch view"],
  },
  {
    id: "ROLE-003",
    name: "Receptionist",
    description: "Handles front-desk scheduling and patient coordination.",
    userCount: 0,
    accessLevel: "Operational access",
    permissions: ["Appointments", "Patients", "Calendar"],
  },
  {
    id: "ROLE-004",
    name: "Dentist",
    description: "Accesses clinical schedules, appointments, and patient context.",
    userCount: 2,
    accessLevel: "Operational access",
    permissions: ["Calendar", "Patients", "Appointment details"],
  },
  {
    id: "ROLE-005",
    name: "Finance",
    description: "Works with payments, balances, and finance reports.",
    userCount: 1,
    accessLevel: "Limited access",
    permissions: ["Reports", "Billing", "Payments"],
  },
];
