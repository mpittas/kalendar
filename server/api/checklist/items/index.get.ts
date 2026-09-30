export default defineEventHandler(async (event) => {
  const items = await storeOf(event).listChecklistItems();
  return { items };
});
