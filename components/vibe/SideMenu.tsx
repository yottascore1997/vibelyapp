import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { useMatches } from "../../context/MatchesContext";
import { VibeFonts } from "../../constants/vibeTheme";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.64;

type IonName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
  label: string;
  sublabel?: string;
  icon: IonName;
  route: string;
  colors: readonly [string, string];
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { matches } = useMatches();

  const [shouldRender, setShouldRender] = useState(isOpen);
  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      translateX.value = withTiming(0, { duration: 300 });
      backdropOpacity.value = withTiming(0.45, { duration: 300 });
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: 250 }, (isFinished) => {
        if (isFinished) {
          runOnJS(setShouldRender)(false);
        }
      });
      backdropOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [isOpen]);

  const handleNavigation = (path: string) => {
    onClose();
    setTimeout(() => {
      router.push(path as any);
    }, 150);
  };

  const handleLogout = async () => {
    onClose();
    setTimeout(async () => {
      await logout();
      router.replace("/(auth)/welcome");
    }, 150);
  };

  const backdropAnim = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const drawerAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!shouldRender) return null;

  const menuItems: MenuItem[] = [
    {
      label: "Discover / Dating",
      sublabel: "Swipe & Match profiles",
      icon: "heart",
      route: "/(tabs)/discover",
      colors: ["#EC4899", "#E11D48"],
    },
    {
      label: "Hangout Hub",
      sublabel: "Public plans & close friends",
      icon: "sparkles",
      route: "/hangout",
      colors: ["#8B5CF6", "#7C3AED"],
    },
    {
      label: "Events Map",
      sublabel: "Live activity heatmap",
      icon: "map",
      route: "/events-map",
      colors: ["#10B981", "#059669"],
    },
    {
      label: "Explore Events",
      sublabel: "Concerts & nightlife",
      icon: "ticket",
      route: "/explore-events",
      colors: ["#F59E0B", "#D97706"],
    },
    {
      label: "Create Plan",
      sublabel: "Post a hangout move",
      icon: "add-circle",
      route: "/create-plan",
      colors: ["#6366F1", "#4F46E5"],
    },
    {
      label: "AI VibeMatch",
      sublabel: "AI compatibility score",
      icon: "planet",
      route: "/vibematch",
      colors: ["#06B6D4", "#0284C7"],
    },
    {
      label: "Chats & Messages",
      sublabel: "Direct messaging",
      icon: "chatbubble-ellipses",
      route: "/(tabs)/chats",
      colors: ["#F43F5E", "#E11D48"],
    },
    {
      label: "My Matches",
      sublabel: "People who liked you",
      icon: "heart-circle",
      route: "/my-matches",
      colors: ["#A855F7", "#9333EA"],
    },
    {
      label: "My Profile",
      sublabel: "Edit bio & photos",
      icon: "person",
      route: "/(tabs)/profile",
      colors: ["#64748B", "#475569"],
    },
  ];

  const userAvatar =
    user?.avatarUrl ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop";

  return (
    <View style={styles.container} pointerEvents={isOpen ? "auto" : "none"}>
      {/* Dimmed Light Backdrop */}
      <Animated.View style={[styles.backdrop, backdropAnim]}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          drawerAnim,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 12 },
        ]}
      >
        {/* User Info Header Card */}
        <View style={styles.headerCardWrap}>
          <LinearGradient
            colors={["#1E1B4B", "#2E1065", "#0F172A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <View style={styles.headerStar1}>
              <Text style={{ color: "#E8C547", fontSize: 10 }}>✦</Text>
            </View>
            <View style={styles.headerStar2}>
              <Text style={{ color: "#EC4899", fontSize: 10 }}>✧</Text>
            </View>

            <View style={styles.headerRow}>
              <View style={styles.avatarWrap}>
                <LinearGradient
                  colors={["#EC4899", "#8B5CF6"]}
                  style={styles.avatarRing}
                >
                  <Image source={{ uri: userAvatar }} style={styles.avatar} />
                </LinearGradient>
                <View style={styles.onlineDot} />
              </View>

              <View style={styles.headerDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {user?.name || "User"}
                  </Text>
                  <Ionicons name="checkmark-circle" size={16} color="#38BDF8" />
                </View>
                <View style={styles.vipBadge}>
                  <Ionicons name="diamond" size={10} color="#F59E0B" />
                  <Text style={styles.vipBadgeText}>VIP VIBE MEMBER</Text>
                </View>
              </View>

              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Friends Horizontal Row */}
        {matches && matches.length > 0 && (
          <View style={styles.friendsSection}>
            <View style={styles.sectionHead}>
              <Ionicons name="flash" size={12} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Quick Friends</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.friendsScroll}
            >
              {matches.slice(0, 6).map((m: any) => (
                <Pressable
                  key={m.id}
                  style={styles.friendBubble}
                  onPress={() => handleNavigation(`/(tabs)/chats`)}
                >
                  <Image source={{ uri: m.avatarUrl }} style={styles.friendAvatar} />
                  <Text style={styles.friendName} numberOfLines={1}>
                    {m.name.split(" ")[0]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Navigation Items */}
        <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => handleNavigation(item.route)}
            >
              <LinearGradient
                colors={item.colors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.menuIconGrad}
              >
                <Ionicons name={item.icon} size={16} color="#FFFFFF" />
              </LinearGradient>

              <View style={styles.menuTextWrap}>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                {item.sublabel && <Text style={styles.menuItemSub}>{item.sublabel}</Text>}
              </View>

              <View style={styles.chevronWrap}>
                <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Footer / Logout */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Logout Account</Text>
          </Pressable>
          <Text style={styles.versionText}>Antigravity Vibe v2.4 · Premium Edition</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  backdropPressable: {
    flex: 1,
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: "#F8F9FD",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 24,
  },

  headerCardWrap: {
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  headerCard: {
    borderRadius: 22,
    padding: 14,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  headerStar1: { position: "absolute", top: 8, right: 40 },
  headerStar2: { position: "absolute", bottom: 10, right: 60 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarWrap: { position: "relative" },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#1E1B4B",
  },
  headerDetails: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
  },
  vipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  vipBadgeText: {
    fontSize: 8,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  friendsSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  friendsScroll: { gap: 10 },
  friendBubble: { alignItems: "center", width: 44 },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#8B5CF6",
  },
  friendName: {
    fontSize: 9,
    fontFamily: VibeFonts.medium,
    color: "#18181B",
    marginTop: 2,
    textAlign: "center",
  },

  menuScroll: {
    flex: 1,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  menuItemPressed: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  },
  menuIconGrad: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  menuItemSub: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 1,
  },
  chevronWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  footer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutButtonPressed: {
    backgroundColor: "#FCA5A5",
  },
  logoutText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#EF4444",
  },
  versionText: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    textAlign: "center",
  },
});
