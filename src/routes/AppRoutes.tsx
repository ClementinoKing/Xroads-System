import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { CalendarPage } from "../pages/CalendarPage";
import { BookingPage } from "../pages/BookingPage";
import { PatientsPage } from "../pages/PatientsPage";
import { DentistsPage } from "../pages/DentistsPage";
import { BranchesPage } from "../pages/BranchesPage";
import { ServicesPage } from "../pages/ServicesPage";
import { ReportsPage } from "../pages/ReportsPage";
import { UsersPage } from "../pages/UsersPage";
import { SettingsPage } from "../pages/SettingsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/dentists" element={<DentistsPage />} />
        <Route path="/branches" element={<BranchesPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
