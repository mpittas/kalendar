import { isValidISODate } from "@klndr/core";

export default defineEventHandler(async (event) => {
  const body = await readJsonObject(event);
  const day = String(body.day ?? "");
  const title = cleanText(body.title, MAX_TITLE);

  if (!isValidISODate(day)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid day format (YYYY-MM-DD)" });
  }
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: "Title is required" });
  }

  const dayChecklist = await storeOf(event).addDayChecklistExtra(day, { title, emoji: cleanEmoji(body.emoji) });
  setResponseStatus(event, 201);
  return { dayChecklist };
});
