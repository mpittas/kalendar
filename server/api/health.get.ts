// Liveness only: unauthenticated, so it deliberately reports nothing about the database.
export default defineEventHandler(() => ({ ok: true }));
