import { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export function LoginPage() {
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-7">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-xroads-500 text-white">
            <ShieldCheck size={27} />
          </div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50">Xroads Health</h1>
          <p className="mt-1 text-sm font-medium text-xroads-600">Your Smile, Our Priority</p>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Sign in as Super Admin, Branch Admin, Receptionist, Dentist, or Finance.</p>
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
          <Button className="w-full" type="submit">Login</Button>
        </form>
      </Card>
    </main>
  );
}
