import { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Mail } from "lucide-react";
import { Button } from "../components/ui/Button";

export function LoginPage() {
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate("/dashboard");
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
                  <input className="input pl-10" type="email" defaultValue="admin@xroads.health" required />
                </span>
              </label>
              <label className="grid gap-1.5">
                <span className="label">Password</span>
                <span className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
                  <input className="input pl-10" type="password" defaultValue="password" required />
                </span>
              </label>
              <Button className="w-full" type="submit">
                Login
              </Button>
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
          <div className="absolute inset-x-0 bottom-0 p-8">
            <div className="max-w-md rounded-2xl border border-white/20 bg-white/70 p-6 backdrop-blur-md shadow-lg">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Welcome back</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">Manage your clinic with confidence.</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Secure access for the Xroads team, designed for a calm and efficient start to every day.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
