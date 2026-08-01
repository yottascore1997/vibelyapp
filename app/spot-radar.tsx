import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  StatusBar,
  Share,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { VibeFonts } from "../constants/vibeTheme";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { usePlans } from "../context/PlansContext";
import TabBar from "../components/TabBar";
import AppHeader from "../components/vibe/AppHeader";
import HangoutCinematicBackground from "../components/vibe/HangoutCinematicBackground";

const { width: SCREEN_W } = Dimensions.get("window");
const RADAR_SIZE = 300;

const coffeeVideo = require("../assets/cofee.mp4");
const smokeVideo = require("../assets/smoke.mp4");
const drinkVideo = require("../assets/drink.mp4");

const ACT_VIDEOS: Record<string, number> = {
  coffee: coffeeVideo,
  cafe: coffeeVideo,
  sutta: smokeVideo,
  smoke: smokeVideo,
  drinks: drinkVideo,
  drink: drinkVideo,
  beer: drinkVideo,
};

function resolveActivityVideoKey(activityId?: string, vibe?: string, emoji?: string) {
  const id = (activityId || "").toLowerCase().trim();
  if (id && ACT_VIDEOS[id]) return id;
  const v = (vibe || "").toLowerCase();
  if (v.includes("coffee") || v.includes("cafe") || emoji === "☕") return "coffee";
  if (v.includes("sutta") || v.includes("smoke") || emoji === "🚬") return "sutta";
  if (v.includes("drink") || v.includes("beer") || emoji === "🍸" || emoji === "🍺") return "drinks";
  return id || "";
}

