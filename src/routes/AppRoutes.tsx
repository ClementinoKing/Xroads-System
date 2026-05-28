import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { CalendarPage } from "../pages/CalendarPage";
import { AppointmentsPage } from "../pages/AppointmentsPage";
import { PatientsPage } from "../pages/PatientsPage";
import { DentistsPage } from "../pages/DentistsPage";
import { BranchesPage } from "../pages/BranchesPage";
import { ServicesPage } from "../pages/ServicesPage";
import { ReportsPage } from "../pages/ReportsPage";
import { UsersPage } from "../pages/UsersPage";
import { RolesPage } from "../pages/RolesPage";
import { UserProfilePage } from "../pages/UserProfilePage";
import { SettingsPage } from "../pages/SettingsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { PublicOnlyRoute, RequireAuth } from "../features/auth/route-guards";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<LoginPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/dentists" element={<DentistsPage />} />
          <Route path="/branches" element={<BranchesPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:userId" element={<UserProfilePage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
