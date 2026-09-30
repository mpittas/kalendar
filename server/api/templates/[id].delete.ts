export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, "id");
  const id = Number.parseInt(idParam ?? "", 10);
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid id" });
  }
  const ok = await dbService.deleteTemplate(id);
  if (!ok) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }
  return { ok: true };
});
