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
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  bio?: string;
  phone?: string;
  timezone?: string;
  location?: string;
  weekStartsOnMonday?: boolean;
  defaultTaskDuration?: number;
  createdAt?: any;
  updatedAt?: any;
}

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

  const isConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "your-api-key" &&
    firebaseConfig.projectId
  );

  if (!isConfigured) {
    return { app: null, auth: null, db: null, isConfigured: false };
  }

  try {
    firebaseAppInstance = getApps().length
      ? getApp()
      : initializeApp(firebaseConfig);
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

export function useAuth() {
  const user = useState<User | null>("auth_user", () => null);
  const profile = useState<UserProfile | null>("auth_profile", () => null);
  const loading = useState<boolean>("auth_loading", () => true);
  const isConfigured = useState<boolean>("auth_is_configured", () => false);

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
        await loadProfile(firebaseUser.uid);
      } else {
        profile.value = null;
      }
      loading.value = false;
    });
  };

  const loadProfile = async (uid: string) => {
    // 1. Try local storage cache first for instant load
    let cachedProfile: UserProfile | null = null;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`dayforge_profile_${uid}`);
        if (stored) cachedProfile = JSON.parse(stored);
      } catch (e) {
        /* ignore */
      }
    }

    if (cachedProfile) {
      profile.value = cachedProfile;
    }

    const { db } = getFirebaseServices();
    if (!db) return cachedProfile;

    try {
      const docRef = doc(db, "dayforge_profiles", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const cloudProfile = docSnap.data() as UserProfile;
        profile.value = cloudProfile;
        if (typeof window !== "undefined") {
          localStorage.setItem(`dayforge_profile_${uid}`, JSON.stringify(cloudProfile));
        }
        return cloudProfile;
      } else if (user.value) {
        // Create initial profile if missing
        const initialProfile: UserProfile = {
          uid: user.value.uid,
          email: user.value.email,
          displayName: user.value.displayName || cachedProfile?.displayName || user.value.email?.split("@")[0] || "User",
          photoURL: user.value.photoURL || null,
          bio: cachedProfile?.bio || "",
          phone: cachedProfile?.phone || "",
          timezone: cachedProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          location: cachedProfile?.location || "",
          weekStartsOnMonday: cachedProfile?.weekStartsOnMonday ?? true,
          defaultTaskDuration: cachedProfile?.defaultTaskDuration ?? 60,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        try {
          await setDoc(docRef, { ...initialProfile, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        } catch (e) {
          // If firestore rules deny write, profile still persists locally
          console.warn("Firestore write skipped (local cache active):", e);
        }
        profile.value = initialProfile;
        if (typeof window !== "undefined") {
          localStorage.setItem(`dayforge_profile_${uid}`, JSON.stringify(initialProfile));
        }
        return initialProfile;
      }
    } catch (err) {
      console.warn("Could not fetch user profile from Firestore (using local data):", err);
    }
    return cachedProfile;
  };

  const updateProfileData = async (patch: Partial<UserProfile>) => {
    if (!user.value) throw new Error("You must be logged in to update profile");
    const { db, auth } = getFirebaseServices();

    const uid = user.value.uid;

    if (patch.displayName && auth?.currentUser) {
      try {
        await updateAuthProfile(auth.currentUser, {
          displayName: patch.displayName,
        });
      } catch (e) {
        console.warn("Could not update auth profile displayName:", e);
      }
    }

    const updatedData: UserProfile = {
      ...(profile.value || {
        uid,
        email: user.value.email,
        displayName: patch.displayName || "",
      }),
      ...patch,
      uid,
      email: user.value.email,
      updatedAt: new Date().toISOString(),
    };

    // Update in-memory and local storage immediately
    profile.value = updatedData;
    if (typeof window !== "undefined") {
      localStorage.setItem(`dayforge_profile_${uid}`, JSON.stringify(updatedData));
    }

    // Sync to Firestore if available
    if (db) {
      try {
        const docRef = doc(db, "dayforge_profiles", uid);
        await setDoc(docRef, { ...updatedData, updatedAt: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.warn("Firestore sync skipped (profile safely stored locally):", err);
      }
    }
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const { auth, db } = getFirebaseServices();
    if (!auth) throw new Error("Firebase Auth is not initialized. Please check credentials in .env.");

    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name && cred.user) {
      await updateAuthProfile(cred.user, { displayName: name });
    }

    const initialProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: name || email.split("@")[0],
      photoURL: null,
      bio: "",
      phone: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      location: "",
      weekStartsOnMonday: true,
      defaultTaskDuration: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(`dayforge_profile_${cred.user.uid}`, JSON.stringify(initialProfile));
    }

    if (db) {
      try {
        await setDoc(doc(db, "dayforge_profiles", cred.user.uid), {
          ...initialProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore profile write skipped:", e);
      }
    }

    profile.value = initialProfile;
    user.value = cred.user;
    return cred.user;
  };

  const login = async (email: string, pass: string) => {
    const { auth } = getFirebaseServices();
    if (!auth) throw new Error("Firebase Auth is not initialized. Please configure Firebase credentials.");

    const cred = await signInWithEmailAndPassword(auth, email, pass);
    user.value = cred.user;
    await loadProfile(cred.user.uid);
    return cred.user;
  };

  const loginWithGoogle = async () => {
    const { auth, db } = getFirebaseServices();
    if (!auth) throw new Error("Firebase Auth is not initialized. Please configure Firebase credentials.");

    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    user.value = cred.user;

    if (db && cred.user) {
      await loadProfile(cred.user.uid);
    }
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
  };

  return {
    user,
    profile,
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
