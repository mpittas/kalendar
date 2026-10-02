import { api } from "~/lib/api";
import { canonicalColor, COLOR_KEYS } from "~/lib/colors";
import type { ActivityTemplate, Category } from "~/lib/types";

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

/**
 * Shared category state. Everything that shows or edits categories (the sidebar, the pickers in
 * the editors and the manager dialog) reads the same list, so a change shows up everywhere at once.
 */
export const useCategories = () => {
  const categories = useState<Category[]>("categories", () => []);
  const loaded = useState("categories-loaded", () => false);
  const loadError = useState<string | null>("categories-error", () => null);

  const load = async (force = false) => {
    if (loaded.value && !force) return;
    try {
      categories.value = (await api.getCategories()).sort(byName);
      loadError.value = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load categories";
      // A 403 means the database rules don't know about categories yet (firestore.rules not deployed).
      loadError.value =
        message === "Not allowed" ? "the database rules don't allow categories yet. Deploy firestore.rules" : message;
    } finally {
      loaded.value = true;
    }
  };

  const create = async (draft: Omit<Category, "id">) => {
    const created = await api.createCategory(draft);
    categories.value = [...categories.value, created].sort(byName);
    return created;
  };

  const update = async (id: string, patch: Partial<Omit<Category, "id">>) => {
    const updated = await api.updateCategory(id, patch);
    categories.value = categories.value.map((c) => (c.id === id ? updated : c)).sort(byName);
    return updated;
  };

  const remove = async (id: string, moveTo?: string) => {
    await api.deleteCategory(id, moveTo);
    categories.value = categories.value.filter((c) => c.id !== id);
  };

  /** Pick a color not used yet, so a new category is easy to tell apart. */
  const nextColor = () => {
    const used = new Set(categories.value.map((c) => canonicalColor(c.color)));
    return COLOR_KEYS.find((key) => !used.has(key)) ?? COLOR_KEYS[categories.value.length % COLOR_KEYS.length];
  };

  /**
   * The color of an activity or block is its category's. The color saved with the item is only a
   * fallback while the category isn't known, e.g. before the list has loaded.
   */
  const colorOf = (item: { category: string; color?: string }) => {
    const name = item.category?.trim().toLowerCase();
    return categories.value.find((c) => c.name.toLowerCase() === name)?.color ?? item.color ?? "slate";
  };

  return { categories, loaded, loadError, load, create, update, remove, nextColor, colorOf };
};

/**
 * Saved categories plus any name the activities use that isn't saved (yet), so nothing
 * disappears from the UI if the two ever disagree. Unsaved ones have no `id`.
 */
export type CategoryEntry = Omit<Category, "id"> & { id: string | null };

export const withImplicitCategories = (saved: Category[], templates: ActivityTemplate[] = []): CategoryEntry[] => {
  const known = new Set(saved.map((c) => c.name.toLowerCase()));
  const extra = new Map<string, CategoryEntry>();
  for (const t of templates) {
    const name = t.category?.trim();
    if (name && !known.has(name.toLowerCase()) && !extra.has(name.toLowerCase())) {
      extra.set(name.toLowerCase(), { id: null, name, color: t.color || "slate" });
    }
  }
  return [...saved, ...extra.values()].sort(byName);
};
