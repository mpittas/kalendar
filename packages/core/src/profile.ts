/** Shape of `users/{uid}` in Firestore; `firestore.rules` enforces the same limits. */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL?: string | null;
  bio?: string;
  phone?: string;
  timezone: string;
  location?: string;
  weekStartsOnMonday: boolean;
  defaultTaskDuration: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Fields the signed-in user may edit from the profile page. */
export type ProfilePatch = Partial<
  Pick<
    UserProfile,
    "displayName" | "bio" | "phone" | "location" | "timezone" | "weekStartsOnMonday" | "defaultTaskDuration"
  >
>;

export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;
export const PROFILE_LIMITS = { displayName: 80, bio: 500, phone: 40, location: 100, timezone: 64 } as const;

/** A Firestore-style timestamp, or anything else that hands back a Date. */
const isoOf = (value: unknown): string | undefined => {
  const toDate = (value as { toDate?: unknown } | null | undefined)?.toDate;
  if (typeof toDate !== "function") return undefined;
  return (toDate as () => Date).call(value).toISOString();
};

/** Keep only the known profile fields from a stored document. */
export function toProfile(uid: string, data: Record<string, any>): UserProfile {
  return {
    uid,
    email: data.email ?? null,
    displayName: data.displayName ?? "",
    photoURL: data.photoURL ?? null,
    bio: data.bio ?? "",
    phone: data.phone ?? "",
    location: data.location ?? "",
    timezone: data.timezone ?? "UTC",
    weekStartsOnMonday: data.weekStartsOnMonday !== false,
    defaultTaskDuration: Number(data.defaultTaskDuration) || 60,
    createdAt: isoOf(data.createdAt),
    updatedAt: isoOf(data.updatedAt),
  };
}

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Validate and normalise a profile edit; throws a user-readable Error. */
export function cleanPatch(patch: ProfilePatch): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};

  if (patch.displayName !== undefined) {
    const name = patch.displayName.trim();
    if (!name) throw new Error("Display name can't be empty.");
    if (name.length > PROFILE_LIMITS.displayName) throw new Error(`Display name must be ${PROFILE_LIMITS.displayName} characters or fewer.`);
    out.displayName = name;
  }
  if (patch.bio !== undefined) {
    const bio = patch.bio.trim();
    if (bio.length > PROFILE_LIMITS.bio) throw new Error(`Bio must be ${PROFILE_LIMITS.bio} characters or fewer.`);
    out.bio = bio;
  }
  if (patch.phone !== undefined) {
    const phone = patch.phone.trim();
    if (phone.length > PROFILE_LIMITS.phone || !/^[0-9+()\-.\s]*$/.test(phone)) {
      throw new Error("Phone number can only contain digits, spaces and + ( ) - .");
    }
    out.phone = phone;
  }
  if (patch.location !== undefined) {
    const location = patch.location.trim();
    if (location.length > PROFILE_LIMITS.location) throw new Error(`Location must be ${PROFILE_LIMITS.location} characters or fewer.`);
    out.location = location;
  }
  if (patch.timezone !== undefined) {
    const tz = patch.timezone.trim();
    if (!tz || tz.length > PROFILE_LIMITS.timezone || !isValidTimeZone(tz)) {
      throw new Error("Timezone isn't recognised. Use a name like Europe/Nicosia or UTC.");
    }
    out.timezone = tz;
  }
  if (patch.weekStartsOnMonday !== undefined) out.weekStartsOnMonday = Boolean(patch.weekStartsOnMonday);
  if (patch.defaultTaskDuration !== undefined) {
    const minutes = Number(patch.defaultTaskDuration);
    if (!(DURATION_OPTIONS as readonly number[]).includes(minutes)) throw new Error("Choose one of the listed block durations.");
    out.defaultTaskDuration = minutes;
  }
  return out;
}
