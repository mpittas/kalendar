export type EmojiEntry = { char: string; label: string; tags: string[] };
export type EmojiGroup = { key: string; label: string; icon: string; emojis: EmojiEntry[] };

/** One row of the compact emojibase dataset (`emojibase-data/en/compact.json`). */
export type CompactEmoji = { unicode: string; label: string; tags?: string[]; group?: number };

/** The groups worth showing; anything else (skin-tone components) has no entry and is skipped. */
export const EMOJI_GROUP_META: Record<string, { label: string; icon: string }> = {
  "smileys-emotion": { label: "Smileys & Emotion", icon: "😀" },
  "people-body": { label: "People & Body", icon: "👋" },
  "animals-nature": { label: "Animals & Nature", icon: "🐻" },
  "food-drink": { label: "Food & Drink", icon: "🍔" },
  "travel-places": { label: "Travel & Places", icon: "✈️" },
  activities: { label: "Activities", icon: "⚽" },
  objects: { label: "Objects", icon: "💡" },
  symbols: { label: "Symbols", icon: "🔣" },
  flags: { label: "Flags", icon: "🏁" },
};

/**
 * Turn the compact emojibase dataset into the groups a picker shows. `groupKeys` is the `groups`
 * array of `emojibase-data/en/messages.json`, whose order is what the dataset's `group` indexes into.
 * The data itself is loaded by the app (a bundler concern); this is the shape it is turned into.
 */
export function buildEmojiGroups(
  data: readonly CompactEmoji[],
  groupKeys: readonly { key: string }[],
  meta: Record<string, { label: string; icon: string }> = EMOJI_GROUP_META,
): EmojiGroup[] {
  return groupKeys
    .map((group, index): EmojiGroup | null => {
      const known = meta[group.key];
      if (!known) return null; // skips skin-tone "components"
      const emojis = data
        .filter((item) => item.group === index)
        .map((item) => ({ char: item.unicode, label: item.label, tags: item.tags ?? [] }));
      return { key: group.key, ...known, emojis };
    })
    .filter((group): group is EmojiGroup => group !== null);
}

export function searchEmojis(groups: EmojiGroup[], query: string): EmojiEntry[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const results: EmojiEntry[] = [];
  for (const group of groups) {
    for (const emoji of group.emojis) {
      const haystack = `${emoji.label} ${emoji.tags.join(" ")}`.toLowerCase();
      if (terms.every((term) => haystack.includes(term))) results.push(emoji);
    }
  }
  return results;
}

/** Just enough of a key-value store to remember the recently used emojis (localStorage, MMKV, …). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const RECENT_EMOJIS_KEY = "klndr:recent-emojis";
export const RECENT_EMOJIS_MAX = 16;

/** Recently used emojis, newest first. No storage (or a failing one) simply means none. */
export function readRecentEmojis(storage: KeyValueStorage | null | undefined): string[] {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(RECENT_EMOJIS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function rememberEmoji(storage: KeyValueStorage | null | undefined, char: string): void {
  if (!storage) return;
  const next = [char, ...readRecentEmojis(storage).filter((item) => item !== char)].slice(0, RECENT_EMOJIS_MAX);
  try {
    storage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable; recents are optional
  }
}
