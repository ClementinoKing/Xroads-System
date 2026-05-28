import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../features/auth/auth-context";
import { useToast } from "../components/shared/ToastProvider";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("admin@xroads.health");
  const [password, setPassword] = useState("password");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <main className="min-h-screen overflow-hidden bg-white">
      <section className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <img
                src="/SVG/xroads_logo.svg"
                alt="Xroads"
                className="mx-auto mb-4 h-12 w-auto max-w-[180px] object-contain sm:h-14"
              />
              <p className="mt-1 text-sm font-medium text-xroads-600">Your Smile, Our Priority</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="grid gap-1.5">
                <span className="label">Email address</span>
                <span className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
                  <input
                    className="input pl-10"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </span>
              </label>
              <label className="grid gap-1.5">
                <span className="label">Password</span>
                <span className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
                  <input
                    className="input pl-10"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
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
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/15 via-slate-950/10 to-xroads-500/20" />
        </div>
      </section>
    </main>
  );
}
