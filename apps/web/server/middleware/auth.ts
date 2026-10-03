/** Every API route except the health probe requires a verified user. */
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  if (!path.startsWith("/api/") || path === "/api/health") return;
  event.context.session = await requireSession(event);
});
