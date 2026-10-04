import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  StatusBar,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { usePlans } from "../../context/PlansContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { VibeFonts } from "../../constants/vibeTheme";
import { formatFriendlyPlanWhen } from "../../constants/plans";

const { width: SCREEN_W } = Dimensions.get("window");

// Local Figma Hangora Assets
const hangoraLogo = require("../../assets/home/hangora-logo.png");
const userAvatar = require("../../assets/home/user-avatar.png");
const heroCardImg = require("../../assets/home/hero-card.png");
const createHangoutBannerImg = require("../../assets/home/create-hangout-banner.png");
const nearbyCoffeeBakchodiImg = require("../../assets/home/nearby-coffee-bakchodi.png");
const nearbyBeerLogImg = require("../../assets/home/nearby-beer-log.png");

import ChaiToggleWidget from "../../components/home/ChaiToggleWidget";

interface VibeItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const VIBES: VibeItem[] = [
  { id: "tea", label: "Tea", icon: "cafe", color: "#10E5C9" },
  { id: "coffee", label: "Coffee", icon: "cafe-outline", color: "#E0996D" },
  { id: "beer", label: "Beer", icon: "beer", color: "#FBBF24" },
  { id: "drinks", label: "Drinks", icon: "wine", color: "#EC4899" },
  { id: "smoke", label: "Smoke", icon: "leaf", color: "#22C55E" },
  { id: "food", label: "Food", icon: "restaurant", color: "#FB923C" },
  { id: "movie", label: "Movie", icon: "film", color: "#EF4444" },
  { id: "biryani", label: "Biryani", icon: "fast-food", color: "#F43F5E" },
  { id: "walk", label: "Walk", icon: "walk", color: "#38BDF8" },
  { id: "party", label: "Party", icon: "sparkles", color: "#EC4899" },
  { id: "music", label: "Music", icon: "musical-notes", color: "#A855F7" },
];

interface HangoutCardData {
  id: string;
  title: string;
  timeLocation: string;
  tagEmoji: string;
  tagLabel: string;
  tagColor: string;
  tagBg: string;
  joinColor: string;
  joinBorder: string;
  joinBg: string;
  image: any;
  distance: string;
  attendeesCount: string;
}

const STATIC_HANGOUTS: HangoutCardData[] = [
  {
    id: "figma-1",
    title: "Coffee & Good Talks",
    timeLocation: "Today, 7:00 PM • Brew & Blush",
    tagEmoji: "☕",
    tagLabel: "Coffee",
    tagColor: "#F59E0B",
    tagBg: "#24190E",
    joinColor: "#2EFA9E",
    joinBorder: "rgba(46,250,158,0.3)",
    joinBg: "rgba(46,250,158,0.12)",
    image: nearbyCoffeeBakchodiImg,
    distance: "2.5 km",
    attendeesCount: "+3",
  },
  {
    id: "figma-2",
    title: "Beer & Better People",
    timeLocation: "Today, 8:30 PM • The Local Bar",
    tagEmoji: "🍺",
    tagLabel: "Beer",
    tagColor: "#FBBF24",
    tagBg: "#261E0A",
    joinColor: "#C084FC",
    joinBorder: "rgba(192,132,252,0.3)",
    joinBg: "rgba(192,132,252,0.12)",
    image: nearbyBeerLogImg,
    distance: "1.8 km",
    attendeesCount: "+5",
  },
];

