export default defineEventHandler(async (event) => {
  const body = await readJsonObject(event);
  const title = cleanText(body.title, MAX_TITLE);
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: "Title is required" });
  }

  const order = typeof body.order === "number" ? body.order : 0;
  const item = await storeOf(event).createChecklistItem({
    title,
    emoji: cleanEmoji(body.emoji),
    order,
  });
  setResponseStatus(event, 201);
  return { item };
});
