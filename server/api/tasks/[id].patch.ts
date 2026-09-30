import { COLOR_KEYS } from "~/lib/colors";
import { isValidISODate, snapMinutes } from "~/lib/time";

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, "id");
  const id = Number.parseInt(idParam ?? "", 10);
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid id" });
  }

  const body = await readBody(event);
  const patch: Record<string, any> = {};

  if (typeof body.title === "string" && body.title.trim()) {
    patch.title = body.title.trim().slice(0, 120);
  }
  if (typeof body.emoji === "string" && body.emoji.trim()) {
    patch.emoji = body.emoji.trim().slice(0, 8);
  }
  if (typeof body.color === "string" && (COLOR_KEYS as string[]).includes(body.color)) {
    patch.color = body.color;
  }
  if (typeof body.category === "string" && body.category.trim()) {
    patch.category = body.category.trim().slice(0, 40);
  }
  if (isValidISODate(body.day)) {
    patch.day = body.day;
  }
  if (body.startMinutes !== undefined) {
    const raw = Number(body.startMinutes);
    if (!Number.isNaN(raw)) {
      patch.startMinutes = Math.max(0, Math.min(24 * 60 - 15, snapMinutes(raw, 15)));
    }
  }
  if (body.durationMinutes !== undefined) {
    const raw = Number(body.durationMinutes);
    if (!Number.isNaN(raw)) {
      patch.durationMinutes = Math.max(15, Math.min(24 * 60, snapMinutes(raw, 15)));
    }
  }
  if (body.notes !== undefined) {
    patch.notes = body.notes ? String(body.notes).slice(0, 500) : null;
  }
  if (typeof body.completed === "boolean") {
    patch.completed = body.completed;
  }

  const task = await dbService.updateTask(id, patch);
  if (!task) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }
  return { task };
});
