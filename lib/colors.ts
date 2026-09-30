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
    swatch: "bg-indigo-500",
    block: "bg-indigo-50/70 border-indigo-200/80 text-indigo-950 hover:bg-indigo-50 hover:border-indigo-300 shadow-2xs",
    blockDone: "bg-indigo-50/30 border-indigo-100 text-indigo-400 shadow-none",
    chip: "bg-indigo-50 text-indigo-800 border-indigo-200/80",
    dot: "bg-indigo-500",
    accent: "bg-indigo-500",
    selected: "bg-indigo-600 border-indigo-600 text-white",
    ghost: "bg-indigo-50/80 border-indigo-300",
  },
  emerald: {
    label: "Emerald",
    swatch: "bg-emerald-500",
    block: "bg-emerald-50/70 border-emerald-200/80 text-emerald-950 hover:bg-emerald-50 hover:border-emerald-300 shadow-2xs",
    blockDone: "bg-emerald-50/30 border-emerald-100 text-emerald-400 shadow-none",
    chip: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    dot: "bg-emerald-500",
    accent: "bg-emerald-500",
    selected: "bg-emerald-600 border-emerald-600 text-white",
    ghost: "bg-emerald-50/80 border-emerald-300",
  },
  amber: {
    label: "Amber",
    swatch: "bg-amber-500",
    block: "bg-amber-50/70 border-amber-200/80 text-amber-950 hover:bg-amber-50 hover:border-amber-300 shadow-2xs",
    blockDone: "bg-amber-50/30 border-amber-100 text-amber-400 shadow-none",
    chip: "bg-amber-50 text-amber-800 border-amber-200/80",
    dot: "bg-amber-500",
    accent: "bg-amber-500",
    selected: "bg-amber-500 border-amber-500 text-white",
    ghost: "bg-amber-50/80 border-amber-300",
  },
  rose: {
    label: "Rose",
    swatch: "bg-rose-500",
    block: "bg-rose-50/70 border-rose-200/80 text-rose-950 hover:bg-rose-50 hover:border-rose-300 shadow-2xs",
    blockDone: "bg-rose-50/30 border-rose-100 text-rose-400 shadow-none",
    chip: "bg-rose-50 text-rose-800 border-rose-200/80",
    dot: "bg-rose-500",
    accent: "bg-rose-500",
    selected: "bg-rose-600 border-rose-600 text-white",
    ghost: "bg-rose-50/80 border-rose-300",
  },
  sky: {
    label: "Sky",
    swatch: "bg-sky-500",
    block: "bg-sky-50/70 border-sky-200/80 text-sky-950 hover:bg-sky-50 hover:border-sky-300 shadow-2xs",
    blockDone: "bg-sky-50/30 border-sky-100 text-sky-400 shadow-none",
    chip: "bg-sky-50 text-sky-800 border-sky-200/80",
    dot: "bg-sky-500",
    accent: "bg-sky-500",
    selected: "bg-sky-600 border-sky-600 text-white",
    ghost: "bg-sky-50/80 border-sky-300",
  },
  violet: {
    label: "Violet",
    swatch: "bg-violet-500",
    block: "bg-violet-50/70 border-violet-200/80 text-violet-950 hover:bg-violet-50 hover:border-violet-300 shadow-2xs",
    blockDone: "bg-violet-50/30 border-violet-100 text-violet-400 shadow-none",
    chip: "bg-violet-50 text-violet-800 border-violet-200/80",
    dot: "bg-violet-500",
    accent: "bg-violet-500",
    selected: "bg-violet-600 border-violet-600 text-white",
    ghost: "bg-violet-50/80 border-violet-300",
  },
  teal: {
    label: "Teal",
    swatch: "bg-teal-500",
    block: "bg-teal-50/70 border-teal-200/80 text-teal-950 hover:bg-teal-50 hover:border-teal-300 shadow-2xs",
    blockDone: "bg-teal-50/30 border-teal-100 text-teal-400 shadow-none",
    chip: "bg-teal-50 text-teal-800 border-teal-200/80",
    dot: "bg-teal-500",
    accent: "bg-teal-500",
    selected: "bg-teal-600 border-teal-600 text-white",
    ghost: "bg-teal-50/80 border-teal-300",
  },
  orange: {
    label: "Orange",
    swatch: "bg-orange-500",
    block: "bg-orange-50/70 border-orange-200/80 text-orange-950 hover:bg-orange-50 hover:border-orange-300 shadow-2xs",
    blockDone: "bg-orange-50/30 border-orange-100 text-orange-400 shadow-none",
    chip: "bg-orange-50 text-orange-800 border-orange-200/80",
    dot: "bg-orange-500",
    accent: "bg-orange-500",
    selected: "bg-orange-600 border-orange-600 text-white",
    ghost: "bg-orange-50/80 border-orange-300",
  },
  pink: {
    label: "Pink",
    swatch: "bg-pink-500",
    block: "bg-pink-50/70 border-pink-200/80 text-pink-950 hover:bg-pink-50 hover:border-pink-300 shadow-2xs",
    blockDone: "bg-pink-50/30 border-pink-100 text-pink-400 shadow-none",
    chip: "bg-pink-50 text-pink-800 border-pink-200/80",
    dot: "bg-pink-500",
    accent: "bg-pink-500",
    selected: "bg-pink-600 border-pink-600 text-white",
    ghost: "bg-pink-50/80 border-pink-300",
  },
  lime: {
    label: "Lime",
    swatch: "bg-lime-500",
    block: "bg-lime-50/70 border-lime-200/80 text-lime-950 hover:bg-lime-50 hover:border-lime-300 shadow-2xs",
    blockDone: "bg-lime-50/30 border-lime-100 text-lime-400 shadow-none",
    chip: "bg-lime-50 text-lime-800 border-lime-200/80",
    dot: "bg-lime-500",
    accent: "bg-lime-500",
    selected: "bg-lime-600 border-lime-600 text-white",
    ghost: "bg-lime-50/80 border-lime-300",
  },
  cyan: {
    label: "Cyan",
    swatch: "bg-cyan-500",
    block: "bg-cyan-50/70 border-cyan-200/80 text-cyan-950 hover:bg-cyan-50 hover:border-cyan-300 shadow-2xs",
    blockDone: "bg-cyan-50/30 border-cyan-100 text-cyan-400 shadow-none",
    chip: "bg-cyan-50 text-cyan-800 border-cyan-200/80",
    dot: "bg-cyan-500",
    accent: "bg-cyan-500",
    selected: "bg-cyan-600 border-cyan-600 text-white",
    ghost: "bg-cyan-50/80 border-cyan-300",
  },
  slate: {
    label: "Slate",
    swatch: "bg-slate-500",
    block: "bg-slate-100/80 border-slate-300/80 text-slate-900 hover:bg-slate-100 hover:border-slate-400/80 shadow-2xs",
    blockDone: "bg-slate-100/40 border-slate-200 text-slate-400 shadow-none",
    chip: "bg-slate-100 text-slate-800 border-slate-200",
    dot: "bg-slate-500",
    accent: "bg-slate-500",
    selected: "bg-slate-800 border-slate-800 text-white",
    ghost: "bg-slate-100/80 border-slate-300",
  },
};

export const COLOR_KEYS = Object.keys(PALETTE) as ColorKey[];

export function paletteOf(color: string): PaletteEntry {
  return PALETTE[(color as ColorKey) in PALETTE ? (color as ColorKey) : "indigo"];
}
