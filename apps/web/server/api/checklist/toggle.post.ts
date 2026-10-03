import { isValidISODate } from "@klndr/core";

export default defineEventHandler(async (event) => {
  const body = await readJsonObject(event);
  const day = String(body.day ?? "");
  const itemId = String(body.itemId ?? "");
  const completed = Boolean(body.completed);

  if (!isValidISODate(day)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid day format (YYYY-MM-DD)" });
  }
  if (!isDocId(itemId)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid itemId" });
  }

  const dayChecklist = await storeOf(event).toggleDayChecklistItem(day, itemId, completed);
  return { dayChecklist };
});
