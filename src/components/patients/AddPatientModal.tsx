import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, UserPlus, X } from "lucide-react";
import type { Patient } from "../../data/patients";
import { Button } from "../ui/Button";
import { useToast } from "../shared/ToastProvider";
import { PatientFormFields } from "./PatientFormFields";
import { createPatientRecord, type PatientFormValues, updatePatientRecord } from "../../features/patients/patients-service";
import { useMedicalSchemes } from "../../features/patients/use-medical-schemes";
import { useBranchScope } from "../../features/auth/branch-scope";

const initialForm: PatientFormValues = {
  name: "",
  phone: "",
  email: "",
  branchId: "xroads-dental",
  paymentMethod: "Cash",
  medicalSchemeId: "",
  schemeName: "",
  nextAppointment: "No upcoming",
};

export function AddPatientModal({
  open,
  patient,
  onClose,
  onSaved,
}: {
  open: boolean;
  patient?: Patient | null;
  onClose: () => void;
  onSaved: (patient: Patient) => void;
}) {
  const [form, setForm] = useState<PatientFormValues>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const { schemes, isLoading: isMedicalSchemesLoading, error: medicalSchemesError, refetch: refetchMedicalSchemes } = useMedicalSchemes();
  const branchScope = useBranchScope();

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      patient
        ? {
            name: patient.name,
            phone: patient.phone,
            email: patient.email ?? "",
            branchId: branchScope.branchId ?? patient.branchId,
            paymentMethod: patient.paymentMethod,
            medicalSchemeId: "",
            schemeName: patient.schemeName ?? "",
            nextAppointment: patient.nextAppointment,
          }
        : {
            ...initialForm,
            branchId: branchScope.branchId ?? initialForm.branchId,
          },
    );
  }, [branchScope.branchId, open, patient]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  function update<K extends keyof PatientFormValues>(key: K, value: PatientFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = patient ? await updatePatientRecord(patient.id, form) : await createPatientRecord(form);

      if (result.error || !result.data) {
        showToast({
          title: patient ? "Patient could not be updated" : "Patient could not be created",
          description: result.error ?? "An unknown error occurred while saving the patient.",
          variant: "error",
        });
        return;
      }

      onSaved(result.data);
      showToast({
        title: patient ? "Patient updated" : "Patient created",
        description: patient ? `${result.data.name} has been updated.` : `${result.data.name} has been added to the patient directory.`,
        variant: "success",
      });
      setForm({
        ...initialForm,
        branchId: branchScope.branchId ?? initialForm.branchId,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-xroads-50 p-2 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-200">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{patient ? "Edit patient" : "Create patient"}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {patient ? "Update the patient profile in the directory." : "Add a patient profile to the local directory."}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-11 rounded-xl p-0"
            onClick={onClose}
            aria-label={patient ? "Close edit patient modal" : "Close create patient modal"}
          >
            <X size={28} strokeWidth={2.2} />
          </Button>
        </div>

        <form onSubmit={submitPatient} className="flex flex-1 flex-col overflow-y-auto">
          <div className="p-5">
            <PatientFormFields
              form={form}
              update={update}
              medicalSchemes={schemes}
              isMedicalSchemesLoading={isMedicalSchemesLoading}
              medicalSchemesError={medicalSchemesError}
              onRetryMedicalSchemes={refetchMedicalSchemes}
              branchOptions={branchScope.branchOptions}
              branchLocked={branchScope.isBranchLocked}
              branchLabel={branchScope.branchLabel}
            />
          </div>
          <div className="border-t border-slate-100 p-5 dark:border-neutral-800">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  {patient ? "Updating" : "Saving"}
                </>
              ) : (
                patient ? "Update patient" : "Create patient"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
