import { isValidISODate } from "~/lib/time";

export default defineEventHandler(async (event) => {
  const body = await readJsonObject(event);
  const day = body.day;
  if (!isValidISODate(day)) {
    throw createError({ statusCode: 400, statusMessage: "day must be YYYY-MM-DD" });
  }

  const title = cleanText(body.title, MAX_TITLE);
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: "Title is required" });
  }

  const task = await storeOf(event).createTask({
    templateId: isDocId(body.templateId) ? body.templateId : null,
    title,
    emoji: cleanEmoji(body.emoji),
    color: cleanColor(body.color),
    category: await canonicalCategory(event, body.category),
    day,
    startMinutes: clampStart(body.startMinutes),
    durationMinutes: clampDuration(body.durationMinutes),
    notes: cleanNotes(body.notes),
    completed: body.completed === true,
    // Set when a deleted block is brought back by undo, so it returns to its column.
    ...(isNumeric(body.lane) ? { lane: clampLane(body.lane) } : {}),
  });

  setResponseStatus(event, 201);
  return { task };
});
