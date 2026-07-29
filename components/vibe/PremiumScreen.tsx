import { View, Text, StyleSheet, Pressable, ImageBackground, ScrollView, ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { VibeColors, VibeFonts } from "../../constants/vibeTheme";
import { Radius, Spacing } from "../../constants/theme";
import { useSidebar } from "../../context/SidebarContext";

interface Props {
  heroImage: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  menu?: boolean;
  right?: React.ReactNode;
  location?: string;
  locationInHeader?: boolean;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
  footer?: React.ReactNode;
  scrollEnabled?: boolean;
  lightMode?: boolean;
  hideHeader?: boolean;
}

export default function PremiumScreen({
  heroImage,
  title,
  subtitle,
  onBack,
  menu,
  right,
  location,
  locationInHeader,
  children,
  contentStyle,
  footer,
  scrollEnabled = true,
  lightMode = false,
  hideHeader = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const scrollPad = footer ? 160 + insets.bottom : 100;
  const { openSidebar } = useSidebar();

  return (
    <View style={[styles.root, lightMode && { backgroundColor: "#EEE9F8" }]}>
      <View style={[styles.orb, styles.orb1, lightMode && { backgroundColor: "rgba(167,139,250,0.16)" }]} />
      <View style={[styles.orb, styles.orb2, lightMode && { backgroundColor: "rgba(125,211,252,0.1)" }]} />

      {!hideHeader && (
        <ImageBackground source={{ uri: heroImage }} style={styles.hero}>
          <LinearGradient
            colors={lightMode ? ["rgba(255,255,255,0.2)", "rgba(247,245,252,0.95)"] : ["rgba(5,5,8,0.25)", "rgba(5,5,8,0.92)"]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={["top"]} style={styles.heroSafe}>
            <View style={styles.header}>
              {onBack ? (
                <Pressable style={[styles.iconBtn, lightMode && { backgroundColor: "#FFFFFF", borderColor: "rgba(0,0,0,0.05)" }]} onPress={onBack}>
                  <Ionicons name="arrow-back" size={22} color={lightMode ? "#1F1A3A" : "#fff"} />
                </Pressable>
              ) : menu ? (
                <Pressable style={[styles.iconBtn, lightMode && { backgroundColor: "#FFFFFF", borderColor: "rgba(0,0,0,0.05)", shadowColor: "#8A56FF", shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }]} onPress={openSidebar}>
                  <Ionicons name="menu" size={22} color={lightMode ? "#1F1A3A" : "#fff"} />
                </Pressable>
              ) : (
                <View style={styles.iconBtn} />
              )}
              <View style={styles.titleWrap}>
                <Text style={[styles.title, lightMode && { color: "#1F1A3A" }]}>{title}</Text>
                {subtitle ? <Text style={[styles.subtitle, lightMode && { color: "rgba(31,26,58,0.6)" }]}>{subtitle}</Text> : null}
              </View>
              {right ?? (location && locationInHeader ? (
                <Pressable style={[styles.locPillHeader, lightMode && { backgroundColor: "rgba(0,0,0,0.04)", borderColor: "rgba(0,0,0,0.06)" }]}>
                  <Ionicons name="location" size={12} color="#C084FC" />
                  <Text style={[styles.locTextHeader, lightMode && { color: "#1F1A3A" }]} numberOfLines={1}>{location}</Text>
                  <Ionicons name="chevron-down" size={12} color={lightMode ? "rgba(31,26,58,0.5)" : "rgba(255,255,255,0.5)"} />
                </Pressable>
              ) : (
                <View style={styles.headerSpacer} />
              ))}
            </View>
            {location && !locationInHeader && (
              <Pressable style={[styles.locPill, lightMode && { backgroundColor: "rgba(0,0,0,0.04)", borderColor: "rgba(0,0,0,0.06)" }]}>
                <Ionicons name="location" size={13} color="#C084FC" />
                <Text style={[styles.locText, lightMode && { color: "#1F1A3A" }]}>{location}</Text>
                <Ionicons name="chevron-down" size={13} color={lightMode ? "rgba(31,26,58,0.5)" : "rgba(255,255,255,0.5)"} />
              </Pressable>
            )}
          </SafeAreaView>
        </ImageBackground>
      )}

      <View style={[
        styles.sheet,
        lightMode && { backgroundColor: "transparent", borderColor: "transparent", borderWidth: 0 },
        hideHeader && { marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderWidth: 0, backgroundColor: "transparent" }
      ]}>
        {!hideHeader && (
          <View style={[styles.sheetHandle, lightMode && { backgroundColor: "rgba(26,21,32,0.08)" }]} />
        )}
        {scrollEnabled ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scroll, { paddingBottom: scrollPad }, contentStyle]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.scroll, { flex: 1, paddingBottom: 12 }, contentStyle]}>
            {children}
          </View>
        )}
      </View>

      {footer && (
        <SafeAreaView edges={["bottom"]} style={[styles.footer, lightMode && { backgroundColor: "rgba(255,255,255,0.96)", borderTopColor: "rgba(0,0,0,0.06)" }]}>
          {footer}
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: VibeColors.bg },
  orb: { position: "absolute", borderRadius: 999, zIndex: 0 },
  orb1: { width: 180, height: 180, top: 60, left: -60, backgroundColor: "rgba(138,86,255,0.12)" },
  orb2: { width: 140, height: 140, top: 120, right: -40, backgroundColor: "rgba(255,75,129,0.08)" },
  hero: { height: 136, zIndex: 1 },
  heroSafe: { flex: 1, justifyContent: "flex-start", paddingTop: Spacing.xs },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: { flex: 1 },
  title: { fontSize: 22, fontFamily: VibeFonts.extraBold, color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontFamily: VibeFonts.medium, color: "rgba(255,255,255,0.65)", marginTop: 4, lineHeight: 16 },
  locPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginLeft: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  locText: { fontSize: 12, fontFamily: VibeFonts.semiBold, color: "#fff" },
  locPillHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.full,
    maxWidth: 110,
  },
  locTextHeader: { fontSize: 11, fontFamily: VibeFonts.semiBold, color: "#fff", flexShrink: 1 },
  headerSpacer: { width: 42 },
  sheet: {
    flex: 1,
    marginTop: -12,
    backgroundColor: VibeColors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: VibeColors.bgGlassBorder,
    borderBottomWidth: 0,
    overflow: "hidden",
    zIndex: 2,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: "rgba(5,5,8,0.97)",
    borderTopWidth: 1,
    borderTopColor: VibeColors.bgGlassBorder,
    zIndex: 10,
  },
});
