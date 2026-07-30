const PROD_API = "https://www.hangora.app/api";

/**
 * Default = custom domain (Play Store / production).
 * Override with EXPO_PUBLIC_API_URL in .env for local backend.
 */
export default ({ config }) => {
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL || "").trim();
  const apiUrl = (fromEnv || PROD_API).replace(/\/+$/, "");
  const normalized = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;

  process.env.EXPO_PUBLIC_API_URL = normalized;

  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      apiUrl: normalized,
    },
  };
};
