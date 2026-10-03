/**
 * The icons the app draws, imported one file at a time.
 *
 * `lucide-react-native`'s barrel export pulls every one of its ~1800 icons into the bundle, because
 * Metro does not tree-shake: it took the Android bundle from ~3 MB to 6.6 MB. Importing the single
 * file (`lucide-react-native/icons/<name>`) keeps only the icons actually used, and gives one place
 * to see what the app draws. DESIGN.md asks for drawn SVG icons with a consistent stroke, never
 * emoji.
 *
 * Keep this list alphabetical, and only add an icon that is genuinely used somewhere. The file names
 * are lucide's kebab-case icon names, which are not always the component name (there is no `trash-2`
 * any more: `Trash2` is an alias of `Trash`).
 */
export { default as CalendarX } from "lucide-react-native/icons/calendar-x";
export { default as ChevronRight } from "lucide-react-native/icons/chevron-right";
export { default as Plus } from "lucide-react-native/icons/plus";
export { default as Trash } from "lucide-react-native/icons/trash";
