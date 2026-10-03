import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as updateAuthProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from "firebase/firestore";

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

let firebaseAppInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function getFirebaseServices() {
  if (!import.meta.client) {
    return { app: null, auth: null, db: null, isConfigured: false };
  }

  if (authInstance && dbInstance) {
    return {
      app: firebaseAppInstance,
      auth: authInstance,
      db: dbInstance,
      isConfigured: true,
    };
  }

  const config = useRuntimeConfig().public;
  const firebaseConfig = {
    apiKey: String(config.firebaseApiKey || ""),
    authDomain: String(config.firebaseAuthDomain || ""),
    projectId: String(config.firebaseProjectId || ""),
    storageBucket: String(config.firebaseStorageBucket || ""),
    messagingSenderId: String(config.firebaseMessagingSenderId || ""),
    appId: String(config.firebaseAppId || ""),
  };

  const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

  if (!isConfigured) {
    return { app: null, auth: null, db: null, isConfigured: false };
  }

  try {
    firebaseAppInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(firebaseAppInstance);
    dbInstance = getFirestore(firebaseAppInstance);
    return {
      app: firebaseAppInstance,
      auth: authInstance,
      db: dbInstance,
      isConfigured: true,
    };
  } catch (err) {
    console.error("Firebase initialization failed:", err);
    return { app: null, auth: null, db: null, isConfigured: false };
  }
}

/**
 * Current user's Firebase ID token for authenticating API calls, or null when
 * signed out / Firebase is not configured. Waits for the initial auth check.
 */
export async function getIdToken(): Promise<string | null> {
  const { auth } = getFirebaseServices();
  if (!auth) return null;
  await auth.authStateReady();
  return (await auth.currentUser?.getIdToken()) ?? null;
}

const isoOf = (value: unknown): string | undefined =>
  value instanceof Timestamp ? value.toDate().toISOString() : undefined;

