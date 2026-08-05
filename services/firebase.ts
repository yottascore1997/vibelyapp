import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  Auth,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  ApplicationVerifier,
  ConfirmationResult,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

type FirebaseExtra = {
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
};

export function getFirebaseWebConfig() {
  const extra = (Constants.expoConfig?.extra || {}) as FirebaseExtra;
  return {
    apiKey:
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY || extra.firebaseApiKey || "",
    authDomain:
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      extra.firebaseAuthDomain ||
      "",
    projectId:
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
      extra.firebaseProjectId ||
      "",
    storageBucket:
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      extra.firebaseStorageBucket ||
      "",
    messagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      extra.firebaseMessagingSenderId ||
      "",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || extra.firebaseAppId || "",
  };
}

export function isFirebaseConfigured() {
  const c = getFirebaseWebConfig();
  return Boolean(c.apiKey && c.authDomain && c.projectId && c.appId);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase config missing. Set EXPO_PUBLIC_FIREBASE_* in mobile/.env"
    );
  }
  const config = getFirebaseWebConfig();
  app = getApps().length ? getApp() : initializeApp(config);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const firebaseApp = getFirebaseApp();
  try {
    auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    // Already initialized (hot reload / second call)
    auth = getAuth(firebaseApp);
  }
  return auth;
}

/** Normalize Indian mobiles to E.164 (+91xxxxxxxxxx) */
export function toE164(input: string, defaultCountry = "91"): string {
  const raw = input.trim();
  const noSpace = raw.replace(/\s/g, "");
  if (noSpace.startsWith("+") && /^\+\d{10,15}$/.test(noSpace)) {
    return noSpace;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+${defaultCountry}${digits}`;
  if (digits.length === 12 && digits.startsWith(defaultCountry)) {
    return `+${digits}`;
  }
  if (digits.length > 10) return `+${digits}`;
  throw new Error("Enter a valid 10-digit mobile number");
}

export async function sendPhoneOtp(
  phoneE164: string,
  verifier: ApplicationVerifier
): Promise<ConfirmationResult> {
  const a = getFirebaseAuth();
  return signInWithPhoneNumber(a, phoneE164, verifier);
}

export async function confirmPhoneOtp(
  confirmation: ConfirmationResult,
  code: string
) {
  const result = await confirmation.confirm(code.trim());
  const idToken = await result.user.getIdToken(true);
  return {
    idToken,
    uid: result.user.uid,
    phone: result.user.phoneNumber,
  };
}

export async function confirmWithVerificationId(
  verificationId: string,
  code: string
) {
  const a = getFirebaseAuth();
  const credential = PhoneAuthProvider.credential(verificationId, code.trim());
  const result = await signInWithCredential(a, credential);
  const idToken = await result.user.getIdToken(true);
  return {
    idToken,
    uid: result.user.uid,
    phone: result.user.phoneNumber,
  };
}
