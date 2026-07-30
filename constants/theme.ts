export const Colors = {
  primary: "#8A56FF",
  primaryDark: "#6B3FD4",
  secondary: "#FF4B81",
  accent: "#FF6B9D",
  background: "#F8F7FC",
  white: "#FFFFFF",
  text: "#1A1A2E",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",
  green: "#22C55E",
  orange: "#F97316",
  blue: "#3B82F6",
  pink: "#EC4899",
  purple: "#8B5CF6",
  border: "#E5E7EB",
  cardShadow: "rgba(138, 86, 255, 0.08)",
};

export const Gradients = {
  primary: ["#8A56FF", "#FF4B81"] as const,
  purple: ["#8A56FF", "#6B3FD4"] as const,
  pink: ["#FF6B9D", "#FF4B81"] as const,
  orange: ["#FF9800", "#FF6B35"] as const,
  green: ["#22C55E", "#16A34A"] as const,
  ai: ["#7C3AED", "#A855F7", "#C084FC"] as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const API_URL = (() => {
  // Production Railway — Play Store + Expo Go default
  const PROD_API = "https://vibely-production-d2c1.up.railway.app/api";
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL || "").trim();
  // Never silently fall back to localhost (causes fake "same WiFi" errors)
  let url = (fromEnv || PROD_API).replace(/\/+$/, "");
  if (!url.endsWith("/api")) url = `${url}/api`;
  return url;
})();
