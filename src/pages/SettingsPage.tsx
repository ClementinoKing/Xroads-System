import { useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileLock2,
  Globe,
  HeartPulse,
  Lock,
  Mail,
  Megaphone,
  Palette,
  Shield,
  Sparkles,
  Users2,
} from "lucide-react";

import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Switch } from "../components/ui/switch";
import { cn } from "../lib/utils";

type SettingsSectionKey =
  | "clinic-profile"
  | "branding"
  | "operating-hours"
  | "permissions"
  | "notifications"
  | "security";

type SettingsSectionItem = {
  key: SettingsSectionKey;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

type SettingsSectionGroup = {
  title: string;
  icon: ComponentType<{ className?: string }>;
  items: SettingsSectionItem[];
};

type OfficeHourRow = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
};

const SETTINGS_SECTION_GROUPS: SettingsSectionGroup[] = [
  {
    title: "Organization",
    icon: Building2,
    items: [
      {
        key: "clinic-profile",
        label: "Clinic profile",
        description: "Branding, contacts, and location details.",
        icon: HeartPulse,
      },
      {
        key: "branding",
        label: "Branding",
        description: "Logo, colors, and public-facing identity.",
        icon: Palette,
      },
    ],
  },
  {
    title: "Operations",
    icon: Clock3,
    items: [
      {
        key: "operating-hours",
        label: "Operating hours",
        description: "Branch opening times and service windows.",
        icon: Clock3,
      },
    ],
  },
  {
    title: "Access control",
    icon: Shield,
    items: [
      {
        key: "permissions",
        label: "Permissions",
        description: "Staff access and role control.",
        icon: Users2,
      },
    ],
  },
  {
    title: "Alerts",
    icon: Bell,
    items: [
      {
        key: "notifications",
        label: "Notifications",
        description: "Email and alert preferences.",
        icon: Megaphone,
      },
    ],
  },
  {
    title: "Security",
    icon: Lock,
    items: [
      {
        key: "security",
        label: "Security",
        description: "Sessions, authentication, and privacy.",
        icon: FileLock2,
      },
    ],
  },
];

