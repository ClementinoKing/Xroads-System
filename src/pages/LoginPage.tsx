import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../features/auth/auth-context";
import { useToast } from "../components/shared/ToastProvider";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const { error } = await signInWithPassword({ email, password });

    if (error) {
      showToast({
        title: "Login failed",
        description: error,
        variant: "error",
      });
      setIsSubmitting(false);
      return;
    }

    showToast({
      title: "Signed in",
      description: "You are now logged in.",
      variant: "success",
    });
    const nextPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";
    navigate(nextPath, { replace: true });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex items-center justify-center bg-white px-6 py-10 dark:bg-zinc-950 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <img
                src="/SVG/xroads_logo.svg"
                alt="Xroads"
                className="mx-auto mb-4 h-12 w-auto max-w-[180px] object-contain sm:h-14"
              />
              <p className="mt-1 text-sm font-medium text-xroads-600 dark:text-xroads-300">Your Smile, Our Priority</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
              <label className="grid gap-1.5">
                <span className="label text-slate-600 dark:text-slate-300">Email address</span>
                <span className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
                  <input
                    className="input pl-10"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="off"
                    required
                  />
                </span>
              </label>
              <label className="grid gap-1.5">
                <span className="label text-slate-600 dark:text-slate-300">Password</span>
                <span className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
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
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Signing in
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Having trouble signing in? Contact your admin for help.
              </p>
            </form>
          </div>
        </div>

        <div className="relative hidden min-h-screen lg:block">
          <img
            src="/img/Login-img.jpeg"
            alt="Xroads login cover"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/15 via-slate-950/10 to-xroads-500/20 dark:from-zinc-950/30 dark:via-zinc-950/15 dark:to-xroads-500/35" />
        </div>
      </section>
    </main>
  );
}
