import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { cn } from "../../lib/utils";
import { AddPatientModal } from "../patients/AddPatientModal";
import { AddDentistModal } from "../dentists/AddDentistModal";
import { NewBookingModal } from "../appointments/NewBookingModal";
import { AddBranchModal } from "../branches/AddBranchModal";
import { AddServiceModal } from "../services/AddServiceModal";
import { CREATE_EVENTS, CREATED_EVENTS } from "../../lib/create-events";
import type { Patient } from "../../data/patients";
import type { Appointment } from "../../data/appointments";
import type { Branch } from "../../data/branches";
import type { DentalService } from "../../data/services";
import type { StaffUser } from "../../features/staff/staff-directory-service";
import { BranchScopeProvider } from "../../features/auth/branch-scope";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);
  const [dentistOpen, setDentistOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const location = useLocation();

  function handleMenuClick() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarCollapsed((current) => !current);
      return;
    }

    setSidebarOpen((current) => !current);
  }

  useEffect(() => {
    const openHandlers: Record<string, () => void> = {
      [CREATE_EVENTS.appointment]: () => setAppointmentOpen(true),
      [CREATE_EVENTS.patient]: () => setPatientOpen(true),
      [CREATE_EVENTS.dentist]: () => setDentistOpen(true),
      [CREATE_EVENTS.branch]: () => setBranchOpen(true),
      [CREATE_EVENTS.service]: () => setServiceOpen(true),
    };

    const handleCreateRequest = (event: Event) => {
      const customEvent = event as CustomEvent;
      const handler = openHandlers[customEvent.type];
      handler?.();
    };

    window.addEventListener(CREATE_EVENTS.appointment, handleCreateRequest);
    window.addEventListener(CREATE_EVENTS.patient, handleCreateRequest);
    window.addEventListener(CREATE_EVENTS.dentist, handleCreateRequest);
    window.addEventListener(CREATE_EVENTS.branch, handleCreateRequest);
    window.addEventListener(CREATE_EVENTS.service, handleCreateRequest);

    return () => {
      window.removeEventListener(CREATE_EVENTS.appointment, handleCreateRequest);
      window.removeEventListener(CREATE_EVENTS.patient, handleCreateRequest);
      window.removeEventListener(CREATE_EVENTS.dentist, handleCreateRequest);
      window.removeEventListener(CREATE_EVENTS.branch, handleCreateRequest);
      window.removeEventListener(CREATE_EVENTS.service, handleCreateRequest);
    };
  }, []);

  function handlePatientCreated(patient: Patient) {
    window.dispatchEvent(new CustomEvent(CREATED_EVENTS.patient, { detail: patient }));
  }

  function handleDentistCreated(dentist: StaffUser) {
    window.dispatchEvent(new CustomEvent(CREATED_EVENTS.dentist, { detail: dentist }));
  }

  function handleAppointmentCreated(appointment: Appointment) {
    window.dispatchEvent(new CustomEvent(CREATED_EVENTS.appointment, { detail: appointment }));
  }

  function handleBranchCreated(branch: Branch) {
    window.dispatchEvent(new CustomEvent(CREATED_EVENTS.branch, { detail: branch }));
  }

  function handleServiceCreated(service: DentalService) {
    window.dispatchEvent(new CustomEvent(CREATED_EVENTS.service, { detail: service }));
  }

  return (
    <BranchScopeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-20 w-full items-center px-4 sm:px-6 lg:px-8">
            <TopBar key={location.pathname} onMenuClick={handleMenuClick} />
          </div>
        </header>
        <Sidebar open={sidebarOpen} collapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} />
        <main className={cn("px-4 py-6 transition-[padding] sm:px-6 lg:px-8", sidebarCollapsed ? "lg:pl-28" : "lg:pl-80")}>
          <Outlet />
        </main>
        <NewBookingModal open={appointmentOpen} onClose={() => setAppointmentOpen(false)} onCreate={handleAppointmentCreated} />
        <AddPatientModal
          open={patientOpen}
          onClose={() => setPatientOpen(false)}
          onSaved={(patient) => handlePatientCreated(patient)}
        />
        <AddDentistModal
          open={dentistOpen}
          onClose={() => setDentistOpen(false)}
          onCreate={(dentist) => handleDentistCreated(dentist)}
        />
        <AddBranchModal open={branchOpen} onClose={() => setBranchOpen(false)} onCreate={handleBranchCreated} />
        <AddServiceModal open={serviceOpen} onClose={() => setServiceOpen(false)} onSaved={(service) => handleServiceCreated(service)} />
      </div>
    </BranchScopeProvider>
  );
}
