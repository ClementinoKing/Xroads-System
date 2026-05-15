import type { BranchId } from "./branches";

export type Dentist = {
  id: string;
  name: string;
  role: string;
  branchId: BranchId;
  availability: "Available" | "In consultation" | "Off duty";
  todayAppointments: number;
  schedule: Array<{ time: string; patient: string; service: string; status: string }>;
};

export const dentists: Dentist[] = [
  {
    id: "osman-wisk",
    name: "Dr. Osman Wisk",
    role: "Lead Dentist",
    branchId: "xroads-dental",
    availability: "Available",
    todayAppointments: 8,
    schedule: [
      { time: "08:30", patient: "Grace Banda", service: "Checkup", status: "Confirmed" },
      { time: "11:00", patient: "Thoko Phiri", service: "Emergency", status: "In Consultation" },
      { time: "15:30", patient: "Peter Kachere", service: "Cleaning", status: "Pending" },
    ],
  },
  {
    id: "joseph-mathewe",
    name: "Joseph Mathewe",
    role: "Dentist",
    branchId: "gateway-dental",
    availability: "In consultation",
    todayAppointments: 6,
    schedule: [
      { time: "09:00", patient: "Mary Tembo", service: "Consultation", status: "Arrived" },
      { time: "14:00", patient: "Patrick Zulu", service: "Orthodontics", status: "Confirmed" },
    ],
  },
  {
    id: "evelyn-sapuwa",
    name: "Evelyn Sapuwa",
    role: "Dental Therapist",
    branchId: "xroads-dental",
    availability: "Available",
    todayAppointments: 5,
    schedule: [
      { time: "10:00", patient: "Ruth Mbewe", service: "Cleaning", status: "Completed" },
      { time: "13:00", patient: "Brian Nkhoma", service: "Pediatric Dentistry", status: "Confirmed" },
    ],
  },
  {
    id: "naomi-mponda",
    name: "Naomi Mponda",
    role: "Orthodontic Dentist",
    branchId: "gateway-dental",
    availability: "Available",
    todayAppointments: 4,
    schedule: [
      { time: "12:00", patient: "Linda Chirwa", service: "Orthodontics", status: "Confirmed" },
      { time: "16:00", patient: "James Kaluwa", service: "Checkup", status: "Pending" },
    ],
  },
  {
    id: "thomasi-mukhaya",
    name: "Thomasi Mukhaya",
    role: "Finance & Dental Assistant",
    branchId: "xroads-dental",
    availability: "Off duty",
    todayAppointments: 2,
    schedule: [{ time: "09:30", patient: "Mercy Zimba", service: "Consultation", status: "Completed" }],
  },
];
