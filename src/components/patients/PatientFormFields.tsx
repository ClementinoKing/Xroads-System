import type { Patient } from "../../data/patients";
import type { Branch } from "../../data/branches";
import type { PatientFormValues } from "../../features/patients/patients-service";
import { MedicalSchemePopover } from "./MedicalSchemePopover";
import type { MedicalSchemeOption } from "../../features/patients/medical-schemes-service";
import type { ReactNode } from "react";

type PatientFormFieldProps = {
  form: PatientFormValues;
  update: <K extends keyof PatientFormValues>(key: K, value: PatientFormValues[K]) => void;
  medicalSchemes: MedicalSchemeOption[];
  isMedicalSchemesLoading: boolean;
  medicalSchemesError: string | null;
  onRetryMedicalSchemes: () => void;
  branchOptions: Branch[];
  branchLocked: boolean;
  branchLabel: string | null;
};

export function PatientFormFields({
  form,
  update,
  medicalSchemes,
  isMedicalSchemesLoading,
  medicalSchemesError,
  onRetryMedicalSchemes,
  branchOptions,
  branchLocked,
  branchLabel,
}: PatientFormFieldProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Patient name">
        <input className="input" required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Enter full name" />
      </Field>
      <Field label="Phone number">
        <input className="input" required value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+265 ..." />
      </Field>
      <Field label="Email optional">
        <input className="input" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="patient@email.com" />
      </Field>
      <Field label="Branch">
        {branchLocked ? (
          <input className="input bg-slate-50 text-slate-600 dark:bg-zinc-900 dark:text-slate-300" value={branchLabel ?? form.branchId} readOnly />
        ) : (
          <select className="input" value={form.branchId} onChange={(event) => update("branchId", event.target.value as Patient["branchId"])}>
            {branchOptions.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Payment method">
        <select
          className="input"
          value={form.paymentMethod}
          onChange={(event) => {
            const paymentMethod = event.target.value as Patient["paymentMethod"];
            update("paymentMethod", paymentMethod);

            if (paymentMethod === "Cash") {
              update("medicalSchemeId", "");
              update("schemeName", "");
            }
          }}
        >
          <option>Cash</option>
          <option>Medical Scheme</option>
        </select>
      </Field>
      <Field label="Medical scheme">
        <MedicalSchemePopover
          form={form}
          update={update}
          schemes={medicalSchemes}
          isLoading={isMedicalSchemesLoading}
          error={medicalSchemesError}
          onRetry={onRetryMedicalSchemes}
        />
      </Field>
      <Field label="Next appointment">
        <input className="input" value={form.nextAppointment} onChange={(event) => update("nextAppointment", event.target.value)} placeholder="No upcoming" />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
