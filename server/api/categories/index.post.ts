export default defineEventHandler(async (event) => {
  const body = await readJsonObject(event);
  const name = cleanText(body.name, MAX_CATEGORY);
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Name is required" });
  }

  const category = await storeOf(event).createCategory({
    name,
    color: cleanColor(body.color),
  });
  setResponseStatus(event, 201);
  return { category };
});
