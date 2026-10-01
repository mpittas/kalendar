export default defineEventHandler(async (event) => {
  const moveTo = cleanText(getQuery(event).moveTo, MAX_CATEGORY) || null;
  const ok = await storeOf(event).deleteCategory(parseId(event), moveTo);
  if (!ok) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }
  return { ok: true };
});
