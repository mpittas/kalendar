import { COLOR_KEYS } from "~/lib/colors";

function clampDuration(value: unknown): number {
  const num = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(num)) return 60;
  return Math.max(15, Math.min(24 * 60, Math.round(num / 15) * 15));
}

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, "id");
  const id = Number.parseInt(idParam ?? "", 10);
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid id" });
  }
  const body = await readBody(event);
  const patch: Record<string, any> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.emoji === "string" && body.emoji.trim()) patch.emoji = body.emoji.trim();
  if (typeof body.color === "string" && (COLOR_KEYS as string[]).includes(body.color)) patch.color = body.color;
  if (typeof body.category === "string" && body.category.trim()) patch.category = body.category.trim();
  if (body.defaultDuration !== undefined) patch.defaultDuration = clampDuration(body.defaultDuration);
  if (body.notes !== undefined) patch.notes = body.notes ? String(body.notes).slice(0, 500) : null;
  if (typeof body.archived === "boolean") patch.archived = body.archived;

  const template = await dbService.updateTemplate(id, patch);
  if (!template) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }
  return { template };
});
