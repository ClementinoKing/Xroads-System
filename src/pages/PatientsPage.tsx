import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleAlert, PenSquare, Plus, RotateCcw, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { branches } from "../data/branches";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DataTable } from "../components/shared/DataTable";
import { FilterField } from "../components/shared/Filters";
import { AddPatientModal } from "../components/patients/AddPatientModal";
import { ConfirmDeletePatientModal } from "../components/patients/ConfirmDeletePatientModal";
import { PatientDetailModal } from "../components/patients/PatientDetailModal";
import { IconButton } from "../components/ui/IconButton";
import { usePatients } from "../features/patients/use-patients";
import { deletePatientRecord } from "../features/patients/patients-service";
import type { Patient } from "../data/patients";
import { getFriendlyPalette } from "../lib/color-palettes";

type BranchFilter = "All" | string;

export function PatientsPage() {
  const navigate = useNavigate();
  const { patients, isLoading, error, refetch } = usePatients();
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState<BranchFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patients.filter((patient) => {
      const branchMatch = branch === "All" || patient.branchId === branch;
      const queryMatch =
        !query ||
        [patient.patientCode ?? "", patient.name, patient.phone, patient.email ?? "", patient.paymentMethod, patient.schemeName ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return branchMatch && queryMatch;
    });
  }, [branch, patients, search]);

  const selectedPatient = useMemo(
    () => filteredPatients.find((patient) => patient.id === selectedPatientId) ?? null,
    [filteredPatients, selectedPatientId],
  );
  const hasActiveFilters = search.trim() !== "" || branch !== "All";

  useEffect(() => {
    setPage(1);
  }, [search, branch]);

  function clearFilters() {
    setSearch("");
    setBranch("All");
  }

  async function handleDeletePatient() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deletePatientRecord(deleteTarget.id);

      if (result.error || !result.data) {
        return;
      }

      if (selectedPatientId === deleteTarget.id) {
        setSelectedPatientId(null);
      }
      setDeleteTarget(null);
      refetch();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search patients, review upcoming appointments, and payment preference.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
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
                  {filteredPatients.length} of {patients.length} patients shown
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
          {isLoading ? (
            <PatientsTableSkeleton />
          ) : error ? (
            <PatientsErrorState message={error} onRetry={refetch} />
          ) : (
            <DataTable
              rows={filteredPatients}
              columns={[
                {
                  key: "patient",
                  header: "Patient",
                  cell: (patient) => (
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${getFriendlyPalette(patient.id).avatar}`}>
                        {patient.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-950 dark:text-slate-50">{patient.name}</div>
                        <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{patient.patientCode ?? patient.id}</div>
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
                {
                  key: "actions",
                  header: "Actions",
                  className: "w-40",
                  cell: (patient) => (
                    <div className="flex flex-wrap gap-2">
                      <IconButton icon={<PenSquare size={18} />} label={`Edit ${patient.name}`} onClick={() => setEditTarget(patient)} />
                      <IconButton icon={<Trash2 size={18} />} label={`Delete ${patient.name}`} onClick={() => setDeleteTarget(patient)} />
                    </div>
                  ),
                },
              ]}
              getRowKey={(patient) => patient.id}
              minWidth="980px"
              emptyTitle="No patients found"
              emptyDescription="Try a different search term or branch filter."
              onRowClick={(patient) => setSelectedPatientId(patient.id)}
              pagination={{
                page,
                pageSize,
                onPageChange: setPage,
                onPageSizeChange: (nextPageSize) => {
                  setPageSize(nextPageSize);
                  setPage(1);
                },
                pageSizeOptions: [10, 20, 50],
                itemLabel: "patients",
              }}
            />
          )}
        </CardContent>
      </Card>

      <AddPatientModal
        open={createOpen || editTarget !== null}
        patient={editTarget}
        onClose={() => {
          setCreateOpen(false);
          setEditTarget(null);
        }}
        onSaved={() => {
          void refetch();
        }}
      />
      <ConfirmDeletePatientModal
        open={deleteTarget !== null}
        patient={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleDeletePatient();
        }}
      />
      <PatientDetailModal
        open={Boolean(selectedPatient)}
        patient={selectedPatient}
        onClose={() => setSelectedPatientId(null)}
        onOpenDentalChart={(patient) => {
          setSelectedPatientId(null);
          navigate(`/dental-chart?patientId=${encodeURIComponent(patient.id)}`);
        }}
      />
    </div>
  );
}

function PatientsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-rose-50 p-3 text-rose-700 dark:bg-zinc-900 dark:text-rose-300">
        <CircleAlert size={22} />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">Patients could not be loaded</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      </div>
      <Button type="button" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function PatientsTableSkeleton() {
  return (
    <div className="space-y-0">
      <div className="grid grid-cols-[1.4fr_0.95fr_0.8fr_0.8fr_0.8fr_0.7fr] border-b border-slate-100 px-5 py-3 text-xs uppercase text-slate-400 dark:border-zinc-800 dark:text-slate-500">
        <span>Patient</span>
        <span>Contact</span>
        <span>Branch</span>
        <span>Last visit</span>
        <span>Next appointment</span>
        <span>Payment</span>
      </div>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="grid animate-pulse grid-cols-[1.4fr_0.95fr_0.8fr_0.8fr_0.8fr_0.7fr] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-zinc-800" />
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-slate-100 dark:bg-zinc-800" />
              <div className="h-3 w-24 rounded bg-slate-100 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-slate-100 dark:bg-zinc-800" />
            <div className="h-3 w-24 rounded bg-slate-100 dark:bg-zinc-800" />
          </div>
          <div className="h-4 w-24 rounded bg-slate-100 dark:bg-zinc-800" />
          <div className="h-4 w-24 rounded bg-slate-100 dark:bg-zinc-800" />
          <div className="h-4 w-28 rounded bg-slate-100 dark:bg-zinc-800" />
          <div className="h-8 w-24 rounded-full bg-slate-100 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}
