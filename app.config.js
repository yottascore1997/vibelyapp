const PROD_API = "https://www.hangora.app/api";
const PROD_CHAT = "https://secure-courage-production-8ba6.up.railway.app";

/**
 * Default = custom domain (Play Store / production).
 * Override with EXPO_PUBLIC_API_URL / EXPO_PUBLIC_CHAT_URL in .env.
 *
 * Firebase phone OTP — set EXPO_PUBLIC_FIREBASE_* in mobile/.env
 */
export default ({ config }) => {
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL || "").trim();
  const apiUrl = (fromEnv || PROD_API).replace(/\/+$/, "");
  const normalized = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;

  const chatFromEnv = (process.env.EXPO_PUBLIC_CHAT_URL || "").trim();
  const chatUrl = (chatFromEnv || PROD_CHAT).replace(/\/+$/, "");

  process.env.EXPO_PUBLIC_API_URL = normalized;
  process.env.EXPO_PUBLIC_CHAT_URL = chatUrl;

  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      apiUrl: normalized,
      chatUrl,
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
      firebaseStorageBucket:
        process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      firebaseMessagingSenderId:
        process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
    },
  };
};
