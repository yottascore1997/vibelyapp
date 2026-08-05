import { useState, useCallback, useMemo, useEffect } from "react";
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
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import AppHeader from "../../components/vibe/AppHeader";
import HangoutCinematicBackground from "../../components/vibe/HangoutCinematicBackground";
import { useAuth } from "../../context/AuthContext";
import { useMatches } from "../../context/MatchesContext";
import { usePlans } from "../../context/PlansContext";
import { api } from "../../services/api";
import { usePremium } from "../../context/PremiumContext";
import { API_URL } from "../../constants/theme";
import { VibeFonts } from "../../constants/vibeTheme";

const { width: SCREEN_W } = Dimensions.get("window");
const HERO_H = Math.min(SCREEN_W * 1.05, 420);

const T = {
  bg: "#070A14",
  card: "rgba(16, 20, 36, 0.92)",
  cardSoft: "rgba(22, 26, 46, 0.72)",
  ink: "#F4F6FB",
  muted: "#A7B0C4",
  soft: "#7C869C",
  border: "rgba(160, 170, 200, 0.14)",
  gold: "#FBBF24",
  goldSoft: "rgba(251, 191, 36, 0.14)",
  goldBorder: "rgba(251, 191, 36, 0.32)",
  purple: "#A78BFA",
  softPurple: "rgba(139, 92, 246, 0.16)",
  green: "#34D399",
  softGreen: "rgba(52, 211, 153, 0.14)",
  yellow: "#FBBF24",
  red: "#F87171",
  cta: ["#7C3AED", "#A78BFA"] as [string, string],
  goldGrad: ["#F59E0B", "#D97706", "#B45309"] as [string, string, string],
};

type Energy = "LESSGO" | "MAYBE" | "OFF_GRID";

