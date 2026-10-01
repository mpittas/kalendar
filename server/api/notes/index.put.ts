import { isValidISODate } from "~/lib/time";
import { MAX_NOTES_LENGTH } from "~/server/utils/db";

export default defineEventHandler(async (event) => {
  const body = await readJsonObject(event);
  const day = String(body.day ?? "");

  if (!isValidISODate(day)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid day format (YYYY-MM-DD)" });
  }
  if (typeof body.text !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Notes must be text" });
  }
  if (body.text.length > MAX_NOTES_LENGTH) {
    throw createError({ statusCode: 413, statusMessage: `Notes can be at most ${MAX_NOTES_LENGTH} characters` });
  }

  return { dayNotes: await storeOf(event).setDayNotes(day, body.text) };
});