function SpotHeroVideo({ source }: { source: number }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

const T = {
  bg: "#070A14",
  card: "rgba(22, 26, 46, 0.94)",
  cardElevated: "rgba(28, 32, 54, 0.98)",
  ink: "#F4F6FB",
  muted: "#A7B0C4",
  faint: "#7C869C",
  purple: "#A78BFA",
  purpleBright: "#C4B5FD",
  pink: "#F472B6",
  green: "#34D399",
  gold: "#FBBF24",
  softPurple: "rgba(139, 92, 246, 0.18)",
  softPink: "rgba(244, 114, 182, 0.16)",
  border: "rgba(160, 170, 200, 0.16)",
  purpleGrad: ["#7C3AED", "#A78BFA"] as [string, string],
  promoGrad: ["#6D28D9", "#8B5CF6", "#DB2777"] as [string, string],
};

const RICH_FALLBACK_PROFILES = [
  {
    id: "near-1",
    name: "Aanya",
    age: 22,
    city: "Nagpur",
    distance: "140m",
    vibe: "☕ Down for Coffee",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&fit=crop",
    isOnline: true,
    isVerified: true,
    bio: "Cafe hopping & photography lover 📷",
    radarPos: { top: 35, left: 175 },
  },
  {
    id: "near-2",
    name: "Rohan",
    age: 24,
    city: "Nagpur",
    distance: "310m",
    vibe: "🍕 Hungry & Free",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop",
    isOnline: true,
    isVerified: true,
    bio: "Tech enthusiast & foodie",
    radarPos: { top: 155, left: 20 },
  },
  {
    id: "near-3",
    name: "Simran",
    age: 23,
    city: "Nagpur",
    distance: "490m",
    vibe: "🎧 Music & Chill",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&fit=crop",
    isOnline: true,
    isVerified: false,
    bio: "Indie acoustic music lover 🎶",
    radarPos: { top: 45, left: 40 },
  },
  {
    id: "near-4",
    name: "Kabir",
    age: 25,
    city: "Nagpur",
    distance: "680m",
    vibe: "🚗 Late Drive",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&fit=crop",
    isOnline: true,
    isVerified: true,
    bio: "Late night drives & espresso",
    radarPos: { top: 175, left: 170 },
  },
  {
    id: "near-5",
    name: "Priya",
    age: 21,
    city: "Nagpur",
    distance: "820m",
    vibe: "🍿 Movie Night",
    avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&fit=crop",
    isOnline: true,
    isVerified: true,
    bio: "Cinema nerd & pop culture fan",
    radarPos: { top: 105, left: 210 },
  },
];

export default function SpotRadarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { nearbyPlans, myPlans, refresh: refreshPlans } = usePlans();

  const venue = (Array.isArray(params.venue) ? params.venue[0] : params.venue) || "Starbucks Cafe";
  const vibe = (Array.isArray(params.vibe) ? params.vibe[0] : params.vibe) || "Coffee";
  const emoji = (Array.isArray(params.emoji) ? params.emoji[0] : params.emoji) || "☕";
  const activityIdParam =
    (Array.isArray(params.activityId) ? params.activityId[0] : params.activityId) || "";
  const initialDuration = parseInt(
    (Array.isArray(params.duration) ? params.duration[0] : params.duration) || "30",
    10
  );

  const videoKey = useMemo(
    () => resolveActivityVideoKey(activityIdParam, vibe, emoji),
    [activityIdParam, vibe, emoji]
  );
  const heroVideoSource = videoKey ? ACT_VIDEOS[videoKey] : undefined;

  const [nearbyUsers, setNearbyUsers] = useState<any[]>(RICH_FALLBACK_PROFILES);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [pingedUserIds, setPingedUserIds] = useState<string[]>([]);
  const [sendingPingId, setSendingPingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"radar" | "grid">("radar");
  const [secondsLeft, setSecondsLeft] = useState(initialDuration * 60);

  const pulse1 = useSharedValue(0.2);
  const pulse2 = useSharedValue(0.2);
  const radarSweep = useSharedValue(0);

  useEffect(() => {
    pulse1.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
      -1,
      false
    );
    setTimeout(() => {
      pulse2.value = withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
        -1,
        false
      );
    }, 1100);
    radarSweep.value = withRepeat(
      withTiming(360, { duration: 3600, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const loadNearbyData = useCallback(async () => {
    setLoading(true);
    try {
      const [nearbyRes, profilesRes] = await Promise.all([
        api.getNearbyPeople({ maxKm: 5, limit: 20 }),
        api.getProfiles("dating"),
      ]);

      const rawList =
        (nearbyRes && Array.isArray(nearbyRes) && nearbyRes.length > 0
          ? nearbyRes
          : profilesRes && Array.isArray(profilesRes) && profilesRes.length > 0
          ? profilesRes
          : []) as any[];

      if (rawList && rawList.length > 0) {
        const mapped = rawList.map((u: any, idx: number) => {
          const distNum = u.distance ? Math.round(u.distance * 1000) : (idx + 1) * 160;
          return {
            id: u.id || `user-${idx}`,
            name: u.name || `User ${idx + 1}`,
            age: u.age || 22 + (idx % 4),
            city: u.city || "Nagpur",
            distance: `${distNum}m`,
            vibe: `${emoji} Free Now`,
            avatarUrl:
              u.avatarUrl ||
              RICH_FALLBACK_PROFILES[idx % RICH_FALLBACK_PROFILES.length].avatarUrl,
            isOnline: u.isOnline ?? true,
            isVerified: u.isVerified ?? idx % 2 === 0,
            bio: u.bio || "Looking to connect nearby!",
            radarPos: RICH_FALLBACK_PROFILES[idx % RICH_FALLBACK_PROFILES.length].radarPos,
          };
        });
        setNearbyUsers(mapped);
        setSelectedUser(mapped[0]);
      } else {
        setNearbyUsers(RICH_FALLBACK_PROFILES);
        setSelectedUser(RICH_FALLBACK_PROFILES[0]);
      }
    } catch {
      setNearbyUsers(RICH_FALLBACK_PROFILES);
      setSelectedUser(RICH_FALLBACK_PROFILES[0]);
    } finally {
      setLoading(false);
    }
  }, [emoji]);

  useEffect(() => {
    loadNearbyData();
    refreshPlans().catch(() => undefined);
  }, [loadNearbyData, refreshPlans]);

  const vibeKey = vibe.toLowerCase();
  const nearbyEvents = [...nearbyPlans, ...myPlans]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .filter((p) => p.status !== "CANCELLED" && p.status !== "COMPLETED")
    .filter((p) => {
      const hay = `${p.title || ""} ${p.activity || ""} ${(p as any).activityName || ""} ${p.badge || ""} ${p.location || ""}`.toLowerCase();
      if (vibeKey.includes("coffee")) return /coffee|cafe|chai/.test(hay);
      if (vibeKey.includes("food")) return /food|pizza|lunch|dinner|biryani|hungry/.test(hay);
      if (vibeKey.includes("movie")) return /movie|cinema|film|popcorn/.test(hay);
      if (vibeKey.includes("sport")) return /sport|cricket|badminton|gym|run|football/.test(hay);
      if (vibeKey.includes("drink")) return /drink|beer|bar|cocktail|party/.test(hay);
      if (vibeKey.includes("trip") || vibeKey.includes("travel")) return /travel|trip|drive|road/.test(hay);
      return true;
    })
    .slice(0, 8);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value * 1.5 }],
    opacity: 1 - pulse1.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value * 1.5 }],
    opacity: 1 - pulse2.value,
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${radarSweep.value}deg` }],
  }));

  const handleSendPing = async (targetUser: any) => {
    if (pingedUserIds.includes(targetUser.id) || sendingPingId) return;
    setSendingPingId(targetUser.id);
    try {
      if (user) {
        await api.sendInvite({
          receiverId: targetUser.id,
          activityName: vibe,
          activityEmoji: emoji,
          timeLabel: `At ${venue}!`,
        });
      }
      setPingedUserIds((prev) => [...prev, targetUser.id]);
      Alert.alert("⚡ Invite sent!", `Ping sent to ${targetUser.name} for ${emoji} ${vibe} at ${venue}!`);
    } catch {
      setPingedUserIds((prev) => [...prev, targetUser.id]);
      Alert.alert("⚡ Invite sent!", `Ping sent to ${targetUser.name}!`);
    } finally {
      setSendingPingId(null);
    }
  };

  const handleOpenChat = (targetUserId: string) => {
    router.push(`/chat/${targetUserId}`);
  };

  const openUserProfile = (person: any) => {
    if (!person?.id) return;
    router.push({
      pathname: "/user/[id]",
      params: {
        id: String(person.id),
        name: person.name || "User",
        age: person.age ? String(person.age) : "",
        bio: person.bio || "",
        city: person.city || "Nagpur",
        distance: person.distance ? String(person.distance) : "",
        avatarUrl: person.avatarUrl || "",
        vibe: person.vibe || "",
        jobTitle: person.jobTitle || "",
        isVerified: person.isVerified ? "1" : "0",
        isOnline: person.isOnline === false ? "0" : "1",
      },
    });
  };

  const handleShareSpot = async () => {
    try {
      const res = await api.createPublicInvite({
        activityName: vibe,
        activityEmoji: emoji,
        timeLabel: `At ${venue} for next ${initialDuration} mins!`,
      });
      await Share.share({
        message: `Hey! Live Spot at ${venue} (${emoji} ${vibe}). Join: ${
          res?.inviteUrl || "https://vibematch.app"
        }`,
      });
    } catch {
      await Share.share({
        message: `At ${venue} (${emoji} ${vibe}) right now! Join me: https://vibematch.app`,
      });
    }
  };

  return (
    <View style={styles.root}>
      <HangoutCinematicBackground />
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />

      <View style={styles.foreground}>
        <AppHeader variant="dark" tagline="Live spots · Nearby radar" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Venue hero — looping activity video + text heading */}
          <Animated.View entering={FadeInUp.duration(380)} style={styles.heroWrap}>
            <View style={[styles.heroCard, heroVideoSource && styles.heroCardVideo]}>
              {heroVideoSource ? (
                <>
                  <View style={styles.heroVideoLayer} pointerEvents="none">
                    <SpotHeroVideo key={videoKey} source={heroVideoSource} />
                  </View>
                  <LinearGradient
                    colors={["rgba(7,10,20,0.25)", "rgba(7,10,20,0.45)", "rgba(7,10,20,0.88)"]}
                    locations={[0, 0.4, 1]}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                </>
              ) : (
                <LinearGradient
                  colors={[...T.promoGrad]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}

              <View style={styles.heroTopRow}>
                <TouchableOpacity
                  style={styles.backOnHero}
                  onPress={() => router.back()}
                  activeOpacity={0.85}
                >
                  <Ionicons name="chevron-back" size={18} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.scanningPill}>
                  <View style={styles.scanningDot} />
                  <Text style={styles.scanningPillText}>LIVE SCAN</Text>
                </View>

                <TouchableOpacity
                  style={styles.heroShareChip}
                  onPress={handleShareSpot}
                  activeOpacity={0.85}
                >
                  <Ionicons name="share-social" size={13} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.heroBottomBlock}>
                <Text style={styles.heroEyebrow}>{emoji} {vibe.toUpperCase()}</Text>
                <Text style={styles.heroVenue} numberOfLines={2}>
                  {venue}
                </Text>
                <Text style={styles.heroVibe}>
                  Scanning nearby · {formatTimer(secondsLeft)}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Toggle + rescan */}
          <View style={styles.viewToggleContainer}>
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => setViewMode("radar")}
              activeOpacity={0.88}
            >
              {viewMode === "radar" ? (
                <LinearGradient colors={T.purpleGrad} style={styles.toggleGrad}>
                  <Ionicons name="radio" size={14} color="#FFF" />
                  <Text style={styles.toggleTextActive}>Radar</Text>
                </LinearGradient>
              ) : (
                <View style={styles.toggleInner}>
                  <Ionicons name="radio" size={14} color={T.muted} />
                  <Text style={styles.toggleText}>Radar</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => setViewMode("grid")}
              activeOpacity={0.88}
            >
              {viewMode === "grid" ? (
                <LinearGradient
                  colors={["#DB2777", "#F472B6"]}
                  style={styles.toggleGrad}
                >
                  <Ionicons name="grid" size={14} color="#FFF" />
                  <Text style={styles.toggleTextActive}>
                    Feed ({nearbyUsers.length})
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.toggleInner}>
                  <Ionicons name="grid" size={14} color={T.muted} />
                  <Text style={styles.toggleText}>Feed ({nearbyUsers.length})</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rescanBtn}
              onPress={loadNearbyData}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={16} color={T.purpleBright} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <View style={styles.loadingRadar}>
                <ActivityIndicator size="large" color={T.purple} />
              </View>
              <Text style={styles.loadingTitle}>Scanning nearby vibes</Text>
              <Text style={styles.loadingText}>Finding people around {venue}…</Text>
            </View>
          ) : viewMode === "radar" ? (
            <View style={styles.radarSection}>
              <View style={styles.radarCardWrap}>
                <LinearGradient
                  colors={["#1A1530", "#12182C", "#0A0F1C"]}
                  style={styles.radarCardBg}
                />
                <LinearGradient
                  colors={[
                    "rgba(124,58,237,0.2)",
                    "transparent",
                    "rgba(236,72,153,0.12)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.radarCardGlow}
                />

                <View style={styles.radarCircleWrap}>
                  <Animated.View style={[styles.pulseRing, ring1Style]} />
                  <Animated.View style={[styles.pulseRing, ring2Style]} />

                  <View style={styles.radarInnerCircle}>
                    <View style={styles.radarRingOuter} />
                    <View style={styles.radarRingMid} />
                    <View style={styles.radarRingInner} />
                    <View style={styles.radarCrosshairH} />
                    <View style={styles.radarCrosshairV} />

                    <Text style={[styles.ringLabel, styles.ringLabelFar]}>1 km</Text>
                    <Text style={[styles.ringLabel, styles.ringLabelMid]}>500m</Text>

                    <Animated.View style={[styles.radarSweepLine, sweepStyle]}>
                      <LinearGradient
                        colors={[
                          "rgba(236,72,153,0.55)",
                          "rgba(139,92,246,0.2)",
                          "transparent",
                        ]}
                        style={StyleSheet.absoluteFill}
                      />
                    </Animated.View>

                    <View style={styles.centerSelfPin}>
                      <View style={styles.pinGlow} />
                      <LinearGradient colors={T.purpleGrad} style={styles.pinCore}>
                        <Text style={{ fontSize: 17 }}>{emoji}</Text>
                      </LinearGradient>
                      <Text style={styles.youLabel}>You</Text>
                    </View>

                    {nearbyUsers.slice(0, 5).map((userItem) => {
                      const offset = userItem.radarPos || { top: 60, left: 140 };
                      const isSelected = selectedUser?.id === userItem.id;
                      const isPinged = pingedUserIds.includes(userItem.id);
                      return (
                        <TouchableOpacity
                          key={userItem.id}
                          style={[
                            styles.radarAvatarMarker,
                            offset,
                            isSelected && styles.radarAvatarSelected,
                            isPinged && styles.radarAvatarPinged,
                          ]}
                          onPress={() => setSelectedUser(userItem)}
                          onLongPress={() => openUserProfile(userItem)}
                          activeOpacity={0.85}
                        >
                          <Image
                            source={{ uri: userItem.avatarUrl }}
                            style={styles.radarAvatarImg}
                          />
                          <View
                            style={[
                              styles.radarAvatarDot,
                              { backgroundColor: isPinged ? T.green : T.pink },
                            ]}
                          />
                          {isSelected ? (
                            <View style={styles.radarNameTag}>
                              <Text style={styles.radarNameTagText} numberOfLines={1}>
                                {userItem.name.split(" ")[0]}
                              </Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                <Text style={styles.radarHint}>
                  Tap to select · long-press for profile
                </Text>
              </View>

              {selectedUser ? (
                <Animated.View entering={ZoomIn.duration(280)} style={styles.highlightCard}>
                  <LinearGradient
                    colors={["rgba(139,92,246,0.35)", "rgba(236,72,153,0.2)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.highlightAccent}
                  />
                  <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={() => openUserProfile(selectedUser)}
                  >
                    <View style={styles.highlightInner}>
                      <View style={styles.highlightAvatarRing}>
                        <Image
                          source={{ uri: selectedUser.avatarUrl }}
                          style={styles.highlightImg}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.highlightNameRow}>
                          <Text style={styles.highlightName}>{selectedUser.name}</Text>
                          {selectedUser.age ? (
                            <Text style={styles.highlightAge}>, {selectedUser.age}</Text>
                          ) : null}
                          {selectedUser.isVerified && (
                            <Ionicons
                              name="checkmark-circle"
                              size={15}
                              color={T.purple}
                            />
                          )}
                        </View>
                        <Text style={styles.highlightBio} numberOfLines={1}>
                          {selectedUser.bio || selectedUser.vibe}
                        </Text>
                        <View style={styles.badgeRow}>
                          <View style={styles.miniBadge}>
                            <Ionicons name="navigate" size={10} color={T.purple} />
                            <Text style={styles.miniBadgeText}>
                              {selectedUser.distance}
                            </Text>
                          </View>
                          <View style={[styles.miniBadge, styles.miniBadgePink]}>
                            <Text style={[styles.miniBadgeText, { color: T.pink }]}>
                              {selectedUser.vibe}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={T.faint} />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.highlightActions}>
                    <TouchableOpacity
                      style={styles.pingBtn}
                      onPress={() => handleSendPing(selectedUser)}
                      activeOpacity={0.88}
                    >
                      {pingedUserIds.includes(selectedUser.id) ? (
                        <View style={[styles.pingBtnSolid, { backgroundColor: "#64748B" }]}>
                          <Ionicons name="checkmark-done" size={15} color="#FFF" />
                          <Text style={styles.pingBtnText}>Invited</Text>
                        </View>
                      ) : (
                        <LinearGradient
                          colors={["#059669", "#34D399"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.pingBtnSolid}
                        >
                          {sendingPingId === selectedUser.id ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <>
                              <Ionicons name="flash" size={15} color="#FFF" />
                              <Text style={styles.pingBtnText}>Invite to Spot</Text>
                            </>
                          )}
                        </LinearGradient>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.chatBtn}
                      onPress={() => handleOpenChat(selectedUser.id)}
                      activeOpacity={0.88}
                    >
                      <LinearGradient colors={T.purpleGrad} style={styles.chatBtnGrad}>
                        <Ionicons name="chatbubble-ellipses" size={16} color="#FFF" />
                        <Text style={styles.chatBtnText}>Chat</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ) : null}
            </View>
          ) : null}

          {/* Nearby hangouts */}
          <View style={styles.gridSection}>
            <View style={styles.gridSecHeader}>
              <Text style={styles.gridSecTitle}>
                {emoji} {vibe} nearby
              </Text>
              <View style={styles.countPill}>
                <Text style={styles.gridSecCount}>{nearbyEvents.length} live</Text>
              </View>
            </View>

            {nearbyEvents.length === 0 ? (
              <TouchableOpacity
                style={styles.emptyEventsCard}
                activeOpacity={0.9}
                onPress={() => router.push("/create-plan")}
              >
                <LinearGradient
                  colors={["rgba(124,58,237,0.15)", "rgba(236,72,153,0.08)"]}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.emptyEventsEmoji}>{emoji}</Text>
                <Text style={styles.emptyEventsTitle}>
                  No {vibe.toLowerCase()} plans nearby yet
                </Text>
                <Text style={styles.emptyEventsSub}>
                  Be first — create one and scan will pick it up
                </Text>
                <View style={styles.emptyEventsCta}>
                  <Text style={styles.emptyEventsCtaText}>Create plan</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.eventsScroll}
              >
                {nearbyEvents.map((plan, index) => (
                  <Animated.View
                    key={plan.id}
                    entering={FadeInDown.delay(index * 40).springify()}
                  >
                    <TouchableOpacity
                      style={styles.eventCard}
                      activeOpacity={0.9}
                      onPress={() =>
                        router.push({
                          pathname: "/plan-details",
                          params: { id: plan.id },
                        })
                      }
                    >
                      <Image
                        source={{
                          uri:
                            plan.imageUrl ||
                            "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400",
                        }}
                        style={styles.eventImg}
                      />
                      <LinearGradient
                        colors={["transparent", "rgba(7,10,20,0.95)"]}
                        style={styles.eventOverlay}
                      >
                        <View style={styles.eventBadge}>
                          <Text style={styles.eventBadgeText}>
                            {plan.timeLabel || plan.badge || "Soon"}
                          </Text>
                        </View>
                        <Text style={styles.eventTitle} numberOfLines={2}>
                          {plan.title}
                        </Text>
                        <Text style={styles.eventMeta} numberOfLines={1}>
                          {plan.location || plan.destination || "Nearby"}
                          {typeof plan.distance === "number"
                            ? ` · ${Math.round(plan.distance)} km`
                            : ""}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* People feed — always visible, emphasized in grid mode */}
          <View style={styles.gridSection}>
            <View style={styles.gridSecHeader}>
              <Text style={styles.gridSecTitle}>People Near You</Text>
              <View style={[styles.countPill, styles.countPillPink]}>
                <Text style={[styles.gridSecCount, { color: T.pink }]}>
                  {nearbyUsers.length} live
                </Text>
              </View>
            </View>

            <View style={styles.grid}>
              {nearbyUsers.map((item, index) => {
                const isPinged = pingedUserIds.includes(item.id);
                return (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.delay(index * 40).springify()}
                    style={styles.cardWrap}
                  >
                    <PressableCard
                      item={item}
                      isPinged={isPinged}
                      sending={sendingPingId === item.id}
                      onSelect={() => openUserProfile(item)}
                      onPing={() => handleSendPing(item)}
                      onChat={() => handleOpenChat(item.id)}
                    />
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <TabBar dark />
      </View>
    </View>
  );
}

function PressableCard({
  item,
  isPinged,
  sending,
  onSelect,
  onPing,
  onChat,
}: {
  item: any;
  isPinged: boolean;
  sending: boolean;
  onSelect: () => void;
  onPing: () => void;
  onChat: () => void;
}) {
  return (
    <TouchableOpacity style={styles.profileCard} onPress={onSelect} activeOpacity={0.92}>
      <Image source={{ uri: item.avatarUrl }} style={styles.cardImg} />
      <LinearGradient colors={["transparent", "rgba(15,23,42,0.55)", "rgba(15,23,42,0.95)"]} style={styles.cardGrad} />

      <View style={styles.distBadge}>
        <Ionicons name="navigate" size={9} color="#FFF" />
        <Text style={styles.distBadgeText}>{item.distance}</Text>
      </View>

      {item.isOnline && (
        <View style={styles.onlinePill}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Live</Text>
        </View>
      )}

      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName}>{item.name}</Text>
          {item.age ? <Text style={styles.cardAge}>, {item.age}</Text> : null}
          {item.isVerified && <Ionicons name="checkmark-circle" size={12} color="#C4B5FD" />}
        </View>
        <Text style={styles.cardVibeText} numberOfLines={1}>
          {item.vibe}
        </Text>

        <View style={styles.cardActionRow}>
          <TouchableOpacity style={styles.cardPingBtn} onPress={onPing} activeOpacity={0.88}>
            {isPinged ? (
              <View style={[styles.cardPingSolid, { backgroundColor: "#94A3B8" }]}>
                <Text style={styles.cardPingText}>Invited</Text>
              </View>
            ) : (
              <View style={[styles.cardPingSolid, { backgroundColor: T.green }]}>
                {sending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="flash" size={11} color="#FFF" />
                    <Text style={styles.cardPingText}>Invite</Text>
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cardChatIconBtn} onPress={onChat} activeOpacity={0.88}>
            <Ionicons name="chatbubble-ellipses" size={13} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  foreground: { flex: 1, zIndex: 1, backgroundColor: "transparent" },

  heroWrap: { paddingHorizontal: 16, marginBottom: 12, marginTop: 4 },
  heroCard: {
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
    minHeight: 168,
    justifyContent: "space-between",
  },
  heroCardVideo: {
    height: 180,
    minHeight: 180,
    padding: 0,
  },
  heroVideoLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B1020",
  },
  heroBottomBlock: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 8,
  },
  heroShine: {
    position: "absolute",
    top: -40,
    right: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  heroShine2: {
    position: "absolute",
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(251,191,36,0.1)",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 14,
    marginBottom: 8,
  },
  backOnHero: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanningPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  scanningDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#34D399",
  },
  scanningPillText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.7,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  heroEmojiWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  heroEyebrow: {
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    color: "rgba(255,255,255,0.78)",
    letterSpacing: 1,
  },
  heroVenue: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
    letterSpacing: -0.4,
    marginTop: 4,
  },
  heroVibe: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  heroShareChip: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(16,185,129,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },

  viewToggleContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: T.card,
    padding: 4,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: T.border,
    gap: 4,
    alignItems: "center",
  },
  toggleBtn: { flex: 1, borderRadius: 13, overflow: "hidden" },
  toggleGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  toggleInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  toggleText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.muted,
  },
  toggleTextActive: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
  },
  rescanBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingWrap: {
    padding: 48,
    alignItems: "center",
    gap: 10,
  },
  loadingRadar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  loadingTitle: {
    color: T.ink,
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
  },
  loadingText: {
    color: T.muted,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    textAlign: "center",
  },

  radarSection: { alignItems: "center", paddingBottom: 8 },
  radarCardWrap: {
    backgroundColor: T.card,
    padding: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
    overflow: "hidden",
    alignItems: "center",
    marginHorizontal: 16,
    width: SCREEN_W - 32,
  },
  radarCardBg: { ...StyleSheet.absoluteFillObject },
  radarCardGlow: { ...StyleSheet.absoluteFillObject },
  radarCircleWrap: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    borderWidth: 1.5,
    borderColor: T.purple,
  },
  radarInnerCircle: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    backgroundColor: "rgba(139,92,246,0.1)",
    borderWidth: 2,
    borderColor: "rgba(167,139,250,0.35)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  radarRingOuter: {
    position: "absolute",
    width: RADAR_SIZE * 0.82,
    height: RADAR_SIZE * 0.82,
    borderRadius: RADAR_SIZE * 0.41,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.18)",
  },
  radarRingMid: {
    position: "absolute",
    width: RADAR_SIZE * 0.55,
    height: RADAR_SIZE * 0.55,
    borderRadius: RADAR_SIZE * 0.275,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
  },
  radarRingInner: {
    position: "absolute",
    width: RADAR_SIZE * 0.28,
    height: RADAR_SIZE * 0.28,
    borderRadius: RADAR_SIZE * 0.14,
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.25)",
  },
  radarCrosshairH: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "rgba(167,139,250,0.16)",
  },
  radarCrosshairV: {
    position: "absolute",
    height: "100%",
    width: 1,
    backgroundColor: "rgba(167,139,250,0.16)",
  },
  ringLabel: {
    position: "absolute",
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "rgba(196,181,253,0.55)",
    zIndex: 5,
  },
  ringLabelFar: { top: 10, right: 18 },
  ringLabelMid: { top: RADAR_SIZE * 0.22, right: RADAR_SIZE * 0.28 },
  radarSweepLine: {
    position: "absolute",
    width: "50%",
    height: "50%",
    top: 0,
    right: 0,
  },
  centerSelfPin: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  pinGlow: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(124,58,237,0.25)",
  },
  pinCore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#1A2238",
  },
  youLabel: {
    marginTop: 4,
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: T.purpleBright,
  },
  radarAvatarMarker: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: T.purple,
    overflow: "visible",
    zIndex: 12,
  },
  radarAvatarSelected: {
    borderColor: T.pink,
    borderWidth: 3,
    transform: [{ scale: 1.08 }],
  },
  radarAvatarPinged: {
    borderColor: T.green,
  },
  radarAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    overflow: "hidden",
  },
  radarAvatarDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#12182C",
  },
  radarNameTag: {
    position: "absolute",
    bottom: -16,
    alignSelf: "center",
    left: -8,
    right: -8,
    backgroundColor: "rgba(15,22,38,0.92)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.4)",
  },
  radarNameTagText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: T.ink,
    textAlign: "center",
  },
  radarHint: {
    marginTop: 14,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },

  highlightCard: {
    width: SCREEN_W - 32,
    borderRadius: 22,
    overflow: "hidden",
    marginTop: 14,
    backgroundColor: T.cardElevated,
    borderWidth: 1,
    borderColor: T.border,
  },
  highlightAccent: {
    height: 3,
    width: "100%",
  },
  highlightInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  highlightAvatarRing: {
    padding: 2,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(167,139,250,0.5)",
  },
  highlightImg: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  highlightNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  highlightName: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  highlightAge: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  highlightBio: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  miniBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: T.softPurple,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  miniBadgePink: {
    backgroundColor: T.softPink,
  },
  miniBadgeText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.purple,
  },
  highlightActions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  pingBtn: { flex: 1.4, borderRadius: 14, overflow: "hidden" },
  pingBtnSolid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  pingBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
  },
  chatBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  chatBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  chatBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
  },

  gridSection: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  gridSecHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  gridSecTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  countPill: {
    backgroundColor: T.softPurple,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countPillPink: {
    backgroundColor: T.softPink,
  },
  gridSecCount: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.purple,
  },
  eventsScroll: {
    gap: 10,
    paddingRight: 8,
  },
  eventCard: {
    width: 168,
    height: 190,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  eventImg: {
    width: "100%",
    height: "100%",
  },
  eventOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    paddingTop: 40,
  },
  eventBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(124,58,237,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  eventBadgeText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    lineHeight: 18,
  },
  eventMeta: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.85)",
  },
  emptyEventsCard: {
    alignItems: "center",
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: T.border,
    borderStyle: "dashed",
    paddingVertical: 22,
    paddingHorizontal: 16,
    gap: 4,
    overflow: "hidden",
  },
  emptyEventsEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  emptyEventsTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    textAlign: "center",
  },
  emptyEventsSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyEventsCta: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  emptyEventsCtaText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrap: {
    width: (SCREEN_W - 44) / 2,
    marginBottom: 12,
  },
  profileCard: {
    width: "100%",
    height: 236,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardImg: { width: "100%", height: "100%" },
  cardGrad: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 130,
  },
  distBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(124,58,237,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  distBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: VibeFonts.bold,
  },
  onlinePill: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16,185,129,0.95)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFF",
  },
  onlineText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: VibeFonts.bold,
  },
  cardInfo: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    gap: 2,
  },
  cardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  cardName: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
  },
  cardAge: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
  },
  cardVibeText: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "#E2E8F0",
  },
  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  cardPingBtn: { flex: 1, borderRadius: 10, overflow: "hidden" },
  cardPingSolid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 7,
  },
  cardPingText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
  cardChatIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(139,92,246,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
});
