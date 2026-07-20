import { View, Text, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useRouter, usePathname } from "expo-router";
import { VibeFonts } from "../constants/vibeTheme";
import { Spacing } from "../constants/theme";

const tabs = [
  { name: "index", label: "Home", icon: "home" as const },
  { name: "discover", label: "Discover", icon: "heart" as const },
  { name: "hangout", label: "Hangout", icon: "people" as const },
  { name: "travel", label: "Travel", icon: "airplane" as const },
  { name: "profile", label: "Profile", icon: "person" as const },
];

function TabItem({
  tab,
  active,
  onPress,
  light,
}: {
  tab: (typeof tabs)[0];
  active: boolean;
  onPress: () => void;
  light: boolean;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const idleColor = light ? "#9CA3AF" : "rgba(255,255,255,0.38)";
  const activeColor = light ? "#8B5CF6" : "#E9D5FF";
  const labelColor = light ? "#9CA3AF" : "rgba(255,255,255,0.38)";
  const labelActiveColor = light ? "#8B5CF6" : "#E9D5FF";

  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 16, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
    >
      <Animated.View style={[styles.tabInner, anim]}>
        {active ? (
          light ? (
            <View style={styles.activePillLight}>
              <Ionicons name={tab.icon} size={22} color="#FFFFFF" />
            </View>
          ) : (
            <LinearGradient
              colors={["rgba(138,86,255,0.28)", "rgba(255,75,129,0.12)"]}
              style={styles.activePill}
            >
              <Ionicons name={tab.icon} size={22} color={activeColor} />
            </LinearGradient>
          )
        ) : (
          <View style={styles.iconIdle}>
            <Ionicons
              name={`${tab.icon}-outline` as keyof typeof Ionicons.glyphMap}
              size={22}
              color={idleColor}
            />
          </View>
        )}
        <Text
          style={[
            styles.label,
            { color: labelColor },
            active && { color: labelActiveColor, fontFamily: VibeFonts.bold },
          ]}
        >
          {tab.label}
        </Text>
        {!light &&
          (active ? <View style={styles.activeBar} /> : <View style={styles.activeBarSpacer} />)}
        {light && <View style={styles.activeBarSpacer} />}
      </Animated.View>
    </Pressable>
  );
}

export default function TabBar({ dark = true }: { dark?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const light = !dark;

  const isActive = (name: string) => {
    if (name === "index") return pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/";
    if (name === "hangout") {
      return (
        pathname.includes("hangout") ||
        pathname.includes("plan-details") ||
        pathname.includes("create-plan")
      );
    }
    if (name === "discover") {
      return pathname.includes("discover");
    }
    return pathname.includes(name);
  };

  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <View
      style={[
        styles.shell,
        light && styles.shellLight,
        { paddingBottom: bottomPad },
      ]}
    >
      {!light && (
        <LinearGradient
          colors={["rgba(138,86,255,0.45)", "rgba(255,75,129,0.2)", "transparent"]}
          style={styles.topLine}
        />
      )}
      <BlurView
        intensity={light ? 50 : 40}
        tint={light ? "light" : "dark"}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.bgTint, light && styles.bgTintLight]} />

      <View style={[styles.row, light && styles.rowLight]}>
        {tabs.map((tab) => (
          <TabItem
            key={tab.name}
            tab={tab}
            active={isActive(tab.name)}
            light={light}
            onPress={() => {
              // Already on this tab — skip to avoid remount jank
              if (isActive(tab.name)) return;

              // navigate (not push) reuses existing screens → smoother tab switches
              if (tab.name === "travel") {
                router.navigate("/travel");
              } else if (tab.name === "hangout") {
                router.navigate("/hangout");
              } else if (tab.name === "index") {
                router.navigate("/(tabs)");
              } else {
                router.navigate(`/(tabs)/${tab.name}`);
              }
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderTopWidth: 1,
    borderTopColor: "rgba(138,86,255,0.2)",
    overflow: "visible",
    backgroundColor: "rgba(6,6,12,0.92)",
    zIndex: 50,
  },
  shellLight: {
    borderTopColor: "rgba(167,139,250,0.28)",
    backgroundColor: "rgba(248,246,255,0.98)",
  },
  topLine: { position: "absolute", top: 0, left: 0, right: 0, height: 1 },
  bgTint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,5,8,0.55)" },
  bgTintLight: { backgroundColor: "rgba(246,244,251,0.92)" },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  rowLight: {
    paddingTop: 10,
    alignItems: "center",
  },
  tab: { flex: 1, alignItems: "center" },
  tabInner: { alignItems: "center", minHeight: 56, justifyContent: "center" },
  activePill: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(192,132,252,0.25)",
  },
  activePillLight: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  iconIdle: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 10, fontFamily: VibeFonts.medium, marginTop: 3 },
  activeBar: { width: 14, height: 3, borderRadius: 2, backgroundColor: "#C084FC", marginTop: 4 },
  activeBarSpacer: { height: 4 },
});
