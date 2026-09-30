export default defineEventHandler(async (event) => {
  const body = await readJsonObject(event);
  const name = cleanText(body.name, MAX_NAME);
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Name is required" });
  }

  const template = await storeOf(event).createTemplate({
    name,
    emoji: cleanEmoji(body.emoji),
    color: cleanColor(body.color),
    category: cleanCategory(body.category),
    defaultDuration: clampDuration(body.defaultDuration),
    notes: cleanNotes(body.notes),
  });
  setResponseStatus(event, 201);
  return { template };
});
