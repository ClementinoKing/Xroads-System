import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PublicOnlyRoute, RequireAdminAccess, RequireAuth } from "../features/auth/route-guards";
import { RequirePasswordChange } from "../features/auth/require-password-change";
import { PageLoader } from "../components/shared/PageLoader";

const AppLayout = lazy(() => import("../components/layout/AppLayout").then((module) => ({ default: module.AppLayout })));
const LoginPage = lazy(() => import("../pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import("../pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const CalendarPage = lazy(() => import("../pages/CalendarPage").then((module) => ({ default: module.CalendarPage })));
const AppointmentsPage = lazy(() => import("../pages/AppointmentsPage").then((module) => ({ default: module.AppointmentsPage })));
const CheckInsPage = lazy(() => import("../pages/CheckInsPage").then((module) => ({ default: module.CheckInsPage })));
const PatientsPage = lazy(() => import("../pages/PatientsPage").then((module) => ({ default: module.PatientsPage })));
const DentistsPage = lazy(() => import("../pages/DentistsPage").then((module) => ({ default: module.DentistsPage })));
const BranchesPage = lazy(() => import("../pages/BranchesPage").then((module) => ({ default: module.BranchesPage })));
const ServicesPage = lazy(() => import("../pages/ServicesPage").then((module) => ({ default: module.ServicesPage })));
const ServiceCategoriesPage = lazy(() => import("../pages/ServiceCategoriesPage").then((module) => ({ default: module.ServiceCategoriesPage })));
const ServiceSectionsPage = lazy(() => import("../pages/ServiceSectionsPage").then((module) => ({ default: module.ServiceSectionsPage })));
const ServicePriceListsPage = lazy(() => import("../pages/ServicePriceListsPage").then((module) => ({ default: module.ServicePriceListsPage })));
const ServiceDetailPage = lazy(() => import("../pages/ServiceDetailPage").then((module) => ({ default: module.ServiceDetailPage })));
const ReportsPage = lazy(() => import("../pages/ReportsPage").then((module) => ({ default: module.ReportsPage })));
const UsersPage = lazy(() => import("../pages/UsersPage").then((module) => ({ default: module.UsersPage })));
const RolesPage = lazy(() => import("../pages/RolesPage").then((module) => ({ default: module.RolesPage })));
const UserProfilePage = lazy(() => import("../pages/UserProfilePage").then((module) => ({ default: module.UserProfilePage })));
const SettingsPage = lazy(() => import("../pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const ProfilePage = lazy(() => import("../pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const MedicalSchemesPage = lazy(() => import("../pages/MedicalSchemesPage").then((module) => ({ default: module.MedicalSchemesPage })));
const ChangePasswordPage = lazy(() => import("../pages/ChangePasswordPage").then((module) => ({ default: module.ChangePasswordPage })));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<LoginPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route element={<RequirePasswordChange />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/check-ins" element={<CheckInsPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/dentists" element={<DentistsPage />} />
              <Route path="/branches" element={<BranchesPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/categories" element={<ServiceCategoriesPage />} />
              <Route path="/services/sections" element={<ServiceSectionsPage />} />
              <Route path="/services/price-lists" element={<ServicePriceListsPage />} />
              <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/medical-schemes" element={<MedicalSchemesPage />} />
              <Route element={<RequireAdminAccess />}>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/:userId" element={<UserProfilePage />} />
                <Route path="/roles" element={<RolesPage />} />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
