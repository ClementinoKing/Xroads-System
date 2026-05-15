import { useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { branches } from "../data/branches";
import { patients, type Patient } from "../data/patients";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DataTable, type DataTableColumn } from "../components/shared/DataTable";
import { FilterField } from "../components/shared/Filters";
import { AddPatientModal } from "../components/patients/AddPatientModal";
import { PatientDetailModal } from "../components/patients/PatientDetailModal";
import { CREATED_EVENTS } from "../lib/create-events";

type BranchFilter = "All" | string;

const patientColumns: Array<DataTableColumn<Patient>> = [
  {
    key: "patient",
    header: "Patient",
    cell: (patient) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-xroads-500 text-sm font-bold text-white">
          {patient.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-slate-950 dark:text-slate-50">{patient.name}</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{patient.id}</div>
        </div>
      </div>
    ),
  },
  {
    key: "contact",
    header: "Contact",
    cell: (patient) => (
      <>
        <div className="font-medium text-slate-700 dark:text-slate-200">{patient.phone}</div>
        <div className="mt-1 text-xs text-slate-400">{patient.email ?? "No email provided"}</div>
      </>
    ),
  },
  {
    key: "branch",
    header: "Branch",
    className: "text-slate-600 dark:text-slate-300",
    cell: (patient) => branches.find((item) => item.id === patient.branchId)?.name ?? "Branch",
  },
  {
    key: "lastVisit",
    header: "Last visit",
    className: "text-slate-600 dark:text-slate-300",
    cell: (patient) => patient.lastVisit,
  },
  {
    key: "nextAppointment",
    header: "Next appointment",
    className: "text-slate-600 dark:text-slate-300",
    cell: (patient) => patient.nextAppointment,
  },
  {
    key: "payment",
    header: "Payment",
    cell: (patient) => (
      <Badge className="bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-700">
        {patient.schemeName ?? patient.paymentMethod}
      </Badge>
    ),
  },
];

export function PatientsPage() {
  const [patientList, setPatientList] = useState<Patient[]>(patients);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState<BranchFilter>("All");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patientList.filter((patient) => {
      const branchMatch = branch === "All" || patient.branchId === branch;
      const queryMatch =
        !query ||
        [patient.name, patient.phone, patient.email ?? "", patient.paymentMethod, patient.schemeName ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return branchMatch && queryMatch;
    });
  }, [branch, patientList, search]);

  const selectedPatient = useMemo(
    () => filteredPatients.find((patient) => patient.id === selectedPatientId) ?? null,
    [filteredPatients, selectedPatientId],
  );
  const hasActiveFilters = search.trim() !== "" || branch !== "All";

  function clearFilters() {
    setSearch("");
    setBranch("All");
  }

  function createPatient(patient: Patient) {
    setPatientList((current) => [patient, ...current]);
  }

  useEffect(() => {
    const handleCreated = (event: Event) => {
      const customEvent = event as CustomEvent<Patient>;
      if (!customEvent.detail?.id) return;
      setPatientList((current) =>
        current.some((item) => item.id === customEvent.detail.id) ? current : [customEvent.detail, ...current],
      );
    };

    window.addEventListener(CREATED_EVENTS.patient, handleCreated);
    return () => window.removeEventListener(CREATED_EVENTS.patient, handleCreated);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search patients, review upcoming appointments, and payment preference.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={18} />
          Create patient
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4 bg-slate-50/70 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-xroads-700 ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-xroads-300 dark:ring-zinc-800">
                <SlidersHorizontal size={18} />
              </div>
              <div>
                <CardTitle>Search & filters</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {filteredPatients.length} of {patientList.length} patients shown
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" className="h-10 w-full px-3 lg:w-auto" onClick={clearFilters} disabled={!hasActiveFilters}>
              <RotateCcw size={16} />
              Reset
            </Button>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <FilterField label="Search" className="lg:flex-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={19} />
                <input
                  className="input h-12 pl-11 text-base lg:min-w-[420px]"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search patient name, phone, email, or scheme"
                />
              </div>
            </FilterField>
            <FilterField label="Branch" className="lg:w-[280px]">
              <select className="input h-12 text-base lg:w-[280px]" value={branch} onChange={(event) => setBranch(event.target.value)}>
                <option value="All">All branches</option>
                {branches.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            rows={filteredPatients}
            columns={patientColumns}
            getRowKey={(patient) => patient.id}
            minWidth="980px"
            emptyTitle="No patients found"
            emptyDescription="Try a different search term or branch filter."
            onRowClick={(patient) => setSelectedPatientId(patient.id)}
          />
        </CardContent>
      </Card>

      <AddPatientModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createPatient} />
      <PatientDetailModal open={Boolean(selectedPatient)} patient={selectedPatient} onClose={() => setSelectedPatientId(null)} />
    </div>
  );
}
