import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSidebar } from "../../context/SidebarContext";
import { VibeFonts } from "../../constants/vibeTheme";
import { Radius, Spacing } from "../../constants/theme";

type Variant = "light" | "dark";

interface Props {
  variant?: Variant;
  tagline?: string;
  showLuxe?: boolean;
  onBellPress?: () => void;
  badgeCount?: number;
}

/** Shared brand header — same Vibely header used across main screens */
export default function AppHeader({
  variant = "light",
  tagline = "Curated moments. Real people.",
  showLuxe = true,
  onBellPress,
  badgeCount = 3,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const dark = variant === "dark";

  return (
    <View style={[styles.topHeader, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.topHeaderLeft}>
        <View style={styles.logoRow}>
          <Pressable
            style={[styles.menuToggleBtn, dark && styles.menuToggleBtnDark]}
            onPress={openSidebar}
          >
            <Ionicons name="menu-outline" size={24} color={dark ? "#FFFFFF" : "#1A1520"} />
          </Pressable>
          <View>
            <View style={styles.brandRow}>
              <Text style={[styles.logoText, dark && styles.logoTextDark]}>Vibe</Text>
              <Text style={styles.logoAccent}>ly</Text>
            </View>
            <Text style={[styles.taglineText, dark && styles.taglineTextDark]}>{tagline}</Text>
          </View>
        </View>
      </View>

      <View style={styles.topHeaderRight}>
        {showLuxe && (
          <Pressable style={styles.premiumPillBtn} onPress={() => router.push("/(tabs)/profile")}>
            <LinearGradient
              colors={["#D4AF37", "#B8860B"]}
              style={styles.premiumPillGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="diamond" size={12} color="#1A1520" style={{ marginRight: 3 }} />
              <Text style={styles.premiumPillText}>Luxe</Text>
            </LinearGradient>
          </Pressable>
        )}
        <Pressable
          style={[styles.headerBellBtn, dark && styles.headerBellBtnDark]}
          onPress={onBellPress ?? (() => router.push("/(tabs)/chats"))}
        >
          <Ionicons name="notifications-outline" size={20} color={dark ? "#FFFFFF" : "#1A1520"} />
          {badgeCount > 0 && (
            <View style={[styles.bellBadge, dark && styles.bellBadgeDark]}>
              <Text style={styles.bellBadgeText}>{badgeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: Spacing.sm,
  },
  topHeaderLeft: {
    flex: 1,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  menuToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFCFA",
    borderWidth: 1,
    borderColor: "rgba(26,21,32,0.06)",
    shadowColor: "#1A1520",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  menuToggleBtnDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.1)",
    shadowOpacity: 0,
    elevation: 0,
  },
  logoText: {
    fontSize: 30,
    fontFamily: VibeFonts.extraBold,
    color: "#1A1520",
    letterSpacing: -1.4,
  },
  logoTextDark: {
    color: "#FFFFFF",
  },
  logoAccent: {
    fontSize: 30,
    fontFamily: VibeFonts.extraBold,
    color: "#C9A227",
    letterSpacing: -1.4,
  },
  taglineText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(26,21,32,0.45)",
    marginTop: 1,
    letterSpacing: 0.2,
  },
  taglineTextDark: {
    color: "rgba(255,255,255,0.45)",
  },
  topHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  premiumPillBtn: {
    borderRadius: Radius.full,
    overflow: "hidden",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumPillGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  premiumPillText: {
    color: "#1A1520",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    letterSpacing: 0.3,
  },
  headerBellBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFCFA",
    borderWidth: 1,
    borderColor: "rgba(26,21,32,0.06)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerBellBtnDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#E11D48",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#FAF7F2",
  },
  bellBadgeDark: {
    borderColor: "#050508",
  },
  bellBadgeText: {
    color: "#FFF",
    fontSize: 8,
    fontFamily: VibeFonts.bold,
  },
});
