import { isDocId } from "@klndr/core";

// The pure helpers live in @klndr/core; they are re-exported from `server/utils` so nitro's
// auto-imports keep finding them exactly as they did before the move.
export {
  MAX_CATEGORY,
  MAX_EMOJI,
  MAX_NAME,
  MAX_NOTES,
  MAX_TITLE,
  clampDuration,
  clampLane,
  clampStart,
  cleanCategory,
  cleanColor,
  cleanEmoji,
  cleanNotes,
  cleanText,
  isColorKey,
  isDocId,
  isNumeric,
} from "@klndr/core";

export function parseId(event: Parameters<typeof getRouterParam>[0]): string {
  const id = getRouterParam(event, "id") ?? "";
  if (!isDocId(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid id" });
  }
  return id;
}

export async function readJsonObject(
  event: Parameters<typeof readBody>[0],
): Promise<Record<string, unknown>> {
  const body = await readBody(event);
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: "Expected a JSON object body" });
  }
  return body as Record<string, unknown>;
}
