import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { CalendarPlus, X } from "lucide-react";
import type { Patient } from "../../data/patients";
import type { Appointment } from "../../data/appointments";
import { branches } from "../../data/branches";
import { createAppointmentRecord, updateAppointmentRecord } from "../../features/appointments/appointments-service";
import { useAppointments } from "../../features/appointments/use-appointments";
import { useServices } from "../../features/services/use-services";
import { useDentists } from "../../features/dentists/use-dentists";
import { usePatients } from "../../features/patients/use-patients";
import { useAuth } from "../../features/auth/auth-context";
import { useBranchScope } from "../../features/auth/branch-scope";
import { DentistPickerPopover } from "./DentistPickerPopover";
import { PatientPickerPopover } from "../patients/PatientPickerPopover";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { DatePicker } from "../ui/date-picker";
import { useToast } from "../shared/ToastProvider";
import { getBranchBadgeClass } from "../../lib/branch-badges";
import {
  DURATION_OPTIONS_MINUTES,
  DEFAULT_WORKDAY_END,
  DEFAULT_WORKDAY_START,
  formatDurationLabel,
  getAppointmentDurationMinutes,
  minutesFromTime,
  roundToDurationStep,
  type AppointmentSeed,
  buildTimeSlots,
} from "./scheduler-utils";
import {
  findPreferredBookingService,
  getBookableServices,
  getCheckupEligibility,
  isCheckupService,
  isFrontDeskRole,
  isServiceAllowedForRole,
} from "../../features/appointments/booking-rules";

const timeSlots = buildTimeSlots(DEFAULT_WORKDAY_START, DEFAULT_WORKDAY_END);

type BookingForm = {
  patientId: string;
  serviceId: string;
  dentistId: string;
  date: string;
  time: string;
  durationMinutes: number;
  notes: string;
};

const initialForm: BookingForm = {
  patientId: "",
  serviceId: "",
  dentistId: "osman-wisk",
  date: format(new Date(), "yyyy-MM-dd"),
  time: "08:30",
  durationMinutes: 30,
  notes: "",
};

export type NewBookingInitialValues = AppointmentSeed;

