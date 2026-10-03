import { isValidISODate } from "@klndr/core";

export default defineEventHandler(async (event) => {
  const id = parseId(event);
  const day = String(getQuery(event).day ?? "");
  if (!isValidISODate(day)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid day format (YYYY-MM-DD)" });
  }

  const dayChecklist = await storeOf(event).removeDayChecklistExtra(day, id);
  return { dayChecklist };
});
