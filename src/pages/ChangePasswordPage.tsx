import { FormEvent, useState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { PageLoader } from "../components/shared/PageLoader";
import { useToast } from "../components/shared/ToastProvider";
import { useAuth } from "../features/auth/auth-context";
import { updatePassword } from "../features/profile/profile-service";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters for the new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setIsSaving(true);

    if (!user) {
      setError("You must be signed in to update your password.");
      setIsSaving(false);
      return;
    }

    const result = await updatePassword(user.id, password);

    if (result.error) {
      setError(result.error ?? "We could not update your password right now.");
      setIsSaving(false);
      return;
    }

    setIsRedirecting(true);
    showToast({
      title: "Password updated",
      description: "Your account is now using the new password.",
      variant: "success",
    });

    await refreshProfile();

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    setPassword("");
    setConfirmPassword("");
    setIsSaving(false);
    navigate("/", { replace: true });
  }

  if (isRedirecting) {
    return <PageLoader />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(132,198,29,0.18),transparent_28rem),linear-gradient(180deg,#ffffff_0%,#f8faf5_100%)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top_left,rgba(132,198,29,0.12),transparent_28rem),linear-gradient(180deg,#0a0a0a_0%,#111827_100%)]">
      <Card className="w-full max-w-xl border-slate-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-xroads-50 text-xroads-700 dark:bg-neutral-800 dark:text-xroads-300">
              <ShieldCheck size={20} />
            </div>
            <div>
              <CardTitle>Change your password</CardTitle>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {profile?.must_change_password
                  ? "This account was created with a temporary password. Set your own password before continuing."
                  : "Update your password and continue to the home page."}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="grid gap-1.5">
              <span className="label">New password</span>
              <span className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
                <input
                  className="input px-10"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <label className="grid gap-1.5">
              <span className="label">Confirm new password</span>
              <span className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
                <input
                  className="input px-10"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSaving} className="min-w-40">
                {isSaving ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Saving
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </div>
          </form>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-slate-300">
            <Sparkles size={18} className="mt-0.5 text-xroads-600" />
            <div>
              <p className="font-semibold text-slate-950 dark:text-slate-50">One-time step</p>
              <p className="mt-1">After you set a new password, the app will take you straight to the home page.</p>
            </div>
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500">Signed in as {user?.email ?? "current user"}.</div>
        </CardContent>
      </Card>
    </main>
  );
}
