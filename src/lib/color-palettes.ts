type ColorPalette = {
  avatar: string;
  accent: string;
  card: string;
  panel: string;
};

const PALETTES: ColorPalette[] = [
  {
    avatar: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
    accent: "bg-emerald-400",
    card: "border-emerald-200/70 bg-emerald-50/35 dark:border-emerald-900/40 dark:bg-emerald-500/5",
    panel: "border-emerald-200/50 bg-white/70 dark:border-emerald-900/30 dark:bg-emerald-500/8",
  },
  {
    avatar: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200",
    accent: "bg-sky-400",
    card: "border-sky-200/70 bg-sky-50/35 dark:border-sky-900/40 dark:bg-sky-500/5",
    panel: "border-sky-200/50 bg-white/70 dark:border-sky-900/30 dark:bg-sky-500/8",
  },
  {
    avatar: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
    accent: "bg-amber-400",
    card: "border-amber-200/70 bg-amber-50/35 dark:border-amber-900/40 dark:bg-amber-500/5",
    panel: "border-amber-200/50 bg-white/70 dark:border-amber-900/30 dark:bg-amber-500/8",
  },
  {
    avatar: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200",
    accent: "bg-rose-400",
    card: "border-rose-200/70 bg-rose-50/35 dark:border-rose-900/40 dark:bg-rose-500/5",
    panel: "border-rose-200/50 bg-white/70 dark:border-rose-900/30 dark:bg-rose-500/8",
  },
  {
    avatar: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200",
    accent: "bg-violet-400",
    card: "border-violet-200/70 bg-violet-50/35 dark:border-violet-900/40 dark:bg-violet-500/5",
    panel: "border-violet-200/50 bg-white/70 dark:border-violet-900/30 dark:bg-violet-500/8",
  },
  {
    avatar: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200",
    accent: "bg-cyan-400",
    card: "border-cyan-200/70 bg-cyan-50/35 dark:border-cyan-900/40 dark:bg-cyan-500/5",
    panel: "border-cyan-200/50 bg-white/70 dark:border-cyan-900/30 dark:bg-cyan-500/8",
  },
];

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

export function getFriendlyPalette(value: string) {
  return PALETTES[hashString(value) % PALETTES.length];
}
