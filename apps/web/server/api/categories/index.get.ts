export default defineEventHandler(async (event) => {
  const categories = await storeOf(event).listCategories();
  return { categories };
});
