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
};

export const PALETTE: Record<ColorKey, PaletteEntry> = {
  indigo: {
    label: "Indigo",
    swatch: "bg-indigo-600",
    block: "bg-indigo-100/75 border-indigo-200 text-indigo-950 hover:bg-indigo-100 hover:border-indigo-300 shadow-2xs",
    blockDone: "bg-indigo-50/80 border-indigo-200/70 text-slate-600 shadow-none",
    chip: "bg-indigo-100/90 text-indigo-950 border-indigo-200/90",
    dot: "bg-indigo-600",
    accent: "bg-indigo-600",
    selected: "bg-indigo-600 border-indigo-600 text-white",
    ghost: "bg-indigo-100/90 border-indigo-400",
  },
  emerald: {
    label: "Emerald",
    swatch: "bg-emerald-600",
    block: "bg-emerald-100/75 border-emerald-200 text-emerald-950 hover:bg-emerald-100 hover:border-emerald-300 shadow-2xs",
    blockDone: "bg-emerald-50/80 border-emerald-200/70 text-slate-600 shadow-none",
    chip: "bg-emerald-100/90 text-emerald-950 border-emerald-200/90",
    dot: "bg-emerald-600",
    accent: "bg-emerald-600",
    selected: "bg-emerald-600 border-emerald-600 text-white",
    ghost: "bg-emerald-100/90 border-emerald-400",
  },
  amber: {
    label: "Amber",
    swatch: "bg-amber-500",
    block: "bg-amber-100/80 border-amber-300/90 text-amber-950 hover:bg-amber-100 hover:border-amber-400/90 shadow-2xs",
    blockDone: "bg-amber-50/80 border-amber-200/70 text-slate-600 shadow-none",
    chip: "bg-amber-100/90 text-amber-950 border-amber-300/80",
    dot: "bg-amber-600",
    accent: "bg-amber-500",
    selected: "bg-amber-600 border-amber-600 text-white",
    ghost: "bg-amber-100/90 border-amber-400",
  },
  rose: {
    label: "Rose",
    swatch: "bg-rose-600",
    block: "bg-rose-100/75 border-rose-200 text-rose-950 hover:bg-rose-100 hover:border-rose-300 shadow-2xs",
    blockDone: "bg-rose-50/80 border-rose-200/70 text-slate-600 shadow-none",
    chip: "bg-rose-100/90 text-rose-950 border-rose-200/90",
    dot: "bg-rose-600",
    accent: "bg-rose-500",
    selected: "bg-rose-600 border-rose-600 text-white",
    ghost: "bg-rose-100/90 border-rose-400",
  },
  sky: {
    label: "Sky",
    swatch: "bg-sky-600",
    block: "bg-sky-100/75 border-sky-200 text-sky-950 hover:bg-sky-100 hover:border-sky-300 shadow-2xs",
    blockDone: "bg-sky-50/80 border-sky-200/70 text-slate-600 shadow-none",
    chip: "bg-sky-100/90 text-sky-950 border-sky-200/90",
    dot: "bg-sky-600",
    accent: "bg-sky-500",
    selected: "bg-sky-600 border-sky-600 text-white",
    ghost: "bg-sky-100/90 border-sky-400",
  },
  violet: {
    label: "Violet",
    swatch: "bg-violet-600",
    block: "bg-violet-100/75 border-violet-200 text-violet-950 hover:bg-violet-100 hover:border-violet-300 shadow-2xs",
    blockDone: "bg-violet-50/80 border-violet-200/70 text-slate-600 shadow-none",
    chip: "bg-violet-100/90 text-violet-950 border-violet-200/90",
    dot: "bg-violet-600",
    accent: "bg-violet-500",
    selected: "bg-violet-600 border-violet-600 text-white",
    ghost: "bg-violet-100/90 border-violet-400",
  },
  teal: {
    label: "Teal",
    swatch: "bg-teal-600",
    block: "bg-teal-100/75 border-teal-200 text-teal-950 hover:bg-teal-100 hover:border-teal-300 shadow-2xs",
    blockDone: "bg-teal-50/80 border-teal-200/70 text-slate-600 shadow-none",
    chip: "bg-teal-100/90 text-teal-950 border-teal-200/90",
    dot: "bg-teal-600",
    accent: "bg-teal-600",
    selected: "bg-teal-600 border-teal-600 text-white",
    ghost: "bg-teal-100/90 border-teal-400",
  },
  orange: {
    label: "Orange",
    swatch: "bg-orange-500",
    block: "bg-orange-100/80 border-orange-300/80 text-orange-950 hover:bg-orange-100 hover:border-orange-400/80 shadow-2xs",
    blockDone: "bg-orange-50/80 border-orange-200/70 text-slate-600 shadow-none",
    chip: "bg-orange-100/90 text-orange-950 border-orange-300/80",
    dot: "bg-orange-600",
    accent: "bg-orange-500",
    selected: "bg-orange-600 border-orange-600 text-white",
    ghost: "bg-orange-100/90 border-orange-400",
  },
  pink: {
    label: "Pink",
    swatch: "bg-pink-600",
    block: "bg-pink-100/75 border-pink-200 text-pink-950 hover:bg-pink-100 hover:border-pink-300 shadow-2xs",
    blockDone: "bg-pink-50/80 border-pink-200/70 text-slate-600 shadow-none",
    chip: "bg-pink-100/90 text-pink-950 border-pink-200/90",
    dot: "bg-pink-600",
    accent: "bg-pink-500",
    selected: "bg-pink-600 border-pink-600 text-white",
    ghost: "bg-pink-100/90 border-pink-400",
  },
  lime: {
    label: "Lime",
    swatch: "bg-lime-600",
    block: "bg-lime-100/80 border-lime-300/80 text-lime-950 hover:bg-lime-100 hover:border-lime-400/80 shadow-2xs",
    blockDone: "bg-lime-50/80 border-lime-200/70 text-slate-600 shadow-none",
    chip: "bg-lime-100/90 text-lime-950 border-lime-300/80",
    dot: "bg-lime-600",
    accent: "bg-lime-600",
    selected: "bg-lime-600 border-lime-600 text-white",
    ghost: "bg-lime-100/90 border-lime-400",
  },
  cyan: {
    label: "Cyan",
    swatch: "bg-cyan-600",
    block: "bg-cyan-100/75 border-cyan-200 text-cyan-950 hover:bg-cyan-100 hover:border-cyan-300 shadow-2xs",
    blockDone: "bg-cyan-50/80 border-cyan-200/70 text-slate-600 shadow-none",
    chip: "bg-cyan-100/90 text-cyan-950 border-cyan-200/90",
    dot: "bg-cyan-600",
    accent: "bg-cyan-500",
    selected: "bg-cyan-600 border-cyan-600 text-white",
    ghost: "bg-cyan-100/90 border-cyan-400",
  },
  slate: {
    label: "Slate",
    swatch: "bg-slate-600",
    block: "bg-slate-100 border-slate-300/90 text-slate-900 hover:bg-slate-200/70 hover:border-slate-400 shadow-2xs",
    blockDone: "bg-slate-50 border-slate-200 text-slate-600 shadow-none",
    chip: "bg-slate-100 text-slate-900 border-slate-200",
    dot: "bg-slate-600",
    accent: "bg-slate-600",
    selected: "bg-slate-800 border-slate-800 text-white",
    ghost: "bg-slate-100/90 border-slate-400",
  },
};

export const COLOR_KEYS = Object.keys(PALETTE) as ColorKey[];

export function paletteOf(color: string): PaletteEntry {
  return PALETTE[(color as ColorKey) in PALETTE ? (color as ColorKey) : "indigo"];
}
