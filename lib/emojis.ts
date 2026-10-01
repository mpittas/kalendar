export type EmojiEntry = { char: string; label: string; tags: string[] };
export type EmojiGroup = { key: string; label: string; icon: string; emojis: EmojiEntry[] };

type CompactEmoji = { unicode: string; label: string; tags?: string[]; group?: number };

const GROUP_META: Record<string, { label: string; icon: string }> = {
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

let cache: Promise<EmojiGroup[]> | null = null;

/** Loads the emoji dataset on first use (it is large, so it stays out of the main bundle). */
export function loadEmojiGroups(): Promise<EmojiGroup[]> {
  cache ??= Promise.all([
    import("emojibase-data/en/compact.json"),
    import("emojibase-data/en/messages.json"),
  ]).then(([dataMod, messagesMod]) => {
    const data = dataMod.default as CompactEmoji[];
    const groups = (messagesMod.default as { groups: { key: string }[] }).groups;
    return groups
      .map((group, index): EmojiGroup | null => {
        const meta = GROUP_META[group.key];
        if (!meta) return null; // skips skin-tone "components"
        const emojis = data
          .filter((item) => item.group === index)
          .map((item) => ({ char: item.unicode, label: item.label, tags: item.tags ?? [] }));
        return { key: group.key, ...meta, emojis };
      })
      .filter((group): group is EmojiGroup => group !== null);
  });
  return cache;
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

const RECENT_KEY = "klndr:recent-emojis";
const RECENT_MAX = 16;

export function readRecentEmojis(): string[] {
  if (!import.meta.client) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function rememberEmoji(char: string): void {
  if (!import.meta.client) return;
  const next = [char, ...readRecentEmojis().filter((item) => item !== char)].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable; recents are optional
  }
}
