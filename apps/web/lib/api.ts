import { createApiClient } from "@klndr/core";
import { getIdToken } from "~/composables/useAuth";

/** The web app's client: the current origin, authorized with the signed-in user's Firebase token. */
export const api = createApiClient({ getToken: getIdToken });
