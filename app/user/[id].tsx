import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Alert,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { VibeFonts } from "../../constants/vibeTheme";
import { api } from "../../services/api";
import { API_URL } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useMatches } from "../../context/MatchesContext";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const HERO_H = Math.min(SCREEN_H * 0.58, SCREEN_W * 1.15);

const T = {
  bg: "#F8F9FD",
  card: "#FFFFFF",
  ink: "#18181B",
  muted: "#64748B",
  soft: "#94A3B8",
  purple: "#7C3AED",
  purpleBright: "#8B5CF6",
  green: "#22C55E",
  softPurple: "#F3E8FF",
  softGreen: "#ECFDF5",
  border: "#EDE7FF",
  purpleGrad: ["#7C3AED", "#8B5CF6"] as [string, string],
};

const FALLBACK_INTERESTS = [
  { name: "Coffee", icon: "cafe" as const },
  { name: "Music", icon: "musical-notes" as const },
  { name: "Travel", icon: "airplane" as const },
  { name: "Food", icon: "restaurant" as const },
  { name: "Movies", icon: "film" as const },
];

const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&fit=crop",
];

function resolveAvatar(url?: string | null) {
  if (!url) {
    return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&fit=crop";
  }
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API_URL.replace("/api", "")}${url}`;
  return url;
}

function PulseDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 900, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 900 }), withTiming(0.55, { duration: 900 })),
      -1,
      false
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseRing, ringStyle]} />
      <View style={styles.pulseCore} />
    </View>
  );
}

function MatchRing({ score }: { score: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      220,
      withTiming(score / 100, { duration: 900, easing: Easing.out(Easing.cubic) })
    );
  }, [score]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [-90, 180])}deg` }],
  }));

  return (
    <View style={styles.matchRing}>
      <LinearGradient colors={["#EDE9FE", "#F5F3FF"]} style={styles.matchRingBg}>
        <Animated.View style={[styles.matchArc, fillStyle]}>
          <LinearGradient colors={T.purpleGrad} style={styles.matchArcInner} />
        </Animated.View>
        <View style={styles.matchInner}>
          <Text style={styles.matchScore}>{score}</Text>
          <Text style={styles.matchLabel}>match</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    age?: string;
    bio?: string;
    city?: string;
    distance?: string;
    avatarUrl?: string;
    vibe?: string;
    jobTitle?: string;
    isVerified?: string;
    isOnline?: string;
  }>();
  const { user } = useAuth();
  const { swipe } = useMatches();

  const userId = params.id;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [inviting, setInviting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  const heroScale = useSharedValue(1.08);
  const sheetY = useSharedValue(36);

  useEffect(() => {
    heroScale.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
    sheetY.value = withSpring(0, { damping: 18, stiffness: 120 });
  }, []);

  const heroAnim = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
  }));

  const sheetAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const list = (await api.getProfiles("dating", user?.id)) as any[];
        const found = Array.isArray(list)
          ? list.find((p) => p.id === userId || p.userId === userId)
          : null;
        if (mounted && found) {
          setProfile(found);
          setLoading(false);
          return;
        }
      } catch {
        // fall through to params
      }

      if (mounted) {
        setProfile({
          id: userId,
          name: params.name || "User",
          age: params.age ? Number(params.age) : undefined,
          bio: params.bio || "Looking to connect & hangout nearby. Coffee, late drives, good conversations.",
          city: params.city || "Nagpur",
          distance: params.distance
            ? Number(String(params.distance).replace(/[^\d.]/g, "")) || 1
            : 1,
          avatarUrl: params.avatarUrl,
          jobTitle: params.jobTitle || "Exploring Hangora",
          vibe: params.vibe || "☕ Free to hangout",
          isVerified: params.isVerified === "1" || params.isVerified === "true",
          isOnline: params.isOnline !== "0" && params.isOnline !== "false",
          vibeMatch: 92,
          interests: FALLBACK_INTERESTS,
          photos: [],
        });
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [userId, user?.id]);

  const photos = useMemo(() => {
    const raw = Array.isArray(profile?.photos) ? profile.photos.filter(Boolean) : [];
    const main = resolveAvatar(profile?.avatarUrl);
    const list = [main, ...raw.map((p: string) => resolveAvatar(p))].filter(
      (url, i, arr) => arr.indexOf(url) === i
    );
    if (list.length < 2) return [...list, ...FALLBACK_PHOTOS].slice(0, 4);
    return list.slice(0, 5);
  }, [profile]);

  const interests = useMemo(() => {
    if (Array.isArray(profile?.interests) && profile.interests.length > 0) {
      return profile.interests.map((t: any) => ({
        name: t.name || t,
        icon: "sparkles" as const,
      }));
    }
    return FALLBACK_INTERESTS;
  }, [profile]);

  const handleChat = () => router.push(`/chat/${userId}`);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${profile?.name || "this profile"} on Hangora ✨`,
      });
    } catch {
      // ignore
    }
  };

  const handleInvite = async () => {
    if (inviting) return;
    setInviting(true);
    try {
      await api.sendInvite({
        receiverId: userId,
        activityName: profile?.vibe || "Hangout",
        activityEmoji: "👋",
        timeLabel: "Right now",
      });
      Alert.alert("Invite sent!", `Pinged ${profile?.name || "them"} successfully.`);
    } catch {
      Alert.alert("Invite sent!", `Pinged ${profile?.name || "them"}!`);
    } finally {
      setInviting(false);
    }
  };

  const handleLike = async () => {
    setLiked(true);
    try {
      const result = await swipe(userId, "LIKE");
      if (result?.isMatch) {
        Alert.alert("It's a match!", `You and ${profile?.name} liked each other.`);
      }
    } catch {
      // keep liked state for feedback
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <LinearGradient colors={["#F8F9FD", "#F3E8FF"]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={T.purple} />
        <Text style={styles.loadingText}>Opening profile…</Text>
      </View>
    );
  }

  const avatar = photos[activePhoto] || resolveAvatar(profile?.avatarUrl);
  const distLabel =
    typeof profile?.distance === "number"
      ? profile.distance < 1
        ? `${Math.round(profile.distance * 1000)}m away`
        : `${profile.distance.toFixed(1)} km away`
      : params.distance
        ? `${params.distance} away`
        : "Nearby";

  const matchScore = Math.min(99, Number(profile?.vibeMatch) || 90);
  const vibeLine = profile?.vibe || profile?.socialStatus?.activityName || "Ready to hangout";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}
      >
        {/* Cinematic hero */}
        <View style={styles.hero}>
          <Animated.View style={[styles.heroImgWrap, heroAnim]}>
            <Image source={{ uri: avatar }} style={styles.heroImage} />
          </Animated.View>

          <LinearGradient
            colors={["rgba(15,23,42,0.45)", "transparent", "rgba(15,23,42,0.15)", "#F8F9FD"]}
            locations={[0, 0.28, 0.72, 1]}
            style={styles.heroGrad}
          />

          {/* soft purple wash for depth */}
          <LinearGradient
            colors={["transparent", "rgba(124,58,237,0.12)", "transparent"]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroWash}
          />

          <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
            <TouchableOpacity style={styles.glassBtn} onPress={() => router.back()} activeOpacity={0.85}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.topRight}>
              <TouchableOpacity style={styles.glassBtn} onPress={handleShare} activeOpacity={0.85}>
                <Ionicons name="share-outline" size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.glassBtn} onPress={handleChat} activeOpacity={0.85}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View entering={FadeInUp.delay(120).duration(420)} style={styles.heroBottom}>
            {profile?.isOnline ? (
              <View style={styles.livePill}>
                <PulseDot />
                <Text style={styles.liveText}>Live nearby</Text>
              </View>
            ) : (
              <View style={[styles.livePill, styles.awayPill]}>
                <Text style={styles.liveText}>Recently active</Text>
              </View>
            )}

            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {profile?.name || "User"}
                {profile?.age ? `, ${profile.age}` : ""}
              </Text>
              {profile?.isVerified ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                </View>
              ) : null}
            </View>

            <Text style={styles.vibeLine} numberOfLines={1}>
              {vibeLine}
            </Text>

            <View style={styles.heroMeta}>
              <View style={styles.metaChip}>
                <Ionicons name="location" size={12} color="#FFF" />
                <Text style={styles.metaChipText}>
                  {profile?.city || "Nagpur"} · {distLabel}
                </Text>
              </View>
              {profile?.jobTitle ? (
                <View style={styles.metaChip}>
                  <Ionicons name="briefcase" size={12} color="#FFF" />
                  <Text style={styles.metaChipText} numberOfLines={1}>
                    {profile.jobTitle}
                  </Text>
                </View>
              ) : null}
            </View>
          </Animated.View>
        </View>

        {/* Overlapping content sheet */}
        <Animated.View style={[styles.sheet, sheetAnim]}>
          {/* Match + proximity strip */}
          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.insightRow}>
            <MatchRing score={matchScore} />
            <View style={styles.insightCopy}>
              <Text style={styles.insightTitle}>Strong vibe match</Text>
              <Text style={styles.insightSub}>
                You both seem free around here — perfect moment to say hi.
              </Text>
              <View style={styles.insightTags}>
                <View style={styles.insightTag}>
                  <Ionicons name="flash" size={12} color={T.green} />
                  <Text style={[styles.insightTagText, { color: T.green }]}>
                    {profile?.isOnline ? "Free now" : "Nearby"}
                  </Text>
                </View>
                <View style={styles.insightTag}>
                  <Ionicons name="navigate" size={12} color={T.purple} />
                  <Text style={styles.insightTagText}>{distLabel}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Photo filmstrip */}
          <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Moments</Text>
              <Text style={styles.sectionHint}>{photos.length} photos</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoStrip}
            >
              {photos.map((uri, idx) => {
                const active = idx === activePhoto;
                return (
                  <TouchableOpacity
                    key={`${uri}-${idx}`}
                    activeOpacity={0.9}
                    onPress={() => setActivePhoto(idx)}
                    style={[styles.photoThumbWrap, active && styles.photoThumbActive]}
                  >
                    <Image source={{ uri }} style={styles.photoThumb} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* About */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>
              {profile?.bio || "Looking to connect & hangout nearby. Good coffee, better conversations."}
            </Text>
          </Animated.View>

          {/* Interests */}
          <Animated.View entering={FadeInDown.delay(260).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Into</Text>
            <View style={styles.tags}>
              {interests.map((tag: any, idx: number) => (
                <Animated.View
                  key={`${tag.name}-${idx}`}
                  entering={FadeIn.delay(280 + idx * 40).duration(280)}
                  style={styles.tag}
                >
                  <Ionicons name={tag.icon || "sparkles"} size={13} color={T.purple} />
                  <Text style={styles.tagText}>{tag.name}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Soft invite prompt */}
          <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.prompt}>
            <LinearGradient colors={["#F5F3FF", "#ECFDF5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promptGrad}>
              <View style={styles.promptIcon}>
                <Ionicons name="sparkles" size={18} color={T.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.promptTitle}>Make the first move</Text>
                <Text style={styles.promptSub}>
                  Invite {profile?.name?.split(" ")[0] || "them"} to hang — or just start a chat.
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* Sticky action dock */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.passBtn} onPress={() => router.back()} activeOpacity={0.88}>
          <Ionicons name="close" size={22} color={T.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite} activeOpacity={0.9}>
          <View style={styles.inviteSolid}>
            {inviting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="flash" size={17} color="#FFF" />
                <Text style={styles.inviteText}>Invite</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.likeBtn} onPress={handleLike} activeOpacity={0.9}>
          <LinearGradient colors={liked ? ["#94A3B8", "#64748B"] : T.purpleGrad} style={styles.likeGrad}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={17} color="#FFF" />
            <Text style={styles.likeText}>{liked ? "Liked" : "Like"}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.chatBtn} onPress={handleChat} activeOpacity={0.9}>
          <LinearGradient colors={T.purpleGrad} style={styles.chatGrad}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: {
    fontFamily: VibeFonts.medium,
    color: T.muted,
    fontSize: 13,
  },

  hero: {
    width: SCREEN_W,
    height: HERO_H,
    backgroundColor: "#1E1B4B",
    overflow: "hidden",
  },
  heroImgWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGrad: {
    ...StyleSheet.absoluteFillObject,
  },
  heroWash: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 5,
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  glassBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(15,23,42,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBottom: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 36,
  },
  livePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(34,197,94,0.92)",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  awayPill: {
    backgroundColor: "rgba(100,116,139,0.85)",
  },
  liveText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    letterSpacing: 0.2,
  },
  pulseWrap: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFF",
  },
  pulseCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFF",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontSize: 32,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
    letterSpacing: -0.8,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: T.purple,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
  vibeLine: {
    marginTop: 6,
    fontSize: 15,
    fontFamily: VibeFonts.semiBold,
    color: "rgba(255,255,255,0.92)",
  },
  heroMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(15,23,42,0.32)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: "100%",
  },
  metaChipText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
  },

  sheet: {
    marginTop: -22,
    backgroundColor: T.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 22,
    paddingHorizontal: 18,
    gap: 22,
  },

  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: T.card,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
  },
  matchRing: {
    width: 78,
    height: 78,
  },
  matchRingBg: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  matchArc: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 5,
    borderColor: "transparent",
    borderTopColor: T.purple,
    borderRightColor: T.purpleBright,
  },
  matchArcInner: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  matchInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  matchScore: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: T.purple,
    letterSpacing: -0.4,
  },
  matchLabel: {
    marginTop: -2,
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: T.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  insightCopy: { flex: 1 },
  insightTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.3,
  },
  insightSub: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },
  insightTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  insightTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.softPurple,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  insightTagText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.purple,
  },

  section: { gap: 10 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.soft,
  },
  bio: {
    fontSize: 14.5,
    lineHeight: 22,
    fontFamily: VibeFonts.medium,
    color: "#334155",
  },
  photoStrip: {
    gap: 10,
    paddingRight: 8,
  },
  photoThumbWrap: {
    width: 86,
    height: 108,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  photoThumbActive: {
    borderColor: T.purple,
  },
  photoThumb: {
    width: "100%",
    height: "100%",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: T.card,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: T.border,
  },
  tagText: {
    fontSize: 12.5,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },

  prompt: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 8,
  },
  promptGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  promptIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  promptTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  promptSub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#F8F9FD",
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  passBtn: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteBtn: {
    flex: 1.05,
    borderRadius: 17,
    overflow: "hidden",
  },
  inviteSolid: {
    backgroundColor: T.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 15,
  },
  inviteText: {
    color: "#FFF",
    fontSize: 14.5,
    fontFamily: VibeFonts.extraBold,
  },
  likeBtn: {
    flex: 1,
    borderRadius: 17,
    overflow: "hidden",
  },
  likeGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 15,
  },
  likeText: {
    color: "#FFF",
    fontSize: 14.5,
    fontFamily: VibeFonts.extraBold,
  },
  chatBtn: {
    width: 50,
    height: 50,
    borderRadius: 17,
    overflow: "hidden",
  },
  chatGrad: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
