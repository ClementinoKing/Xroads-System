import { FormEvent, useEffect, useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, LoaderCircle, Lock, Phone, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useToast } from "../components/shared/ToastProvider";
import { ChangeEmailModal } from "../components/profile/ChangeEmailModal";
import { useAuth } from "../features/auth/auth-context";
import { getAuthDisplayName } from "../features/auth/use-auth-user";
import {
  changeEmail,
  getCachedProfile,
  loadProfile,
  saveProfile,
  updatePassword,
  uploadProfileAvatar,
  type ProfileFormValues,
  type ProfileRecord,
} from "../features/profile/profile-service";
import { cn } from "../lib/utils";

const EMPTY_FORM: ProfileFormValues = {
  fullName: "",
  phone: "",
};

const MAX_AVATAR_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileRecord | null>(() => (user ? getCachedProfile(user.id) : null));
  const [formValues, setFormValues] = useState<ProfileFormValues>(EMPTY_FORM);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isEmailSaving, setIsEmailSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error" | "missing">(() => (user && getCachedProfile(user.id) ? "ready" : "loading"));
  const loadToastShownRef = useRef(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const displayName = getAuthDisplayName(user);
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "XH";

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) {
        return;
      }

      loadToastShownRef.current = false;
      const cachedProfile = getCachedProfile(user.id);

      if (cachedProfile) {
        setProfile(cachedProfile);
        setFormValues({
          fullName: cachedProfile.full_name ?? "",
          phone: cachedProfile.phone ?? "",
        });
        setLoadState("ready");
        setIsLoading(false);
      } else {
        setIsLoading(true);
        setLoadState("loading");
      }

      const result = await loadProfile(user.id);

      if (!active) {
        return;
      }

      if (result.error) {
        setProfile(null);
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
        if (result.profile) {
          setFormValues({
            fullName: result.profile.full_name ?? "",
            phone: result.profile.phone ?? "",
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
      fullName: formValues.fullName.trim(),
      phone: formValues.phone.trim(),
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
      });
    }

    await refreshProfile();

    showToast({
      title: "Profile updated",
      description: "Your changes have been saved.",
      variant: "success",
    });
    setIsSaving(false);
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!user || !profile || !file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast({
        title: "Unsupported file type",
        description: "Choose a JPG, PNG, or WebP image for your avatar.",
        variant: "error",
      });
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
      showToast({
        title: "Avatar too large",
        description: "Keep the image under 5 MB before uploading.",
        variant: "error",
      });
      return;
    }

    setIsAvatarUploading(true);

    const result = await uploadProfileAvatar(user.id, file);

    if (result.error || !result.avatarUrl) {
      showToast({
        title: "Avatar upload failed",
        description: result.error ?? "We could not upload the selected image.",
        variant: "error",
      });
      setIsAvatarUploading(false);
      return;
    }

    setProfile((current) => (current ? { ...current, avatar_url: result.avatarUrl } : current));
    await refreshProfile();

    showToast({
      title: "Avatar updated",
      description: "Your profile image was uploaded successfully.",
      variant: "success",
    });
    setIsAvatarUploading(false);
  }

  async function handleEmailChange(nextEmail: string) {
    if (!user || !profile) {
      return;
    }

    setIsEmailSaving(true);

    const result = await changeEmail(user.id, nextEmail);

    if (result.error) {
      showToast({
        title: "Email update failed",
        description: result.error,
        variant: "error",
      });
      setIsEmailSaving(false);
      return;
    }

    if (result.profile) {
      setProfile(result.profile);
    }

    await refreshProfile();

    setIsEmailModalOpen(false);
    showToast({
      title: "Confirmation sent",
      description: "Check the new inbox to confirm the updated email address.",
      variant: "success",
    });
    setIsEmailSaving(false);
  }

  if (loadState === "loading") {
    return <ProfilePageSkeleton displayName={displayName} email={user?.email ?? ""} />;
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

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Button type="button" variant="outline" className="h-10 w-fit px-3" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={16} />
              Back to dashboard
            </Button>
            <div>
              <h1 className="page-title">My profile</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your personal account details and password.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" type="button" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-xroads-500 text-2xl font-bold text-white shadow-sm ring-4 ring-white dark:ring-neutral-900">
                    {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" /> : initials}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full p-0 shadow-lg"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isAvatarUploading}
                    aria-label="Upload avatar"
                  >
                    {isAvatarUploading ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
                  </Button>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{profile.full_name}</h2>
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
                  </div>
                  <p className="mt-3 max-w-xl text-sm text-slate-500 dark:text-slate-400">
                    Use the upload button on your photo to replace the avatar. PNG, JPG, and WebP images are supported.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:min-w-72">
                <ProfileStat icon={Phone} label="Phone" value={profile.phone ?? "Not added"} />
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-white p-2 text-xroads-700 ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-xroads-200 dark:ring-zinc-800">
                    <Upload size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Avatar</p>
                    <p className="text-sm font-medium text-slate-950 dark:text-slate-50">Upload a new image from the button on the photo.</p>
                  </div>
                </div>
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
                    <input className="input bg-slate-50 text-slate-500 dark:bg-neutral-950" type="email" value={profile.email} readOnly aria-readonly="true" />
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
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button type="button" variant="outline" onClick={() => setIsEmailModalOpen(true)}>
                      Change email
                    </Button>
                    <Button type="submit" disabled={isSaving}>
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
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <form
                  className="space-y-4"
                  onSubmit={async (event) => {
                    event.preventDefault();

                    if (password.length < 8) {
                      showToast({
                        title: "Password too short",
                        description: "Use at least 8 characters for the new password.",
                        variant: "error",
                      });
                      return;
                    }

                    if (password !== confirmPassword) {
                      showToast({
                        title: "Passwords do not match",
                        description: "Make sure both password fields match before saving.",
                        variant: "error",
                      });
                      return;
                    }

                    setIsPasswordSaving(true);

                    const result = await updatePassword(profile.id, password);

                    if (result.error) {
                      showToast({
                        title: "Password update failed",
                        description: result.error,
                        variant: "error",
                      });
                      setIsPasswordSaving(false);
                      return;
                    }

                    const refreshed = await loadProfile(profile.id);

                    if (refreshed.profile) {
                      setProfile(refreshed.profile);
                      setFormValues({
                        fullName: refreshed.profile.full_name ?? "",
                        phone: refreshed.profile.phone ?? "",
                      });
                    }

                    void refreshProfile();

                    setPassword("");
                    setConfirmPassword("");
                    showToast({
                      title: "Password updated",
                      description: "Your account is now using the new password.",
                      variant: "success",
                    });
                    setIsPasswordSaving(false);
                  }}
                >
                  <div className="grid gap-4">
                    <label className="grid gap-1.5">
                      <span className="label">New password</span>
                      <input
                        className="input"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter a new password"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="label">Confirm new password</span>
                      <input
                        className="input"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Confirm the new password"
                      />
                    </label>
                  </div>
                  <Button type="submit" disabled={isPasswordSaving}>
                    {isPasswordSaving ? (
                      <>
                        <LoaderCircle size={16} className="animate-spin" />
                        Updating password
                      </>
                    ) : (
                      "Update password"
                    )}
                  </Button>
                </form>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  If this account uses temporary credentials, updating the password clears the first-login requirement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ChangeEmailModal
        open={isEmailModalOpen}
        currentEmail={profile.email}
        isSaving={isEmailSaving}
        onClose={() => setIsEmailModalOpen(false)}
        onSubmit={handleEmailChange}
      />
    </>
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

function ProfilePageSkeleton({ displayName, email }: { displayName: string; email: string }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="h-10 w-36 rounded-md bg-slate-200/70 dark:bg-zinc-800/70" />
          <div className="space-y-2">
            <div className="h-9 w-40 rounded-md bg-slate-200/70 dark:bg-zinc-800/70" />
            <div className="h-4 w-72 rounded-md bg-slate-200/60 dark:bg-zinc-800/60" />
          </div>
        </div>
        <div className="h-10 w-24 rounded-md bg-slate-200/70 dark:bg-zinc-800/70" />
      </div>

      <Card>
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-3xl bg-slate-200/80 dark:bg-zinc-800/80" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-8 w-64 rounded-md bg-slate-200/70 dark:bg-zinc-800/70" />
                  <div className="h-5 w-72 rounded-md bg-slate-200/60 dark:bg-zinc-800/60" />
                </div>
                <div className="h-8 w-20 rounded-full bg-slate-200/70 dark:bg-zinc-800/70" />
                <div className="h-12 w-[38rem] max-w-full rounded-md bg-slate-200/60 dark:bg-zinc-800/60" />
              </div>
            </div>
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:min-w-72">
              <div className="space-y-3">
                <div className="h-14 rounded-xl bg-slate-200/60 dark:bg-zinc-800/60" />
                <div className="h-14 rounded-xl bg-slate-200/60 dark:bg-zinc-800/60" />
              </div>
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
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="grid gap-1.5 md:col-span-2">
                  <div className="label">Full name</div>
                  <div className="h-11 rounded-md bg-slate-200/70 dark:bg-zinc-800/70" />
                </div>
                <div className="grid gap-1.5">
                  <div className="label">Email address</div>
                  <div className="h-11 rounded-md bg-slate-200/70 dark:bg-zinc-800/70" />
                </div>
                <div className="grid gap-1.5">
                  <div className="label">Phone number</div>
                  <div className="h-11 rounded-md bg-slate-200/70 dark:bg-zinc-800/70" />
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="h-5 w-56 rounded-md bg-slate-200/70 dark:bg-zinc-800/70" />
                  <div className="h-4 w-80 rounded-md bg-slate-200/60 dark:bg-zinc-800/60" />
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <div className="h-10 w-32 rounded-md bg-slate-200/70 dark:bg-zinc-800/70" />
                  <div className="h-10 w-32 rounded-md bg-slate-200/70 dark:bg-zinc-800/70" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <div className="label">New password</div>
                  <div className="h-11 rounded-md bg-slate-200/70 dark:bg-zinc-800/70" />
                </div>
                <div className="grid gap-1.5">
                  <div className="label">Confirm new password</div>
                  <div className="h-11 rounded-md bg-slate-200/70 dark:bg-zinc-800/70" />
                </div>
              </div>
              <div className="h-10 w-36 rounded-md bg-slate-200/70 dark:bg-zinc-800/70" />
              <div className="h-4 w-full max-w-md rounded-md bg-slate-200/60 dark:bg-zinc-800/60" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="sr-only">
        {displayName} {email}
      </div>
    </div>
  );
}
