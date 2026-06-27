export type ServiceCategoryRecord = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServiceSectionRecord = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServicePriceListRecord = {
  id: string;
  name: string;
  description: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  currencyCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServicePriceRecord = {
  id: string;
  serviceId: string;
  priceListId: string;
  priceListName: string;
  currencyCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  amount: number;
  pricingUnit: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DentalService = {
  id: string;
  serviceCode: string;
  name: string;
  duration: number;
  defaultDurationMinutes: number;
  category: string;
  categoryId: string;
  sectionId: string | null;
  sectionName: string | null;
  sortOrder: number;
  active: boolean;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  prices: ServicePriceRecord[];
};

export type ServiceCatalog = {
  services: DentalService[];
  categories: ServiceCategoryRecord[];
  sections: ServiceSectionRecord[];
  priceLists: ServicePriceListRecord[];
};

export const services: DentalService[] = [
  {
    id: "consultation",
    serviceCode: "consultation",
    name: "Consultation",
    duration: 30,
    defaultDurationMinutes: 30,
    category: "General",
    categoryId: "general",
    sectionId: null,
    sectionName: null,
    sortOrder: 0,
    active: true,
    description: "Initial assessment and care planning.",
    metadata: {},
    createdAt: "",
    updatedAt: "",
    prices: [],
  },
  {
    id: "cleaning",
    serviceCode: "cleaning",
    name: "Cleaning",
    duration: 45,
    defaultDurationMinutes: 45,
    category: "Preventive",
    categoryId: "preventive",
    sectionId: null,
    sectionName: null,
    sortOrder: 0,
    active: true,
    description: "Professional scaling and polish.",
    metadata: {},
    createdAt: "",
    updatedAt: "",
    prices: [],
  },
  {
    id: "checkup",
    serviceCode: "checkup",
    name: "Checkup",
    duration: 30,
    defaultDurationMinutes: 30,
    category: "Preventive",
    categoryId: "preventive",
    sectionId: null,
    sectionName: null,
    sortOrder: 0,
    active: true,
    description: "Routine oral health review.",
    metadata: {},
    createdAt: "",
    updatedAt: "",
    prices: [],
  },
  {
    id: "emergency",
    serviceCode: "emergency",
    name: "Emergency",
    duration: 60,
    defaultDurationMinutes: 60,
    category: "Emergency",
    categoryId: "emergency",
    sectionId: null,
    sectionName: null,
    sortOrder: 0,
    active: true,
    description: "Urgent pain, trauma, or swelling support.",
    metadata: {},
    createdAt: "",
    updatedAt: "",
    prices: [],
  },
];
