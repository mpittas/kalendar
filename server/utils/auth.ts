import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Session } from "./session";

// Google publishes the public keys that sign Firebase ID tokens here.
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

/** Identity used only when Firebase isn't configured in development. */
const DEV_USER_ID = "local-dev";

/**
 * Verify the caller's Firebase ID token and return their session, or throw 401/503.
 * Fails closed: without Firebase config the API is only usable in dev mode.
 */
export async function requireSession(event: Parameters<typeof getHeader>[0]): Promise<Session> {
  const projectId = String(useRuntimeConfig().public.firebaseProjectId || "");

  if (!projectId) {
    if (import.meta.dev) return { userId: DEV_USER_ID, idToken: null };
    throw createError({ statusCode: 503, statusMessage: "Authentication is not configured" });
  }

  const header = getHeader(event, "authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    if (import.meta.dev) return { userId: DEV_USER_ID, idToken: null };
    throw createError({ statusCode: 401, statusMessage: "Sign in required" });
  }

  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
    });
    if (!payload.sub) throw new Error("missing subject");
    return { userId: payload.sub, idToken: token };
  } catch {
    throw createError({ statusCode: 401, statusMessage: "Invalid or expired session" });
  }
}
