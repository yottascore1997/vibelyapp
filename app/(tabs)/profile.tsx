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
  Dimensions,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import AppHeader from "../../components/vibe/AppHeader";
import { useAuth } from "../../context/AuthContext";
import { useMatches } from "../../context/MatchesContext";
import { usePlans } from "../../context/PlansContext";
import { api } from "../../services/api";
import { usePremium } from "../../context/PremiumContext";
import { API_URL } from "../../constants/theme";
import { VibeFonts } from "../../constants/vibeTheme";

const { width: SCREEN_W } = Dimensions.get("window");
const HERO_H = Math.min(SCREEN_W * 0.72, 300);

const T = {
  bg: "#F8F9FD",
  card: "#FFFFFF",
  ink: "#18181B",
  muted: "#64748B",
  soft: "#94A3B8",
  border: "#EDE7FF",
  purple: "#7C3AED",
  purpleBright: "#8B5CF6",
  softPurple: "#F3E8FF",
  green: "#22C55E",
  softGreen: "#ECFDF5",
  yellow: "#F59E0B",
  red: "#EF4444",
  purpleGrad: ["#7C3AED", "#8B5CF6"] as [string, string],
};

const MENU = [
  {
    icon: "person-outline" as const,
    label: "Edit Profile",
    sub: "Photos, bio, city & more",
    color: T.purple,
    soft: T.softPurple,
    route: "/edit-profile",
  },
  {
    icon: "heart-outline" as const,
    label: "My Matches",
    sub: "People you connected with",
    color: T.purple,
    soft: T.softPurple,
    route: "/my-matches",
  },
  {
    icon: "calendar-outline" as const,
    label: "My Hangouts",
    sub: "Plans you created or joined",
    color: T.green,
    soft: T.softGreen,
    route: "/hangout",
  },
  {
    icon: "mail-outline" as const,
    label: "Invites",
    sub: "Sent & received invites",
    color: T.purple,
    soft: T.softPurple,
    route: "/invites",
  },
  {
    icon: "options-outline" as const,
    label: "Preferences",
    sub: "Age, distance & looking for",
    color: T.muted,
    soft: "#F1F5F9",
    route: "/edit-profile",
  },
  {
    icon: "shield-checkmark-outline" as const,
    label: "Safety",
    sub: "Tips for meeting IRL",
    color: T.green,
    soft: T.softGreen,
    route: "/(tabs)/vibes",
  },
];

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { openPaywall, tier, isPremium } = usePremium();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account & Data",
      "Kya aap apna profile aur saara data permanently delete karna chahte ho? Aapka saara profile data, matches, messages aur hangouts hamesha ke liye delete ho jayega. Ye action undone nahi ho sakta.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await api.deleteAccount(token || undefined);
              Alert.alert("Account Deleted", "Aapka profile aur data successfully delete ho gaya hai.");
              await logout();
              router.replace("/(auth)/welcome");
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Account delete karne me dikkat aayi. Please dobara try karein.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };


  const getAvatarUri = () => {
    if (profile?.avatarUrl) {
      if (profile.avatarUrl.startsWith("/")) {
        return `${API_URL.replace("/api", "")}${profile.avatarUrl}`;
      }
      return profile.avatarUrl;
    }
    return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&h=800&fit=crop";
  };

  const displayName = profile?.firstName || user?.name || "You";
  const age = profile?.age ? `, ${profile.age}` : "";
  const city = profile?.city || "Add your city";
  const jobLine = [profile?.jobTitle, profile?.company].filter(Boolean).join(" · ");

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

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Hey, I'm on Hangora — find me nearby ✨`,
      });
    } catch {
      // ignore
    }
  };

  const energyMeta =
    myEnergy === "LESSGO"
      ? { label: "Lessgo", color: T.green, soft: T.softGreen, icon: "flash" as const }
      : myEnergy === "OFF_GRID"
        ? { label: "Off grid", color: T.red, soft: "#FEF2F2", icon: "moon" as const }
        : { label: "Maybe", color: T.yellow, soft: "#FFFBEB", icon: "ellipse" as const };

  const avatarUri = getAvatarUri();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <AppHeader variant="light" tagline="Your vibe · Your world" badgeCount={likesCount} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 + insets.bottom }]}
      >
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={T.purple} size="large" />
            <Text style={styles.loaderText}>Loading your profile…</Text>
          </View>
        ) : (
          <>
            {/* Cinematic hero */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
              <Image source={{ uri: avatarUri }} style={styles.heroImage} blurRadius={18} />
              <LinearGradient
                colors={["rgba(15,23,42,0.55)", "rgba(76,29,149,0.35)", "#F8F9FD"]}
                locations={[0, 0.45, 1]}
                style={styles.heroGrad}
              />

              <View style={styles.heroContent}>
                <View style={styles.avatarWrap}>
                  <LinearGradient colors={T.purpleGrad} style={styles.avatarRing}>
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                  </LinearGradient>
                  <View style={styles.onlinePill}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>Online</Text>
                  </View>
                </View>

                <Text style={styles.name}>
                  {displayName}
                  {age}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Ionicons name="location" size={12} color="#FFF" />
                    <Text style={styles.metaChipText}>{city}</Text>
                  </View>
                  {profile?.isVerified ? (
                    <View style={[styles.metaChip, styles.verifiedChip]}>
                      <Ionicons name="checkmark" size={11} color="#FFF" />
                      <Text style={styles.metaChipText}>Verified</Text>
                    </View>
                  ) : null}
                </View>

                {jobLine ? (
                  <Text style={styles.jobLine} numberOfLines={1}>
                    {jobLine}
                  </Text>
                ) : null}

                <Text style={styles.bio} numberOfLines={3}>
                  {profile?.bio || "Add a bio so people know your vibe."}
                </Text>

                <View style={styles.heroActions}>
                  <Pressable style={styles.editBtn} onPress={() => router.push("/edit-profile")}>
                    <LinearGradient colors={T.purpleGrad} style={styles.editGrad}>
                      <Ionicons name="create-outline" size={16} color="#FFF" />
                      <Text style={styles.editText}>Edit Profile</Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable style={styles.secondaryBtn} onPress={handleShare}>
                    <Ionicons name="share-outline" size={16} color={T.purple} />
                    <Text style={styles.secondaryText}>Share</Text>
                  </Pressable>
                  <Pressable
                    style={styles.iconOnlyBtn}
                    onPress={() => router.push("/(tabs)/discover")}
                  >
                    <Ionicons name="compass-outline" size={18} color={T.purple} />
                  </Pressable>
                </View>
              </View>
            </Animated.View>

            {/* Stats strip */}
            <Animated.View entering={FadeInDown.delay(70).duration(360)} style={styles.statsCard}>
              <Pressable style={styles.statCell} onPress={() => router.push("/my-matches")}>
                <Text style={styles.statValue}>{matches.length}</Text>
                <Text style={styles.statLabel}>Matches</Text>
              </Pressable>
              <View style={styles.statDivider} />
              <Pressable style={styles.statCell} onPress={() => router.push("/my-matches")}>
                <Text style={[styles.statValue, { color: T.purple }]}>{likesCount}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </Pressable>
              <View style={styles.statDivider} />
              <Pressable style={styles.statCell} onPress={() => router.push("/hangout")}>
                <Text style={[styles.statValue, { color: T.green }]}>{myPlans.length}</Text>
                <Text style={styles.statLabel}>Plans</Text>
              </Pressable>
              <View style={styles.statDivider} />
              <Pressable style={styles.statCell} onPress={handleToggleEnergy}>
                <View style={[styles.energyPill, { backgroundColor: energyMeta.soft }]}>
                  <Ionicons name={energyMeta.icon} size={11} color={energyMeta.color} />
                  <Text style={[styles.energyText, { color: energyMeta.color }]}>
                    {energyMeta.label}
                  </Text>
                </View>
                <Text style={styles.statLabel}>Energy</Text>
              </Pressable>
            </Animated.View>

            {/* Premium */}
            <Animated.View entering={FadeInDown.delay(110).duration(360)}>
              <Pressable onPress={openPaywall} style={styles.premiumWrap}>
                <LinearGradient
                  colors={
                    tier === "VIP"
                      ? (["#F59E0B", "#D97706"] as [string, string])
                      : tier === "GOLD"
                        ? T.purpleGrad
                        : (["#1E1B4B", "#4C1D95"] as [string, string])
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.premiumCard}
                >
                  <View style={styles.premiumIcon}>
                    <Ionicons name="diamond" size={18} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.premiumTitle}>
                      {tier === "VIP"
                        ? "VibeVIP Active"
                        : tier === "GOLD"
                          ? "VibeGold Active"
                          : "Unlock VibeGold"}
                    </Text>
                    <Text style={styles.premiumSub}>
                      {isPremium
                        ? "All premium perks unlocked"
                        : "See who liked you · from ₹99/wk"}
                    </Text>
                  </View>
                  <View style={styles.premiumCta}>
                    <Text style={styles.premiumCtaText}>{isPremium ? "Manage" : "Upgrade"}</Text>
                    <Ionicons name="chevron-forward" size={14} color="#FFF" />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Quick actions */}
            <Animated.View entering={FadeInDown.delay(150).duration(360)} style={styles.section}>
              <Text style={styles.sectionTitle}>Quick actions</Text>
              <View style={styles.quickRow}>
                <Pressable style={styles.quickCard} onPress={() => router.push("/create-plan")}>
                  <View style={[styles.quickIcon, { backgroundColor: T.softGreen }]}>
                    <Ionicons name="add" size={20} color={T.green} />
                  </View>
                  <Text style={styles.quickLabel}>New Plan</Text>
                </Pressable>
                <Pressable style={styles.quickCard} onPress={() => router.push("/reels")}>
                  <View style={[styles.quickIcon, { backgroundColor: T.softPurple }]}>
                    <Ionicons name="people" size={18} color={T.purple} />
                  </View>
                  <Text style={styles.quickLabel}>Friends</Text>
                </Pressable>
                <Pressable style={styles.quickCard} onPress={() => router.push("/spot-broadcast")}>
                  <View style={[styles.quickIcon, { backgroundColor: T.softPurple }]}>
                    <Ionicons name="flash" size={18} color={T.purple} />
                  </View>
                  <Text style={styles.quickLabel}>Spot Hub</Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* Account menu */}
            <Animated.View entering={FadeInUp.delay(180).duration(360)} style={styles.section}>
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
                    <View style={[styles.menuIcon, { backgroundColor: item.soft }]}>
                      <Ionicons name={item.icon} size={17} color={item.color} />
                    </View>
                    <View style={styles.menuCopy}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuSub}>{item.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={T.soft} />
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={17} color="#EF4444" />
              <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>

            <Pressable
              onPress={handleDeleteAccount}
              disabled={deleting}
              style={[styles.deleteBtn, deleting && { opacity: 0.6 }]}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={17} color="#DC2626" />
                  <Text style={styles.deleteText}>Delete Account</Text>
                </>
              )}
            </Pressable>

            <Text style={styles.version}>Hangora · My Profile</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scroll: {
    paddingBottom: 120,
  },
  loader: {
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loaderText: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },

  hero: {
    width: SCREEN_W,
    minHeight: HERO_H + 120,
    marginBottom: 14,
    overflow: "hidden",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: HERO_H,
  },
  heroGrad: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    paddingTop: 36,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 36,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 102,
    height: 102,
    borderRadius: 33,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  onlinePill: {
    marginTop: -12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.green,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFF",
  },
  onlineText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
  },
  name: {
    fontSize: 28,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15,23,42,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  verifiedChip: {
    backgroundColor: T.purple,
  },
  metaChipText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
  jobLine: {
    marginTop: 8,
    fontSize: 12.5,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
  },
  bio: {
    marginTop: 10,
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: VibeFonts.medium,
    color: "#475569",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    width: "100%",
  },
  editBtn: {
    flex: 1.3,
    borderRadius: 14,
    overflow: "hidden",
  },
  editGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  editText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: T.softPurple,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  secondaryText: {
    color: T.purple,
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },
  iconOnlyBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },

  statsCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: T.border,
  },
  statValue: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
    color: T.soft,
  },
  energyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  energyText: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
  },

  premiumWrap: {
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 18,
    overflow: "hidden",
  },
  premiumCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  premiumIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
  },
  premiumSub: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.82)",
  },
  premiumCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  premiumCtaText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
  },

  section: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
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
  },
  quickIcon: {
    width: 42,
    height: 42,
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuCopy: { flex: 1 },
  menuLabel: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  menuSub: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.soft,
  },

  logoutBtn: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#EF4444",
  },
  deleteBtn: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    marginBottom: 16,
  },
  deleteText: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#DC2626",
  },
  version: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.soft,
    marginBottom: 8,
  },
});
