import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Share,
  ActivityIndicator,
  Pressable,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { VibeFonts } from "../constants/vibeTheme";
import { PLAN_ACTIVITIES } from "../constants/plans";
import { api } from "../services/api";
import TabBar from "../components/TabBar";
import AppHeader from "../components/vibe/AppHeader";
import HangoutCinematicBackground from "../components/vibe/HangoutCinematicBackground";

const { width: SCREEN_W } = Dimensions.get("window");
const BANNER_W = SCREEN_W - 32;

/** Match Hangout — dark navy + multi-accent */
const T = {
  bg: "#070A14",
  card: "rgba(22, 26, 46, 0.94)",
  cardElevated: "rgba(28, 32, 54, 0.96)",
  ink: "#F4F6FB",
  muted: "#A7B0C4",
  faint: "#7C869C",
  border: "rgba(160, 170, 200, 0.16)",
  purple: "#A78BFA",
  purpleDeep: "#8B5CF6",
  softPurple: "rgba(139, 92, 246, 0.18)",
  pink: "#F472B6",
  green: "#34D399",
  greenDark: "#10B981",
  gold: "#FBBF24",
  cta: ["#7C3AED", "#A78BFA"] as const,
  promo: ["#6D28D9", "#8B5CF6", "#EC4899"] as const,
};

const FLUENT_3D = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets";
const ACT_3D: Record<string, string> = {
  coffee: `${FLUENT_3D}/Hot%20beverage/3D/hot_beverage_3d.png`,
  travel: `${FLUENT_3D}/Airplane/3D/airplane_3d.png`,
  food: `${FLUENT_3D}/Pizza/3D/pizza_3d.png`,
  biryani: `${FLUENT_3D}/Curry%20rice/3D/curry_rice_3d.png`,
  beer: `${FLUENT_3D}/Beer%20mug/3D/beer_mug_3d.png`,
  sutta: `${FLUENT_3D}/Cigarette/3D/cigarette_3d.png`,
  movie: `${FLUENT_3D}/Clapper%20board/3D/clapper_board_3d.png`,
  sports: `${FLUENT_3D}/Badminton/3D/badminton_3d.png`,
  drinks: `${FLUENT_3D}/Cocktail%20glass/3D/cocktail_glass_3d.png`,
};

function getActivityCardStyle(id: string) {
  switch (id) {
    case "coffee":
      return { darkBg: ["#231709", "#110B03"] as const, border: "#F59E0B", glow: "#D97706", text: "#FBBF24" };
    case "food":
    case "biryani":
      return { darkBg: ["#2A1208", "#140804"] as const, border: "#F97316", glow: "#EA580C", text: "#FB923C" };
    case "beer":
      return { darkBg: ["#221A05", "#120E02"] as const, border: "#EAB308", glow: "#CA8A04", text: "#FACC15" };
    case "movie":
      return { darkBg: ["#1A1030", "#0C0818"] as const, border: "#8B5CF6", glow: "#7C3AED", text: "#C4B5FD" };
    case "sports":
      return { darkBg: ["#0A1F14", "#05110A"] as const, border: "#22C55E", glow: "#16A34A", text: "#86EFAC" };
    case "drinks":
      return { darkBg: ["#2A0F22", "#140810"] as const, border: "#EC4899", glow: "#DB2777", text: "#F9A8D4" };
    case "travel":
      return { darkBg: ["#0B1A2E", "#060E18"] as const, border: "#38BDF8", glow: "#0EA5E9", text: "#7DD3FC" };
    default:
      return { darkBg: ["#16161E", "#0B0B0F"] as const, border: "#A78BFA", glow: "#7C3AED", text: "#E9D5FF" };
  }
}

const SPOT_BANNERS = [
  {
    id: "b1",
    tag: "LIVE SPOT",
    title: "Drop a beacon nearby",
    subtitle: "Find table mates within 1 km",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=400&fit=crop",
    emoji: "☕",
  },
  {
    id: "b2",
    tag: "INSTANT",
    title: "Bored at a cafe?",
    subtitle: "Broadcast & ping free people now",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=400&fit=crop",
    emoji: "🍕",
  },
  {
    id: "b3",
    tag: "SOCIAL",
    title: "Real moves. Real people.",
    subtitle: "Scan radar · invite · hang out",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop",
    emoji: "✨",
  },
];

const DEMO_EVENTS = [
  {
    id: "evt-1",
    title: "Coffee & Board Games",
    location: "Starbucks FC Road",
    time: "Right Now",
    hostName: "Alex M.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop",
    membersCount: 3,
    emoji: "☕",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=280&fit=crop",
  },
  {
    id: "evt-2",
    title: "Late Night Pizza",
    location: "Domino's Central",
    time: "Tonight 9 PM",
    hostName: "Rohan S.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop",
    membersCount: 4,
    emoji: "🍕",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=280&fit=crop",
  },
  {
    id: "evt-3",
    title: "Rooftop Chill",
    location: "Empress City",
    time: "Live Now",
    hostName: "Priya K.",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop",
    membersCount: 5,
    emoji: "🌅",
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&h=280&fit=crop",
  },
];

