import type { BranchId } from "./branches";

export type UserRole = "Super Admin" | "Branch Admin" | "Receptionist" | "Dentist" | "Finance";

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: BranchId | "All branches";
  status: "Active" | "Invited" | "Suspended";
  lastLogin: string;
};

export const users: UserAccount[] = [
  { id: "USR-001", name: "Dr. Osman Wisk", email: "osman@xroads.health", role: "Super Admin", branchId: "All branches", status: "Active", lastLogin: "Today 07:52" },
  { id: "USR-002", name: "Joseph Mathewe", email: "joseph@xroads.health", role: "Dentist", branchId: "gateway-dental", status: "Active", lastLogin: "Today 08:11" },
  { id: "USR-003", name: "Evelyn Sapuwa", email: "evelyn@xroads.health", role: "Dentist", branchId: "xroads-dental", status: "Active", lastLogin: "Yesterday 16:44" },
  { id: "USR-004", name: "Naomi Mponda", email: "naomi@xroads.health", role: "Branch Admin", branchId: "gateway-dental", status: "Active", lastLogin: "Today 09:02" },
  { id: "USR-005", name: "Thomasi Mukhaya", email: "thomasi@xroads.health", role: "Finance", branchId: "xroads-dental", status: "Invited", lastLogin: "Never" },
];
