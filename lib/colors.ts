export type ColorKey =
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "violet"
  | "teal"
  | "orange"
  | "pink"
  | "lime"
  | "cyan"
  | "slate";

export type PaletteEntry = {
  label: string;
  swatch: string;
  block: string;
  blockDone: string;
  chip: string;
  dot: string;
  accent: string;
  selected: string;
  ghost: string;
  icon: string;
};

export const PALETTE: Record<ColorKey, PaletteEntry> = {
  indigo: {
    label: "Indigo",
    swatch: "bg-indigo-500",
    block: "bg-indigo-50/90 border-indigo-200/90 text-slate-900 hover:bg-indigo-100/80 hover:border-indigo-300 shadow-2xs dark:bg-indigo-500/15 dark:border-indigo-400/30 dark:text-slate-50 dark:hover:bg-indigo-500/25 dark:hover:border-indigo-400/50",
    blockDone: "bg-muted/70 border-border text-muted-foreground shadow-none",
    chip: "bg-indigo-50 border-indigo-200 text-slate-900 dark:bg-indigo-500/15 dark:border-indigo-400/30 dark:text-slate-50",
    dot: "bg-indigo-500",
    accent: "bg-indigo-500",
    selected: "bg-indigo-600 border-indigo-600 text-white",
    ghost: "bg-indigo-50/90 border-indigo-300 dark:bg-indigo-500/15 dark:border-indigo-400/50",
    icon: "bg-indigo-100 text-indigo-950 dark:bg-indigo-500/25 dark:text-indigo-100",
  },
  emerald: {
    label: "Emerald",
    swatch: "bg-emerald-500",
    block: "bg-emerald-50/90 border-emerald-200/90 text-slate-900 hover:bg-emerald-100/80 hover:border-emerald-300 shadow-2xs dark:bg-emerald-500/15 dark:border-emerald-400/30 dark:text-slate-50 dark:hover:bg-emerald-500/25 dark:hover:border-emerald-400/50",
    blockDone: "bg-muted/70 border-border text-muted-foreground shadow-none",
    chip: "bg-emerald-50 border-emerald-200 text-slate-900 dark:bg-emerald-500/15 dark:border-emerald-400/30 dark:text-slate-50",
    dot: "bg-emerald-500",
    accent: "bg-emerald-500",
    selected: "bg-emerald-600 border-emerald-600 text-white",
    ghost: "bg-emerald-50/90 border-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-400/50",
    icon: "bg-emerald-100 text-emerald-950 dark:bg-emerald-500/25 dark:text-emerald-100",
  },
  amber: {
    label: "Amber",
    swatch: "bg-amber-500",
    block: "bg-amber-50/90 border-amber-200/90 text-slate-900 hover:bg-amber-100/80 hover:border-amber-300 shadow-2xs dark:bg-amber-500/15 dark:border-amber-400/30 dark:text-slate-50 dark:hover:bg-amber-500/25 dark:hover:border-amber-400/50",
    blockDone: "bg-muted/70 border-border text-muted-foreground shadow-none",
    chip: "bg-amber-50 border-amber-200 text-slate-900 dark:bg-amber-500/15 dark:border-amber-400/30 dark:text-slate-50",
    dot: "bg-amber-500",
    accent: "bg-amber-500",
    selected: "bg-amber-600 border-amber-600 text-white",
    ghost: "bg-amber-50/90 border-amber-300 dark:bg-amber-500/15 dark:border-amber-400/50",
    icon: "bg-amber-100 text-amber-950 dark:bg-amber-500/25 dark:text-amber-100",
  },
  rose: {
    label: "Rose",
    swatch: "bg-rose-500",
    block: "bg-rose-50/90 border-rose-200/90 text-slate-900 hover:bg-rose-100/80 hover:border-rose-300 shadow-2xs dark:bg-rose-500/15 dark:border-rose-400/30 dark:text-slate-50 dark:hover:bg-rose-500/25 dark:hover:border-rose-400/50",
    blockDone: "bg-muted/70 border-border text-muted-foreground shadow-none",
    chip: "bg-rose-50 border-rose-200 text-slate-900 dark:bg-rose-500/15 dark:border-rose-400/30 dark:text-slate-50",
    dot: "bg-rose-500",
    accent: "bg-rose-500",
    selected: "bg-rose-600 border-rose-600 text-white",
    ghost: "bg-rose-50/90 border-rose-300 dark:bg-rose-500/15 dark:border-rose-400/50",
    icon: "bg-rose-100 text-rose-950 dark:bg-rose-500/25 dark:text-rose-100",
  },
  sky: {
    label: "Sky",
    swatch: "bg-sky-500",
    block: "bg-sky-50/90 border-sky-200/90 text-slate-900 hover:bg-sky-100/80 hover:border-sky-300 shadow-2xs dark:bg-sky-500/15 dark:border-sky-400/30 dark:text-slate-50 dark:hover:bg-sky-500/25 dark:hover:border-sky-400/50",
    blockDone: "bg-muted/70 border-border text-muted-foreground shadow-none",
    chip: "bg-sky-50 border-sky-200 text-slate-900 dark:bg-sky-500/15 dark:border-sky-400/30 dark:text-slate-50",
    dot: "bg-sky-500",
    accent: "bg-sky-500",
    selected: "bg-sky-600 border-sky-600 text-white",
    ghost: "bg-sky-50/90 border-sky-300 dark:bg-sky-500/15 dark:border-sky-400/50",
    icon: "bg-sky-100 text-sky-950 dark:bg-sky-500/25 dark:text-sky-100",
  },
  violet: {
    label: "Violet",
    swatch: "bg-violet-500",
    block: "bg-violet-50/90 border-violet-200/90 text-slate-900 hover:bg-violet-100/80 hover:border-violet-300 shadow-2xs dark:bg-violet-500/15 dark:border-violet-400/30 dark:text-slate-50 dark:hover:bg-violet-500/25 dark:hover:border-violet-400/50",
    blockDone: "bg-muted/70 border-border text-muted-foreground shadow-none",
    chip: "bg-violet-50 border-violet-200 text-slate-900 dark:bg-violet-500/15 dark:border-violet-400/30 dark:text-slate-50",
    dot: "bg-violet-500",
    accent: "bg-violet-500",
    selected: "bg-violet-600 border-violet-600 text-white",
    ghost: "bg-violet-50/90 border-violet-300 dark:bg-violet-500/15 dark:border-violet-400/50",
    icon: "bg-violet-100 text-violet-950 dark:bg-violet-500/25 dark:text-violet-100",
  },
  teal: {
    label: "Teal",
    swatch: "bg-teal-500",
    block: "bg-teal-50/90 border-teal-200/90 text-slate-900 hover:bg-teal-100/80 hover:border-teal-300 shadow-2xs dark:bg-teal-500/15 dark:border-teal-400/30 dark:text-slate-50 dark:hover:bg-teal-500/25 dark:hover:border-teal-400/50",
    blockDone: "bg-muted/70 border-border text-muted-foreground shadow-none",
    chip: "bg-teal-50 border-teal-200 text-slate-900 dark:bg-teal-500/15 dark:border-teal-400/30 dark:text-slate-50",
    dot: "bg-teal-500",
    accent: "bg-teal-500",
    selected: "bg-teal-600 border-teal-600 text-white",
    ghost: "bg-teal-50/90 border-teal-300 dark:bg-teal-500/15 dark:border-teal-400/50",
    icon: "bg-teal-100 text-teal-950 dark:bg-teal-500/25 dark:text-teal-100",
  },
  orange: {
    label: "Orange",
    swatch: "bg-orange-500",
    block: "bg-orange-50/90 border-orange-200/90 text-slate-900 hover:bg-orange-100/80 hover:border-orange-300 shadow-2xs dark:bg-orange-500/15 dark:border-orange-400/30 dark:text-slate-50 dark:hover:bg-orange-500/25 dark:hover:border-orange-400/50",
    blockDone: "bg-muted/70 border-border text-muted-foreground shadow-none",
    chip: "bg-orange-50 border-orange-200 text-slate-900 dark:bg-orange-500/15 dark:border-orange-400/30 dark:text-slate-50",
    dot: "bg-orange-500",
    accent: "bg-orange-500",
    selected: "bg-orange-600 border-orange-600 text-white",
    ghost: "bg-orange-50/90 border-orange-300 dark:bg-orange-500/15 dark:border-orange-400/50",
    icon: "bg-orange-100 text-orange-950 dark:bg-orange-500/25 dark:text-orange-100",
  },
  pink: {
    label: "Pink",
    swatch: "bg-pink-500",
    block: "bg-pink-50/90 border-pink-200/90 text-slate-900 hover:bg-pink-100/80 hover:border-pink-300 shadow-2xs dark:bg-pink-500/15 dark:border-pink-400/30 dark:text-slate-50 dark:hover:bg-pink-500/25 dark:hover:border-pink-400/50",
    blockDone: "bg-muted/70 border-border text-muted-foreground shadow-none",
    chip: "bg-pink-50 border-pink-200 text-slate-900 dark:bg-pink-500/15 dark:border-pink-400/30 dark:text-slate-50",
    dot: "bg-pink-500",
    accent: "bg-pink-500",
    selected: "bg-pink-600 border-pink-600 text-white",
    ghost: "bg-pink-50/90 border-pink-300 dark:bg-pink-500/15 dark:border-pink-400/50",
    icon: "bg-pink-100 text-pink-950 dark:bg-pink-500/25 dark:text-pink-100",
  },
  lime: {
    label: "Lime",
    swatch: "bg-lime-500",
    block: "bg-lime-50/90 border-lime-200/90 text-slate-900 hover:bg-lime-100/80 hover:border-lime-300 shadow-2xs dark:bg-lime-500/15 dark:border-lime-400/30 dark:text-slate-50 dark:hover:bg-lime-500/25 dark:hover:border-lime-400/50",
    blockDone: "bg-muted/70 border-border text-muted-foreground shadow-none",
    chip: "bg-lime-50 border-lime-200 text-slate-900 dark:bg-lime-500/15 dark:border-lime-400/30 dark:text-slate-50",
    dot: "bg-lime-500",
    accent: "bg-lime-500",
    selected: "bg-lime-600 border-lime-600 text-white",
    ghost: "bg-lime-50/90 border-lime-300 dark:bg-lime-500/15 dark:border-lime-400/50",
    icon: "bg-lime-100 text-lime-950 dark:bg-lime-500/25 dark:text-lime-100",
  },
  cyan: {
    label: "Cyan",
    swatch: "bg-cyan-500",
    block: "bg-cyan-50/90 border-cyan-200/90 text-slate-900 hover:bg-cyan-100/80 hover:border-cyan-300 shadow-2xs dark:bg-cyan-500/15 dark:border-cyan-400/30 dark:text-slate-50 dark:hover:bg-cyan-500/25 dark:hover:border-cyan-400/50",
    blockDone: "bg-muted/70 border-border text-muted-foreground shadow-none",
    chip: "bg-cyan-50 border-cyan-200 text-slate-900 dark:bg-cyan-500/15 dark:border-cyan-400/30 dark:text-slate-50",
    dot: "bg-cyan-500",
    accent: "bg-cyan-500",
    selected: "bg-cyan-600 border-cyan-600 text-white",
    ghost: "bg-cyan-50/90 border-cyan-300 dark:bg-cyan-500/15 dark:border-cyan-400/50",
    icon: "bg-cyan-100 text-cyan-950 dark:bg-cyan-500/25 dark:text-cyan-100",
  },
  slate: {
    label: "Slate",
    swatch: "bg-slate-500",
    block: "bg-slate-50/90 border-slate-200/90 text-slate-900 hover:bg-slate-100/80 hover:border-slate-300 shadow-2xs dark:bg-slate-500/15 dark:border-slate-400/30 dark:text-slate-50 dark:hover:bg-slate-500/25 dark:hover:border-slate-400/50",
    blockDone: "bg-muted/70 border-border text-muted-foreground shadow-none",
    chip: "bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-500/15 dark:border-slate-400/30 dark:text-slate-50",
    dot: "bg-slate-500",
    accent: "bg-slate-500",
    selected: "bg-slate-800 border-slate-800 text-white dark:bg-slate-600 dark:border-slate-600",
    ghost: "bg-slate-50/90 border-slate-300 dark:bg-slate-500/15 dark:border-slate-400/50",
    icon: "bg-slate-200 text-slate-900 dark:bg-slate-500/25 dark:text-slate-100",
  },
};

export const COLOR_KEYS = Object.keys(PALETTE) as ColorKey[];

export function paletteOf(color: string): PaletteEntry {
  return PALETTE[(color as ColorKey) in PALETTE ? (color as ColorKey) : "indigo"];
}
