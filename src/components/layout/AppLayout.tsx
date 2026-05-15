import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { cn } from "../../lib/utils";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  function handleMenuClick() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarCollapsed((current) => !current);
      return;
    }

    setSidebarOpen((current) => !current);
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
    </div>
  );
}
