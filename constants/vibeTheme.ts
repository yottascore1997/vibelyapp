export const VibeColors = {
  bg: "#050508",
  bgCard: "#0D0D14",
  bgGlass: "rgba(255,255,255,0.06)",
  bgGlassBorder: "rgba(255,255,255,0.1)",
  text: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.55)",
  textGold: "#D4AF37",
  textGoldMuted: "#C9A227",
  neonGreen: "#39FF14",
  neonGreenDim: "#22C55E",
  lessgo: "#22C55E",
  maybe: "#EAB308",
  offgrid: "#EF4444",
  glowBlue: "#3B82F6",
  glowPurple: "#8B5CF6",
  neonPink: "#FF4B81",
  neonPurple: "#8A56FF",
};

export const VibeFonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  extraBold: "Inter_800ExtraBold",
};

export const VibeActivities = [
  { id: "coffee", name: "Coffee", emoji: "☕", icon: "cafe" as const, color: "#8B5E3C" },
  { id: "food", name: "Food", emoji: "🍕", icon: "pizza" as const, color: "#F97316" },
  { id: "biryani", name: "Biryani", emoji: "🍛", icon: "restaurant" as const, color: "#DC2626" },
  { id: "beer", name: "Beer", emoji: "🍺", icon: "beer" as const, color: "#EAB308" },
  { id: "sutta", name: "Sutta", emoji: "🚬", icon: "flame" as const, color: "#6B7280" },
  { id: "vape", name: "Vape", emoji: "💨", icon: "cloud" as const, color: "#94A3B8" },
  { id: "street", name: "Street", emoji: "🌮", icon: "fast-food" as const, color: "#22C55E" },
  { id: "drinks", name: "Drinks", emoji: "🍸", icon: "wine" as const, color: "#EC4899" },
  { id: "dietcoke", name: "Diet Coke", emoji: "🥤", icon: "water" as const, color: "#EF4444" },
];

export const VibeEnergies = [
  { id: "lessgo", label: "Lessgo", color: VibeColors.lessgo, glow: "#22C55E88" },
  { id: "maybe", label: "Maybe", color: VibeColors.maybe, glow: "#EAB30888" },
  { id: "offgrid", label: "Off grid", color: VibeColors.offgrid, glow: "#EF444488" },
];
