import { isValidISODate } from "~/lib/time";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const day = query.day as string | undefined;
  const from = query.from as string | undefined;
  const to = query.to as string | undefined;

  if (day && isValidISODate(day)) {
    const tasks = await storeOf(event).listTasksForDay(day);
    return { tasks };
  }

  if (from && to && isValidISODate(from) && isValidISODate(to)) {
    const tasks = await storeOf(event).listTasksBetween(from, to);
    return { tasks };
  }

  throw createError({
    statusCode: 400,
    statusMessage: "Provide ?day=YYYY-MM-DD or ?from=&to=",
  });
});