export function NewBookingModal({
  open,
  onClose,
  onCreate,
  onUpdate,
  initialValues,
  appointment,
  mode = "create",
  appointments,
  appointmentsLoading,
  appointmentsError,
}: {
  open: boolean;
  onClose: () => void;
  onCreate?: (booking: Appointment) => void;
  onUpdate?: (booking: Appointment) => void;
  initialValues?: NewBookingInitialValues;
  appointment?: Appointment | null;
  mode?: "create" | "edit";
  appointments?: Appointment[];
  appointmentsLoading?: boolean;
  appointmentsError?: string | null;
}) {
  const { profile } = useAuth();
  const branchScope = useBranchScope();
  const [form, setForm] = useState<BookingForm>(buildForm(initialValues));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const { patients, isLoading: isPatientsLoading, error: patientsError, refetch: refetchPatients } = usePatients(open);
  const { services: allServices, isLoading: isServicesLoading, error: servicesError, refetch: refetchServices } = useServices();
  const { dentists: allDentists, isLoading: isDentistsLoading, error: dentistsError, refetch: refetchDentists } = useDentists(null, open);
  const shouldLoadAppointmentHistory = open && typeof appointments === "undefined";
  const {
    appointments: loadedAppointments,
    isLoading: isLoadedAppointmentsLoading,
    error: loadedAppointmentsError,
    refetch: refetchAppointmentHistory,
  } = useAppointments(shouldLoadAppointmentHistory);
  const appointmentFeed = useMemo(() => appointments ?? loadedAppointments, [appointments, loadedAppointments]);
  const activeServices = useMemo(() => allServices.filter((service) => service.active), [allServices]);
  const roleId = profile?.role_id ?? null;
  const isFrontDeskBooking = isFrontDeskRole(roleId);
  const canRetryAppointmentHistory = typeof appointments === "undefined";
  const appointmentHistoryLoading = typeof appointments === "undefined" ? isLoadedAppointmentsLoading : (appointmentsLoading ?? false);
  const appointmentHistoryError = typeof appointments === "undefined" ? loadedAppointmentsError : (appointmentsError ?? null);
  const selectableServices = useMemo(() => getBookableServices(activeServices, roleId), [activeServices, roleId]);
  const preferredService = useMemo(
    () => findPreferredBookingService(activeServices, roleId),
    [activeServices, roleId],
  );

  const accessiblePatients = useMemo(() => {
    const scopedPatients = branchScope.branchId ? patients.filter((patient) => patient.branchId === branchScope.branchId) : patients;
    return [...scopedPatients].sort((left, right) => left.name.localeCompare(right.name));
  }, [branchScope.branchId, patients]);

  const selectedPatient = useMemo(
    () => accessiblePatients.find((patient) => patient.id === form.patientId) ?? null,
    [accessiblePatients, form.patientId],
  );

  const initialDentistBranchId = useMemo(
    () => (initialValues?.dentistId ? allDentists.find((dentist) => dentist.id === initialValues.dentistId)?.branchId ?? null : null),
    [allDentists, initialValues?.dentistId],
  );
  const resolvedBranchId = selectedPatient?.branchId ?? branchScope.branchId ?? initialDentistBranchId ?? null;
  const branchDentists = useMemo(
    () => (resolvedBranchId ? allDentists.filter((dentist) => dentist.branchId === resolvedBranchId) : []),
    [allDentists, resolvedBranchId],
  );
  const selectedService = useMemo(
    () => selectableServices.find((service) => service.id === form.serviceId) ?? preferredService,
    [form.serviceId, preferredService, selectableServices],
  );
  const selectedDentist = useMemo(
    () => branchDentists.find((dentist) => dentist.id === form.dentistId) ?? null,
    [branchDentists, form.dentistId],
  );
  const checkupEligibility = useMemo(
    () =>
      getCheckupEligibility({
        appointments: appointmentFeed,
        patientId: selectedPatient?.id,
        scheduledDate: form.date,
        service: selectedService,
      }),
    [appointmentFeed, form.date, selectedPatient?.id, selectedService],
  );

  const dentistLocked = initialValues?.source === "slot" && Boolean(initialValues?.dentistId);
  const isEditing = mode === "edit" && Boolean(appointment);
  const durationMinutes = form.durationMinutes;
  const dentistAvailability = useMemo(() => {
    const map = new Map<string, { label: string; available: boolean }>();

    for (const dentist of branchDentists) {
      const slotConflict = appointmentFeed.some((appointment) => {
        if (appointment.dentistId !== dentist.id) return false;
        if (appointment.date !== form.date) return false;

        const appointmentStart = minutesFromTime(appointment.time);
        const appointmentEnd = appointmentStart + getAppointmentDurationMinutes(appointment);
        const slotStart = minutesFromTime(form.time);
        const slotEnd = slotStart + durationMinutes;

        return slotStart < appointmentEnd && slotEnd > appointmentStart;
      });

      if (dentist.availability === "Off duty") {
        map.set(dentist.id, { label: "Off duty", available: false });
        continue;
      }

      if (dentist.availability === "In consultation") {
        map.set(dentist.id, { label: "In consultation", available: false });
        continue;
      }

      if (slotConflict) {
        map.set(dentist.id, { label: "Busy", available: false });
        continue;
      }

      map.set(dentist.id, { label: "Available", available: true });
    }

    return map;
  }, [appointmentFeed, branchDentists, durationMinutes, form.date, form.time]);

  useEffect(() => {
    if (!open) return;
    setForm(buildForm(initialValues, appointment));
    setIsSubmitting(false);
  }, [appointment, initialValues, open]);

  useEffect(() => {
    if (!open || selectableServices.length === 0 || !preferredService) {
      return;
    }

    setForm((current) => {
      const currentService = selectableServices.find((service) => service.id === current.serviceId);
      if (currentService) {
        return current;
      }

      const fallbackService = preferredService;
      return {
        ...current,
        serviceId: fallbackService.id,
        durationMinutes: roundToDurationStep(fallbackService.duration),
      };
    });
  }, [open, preferredService, selectableServices]);

  useEffect(() => {
    if (!open) return;

    if (dentistLocked) {
      return;
    }

    if (!selectedPatient && !branchScope.branchId) {
      return;
    }

    if (branchDentists.length === 0) {
      return;
    }

    setForm((current) => {
      if (branchDentists.some((dentist) => dentist.id === current.dentistId)) {
        return current;
      }

      return { ...current, dentistId: branchDentists.find((dentist) => dentist.availability === "Available")?.id ?? branchDentists[0].id };
    });
  }, [branchScope.branchId, branchDentists, dentistLocked, open, selectedPatient]);

  if (!open) return null;

  function update<K extends keyof BookingForm>(key: K, value: BookingForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleServiceChange(serviceId: string) {
    const nextService = selectableServices.find((service) => service.id === serviceId) ?? null;
    setForm((current) => ({
      ...current,
      serviceId,
      durationMinutes: nextService ? roundToDurationStep(nextService.duration) : current.durationMinutes,
    }));
  }

  function applyPatient(patient: Patient) {
    setForm((current) => {
      const nextDentistId = dentistLocked
        ? current.dentistId
        : allDentists.find((dentist) => dentist.branchId === patient.branchId)?.id ?? current.dentistId;

      return {
        ...current,
        patientId: patient.id,
        dentistId: nextDentistId,
      };
    });
  }

  function handleClearPatient() {
    setForm((current) => ({
      ...current,
      patientId: "",
      dentistId: dentistLocked ? current.dentistId : "",
    }));
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPatient) {
      showToast({
        title: "Select a patient",
        description: "Choose a patient before creating the appointment.",
        variant: "error",
      });
      return;
    }

    if (!form.dentistId) {
      showToast({
        title: "Select a dentist",
        description: "Pick an available dentist before creating the appointment.",
        variant: "error",
      });
      return;
    }

    if (!selectedService) {
      showToast({
        title: "Select a service",
        description: "Choose a service before creating the appointment.",
        variant: "error",
      });
      return;
    }

    if (!isServiceAllowedForRole(selectedService, roleId)) {
      showToast({
        title: "Service not allowed",
        description: "Front desk can only book consultations and checkups.",
        variant: "error",
      });
      return;
    }

    const selectedAvailability = dentistAvailability.get(form.dentistId);
    if (selectedAvailability && !selectedAvailability.available) {
      showToast({
        title: "Dentist unavailable",
        description: "Choose an available dentist for the selected slot.",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);
    const result = isEditing && appointment
      ? await updateAppointmentRecord({
          appointmentCode: appointment.id,
          patientId: selectedPatient.id,
          dentistId: form.dentistId,
          serviceId: selectedService.id,
          date: form.date,
          time: form.time,
          durationMinutes,
          notes: form.notes.trim(),
        })
      : await createAppointmentRecord({
          patientId: selectedPatient.id,
          dentistId: form.dentistId,
          serviceId: selectedService.id,
          date: form.date,
          time: form.time,
          durationMinutes,
          notes: form.notes.trim(),
        });
    setIsSubmitting(false);

    if (!result.data) {
      showToast({
        title: "Could not create appointment",
        description: result.error ?? "Please try again.",
        variant: "error",
      });
      return;
    }

    const booking = result.data;
    if (isEditing) {
      onUpdate?.(booking);
    } else {
      onCreate?.(booking);
    }
    const complimentaryCheckup = isCheckupService(selectedService) && checkupEligibility.eligible;
    showToast({
      title: isEditing ? "Appointment updated" : "Appointment created",
      description: isEditing
        ? `${booking.patientName}'s appointment now starts at ${booking.time} with ${selectedService?.name ?? "the selected service"}.`
        : `${booking.patientName} is scheduled for ${selectedService?.name ?? "Appointment"} at ${booking.time} for ${formatDurationLabel(durationMinutes)}.${complimentaryCheckup ? " Complimentary six-month follow-up applies." : ""}`,
    });

    setForm(buildForm(initialValues, appointment));
    onClose();
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-xroads-50 p-2 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-200">
              <CalendarPlus size={20} />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{isEditing ? "Edit appointment" : "New appointment"}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isEditing ? "Update the patient, service, timing, or assigned dentist." : "Choose a patient, set the duration, and pick the slot."}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-11 w-11 rounded-xl p-0" onClick={onClose} aria-label="Close appointment modal">
            <X size={28} strokeWidth={2.2} />
          </Button>
        </div>

        <form onSubmit={submitBooking} className="flex flex-1 flex-col overflow-y-auto">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <label className="grid gap-1.5 sm:col-span-2">
              <span className="label">Patient</span>
              <PatientPickerPopover
                patients={accessiblePatients}
                value={selectedPatient}
                onSelect={applyPatient}
                onClear={handleClearPatient}
                placeholder="Search patients in your branch"
                isLoading={isPatientsLoading}
                error={patientsError}
                onRetry={refetchPatients}
              />
            </label>

            {selectedPatient ? (
              <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-950 dark:text-slate-50">{selectedPatient.name}</span>
                  <Badge className="bg-white text-slate-700 ring-slate-200 dark:bg-zinc-950 dark:text-slate-200 dark:ring-zinc-800">
                    {selectedPatient.patientCode ?? selectedPatient.id}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{selectedPatient.phone}</span>
                  <span>·</span>
                  <Badge className={`${getBranchBadgeClass(branches.find((branch) => branch.id === selectedPatient.branchId)?.name)} px-2 py-0.5 text-[10px] font-semibold`}>
                    {branches.find((branch) => branch.id === selectedPatient.branchId)?.name ?? "Branch"}
                  </Badge>
                  <span>·</span>
                  <span>{selectedPatient.paymentMethod}</span>
                </div>
              </div>
            ) : null}

            <Field label="Service">
              <select
                className="input"
                value={form.serviceId}
                onChange={(event) => handleServiceChange(event.target.value)}
                disabled={isServicesLoading && selectableServices.length === 0}
              >
                {selectableServices.length === 0 ? (
                  <option value="">{isServicesLoading ? "Loading services..." : isFrontDeskBooking ? "No front-desk services available" : "No active services available"}</option>
                ) : (
                  selectableServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))
                )}
              </select>
              {isCheckupService(selectedService) ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
                  {selectedPatient ? (
                    appointmentHistoryLoading ? (
                      <p className="text-slate-500 dark:text-slate-400">Checking whether this checkup qualifies for the six-month follow-up benefit.</p>
                    ) : appointmentHistoryError ? (
                      <div className="flex items-center justify-between gap-3 text-rose-600 dark:text-rose-300">
                        <span>We could not verify six-month follow-up eligibility right now.</span>
                        {canRetryAppointmentHistory ? (
                          <button type="button" className="font-semibold hover:underline" onClick={refetchAppointmentHistory}>
                            Retry
                          </button>
                        ) : null}
                      </div>
                    ) : checkupEligibility.eligible ? (
                      <p className="text-emerald-700 dark:text-emerald-300">
                        This checkup is free. The patient already has a qualifying appointment within the last six months.
                      </p>
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400">No qualifying appointment was found in the last six months, so this checkup does not qualify as free.</p>
                    )
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400">Select a patient to check whether the six-month free checkup rule applies.</p>
                  )}
                </div>
              ) : null}
              {!servicesError ? null : (
                <div className="flex items-center justify-between gap-3 text-xs text-rose-600 dark:text-rose-300">
                  <span>{servicesError}</span>
                  <button type="button" className="font-semibold hover:underline" onClick={refetchServices}>
                    Retry
                  </button>
                </div>
              )}
            </Field>

            <Field label="Duration">
              <select className="input" value={form.durationMinutes} onChange={(event) => update("durationMinutes", Number(event.target.value))}>
                {DURATION_OPTIONS_MINUTES.map((duration) => (
                  <option key={duration} value={duration}>
                    {formatDurationLabel(duration)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Date">
              <DatePicker value={form.date} onChange={(value) => update("date", value)} />
            </Field>

            <Field label="Time slot">
              <select className="input" value={form.time} onChange={(event) => update("time", event.target.value)}>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Dentist">
              {dentistLocked ? (
                <div className="grid gap-1.5">
                  <input
                    className="input bg-slate-50 text-slate-600 dark:bg-zinc-900 dark:text-slate-300"
                    value={selectedDentist?.name ?? "Selected slot"}
                    readOnly
                  />
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        dentistAvailability.get(form.dentistId)?.available
                          ? "border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-0 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-100"
                          : "border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-0 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300"
                      }
                    >
                      {dentistAvailability.get(form.dentistId)?.label ?? "Unavailable"}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Loaded from the selected slot</span>
                  </div>
                </div>
              ) : branchDentists.length > 0 && selectedPatient ? (
                <DentistPickerPopover
                  dentists={branchDentists}
                  appointments={appointmentFeed}
                  value={selectedDentist}
                  date={form.date}
                  time={form.time}
                  durationMinutes={durationMinutes}
                  onSelect={(dentist) => update("dentistId", dentist.id)}
                  placeholder={isDentistsLoading ? "Loading dentists..." : "Select a dentist in the patient's branch"}
                  disabled={isDentistsLoading}
                />
              ) : (
                <input
                  className="input bg-slate-50 text-slate-400 dark:bg-zinc-900 dark:text-slate-500"
                  value={selectedPatient ? (isDentistsLoading ? "Loading dentists..." : "No dentists found for this branch") : "Select a patient first"}
                  readOnly
                />
              )}
              {!dentistLocked && dentistsError ? (
                <div className="flex items-center justify-between gap-3 text-xs text-rose-600 dark:text-rose-300">
                  <span>{dentistsError}</span>
                  <button type="button" className="font-semibold hover:underline" onClick={refetchDentists}>
                    Retry
                  </button>
                </div>
              ) : null}
            </Field>

            <div className="sm:col-span-2 grid gap-1.5">
              <span className="label">Appointment notes</span>
              <textarea
                className="input min-h-24 py-3"
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Symptoms, preferences, referral notes"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 p-5 dark:border-neutral-800">
            <Button type="submit" className="w-full sm:w-auto" disabled={!selectedPatient || isSubmitting || isPatientsLoading || isDentistsLoading || selectableServices.length === 0}>
              {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create appointment"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function buildForm(initialValues?: AppointmentSeed, appointment?: Appointment | null): BookingForm {
  const source = appointment ?? null;
  const serviceId = source?.serviceId ?? initialValues?.serviceId ?? initialForm.serviceId;
  const durationMinutes = roundToDurationStep(source?.durationMinutes ?? initialValues?.durationMinutes ?? initialForm.durationMinutes);

  return {
    patientId: source?.patientId ?? initialValues?.patientId ?? "",
    serviceId,
    dentistId: source?.dentistId ?? initialValues?.dentistId ?? "",
    date: source?.date ?? initialValues?.date ?? initialForm.date,
    time: source?.time ?? initialValues?.time ?? initialForm.time,
    durationMinutes,
    notes: source?.notes ?? initialValues?.notes ?? initialForm.notes,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
