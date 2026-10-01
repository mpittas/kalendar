/**
 * The canonical category name for a value coming from a request, creating the category if it's
 * new. A failure here (e.g. rules not yet updated) must not block saving an activity or task, so
 * it falls back to the plain cleaned name.
 */
export async function canonicalCategory(event: Parameters<typeof storeOf>[0], value: unknown): Promise<string> {
  const name = cleanCategory(value);
  try {
    return await storeOf(event).ensureCategory(name);
  } catch (err) {
    console.warn("Could not ensure category:", err instanceof Error ? err.message : err);
    return name;
  }
}
