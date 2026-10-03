import { describe, expect, it } from "vitest";
import { ACCEPTED_COLOR_KEYS, COLOR_KEYS, COLOR_LABELS, canonicalColor } from "../src/index";

describe("canonicalColor", () => {
  it("keeps a colour that is offered", () => {
    for (const key of COLOR_KEYS) expect(canonicalColor(key)).toBe(key);
  });

  it("shows a dropped colour as the option that replaced it", () => {
    expect(canonicalColor("sky")).toBe("indigo"); // sky and cyan were a second blue
    expect(canonicalColor("cyan")).toBe("indigo");
    expect(canonicalColor("teal")).toBe("emerald"); // teal and lime were a second green
    expect(canonicalColor("lime")).toBe("emerald");
  });

  it("falls back to indigo for anything unknown", () => {
    expect(canonicalColor("")).toBe("indigo");
    expect(canonicalColor("chartreuse")).toBe("indigo");
    expect(canonicalColor("Indigo")).toBe("indigo"); // keys are lower case
  });
});

describe("the palette", () => {
  it("accepts the twelve stored keys and offers eight of them", () => {
    expect(ACCEPTED_COLOR_KEYS).toHaveLength(12);
    expect(COLOR_KEYS).toHaveLength(8);
    for (const key of COLOR_KEYS) expect(ACCEPTED_COLOR_KEYS).toContain(key);
  });

  it("labels every accepted key", () => {
    for (const key of ACCEPTED_COLOR_KEYS) expect(COLOR_LABELS[key]).toBeTruthy();
    expect(COLOR_LABELS.indigo).toBe("Indigo");
    expect(COLOR_LABELS.slate).toBe("Slate");
  });
});
