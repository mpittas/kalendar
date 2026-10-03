import {
  buildEmojiGroups,
  readRecentEmojis as readRecents,
  rememberEmoji as rememberRecent,
  type CompactEmoji,
  type EmojiGroup,
  type KeyValueStorage,
} from "@klndr/core";

export { searchEmojis } from "@klndr/core";
export type { EmojiEntry, EmojiGroup, KeyValueStorage } from "@klndr/core";

let cache: Promise<EmojiGroup[]> | null = null;

/** Loads the emoji dataset on first use (it is large, so it stays out of the main bundle). */
export function loadEmojiGroups(): Promise<EmojiGroup[]> {
  cache ??= Promise.all([
    import("emojibase-data/en/compact.json"),
    import("emojibase-data/en/messages.json"),
  ]).then(([dataMod, messagesMod]) =>
    buildEmojiGroups(
      dataMod.default as CompactEmoji[],
      (messagesMod.default as { groups: { key: string }[] }).groups,
    ),
  );
  return cache;
}

/** localStorage on the client; nothing on the server, where the recents are only a nicety. */
const storage = (): KeyValueStorage | null => (import.meta.client ? localStorage : null);

export function readRecentEmojis(): string[] {
  return readRecents(storage());
}

export function rememberEmoji(char: string): void {
  rememberRecent(storage(), char);
}
