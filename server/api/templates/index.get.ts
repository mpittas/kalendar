export default defineEventHandler(async () => {
  const templates = await dbService.listTemplates();
  return { templates };
});