function CardPressable({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 14, stiffness: 350 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 350 });
      }}
      style={style}
    >
      <Animated.View style={anim}>{children}</Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { nearbyPlans, myPlans, joinPlan, hasJoined, refresh: refreshPlans } = usePlans();
  const { openNotifications, unreadCount } = useNotifications();

  const [selectedVibe, setSelectedVibe] = useState<string>("tea");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    refreshPlans().catch(() => undefined);
  }, [refreshPlans]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const dynamicHangouts = useMemo(() => {
    const all = [...(nearbyPlans || []), ...(myPlans || [])].filter(
      (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
    );
    if (!selectedVibe) return all;
    const filtered = all.filter((p) => {
      const act = (p.activity || "").toLowerCase();
      const title = (p.title || "").toLowerCase();
      return act.includes(selectedVibe.toLowerCase()) || title.includes(selectedVibe.toLowerCase());
    });
    return filtered.length > 0 ? filtered : all;
  }, [nearbyPlans, myPlans, selectedVibe]);

  const displayedHangouts = useMemo(() => {
    // 1. Exact Figma Showcase Cards — guaranteed always visible with their official photos!
    const figmaCards = STATIC_HANGOUTS;

    // 2. Any additional real plans from backend/user
    const realPlans = (dynamicHangouts || [])
      .filter((p) => !p.id.startsWith("figma-"))
      .map((p) => {
        const isBeer = (p.activity || "").toLowerCase().includes("beer");
        return {
          id: p.id,
          title: p.title,
          timeLocation: `${formatFriendlyPlanWhen(p)} • ${p.location || "Nearby"}`,
          tagEmoji: isBeer
            ? "🍺"
            : (p.activity || "").toLowerCase().includes("movie")
              ? "🎬"
              : "☕",
          tagLabel: p.activity || "Hangout",
          tagColor: isBeer ? "#FBBF24" : "#F59E0B",
          tagBg: isBeer ? "#261E0A" : "#24190E",
          joinColor: isBeer ? "#C084FC" : "#2EFA9E",
          joinBorder: isBeer ? "rgba(192,132,252,0.3)" : "rgba(46,250,158,0.3)",
          joinBg: isBeer ? "rgba(192,132,252,0.12)" : "rgba(46,250,158,0.12)",
          image:
            p.imageUrl && typeof p.imageUrl === "string" && p.imageUrl.startsWith("http")
              ? { uri: p.imageUrl }
              : isBeer
                ? nearbyBeerLogImg
                : nearbyCoffeeBakchodiImg,
          distance:
            typeof p.distance === "number"
              ? `${p.distance.toFixed(1)} km`
              : "2.1 km",
          attendeesCount: `+${p.going || p.participants?.length || 2}`,
        };
      });

    return [...figmaCards, ...realPlans];
  }, [dynamicHangouts]);

  const handleJoin = async (hangout: HangoutCardData) => {
    const isJoined = joinedMap[hangout.id] || hasJoined(hangout.id);
    setJoinedMap((prev) => ({ ...prev, [hangout.id]: !isJoined }));
    if (!isJoined) {
      if (!hangout.id.startsWith("figma-")) {
        try {
          await joinPlan(hangout.id);
        } catch { }
      }
      Alert.alert(
        "Hangout Joined! 🎉",
        `You're in for "${hangout.title}". See you at ${hangout.timeLocation.split("•")[0].trim()}!`,
        [
          {
            text: "View Details",
            onPress: () =>
              hangout.id.startsWith("figma-")
                ? router.push("/hangout")
                : router.push({ pathname: "/plan-details", params: { id: hangout.id } }),
          },
          { text: "Great!", style: "cancel" },
        ]
      );
    }
  };

  const handleNotificationPress = () => {
    openNotifications();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070A13" />

      {/* ── TOP HEADER ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoWrap}>
            <Image source={hangoraLogo} style={styles.logoImage} resizeMode="contain" />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Hangout</Text>
            <Text style={styles.headerSubtitle}>Meet. Vibe. Make it Real.</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            onPress={handleNotificationPress}
            style={styles.iconCircleBtn}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={23} color="#FFFFFF" />
            {unreadCount > 0 && <View style={styles.notifBadgeDot} />}
          </Pressable>

          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={styles.avatarWrap}
            hitSlop={8}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Image source={userAvatar} style={styles.avatarImage} />
            )}
            <View style={styles.onlineDot} />
          </Pressable>
        </View>
      </View>

      {/* ── MAIN SCROLL CONTENT ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 85 },
        ]}
      >
        {/* ── 1. HERO CARD ("Find Your Next Hangout") ── */}
        <Animated.View entering={FadeInDown.duration(340)} style={styles.heroWrap}>
          <CardPressable onPress={() => router.push("/hangout")}>
            <View style={styles.heroCard}>
              <Image source={heroCardImg} style={styles.heroImage} resizeMode="cover" />
            </View>
          </CardPressable>
        </Animated.View>

        {/* ── 2. WHAT'S YOUR VIBE? SECTION ── */}
        <Animated.View entering={FadeInDown.delay(70).duration(340)} style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>What's your vibe?</Text>
              <Text style={styles.sectionSubtitle}>
                Pick a hangout, meet like-minded people.
              </Text>
            </View>
            <Pressable onPress={() => router.push("/hangout")} hitSlop={10}>
              <View style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
              </View>
            </Pressable>
          </View>

          {/* VIBE CARDS CAROUSEL */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vibesScroll}
          >
            {VIBES.map((vibe) => {
              const active = selectedVibe === vibe.id;
              return (
                <Pressable
                  key={vibe.id}
                  onPress={() => setSelectedVibe(vibe.id)}
                  style={[
                    styles.vibeCard,
                    active && styles.vibeCardActive,
                  ]}
                >
                  <View style={styles.vibeIconWrap}>
                    <Ionicons
                      name={vibe.icon}
                      size={25}
                      color={active ? "#10E5C9" : vibe.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.vibeLabel,
                      active && styles.vibeLabelActive,
                    ]}
                  >
                    {vibe.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── 3. CREATE YOUR OWN HANGOUT BANNER ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(340)} style={styles.bannerWrap}>
          <CardPressable onPress={() => router.push("/create-plan")}>
            <View style={styles.createBannerCard}>
              <Image
                source={createHangoutBannerImg}
                style={styles.createBannerImage}
                resizeMode="cover"
              />
            </View>
          </CardPressable>
        </Animated.View>

        {/* ── 4. NEARBY HANGOUTS SECTION ── */}
        <Animated.View entering={FadeInDown.delay(170).duration(340)} style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View style={styles.nearbyTitleRow}>
              <View style={styles.liveDot} />
              <Text style={styles.sectionTitle}>Nearby Hangouts</Text>
            </View>
            <Pressable onPress={() => router.push("/hangout")} hitSlop={10}>
              <View style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
              </View>
            </Pressable>
          </View>

          {/* HANGOUT CARDS LIST */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hangoutsScroll}
          >
            {displayedHangouts.map((hangout, index) => {
              const isFav = !!favorites[hangout.id];
              const isJoined = !!joinedMap[hangout.id] || hasJoined(hangout.id);

              return (
                <Animated.View
                  key={hangout.id}
                  entering={FadeInRight.delay(index * 90).duration(300)}
                >
                  <Pressable
                    style={styles.hangoutCard}
                    onPress={() =>
                      hangout.id.startsWith("figma-")
                        ? router.push("/hangout")
                        : router.push({ pathname: "/plan-details", params: { id: hangout.id } })
                    }
                  >
                    {/* Top Photo & Badges */}
                    <View style={styles.cardImageContainer}>
                      <Image
                        source={
                          typeof hangout.image === "string"
                            ? { uri: hangout.image }
                            : hangout.image
                        }
                        style={styles.hangoutCardImage}
                        resizeMode="cover"
                      />

                      {/* Dynamic Distance Badge (for user/backend plans) */}
                      {!hangout.id.startsWith("figma-") && (
                        <View style={styles.dynamicDistanceBadge}>
                          <Ionicons name="location-sharp" size={10} color="#FF3B5C" />
                          <Text style={styles.dynamicDistanceText}>{hangout.distance}</Text>
                        </View>
                      )}

                      {/* Favorite Button */}
                      <Pressable
                        onPress={() => toggleFavorite(hangout.id)}
                        hitSlop={8}
                        style={styles.cardHeartBtn}
                      >
                        {isFav ? (
                          <Ionicons name="heart" size={19} color="#FF3B5C" />
                        ) : !hangout.id.startsWith("figma-") ? (
                          <Ionicons name="heart-outline" size={19} color="#FFFFFF" />
                        ) : null}
                      </Pressable>
                    </View>

                    {/* Card Content */}
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {hangout.title}
                      </Text>
                      <Text style={styles.cardMeta} numberOfLines={1}>
                        {hangout.timeLocation}
                      </Text>

                      {/* Pill Action Buttons */}
                      <View style={styles.cardActionsRow}>
                        <View style={[styles.cardTagPill, { backgroundColor: hangout.tagBg }]}>
                          <Text style={styles.cardTagEmoji}>{hangout.tagEmoji}</Text>
                          <Text
                            style={[
                              styles.cardTagText,
                              { color: hangout.tagColor },
                            ]}
                          >
                            {hangout.tagLabel}
                          </Text>
                        </View>

                        <Pressable
                          onPress={() => handleJoin(hangout)}
                          style={[
                            styles.cardJoinBtn,
                            {
                              backgroundColor: isJoined
                                ? "rgba(34,197,94,0.2)"
                                : hangout.joinBg,
                              borderColor: isJoined
                                ? "rgba(34,197,94,0.5)"
                                : hangout.joinBorder,
                            },
                          ]}
                        >
                          <Ionicons
                            name={isJoined ? "checkmark-circle" : "time-outline"}
                            size={13}
                            color={isJoined ? "#22C55E" : hangout.joinColor}
                          />
                          <Text
                            style={[
                              styles.cardJoinText,
                              {
                                color: isJoined ? "#22C55E" : hangout.joinColor,
                              },
                            ]}
                          >
                            {isJoined ? "Joined" : "Join Now"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}

          </ScrollView>
        </Animated.View>

        {/* ── 5. CHAI MOOD / STRESS OFF -> CHAI ON TOGGLE WIDGET ── */}
        <ChaiToggleWidget />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070A13",
  },
  scrollContent: {
    paddingTop: 8,
  },

  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#070A13",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoWrap: {
    shadowColor: "#D4F72C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerTextCol: {
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadgeDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF2A55",
    borderWidth: 1.5,
    borderColor: "#070A13",
  },
  avatarWrap: {
    position: "relative",
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  onlineDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#070A13",
  },

  // ── Hero Card ──
  heroWrap: {
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 22,
  },
  heroCard: {
    width: "100%",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0F1424",
  },
  heroImage: {
    width: "100%",
    height: (SCREEN_W - 40) * (365 / 724),
  },

  // ── Section Common ──
  sectionWrap: {
    marginBottom: 22,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18.5,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 2,
  },
  seeAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingTop: 3,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: VibeFonts.semiBold,
    color: "#94A3B8",
  },

  // ── Vibes Carousel ──
  vibesScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  vibeCard: {
    width: 70,
    height: 78,
    borderRadius: 18,
    backgroundColor: "#111625",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  vibeCardActive: {
    backgroundColor: "rgba(16,229,201,0.08)",
    borderColor: "#10E5C9",
  },
  vibeIconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  vibeLabel: {
    fontSize: 11.5,
    fontFamily: VibeFonts.semiBold,
    color: "#94A3B8",
  },
  vibeLabelActive: {
    color: "#10E5C9",
    fontFamily: VibeFonts.bold,
  },

  // ── Create Hangout Banner ──
  bannerWrap: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  createBannerCard: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#062227",
  },
  createBannerImage: {
    width: "100%",
    height: (SCREEN_W - 40) * (262 / 724),
  },

  // ── Nearby Hangouts ──
  nearbyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#10E5C9",
    shadowColor: "#10E5C9",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  hangoutsScroll: {
    paddingHorizontal: 20,
    gap: 14,
  },
  hangoutCard: {
    width: 220,
    borderRadius: 22,
    backgroundColor: "#0D1322",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  cardImageContainer: {
    width: 220,
    height: 146,
    position: "relative",
    backgroundColor: "#13192B",
    overflow: "hidden",
  },
  hangoutCardImage: {
    width: 220,
    height: 146,
  },
  cardHeartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dynamicDistanceBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  dynamicDistanceText: {
    fontSize: 10.5,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  cardBody: {
    padding: 13,
  },
  cardTitle: {
    fontSize: 14.5,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  cardMeta: {
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 3,
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 11,
  },
  cardTagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4.5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  cardTagEmoji: {
    fontSize: 11,
  },
  cardTagText: {
    fontSize: 11.5,
    fontFamily: VibeFonts.bold,
  },
  cardJoinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  cardJoinText: {
    fontSize: 11.5,
    fontFamily: VibeFonts.bold,
  },
});
