import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardPlus,
  Gauge,
  HeartPulse,
  LogOut,
  Moon,
  Settings,
  Settings2,
  Stethoscope,
  Users,
  UserRoundCog,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useTheme } from "../shared/ThemeProvider";

const navigation = [
  { label: "Dashboard", to: "/dashboard", icon: Gauge },
  { label: "Calendar", to: "/calendar", icon: CalendarDays },
  { label: "Bookings", to: "/booking", icon: ClipboardPlus },
  { label: "Patients", to: "/patients", icon: Users },
  { label: "Dentists", to: "/dentists", icon: Stethoscope },
  { label: "Branches", to: "/branches", icon: Building2 },
  { label: "Services", to: "/services", icon: HeartPulse },
  { label: "Reports", to: "/reports", icon: BarChart3 },
  { label: "Users & Roles", to: "/users", icon: UserRoundCog },
  { label: "Settings", to: "/settings", icon: Settings },
];

export function Sidebar({ open, collapsed, onClose }: { open: boolean; collapsed: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();

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
        </nav>
        <div className={cn("m-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950", collapsed && "lg:hidden")}>
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">clementmwanyama</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Full Stack Developer</p>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex h-12 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:bg-zinc-900"
            >
              <LogOut size={18} />
              Logout
            </button>
            <button
              type="button"
              aria-label="Settings"
              className="flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:bg-zinc-900"
            >
              <Settings2 size={20} />
            </button>
            <button
              type="button"
              aria-label="Theme"
              onClick={toggleTheme}
              className="flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:bg-zinc-900"
            >
              <Moon size={20} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
