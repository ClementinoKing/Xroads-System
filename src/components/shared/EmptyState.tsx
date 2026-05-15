import { CalendarX } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 rounded-full bg-xroads-50 p-3 text-xroads-700">
        <CalendarX size={22} />
      </div>
      <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}
