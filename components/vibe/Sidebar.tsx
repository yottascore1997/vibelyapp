import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import { VibeFonts } from "../../constants/vibeTheme";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.62;

type IonName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
  label: string;
  icon: IonName;
  activeIcon: IonName;
  path: string;
  badge?: string;
  iconBg: string;
  iconColor: string;
}

const menuItems: MenuItem[] = [
  {
    label: "Home Feed",
    icon: "home-outline",
    activeIcon: "home",
    path: "/index",
    iconBg: "#EEF2FF",
    iconColor: "#4F46E5",
  },
  {
    label: "Discover",
    icon: "heart-outline",
    activeIcon: "heart",
    path: "/discover",
    iconBg: "#FCE7F3",
    iconColor: "#DB2777",
  },
  {
    label: "Hangout Hub",
    icon: "sparkles-outline",
    activeIcon: "sparkles",
    path: "/hangout",
    badge: "LIVE",
    iconBg: "#F3E8FF",
    iconColor: "#7C3AED",
  },
  {
    label: "Events Map",
    icon: "map-outline",
    activeIcon: "map",
    path: "/events-map",
    iconBg: "#D1FAE5",
    iconColor: "#059669",
  },
  {
    label: "Explore Events",
    icon: "ticket-outline",
    activeIcon: "ticket",
    path: "/explore-events",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
  },
  {
    label: "Create Plan",
    icon: "add-circle-outline",
    activeIcon: "add-circle",
    path: "/create-plan",
    iconBg: "#E0F2FE",
    iconColor: "#0284C7",
  },
  {
    label: "Chats",
    icon: "chatbubble-ellipses-outline",
    activeIcon: "chatbubble-ellipses",
    path: "/chats",
    iconBg: "#FFE4E6",
    iconColor: "#E11D48",
  },
  {
    label: "My Matches",
    icon: "heart-circle-outline",
    activeIcon: "heart-circle",
    path: "/my-matches",
    iconBg: "#F3E8FF",
    iconColor: "#9333EA",
  },
  {
    label: "My Profile",
    icon: "person-outline",
    activeIcon: "person",
    path: "/profile",
    iconBg: "#F1F5F9",
    iconColor: "#475569",
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isOpen, closeSidebar } = useSidebar();
  const { user, logout } = useAuth();

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateX.value = withTiming(0, { duration: 220 });
      backdropOpacity.value = withTiming(0.35, { duration: 220 });
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 220 });
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
      } else if (
        path === "/discover" ||
        path === "/profile" ||
        path === "/vibes" ||
        path === "/jar" ||
        path === "/chats"
      ) {
        router.push(`/(tabs)${path}`);
      } else {
        router.push(path as any);
      }
    }, 150);
  };

  const handleLogout = async () => {
    closeSidebar();
    setTimeout(async () => {
      await logout();
      router.replace("/(auth)/welcome");
    }, 150);
  };

  const getActiveState = (path: string) => {
    if (path === "/index") {
      return pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/";
    }
    return pathname.includes(path);
  };

  const userAvatar =
    user?.avatarUrl ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop";

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { zIndex: 9999 }]}
      pointerEvents={isOpen ? "auto" : "none"}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropAnimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          drawerAnimStyle,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 },
        ]}
      >
        {/* Simple Profile Header */}
        <Pressable
          style={styles.profileHeader}
          onPress={() => handleNavigate("/profile")}
        >
          <Image source={{ uri: userAvatar }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.name || "User"}
            </Text>
            <Text style={styles.profileSub}>View Profile ›</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={closeSidebar}>
            <Ionicons name="close" size={18} color="#64748B" />
          </Pressable>
        </Pressable>

        <View style={styles.divider} />

        {/* Tight Menu List */}
        <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          {menuItems.map((item, idx) => {
            const active = getActiveState(item.path);
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleNavigate(item.path)}
                style={[styles.menuItem, active && styles.menuItemActive]}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: active ? item.iconColor : item.iconBg },
                  ]}
                >
                  <Ionicons
                    name={active ? item.activeIcon : item.icon}
                    size={16}
                    color={active ? "#FFFFFF" : item.iconColor}
                  />
                </View>
                <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                  {item.label}
                </Text>
                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.divider} />

        {/* Compact Footer */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    zIndex: 1000,
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
    zIndex: 1001,
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#7C3AED",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  profileSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#7C3AED",
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 8,
    marginHorizontal: 14,
  },

  menuScroll: {
    flex: 1,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: "#F3E8FF",
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  menuLabel: {
    fontSize: 13.5,
    fontFamily: VibeFonts.medium,
    color: "#334155",
    flex: 1,
  },
  menuLabelActive: {
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
  },
  badge: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontFamily: VibeFonts.bold,
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
  },
  logoutText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#EF4444",
  },
});