const MENU = [
  {
    icon: "person-outline" as const,
    label: "Edit Profile",
    sub: "Photos, bio, city & more",
    color: T.gold,
    soft: T.goldSoft,
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
    soft: "rgba(160, 170, 200, 0.12)",
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

const ENERGY_OPTS: {
  id: Energy;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  soft: string;
}[] = [
  {
    id: "LESSGO",
    label: "Lessgo",
    icon: "flash",
    color: T.green,
    soft: T.softGreen,
  },
  {
    id: "MAYBE",
    label: "Maybe",
    icon: "ellipse",
    color: T.yellow,
    soft: "rgba(251, 191, 36, 0.14)",
  },
  {
    id: "OFF_GRID",
    label: "Off grid",
    icon: "moon",
    color: T.red,
    soft: "rgba(248, 113, 113, 0.14)",
  },
];

function GlowOrb() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.35,
    transform: [{ scale: 1 + pulse.value * 0.08 }],
  }));
  return <Animated.View style={[styles.glowOrb, style]} pointerEvents="none" />;
}

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { openPaywall, tier, isPremium } = usePremium();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matches, likesCount } = useMatches();
  const { myPlans } = usePlans();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myEnergy, setMyEnergy] = useState<Energy>("LESSGO");
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account & Data",
      "Kya aap apna profile aur saara data permanently delete karna chahte ho? Ye action undone nahi ho sakta.",
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
              Alert.alert(
                "Error",
                err?.message || "Account delete karne me dikkat aayi. Please dobara try karein."
              );
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

  const interests = useMemo(() => {
    const raw = profile?.interests;
    if (!Array.isArray(raw) || raw.length === 0) return [] as string[];
    return raw
      .map((i: any) => (typeof i === "string" ? i : i?.interest?.name || i?.name))
      .filter(Boolean)
      .slice(0, 6) as string[];
  }, [profile?.interests]);

  const setEnergy = async (next: Energy) => {
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
      /* ignore */
    }
  };

  const avatarUri = getAvatarUri();
  const completeness = useMemo(() => {
    let n = 0;
    const checks = [
      !!profile?.avatarUrl,
      !!profile?.bio,
      !!profile?.city,
      !!profile?.age,
      !!jobLine,
      interests.length > 0,
    ];
    checks.forEach((ok) => {
      if (ok) n += 1;
    });
    return Math.round((n / checks.length) * 100);
  }, [profile, jobLine, interests.length]);

  return (
    <View style={styles.root}>
      <HangoutCinematicBackground />
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <View style={styles.foreground}>
        <AppHeader variant="dark" tagline="Your world · Your vibe" badgeCount={likesCount} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: 120 + insets.bottom }]}
        >
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={T.gold} size="large" />
              <Text style={styles.loaderText}>Loading your profile…</Text>
            </View>
          ) : (
            <>
              {/* Full-bleed cinematic hero */}
              <Animated.View entering={FadeIn.duration(480)} style={styles.hero}>
                <Image source={{ uri: avatarUri }} style={styles.heroImage} />
                <LinearGradient
                  colors={[
                    "rgba(7,10,20,0.15)",
                    "rgba(7,10,20,0.35)",
                    "rgba(7,10,20,0.92)",
                    T.bg,
                  ]}
                  locations={[0, 0.35, 0.72, 1]}
                  style={styles.heroGrad}
                />
                <GlowOrb />

                <View style={styles.heroTopRow}>
                  {isPremium ? (
                    <View style={styles.memberBadge}>
                      <Ionicons name="diamond" size={11} color={T.gold} />
                      <Text style={styles.memberBadgeText}>
                        {tier === "VIP" ? "VIP" : "GOLD"}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.memberBadgeMuted}>
                      <Text style={styles.memberBadgeMutedText}>MEMBER</Text>
                    </View>
                  )}
                  <View style={styles.heroTopActions}>
                    <Pressable style={styles.heroIconBtn} onPress={handleShare}>
                      <Ionicons name="share-outline" size={16} color="#FFF" />
                    </Pressable>
                    <Pressable
                      style={styles.heroIconBtn}
                      onPress={() => router.push("/edit-profile")}
                    >
                      <Ionicons name="create-outline" size={16} color="#FFF" />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.heroBottom}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {displayName}
                      {age}
                    </Text>
                    {profile?.isVerified ? (
                      <View style={styles.verifiedMark}>
                        <Ionicons name="checkmark" size={12} color="#04140A" />
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                      <Ionicons name="location" size={12} color={T.gold} />
                      <Text style={styles.metaChipText}>{city}</Text>
                    </View>
                    {jobLine ? (
                      <View style={styles.metaChip}>
                        <Ionicons name="briefcase-outline" size={12} color={T.purple} />
                        <Text style={styles.metaChipText} numberOfLines={1}>
                          {jobLine}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.bio} numberOfLines={3}>
                    {profile?.bio || "Add a bio so people know your vibe."}
                  </Text>

                  {interests.length > 0 ? (
                    <View style={styles.interestRow}>
                      {interests.map((tag) => (
                        <View key={tag} style={styles.interestChip}>
                          <Text style={styles.interestText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <Pressable
                    style={styles.editBtn}
                    onPress={() => router.push("/edit-profile")}
                  >
                    <LinearGradient
                      colors={T.cta}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.editGrad}
                    >
                      <Ionicons name="sparkles" size={15} color="#FFF" />
                      <Text style={styles.editText}>Edit profile</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </Animated.View>

              {/* Profile strength */}
              <Animated.View
                entering={FadeInDown.delay(60).duration(360)}
                style={styles.strengthCard}
              >
                <View style={styles.strengthTop}>
                  <View>
                    <Text style={styles.strengthTitle}>Profile strength</Text>
                    <Text style={styles.strengthSub}>
                      {completeness >= 80
                        ? "Looking sharp — keep it fresh"
                        : "Complete your profile to get more hangs"}
                    </Text>
                  </View>
                  <Text style={styles.strengthPct}>{completeness}%</Text>
                </View>
                <View style={styles.strengthTrack}>
                  <LinearGradient
                    colors={
                      completeness >= 80
                        ? (["#34D399", "#059669"] as [string, string])
                        : T.cta
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.strengthFill, { width: `${completeness}%` as any }]}
                  />
                </View>
              </Animated.View>

              {/* Stats */}
              <Animated.View
                entering={FadeInDown.delay(100).duration(360)}
                style={styles.statsRow}
              >
                <Pressable
                  style={styles.statCard}
                  onPress={() => router.push("/my-matches")}
                >
                  <Text style={styles.statValue}>{matches.length}</Text>
                  <Text style={styles.statLabel}>Matches</Text>
                </Pressable>
                <Pressable
                  style={styles.statCard}
                  onPress={() => router.push("/my-matches")}
                >
                  <Text style={[styles.statValue, { color: T.purple }]}>{likesCount}</Text>
                  <Text style={styles.statLabel}>Likes</Text>
                </Pressable>
                <Pressable
                  style={styles.statCard}
                  onPress={() => router.push("/hangout")}
                >
                  <Text style={[styles.statValue, { color: T.green }]}>{myPlans.length}</Text>
                  <Text style={styles.statLabel}>Plans</Text>
                </Pressable>
              </Animated.View>

              {/* Energy */}
              <Animated.View
                entering={FadeInDown.delay(130).duration(360)}
                style={styles.section}
              >
                <Text style={styles.sectionTitle}>Social energy</Text>
                <View style={styles.energyRow}>
                  {ENERGY_OPTS.map((opt) => {
                    const active = myEnergy === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => setEnergy(opt.id)}
                        style={[
                          styles.energyCard,
                          active && {
                            borderColor: opt.color,
                            backgroundColor: opt.soft,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.energyIcon,
                            { backgroundColor: active ? opt.soft : "rgba(255,255,255,0.04)" },
                          ]}
                        >
                          <Ionicons
                            name={opt.icon}
                            size={16}
                            color={active ? opt.color : T.soft}
                          />
                        </View>
                        <Text
                          style={[
                            styles.energyLabel,
                            active && { color: opt.color },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>

              {/* Membership */}
              <Animated.View entering={FadeInDown.delay(160).duration(360)}>
                <Pressable onPress={openPaywall} style={styles.premiumWrap}>
                  <LinearGradient
                    colors={
                      tier === "VIP"
                        ? T.goldGrad
                        : tier === "GOLD"
                          ? (["#7C3AED", "#A78BFA", "#C4B5FD"] as [
                              string,
                              string,
                              string,
                            ])
                          : (["#1A1530", "#2A1F4A", "#1E1B4B"] as [
                              string,
                              string,
                              string,
                            ])
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.premiumCard}
                  >
                    <View style={styles.premiumShine} />
                    <View style={styles.premiumIcon}>
                      <Ionicons name="diamond" size={20} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.premiumEyebrow}>MEMBERSHIP</Text>
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
                      <Text style={styles.premiumCtaText}>
                        {isPremium ? "Manage" : "Upgrade"}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color="#FFF" />
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              {/* Quick actions */}
              <Animated.View
                entering={FadeInDown.delay(190).duration(360)}
                style={styles.section}
              >
                <Text style={styles.sectionTitle}>Quick actions</Text>
                <View style={styles.quickRow}>
                  <Pressable
                    style={styles.quickCard}
                    onPress={() => router.push("/create-plan")}
                  >
                    <LinearGradient
                      colors={["rgba(52,211,153,0.2)", "rgba(52,211,153,0.05)"]}
                      style={styles.quickIcon}
                    >
                      <Ionicons name="add" size={20} color={T.green} />
                    </LinearGradient>
                    <Text style={styles.quickLabel}>New Plan</Text>
                  </Pressable>
                  <Pressable
                    style={styles.quickCard}
                    onPress={() => router.push("/reels")}
                  >
                    <LinearGradient
                      colors={["rgba(167,139,250,0.22)", "rgba(167,139,250,0.05)"]}
                      style={styles.quickIcon}
                    >
                      <Ionicons name="people" size={18} color={T.purple} />
                    </LinearGradient>
                    <Text style={styles.quickLabel}>Friends</Text>
                  </Pressable>
                  <Pressable
                    style={styles.quickCard}
                    onPress={() => router.push("/spot-broadcast")}
                  >
                    <LinearGradient
                      colors={["rgba(251,191,36,0.2)", "rgba(251,191,36,0.05)"]}
                      style={styles.quickIcon}
                    >
                      <Ionicons name="flash" size={18} color={T.gold} />
                    </LinearGradient>
                    <Text style={styles.quickLabel}>Spot Hub</Text>
                  </Pressable>
                </View>
              </Animated.View>

              {/* Account menu */}
              <Animated.View
                entering={FadeInUp.delay(220).duration(360)}
                style={styles.section}
              >
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
                <Ionicons name="log-out-outline" size={17} color={T.red} />
                <Text style={styles.logoutText}>Log Out</Text>
              </Pressable>

              <Pressable
                onPress={handleDeleteAccount}
                disabled={deleting}
                style={[styles.deleteBtn, deleting && { opacity: 0.6 }]}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={T.red} />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={17} color={T.red} />
                    <Text style={styles.deleteText}>Delete Account</Text>
                  </>
                )}
              </Pressable>

              <Text style={styles.version}>Hangora · Profile</Text>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  foreground: { flex: 1, zIndex: 1, backgroundColor: "transparent" },
  scroll: { paddingBottom: 120 },
  loader: {
    height: 280,
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
    height: HERO_H,
    marginBottom: 14,
    overflow: "hidden",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroGrad: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOrb: {
    position: "absolute",
    right: -40,
    top: 80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(251,191,36,0.18)",
  },
  heroTopRow: {
    position: "absolute",
    top: 14,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 4,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: T.goldBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  memberBadgeText: {
    color: T.gold,
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 1,
  },
  memberBadgeMuted: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  memberBadgeMutedText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    letterSpacing: 1,
  },
  heroTopActions: {
    flexDirection: "row",
    gap: 8,
  },
  heroIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 32,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
    letterSpacing: -0.8,
    maxWidth: SCREEN_W - 80,
  },
  verifiedMark: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: T.green,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    maxWidth: SCREEN_W - 48,
  },
  metaChipText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.72)",
    marginTop: 2,
  },
  interestRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  interestChip: {
    backgroundColor: "rgba(167,139,250,0.18)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  interestText: {
    color: "#E9D5FF",
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
  },
  editBtn: {
    marginTop: 6,
    borderRadius: 16,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  editGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
  },
  editText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
  },

  strengthCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    gap: 10,
  },
  strengthTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  strengthTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  strengthSub: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.soft,
    maxWidth: SCREEN_W - 140,
  },
  strengthPct: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: T.gold,
    letterSpacing: -0.4,
  },
  strengthTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 999,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: T.soft,
  },

  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  energyRow: {
    flexDirection: "row",
    gap: 10,
  },
  energyCard: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: T.border,
    paddingVertical: 12,
    alignItems: "center",
    gap: 8,
  },
  energyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  energyLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.muted,
  },

  premiumWrap: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  premiumCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    overflow: "hidden",
  },
  premiumShine: {
    position: "absolute",
    top: -40,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  premiumIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumEyebrow: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.2,
  },
  premiumTitle: {
    marginTop: 2,
    fontSize: 15,
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
    paddingVertical: 7,
    borderRadius: 999,
  },
  premiumCtaText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
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
    width: 44,
    height: 44,
    borderRadius: 15,
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
    borderBottomColor: T.border,
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
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.28)",
    marginBottom: 10,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: T.red,
  },
  deleteBtn: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "rgba(248, 113, 113, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.22)",
    marginBottom: 16,
  },
  deleteText: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: T.red,
  },
  version: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.soft,
    marginBottom: 8,
  },
});
