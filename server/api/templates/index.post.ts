import { COLOR_KEYS } from "~/lib/colors";

function clampDuration(value: unknown): number {
  const num = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(num)) return 60;
  return Math.max(15, Math.min(24 * 60, Math.round(num / 15) * 15));
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const name = String(body?.name ?? "").trim();
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Name is required" });
  }
  const color = String(body.color ?? "indigo");
  const template = await dbService.createTemplate({
    name: name.slice(0, 80),
    emoji: String(body.emoji ?? "📌").slice(0, 8) || "📌",
    color: (COLOR_KEYS as string[]).includes(color) ? color : "indigo",
    category: (String(body.category ?? "General").trim() || "General").slice(0, 40),
    defaultDuration: clampDuration(body.defaultDuration),
    notes: body.notes ? String(body.notes).slice(0, 500) : null,
  });
  setResponseStatus(event, 201);
  return { template };
});
