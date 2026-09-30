export default defineEventHandler(async () => {
  const ok = await dbService.isHealthy();
  return { ok };
});
