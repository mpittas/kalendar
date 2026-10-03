export default defineEventHandler(async (event) => {
  const templates = await storeOf(event).listTemplates();
  return { templates };
});
