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
    accent: "#22D3EE",
    hasBadge: false,
  },
  {
    name: "discover",
    label: "Discover",
    icon: "compass-outline" as const,
    activeIcon: "compass" as const,
    accent: "#22D3EE",
    hasBadge: false,
  },
  {
    name: "spot",
    label: "Events Map",
    isCenterSpot: true,
    icon: "map-outline" as const,
    activeIcon: "map" as const,
    accent: "#22D3EE",
    hasBadge: false,
  },
  {
    name: "chats",
    label: "Chat",
    icon: "chatbubble-outline" as const,
    activeIcon: "chatbubble" as const,
    accent: "#22D3EE",
    hasBadge: true,
  },
  {
    name: "crew",
    label: "My Crew",
    icon: "people-outline" as const,
    activeIcon: "people" as const,
    accent: "#22D3EE",
    hasBadge: false,
  },
];

function TabItem({
  tab,
  active,
  onPress,
  dark,
}: {
  tab: (typeof tabs)[0];
  active: boolean;
  onPress: () => void;
  dark: boolean;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const idleColor = "#94A3B8";
  const activeColor = "#2EFA9E";

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
            colors={["#D4F72C", "#A3E635"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerSpotBtnGradDark}
          >
            <Ionicons name="map" size={24} color="#0A0F1D" />
          </LinearGradient>
        </Animated.View>
        <Text
          style={[
            styles.label,
            { color: active ? "#22D3EE" : "#94A3B8" },
            active && styles.labelActive,
          ]}
          numberOfLines={1}
        >
          Events Map
        </Text>
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
          <Ionicons
            name={active ? tab.activeIcon : tab.icon}
            size={21}
            color={active ? activeColor : idleColor}
          />

          {tab.hasBadge && !active ? (
            <View style={[styles.badgeDot, dark && styles.badgeDotDark]}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          ) : null}
        </View>

        <Text
          style={[
            styles.label,
            { color: active ? activeColor : idleColor },
            active && styles.labelActive,
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
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
    if (name === "index") {
      return (
        pathname === "/" ||
        pathname === "/(tabs)" ||
        pathname === "/(tabs)/"
      );
    }
    if (name === "discover") {
      return (
        pathname.includes("discover") ||
        pathname.includes("hangout") ||
        pathname.includes("plan-details")
      );
    }
    if (name === "chats") {
      return pathname.includes("chats") || pathname.includes("chat/");
    }
    if (name === "crew") {
      return pathname.includes("crew") || pathname.includes("my-matches");
    }
    if (name === "spot") {
      return pathname.includes("events-map") || pathname.includes("event");
    }
    return pathname.includes(name);
  };

  const bottomMargin = Math.max(insets.bottom, 8);

  return (
    <>
      <View style={[styles.outerContainer, { paddingBottom: bottomMargin }]}>
        <View style={[styles.floatingShell, dark && styles.floatingShellDark]}>
          <BlurView
            intensity={dark ? 55 : 70}
            tint={dark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.bgOverlay, dark && styles.bgOverlayDark]} />
          <View style={styles.row}>
            {tabs.map((tab) => (
              <TabItem
                key={tab.name}
                tab={tab}
                active={isActive(tab.name)}
                dark={dark}
                onPress={() => {
                  if (tab.isCenterSpot) {
                    router.push("/events-map");
                    return;
                  }
                  const isCurrentTabRoot =
                    (tab.name === "index" && (pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/")) ||
                    (tab.name === "discover" && pathname === "/(tabs)/discover") ||
                    (tab.name === "chats" && pathname === "/(tabs)/chats") ||
                    (tab.name === "crew" && pathname === "/(tabs)/crew");

                  if (isCurrentTabRoot) return;
                  if (tab.name === "discover") {
                    router.navigate("/(tabs)/discover");
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
  floatingShellDark: {
    backgroundColor: "#0B0F1C",
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  bgOverlayDark: {
    backgroundColor: "#0B0F1C",
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
  badgeDotDark: {
    backgroundColor: "#F43F5E",
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#0B0F1C",
    top: -3,
    right: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    lineHeight: 11,
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
    top: -6,
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
  centerSpotBtnGradDark: {
    borderColor: "#D4F72C",
    borderWidth: 2,
    width: 50,
    height: 50,
    borderRadius: 25,
    shadowColor: "#D4F72C",
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 10,
    top: -6,
    alignItems: "center",
    justifyContent: "center",
  },
  centerSpotLabel: {
    fontSize: 9.5,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
    marginTop: 2,
  },
  centerSpotLabelDark: {
    color: "#C4B5FD",
  },
});
