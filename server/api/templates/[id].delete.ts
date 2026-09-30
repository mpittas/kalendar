export default defineEventHandler(async (event) => {
  const ok = await storeOf(event).deleteTemplate(parseId(event));
  if (!ok) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }
  return { ok: true };
});
