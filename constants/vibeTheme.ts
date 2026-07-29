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
  { id: "beer", name: "Beer & Drinks", emoji: "🍺", icon: "beer" as const, color: "#EAB308" },
  { id: "coffee", name: "Coffee", emoji: "☕", icon: "cafe" as const, color: "#8B5E3C" },
  { id: "food", name: "Food / Lunch", emoji: "🍕", icon: "pizza" as const, color: "#F97316" },
  { id: "movie", name: "Movie / Cinema", emoji: "🎬", icon: "film" as const, color: "#818CF8" },
  { id: "gaming", name: "Gaming / Play", emoji: "🎮", icon: "game-controller" as const, color: "#34D399" },
  { id: "drive", name: "Late Drive", emoji: "🚗", icon: "car" as const, color: "#3B82F6" },
  { id: "sutta", name: "Sutta & Chill", emoji: "🚬", icon: "flame" as const, color: "#6B7280" },
  { id: "drinks", name: "Cocktails 🍸", emoji: "🍸", icon: "wine" as const, color: "#EC4899" },
];

export const VibeEnergies = [
  { id: "lessgo", label: "Lessgo", color: VibeColors.lessgo, glow: "#22C55E88" },
  { id: "maybe", label: "Maybe", color: VibeColors.maybe, glow: "#EAB30888" },
  { id: "offgrid", label: "Off grid", color: VibeColors.offgrid, glow: "#EF444488" },
];
