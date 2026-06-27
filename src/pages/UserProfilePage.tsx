import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  LoaderCircle,
  Mail,
  ShieldCheck,
  User,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { PageLoader } from "../components/shared/PageLoader";
import { useToast } from "../components/shared/ToastProvider";
import { useAuth } from "../features/auth/auth-context";
import { loadProfile, type BranchRecord, type ProfileRecord, type RoleRecord } from "../features/profile/profile-service";
import { updateStaffAccount } from "../features/staff/staff-admin-service";
import type { UserAccount } from "../data/users";
import { cn } from "../lib/utils";

type UserProfileFormValues = {
  fullName: string;
  email: string;
  roleId: string;
  branchId: string;
  status: UserAccount["status"];
};

const EMPTY_FORM: UserProfileFormValues = {
  fullName: "",
  email: "",
  roleId: "receptionist",
  branchId: "All branches",
  status: "Active",
};

function formatDate(value: string) {
  const parsed = parseISO(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return format(parsed, "MMM d, yyyy");
}

function statusBadgeClass(status: ProfileRecord["status"]) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-zinc-900 dark:text-emerald-200 dark:ring-zinc-700";
    case "invited":
      return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-zinc-900 dark:text-amber-200 dark:ring-zinc-700";
    case "suspended":
      return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-700";
  }
}

function statusLabel(status: ProfileRecord["status"]) {
  switch (status) {
    case "active":
      return "Active";
    case "invited":
      return "Invited";
    case "suspended":
      return "Suspended";
  }
}

function mapProfileToForm(profile: ProfileRecord, roles: RoleRecord[]): UserProfileFormValues {
  const roleName = roles.find((role) => role.id === profile.role_id)?.name ?? profile.role_id;

  return {
    fullName: profile.full_name,
    email: profile.email,
    roleId: roles.find((role) => role.id === profile.role_id)?.id ?? profile.role_id,
    branchId: profile.branch_id ?? "All branches",
    status: statusLabel(profile.status),
  };
}

function resolveRoleName(profile: ProfileRecord, roles: RoleRecord[]) {
  return roles.find((role) => role.id === profile.role_id)?.name ?? profile.role_id;
}

function resolveBranchName(profile: ProfileRecord, branches: BranchRecord[]) {
  return branches.find((branch) => branch.id === profile.branch_id)?.name ?? (profile.branch_id ? profile.branch_id : "No branch assigned");
}

