import { Building2, Clock, Shield } from "lucide-react";
import { Card } from "../components/ui/Card";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Frontend preview of system preferences for future configuration.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Clinic profile", text: "Xroads Health branding, contact details, and clinic message.", icon: Building2 },
          { title: "Operating hours", text: "Monday to Friday, 8AM - 6PM branch schedule.", icon: Clock },
          { title: "Permissions", text: "Role capabilities for Super Admin, Branch Admin, Receptionist, Dentist, and Finance.", icon: Shield },
        ].map((item) => (
          <Card key={item.title} className="p-5">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-xroads-50 text-xroads-700"><item.icon size={22} /></div>
            <h2 className="font-semibold text-slate-950 dark:text-slate-50">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{item.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
