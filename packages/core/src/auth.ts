/**
 * What signing in and signing up say to the person doing it. The wording is the web app's (login.vue and
 * signup.vue), kept here so the phone says the same things without a second copy to drift.
 */

export const MIN_PASSWORD_LENGTH = 8;

export type AuthContext = "sign-in" | "sign-up" | "reset";

const FALLBACK: Record<AuthContext, string> = {
  "sign-in": "An unexpected error occurred while logging in.",
  "sign-up": "Failed to create account. Please try again.",
  reset: "Could not send the reset email. Please try again.",
};

/** A Firebase error's `code` (`auth/wrong-password`, …), or an empty string for anything else. */
const codeOf = (error: unknown): string => {
  const code = (error as { code?: unknown } | null | undefined)?.code;
  return typeof code === "string" ? code : "";
};

/**
 * A message fit to show, from whatever a sign-in call threw. A Firebase code gets the friendly wording;
 * anything else keeps its own message (the SDK's are readable), and a bare failure gets the fallback for
 * the screen it happened on.
 */
export function authErrorMessage(error: unknown, context: AuthContext = "sign-in"): string {
  const code = codeOf(error);
  if (code.includes("invalid-email")) return "Please enter a valid email address.";
  if (code.includes("too-many-requests")) return "Too many failed attempts. Please try again in a few minutes.";
  if (code.includes("network-request-failed")) return "Can't reach the server. Check your connection and try again.";
  if (context === "sign-up") {
    if (code.includes("email-already-in-use")) return "An account with this email already exists. Please log in instead.";
    if (code.includes("weak-password")) return `Password is too weak. Please use at least ${MIN_PASSWORD_LENGTH} characters.`;
  } else if (
    code.includes("user-not-found") ||
    code.includes("wrong-password") ||
    code.includes("invalid-credential")
  ) {
    return context === "reset" ? FALLBACK.reset : "Invalid email or password. Please verify your credentials.";
  }
  const message = (error as { message?: unknown } | null | undefined)?.message;
  return typeof message === "string" && message ? message : FALLBACK[context];
}

/** The first thing wrong with a sign-up form, or null when it can be sent. */
export function signUpProblem(form: { name: string; email: string; password: string; confirmPassword: string }): string | null {
  if (!form.email.trim() || !form.password || !form.name.trim()) return "Please fill in all required fields.";
  if (form.password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  if (form.password !== form.confirmPassword) return "Passwords do not match.";
  return null;
}

/** The first thing wrong with a sign-in form, or null when it can be sent. */
export function signInProblem(form: { email: string; password: string }): string | null {
  return !form.email.trim() || !form.password ? "Please fill in all fields." : null;
}
