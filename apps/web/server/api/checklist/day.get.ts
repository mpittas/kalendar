import { isValidISODate, todayISO } from "@klndr/core";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const day = typeof query.day === "string" && isValidISODate(query.day) ? query.day : todayISO();
  const dayChecklist = await storeOf(event).getDayChecklist(day);
  return { dayChecklist };
});
