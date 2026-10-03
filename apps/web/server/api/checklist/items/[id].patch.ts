import type { ChecklistItem } from "@klndr/core";

export default defineEventHandler(async (event) => {
  const id = parseId(event);
  const body = await readJsonObject(event);
  const patch: Partial<Omit<ChecklistItem, "id">> = {};

  const title = cleanText(body.title, MAX_TITLE);
  if (title) patch.title = title;
  if (cleanText(body.emoji, MAX_EMOJI)) patch.emoji = cleanEmoji(body.emoji);
  if (typeof body.order === "number") patch.order = body.order;
  if (typeof body.archived === "boolean") patch.archived = body.archived;

  const item = await storeOf(event).updateChecklistItem(id, patch);
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }
  return { item };
});
