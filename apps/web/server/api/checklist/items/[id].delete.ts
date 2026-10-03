export default defineEventHandler(async (event) => {
  const id = parseId(event);
  const ok = await storeOf(event).deleteChecklistItem(id);
  if (!ok) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }
  return { ok: true };
});
