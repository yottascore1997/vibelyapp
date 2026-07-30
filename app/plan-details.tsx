import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  Pressable,
  Dimensions,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { usePlans } from "../context/PlansContext";
import { useAuth } from "../context/AuthContext";
import { PLAN_ACTIVITIES } from "../constants/plans";
import { VibeFonts } from "../constants/vibeTheme";
import { Radius, Spacing } from "../constants/theme";
import TabBar from "../components/TabBar";
import VibeSplitModal from "../components/vibe/VibeSplitModal";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

const { width: SCREEN_W } = Dimensions.get("window");
const HERO_H = 300;

const FALLBACK_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop",
];

const CAFE_THUMB =
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop";

/** Premium Light Palette — matching Hangout screen */
const C = {
  green: "#10B981",
  greenBright: "#059669",
  greenSoft: "rgba(16, 185, 129, 0.12)",
  greenBorder: "rgba(16, 185, 129, 0.3)",
  pink: "#EC4899",
  pinkSoft: "rgba(236,72,153,0.12)",
  pinkBorder: "rgba(236,72,153,0.3)",
  purple: "#7C3AED",
  purpleDeep: "#6D28D9",
  softPurple: "#F3E8FF",
  ink: "#18181B",
  muted: "#475569",
  faint: "#94A3B8",
  bg: "#F8F9FD",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  border: "#F1F5F9",
  cta: ["#7C3AED", "#EC4899"] as const,
  ring: ["#7C3AED", "#EC4899", "#10B981"] as const,
  hostRing: ["#7C3AED", "#A855F7", "#EC4899"] as const,
};

function getActivityMeta(activity?: string) {
  const n = (activity || "").toLowerCase();
  const match = PLAN_ACTIVITIES.find(
    (a) => n.includes(a.id) || n.includes(a.name.toLowerCase())
  );
  if (match) return match;
  if (n.includes("cafe") || n.includes("coffee")) return PLAN_ACTIVITIES[0];
  return {
    id: "hangout",
    name: activity || "Hangout",
    emoji: "✨",
    color: "#E8D5FF",
    image:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&h=600&fit=crop",
  };
}

function getMinutesUntil(scheduledAt?: string) {
  if (!scheduledAt) return 30;
  const diff = new Date(scheduledAt).getTime() - Date.now();
  return Math.max(0, Math.round(diff / 60000));
}

function formatWhen(
  scheduledAt?: string,
  timeLabel?: string | null,
  time?: string | null
) {
  if (timeLabel) return timeLabel;
  if (!scheduledAt) return time || "Flexible";
  const d = new Date(scheduledAt);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Today, ${timeStr}`;
  if (isTomorrow) return `Tomorrow, ${timeStr}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
}

function buildSchedule(scheduledAt?: string) {
  const start = scheduledAt
    ? new Date(scheduledAt)
    : new Date(Date.now() + 30 * 60000);
  const t1 = start;
  const t2 = new Date(start.getTime() + 15 * 60000);
  const t3 = new Date(start.getTime() + 90 * 60000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return [
    { time: fmt(t1), title: "Meet & Greet", sub: "Let's get to know each other" },
    { time: fmt(t2), title: "Coffee & Talks", sub: "Good vibes, good times" },
    { time: fmt(t3), title: "Wind Down", sub: "See you soon!" },
  ];
}

function splitLocation(location?: string | null) {
  if (!location) return { venue: "To be decided", area: "Location TBA" };
  const parts = location
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { venue: parts[0], area: parts.slice(1).join(", ") };
  }
  return { venue: location, area: "Nearby" };
}

