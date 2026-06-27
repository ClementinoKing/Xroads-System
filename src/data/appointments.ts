import { addDays, format } from "date-fns";
import type { BranchId } from "./branches";
import type { RoleAppointmentMarker } from "../features/staff/role-types";

export type AppointmentStatus = "Pending" | "Confirmed" | "Arrived" | "In Consultation" | "Completed" | "Cancelled" | "No-show" | "Rescheduled";

export type PaymentType = "Cash" | "Medical Scheme";

export type Appointment = {
  id: string;
  patientId?: string;
  patientCode?: string;
  patientName: string;
  phone: string;
  patientEmail?: string;
  branchId: BranchId;
  dentistId: string;
  dentistName?: string;
  dentistRole?: string;
  dentistMarker?: RoleAppointmentMarker | null;
  serviceId?: string;
  serviceCode?: string;
  service: string;
  durationMinutes?: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  paymentType: PaymentType;
  schemeName?: string;
  emergency?: boolean;
  notes: string;
};

const today = new Date();

export const appointments: Appointment[] = [
  { id: "APT-1001", patientName: "Grace Banda", phone: "+265 888 201 430", branchId: "xroads-dental", dentistId: "osman-wisk", service: "Checkup", date: format(today, "yyyy-MM-dd"), time: "08:30", status: "Confirmed", paymentType: "Medical Scheme", schemeName: "MASM", notes: "Routine review." },
  { id: "APT-1002", patientName: "Thoko Phiri", phone: "+265 999 118 045", branchId: "xroads-dental", dentistId: "osman-wisk", service: "Emergency", date: format(today, "yyyy-MM-dd"), time: "11:00", status: "In Consultation", paymentType: "Cash", emergency: true, notes: "Severe tooth pain." },
  { id: "APT-1003", patientName: "Mary Tembo", phone: "+265 887 443 902", branchId: "gateway-dental", dentistId: "joseph-mathewe", service: "Consultation", date: format(today, "yyyy-MM-dd"), time: "09:00", status: "Arrived", paymentType: "Cash", notes: "New patient." },
  { id: "APT-1004", patientName: "Ruth Mbewe", phone: "+265 991 320 884", branchId: "xroads-dental", dentistId: "evelyn-sapuwa", service: "Cleaning", date: format(today, "yyyy-MM-dd"), time: "10:00", status: "Completed", paymentType: "Medical Scheme", schemeName: "Liberty Health", notes: "Completed cleaning." },
  { id: "APT-1005", patientName: "Patrick Zulu", phone: "+265 884 871 223", branchId: "gateway-dental", dentistId: "joseph-mathewe", service: "Orthodontics", date: format(addDays(today, 1), "yyyy-MM-dd"), time: "14:00", status: "Confirmed", paymentType: "Medical Scheme", schemeName: "AON", notes: "Brace adjustment." },
  { id: "APT-1006", patientName: "Linda Chirwa", phone: "+265 995 020 111", branchId: "gateway-dental", dentistId: "naomi-mponda", service: "Orthodontics", date: format(today, "yyyy-MM-dd"), time: "12:00", status: "Confirmed", paymentType: "Cash", notes: "Follow-up." },
  { id: "APT-1007", patientName: "Brian Nkhoma", phone: "+265 881 765 008", branchId: "xroads-dental", dentistId: "evelyn-sapuwa", service: "Pediatric Dentistry", date: format(today, "yyyy-MM-dd"), time: "13:00", status: "Pending", paymentType: "Cash", notes: "Child checkup." },
  { id: "APT-1008", patientName: "James Kaluwa", phone: "+265 999 452 190", branchId: "gateway-dental", dentistId: "naomi-mponda", service: "Checkup", date: format(addDays(today, 2), "yyyy-MM-dd"), time: "16:00", status: "Rescheduled", paymentType: "Medical Scheme", schemeName: "MASM", notes: "Moved from morning." },
  { id: "APT-1009", patientName: "Peter Kachere", phone: "+265 887 134 229", branchId: "xroads-dental", dentistId: "osman-wisk", service: "Cleaning", date: format(today, "yyyy-MM-dd"), time: "15:30", status: "Cancelled", paymentType: "Cash", notes: "Patient cancelled." },
  { id: "APT-1010", patientName: "Mercy Zimba", phone: "+265 992 730 442", branchId: "xroads-dental", dentistId: "thomasi-mukhaya", service: "Consultation", date: format(today, "yyyy-MM-dd"), time: "09:30", status: "No-show", paymentType: "Cash", notes: "No response to call." },
];
