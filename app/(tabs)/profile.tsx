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
import { API_URL } from "../../constants/theme";
import { VibeFonts } from "../../constants/vibeTheme";

/** Same light palette as Hangout screen */
const T = {
  bg: "#EEE9F8",
  card: "#FFFBFE",
  ink: "#1A1F36",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E4DFF0",
  purple: "#8B5CF6",
  purpleDeep: "#7C3AED",
  pink: "#EC4899",
  softPurple: "#EDE7FF",
  green: "#22C55E",
  amber: "#F59E0B",
  blue: "#3B82F6",
  cta: ["#8B5CF6", "#EC4899"] as const,
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
  const router = useRouter();
  const { matches, likesCount } = useMatches();
  const { myPlans } = usePlans();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = (await api.getProfile(token)) as any;
      if (res) setProfile(res.profile);
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

  const stats = [
    { label: "Matches", value: String(matches.length), color: T.pink, icon: "heart" as const },
    { label: "Likes", value: String(likesCount), color: T.purple, icon: "flame" as const },
    { label: "Plans", value: String(myPlans.length), color: T.green, icon: "calendar" as const },
    {
      label: "Status",
      value: profile?.isOnline !== false ? "Live" : "Away",
      color: T.amber,
      icon: "flash" as const,
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      <LinearGradient
        colors={["rgba(167,139,250,0.22)", "transparent"]}
        style={styles.glowTop}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <LinearGradient
        colors={["rgba(244,114,182,0.12)", "transparent"]}
        style={styles.glowBottom}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
      />
      <View style={styles.coolOrb} />

      <AppHeader variant="light" badgeCount={likesCount} />

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
            {/* Hero */}
            <Animated.View entering={FadeInDown.duration(420)} style={styles.heroWrap}>
              <LinearGradient
                colors={["#F8F4FF", "#FFFFFF", "#FFF5FA"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
              >
                <View style={styles.heroTopRow}>
                  <View style={styles.avatarWrap}>
                    <LinearGradient colors={[...T.cta]} style={styles.avatarRing}>
                      <Image source={{ uri: getAvatarUri() }} style={styles.avatar} />
                    </LinearGradient>
                    <View style={styles.onlineBadge}>
                      <PulseDot size={5} />
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
                      <Ionicons name="location" size={12} color={T.purple} />
                      <Text style={styles.locText}>{city}</Text>
                      {profile?.isVerified ? (
                        <View style={styles.verified}>
                          <Ionicons name="checkmark-circle" size={12} color={T.blue} />
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
              </LinearGradient>
            </Animated.View>

            {/* Stats */}
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.statsRow}>
              {stats.map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: `${s.color}18` }]}>
                    <Ionicons name={s.icon} size={14} color={s.color} />
                  </View>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </Animated.View>

            {/* Quick shortcuts */}
            <Animated.View entering={FadeInDown.delay(120).duration(400)}>
              <Text style={styles.sectionTitle}>Quick access</Text>
              <View style={styles.quickRow}>
                <Pressable style={styles.quickCard} onPress={() => router.push("/create-plan")}>
                  <LinearGradient colors={["#16A34A", "#22C55E"]} style={styles.quickIcon}>
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
                  <LinearGradient colors={["#D97706", "#F59E0B"]} style={styles.quickIcon}>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.quickLabel}>Jar</Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* Menu */}
            <Animated.View entering={FadeInUp.delay(160).duration(400)}>
              <Text style={styles.sectionTitle}>Account</Text>
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
                    <View style={[styles.menuIcon, { backgroundColor: `${item.color}18` }]}>
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
  glowTop: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  glowBottom: {
    position: "absolute",
    bottom: 100,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  coolOrb: {
    position: "absolute",
    top: "45%",
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(125, 211, 252, 0.1)",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 4,
  },
  loader: { height: 220, alignItems: "center", justifyContent: "center" },
  heroWrap: { marginBottom: 14 },
  hero: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EDE7FF",
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  heroTopRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarWrap: { position: "relative" },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: "#fff",
  },
  onlineBadge: {
    position: "absolute",
    bottom: -2,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    shadowColor: "#1A1F36",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  onlineText: { fontSize: 9, fontFamily: VibeFonts.bold, color: T.green },
  heroInfo: { flex: 1, minWidth: 0 },
  name: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.4,
  },
  email: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.faint,
    marginTop: 3,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    flexWrap: "wrap",
  },
  locText: { fontSize: 12, fontFamily: VibeFonts.semiBold, color: T.purple },
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: 6,
    backgroundColor: "rgba(59,130,246,0.1)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedText: { fontSize: 10, fontFamily: VibeFonts.bold, color: T.blue },
  bio: {
    marginTop: 14,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    lineHeight: 19,
  },
  bioEmpty: {
    marginTop: 14,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.faint,
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
    shadowColor: T.pink,
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
  editBtnText: { color: "#fff", fontSize: 13, fontFamily: VibeFonts.bold },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: T.softPurple,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  shareBtnText: { color: T.purpleDeep, fontSize: 13, fontFamily: VibeFonts.bold },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    shadowColor: "#1A1F36",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: { fontSize: 16, fontFamily: VibeFonts.extraBold },
  statLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
    color: T.faint,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: VibeFonts.bold,
    color: T.ink,
    marginBottom: 10,
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },
  quickCard: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 14,
    alignItems: "center",
    gap: 8,
    shadowColor: "#1A1F36",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
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
    color: T.ink,
  },
  menuCard: {
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#1A1F36",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
    borderBottomColor: T.border,
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
    color: T.ink,
  },
  menuSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.faint,
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
    color: T.faint,
    marginBottom: 8,
  },
});
