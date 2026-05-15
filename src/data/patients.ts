import type { BranchId } from "./branches";

export type Patient = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  branchId: BranchId;
  lastVisit: string;
  nextAppointment: string;
  paymentMethod: "Cash" | "Medical Scheme";
  schemeName?: string;
};

export const patients: Patient[] = [
  { id: "PAT-001", name: "Grace Banda", phone: "+265 888 201 430", email: "grace@example.com", branchId: "xroads-dental", lastVisit: "2026-04-21", nextAppointment: "Today 08:30", paymentMethod: "Medical Scheme", schemeName: "MASM" },
  { id: "PAT-002", name: "Thoko Phiri", phone: "+265 999 118 045", branchId: "xroads-dental", lastVisit: "2026-05-01", nextAppointment: "Today 11:00", paymentMethod: "Cash" },
  { id: "PAT-003", name: "Mary Tembo", phone: "+265 887 443 902", email: "mary@example.com", branchId: "gateway-dental", lastVisit: "New patient", nextAppointment: "Today 09:00", paymentMethod: "Cash" },
  { id: "PAT-004", name: "Patrick Zulu", phone: "+265 884 871 223", branchId: "gateway-dental", lastVisit: "2026-04-14", nextAppointment: "Tomorrow 14:00", paymentMethod: "Medical Scheme", schemeName: "AON" },
  { id: "PAT-005", name: "Ruth Mbewe", phone: "+265 991 320 884", branchId: "xroads-dental", lastVisit: "Today", nextAppointment: "No upcoming", paymentMethod: "Medical Scheme", schemeName: "Liberty Health" },
  { id: "PAT-006", name: "Linda Chirwa", phone: "+265 995 020 111", branchId: "gateway-dental", lastVisit: "2026-03-30", nextAppointment: "Today 12:00", paymentMethod: "Cash" },
];
