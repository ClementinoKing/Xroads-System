import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { useAuth } from "../../features/auth/auth-context";
import { useTheme } from "../shared/ThemeProvider";
import { getAuthDisplayName, getAuthRoleLabel } from "../../features/auth/use-auth-user";

export function AccountMenu({ showLabel = false, className }: { showLabel?: boolean; className?: string }) {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const displayName = getAuthDisplayName(user, profile);
  const roleLabel = getAuthRoleLabel(user, profile);
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "XH";

  async function handleSignOut() {
    setOpen(false);
    const { error } = await signOut();
    if (!error) {
      navigate("/", { replace: true });
    }
  }

  if (showLabel) {
    return (
      <div
        className={cn(
          "w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-xroads-500 text-sm font-bold text-white">{initials}</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{displayName}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-11 items-center justify-start gap-2 rounded-md border border-slate-200 bg-white px-4 text-slate-700 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:bg-zinc-900"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <span className="truncate">Theme</span>
          </button>
          <Button
            type="button"
            variant="outline"
            className="h-11 justify-start px-4 border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-200 dark:hover:bg-rose-950/30"
            onClick={() => void handleSignOut()}
          >
            <LogOut size={18} />
            <span className="truncate">Logout</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex items-center gap-3 transition",
            "h-12 w-12 items-center justify-center rounded-full bg-xroads-500 text-sm font-bold text-white shadow-sm ring-4 ring-xroads-50 transition hover:bg-xroads-600",
            className,
          )}
          aria-label="Open account menu"
          aria-expanded={open}
        >
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-xroads-500 text-white", open && "bg-xroads-600 ring-4 ring-xroads-100")}>{initials}</div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={12}
        className="z-[60] w-80 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="border-b border-slate-100 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-xroads-500 text-sm font-bold text-white">{initials}</div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-950 dark:text-slate-50">{displayName}</p>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">{roleLabel}</p>
            </div>
          </div>
        </div>

        <div className="p-3">
          <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="flex h-12 items-center justify-start gap-2 rounded-xl border border-slate-200 px-4 text-slate-700 transition hover:bg-slate-50 dark:border-zinc-800 dark:text-slate-200 dark:hover:bg-zinc-900"
            onClick={() => {
              setOpen(false);
              setTheme(theme === "dark" ? "light" : "dark");
            }}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <span>Theme</span>
          </button>
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full justify-start border-rose-200 px-4 text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-200 dark:hover:bg-rose-950/30"
            onClick={() => void handleSignOut()}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
