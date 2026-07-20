import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { useMatches } from "../../context/MatchesContext";
import { VibeColors, VibeFonts } from "../../constants/vibeTheme";
import { Radius, Spacing } from "../../constants/theme";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.78;

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
      backdropOpacity.value = withTiming(0.6, { duration: 300 });
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

  const menuItems = [
    { label: "Discover / Dating", icon: "heart-outline" as const, route: "/(tabs)/discover" },
    { label: "Friends & Reels", icon: "people-outline" as const, route: "/reels" },
    { label: "Hangout Plans", icon: "beer-outline" as const, route: "/hangout" },
    { label: "Explore Events 🎫", icon: "ticket-outline" as const, route: "/explore-events" },
    { label: "Create Plan", icon: "calendar-outline" as const, route: "/create-plan" },
    { label: "Travel Partners ✈️", icon: "airplane-outline" as const, route: "/travel" },
    { label: "AI VibeMatch", icon: "sparkles-outline" as const, route: "/vibematch" },
    { label: "Chats / Messages", icon: "chatbubble-ellipses-outline" as const, route: "/(tabs)/chats" },
    { label: "My Matches 💖", icon: "heart-half-outline" as const, route: "/my-matches" },
    { label: "My Profile", icon: "person-outline" as const, route: "/(tabs)/profile" },
  ];

  return (
    <View style={styles.container} pointerEvents={isOpen ? "auto" : "none"}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropAnim]}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, drawerAnim, { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.md }]}>
        
        {/* User Info Header */}
        <View style={styles.header}>
          <Image 
            source={{ uri: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop" }} 
            style={styles.avatar} 
          />
          <View style={styles.headerDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user?.name || "Mayur"}</Text>
              <Ionicons name="checkmark-circle" size={16} color="#8A56FF" />
            </View>
            <LinearGradient colors={["#8A56FF", "#FF4B81"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.premiumBadge}>
              <Ionicons name="diamond" size={10} color="#FFD700" />
              <Text style={styles.premiumText}>PREMIUM MEMBER</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.divider} />



        {/* Navigation Items */}
        <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => (
            <Pressable 
              key={item.label} 
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]} 
              onPress={() => handleNavigation(item.route)}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={18} color="#8A56FF" />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="rgba(31, 26, 58, 0.25)" />
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
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
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
    backgroundColor: "#000",
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
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "rgba(138, 86, 255, 0.12)",
    shadowColor: "#8A56FF",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "#8A56FF",
  },
  headerDetails: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#1F1A3A",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
  },
  premiumText: {
    color: "#fff",
    fontSize: 8,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(31, 26, 58, 0.08)",
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  sectionMatches: {
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: VibeColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matchCount: {
    backgroundColor: "rgba(138,86,255,0.2)",
    color: "#C084FC",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  matchesScroll: {
    paddingVertical: 2,
    gap: Spacing.md,
  },
  matchItem: {
    alignItems: "center",
    width: 60,
    marginRight: Spacing.sm,
  },
  matchAvatarContainer: {
    position: "relative",
    width: 50,
    height: 50,
  },
  matchAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: VibeColors.neonGreenDim,
    borderWidth: 2,
    borderColor: VibeColors.bgCard,
  },
  matchName: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: VibeColors.text,
    marginTop: 6,
    textAlign: "center",
  },
  noMatchesBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  noMatchesText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: VibeColors.textMuted,
    flex: 1,
  },
  menuScroll: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    marginHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  menuItemPressed: {
    backgroundColor: "rgba(138, 86, 255, 0.08)",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(138, 86, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(138, 86, 255, 0.15)",
  },
  menuItemLabel: {
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: "#1F1A3A",
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
  },
  logoutButtonPressed: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  logoutText: {
    fontSize: 14,
    fontFamily: VibeFonts.semiBold,
    color: "#EF4444",
  },
});