const INITIAL_OFFICE_HOURS: OfficeHourRow[] = [
  { day: "Monday", open: "08:00", close: "17:00", closed: false },
  { day: "Tuesday", open: "08:00", close: "17:00", closed: false },
  { day: "Wednesday", open: "08:00", close: "17:00", closed: false },
  { day: "Thursday", open: "08:00", close: "17:00", closed: false },
  { day: "Friday", open: "08:00", close: "17:00", closed: false },
  { day: "Saturday", open: "09:00", close: "13:00", closed: false },
  { day: "Sunday", open: "00:00", close: "00:00", closed: true },
];

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-xroads-50 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function SectionNavItem({
  item,
  active,
  onClick,
}: {
  item: SettingsSectionItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xroads-500",
        active
          ? "border-xroads-200 bg-xroads-50/70 text-slate-950 shadow-sm dark:border-xroads-500/30 dark:bg-neutral-800 dark:text-slate-50"
          : "border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:border-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-slate-50",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
          active
            ? "border-xroads-200 bg-white text-xroads-700 dark:border-xroads-500/30 dark:bg-neutral-900 dark:text-xroads-300"
            : "border-slate-200 bg-white text-slate-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-400",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{item.label}</p>
          {active ? <ChevronRight className="ml-auto h-4 w-4 text-xroads-600 dark:text-xroads-300" aria-hidden="true" /> : null}
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
      </div>
    </button>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>("clinic-profile");
  const [clinicName, setClinicName] = useState("Xroads Health");
  const [primaryPhone, setPrimaryPhone] = useState("+265 123 456 789");
  const [supportEmail, setSupportEmail] = useState("hello@xroads.health");
  const [clinicLocation, setClinicLocation] = useState("Lilongwe, Malawi");
  const [clinicMessage, setClinicMessage] = useState("Quality care across every branch.");
  const [brandTagline, setBrandTagline] = useState("Your Smile, Our Priority");
  const [brandAccent, setBrandAccent] = useState("#84c61d");
  const [brandSurface, setBrandSurface] = useState("#f3f8ea");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [digestNotifications, setDigestNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [officeHours, setOfficeHours] = useState<OfficeHourRow[]>(INITIAL_OFFICE_HOURS);

  const activeSectionItem =
    SETTINGS_SECTION_GROUPS.flatMap((group) => group.items).find((item) => item.key === activeSection) ??
    SETTINGS_SECTION_GROUPS[0].items[0];

  const updateOfficeHours = (index: number, patch: Partial<OfficeHourRow>) => {
    setOfficeHours((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "clinic-profile":
        return (
          <>
            <CardHeader className="border-slate-200 dark:border-neutral-800">
              <SectionHeader
                icon={activeSectionItem.icon}
                title="Clinic profile"
                description="Branding, contacts, and location details used across the app."
              />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Branches linked</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">2</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Xroads Dental and Gateway Dental.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Active staff</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">18</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Accounts with active access today.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Patient rating</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">4.9/5</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Rolling average across the last 90 days.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Clinic name</label>
                  <input
                    value={clinicName}
                    onChange={(event) => setClinicName(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-xroads-500 focus:ring-2 focus:ring-xroads-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Primary phone</label>
                  <input
                    value={primaryPhone}
                    onChange={(event) => setPrimaryPhone(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-xroads-500 focus:ring-2 focus:ring-xroads-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Support email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(event) => setSupportEmail(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-xroads-500 focus:ring-2 focus:ring-xroads-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Location</label>
                  <input
                    value={clinicLocation}
                    onChange={(event) => setClinicLocation(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-xroads-500 focus:ring-2 focus:ring-xroads-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Clinic message</label>
                <textarea
                  rows={4}
                  value={clinicMessage}
                  onChange={(event) => setClinicMessage(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 outline-none transition focus:border-xroads-500 focus:ring-2 focus:ring-xroads-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-50"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button variant="outline">Preview profile</Button>
                <Button>Save clinic profile</Button>
              </div>
            </CardContent>
          </>
        );

      case "branding":
        return (
          <>
            <CardHeader className="border-slate-200 dark:border-neutral-800">
              <SectionHeader
                icon={Palette}
                title="Branding"
                description="Control the clinic's logo, color system, and public-facing tone."
              />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/70 shadow-sm"
                      style={{ backgroundColor: brandSurface }}
                    >
                      <Sparkles className="h-7 w-7" style={{ color: brandAccent }} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Logo preview</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Used in the app shell and auth screens.</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-neutral-700 dark:text-slate-400">
                    Upload a square logo for the best fit.
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Brand tagline</label>
                      <input
                        value={brandTagline}
                        onChange={(event) => setBrandTagline(event.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-xroads-500 focus:ring-2 focus:ring-xroads-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Primary color</label>
                      <div className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 dark:border-neutral-800 dark:bg-neutral-900">
                        <span className="h-5 w-5 rounded-full border border-slate-200" style={{ backgroundColor: brandAccent }} />
                        <input
                          value={brandAccent}
                          onChange={(event) => setBrandAccent(event.target.value)}
                          className="w-full bg-transparent text-sm text-slate-950 outline-none dark:text-slate-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Surface color</label>
                      <div className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 dark:border-neutral-800 dark:bg-neutral-900">
                        <span className="h-5 w-5 rounded-full border border-slate-200" style={{ backgroundColor: brandSurface }} />
                        <input
                          value={brandSurface}
                          onChange={(event) => setBrandSurface(event.target.value)}
                          className="w-full bg-transparent text-sm text-slate-950 outline-none dark:text-slate-50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Display name</label>
                      <input
                        value={clinicName}
                        onChange={(event) => setClinicName(event.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-xroads-500 focus:ring-2 focus:ring-xroads-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-50"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <Button variant="outline">Restore defaults</Button>
                    <Button>Save branding</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        );

      case "operating-hours":
        return (
          <>
            <CardHeader className="border-slate-200 dark:border-neutral-800">
              <SectionHeader
                icon={Clock3}
                title="Operating hours"
                description="Branch opening times and service windows across the week."
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-slate-300">
                Define the default schedule below. The clinic is treated as closed when the closed toggle is on.
              </div>

              <div className="space-y-3">
                {officeHours.map((row, index) => (
                  <div
                    key={row.day}
                    className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 md:grid-cols-[1.2fr_1fr_1fr_auto]"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-950 dark:text-slate-50">{row.day}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Service window for scheduled appointments.</p>
                    </div>
                    <input
                      type="time"
                      value={row.open}
                      onChange={(event) => updateOfficeHours(index, { open: event.target.value })}
                      disabled={row.closed}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-xroads-500 focus:ring-2 focus:ring-xroads-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-slate-50"
                    />
                    <input
                      type="time"
                      value={row.close}
                      onChange={(event) => updateOfficeHours(index, { close: event.target.value })}
                      disabled={row.closed}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-xroads-500 focus:ring-2 focus:ring-xroads-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-slate-50"
                    />
                    <div className="flex items-center justify-between gap-3 md:justify-end">
                      <Badge className={cn("ring-1", row.closed ? "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-neutral-800 dark:text-slate-300 dark:ring-neutral-700" : "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20")}>
                        {row.closed ? "Closed" : "Open"}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`hours-${row.day.toLowerCase()}`}
                          checked={!row.closed}
                          onCheckedChange={(checked) => updateOfficeHours(index, { closed: !checked })}
                        />
                        <label htmlFor={`hours-${row.day.toLowerCase()}`} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {row.closed ? "Off" : "On"}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button variant="outline">Reset schedule</Button>
                <Button>Save hours</Button>
              </div>
            </CardContent>
          </>
        );

      case "permissions":
        return (
          <>
            <CardHeader className="border-slate-200 dark:border-neutral-800">
              <SectionHeader
                icon={Users2}
                title="Permissions"
                description="Role definitions and access boundaries for staff accounts."
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    title: "Super Admin",
                    badge: "Full access",
                    description: "Manage organizations, staff, billing, and security policies.",
                  },
                  {
                    title: "Branch Admin",
                    badge: "Branch scoped",
                    description: "Manage branch operations, schedules, and local assignments.",
                  },
                  {
                    title: "Receptionist",
                    badge: "Front desk",
                    description: "Handle appointments, patient intake, and day-to-day schedules.",
                  },
                  {
                    title: "Dentist",
                    badge: "Clinical",
                    description: "See assigned appointments, notes, and patient treatment history.",
                  },
                  {
                    title: "Finance",
                    badge: "Billing",
                    description: "Review invoices, payments, and reporting without admin access.",
                  },
                ].map((role) => (
                  <div key={role.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-slate-50">{role.title}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{role.description}</p>
                      </div>
                      <Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200 dark:bg-neutral-800 dark:text-xroads-300 dark:ring-neutral-700">
                        {role.badge}
                      </Badge>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" className="h-9 px-3 text-xs">
                        Edit access
                      </Button>
                      <Button variant="outline" className="h-9 px-3 text-xs">
                        Duplicate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-neutral-700 dark:text-slate-400">
                Keep role scopes narrow. Use branch-level access for operational staff and organization-level access only where required.
              </div>
            </CardContent>
          </>
        );

      case "notifications":
        return (
          <>
            <CardHeader className="border-slate-200 dark:border-neutral-800">
              <SectionHeader
                icon={Megaphone}
                title="Notifications"
                description="Email, SMS, and reminder preferences for staff and patients."
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  title: "Email notifications",
                  description: "Send appointment confirmations and schedule changes by email.",
                  checked: emailNotifications,
                  onCheckedChange: setEmailNotifications,
                },
                {
                  title: "SMS alerts",
                  description: "Send urgent reminders and cancellation notices via SMS.",
                  checked: smsNotifications,
                  onCheckedChange: setSmsNotifications,
                },
                {
                  title: "Push notifications",
                  description: "Show browser and desktop alerts for assignments and mentions.",
                  checked: pushNotifications,
                  onCheckedChange: setPushNotifications,
                },
                {
                  title: "Daily digest",
                  description: "Receive a daily summary of appointments and staffing changes.",
                  checked: digestNotifications,
                  onCheckedChange: setDigestNotifications,
                },
                {
                  title: "Appointment reminders",
                  description: "Remind patients before upcoming appointments.",
                  checked: appointmentReminders,
                  onCheckedChange: setAppointmentReminders,
                },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <div>
                    <p className="font-medium text-slate-950 dark:text-slate-50">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                  </div>
                  <Switch checked={item.checked} onCheckedChange={item.onCheckedChange} />
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                <Button variant="outline">Reset notifications</Button>
                <Button>Save preferences</Button>
              </div>
            </CardContent>
          </>
        );

      case "security":
        return (
          <>
            <CardHeader className="border-slate-200 dark:border-neutral-800">
              <SectionHeader
                icon={FileLock2}
                title="Security"
                description="Sessions, authentication, and audit protections for the clinic."
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-50">Two-factor authentication</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Require a verification code during sign in.</p>
                    </div>
                    <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-50">Audit logging</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Capture sensitive changes and access events.</p>
                    </div>
                    <Switch checked={auditLogging} onCheckedChange={setAuditLogging} />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Session controls</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-neutral-800">
                      <div>
                        <p className="font-medium text-slate-950 dark:text-slate-50">Password expiration</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Prompt staff to change passwords every 90 days.</p>
                      </div>
                      <Badge className="bg-slate-100 text-slate-600 ring-slate-200 dark:bg-neutral-800 dark:text-slate-300 dark:ring-neutral-700">
                        Managed
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-neutral-800">
                      <div>
                        <p className="font-medium text-slate-950 dark:text-slate-50">Session timeout</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Automatically sign out after inactivity.</p>
                      </div>
                      <Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200 dark:bg-neutral-800 dark:text-xroads-300 dark:ring-neutral-700">
                        30 min
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-neutral-800">
                      <div>
                        <p className="font-medium text-slate-950 dark:text-slate-50">Login alerts</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Notify the user when a new device signs in.</p>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                        Enabled
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Danger zone</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    These actions affect access and should only be used by administrators.
                  </p>
                  <div className="flex flex-col gap-2 pt-2">
                    <Button variant="outline" className="justify-start">
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      Review sign-in logs
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Globe className="h-4 w-4" aria-hidden="true" />
                      Manage trusted devices
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <CreditCard className="h-4 w-4" aria-hidden="true" />
                      Rotate API credentials
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button variant="outline">Reset security</Button>
                <Button>Save security</Button>
              </div>
            </CardContent>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-xroads-50 via-white to-slate-50 p-5 dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Administration</p>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">Medical schemes directory</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage the Malawi scheme list used when creating and editing patient records.
            </p>
          </div>
          <Button type="button" onClick={() => navigate("/settings/medical-schemes")}>
            Open manager
          </Button>
        </div>
      </div>

      <div
        className="w-full"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 320px) minmax(0, 1fr)",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <Card className="sticky top-6 h-fit border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <CardHeader className="border-slate-200 dark:border-neutral-800">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-xroads-50 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-300">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Settings sections</CardTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Jump between configuration areas.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {SETTINGS_SECTION_GROUPS.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.title} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <GroupIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{group.title}</p>
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <SectionNavItem
                        key={item.key}
                        item={item}
                        active={activeSection === item.key}
                        onClick={() => setActiveSection(item.key)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="h-fit min-w-0 border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">{renderActiveSection()}</Card>
      </div>
    </div>
  );
}
