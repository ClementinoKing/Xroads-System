export type BranchId = string;

export type Branch = {
  id: BranchId;
  name: string;
  address: string;
  status: "Open" | "Closed";
  hours: string;
};

export const branches: Branch[] = [
  {
    id: "xroads-dental",
    name: "Xroads Dental",
    address: "Lilongwe, Malawi",
    status: "Open",
    hours: "Monday to Friday, 8AM - 6PM",
  },
  {
    id: "gateway-dental",
    name: "Gateway Dental",
    address: "Gateway Mall, Lilongwe",
    status: "Open",
    hours: "Monday to Friday, 8AM - 6PM",
  },
];
