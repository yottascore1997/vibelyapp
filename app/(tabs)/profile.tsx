import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import AppHeader from "../../components/vibe/AppHeader";
import PulseDot from "../../components/home/PulseDot";
import { useAuth } from "../../context/AuthContext";
import { useMatches } from "../../context/MatchesContext";
import { usePlans } from "../../context/PlansContext";
import { api } from "../../services/api";
import { usePremium } from "../../context/PremiumContext";
import { API_URL } from "../../constants/theme";
import { VibeFonts } from "../../constants/vibeTheme";

/** Light clean minimal aesthetic matching Hangout screen */
const T = {
  bg: "#F8F9FD",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  ink: "#18181B",
  muted: "#64748B",
  faint: "#94A3B8",
  border: "#E2E8F0",
  purple: "#7C3AED",
  purpleDeep: "#6D28D9",
  purpleBright: "#8B5CF6",
  softPurple: "#F3E8FF",
  pink: "#EC4899",
  green: "#10B981",
  yellow: "#F59E0B",
  red: "#EF4444",
  blue: "#2563EB",
  cta: ["#7C3AED", "#8B5CF6"] as const,
  promo: ["#7C3AED", "#8B5CF6", "#EC4899"] as const,
};

const MENU = [
  {
    icon: "person-outline" as const,
    label: "Edit Profile",
    sub: "Photos, bio, city & more",
    color: T.purple,
    route: "/edit-profile",
  },
  {
    icon: "heart-outline" as const,
    label: "My Matches",
    sub: "People you connected with",
    color: T.pink,
    route: "/(tabs)/chats",
  },
  {
    icon: "calendar-outline" as const,
    label: "My Hangouts",
    sub: "Plans you created or joined",
    color: T.green,
    route: "/hangout",
  },
  {
    icon: "mail-outline" as const,
    label: "Invites",
    sub: "Sent & received invites",
    color: T.blue,
    route: "/invites",
  },
  {
    icon: "settings-outline" as const,
    label: "Edit preferences",
    sub: "Age range, distance & looking for",
    color: T.muted,
    route: "/edit-profile",
  },
  {
    icon: "shield-checkmark-outline" as const,
    label: "Safety",
    sub: "Tips for meeting in real life",
    color: T.green,
    route: "/(tabs)/vibes",
  },
];

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { openPaywall, tier, isPremium } = usePremium();
  const router = useRouter();
  const { matches, likesCount } = useMatches();
  const { myPlans } = usePlans();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myEnergy, setMyEnergy] = useState<"LESSGO" | "MAYBE" | "OFF_GRID">("LESSGO");

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = (await api.getProfile(token)) as any;
      if (res) {
        setProfile(res.profile);
        if (res.socialStatus?.energy) setMyEnergy(res.socialStatus.energy);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleLogout = () => {
    Alert.alert("Log Out", "Kya aap log out karna chahte ho?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/welcome");
        },
      },
    ]);
  };

  const getAvatarUri = () => {
    if (profile?.avatarUrl) {
      if (profile.avatarUrl.startsWith("/")) {
        return `${API_URL.replace("/api", "")}${profile.avatarUrl}`;
      }
      return profile.avatarUrl;
    }
    return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop";
  };

  const displayName = profile?.firstName || user?.name || "You";
  const age = profile?.age ? `, ${profile.age}` : "";
  const city = profile?.city ? `${profile.city}` : "Add your city";

  const handleToggleEnergy = async () => {
    const next = myEnergy === "LESSGO" ? "MAYBE" : myEnergy === "MAYBE" ? "OFF_GRID" : "LESSGO";
    setMyEnergy(next);
    try {
      await api.updateSocialStatus({
        energy: next,
        freeNow: next === "LESSGO",
      });
    } catch (err) {
      console.error("Failed to update social status from profile:", err);
    }
  };

  const energyDisplay = myEnergy === "LESSGO" ? "Lessgo 🟢" : myEnergy === "OFF_GRID" ? "Off grid 🔴" : "Maybe 🟡";
  const energyColor = myEnergy === "LESSGO" ? T.green : myEnergy === "OFF_GRID" ? T.red : T.yellow;

  const stats = [
    { label: "Matches", value: String(matches.length), color: T.pink, icon: "heart" as const, onPress: undefined },
    { label: "Likes", value: String(likesCount), color: T.purple, icon: "flame" as const, onPress: undefined },
    { label: "Plans", value: String(myPlans.length), color: T.green, icon: "calendar" as const, onPress: undefined },
    {
      label: "Energy",
      value: energyDisplay,
      color: energyColor,
      icon: "flash" as const,
      onPress: handleToggleEnergy,
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <AppHeader variant="light" tagline="Your Profile · Personal Vibe" badgeCount={likesCount} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={T.purple} size="large" />
          </View>
        ) : (
          <>
            {/* Hero Card */}
            <Animated.View entering={FadeInDown.duration(420)} style={styles.heroWrap}>
              <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  <View style={styles.avatarWrap}>
                    <LinearGradient colors={[...T.cta]} style={styles.avatarRing}>
                      <Image source={{ uri: getAvatarUri() }} style={styles.avatar} />
                    </LinearGradient>
                    <View style={styles.onlineBadge}>
                      <PulseDot size={5} color="#16A34A" />
                      <Text style={styles.onlineText}>Online</Text>
                    </View>
                  </View>

                  <View style={styles.heroInfo}>
                    <Text style={styles.name} numberOfLines={1}>
                      {displayName}
                      {age}
                    </Text>
                    <Text style={styles.email} numberOfLines={1}>
                      {user?.email || "—"}
                    </Text>
                    <View style={styles.locRow}>
                      <Ionicons name="location" size={13} color={T.purple} />
                      <Text style={styles.locText}>{city}</Text>
                      {profile?.isVerified ? (
                        <View style={styles.verified}>
                          <Ionicons name="checkmark-circle" size={13} color={T.blue} />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>

                {profile?.bio ? (
                  <Text style={styles.bio} numberOfLines={3}>
                    {profile.bio}
                  </Text>
                ) : (
                  <Text style={styles.bioEmpty}>Add a bio so people know your vibe.</Text>
                )}

                <View style={styles.heroActions}>
                  <Pressable
                    style={styles.editBtn}
                    onPress={() => router.push("/edit-profile")}
                  >
                    <LinearGradient
                      colors={[...T.cta]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.editBtnGrad}
                    >
                      <Ionicons name="create-outline" size={16} color="#fff" />
                      <Text style={styles.editBtnText}>Edit Profile</Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable
                    style={styles.shareBtn}
                    onPress={() => router.push("/(tabs)/discover")}
                  >
                    <Ionicons name="compass-outline" size={18} color={T.purple} />
                    <Text style={styles.shareBtnText}>Discover</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>

            {/* Premium Banner Card */}
            <Animated.View entering={FadeInDown.delay(70).duration(400)} style={styles.premiumBannerWrap}>
              <Pressable onPress={openPaywall}>
                <LinearGradient
                  colors={tier === "VIP" ? ["#F59E0B", "#D97706", "#7C3AED"] : tier === "GOLD" ? ["#7C3AED", "#8B5CF6"] : ["#1E1B4B", "#2E1065", "#0F172A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.premiumBannerCard}
                >
                  <View style={styles.premiumBannerLeft}>
                    <View style={styles.premiumCrownBox}>
                      <Text style={styles.premiumCrownEmoji}>👑</Text>
                    </View>
                    <View style={styles.premiumTextGroup}>
                      <Text style={styles.premiumBannerTitle}>
                        {tier === "VIP" ? "VibeVIP Active 👑" : tier === "GOLD" ? "VibeGold Active 🌟" : "VibeGold Premium"}
                      </Text>
                      <Text style={styles.premiumBannerSub}>
                        {isPremium ? "All Premium Perks Unlocked!" : "See Who Liked You • Starts at ₹99/wk"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.premiumCtaBtn}>
                    <Text style={styles.premiumCtaText}>{isPremium ? "MANAGE" : "UPGRADE"}</Text>
                    <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Stats Row */}
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.statsRow}>
              {stats.map((s) => (
                <Pressable
                  key={s.label}
                  style={styles.statCard}
                  onPress={s.onPress}
                  disabled={!s.onPress}
                >
                  <View style={[styles.statIcon, { backgroundColor: `${s.color}15` }]}>
                    <Ionicons name={s.icon} size={14} color={s.color} />
                  </View>
                  <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1}>
                    {s.value}
                  </Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </Pressable>
              ))}
            </Animated.View>

            {/* Quick access */}
            <Animated.View entering={FadeInDown.delay(120).duration(400)}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Quick Access ⚡</Text>
              </View>
              <View style={styles.quickRow}>
                <Pressable style={styles.quickCard} onPress={() => router.push("/create-plan")}>
                  <LinearGradient colors={["#10B981", "#059669"]} style={styles.quickIcon}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.quickLabel}>New Plan</Text>
                </Pressable>
                <Pressable style={styles.quickCard} onPress={() => router.push("/reels")}>
                  <LinearGradient colors={[...T.cta]} style={styles.quickIcon}>
                    <Ionicons name="people" size={18} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.quickLabel}>Friends</Text>
                </Pressable>
                <Pressable style={styles.quickCard} onPress={() => router.push("/(tabs)/jar")}>
                  <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.quickIcon}>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.quickLabel}>Jar</Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* Menu */}
            <Animated.View entering={FadeInUp.delay(160).duration(400)}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Account Settings ⚙️</Text>
              </View>
              <View style={styles.menuCard}>
                {MENU.map((item, i) => (
                  <Pressable
                    key={item.label}
                    style={[styles.menuRow, i < MENU.length - 1 && styles.menuBorder]}
                    onPress={() => {
                      if (item.route) router.push(item.route as any);
                      else Alert.alert(item.label, "Coming soon.");
                    }}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                      <Ionicons name={item.icon} size={18} color={item.color} />
                    </View>
                    <View style={styles.menuCopy}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuSub}>{item.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={T.faint} />
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Logout Button */}
            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>

            <Text style={styles.version}>Vibely</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 4,
  },
  loader: { height: 220, alignItems: "center", justifyContent: "center" },
  heroWrap: { marginBottom: 16 },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heroTopRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarWrap: { position: "relative" },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  onlineBadge: {
    position: "absolute",
    bottom: -2,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  onlineText: { fontSize: 9, fontFamily: VibeFonts.bold, color: "#16A34A" },
  heroInfo: { flex: 1, minWidth: 0 },
  name: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    letterSpacing: -0.4,
  },
  email: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 3,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    flexWrap: "wrap",
  },
  locText: { fontSize: 12, fontFamily: VibeFonts.semiBold, color: "#7C3AED" },
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: 6,
    backgroundColor: "rgba(37,99,235,0.1)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedText: { fontSize: 10, fontFamily: VibeFonts.bold, color: "#2563EB" },
  bio: {
    marginTop: 14,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    lineHeight: 19,
  },
  bioEmpty: {
    marginTop: 14,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  heroActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  editBtn: {
    flex: 1.2,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  editBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  editBtnText: { color: "#FFFFFF", fontSize: 13, fontFamily: VibeFonts.bold },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  shareBtnText: { color: "#7C3AED", fontSize: 13, fontFamily: VibeFonts.bold },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: { fontSize: 15, fontFamily: VibeFonts.extraBold },
  statLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
    color: "#94A3B8",
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 14,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuCopy: { flex: 1 },
  menuLabel: {
    fontSize: 14,
    fontFamily: VibeFonts.semiBold,
    color: "#18181B",
  },
  menuSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    marginBottom: 14,
  },
  logoutText: { fontSize: 14, fontFamily: VibeFonts.bold, color: "#EF4444" },
  version: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginBottom: 8,
  },
  premiumBannerWrap: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  premiumBannerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  premiumBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  premiumCrownBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumCrownEmoji: { fontSize: 20 },
  premiumTextGroup: { flex: 1 },
  premiumBannerTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  premiumBannerSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  premiumCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  premiumCtaText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
});
