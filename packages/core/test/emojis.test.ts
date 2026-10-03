import { describe, expect, it } from "vitest";
import {
  RECENT_EMOJIS_KEY,
  RECENT_EMOJIS_MAX,
  buildEmojiGroups,
  readRecentEmojis,
  rememberEmoji,
  searchEmojis,
  type CompactEmoji,
  type KeyValueStorage,
} from "../src/index";

const data: CompactEmoji[] = [
  { unicode: "😀", label: "grinning face", tags: ["face", "smile"], group: 0 },
  { unicode: "👋", label: "waving hand", group: 1 },
  { unicode: "🦰", label: "red hair", group: 2 },
  { unicode: "🏳️", label: "white flag", tags: ["flag"], group: 3 },
];
const keys = [{ key: "smileys-emotion" }, { key: "people-body" }, { key: "components" }, { key: "flags" }];

describe("buildEmojiGroups", () => {
  it("keeps only the groups it knows about", () => {
    expect(buildEmojiGroups(data, keys).map((group) => group.key)).toEqual([
      "smileys-emotion",
      "people-body",
      "flags",
    ]);
  });

  it("puts each emoji in the group its index points at", () => {
    const groups = buildEmojiGroups(data, keys);
    expect(groups[0]).toMatchObject({ label: "Smileys & Emotion", icon: "😀" });
    expect(groups[0].emojis).toEqual([{ char: "😀", label: "grinning face", tags: ["face", "smile"] }]);
    expect(groups[1].emojis).toEqual([{ char: "👋", label: "waving hand", tags: [] }]);
    expect(groups[2].emojis).toEqual([{ char: "🏳️", label: "white flag", tags: ["flag"] }]);
  });

  it("takes labels from the meta it is given", () => {
    const groups = buildEmojiGroups(data, keys, { flags: { label: "Banners", icon: "🚩" } });
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ key: "flags", label: "Banners", icon: "🚩" });
  });
});

describe("searchEmojis", () => {
  const groups = buildEmojiGroups(data, keys);

  it("needs a query", () => {
    expect(searchEmojis(groups, "")).toEqual([]);
    expect(searchEmojis(groups, "   ")).toEqual([]);
  });

  it("matches the label or a tag, whatever the case", () => {
    expect(searchEmojis(groups, "GRINNING").map((emoji) => emoji.char)).toEqual(["😀"]);
    expect(searchEmojis(groups, "smile").map((emoji) => emoji.char)).toEqual(["😀"]);
    expect(searchEmojis(groups, "hand").map((emoji) => emoji.char)).toEqual(["👋"]);
  });

  it("needs every word to match", () => {
    expect(searchEmojis(groups, "grinning face")).toHaveLength(1);
    expect(searchEmojis(groups, "face flag")).toEqual([]);
  });

  it("finds nothing when nothing matches", () => {
    expect(searchEmojis(groups, "zzz")).toEqual([]);
  });
});

/** A stand-in for localStorage, MMKV or anything else that keeps a string by key. */
function storage(initial?: string) {
  const entries = new Map<string, string>();
  if (initial !== undefined) entries.set(RECENT_EMOJIS_KEY, initial);
  return {
    entries,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
  } satisfies KeyValueStorage & { entries: Map<string, string> };
}

const broken: KeyValueStorage = {
  getItem: () => {
    throw new Error("unavailable");
  },
  setItem: () => {
    throw new Error("unavailable");
  },
};

describe("recent emojis", () => {
  it("has none without storage", () => {
    expect(readRecentEmojis(null)).toEqual([]);
    expect(readRecentEmojis(undefined)).toEqual([]);
    expect(() => rememberEmoji(undefined, "😀")).not.toThrow();
  });

  it("has none on first use, or when what is stored is unusable", () => {
    expect(readRecentEmojis(storage())).toEqual([]);
    expect(readRecentEmojis(storage('{"not":"an array"}'))).toEqual([]);
    expect(readRecentEmojis(storage("not json at all"))).toEqual([]);
    expect(readRecentEmojis(broken)).toEqual([]);
  });

  it("keeps only the strings it finds", () => {
    expect(readRecentEmojis(storage('["😀",5,null,"🎉"]'))).toEqual(["😀", "🎉"]);
  });

  it("remembers a new emoji at the front, once", () => {
    const store = storage();
    rememberEmoji(store, "😀");
    rememberEmoji(store, "🎉");
    rememberEmoji(store, "😀");
    expect(readRecentEmojis(store)).toEqual(["😀", "🎉"]);
  });

  it("keeps the newest few only", () => {
    const store = storage();
    for (let i = 0; i < RECENT_EMOJIS_MAX + 5; i++) rememberEmoji(store, `e${i}`);
    const recent = readRecentEmojis(store);
    expect(recent).toHaveLength(RECENT_EMOJIS_MAX);
    expect(recent[0]).toBe(`e${RECENT_EMOJIS_MAX + 4}`);
  });

  it("doesn't throw when the storage does", () => {
    expect(() => rememberEmoji(broken, "😀")).not.toThrow();
  });
});
