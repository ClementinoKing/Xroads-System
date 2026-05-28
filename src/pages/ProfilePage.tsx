import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Building2, CalendarDays, LoaderCircle, Mail, User, UserRoundCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { PageLoader } from "../components/shared/PageLoader";
import { useToast } from "../components/shared/ToastProvider";
import { useAuth } from "../features/auth/auth-context";
import { getAuthDisplayName } from "../features/auth/use-auth-user";
import { loadProfile, saveProfile, type BranchRecord, type ProfileFormValues, type ProfileRecord, type RoleRecord } from "../features/profile/profile-service";
import { cn } from "../lib/utils";

const ADMIN_ROLE_IDS = new Set(["super_admin", "branch_admin"]);

const EMPTY_FORM: ProfileFormValues = {
  fullName: "",
  phone: "",
  avatarUrl: "",
  roleId: "receptionist",
  branchId: "",
};

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [formValues, setFormValues] = useState<ProfileFormValues>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error" | "missing">("loading");
  const loadToastShownRef = useRef(false);

  const displayName = getAuthDisplayName(user);
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "XH";

  const canManageAccess = useMemo(() => ADMIN_ROLE_IDS.has(profile?.role_id ?? ""), [profile?.role_id]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) {
        return;
      }

      setIsLoading(true);
      setLoadState("loading");
      loadToastShownRef.current = false;

      const result = await loadProfile(user.id);

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
      } else {
        setProfile(result.profile);
        setRoles(result.roles);
        setBranches(result.branches);
        if (result.profile) {
          setFormValues({
            fullName: result.profile.full_name ?? "",
            phone: result.profile.phone ?? "",
            avatarUrl: result.profile.avatar_url ?? "",
            roleId: result.profile.role_id ?? "receptionist",
            branchId: result.profile.branch_id ?? "",
          });
          setLoadState("ready");
        } else {
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
      }

      setIsLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !profile) {
      return;
    }

    setIsSaving(true);

    const sanitizedValues: ProfileFormValues = {
      ...formValues,
      roleId: canManageAccess ? formValues.roleId : profile.role_id,
      branchId: canManageAccess ? formValues.branchId : profile.branch_id ?? "",
    };

    const result = await saveProfile(user.id, sanitizedValues);

    if (result.error) {
      showToast({
        title: "Profile update failed",
        description: result.error,
        variant: "error",
      });
      setIsSaving(false);
      return;
    }

    if (result.profile) {
      setProfile(result.profile);
      setFormValues({
        fullName: result.profile.full_name ?? "",
        phone: result.profile.phone ?? "",
        avatarUrl: result.profile.avatar_url ?? "",
        roleId: result.profile.role_id ?? "receptionist",
        branchId: result.profile.branch_id ?? "",
      });
    }

    showToast({
      title: "Profile updated",
      description: "Your changes have been saved.",
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
            <CardTitle>{loadState === "error" ? "Profile unavailable" : "Profile not found"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                <ArrowLeft size={16} />
                Back to dashboard
              </Button>
              <Button type="button" onClick={() => window.location.reload()}>
                Retry loading
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedRole = roles.find((item) => item.id === formValues.roleId) ?? null;
  const selectedBranch = branches.find((item) => item.id === formValues.branchId) ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Button type="button" variant="outline" className="h-10 w-fit px-3" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} />
            Back to dashboard
          </Button>
          <div>
            <h1 className="page-title">My profile</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage your personal account details, access, and branch assignment.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" type="button" onClick={() => window.location.reload()}>
            Refresh
          </Button>
          <Button type="submit" form="profile-form" disabled={isSaving}>
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
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-xroads-500 text-lg font-bold text-white shadow-sm">
                {initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{profile.full_name}</h2>
                  <Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200">{selectedRole?.name ?? profile.role_id}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge
                    className={cn(
                      profile.status === "active"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : profile.status === "invited"
                          ? "bg-amber-50 text-amber-700 ring-amber-200"
                          : "bg-slate-100 text-slate-700 ring-slate-200",
                    )}
                  >
                    {profile.status}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-700 ring-slate-200">
                    {selectedBranch?.name ?? (profile.branch_id ? profile.branch_id : "No branch assigned")}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:min-w-72">
              <ProfileStat icon={Mail} label="Email" value={profile.email} />
              <ProfileStat icon={Building2} label="Branch" value={selectedBranch?.name ?? "Unassigned"} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="profile-form" className="space-y-5" onSubmit={handleSubmit}>
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
                <label className="grid gap-1.5">
                  <span className="label">Email address</span>
                  <input className="input bg-slate-50 dark:bg-zinc-900" value={profile.email} disabled />
                </label>
                <label className="grid gap-1.5">
                  <span className="label">Phone number</span>
                  <input
                    className="input"
                    value={formValues.phone}
                    onChange={(event) => setFormValues((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+265 ..."
                  />
                </label>
                <label className="grid gap-1.5 md:col-span-2">
                  <span className="label">Avatar URL</span>
                  <input
                    className="input"
                    value={formValues.avatarUrl}
                    onChange={(event) => setFormValues((current) => ({ ...current, avatarUrl: event.target.value }))}
                    placeholder="https://..."
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="label">Role</span>
                  <select
                    className="input"
                    value={formValues.roleId}
                    onChange={(event) => setFormValues((current) => ({ ...current, roleId: event.target.value }))}
                    disabled={!canManageAccess}
                  >
                    {roles.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {canManageAccess ? "You can update your access role." : "Only administrators can change access roles."}
                  </span>
                </label>
                <label className="grid gap-1.5">
                  <span className="label">Branch</span>
                  <select
                    className="input"
                    value={formValues.branchId}
                    onChange={(event) => setFormValues((current) => ({ ...current, branchId: event.target.value }))}
                    disabled={!canManageAccess}
                  >
                    <option value="">Unassigned</option>
                    {branches.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {canManageAccess ? "Branch assignment is editable." : "Branch assignment is read-only on this account."}
                  </span>
                </label>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={User} label="Profile ID" value={profile.id} />
            <InfoRow icon={UserRoundCog} label="Role" value={selectedRole?.name ?? profile.role_id} />
            <InfoRow icon={Building2} label="Branch" value={selectedBranch?.name ?? "Unassigned"} />
            <InfoRow icon={CalendarDays} label="Updated at" value={new Date(profile.updated_at).toLocaleString()} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
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

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
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