function ProgressRing({
  progress,
  emoji,
  size = 78,
}: {
  progress: number;
  emoji: string;
  size?: number;
}) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.06]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.45, 0.85]),
  }));

  const clamped = Math.min(1, Math.max(0.15, progress));
  const track = size;
  const stroke = 5;
  const inner = size - stroke * 2;

  return (
    <View style={{ width: track, height: track, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: track + 14,
            height: track + 14,
            borderRadius: (track + 14) / 2,
            backgroundColor: "rgba(139,92,246,0.18)",
          },
          glowStyle,
        ]}
      />
      <View
        style={{
          width: track,
          height: track,
          borderRadius: track / 2,
          borderWidth: stroke,
          borderColor: "rgba(139,92,246,0.18)",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
      <LinearGradient
        colors={[...C.ring]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          width: track,
          height: track,
          borderRadius: track / 2,
          opacity: 0.95,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: track,
          height: track,
          borderRadius: track / 2,
          borderWidth: stroke,
          borderColor: "transparent",
          borderTopColor: clamped < 0.85 ? C.card : "transparent",
          borderRightColor: clamped < 0.55 ? C.card : "transparent",
          transform: [{ rotate: `${(1 - clamped) * 120}deg` }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: C.card,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "rgba(139,92,246,0.2)",
          shadowColor: C.purple,
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Text style={{ fontSize: 26 }}>{emoji}</Text>
      </View>
    </View>
  );
}

function TitleWithGradient({ title }: { title: string }) {
  const words = title.trim().split(/\s+/);
  if (words.length === 1) {
    return (
      <Text style={styles.heroTitle}>
        <Text style={styles.heroTitleAccent}>{words[0]}</Text>
      </Text>
    );
  }
  const last = words[words.length - 1];
  const rest = words.slice(0, -1).join(" ");
  return (
    <Text style={styles.heroTitle}>
      {rest} <Text style={styles.heroTitleAccent}>{last}</Text>
    </Text>
  );
}

export default function PlanDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const {
    myPlans,
    nearbyPlans,
    getRequestStatus,
    joinPlan,
    respondToRequest,
    cancelJoinPlan,
    cancelPlan,
    removeParticipant,
    getRejectionRemark,
  } = usePlans();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [cancellationRemark, setCancellationRemark] = useState("");
  const [cancelContext, setCancelContext] = useState<{
    userId: string;
    type: "user_leave" | "host_remove" | "host_cancel";
  } | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const plan = [...myPlans, ...nearbyPlans].find((p) => p.id === id);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const fadeIn = useSharedValue(0);
  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, []);
  const contentAnim = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [18, 0]) }],
  }));

  const activity = useMemo(() => getActivityMeta(plan?.activity), [plan?.activity]);
  const minutesLeft = useMemo(
    () => getMinutesUntil(plan?.scheduledAt),
    [plan?.scheduledAt, nowTick]
  );
  const whenLabel = useMemo(
    () => formatWhen(plan?.scheduledAt, plan?.timeLabel, plan?.time),
    [plan?.scheduledAt, plan?.timeLabel, plan?.time]
  );
  const schedule = useMemo(() => buildSchedule(plan?.scheduledAt), [plan?.scheduledAt]);
  const locationParts = useMemo(() => splitLocation(plan?.location), [plan?.location]);
  const vibeScore = useMemo(() => {
    if (!plan) return 92;
    const base = 78 + Math.min(14, (plan.going || 1) * 3);
    return Math.min(98, base);
  }, [plan]);

  const interestTags = useMemo(() => {
    const a = (plan?.activity || "Hangout").toLowerCase();
    return [
      {
        label: activity.name,
        emoji: activity.emoji,
        bg: "#FFF1E6",
        border: "#FDBA74",
        text: "#EA580C",
      },
      {
        label: "Deep Talks",
        emoji: "💬",
        bg: "#FCE7F3",
        border: "#F9A8D4",
        text: "#DB2777",
      },
      {
        label: a.includes("chill") || a.includes("coffee") ? "Chill" : "Good Vibes",
        emoji: "😎",
        bg: "#ECFDF5",
        border: "#86EFAC",
        text: "#16A34A",
      },
    ];
  }, [plan?.activity, activity]);

  const tagline = useMemo(() => {
    const a = (plan?.activity || "").toLowerCase();
    if (a.includes("coffee") || a.includes("cafe")) return "Good coffee, Great talks";
    if (a.includes("movie")) return "Popcorn, plots & people";
    if (a.includes("food") || a.includes("biryani") || a.includes("pizza"))
      return "Good food, better company";
    if (a.includes("beer") || a.includes("drink")) return "Cheers to new friends";
    return "Good vibes only";
  }, [plan?.activity]);

  if (!plan) {
    return (
      <View style={styles.errorRoot}>
        <StatusBar style="dark" />
        <Text style={styles.errorText}>Plan not found</Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { venue, area } = locationParts;
  const isMine = plan.creatorId === user?.id;
  const requestStatus = getRequestStatus(plan.id);
  const heroImage = plan.imageUrl || activity.image;
  const openSpots = Math.max(0, plan.maxParticipants - plan.going);
  const participants = plan.participants || [];
  const previewAvatars = participants.slice(0, 4);
  const extraCount = Math.max(0, plan.going - previewAvatars.length);

  const handleRequestJoin = async () => {
    if (plan?.status === "FULL") {
      Alert.alert("Plan full", "All seats are taken.");
      return;
    }
    if (plan?.status === "CANCELLED" || plan?.status === "COMPLETED") {
      Alert.alert("Unavailable", "This plan is no longer open.");
      return;
    }
    try {
      await joinPlan(plan!.id);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Request failed");
    }
  };

  const handleOpenCancelModal = (
    targetUserId: string,
    type: "user_leave" | "host_remove" | "host_cancel"
  ) => {
    setCancellationRemark("");
    setCancelContext({ userId: targetUserId, type });
    setShowCancelModal(true);
  };

  const handleSubmitCancellation = async () => {
    if (!cancellationRemark.trim()) {
      Alert.alert("Error", "Please write a cancellation reason / remark.");
      return;
    }
    setShowCancelModal(false);
    if (cancelContext?.type === "host_remove") {
      try {
        await removeParticipant(plan!.id, cancelContext.userId, cancellationRemark.trim());
      } catch (e) {
        Alert.alert("Error", e instanceof Error ? e.message : "Could not remove member");
      }
    } else if (cancelContext?.type === "host_cancel") {
      try {
        await cancelPlan(plan!.id, cancellationRemark.trim());
        router.back();
      } catch (e) {
        Alert.alert("Error", e instanceof Error ? e.message : "Could not cancel plan");
      }
    } else {
      try {
        await cancelJoinPlan(plan!.id, cancellationRemark.trim());
      } catch (e) {
        Alert.alert("Error", e instanceof Error ? e.message : "Could not leave hangout");
      }
    }
  };

  const openMap = () => {
    const q = encodeURIComponent(plan.location || venue);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  const openDirections = () => {
    const q = encodeURIComponent(plan.location || venue);
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${q}`);
  };

  const fillSlots = Array.from({ length: Math.min(openSpots, 2) });

  const renderBottomCta = () => {
    if (plan.status === "CANCELLED") {
      return (
        <View style={styles.ctaBlock}>
          <View style={styles.rejectedPill}>
            <Ionicons name="ban" size={16} color="#EF4444" />
            <Text style={styles.rejectedPillText}>Plan cancelled</Text>
          </View>
        </View>
      );
    }
    if (plan.status === "COMPLETED") {
      return (
        <View style={styles.ctaBlock}>
          <View style={styles.hostPill}>
            <Ionicons name="checkmark-done" size={16} color={C.purple} />
            <Text style={styles.hostPillText}>This hangout has ended</Text>
          </View>
        </View>
      );
    }

    if (isMine) {
      return (
        <View style={styles.ctaBlock}>
          <View style={styles.hostPill}>
            <Ionicons name="star" size={16} color={C.purple} />
            <Text style={styles.hostPillText}>
              {plan.status === "FULL"
                ? "Plan is full — manage members below"
                : "You're hosting this hangout"}
            </Text>
          </View>
          <Pressable
            style={{ marginTop: 10 }}
            onPress={() => handleOpenCancelModal(user?.id || "", "host_cancel")}
          >
            <View style={styles.rejectedPill}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.rejectedPillText}>Cancel Plan</Text>
            </View>
          </Pressable>
          <Text style={styles.cancelHint}>Manage join requests below</Text>
        </View>
      );
    }
    if (requestStatus === "accepted") {
      return (
        <View style={styles.ctaBlock}>
          <View style={styles.ctaRow}>
            <Pressable
              style={styles.secondaryIconBtn}
              onPress={() => handleOpenCancelModal(user?.id || "", "user_leave")}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </Pressable>
            <Pressable
              style={styles.primaryCtaWrap}
              onPress={() =>
                router.push({ pathname: "/chat/[id]", params: { id: plan.id } })
              }
            >
              <LinearGradient
                colors={[...C.cta]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryCta}
              >
                <Ionicons name="chatbubbles" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryCtaText}>Open Group Chat</Text>
              </LinearGradient>
            </Pressable>
          </View>
          <Text style={styles.cancelHint}>You can leave anytime</Text>
        </View>
      );
    }
    if (requestStatus === "pending") {
      return (
        <View style={styles.ctaBlock}>
          <View style={styles.ctaRow}>
            <Pressable
              style={styles.secondaryIconBtn}
              onPress={() => handleOpenCancelModal(user?.id || "", "user_leave")}
            >
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
            </Pressable>
            <View style={[styles.primaryCtaWrap, styles.pendingCta]}>
              <Ionicons name="time" size={16} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={styles.pendingCtaText}>Request Pending</Text>
            </View>
          </View>
          <Text style={styles.cancelHint}>Host will accept or decline</Text>
        </View>
      );
    }
    if (requestStatus === "rejected") {
      const remark = getRejectionRemark(plan.id);
      return (
        <View style={styles.ctaBlock}>
          <View style={styles.rejectedPill}>
            <Ionicons name="close-circle" size={16} color="#EF4444" />
            <Text style={styles.rejectedPillText}>Join Request Declined</Text>
          </View>
          {remark ? <Text style={styles.cancelHint}>{remark}</Text> : null}
          <Pressable style={[styles.primaryCtaWrap, { marginTop: 10 }]} onPress={handleRequestJoin}>
            <LinearGradient
              colors={[...C.cta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryCta}
            >
              <Text style={styles.primaryCtaText}>Request Again</Text>
            </LinearGradient>
          </Pressable>
        </View>
      );
    }
    if (plan.status === "FULL") {
      return (
        <View style={styles.ctaBlock}>
          <View style={styles.rejectedPill}>
            <Ionicons name="people" size={16} color="#EF4444" />
            <Text style={styles.rejectedPillText}>Plan is full</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.ctaBlock}>
        <Pressable style={styles.primaryCtaWrap} onPress={handleRequestJoin}>
          <LinearGradient
            colors={[...C.cta]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryCta}
          >
            <Text style={styles.primaryCtaText}>Request to Join {activity.emoji}</Text>
          </LinearGradient>
        </Pressable>
        <Text style={styles.cancelHint}>Host must approve your request</Text>
      </View>
    );
  };

  const tabBarHeight = 72 + Math.max(insets.bottom, 12);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={["rgba(167,139,250,0.2)", "transparent"]}
        style={styles.ambientTop}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />
      <LinearGradient
        colors={["rgba(125,211,252,0.12)", "transparent"]}
        style={styles.ambientCool}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 140 },
        ]}
        bounces
      >
        {/* HERO image — title sits below so it never fades into the photo */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} />
          <LinearGradient
            colors={["rgba(26,31,54,0.25)", "rgba(26,31,54,0.08)", "transparent"]}
            locations={[0, 0.35, 0.7]}
            style={StyleSheet.absoluteFillObject}
          />
          <SafeAreaView edges={["top"]} style={styles.heroNav}>
            <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={C.ink} />
            </TouchableOpacity>
            <View style={styles.liveBadge}>
              <Ionicons name="star" size={11} color="#fff" />
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() =>
                Alert.alert("Hangout options", undefined, [
                  { text: "Share", onPress: () => {} },
                  { text: "Report", style: "destructive", onPress: () => {} },
                  { text: "Cancel", style: "cancel" },
                ])
              }
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={C.ink} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <Animated.View style={[styles.body, contentAnim]}>
          {/* Title card — clear on solid background */}
          <View style={styles.titleCard}>
            <View style={styles.activityPill}>
              <Text style={styles.activityPillEmoji}>{activity.emoji}</Text>
              <Text style={styles.activityPillText}>
                {(plan.activity || "Hangout").toUpperCase()} HANGOUT
              </Text>
            </View>
            <TitleWithGradient title={plan.title} />
            <Text style={styles.tagline}>
              {tagline} <Text style={styles.taglineHeart}>❤</Text>
            </Text>
          </View>

          {/* Starting card */}
          <View style={styles.statusCard}>
            <View style={styles.statusTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.startingLabel}>Starting in</Text>
                <Text style={styles.startingValue}>
                  <Text style={styles.startingNum}>{minutesLeft}</Text>
                  <Text style={styles.startingUnit}> MIN</Text>
                </Text>
                <Text style={styles.whenText}>{whenLabel}</Text>
              </View>
              <ProgressRing
                progress={plan.going / Math.max(1, plan.maxParticipants)}
                emoji={activity.emoji}
              />
            </View>

            <View style={styles.statusBottom}>
              <View style={styles.avatarStack}>
                {previewAvatars.map((p, i) => (
                  <Image
                    key={p.id}
                    source={{
                      uri: p.avatarUrl || FALLBACK_AVATARS[i % FALLBACK_AVATARS.length],
                    }}
                    style={[
                      styles.stackAvatar,
                      { marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i },
                    ]}
                  />
                ))}
                {extraCount > 0 && (
                  <View style={[styles.stackAvatar, styles.stackMore, { marginLeft: -10 }]}>
                    <Text style={styles.stackMoreText}>+{extraCount}</Text>
                  </View>
                )}
                {previewAvatars.length === 0 &&
                  FALLBACK_AVATARS.slice(0, 3).map((uri, i) => (
                    <Image
                      key={uri}
                      source={{ uri }}
                      style={[
                        styles.stackAvatar,
                        { marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i },
                      ]}
                    />
                  ))}
              </View>
              <Text style={styles.joinedText}>
                {plan.going}/{plan.maxParticipants} Joined
              </Text>
            </View>

            <View style={styles.vibeBadge}>
              <Text style={styles.vibeBadgeText}>Chill Vibes Only ✨</Text>
            </View>
          </View>

          {/* Location card */}
          <View style={styles.locationCard}>
            <Image
              source={{ uri: plan.imageUrl || CAFE_THUMB }}
              style={styles.locationThumb}
            />
            <View style={styles.locationMid}>
              <View style={styles.venueRow}>
                <Text style={styles.venueName} numberOfLines={1}>
                  {venue}
                </Text>
                <Ionicons name="checkmark-circle" size={16} color={C.purple} />
              </View>
              <Text style={styles.areaText} numberOfLines={1}>
                {area}
              </Text>
              <View style={styles.distanceRow}>
                <Ionicons name="location" size={12} color={C.purple} />
                <Text style={styles.distanceText}>
                  {plan.distance != null
                    ? `${plan.distance.toFixed(1)} km away`
                    : "Nearby"}
                </Text>
              </View>
              <TouchableOpacity style={styles.mapChip} onPress={openMap} activeOpacity={0.8}>
                <Text style={styles.mapChipText}>View on Map</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.locationActions}>
              <TouchableOpacity
                style={styles.roundAction}
                onPress={() =>
                  Alert.alert(
                    "Call venue",
                    "Phone number will be available when the host shares it."
                  )
                }
              >
                <LinearGradient colors={[...C.cta]} style={styles.roundActionGrad}>
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.roundAction} onPress={openDirections}>
                <LinearGradient colors={[...C.cta]} style={styles.roundActionGrad}>
                  <Ionicons name="navigate" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this hangout ✨</Text>
            <Text style={styles.aboutText}>
              {plan.description ||
                `Looking for someone to join for a relaxed ${activity.name.toLowerCase()} and great conversations.`}
            </Text>
            <View style={styles.tagRow}>
              {interestTags.map((tag) => (
                <View
                  key={tag.label}
                  style={[
                    styles.tagPill,
                    { backgroundColor: tag.bg, borderColor: tag.border },
                  ]}
                >
                  <Text style={[styles.tagText, { color: tag.text }]}>
                    {tag.emoji} {tag.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* VibeSplit Event Expenses Banner */}
          <TouchableOpacity
            onPress={() => setShowSplitModal(true)}
            style={{ marginVertical: 12, borderRadius: 20, overflow: "hidden" }}
          >
            <LinearGradient
              colors={["#8B5CF6", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 24 }}>💳</Text>
                <View>
                  <Text style={{ fontSize: 14, fontFamily: VibeFonts.bold, color: "#FFFFFF" }}>
                    VibeSplit — Split Bills 💳💸
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: VibeFonts.medium, color: "rgba(255,255,255,0.85)" }}>
                    Track shared food, drinks & tickets
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontFamily: VibeFonts.bold, color: "#FFFFFF" }}>
                  Open Jar ›
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* People joining */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>People joining</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.peopleRow}
            >
              <View style={styles.personCol}>
                <View style={styles.hostAvatarRing}>
                  <LinearGradient colors={[...C.hostRing]} style={styles.hostRingGrad}>
                    <Image
                      source={{
                        uri:
                          plan.creatorAvatar ||
                          participants.find((p) => p.id === plan.creatorId)?.avatarUrl ||
                          FALLBACK_AVATARS[0],
                      }}
                      style={styles.hostAvatarImg}
                    />
                  </LinearGradient>
                  <View style={styles.crownBadge}>
                    <Text style={{ fontSize: 10 }}>👑</Text>
                  </View>
                </View>
                <Text style={styles.personName} numberOfLines={1}>
                  {isMine ? "You" : plan.creatorName?.split(" ")[0] || "Host"}{" "}
                  <Text style={styles.hostLabel}>(Host)</Text>
                </Text>
              </View>

              {participants
                .filter((p) => p.id !== plan.creatorId)
                .map((p, i) => (
                  <View key={p.id} style={styles.personCol}>
                    <View style={styles.personAvatarWrap}>
                      <Image
                        source={{
                          uri:
                            p.avatarUrl ||
                            FALLBACK_AVATARS[(i + 1) % FALLBACK_AVATARS.length],
                        }}
                        style={styles.personAvatar}
                      />
                      <View style={styles.onlineDot} />
                      {isMine && (
                        <TouchableOpacity
                          style={styles.removeTiny}
                          onPress={() => handleOpenCancelModal(p.id, "host_remove")}
                        >
                          <Ionicons name="close" size={10} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.personName} numberOfLines={1}>
                      {p.name.split(" ")[0]}
                    </Text>
                  </View>
                ))}

              {fillSlots.map((_, i) => (
                <View key={`open-${i}`} style={styles.personCol}>
                  <View style={styles.openSpot}>
                    <Text style={styles.openSpotDots}>···</Text>
                  </View>
                  <Text style={styles.openSpotLabel}>Open Spot</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {!isMine && requestStatus === "rejected" && (
            <View style={styles.rejectedReasonBox}>
              <Text style={styles.rejectedReasonTitle}>Reason for Rejection</Text>
              <Text style={styles.rejectedReasonText}>
                {getRejectionRemark(plan.id) || "Host has declined the join request."}
              </Text>
            </View>
          )}

          {/* Schedule + Vibe Match */}
          <View style={styles.dualRow}>
            <View style={[styles.dualCard, styles.scheduleCard]}>
              <Text style={styles.dualTitle}>Schedule</Text>
              {schedule.map((item, idx) => (
                <View key={item.title} style={styles.timelineItem}>
                  <View style={styles.timelineRail}>
                    <View style={styles.timelineDot} />
                    {idx < schedule.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineBody}>
                    <Text style={styles.timelineTime}>{item.time}</Text>
                    <Text style={styles.timelineTitle}>{item.title}</Text>
                    <Text style={styles.timelineSub}>{item.sub}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.dualCard, styles.vibeCard]}>
              <Text style={styles.dualTitle}>Vibe Match</Text>
              <View style={styles.vibeScoreRow}>
                <Text style={styles.vibeHeart}>💗</Text>
                <Text style={styles.vibePercent}>{vibeScore}%</Text>
              </View>
              <Text style={styles.vibeMsg}>You vibe well with this group!</Text>
              <View style={styles.vibeTags}>
                <Text style={styles.miniTag}>🎵 Music</Text>
                <Text style={styles.miniTag}>🎬 Movies</Text>
                <Text style={styles.miniTag}>✈️ Travel</Text>
              </View>
              <LinearGradient
                colors={[...C.cta]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.waveBar}
              />
            </View>
          </View>

          {/* Host join requests */}
          {isMine && plan.requests && plan.requests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Join Requests ({plan.requests.length})
              </Text>
              {plan.requests.map((req) => (
                <View key={req.id} style={styles.requestCard}>
                  <Image
                    source={{
                      uri:
                        req.avatarUrl ||
                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop",
                    }}
                    style={styles.requestAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestName}>{req.name}</Text>
                    <Text style={styles.requestSub}>wants to join your hangout</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => respondToRequest(plan.id, req.id, true)}
                    style={[styles.reqBtn, { backgroundColor: "#22C55E" }]}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => respondToRequest(plan.id, req.id, false)}
                    style={[styles.reqBtn, { backgroundColor: "#EF4444" }]}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Bottom promo strip — matches hangout CTA vibe */}
          <View style={styles.bottomPromoContainer}>
            <LinearGradient
              colors={["#8B5CF6", "#D946EF", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bottomPromo}
            >
              <Text style={styles.bottomPromoEmoji}>🎁</Text>
              <Text style={styles.bottomPromoCopy}>
                Bring a friend & get Hangora points!
              </Text>
            </LinearGradient>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Sticky CTA above TabBar */}
      <View style={[styles.footer, { bottom: tabBarHeight }]}>
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={styles.footerInner}>{renderBottomCta()}</View>
      </View>

      <VibeSplitModal
        visible={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        hangoutId={plan?.id}
        titleName={plan?.title || "Hangout"}
      />
      <TabBar dark={false} />

      {showCancelModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {cancelContext?.type === "host_remove"
                ? "Remove Attendee"
                : "Leave Hangout"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {cancelContext?.type === "host_remove"
                ? "State the reason for removing this member:"
                : "Give a cancellation remark / reason for leaving:"}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={cancellationRemark}
              onChangeText={setCancellationRemark}
              placeholder="e.g. Sudden conflict / Sick / Double booked"
              placeholderTextColor={C.faint}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                style={[styles.modalBtn, styles.modalCloseBtn]}
              >
                <Text style={styles.modalCloseText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitCancellation}
                style={[styles.modalBtn, styles.modalSubmitBtn]}
              >
                <Text style={styles.modalSubmitText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  ambientTop: {
    position: "absolute",
    top: 180,
    left: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    zIndex: 0,
  },
  ambientCool: {
    position: "absolute",
    bottom: 160,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    zIndex: 0,
  },
  errorRoot: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: { fontSize: 16, fontFamily: VibeFonts.bold, color: C.muted },
  errorBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: C.purple,
  },
  errorBtnText: { color: "#fff", fontFamily: VibeFonts.bold },

  scroll: { flex: 1, zIndex: 1 },
  scrollContent: { paddingBottom: 24 },

  heroWrap: {
    width: SCREEN_W,
    height: HERO_H - 40,
    position: "relative",
    backgroundColor: "#D4CBE8",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_W,
    height: HERO_H - 40,
  },
  heroNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A1F36",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.purple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: C.purple,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  liveBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  titleCard: {
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    marginTop: -28,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  activityPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  activityPillEmoji: { fontSize: 13 },
  activityPillText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  heroTitleAccent: {
    color: "#7C3AED",
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    fontStyle: "italic",
  },
  taglineHeart: { color: "#EC4899" },

  body: {
    paddingHorizontal: 16,
    marginTop: 0,
    zIndex: 2,
  },

  statusCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  statusTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  startingLabel: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: C.faint,
  },
  startingValue: { marginTop: 2 },
  startingNum: {
    fontSize: 36,
    fontFamily: VibeFonts.extraBold,
    color: C.ink,
    letterSpacing: -1,
  },
  startingUnit: {
    fontSize: 18,
    fontFamily: VibeFonts.bold,
    color: C.pink,
  },
  whenText: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: C.muted,
  },
  statusBottom: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  stackAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.card,
  },
  stackMore: {
    backgroundColor: C.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  stackMoreText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: C.purple,
  },
  joinedText: {
    fontSize: 13,
    fontFamily: VibeFonts.semiBold,
    color: C.muted,
  },
  vibeBadge: {
    position: "absolute",
    right: 14,
    bottom: 14,
    backgroundColor: C.greenSoft,
    borderWidth: 1,
    borderColor: C.greenBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  vibeBadgeText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: C.greenBright,
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 22,
    shadowColor: "#1A1F36",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  locationThumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  locationMid: { flex: 1, minWidth: 0 },
  venueRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  venueName: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: C.ink,
    flexShrink: 1,
  },
  areaText: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    color: C.faint,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: C.purple,
  },
  mapChip: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: C.pinkBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: C.pinkSoft,
  },
  mapChipText: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: C.pink,
  },
  locationActions: { gap: 10 },
  roundAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: C.purple,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  roundActionGrad: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  section: { marginBottom: 22 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 12,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tagText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
  },

  peopleRow: { gap: 16, paddingRight: 8 },
  personCol: { width: 68, alignItems: "center" },
  hostAvatarRing: { position: "relative", marginBottom: 6 },
  hostRingGrad: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  hostAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#fff",
  },
  crownBadge: {
    position: "absolute",
    top: -4,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  personAvatarWrap: {
    position: "relative",
    marginBottom: 6,
  },
  personAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: C.card,
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.green,
    borderWidth: 2,
    borderColor: C.card,
  },
  removeTiny: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  personName: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: C.ink,
    textAlign: "center",
    opacity: 1,
  },
  hostLabel: {
    color: C.pink,
    fontFamily: VibeFonts.bold,
  },
  openSpot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(139,92,246,0.45)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    backgroundColor: C.softPurple,
  },
  openSpotDots: {
    color: C.purple,
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    letterSpacing: 1,
  },
  openSpotLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: C.faint,
    textAlign: "center",
  },

  rejectedReasonBox: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  rejectedReasonTitle: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#DC2626",
    marginBottom: 4,
  },
  rejectedReasonText: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: C.muted,
  },

  dualRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },
  dualCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    minHeight: 210,
    shadowColor: "#1A1F36",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  scheduleCard: {},
  vibeCard: {
    overflow: "hidden",
    backgroundColor: "#FFF5F9",
    borderColor: "rgba(236,72,153,0.25)",
  },
  dualTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: C.ink,
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 8,
    minHeight: 52,
  },
  timelineRail: {
    width: 12,
    alignItems: "center",
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.purple,
    marginTop: 3,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: "rgba(139,92,246,0.3)",
    marginTop: 3,
    marginBottom: 2,
  },
  timelineBody: { flex: 1, paddingBottom: 10 },
  timelineTime: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: C.purple,
  },
  timelineTitle: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: C.ink,
    marginTop: 1,
  },
  timelineSub: {
    fontSize: 10,
    fontFamily: VibeFonts.regular,
    color: C.faint,
    marginTop: 1,
  },
  vibeScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  vibeHeart: { fontSize: 28 },
  vibePercent: {
    fontSize: 34,
    fontFamily: VibeFonts.extraBold,
    color: C.pink,
    letterSpacing: -1,
  },
  vibeMsg: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: C.muted,
    lineHeight: 17,
    marginBottom: 12,
  },
  vibeTags: { gap: 6 },
  miniTag: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: C.muted,
  },
  waveBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 12,
    height: 4,
    borderRadius: 4,
    opacity: 0.9,
  },

  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  requestAvatar: { width: 36, height: 36, borderRadius: 18 },
  requestName: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: C.ink,
  },
  requestSub: {
    fontSize: 11,
    fontFamily: VibeFonts.regular,
    color: C.faint,
  },
  reqBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomPromoContainer: { marginBottom: 8 },
  bottomPromo: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bottomPromoEmoji: { fontSize: 22 },
  bottomPromoCopy: {
    flex: 1,
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 40,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: "rgba(248,246,255,0.96)",
    overflow: "hidden",
  },
  footerInner: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  ctaBlock: { width: "100%" },
  ctaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  secondaryIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryCtaWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  primaryCta: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryCtaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: VibeFonts.bold,
  },
  pendingCta: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 16,
  },
  pendingCtaText: {
    color: "#D97706",
    fontSize: 15,
    fontFamily: VibeFonts.bold,
  },
  hostPill: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.35)",
    backgroundColor: C.softPurple,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  hostPillText: {
    color: C.purpleDeep,
    fontSize: 15,
    fontFamily: VibeFonts.bold,
  },
  rejectedPill: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    backgroundColor: "rgba(239,68,68,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rejectedPillText: {
    color: "#DC2626",
    fontSize: 15,
    fontFamily: VibeFonts.bold,
  },
  cancelHint: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 11,
    fontFamily: VibeFonts.regular,
    color: C.faint,
  },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,31,54,0.45)",
    zIndex: 99,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: Spacing.xl,
    shadowColor: "#1A1F36",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.bold,
    color: C.ink,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: C.muted,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  modalInput: {
    width: "100%",
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.md,
    padding: 12,
    color: C.ink,
    fontFamily: VibeFonts.medium,
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  modalActions: { flexDirection: "row", gap: 12 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.full,
    alignItems: "center",
  },
  modalCloseBtn: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalCloseText: {
    color: C.muted,
    fontFamily: VibeFonts.bold,
  },
  modalSubmitBtn: { backgroundColor: "#EF4444" },
  modalSubmitText: { color: "#fff", fontFamily: VibeFonts.bold },
});
