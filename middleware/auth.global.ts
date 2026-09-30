const PUBLIC_PATHS = new Set(["/login", "/signup"]);

/** Send signed-out visitors to the login page. The API enforces auth independently. */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server || PUBLIC_PATHS.has(to.path)) return;

  const { auth } = getFirebaseServices();
  if (!auth) return; // Firebase not configured: local development mode

  await auth.authStateReady();
  if (!auth.currentUser) {
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
  }
});
