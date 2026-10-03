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

/** Display name of each color, used as the accessible label wherever one is picked. */
export const COLOR_LABELS: Record<ColorKey, string> = {
  indigo: "Indigo",
  emerald: "Emerald",
  amber: "Amber",
  rose: "Rose",
  sky: "Sky",
  violet: "Violet",
  teal: "Teal",
  orange: "Orange",
  pink: "Pink",
  lime: "Lime",
  cyan: "Cyan",
  slate: "Slate",
};

/** Every key a stored color may hold. Older data can still use the ones left out of the picker. */
export const ACCEPTED_COLOR_KEYS = Object.keys(COLOR_LABELS) as ColorKey[];

/** The colors offered when choosing one: one per hue, so no two options look alike. */
export const COLOR_KEYS: ColorKey[] = ["indigo", "emerald", "amber", "rose", "violet", "orange", "pink", "slate"];

/** Colors dropped from the picker, shown as the option that replaced them (sky/cyan were a second blue, teal/lime a second green). */
const REPLACED_COLORS: Partial<Record<ColorKey, ColorKey>> = {
  sky: "indigo",
  cyan: "indigo",
  teal: "emerald",
  lime: "emerald",
};

export function canonicalColor(color: string): ColorKey {
  const key = color as ColorKey;
  if (!(key in COLOR_LABELS)) return "indigo";
  return REPLACED_COLORS[key] ?? key;
}
