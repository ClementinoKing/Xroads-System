import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  Mail,
  type LucideIcon,
  ShieldCheck,
  User,
  UserRoundCog,
} from "lucide-react";
import { branches } from "../data/branches";
import { roles } from "../data/roles";
import { users } from "../data/users";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";

export function UserProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const user = users.find((item) => item.id === userId) ?? null;
  const roleDefinition = user ? roles.find((item) => item.name === user.role) ?? null : null;

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>User not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">The user profile you requested does not exist in the current dataset.</p>
            <Button type="button" onClick={() => navigate("/users")}>
              <ArrowLeft size={16} />
              Back to users
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const branchName = user.branchId === "All branches" ? "All branches" : branches.find((branch) => branch.id === user.branchId)?.name ?? "Branch";
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Button type="button" variant="outline" className="h-10 w-fit px-3" onClick={() => navigate("/users")}>
            <ArrowLeft size={16} />
            Back to users
          </Button>
          <div>
            <h1 className="page-title">User profile</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review account details, access, and responsibility for this staff member.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" type="button">
            <ShieldCheck size={16} />
            Reset access
          </Button>
          <Button type="button">
            <UserRoundCog size={16} />
            Edit profile
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 sm:p-7">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-xroads-500 text-lg font-bold text-white shadow-sm">
                    {initials}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{user.name}</h2>
                      <Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200">{user.role}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge className={user.status === "Active" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : user.status === "Invited" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-slate-100 text-slate-700 ring-slate-200"}>
                        {user.status}
                      </Badge>
                      <Badge className="bg-slate-100 text-slate-700 ring-slate-200">{branchName}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:min-w-64">
                  <ProfileStat icon={Mail} label="Email" value={user.email} />
                  <ProfileStat icon={Building2} label="Branch" value={branchName} />
                  <ProfileStat icon={Clock3} label="Last login" value={user.lastLogin} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoRow icon={User} label="User ID" value={user.id} />
                <InfoRow icon={UserRoundCog} label="Role" value={user.role} />
                <InfoRow icon={Building2} label="Branch assignment" value={branchName} />
                <InfoRow icon={CalendarDays} label="Last login" value={user.lastLogin} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Access level</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{roleDefinition?.accessLevel ?? "Custom access"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Permissions</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(roleDefinition?.permissions ?? [user.role]).map((permission) => (
                    <Badge key={permission} className="bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-800">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: "Profile viewed", detail: "Account summary reviewed by an admin", time: "Today" },
                { title: "Access confirmed", detail: `User remains assigned as ${user.role}`, time: "Yesterday" },
                { title: "Branch linked", detail: `Assigned to ${branchName}`, time: "2 days ago" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-zinc-800">
                  <div className="mt-0.5 rounded-lg bg-xroads-50 p-2 text-xroads-700 dark:bg-zinc-900 dark:text-xroads-200">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-slate-950 dark:text-slate-50">{item.title}</p>
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{item.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProfileStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-white p-2 text-xroads-700 ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-xroads-200 dark:ring-zinc-800">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-950 dark:text-slate-50">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-zinc-800">
      <div className="rounded-lg bg-slate-50 p-2 text-slate-700 dark:bg-zinc-900 dark:text-slate-200">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-medium text-slate-950 dark:text-slate-50">{value}</p>
      </div>
    </div>
  );
}
