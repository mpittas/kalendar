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
  deleteUser,
  EmailAuthProvider,
  OAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  revokeAccessToken,
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
  type Firestore,
} from "firebase/firestore";
import { cleanPatch, PROFILE_LIMITS, toProfile, type ProfilePatch, type UserProfile } from "@klndr/core";
import { api } from "~/lib/api";

// The profile model lives in @klndr/core. It is re-exported here so the web app keeps importing it
// from its composable, and so the auto-imports keep offering the same names as before the move.
export { DURATION_OPTIONS, PROFILE_LIMITS, cleanPatch, isValidTimeZone, toProfile } from "@klndr/core";
export type { ProfilePatch, UserProfile } from "@klndr/core";

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

// Profile loads already in flight, so the auth listener and a sign-in/sign-up
// flow never race to create the same document.
const profileLoads = new Map<string, Promise<UserProfile | null>>();
/** Name typed on the sign-up form, used when the profile document is first created. */
let pendingSignUpName: string | null = null;

/** The Apple provider, with the two scopes Firebase asks for on first sign-in. */
const appleProvider = () => {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  return provider;
};

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

  /**
   * Delete the account, in the only order that cannot leave a mess behind: re-authenticate (Firebase
   * asks for a recent sign-in), remove every document the user owns, revoke the Apple token when one
   * is linked — Apple requires that when an account is deleted — and then the Auth user itself.
   *
   * A password account passes its password; the popup providers re-authenticate with a popup.
   */
  const deleteAccount = async (options: { password?: string } = {}) => {
    const { auth } = getFirebaseServices();
    const current = auth?.currentUser;
    if (!auth || !current) throw new Error("You must be signed in to delete your account.");

    const providers = current.providerData.map((entry) => entry.providerId);
    // Apple wants the token it handed over revoked when the account goes. The popup is also how we
    // re-authenticate an Apple account, so the token comes back from that same response.
    let appleToken: string | null = null;

    if (providers.includes("password")) {
      if (!current.email) throw new Error("You must be signed in to delete your account.");
      if (!options.password) throw new Error("Enter your password to confirm.");
      await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, options.password));
    } else if (providers.includes("apple.com")) {
      const credential = await reauthenticateWithPopup(current, appleProvider());
      appleToken = OAuthProvider.credentialFromResult(credential)?.accessToken ?? null;
    } else if (providers.includes("google.com")) {
      await reauthenticateWithPopup(current, new GoogleAuthProvider());
    }

    // The data goes first: it is still authorized by the token we are holding.
    await api.deleteAccount();

    if (appleToken) {
      await revokeAccessToken(auth, appleToken).catch((err) => console.warn("Could not revoke the Apple token:", err));
    }

    await deleteUser(current);
    user.value = null;
    profile.value = null;
    profileError.value = null;
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

  /** Sign in with Apple, the other identity provider the app offers. */
  const loginWithApple = async () => {
    const { auth } = getFirebaseServices();
    if (!auth) throw new Error("Firebase Auth is not initialized. Please configure Firebase credentials.");

    const cred = await signInWithPopup(auth, appleProvider());
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
    loginWithApple,
    resetPassword,
    logout,
    deleteAccount,
    updateProfileData,
    loadProfile,
  };
}
