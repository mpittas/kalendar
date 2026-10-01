import type { Category } from "~/lib/types";

export default defineEventHandler(async (event) => {
  const id = parseId(event);
  const body = await readJsonObject(event);
  const patch: Partial<Omit<Category, "id">> = {};

  if (body.name !== undefined) {
    const name = cleanText(body.name, MAX_CATEGORY);
    if (!name) throw createError({ statusCode: 400, statusMessage: "Name can't be empty" });
    patch.name = name;
  }
  if (isColorKey(body.color)) patch.color = body.color;

  const category = await storeOf(event).updateCategory(id, patch);
  if (!category) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }
  return { category };
});
