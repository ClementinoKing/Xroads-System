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
import type { Dentist } from "../../data/dentists";
import type { Appointment } from "../../data/appointments";
import type { Branch } from "../../data/branches";
import type { DentalService } from "../../data/services";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
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
      [CREATE_EVENTS.booking]: () => setBookingOpen(true),
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

    window.addEventListener(CREATE_EVENTS.booking, handleCreateRequest);
    window.addEventListener(CREATE_EVENTS.patient, handleCreateRequest);
    window.addEventListener(CREATE_EVENTS.dentist, handleCreateRequest);
    window.addEventListener(CREATE_EVENTS.branch, handleCreateRequest);
    window.addEventListener(CREATE_EVENTS.service, handleCreateRequest);

    return () => {
      window.removeEventListener(CREATE_EVENTS.booking, handleCreateRequest);
      window.removeEventListener(CREATE_EVENTS.patient, handleCreateRequest);
      window.removeEventListener(CREATE_EVENTS.dentist, handleCreateRequest);
      window.removeEventListener(CREATE_EVENTS.branch, handleCreateRequest);
      window.removeEventListener(CREATE_EVENTS.service, handleCreateRequest);
    };
  }, []);

  function handlePatientCreated(patient: Patient) {
    window.dispatchEvent(new CustomEvent(CREATED_EVENTS.patient, { detail: patient }));
  }

  function handleDentistCreated(dentist: Dentist) {
    window.dispatchEvent(new CustomEvent(CREATED_EVENTS.dentist, { detail: dentist }));
  }

  function handleBookingCreated(booking: Appointment) {
    window.dispatchEvent(new CustomEvent(CREATED_EVENTS.booking, { detail: booking }));
  }

  function handleBranchCreated(branch: Branch) {
    window.dispatchEvent(new CustomEvent(CREATED_EVENTS.branch, { detail: branch }));
  }

  function handleServiceCreated(service: DentalService) {
    window.dispatchEvent(new CustomEvent(CREATED_EVENTS.service, { detail: service }));
  }

  return (
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
      <NewBookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} onCreate={handleBookingCreated} />
      <AddPatientModal
        open={patientOpen}
        onClose={() => setPatientOpen(false)}
        onCreate={(patient) => handlePatientCreated(patient)}
      />
      <AddDentistModal
        open={dentistOpen}
        onClose={() => setDentistOpen(false)}
        onCreate={(dentist) => handleDentistCreated(dentist)}
      />
      <AddBranchModal open={branchOpen} onClose={() => setBranchOpen(false)} onCreate={handleBranchCreated} />
      <AddServiceModal open={serviceOpen} onClose={() => setServiceOpen(false)} onCreate={handleServiceCreated} />
    </div>
  );
}
