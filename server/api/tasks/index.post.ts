import { COLOR_KEYS } from "~/lib/colors";
import { isValidISODate, snapMinutes } from "~/lib/time";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const day = body?.day;
  if (!isValidISODate(day)) {
    throw createError({ statusCode: 400, statusMessage: "day must be YYYY-MM-DD" });
  }

  let templateId: number | null = null;
  if (body.templateId !== undefined && body.templateId !== null) {
    const parsed = Number.parseInt(String(body.templateId), 10);
    if (!Number.isNaN(parsed)) {
      templateId = parsed;
    }
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: "Title is required" });
  }

  const color = String(body.color ?? "indigo");
  const startMinutes = snapMinutes(Number(body.startMinutes ?? 540), 15);
  const rawDuration = Number(body.durationMinutes ?? 60);
  const durationMinutes = Math.max(
    15,
    Math.min(24 * 60, Math.round((Number.isNaN(rawDuration) ? 60 : rawDuration) / 15) * 15),
  );

  const task = await dbService.createTask({
    templateId,
    title: title.slice(0, 120),
    emoji: String(body.emoji ?? "📌").slice(0, 8) || "📌",
    color: (COLOR_KEYS as string[]).includes(color) ? color : "indigo",
    category: (String(body.category ?? "General").trim() || "General").slice(0, 40),
    day,
    startMinutes: Math.max(0, Math.min(24 * 60 - 15, startMinutes)),
    durationMinutes,
    notes: body.notes ? String(body.notes).slice(0, 500) : null,
    completed: body.completed === true,
  });

  setResponseStatus(event, 201);
  return { task };
});
