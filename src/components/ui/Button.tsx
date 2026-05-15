import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary: "bg-xroads-500 text-white shadow-sm hover:bg-xroads-600",
  secondary: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-zinc-900 dark:text-slate-100 dark:hover:bg-zinc-800",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-zinc-900 dark:hover:text-slate-50",
  outline: "border border-slate-200 bg-white text-slate-700 hover:border-xroads-200 hover:bg-xroads-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:border-xroads-500/40 dark:hover:bg-zinc-900",
};

export function Button({ className, variant = "primary", children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
