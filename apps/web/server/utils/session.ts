/**
 * A verified caller. `idToken` is the caller's Firebase ID token, forwarded to
 * Firestore so the security rules apply; it is `null` only in local dev mode
 * when Firebase isn't configured.
 */
export type Session = { userId: string; idToken: string | null };

/** The verified session set by `server/middleware/auth.ts`. */
export function sessionOf(event: { context: Record<string, any> }): Session {
  const session = event.context.session as Session | undefined;
  if (!session?.userId) {
    throw createError({ statusCode: 401, statusMessage: "Sign in required" });
  }
  return session;
}
