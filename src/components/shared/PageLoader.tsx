import { LoaderCircle } from "lucide-react";

export function PageLoader() {
  return (
    <main className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[hsl(var(--background))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(132,198,29,0.18),transparent_32rem),radial-gradient(circle_at_bottom_right,rgba(132,198,29,0.08),transparent_28rem)] dark:bg-[radial-gradient(circle_at_top_left,rgba(132,198,29,0.12),transparent_32rem),radial-gradient(circle_at_bottom_right,rgba(132,198,29,0.05),transparent_28rem)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_48%,rgba(255,255,255,0.12)_50%,transparent_52%,transparent_100%)] opacity-30 dark:opacity-10" />
      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        <div
          className="mb-6 flex items-center justify-center rounded-[2rem] border border-[hsl(var(--border))] bg-white/85 p-5 shadow-[0_24px_80px_-36px_rgba(132,198,29,0.55)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85"
          style={{ boxShadow: "0 24px 80px -36px rgba(132, 198, 29, 0.55)" }}
        >
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-xroads-200/80 dark:border-xroads-500/25" />
            <div className="absolute inset-2 rounded-full border border-xroads-400/60 dark:border-xroads-400/20" />
            <LoaderCircle className="relative animate-spin text-xroads-600 dark:text-xroads-300" size={28} strokeWidth={2.3} />
          </div>
        </div>
      </div>
    </main>
  );
}
