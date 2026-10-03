/**
 * Delete every document the caller owns: the collections, the one-time seed markers, then the profile
 * document. The client deletes the Auth user itself afterwards, because Firebase only lets the signed
 * in user do that (and asks for a recent sign-in, which is why the UI re-authenticates first).
 */
export default defineEventHandler(async (event) => {
  await storeOf(event).deleteAccount();
  return { ok: true };
});