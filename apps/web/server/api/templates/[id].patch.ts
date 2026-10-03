import type { ActivityTemplate } from "@klndr/core";

export default defineEventHandler(async (event) => {
  const id = parseId(event);
  const body = await readJsonObject(event);
  const patch: Partial<Omit<ActivityTemplate, "id">> = {};

  const name = cleanText(body.name, MAX_NAME);
  if (name) patch.name = name;
  if (cleanText(body.emoji, MAX_EMOJI)) patch.emoji = cleanEmoji(body.emoji);
  if (isColorKey(body.color)) patch.color = body.color;
  if (cleanText(body.category, MAX_CATEGORY)) patch.category = await canonicalCategory(event, body.category);
  if (isNumeric(body.defaultDuration)) patch.defaultDuration = clampDuration(body.defaultDuration);
  if (body.notes !== undefined) patch.notes = cleanNotes(body.notes);
  if (typeof body.archived === "boolean") patch.archived = body.archived;

  const template = await storeOf(event).updateTemplate(id, patch);
  if (!template) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }
  return { template };
});