const TIME_PRESETS = [
  { label: "30 min", val: 30, emoji: "⚡" },
  { label: "45 min", val: 45, emoji: "⏳" },
  { label: "1 hour", val: 60, emoji: "⌛" },
];

function GameActivityTile({
  id,
  name,
  icon3d,
  active,
  delay,
  onPress,
}: {
  id: string;
  name: string;
  icon3d: string;
  active: boolean;
  delay: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const styleMeta = getActivityCardStyle(id);

  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withSpring(1.08, { damping: 12, stiffness: 260 }),
        withSpring(1.02, { damping: 14 })
      );
    } else {
      scale.value = withSpring(1, { damping: 14 });
    }
  }, [active]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(delay).duration(300)} style={styles.actCell}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.92, { damping: 14 });
        }}
        onPressOut={() => {
          scale.value = withSpring(active ? 1.02 : 1);
        }}
      >
        <Animated.View style={pressStyle}>
          <LinearGradient
            colors={active ? ([...styleMeta.darkBg] as any) : ["#0B0B0F", "#16161E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.actBtn,
              active
                ? {
                    borderColor: styleMeta.border,
                    borderWidth: 2.5,
                    shadowColor: styleMeta.glow,
                    shadowOpacity: 0.5,
                    shadowRadius: 14,
                    elevation: 7,
                  }
                : {
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    borderWidth: 1,
                  },
            ]}
          >
            {active ? (
              <Animated.View
                entering={ZoomIn.duration(200)}
                style={[styles.actCheck, { backgroundColor: styleMeta.border }]}
              >
                <Ionicons name="checkmark" size={8} color="#fff" />
              </Animated.View>
            ) : null}

            <View style={styles.actIconPad}>
              <Image source={{ uri: icon3d }} style={styles.actIcon3d} resizeMode="contain" />
            </View>

            <Text
              style={[
                styles.actName,
                { color: active ? styleMeta.text : "#F1F5F9" },
                active && { fontFamily: VibeFonts.extraBold },
              ]}
              numberOfLines={1}
            >
              {name}
            </Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function SpotBroadcastScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(PLAN_ACTIVITIES[0].id);
  const [venueName, setVenueName] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef<FlatList>(null);

  const selectedAct = PLAN_ACTIVITIES.find((a) => a.id === selectedId) || PLAN_ACTIVITIES[0];

  useEffect(() => {
    let isMounted = true;
    api
      .getHangouts()
      .then((res: any) => {
        if (!isMounted) return;
        if (res && Array.isArray(res) && res.length > 0) {
          const mapped = res.map((h: any, idx: number) => ({
            id: h.id,
            title: h.activityName || h.title || "Live Spot",
            location: h.location || h.destination || "Nagpur",
            time: h.timeLabel || "Active",
            hostName: h.creator?.name || "Host",
            avatarUrl:
              h.creator?.avatarUrl ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop",
            membersCount: h.participantsCount || h.going || 2,
            emoji: h.activityEmoji || "⚡",
            image: h.imageUrl || DEMO_EVENTS[idx % DEMO_EVENTS.length].image,
          }));
          setEventsList(mapped);
        } else {
          setEventsList(DEMO_EVENTS);
        }
      })
      .catch(() => {
        if (isMounted) setEventsList(DEMO_EVENTS);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % SPOT_BANNERS.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3600);
    return () => clearInterval(id);
  }, []);

  const onBannerScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / (BANNER_W + 12));
    if (idx >= 0 && idx < SPOT_BANNERS.length) setBannerIndex(idx);
  }, []);

  const handleBroadcastSpot = async () => {
    const finalVenue = venueName.trim() || `${selectedAct.emoji} ${selectedAct.name}`;
    setLoading(true);
    try {
      await api.updateSocialStatus({
        energy: "LESSGO",
        freeNow: true,
        activity: `${selectedAct.emoji} at ${finalVenue}`,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
      router.push({
        pathname: "/spot-radar",
        params: {
          venue: finalVenue,
          vibe: selectedAct.name,
          emoji: selectedAct.emoji,
          duration: String(duration),
          activityId: selectedAct.id,
        },
      });
    }
  };

  const handleShareToWhatsApp = async () => {
    const finalVenue = venueName.trim() || selectedAct.name;
    setLoading(true);
    try {
      const res = await api.createPublicInvite({
        activityName: selectedAct.name,
        activityEmoji: selectedAct.emoji,
        timeLabel: `At ${finalVenue} for next ${duration} mins!`,
      });
      const shareMsg = `Hey! Sitting at ${finalVenue} (${selectedAct.emoji}). Join my table: ${
        res?.inviteUrl || "https://vibematch.app"
      }`;
      await Share.share({ message: shareMsg });
    } catch {
      await Share.share({
        message: `Sitting at ${finalVenue} (${selectedAct.emoji}) right now! Join me: https://vibematch.app`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <HangoutCinematicBackground />
      <StatusBar style="light" backgroundColor={T.bg} />

      <View style={styles.foreground}>
        <AppHeader variant="dark" tagline="Live spots · Instant meetups" />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Sliding banner */}
          <View style={styles.bannerWrap}>
            <FlatList
              ref={bannerRef}
              data={SPOT_BANNERS}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={BANNER_W + 12}
              decelerationRate="fast"
              onScroll={onBannerScroll}
              scrollEventThrottle={16}
              onScrollToIndexFailed={() => {}}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item, index }) => (
                <Animated.View
                  entering={FadeInUp.delay(index * 40).duration(350)}
                  style={{ width: BANNER_W, marginRight: 12 }}
                >
                  <View style={styles.bannerCard}>
                    <Image source={{ uri: item.image }} style={styles.bannerImage} />
                    <LinearGradient
                      colors={["rgba(7,10,20,0.2)", "rgba(7,10,20,0.88)"]}
                      style={styles.bannerOverlay}
                    >
                      <View style={styles.bannerTag}>
                        <View style={styles.bannerTagDot} />
                        <Text style={styles.bannerTagText}>{item.tag}</Text>
                      </View>
                      <Text style={styles.bannerEmoji}>{item.emoji}</Text>
                      <Text style={styles.bannerTitle}>{item.title}</Text>
                      <Text style={styles.bannerSub}>{item.subtitle}</Text>
                    </LinearGradient>
                  </View>
                </Animated.View>
              )}
            />
            <View style={styles.bannerDots}>
              {SPOT_BANNERS.map((b, i) => (
                <View key={b.id} style={[styles.bannerDot, i === bannerIndex && styles.bannerDotActive]} />
              ))}
            </View>
          </View>

          {/* Active spots — compact */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Active Spots</Text>
            <TouchableOpacity onPress={() => router.push("/hangout")} style={styles.seeAllPill}>
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={12} color={T.purple} />
            </TouchableOpacity>
          </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsScroll}>
          {eventsList.map((evt, idx) => (
            <Animated.View
              key={evt.id || idx}
              entering={FadeInDown.delay(idx * 60).springify()}
              style={styles.eventCardWrap}
            >
              <Pressable
                style={styles.eventCard}
                onPress={() => router.push(evt.id ? `/plan-details?id=${evt.id}` : "/hangout")}
              >
                <Image
                  source={{ uri: evt.image || DEMO_EVENTS[idx % DEMO_EVENTS.length].image }}
                  style={styles.eventImage}
                />
                <LinearGradient
                  colors={["transparent", "rgba(7,10,20,0.92)"]}
                  style={styles.eventOverlay}
                >
                  <View style={styles.eventBadge}>
                    <Text style={styles.eventBadgeText}>{evt.time || "LIVE"}</Text>
                  </View>
                  <Text style={styles.eventEmoji}>{evt.emoji || "⚡"}</Text>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {evt.title || evt.name}
                  </Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={11} color="#E9D5FF" />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {evt.location || "Nagpur"}
                    </Text>
                  </View>
                  <View style={styles.eventFooter}>
                    <View style={styles.hostRow}>
                      <Image
                        source={{
                          uri:
                            evt.avatarUrl ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop",
                        }}
                        style={styles.hostAvatar}
                      />
                      <Text style={styles.hostName} numberOfLines={1}>
                        {evt.hostName || "Host"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.joinEventBtn}
                      onPress={() => router.push("/hangout")}
                      activeOpacity={0.88}
                    >
                      <View style={styles.joinEventSolid}>
                        <Ionicons name="arrow-forward-circle" size={15} color="#FFF" />
                        <Text style={styles.joinEventText}>Join Spot</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Broadcast — Pick Activity style */}
        <Animated.View entering={FadeInUp.delay(80).duration(400)} style={styles.broadcastSection}>
          <LinearGradient
            colors={["rgba(124,58,237,0.22)", "rgba(236,72,153,0.08)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.broadcastGlow}
          />
          <View style={styles.sectionHead}>
            <LinearGradient colors={[...T.cta]} style={styles.stepBadge}>
              <Ionicons name="radio" size={11} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.broadcastTitle}>Broadcast Live Spot</Text>
              <Text style={styles.broadcastSub}>Tap a vibe · then scan nearby</Text>
            </View>
            <View style={styles.hotPill}>
              <Ionicons name="flash" size={9} color="#fff" />
              <Text style={styles.hotPillText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.actGrid}>
            {PLAN_ACTIVITIES.map((act, idx) => (
              <GameActivityTile
                key={act.id}
                id={act.id}
                name={act.name}
                icon3d={ACT_3D[act.id] || ACT_3D.coffee}
                active={selectedId === act.id}
                delay={120 + idx * 30}
                onPress={() => setSelectedId(act.id)}
              />
            ))}
          </View>

          <View style={styles.inputWrap}>
            <View style={styles.inputIcon}>
              <Ionicons name="location" size={16} color={T.purple} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Custom spot (e.g. Cafe Mocha, FC Road)..."
              placeholderTextColor={T.faint}
              value={venueName}
              onChangeText={setVenueName}
            />
          </View>

          <Text style={styles.secSubLabel}>SPOT DURATION</Text>
          <View style={styles.timeRow}>
            {TIME_PRESETS.map((t) => {
              const isSelected = duration === t.val;
              return (
                <TouchableOpacity
                  key={t.val}
                  style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                  onPress={() => setDuration(t.val)}
                  activeOpacity={0.88}
                >
                  <Text style={styles.timeEmoji}>{t.emoji}</Text>
                  <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.broadcastBtn}
              onPress={handleBroadcastSpot}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.broadcastBtnGrad}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="scan" size={16} color="#FFF" />
                    <Text style={styles.broadcastBtnText}>Scan Nearby</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShareToWhatsApp}
              disabled={loading}
              activeOpacity={0.88}
            >
              <Ionicons name="share-social" size={16} color="#FFF" />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        </ScrollView>
      </View>

      <TabBar dark />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  foreground: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 110,
  },

  bannerWrap: {
    marginBottom: 14,
  },
  bannerCard: {
    height: 148,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#1A2238",
    borderWidth: 1,
    borderColor: T.border,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  bannerTag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(124,58,237,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  bannerTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  bannerTagText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.6,
  },
  bannerEmoji: {
    position: "absolute",
    top: 14,
    right: 16,
    fontSize: 36,
  },
  bannerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.3,
  },
  bannerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    marginTop: 3,
  },
  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(167,139,250,0.35)",
  },
  bannerDotActive: {
    width: 18,
    backgroundColor: T.purple,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  seeAllPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: T.softPurple,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: T.purple,
  },

  eventsScroll: {
    marginBottom: 18,
    paddingLeft: 16,
  },
  eventCardWrap: {
    width: 200,
    marginRight: 12,
  },
  eventCard: {
    height: 196,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  eventImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  eventOverlay: {
    flex: 1,
    padding: 10,
    justifyContent: "flex-end",
  },
  eventBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(124,58,237,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  eventBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
  },
  eventEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  eventTitle: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    marginBottom: 3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "#E9D5FF",
    flex: 1,
  },
  eventFooter: {
    gap: 8,
  },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hostAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#1A2238",
  },
  hostName: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
    flex: 1,
  },
  joinEventBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  joinEventSolid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    backgroundColor: T.greenDark,
  },
  joinEventText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
  },

  broadcastSection: {
    marginHorizontal: 16,
    backgroundColor: T.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.28)",
    overflow: "hidden",
  },
  broadcastGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  broadcastTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  broadcastSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 1,
  },
  hotPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DB2777",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  hotPillText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
  },

  actGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
    marginBottom: 12,
  },
  actCell: { width: "31%" },
  actBtn: {
    aspectRatio: 1.05,
    borderRadius: 14,
    backgroundColor: "#0B0B0F",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    paddingTop: 5,
    paddingBottom: 5,
    overflow: "hidden",
  },
  actCheck: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 13,
    height: 13,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  actIconPad: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  actIcon3d: {
    width: 32,
    height: 32,
  },
  actName: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    textAlign: "center",
    marginTop: 1,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 22, 38, 0.9)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
    height: 46,
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  inputIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.ink,
  },
  secSubLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    color: T.purple,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  timeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "rgba(15, 22, 38, 0.9)",
    borderWidth: 1,
    borderColor: T.border,
  },
  timeChipSelected: {
    backgroundColor: T.purpleDeep,
    borderColor: T.purple,
  },
  timeEmoji: { fontSize: 14 },
  timeText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.muted,
  },
  timeTextSelected: {
    color: "#FFF",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  broadcastBtn: {
    flex: 1.35,
    borderRadius: 14,
    overflow: "hidden",
  },
  broadcastBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
  },
  broadcastBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: T.greenDark,
  },
  shareBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
  },
});
