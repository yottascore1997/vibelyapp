const PROD_API = "https://vibely-production-d2c1.up.railway.app/api";

/**
 * Always default to production Railway.
 * Override with EXPO_PUBLIC_API_URL in .env only for local backend.
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
