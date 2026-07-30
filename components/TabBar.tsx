import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useRouter, usePathname } from "expo-router";
import { VibeFonts } from "../constants/vibeTheme";
import SpotBeaconModal from "./vibe/SpotBeaconModal";
import { useTabBarVisibility } from "../context/TabBarVisibilityContext";

const tabs = [
  {
    name: "index",
    label: "Home",
    icon: "home-outline" as const,
    activeIcon: "home" as const,
    gradient: ["#7C3AED", "#6D28D9"] as const,
    accent: "#7C3AED",
    hasBadge: false,
  },
  {
    name: "discover",
    label: "Discover",
    icon: "heart-outline" as const,
    activeIcon: "heart" as const,
    gradient: ["#EC4899", "#E11D48"] as const,
    accent: "#EC4899",
    hasBadge: false,
  },
  {
    name: "spot",
    label: "Spot ⚡",
    isCenterSpot: true,
    icon: "flash" as const,
    activeIcon: "flash" as const,
    gradient: ["#7C3AED", "#EC4899"] as const,
    accent: "#7C3AED",
    hasBadge: false,
  },
  {
    name: "hangout",
    label: "Hangout",
    icon: "people-outline" as const,
    activeIcon: "people" as const,
    gradient: ["#8B5CF6", "#7C3AED"] as const,
    accent: "#7C3AED",
    hasBadge: true,
  },
  {
    name: "chats",
    label: "Chats",
    icon: "chatbubble-ellipses-outline" as const,
    activeIcon: "chatbubble-ellipses" as const,
    gradient: ["#10B981", "#059669"] as const,
    accent: "#10B981",
    hasBadge: true,
  },
];

function TabItem({
  tab,
  active,
  onPress,
}: {
  tab: (typeof tabs)[0];
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (tab.isCenterSpot) {
    return (
      <Pressable
        style={styles.centerSpotTab}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.9, { damping: 14, stiffness: 350 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 350 });
        }}
      >
        <Animated.View style={[styles.centerSpotInner, anim]}>
          <LinearGradient
            colors={[...tab.gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerSpotBtnGrad}
          >
            <Ionicons name="flash" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.centerSpotLabel}>{tab.label}</Text>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.88, { damping: 14, stiffness: 350 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 350 });
      }}
    >
      <Animated.View style={[styles.tabInner, anim]}>
        <View style={styles.iconContainer}>
          {active ? (
            <LinearGradient
              colors={tab.gradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activePill}
            >
              <Ionicons name={tab.activeIcon} size={18} color="#FFFFFF" />
            </LinearGradient>
          ) : (
            <View style={styles.iconIdle}>
              <Ionicons name={tab.icon} size={20} color="#64748B" />
            </View>
          )}

          {tab.hasBadge && !active ? <View style={styles.badgeDot} /> : null}
        </View>

        <Text
          style={[
            styles.label,
            { color: active ? tab.accent : "#64748B" },
            active && styles.labelActive,
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>

        {active ? (
          <View style={[styles.activeDotBar, { backgroundColor: tab.accent }]} />
        ) : (
          <View style={styles.activeDotSpacer} />
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function TabBar({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { hidden } = useTabBarVisibility();
  const [spotModalVisible, setSpotModalVisible] = useState(false);

  if (hidden) return null;

  const isActive = (name: string) => {
    if (name === "index") return pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/";
    if (name === "hangout") {
      return (
        pathname.includes("hangout") ||
        pathname.includes("plan-details") ||
        pathname.includes("create-plan")
      );
    }
    if (name === "chats") {
      return pathname.includes("chats") || pathname.includes("chat/");
    }
    return pathname.includes(name);
  };

  const bottomMargin = Math.max(insets.bottom, 8);

  return (
    <>
      <View style={[styles.outerContainer, { paddingBottom: bottomMargin }]}>
        <View style={styles.floatingShell}>
          <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.bgOverlay} />
          <View style={styles.row}>
            {tabs.map((tab) => (
              <TabItem
                key={tab.name}
                tab={tab}
                active={isActive(tab.name)}
                onPress={() => {
                  if (tab.isCenterSpot) {
                    router.push("/spot-broadcast");
                    return;
                  }
                  if (isActive(tab.name)) return;
                  if (tab.name === "hangout") {
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
      </View>

      {/* Spot Beacon Modal */}
      <SpotBeaconModal
        visible={spotModalVisible}
        onClose={() => setSpotModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 12,
  },
  floatingShell: {
    width: "100%",
    height: 68,
    borderRadius: 28,
    overflow: "visible",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1.5,
    borderColor: "rgba(226,232,240,0.9)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 10,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabInner: { alignItems: "center", justifyContent: "center" },
  iconContainer: { position: "relative", alignItems: "center" },
  activePill: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconIdle: {
    width: 44,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDot: {
    position: "absolute",
    top: 2,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  label: {
    fontSize: 9.5,
    fontFamily: VibeFonts.medium,
    marginTop: 2,
  },
  labelActive: {
    fontFamily: VibeFonts.extraBold,
    fontSize: 10,
  },
  activeDotBar: {
    width: 14,
    height: 3,
    borderRadius: 2,
    marginTop: 2,
  },
  activeDotSpacer: {
    height: 3,
    marginTop: 2,
  },

  // Center Spot Tab Action Button
  centerSpotTab: {
    flex: 1.1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerSpotInner: {
    alignItems: "center",
    justifyContent: "center",
    top: -10,
  },
  centerSpotBtnGrad: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  centerSpotLabel: {
    fontSize: 9.5,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
    marginTop: 2,
  },
});
