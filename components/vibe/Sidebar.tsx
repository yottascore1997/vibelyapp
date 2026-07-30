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
import { LinearGradient } from "expo-linear-gradient";
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

const { width: SCREEN_W } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_W * 0.72, 290);

type IonName = keyof typeof Ionicons.glyphMap;

type MenuItem = {
  label: string;
  icon: IonName;
  activeIcon: IonName;
  path: string;
  badge?: string;
  iconBg: string;
  iconColor: string;
};

const MENU: MenuItem[] = [
  {
    label: "Home Feed",
    icon: "home-outline",
    activeIcon: "home",
    path: "/index",
    iconBg: "#F3E8FF",
    iconColor: "#7C3AED",
  },
  {
    label: "Discover",
    icon: "heart-outline",
    activeIcon: "heart",
    path: "/discover",
    iconBg: "#F3E8FF",
    iconColor: "#7C3AED",
  },
  {
    label: "Hangout Hub",
    icon: "sparkles-outline",
    activeIcon: "sparkles",
    path: "/hangout",
    badge: "LIVE",
    iconBg: "#ECFDF5",
    iconColor: "#22C55E",
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
    iconBg: "#F3E8FF",
    iconColor: "#7C3AED",
  },
  {
    label: "Create Plan",
    icon: "add-circle-outline",
    activeIcon: "add-circle",
    path: "/create-plan",
    iconBg: "#F3E8FF",
    iconColor: "#7C3AED",
  },
  {
    label: "Chats",
    icon: "chatbubble-ellipses-outline",
    activeIcon: "chatbubble-ellipses",
    path: "/chats",
    iconBg: "#F3E8FF",
    iconColor: "#7C3AED",
  },
  {
    label: "My Matches",
    icon: "heart-circle-outline",
    activeIcon: "heart-circle",
    path: "/my-matches",
    iconBg: "#F3E8FF",
    iconColor: "#7C3AED",
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
      translateX.value = withTiming(0, { duration: 240 });
      backdropOpacity.value = withTiming(0.45, { duration: 240 });
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOpen]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
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
    }, 140);
  };

  const handleLogout = async () => {
    closeSidebar();
    setTimeout(async () => {
      await logout();
      router.replace("/(auth)/welcome");
    }, 140);
  };

  const isActive = (path: string) => {
    if (path === "/index") {
      return pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/";
    }
    return pathname.includes(path);
  };

  const avatar =
    user?.avatarUrl ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop";

  if (!isOpen) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          drawerStyle,
          {
            paddingTop: insets.top + 12,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <LinearGradient colors={["#7C3AED", "#8B5CF6"]} style={styles.logo}>
              <Text style={styles.logoText}>H</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.brand}>Hangora</Text>
              <Text style={styles.tagline}>Find your people</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closeSidebar}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Pressable style={styles.profile} onPress={() => handleNavigate("/profile")}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {user?.name || "Your profile"}
              </Text>
              <Text style={styles.viewProfile}>View profile ›</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.line} />

        {/* Menu — always visible list */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.menuPad}
          showsVerticalScrollIndicator={false}
        >
          {MENU.map((item) => {
            const active = isActive(item.path);
            return (
              <TouchableOpacity
                key={item.path}
                style={[styles.item, active && styles.itemActive]}
                onPress={() => handleNavigate(item.path)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: active ? item.iconColor : item.iconBg },
                  ]}
                >
                  <Ionicons
                    name={active ? item.activeIcon : item.icon}
                    size={16}
                    color={active ? "#FFF" : item.iconColor}
                  />
                </View>
                <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
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

        <View style={styles.line} />

        <TouchableOpacity style={styles.logout} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={16} color="#EF4444" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0F172A",
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    paddingHorizontal: 14,
    gap: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
  },
  brand: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  tagline: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8F9FD",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#EDE7FF",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#7C3AED",
  },
  name: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  viewProfile: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#7C3AED",
  },
  line: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
    marginHorizontal: 14,
  },
  menuPad: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    marginBottom: 2,
  },
  itemActive: {
    backgroundColor: "#F3E8FF",
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: VibeFonts.medium,
    color: "#334155",
  },
  itemLabelActive: {
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
  },
  badge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
  },
  logoutText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#EF4444",
  },
});
