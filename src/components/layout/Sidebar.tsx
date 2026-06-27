import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  BadgeCheck,
  CalendarDays,
  ClipboardPlus,
  FileText,
  ChevronDown,
  ChevronRight,
  Gauge,
  HeartPulse,
  Settings,
  Stethoscope,
  UserCircle2,
  Users,
  UserRoundCog,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../features/auth/auth-context";
import { AccountMenu } from "./AccountMenu";

const navigation = [
  { label: "Dashboard", to: "/dashboard", icon: Gauge },
  { label: "Calendar", to: "/calendar", icon: CalendarDays },
  { label: "Appointments", to: "/appointments", icon: ClipboardPlus },
  { label: "Check-ins", to: "/check-ins", icon: BadgeCheck },
  { label: "Consultations", to: "/consultations", icon: FileText },
  { label: "Patients", to: "/patients", icon: Users },
  { label: "Dentists", to: "/dentists", icon: Stethoscope },
  { label: "Branches", to: "/branches", icon: Building2 },
  { label: "Profile", to: "/profile", icon: UserCircle2 },
  { label: "Reports", to: "/reports", icon: BarChart3 },
  { label: "Settings", to: "/settings", icon: Settings },
];

const serviceItems = [
  { label: "Service catalog", to: "/services" },
  { label: "Categories", to: "/services/categories" },
  { label: "Sections", to: "/services/sections" },
  { label: "Price lists", to: "/services/price-lists" },
];

function isServiceCatalogRoute(pathname: string) {
  return pathname === "/services" || (/^\/services\/[^/]+$/.test(pathname) && !pathname.startsWith("/services/categories") && !pathname.startsWith("/services/sections") && !pathname.startsWith("/services/price-lists"));
}

export function Sidebar({ open, collapsed, onClose }: { open: boolean; collapsed: boolean; onClose: () => void }) {
  const location = useLocation();
  const { profile } = useAuth();
  const [usersGroupOpen, setUsersGroupOpen] = useState(false);
  const [servicesGroupOpen, setServicesGroupOpen] = useState(false);
  const canAccessUsers = profile?.role_id === "super_admin" || profile?.role_id === "branch_admin";

  useEffect(() => {
    if (location.pathname.startsWith("/users") || location.pathname.startsWith("/roles")) {
      setUsersGroupOpen(true);
    }

    if (location.pathname.startsWith("/services")) {
      setServicesGroupOpen(true);
    }
  }, [location.pathname]);

  return (
    <>
      <div className={cn("fixed inset-x-0 bottom-0 top-20 z-40 bg-slate-950/30 lg:hidden", open ? "block" : "hidden")} onClick={onClose} />
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-20 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-[transform,width] dark:border-zinc-800 dark:bg-zinc-950",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          collapsed && "lg:w-20",
        )}
      >
        <nav className={cn("flex-1 space-y-1 p-4", collapsed && "lg:px-3")}>
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
                  collapsed && "lg:justify-center lg:px-0",
                  isActive ? "bg-xroads-50 text-xroads-800 dark:bg-xroads-500/15 dark:text-xroads-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-zinc-900 dark:hover:text-slate-50",
                )
              }
            >
              <item.icon className="shrink-0" size={21} />
              <span className={cn("truncate transition-opacity", collapsed && "lg:hidden")}>{item.label}</span>
            </NavLink>
          ))}
          <div>
            <button
              type="button"
              onClick={() => setServicesGroupOpen((current) => !current)}
              title={collapsed ? "Services" : undefined}
              aria-expanded={servicesGroupOpen}
              className={cn(
                "flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
                collapsed && "lg:justify-center lg:px-0",
                location.pathname.startsWith("/services")
                  ? "bg-xroads-50 text-xroads-800 dark:bg-xroads-500/15 dark:text-xroads-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-zinc-900 dark:hover:text-slate-50",
              )}
            >
              <HeartPulse className="shrink-0" size={21} />
              <span className={cn("truncate transition-opacity", collapsed && "lg:hidden")}>Services</span>
              <span className={cn("ml-auto transition-opacity", collapsed && "lg:hidden")}>
                {servicesGroupOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </span>
            </button>
            {servicesGroupOpen && !collapsed ? (
              <div className="mt-1 space-y-1 pl-4">
                {serviceItems.map((item) => {
                  const isActive =
                    item.to === "/services"
                      ? isServiceCatalogRoute(location.pathname)
                      : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={() =>
                        cn(
                          "flex h-10 items-center rounded-md px-3 text-sm font-medium transition",
                          isActive
                            ? "bg-xroads-50 text-xroads-800 dark:bg-xroads-500/15 dark:text-xroads-200"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-zinc-900 dark:hover:text-slate-50",
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            ) : null}
          </div>
          {canAccessUsers ? (
            <div>
              <button
                type="button"
                onClick={() => setUsersGroupOpen((current) => !current)}
                title={collapsed ? "Users & Roles" : undefined}
                aria-expanded={usersGroupOpen}
                className={cn(
                  "flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
                  collapsed && "lg:justify-center lg:px-0",
                  location.pathname.startsWith("/users") || location.pathname.startsWith("/roles")
                    ? "bg-xroads-50 text-xroads-800 dark:bg-xroads-500/15 dark:text-xroads-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-zinc-900 dark:hover:text-slate-50",
                )}
              >
                <UserRoundCog className="shrink-0" size={21} />
                <span className={cn("truncate transition-opacity", collapsed && "lg:hidden")}>Users & Roles</span>
                <span className={cn("ml-auto transition-opacity", collapsed && "lg:hidden")}>
                  {usersGroupOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </span>
              </button>
              {usersGroupOpen && !collapsed ? (
                <div className="mt-1 space-y-1 pl-4">
                  <NavLink
                    to="/users"
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex h-10 items-center rounded-md px-3 text-sm font-medium transition",
                        isActive
                          ? "bg-xroads-50 text-xroads-800 dark:bg-xroads-500/15 dark:text-xroads-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-zinc-900 dark:hover:text-slate-50",
                      )
                    }
                  >
                    Users
                  </NavLink>
                  <NavLink
                    to="/roles"
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex h-10 items-center rounded-md px-3 text-sm font-medium transition",
                        isActive
                          ? "bg-xroads-50 text-xroads-800 dark:bg-xroads-500/15 dark:text-xroads-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-zinc-900 dark:hover:text-slate-50",
                      )
                    }
                  >
                    Roles
                  </NavLink>
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>
        <div className={cn("m-4 flex items-center justify-center", collapsed ? "lg:mx-3 lg:my-4" : "lg:mx-4 lg:my-4")}>
          <AccountMenu showLabel={!collapsed} className={cn("w-full", collapsed && "lg:w-auto lg:justify-center")} />
        </div>
      </aside>
    </>
  );
}