/** Keep only the known profile fields from a Firestore document. */
function toProfile(uid: string, data: Record<string, any>): UserProfile {
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
function cleanPatch(patch: ProfilePatch): Record<string, string | number | boolean> {
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

// Profile loads already in flight, so the auth listener and a sign-in/sign-up
// flow never race to create the same document.
const profileLoads = new Map<string, Promise<UserProfile | null>>();
// Name typed on the sign-up form, used when the profile document is first created.
let pendingSignUpName: string | null = null;

export function useAuth() {
  const user = useState<User | null>("auth_user", () => null);
  const profile = useState<UserProfile | null>("auth_profile", () => null);
  const profileError = useState<string | null>("auth_profile_error", () => null);
  const loading = useState<boolean>("auth_loading", () => true);
  // Derived from runtime config so server and client render the same thing.
  const isConfigured = useState<boolean>("auth_is_configured", () => {
    const config = useRuntimeConfig().public;
    return Boolean(config.firebaseApiKey && config.firebaseProjectId);
  });

  const initAuth = () => {
    if (!import.meta.client) return;

    const services = getFirebaseServices();
    isConfigured.value = services.isConfigured;

    if (!services.isConfigured || !services.auth) {
      loading.value = false;
      return;
    }

    onAuthStateChanged(services.auth, async (firebaseUser) => {
      user.value = firebaseUser;
      if (firebaseUser) {
        await loadProfile(firebaseUser);
      } else {
        profile.value = null;
        profileError.value = null;
      }
      loading.value = false;
    });
  };

  /** Read `users/{uid}`, creating it on first sign-in. */
  const loadProfile = (firebaseUser: User): Promise<UserProfile | null> => {
    const existing = profileLoads.get(firebaseUser.uid);
    if (existing) return existing;

    const run = (async () => {
      const { db } = getFirebaseServices();
      if (!db) return null;
      const ref = doc(db, "users", firebaseUser.uid);

      try {
        let snap = await getDoc(ref);
        if (!snap.exists()) {
          const email = firebaseUser.email;
          const displayName = (
            pendingSignUpName || firebaseUser.displayName || email?.split("@")[0] || "User"
          ).slice(0, PROFILE_LIMITS.displayName);
          await setDoc(ref, {
            uid: firebaseUser.uid,
            email: email ?? null,
            displayName,
            photoURL: firebaseUser.photoURL ?? null,
            bio: "",
            phone: "",
            location: "",
            timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC").slice(0, PROFILE_LIMITS.timezone),
            weekStartsOnMonday: true,
            defaultTaskDuration: 60,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          snap = await getDoc(ref);
        }
        const loaded = snap.exists() ? toProfile(firebaseUser.uid, snap.data()) : null;
        profile.value = loaded;
        profileError.value = null;
        return loaded;
      } catch (err) {
        console.error("Could not load profile:", err);
        profile.value = null;
        profileError.value = "We couldn't load your profile. Check your connection and try again.";
        return null;
      }
    })().finally(() => profileLoads.delete(firebaseUser.uid));

    profileLoads.set(firebaseUser.uid, run);
    return run;
  };

  /** Save edits to the signed-in user's profile. Throws if validation or the write fails. */
  const updateProfileData = async (patch: ProfilePatch) => {
    const { db, auth } = getFirebaseServices();
    const current = auth?.currentUser;
    if (!db || !current) throw new Error("You must be signed in to update your profile.");

    const changes = cleanPatch(patch);
    if (Object.keys(changes).length === 0) return profile.value;

    // The document is created on sign-in; make sure it exists before updating.
    if (!profile.value) await loadProfile(current);

    try {
      await updateDoc(doc(db, "users", current.uid), { ...changes, updatedAt: serverTimestamp() });
    } catch (err: any) {
      console.error("Profile save failed:", err);
      throw new Error(
        err?.code === "permission-denied"
          ? "Your changes were rejected. Check the values and try again."
          : "Couldn't save your profile. Check your connection and try again.",
      );
    }

    if (typeof changes.displayName === "string" && current.displayName !== changes.displayName) {
      try {
        await updateAuthProfile(current, { displayName: changes.displayName });
      } catch (err) {
        console.warn("Could not update auth display name:", err);
      }
    }

    const snap = await getDoc(doc(db, "users", current.uid));
    if (snap.exists()) profile.value = toProfile(current.uid, snap.data());
    return profile.value;
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const { auth } = getFirebaseServices();
    if (!auth) throw new Error("Firebase Auth is not initialized. Please check credentials in .env.");

    // Set first: the auth listener creates the profile document the moment the account exists.
    pendingSignUpName = name.trim() || null;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (pendingSignUpName) {
        await updateAuthProfile(cred.user, { displayName: pendingSignUpName }).catch(() => {});
      }
      await loadProfile(cred.user);
      user.value = cred.user;
      return cred.user;
    } finally {
      pendingSignUpName = null;
    }
  };

  const login = async (email: string, pass: string) => {
    const { auth } = getFirebaseServices();
    if (!auth) throw new Error("Firebase Auth is not initialized. Please configure Firebase credentials.");

    const cred = await signInWithEmailAndPassword(auth, email, pass);
    user.value = cred.user;
    await loadProfile(cred.user);
    return cred.user;
  };

  const loginWithGoogle = async () => {
    const { auth } = getFirebaseServices();
    if (!auth) throw new Error("Firebase Auth is not initialized. Please configure Firebase credentials.");

    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    user.value = cred.user;
    await loadProfile(cred.user);
    return cred.user;
  };

  const resetPassword = async (email: string) => {
    const { auth } = getFirebaseServices();
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    const { auth } = getFirebaseServices();
    if (auth) {
      await signOut(auth);
    }
    user.value = null;
    profile.value = null;
    profileError.value = null;
  };

  return {
    user,
    profile,
    profileError,
    loading,
    isConfigured,
    initAuth,
    signUp,
    login,
    loginWithGoogle,
    resetPassword,
    logout,
    updateProfileData,
    loadProfile,
  };
}
