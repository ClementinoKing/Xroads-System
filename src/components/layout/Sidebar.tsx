import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardPlus,
  Gauge,
  HeartPulse,
  Settings,
  Stethoscope,
  Users,
  UserRoundCog,
} from "lucide-react";
import { cn } from "../../lib/utils";

const navigation = [
  { label: "Dashboard", to: "/dashboard", icon: Gauge },
  { label: "Calendar", to: "/calendar", icon: CalendarDays },
  { label: "New Booking", to: "/booking", icon: ClipboardPlus },
  { label: "Patients", to: "/patients", icon: Users },
  { label: "Dentists", to: "/dentists", icon: Stethoscope },
  { label: "Branches", to: "/branches", icon: Building2 },
  { label: "Services", to: "/services", icon: HeartPulse },
  { label: "Reports", to: "/reports", icon: BarChart3 },
  { label: "Users & Roles", to: "/users", icon: UserRoundCog },
  { label: "Settings", to: "/settings", icon: Settings },
];

export function Sidebar({ open, collapsed, onClose }: { open: boolean; collapsed: boolean; onClose: () => void }) {
  return (
    <>
      <div className={cn("fixed inset-x-0 bottom-0 top-20 z-40 bg-slate-950/30 lg:hidden", open ? "block" : "hidden")} onClick={onClose} />
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-20 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-[transform,width]",
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
                  isActive ? "bg-xroads-50 text-xroads-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                )
              }
            >
              <item.icon className="shrink-0" size={21} />
              <span className={cn("truncate transition-opacity", collapsed && "lg:hidden")}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className={cn("m-4 rounded-lg border border-xroads-100 bg-xroads-50 p-4", collapsed && "lg:hidden")}>
          <p className="text-sm font-semibold text-xroads-950">Clinic hours</p>
          <p className="mt-1 text-sm text-xroads-800">Monday to Friday, 8AM - 6PM</p>
        </div>
      </aside>
    </>
  );
}
