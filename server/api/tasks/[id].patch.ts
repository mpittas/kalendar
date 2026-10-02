import { isValidISODate } from "~/lib/time";
import type { ScheduledTask } from "~/lib/types";

export default defineEventHandler(async (event) => {
  const id = parseId(event);
  const body = await readJsonObject(event);
  const patch: Partial<Omit<ScheduledTask, "id" | "templateId">> = {};

  const title = cleanText(body.title, MAX_TITLE);
  if (title) patch.title = title;
  if (cleanText(body.emoji, MAX_EMOJI)) patch.emoji = cleanEmoji(body.emoji);
  if (isColorKey(body.color)) patch.color = body.color;
  if (cleanText(body.category, MAX_CATEGORY)) patch.category = await canonicalCategory(event, body.category);
  if (isValidISODate(body.day)) patch.day = body.day;
  if (isNumeric(body.startMinutes)) patch.startMinutes = clampStart(body.startMinutes);
  if (isNumeric(body.durationMinutes)) patch.durationMinutes = clampDuration(body.durationMinutes);
  if (body.notes !== undefined) patch.notes = cleanNotes(body.notes);
  if (typeof body.completed === "boolean") patch.completed = body.completed;
  if (isNumeric(body.lane)) patch.lane = clampLane(body.lane);

  const task = await storeOf(event).updateTask(id, patch);
  if (!task) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }
  return { task };
});