export function UserProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { profile: currentProfile } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [formValues, setFormValues] = useState<UserProfileFormValues>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error" | "missing">("loading");
  const loadToastShownRef = useRef(false);

  const canEditAccess = currentProfile?.role_id === "super_admin" || currentProfile?.role_id === "branch_admin";

  useEffect(() => {
    let active = true;

    async function run() {
      if (!userId) {
        setProfile(null);
        setLoadState("missing");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadState("loading");
      loadToastShownRef.current = false;

      const result = await loadProfile(userId);

      if (!active) {
        return;
      }

      if (result.error) {
        setProfile(null);
        setRoles([]);
        setBranches([]);
        setLoadState("error");

        if (!loadToastShownRef.current) {
          showToast({
            title: "Profile load failed",
            description: result.error,
            variant: "error",
          });
          loadToastShownRef.current = true;
        }
      } else if (result.profile) {
        setProfile(result.profile);
        setRoles(result.roles);
        setBranches(result.branches);
        setFormValues(mapProfileToForm(result.profile, result.roles));
        setLoadState("ready");
      } else {
        setProfile(null);
        setRoles(result.roles);
        setBranches(result.branches);
        setLoadState("missing");

        if (!loadToastShownRef.current) {
          showToast({
            title: "Profile unavailable",
            description: "We could not find a persisted profile record for this account.",
            variant: "warning",
          });
          loadToastShownRef.current = true;
        }
      }

      setIsLoading(false);
    }

    void run();

    return () => {
      active = false;
    };
  }, [showToast, userId]);

  const roleName = profile ? resolveRoleName(profile, roles) : "";
  const branchName = profile ? resolveBranchName(profile, branches) : "No branch assigned";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile || !userId) {
      return;
    }

    setIsSaving(true);

    const result = await updateStaffAccount({
      userId,
      name: formValues.fullName.trim(),
      email: formValues.email.trim(),
      roleId: formValues.roleId,
      branchId: canEditAccess ? formValues.branchId : profile.branch_id ?? "All branches",
      status: formValues.status,
    });

    if (result.error) {
      showToast({
        title: "Profile update failed",
        description: result.error,
        variant: "error",
      });
      setIsSaving(false);
      return;
    }

    const refreshed = await loadProfile(userId);

    if (refreshed.profile) {
      setProfile(refreshed.profile);
      setRoles(refreshed.roles);
      setBranches(refreshed.branches);
      setFormValues(mapProfileToForm(refreshed.profile, refreshed.roles));
    }

    showToast({
      title: "Profile updated",
      description: "The staff account changes were saved.",
      variant: "success",
    });
    setIsSaving(false);
  }

  if (isLoading) {
    return <PageLoader />;
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>{loadState === "error" ? "Profile unavailable" : "User not found"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {loadState === "error"
                ? "The profile could not be loaded right now."
                : "The user profile you requested does not exist in the current dataset."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/users")}>
                <ArrowLeft size={16} />
                Back to users
              </Button>
              {loadState === "error" ? (
                <Button type="button" onClick={() => window.location.reload()}>
                  Retry loading
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Button type="button" variant="outline" className="h-10 w-fit px-3" onClick={() => navigate("/users")}>
            <ArrowLeft size={16} />
            Back to users
          </Button>
          <div>
            <h1 className="page-title">User profile</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage account details, access, and branch assignment for this staff member.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" type="button" onClick={() => window.location.reload()}>
            Refresh
          </Button>
          <Button type="submit" form="user-profile-form" disabled={isSaving}>
            {isSaving ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Saving
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-xroads-500 text-lg font-bold text-white shadow-sm">
                {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" /> : profile.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{profile.full_name}</h2>
                  <Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200">{roleName}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className={statusBadgeClass(profile.status)}>{statusLabel(profile.status)}</Badge>
                  <Badge className="bg-slate-100 text-slate-700 ring-slate-200">{branchName}</Badge>
                </div>
              </div>
            </div>
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:min-w-72">
              <ProfileStat icon={Mail} label="Email" value={profile.email} />
              <ProfileStat icon={Building2} label="Branch" value={branchName} />
              <ProfileStat icon={CalendarDays} label="Created" value={formatDate(profile.created_at)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Edit profile</CardTitle>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Update the staff member&apos;s identity, status, and access assignment.
              </p>
            </div>
            <Badge
              className={cn(
                "hidden sm:inline-flex",
                profile.status === "active"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : profile.status === "invited"
                    ? "bg-amber-50 text-amber-700 ring-amber-200"
                    : "bg-slate-100 text-slate-700 ring-slate-200",
              )}
            >
              {statusLabel(profile.status)}
            </Badge>
          </CardHeader>
          <CardContent>
            <form id="user-profile-form" className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-1.5 md:col-span-2">
                  <span className="label">Full name</span>
                  <input
                    className="input"
                    value={formValues.fullName}
                    onChange={(event) => setFormValues((current) => ({ ...current, fullName: event.target.value }))}
                    required
                  />
                </label>
                <label className="grid gap-1.5 md:col-span-2">
                  <span className="label">Email address</span>
                  <input
                    className="input"
                    type="email"
                    value={formValues.email}
                    onChange={(event) => setFormValues((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="label">Role</span>
                  <select
                    className="input"
                    value={formValues.roleId}
                    onChange={(event) => setFormValues((current) => ({ ...current, roleId: event.target.value }))}
                    disabled={!canEditAccess}
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {canEditAccess ? "Access role is editable." : "Only administrators can change access roles."}
                  </span>
                </label>
                <label className="grid gap-1.5">
                  <span className="label">Status</span>
                  <select
                    className="input"
                    value={formValues.status}
                    onChange={(event) => setFormValues((current) => ({ ...current, status: event.target.value as UserAccount["status"] }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Invited">Invited</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Use status to reflect the current account lifecycle.</span>
                </label>
                <label className="grid gap-1.5 md:col-span-2">
                  <span className="label">Branch</span>
                  <select
                    className="input"
                    value={formValues.branchId}
                    onChange={(event) => setFormValues((current) => ({ ...current, branchId: event.target.value }))}
                    disabled={!canEditAccess}
                  >
                    <option value="All branches">All branches</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {canEditAccess ? "Branch assignment is editable." : "Branch assignment is read-only on this account."}
                  </span>
                </label>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={User} label="Profile ID" value={profile.id} />
              <InfoRow icon={UserRoundCog} label="Role" value={roleName} />
              <InfoRow icon={Building2} label="Branch" value={branchName} />
              <InfoRow icon={ShieldCheck} label="Status" value={statusLabel(profile.status)} />
              <InfoRow icon={CalendarDays} label="Created at" value={formatDate(profile.created_at)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Current access</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{profile.role_id}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Profile snapshot</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Updates are saved directly to the `profiles` record and reflected in the staff directory.
                </p>
              </div>
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
