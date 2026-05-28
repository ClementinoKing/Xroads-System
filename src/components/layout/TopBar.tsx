import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarPlus,
  CirclePlus,
  Building2,
  HeartPulse,
  LogOut,
  Menu,
  Search,
  Settings,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { branches } from "../../data/branches";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { CREATE_EVENTS } from "../../lib/create-events";
import { useAuth } from "../../features/auth/auth-context";
import { getAuthDisplayName, getAuthRoleLabel } from "../../features/auth/use-auth-user";

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement | null>(null);
  const controlHeight = "h-12";
  const displayName = getAuthDisplayName(user, profile);
  const roleLabel = getAuthRoleLabel(user, profile);
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "XH";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (createMenuRef.current && !createMenuRef.current.contains(target)) {
        setCreateOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  function handleCreateAction(eventName: string) {
    setCreateOpen(false);
    window.dispatchEvent(new Event(eventName));
  }

  async function handleSignOut() {
    setAccountOpen(false);
    const { error } = await signOut();
    if (!error) {
      navigate("/", { replace: true });
    }
  }

  return (
    <div className="grid w-full grid-cols-[auto_auto_auto_minmax(0,1fr)_auto] items-center gap-4 lg:gap-6">
      <Button variant="ghost" className={cn(controlHeight, "w-12 rounded-md p-0 text-slate-700 dark:text-slate-200 hover:bg-slate-100")} onClick={onMenuClick} aria-label="Toggle sidebar">
        <Menu size={30} strokeWidth={2.4} />
      </Button>
      <button className="flex h-12 min-w-0 items-center" onClick={() => navigate("/dashboard")} aria-label="Go to dashboard">
        <img src="/SVG/xroads_logo.svg" alt="Xroads Health" className="h-8 w-auto max-w-[112px] object-contain sm:max-w-[138px]" />
      </button>
      <div ref={createMenuRef} className="relative">
        <Button
          className={cn(controlHeight, "rounded-md bg-xroads-500 px-4 text-[15px] shadow-sm hover:bg-xroads-600 sm:px-5 lg:ml-1")}
          onClick={() => setCreateOpen((current) => !current)}
          aria-haspopup="menu"
          aria-expanded={createOpen}
          type="button"
        >
          <span>Create</span>
          <CirclePlus size={21} strokeWidth={2.4} />
        </Button>
        {createOpen ? (
          <div className="absolute left-0 top-14 z-50 w-64 overflow-hidden rounded-md border border-slate-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-950">
            <MenuItem icon={CalendarPlus} label="Appointment" onClick={() => handleCreateAction(CREATE_EVENTS.appointment)} />
            <MenuItem icon={UserRound} label="Patient" onClick={() => handleCreateAction(CREATE_EVENTS.patient)} />
            <MenuItem icon={Stethoscope} label="Dentist" onClick={() => handleCreateAction(CREATE_EVENTS.dentist)} />
            <MenuItem icon={Building2} label="Branch" onClick={() => handleCreateAction(CREATE_EVENTS.branch)} />
            <MenuItem icon={HeartPulse} label="Service" onClick={() => handleCreateAction(CREATE_EVENTS.service)} />
          </div>
        ) : null}
      </div>
      <div className="mx-auto hidden h-12 w-full max-w-3xl min-w-0 items-center rounded-md border border-slate-200 bg-slate-50 px-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:flex">
        <Search size={22} className="text-slate-400 dark:text-slate-500" strokeWidth={2.1} />
        <input className="h-full flex-1 bg-transparent px-3 text-base text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500" placeholder="Search patients, appointments, dentists" />
      </div>
      <div className="flex items-center justify-end gap-2.5">
        <select className="input hidden h-12 w-56 rounded-md text-base lg:block" aria-label="Branch selector">
          <option>All branches</option>
          {branches.map((branch) => (
            <option key={branch.id}>{branch.name}</option>
          ))}
        </select>
        <Button variant="outline" className={cn(controlHeight, "w-12 rounded-md p-0 text-slate-600 dark:text-slate-300")} aria-label="Notifications">
          <Bell size={22} strokeWidth={2.2} />
        </Button>
        <div className="relative">
          <button
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full bg-xroads-500 text-sm font-bold text-white shadow-sm ring-4 ring-xroads-50 transition hover:bg-xroads-600",
              accountOpen && "bg-xroads-600 ring-xroads-100",
            )}
            onClick={() => setAccountOpen((current) => !current)}
            aria-label="Open account menu"
            aria-expanded={accountOpen}
          >
            {initials}
          </button>
          {accountOpen ? (
            <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-md border border-slate-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-950">
              <div className="border-b border-slate-100 p-4 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-xroads-500 text-sm font-bold text-white">{initials}</div>
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-slate-50">{displayName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{roleLabel}</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <button
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-zinc-900"
                  onClick={() => {
                    setAccountOpen(false);
                    navigate("/profile");
                  }}
                >
                  <UserRound size={18} />
                  Account profile
                </button>
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-zinc-900">
                  <Settings size={18} />
                  Account settings
                </button>
                <button
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                  onClick={() => void handleSignOut()}
                >
                  <LogOut size={18} />
                  Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof CalendarPlus;
  label: string;
  onClick: () => void;
}) {
  return (
      <button onClick={onClick} type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:bg-zinc-950 dark:text-slate-200 dark:hover:bg-zinc-900">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-xroads-50 text-xroads-700 dark:bg-zinc-900 dark:text-xroads-200">
        <Icon size={18} />
      </span>
      <span>{label}</span>
    </button>
  );
}
