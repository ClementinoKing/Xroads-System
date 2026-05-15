export type ServiceCategory = "General" | "Cosmetic" | "Emergency" | "Orthodontics" | "Pediatric" | "Preventive";

export type DentalService = {
  id: string;
  name: string;
  duration: number;
  category: ServiceCategory;
  active: boolean;
  description: string;
};

export const services: DentalService[] = [
  { id: "consultation", name: "Consultation", duration: 30, category: "General", active: true, description: "Initial assessment and care planning." },
  { id: "cleaning", name: "Cleaning", duration: 45, category: "Preventive", active: true, description: "Professional scaling and polish." },
  { id: "checkup", name: "Checkup", duration: 30, category: "Preventive", active: true, description: "Routine oral health review." },
  { id: "emergency", name: "Emergency", duration: 60, category: "Emergency", active: true, description: "Urgent pain, trauma, or swelling support." },
  { id: "general-dentistry", name: "General Dentistry", duration: 45, category: "General", active: true, description: "Everyday dental treatment and care." },
  { id: "cosmetic-dentistry", name: "Cosmetic Dentistry", duration: 60, category: "Cosmetic", active: true, description: "Smile design and appearance-focused care." },
  { id: "orthodontics", name: "Orthodontics", duration: 60, category: "Orthodontics", active: true, description: "Alignment reviews and treatment follow-ups." },
  { id: "pediatric-dentistry", name: "Pediatric Dentistry", duration: 45, category: "Pediatric", active: true, description: "Child-friendly dental care." },
  { id: "restorative-dentistry", name: "Restorative Dentistry", duration: 60, category: "General", active: false, description: "Fillings, crowns, and repair treatment." },
];
