export type DentalDentitionType = "permanent" | "primary" | "mixed";

export type ToothSurfaceCode = "Mesial" | "Distal" | "Buccal" | "Lingual" | "Occlusal" | "Incisal";

export type ToothCondition =
  | "Healthy"
  | "Caries"
  | "Filled"
  | "Crown"
  | "Missing"
  | "Extraction planned"
  | "Root canal"
  | "Fracture"
  | "Observation";

export type SurfaceNote = {
  surfaceCode: ToothSurfaceCode;
  note: string;
};

export type DentalChartTooth = {
  toothCode: string;
  condition: ToothCondition;
  plannedTreatment: string;
  completedTreatment: string;
  surfaceNotes: SurfaceNote[];
};

export type DentalChartSession = {
  id: string;
  chartCode: string;
  patientId: string;
  patientCode: string;
  branchId: string;
  appointmentCode: string | null;
  dentitionType: DentalDentitionType;
  recordedBy: string;
  recorderName: string;
  createdAt: string;
  updatedAt: string;
};

export type DentalChartSessionDetail = DentalChartSession & {
  teeth: DentalChartTooth[];
};

export const DENTITION_OPTIONS: Array<{ value: DentalDentitionType; label: string }> = [
  { value: "permanent", label: "Permanent" },
  { value: "primary", label: "Primary" },
  { value: "mixed", label: "Mixed" },
];

export const TOOTH_CONDITIONS: ToothCondition[] = [
  "Healthy",
  "Caries",
  "Filled",
  "Crown",
  "Missing",
  "Extraction planned",
  "Root canal",
  "Fracture",
  "Observation",
];

export const SURFACE_OPTIONS: Array<{ value: ToothSurfaceCode; label: string }> = [
  { value: "Mesial", label: "Mesial" },
  { value: "Distal", label: "Distal" },
  { value: "Buccal", label: "Buccal" },
  { value: "Lingual", label: "Lingual" },
  { value: "Occlusal", label: "Occlusal" },
  { value: "Incisal", label: "Incisal" },
];

export const PERMANENT_ODONTOGRAM = [
  ["18", "17", "16", "15", "14", "13", "12", "11"],
  ["21", "22", "23", "24", "25", "26", "27", "28"],
  ["38", "37", "36", "35", "34", "33", "32", "31"],
  ["41", "42", "43", "44", "45", "46", "47", "48"],
];

export const PRIMARY_ODONTOGRAM = [
  ["55", "54", "53", "52", "51"],
  ["61", "62", "63", "64", "65"],
  ["85", "84", "83", "82", "81"],
  ["71", "72", "73", "74", "75"],
];

