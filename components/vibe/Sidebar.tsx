import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useRouter, usePathname } from "expo-router";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import { VibeColors, VibeFonts } from "../../constants/vibeTheme";
import { Radius, Spacing } from "../../constants/theme";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.70;

const menuItems = [
  { label: "Home Feed", icon: "home-outline" as const, path: "/index" },
  { label: "Discover Matches", icon: "heart-outline" as const, path: "/discover" },
  { label: "Friends Hangout", icon: "people-outline" as const, path: "/reels" },
  { label: "Travel Partner", icon: "airplane-outline" as const, path: "/travel" },
  { label: "Vibes (Off Grid)", icon: "flash-outline" as const, path: "/vibes" },
  { label: "Vibe Jar", icon: "archive-outline" as const, path: "/jar" },
  { label: "My Matches", icon: "heart-circle-outline" as const, path: "/my-matches" },
  { label: "Chats", icon: "chatbubble-ellipses-outline" as const, path: "/chats" },
  { label: "Direct Invites", icon: "mail-unread-outline" as const, path: "/invites" },
  { label: "Create a Plan", icon: "add-circle-outline" as const, path: "/create-plan" },
  { label: "Edit Profile", icon: "person-outline" as const, path: "/profile" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();
  const { user } = useAuth();

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateX.value = withTiming(0, { duration: 220 });
      backdropOpacity.value = withTiming(1, { duration: 220 });
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOpen]);

  const drawerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: isOpen ? "auto" : "none",
  }));

  const handleNavigate = (path: string) => {
    closeSidebar();
    setTimeout(() => {
      if (path === "/index") {
        router.push("/(tabs)");
      } else if (path === "/discover" || path === "/profile" || path === "/vibes" || path === "/jar" || path === "/chats") {
        router.push(`/(tabs)${path}`);
      } else {
        router.push(path as any);
      }
    }, 150);
  };

  const getActiveState = (path: string) => {
    if (path === "/index") {
      return pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/";
    }
    return pathname.includes(path);
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 9999 }]} pointerEvents={isOpen ? "auto" : "none"}>
      {/* Backdrop overlay shadow */}
      <Animated.View style={[styles.backdrop, backdropAnimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar} />
      </Animated.View>

      {/* Sidenav Drawer Panel */}
      <Animated.View style={[styles.drawer, drawerAnimStyle]}>

        {/* Header Profile Summary */}
        <View style={styles.header}>
          <LinearGradient
            colors={["#8A56FF", "#FF4B81"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarBorder}
          >
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120" }}
              style={styles.avatar}
            />
          </LinearGradient>

          <View style={styles.profileMeta}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.name || "Roshani Mayur"}
            </Text>
            <Text style={styles.profileLocation}>Nagpur, India</Text>
          </View>
        </View>

        {/* Vibe Score Stats Bar */}
        <View style={styles.statsCard}>
          <LinearGradient
            colors={["rgba(138, 86, 255, 0.12)", "rgba(255, 75, 129, 0.04)"]}
            style={styles.statsGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statCol}>
              <Text style={styles.statVal}>78</Text>
              <Text style={styles.statLabel}>Vibe Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statVal}>24</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Scrollable menu options list */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, idx) => {
            const active = getActiveState(item.path);
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleNavigate(item.path)}
                style={[styles.menuItem, active && styles.menuItemActive]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={active ? "#FF4B81" : "rgba(255, 255, 255, 0.6)"}
                />
                <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                  {item.label}
                </Text>
                {active && <View style={styles.activeIndicatorDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sidenav Footer details */}
        <View style={styles.footer}>
          <LinearGradient
            colors={["rgba(212, 175, 55, 0.15)", "rgba(212, 175, 55, 0.05)"]}
            style={styles.premiumBox}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="diamond" size={16} color="#D4AF37" style={{ marginRight: 6 }} />
            <Text style={styles.premiumText}>Vibely Gold Member</Text>
          </LinearGradient>

          <TouchableOpacity style={styles.closeBtn} onPress={closeSidebar}>
            <Ionicons name="chevron-back" size={20} color="rgba(255, 255, 255, 0.4)" />
            <Text style={styles.closeText}>Close Menu</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 5, 8, 0.72)",
    zIndex: 1000,
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: "#0D0B18",
    borderRightWidth: 1.5,
    borderRightColor: "rgba(138, 86, 255, 0.22)",
    shadowColor: "#8A56FF",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    paddingTop: 65,
    paddingBottom: 25,
    justifyContent: "space-between",
    overflow: "hidden",
    zIndex: 1001,
  },

  // Header Details
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  avatarBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatar: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    color: "#fff",
    fontSize: 16,
    fontFamily: VibeFonts.bold,
  },
  profileLocation: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    marginTop: 2,
  },

  // Stats Card
  statsCard: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statsGrad: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(138, 86, 255, 0.12)",
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statVal: {
    color: "#C084FC",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 8,
    fontFamily: VibeFonts.bold,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 25,
    backgroundColor: "rgba(138, 86, 255, 0.18)",
  },

  // Menu Options
  menuContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: Radius.md,
    position: "relative",
  },
  menuItemActive: {
    backgroundColor: "rgba(255, 75, 129, 0.08)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 75, 129, 0.15)",
  },
  menuLabel: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 13,
    fontFamily: VibeFonts.semiBold,
    marginLeft: 12,
  },
  menuLabelActive: {
    color: "#fff",
    fontFamily: VibeFonts.bold,
  },
  activeIndicatorDot: {
    position: "absolute",
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF4B81",
  },

  // Footer Options
  footer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  premiumBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  premiumText: {
    color: "#D4AF37",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  closeText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    marginLeft: 4,
  },
});
