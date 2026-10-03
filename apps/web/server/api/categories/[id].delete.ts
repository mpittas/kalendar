export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const moveTo = cleanText(query.moveTo, MAX_CATEGORY) || null;
  const deleteActivities = query.deleteActivities === "1";
  const ok = await storeOf(event).deleteCategory(parseId(event), moveTo, deleteActivities);
  if (!ok) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }
  return { ok: true };
});
