import { colorOfCategory, nextCategoryColor, sortCategoriesByName, type Category } from "@klndr/core";
import { api } from "~/lib/api";

/**
 * Shared category state. Everything that shows or edits categories (the sidebar, the pickers in
 * the editors and the manager dialog) reads the same list, so a change shows up everywhere at once.
 * The pure parts — sorting, the implicit names, the colors — come from @klndr/core.
 */
export const useCategories = () => {
  const categories = useState<Category[]>("categories", () => []);
  const loaded = useState("categories-loaded", () => false);
  const loadError = useState<string | null>("categories-error", () => null);

  const load = async (force = false) => {
    if (loaded.value && !force) return;
    try {
      categories.value = sortCategoriesByName(await api.getCategories());
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
    categories.value = sortCategoriesByName([...categories.value, created]);
    return created;
  };

  /**
   * `apply` runs in the same tick the list changes, so a caller can relabel the activities of a
   * renamed category before anything renders. Otherwise, for one frame, the new name shows up empty
   * and the activities under the old name show up as a second, unsaved category.
   */
  const update = async (id: string, patch: Partial<Omit<Category, "id">>, apply?: (updated: Category) => void) => {
    const updated = await api.updateCategory(id, patch);
    apply?.(updated);
    categories.value = sortCategoriesByName(categories.value.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const remove = async (id: string, target?: { moveTo: string } | { deleteActivities: true }) => {
    await api.deleteCategory(id, target);
    categories.value = categories.value.filter((c) => c.id !== id);
  };

  /** Pick a color not used yet, so a new category is easy to tell apart. */
  const nextColor = () => nextCategoryColor(categories.value);

  /** The color of an activity or block is its category's, falling back to the item's own. */
  const colorOf = (item: { category: string; color?: string }) => colorOfCategory(categories.value, item);

  return { categories, loaded, loadError, load, create, update, remove, nextColor, colorOf };
};
