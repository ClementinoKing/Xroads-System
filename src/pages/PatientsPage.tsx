import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { branches } from "../data/branches";
import { patients } from "../data/patients";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { FilterField } from "../components/shared/Filters";
import { EmptyState } from "../components/shared/EmptyState";

export function PatientsPage() {
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("All");
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id);

  const filteredPatients = useMemo(
    () => patients.filter((patient) => {
      const query = search.toLowerCase();
      return (branch === "All" || patient.branchId === branch) && [patient.name, patient.phone, patient.email ?? ""].some((value) => value.toLowerCase().includes(query));
    }),
    [branch, search],
  );
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? filteredPatients[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Patients</h1>
        <p className="mt-1 text-sm text-slate-500">Search patients, review upcoming appointments, and payment preference.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader className="grid gap-4 md:grid-cols-[1fr_220px]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input className="input pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient name, phone, email" />
            </label>
            <FilterField label="Branch">
              <select className="input" value={branch} onChange={(event) => setBranch(event.target.value)}>
                <option>All</option>
                {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </FilterField>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {filteredPatients.length ? (
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Last visit</th>
                    <th className="px-5 py-3">Next appointment</th>
                    <th className="px-5 py-3">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="cursor-pointer hover:bg-xroads-50/40" onClick={() => setSelectedPatientId(patient.id)}>
                      <td className="px-5 py-4 font-semibold text-slate-950">{patient.name}</td>
                      <td className="px-5 py-4 text-slate-600">{patient.phone}</td>
                      <td className="px-5 py-4 text-slate-600">{patient.lastVisit}</td>
                      <td className="px-5 py-4 text-slate-600">{patient.nextAppointment}</td>
                      <td className="px-5 py-4"><Badge className="bg-slate-100 text-slate-700 ring-slate-200">{patient.schemeName ?? patient.paymentMethod}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="p-5"><EmptyState title="No patients found" description="Try a different search term or branch filter." /></div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Patient preview</CardTitle></CardHeader>
          <CardContent>
            {selectedPatient ? (
              <div className="space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-xroads-500 text-xl font-bold text-white">{selectedPatient.name.slice(0, 2).toUpperCase()}</div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{selectedPatient.name}</h2>
                  <p className="text-sm text-slate-500">{selectedPatient.phone}</p>
                </div>
                <Preview label="Branch" value={branches.find((item) => item.id === selectedPatient.branchId)?.name ?? ""} />
                <Preview label="Last visit" value={selectedPatient.lastVisit} />
                <Preview label="Next appointment" value={selectedPatient.nextAppointment} />
                <Preview label="Payment" value={selectedPatient.schemeName ?? selectedPatient.paymentMethod} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-950">{value}</p></div>;
}
