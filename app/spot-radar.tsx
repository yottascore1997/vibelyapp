import React, { useState, useEffect, useCallback } from "react";
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { VibeFonts } from "../constants/vibeTheme";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import TabBar from "../components/TabBar";
import AppHeader from "../components/vibe/AppHeader";

const { width: SCREEN_W } = Dimensions.get("window");
const RADAR_SIZE = 280;

const T = {
  bg: "#F8F9FD",
  card: "#FFFFFF",
  ink: "#18181B",
  muted: "#64748B",
  purple: "#7C3AED",
  purpleBright: "#8B5CF6",
  green: "#22C55E",
  softPurple: "#F3E8FF",
  border: "#EDE7FF",
  purpleGrad: ["#7C3AED", "#8B5CF6"] as [string, string],
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

function BounceEmoji({ emoji }: { emoji: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, []);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.Text style={[{ fontSize: 28 }, anim]}>{emoji}</Animated.Text>;
}

export default function SpotRadarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const venue = (params.venue as string) || "Starbucks Cafe";
  const vibe = (params.vibe as string) || "Coffee";
  const emoji = (params.emoji as string) || "☕";
  const initialDuration = parseInt((params.duration as string) || "30", 10);

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
  }, [loadNearbyData]);

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
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      <LinearGradient
        colors={["rgba(167,139,250,0.2)", "transparent"]}
        style={styles.ambientTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(124,58,237,0.08)", "transparent"]}
        style={styles.ambientRight}
        pointerEvents="none"
      />

      <AppHeader variant="light" tagline="Live spots · Nearby radar" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Venue hero */}
        <Animated.View entering={FadeInUp.duration(380)} style={styles.heroWrap}>
          <LinearGradient colors={T.purpleGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
            <View style={styles.heroShine} />
            <View style={styles.heroRow}>
              <TouchableOpacity style={styles.backOnHero} onPress={() => router.back()} activeOpacity={0.85}>
                <Ionicons name="chevron-back" size={18} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.heroEmojiWrap}>
                <BounceEmoji emoji={emoji} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroEyebrow}>YOUR LIVE SPOT</Text>
                <Text style={styles.heroVenue} numberOfLines={1}>
                  {venue}
                </Text>
                <Text style={styles.heroVibe}>{vibe} · scanning nearby</Text>
              </View>
            </View>

            <View style={styles.hudStrip}>
              <View style={styles.hudChip}>
                <Ionicons name="navigate" size={12} color="#FFF" />
                <Text style={styles.hudChipText}>1 km</Text>
              </View>
              <View style={styles.hudChip}>
                <Ionicons name="timer" size={12} color="#FFF" />
                <Text style={styles.hudChipText}>{formatTimer(secondsLeft)}</Text>
              </View>
              <View style={styles.hudChip}>
                <Ionicons name="people" size={12} color="#FFF" />
                <Text style={styles.hudChipText}>{nearbyUsers.length} nearby</Text>
              </View>
              <TouchableOpacity style={styles.heroShareChip} onPress={handleShareSpot} activeOpacity={0.85}>
                <Ionicons name="share-social" size={12} color="#FFF" />
                <Text style={styles.hudChipText}>Share</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Toggle */}
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity style={styles.toggleBtn} onPress={() => setViewMode("radar")} activeOpacity={0.88}>
            {viewMode === "radar" ? (
              <LinearGradient colors={T.purpleGrad} style={styles.toggleGrad}>
                <Ionicons name="radio" size={14} color="#FFF" />
                <Text style={styles.toggleTextActive}>Radar Map</Text>
              </LinearGradient>
            ) : (
              <View style={styles.toggleInner}>
                <Ionicons name="radio" size={14} color={T.muted} />
                <Text style={styles.toggleText}>Radar Map</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleBtn} onPress={() => setViewMode("grid")} activeOpacity={0.88}>
            {viewMode === "grid" ? (
              <LinearGradient colors={T.purpleGrad} style={styles.toggleGrad}>
                <Ionicons name="grid" size={14} color="#FFF" />
                <Text style={styles.toggleTextActive}>Feed ({nearbyUsers.length})</Text>
              </LinearGradient>
            ) : (
              <View style={styles.toggleInner}>
                <Ionicons name="grid" size={14} color={T.muted} />
                <Text style={styles.toggleText}>Feed ({nearbyUsers.length})</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={T.purple} />
            <Text style={styles.loadingText}>Scanning nearby vibes...</Text>
          </View>
        ) : viewMode === "radar" ? (
          <View style={styles.radarSection}>
            <View style={styles.radarCardWrap}>
              <LinearGradient colors={["#EEF2FF", "#F5F3FF", "#F8F9FD"]} style={styles.radarCardBg} />
              <View style={styles.radarCircleWrap}>
                <Animated.View style={[styles.pulseRing, ring1Style]} />
                <Animated.View style={[styles.pulseRing, ring2Style]} />

                <View style={styles.radarInnerCircle}>
                  <View style={styles.radarRingMid} />
                  <View style={styles.radarCrosshairH} />
                  <View style={styles.radarCrosshairV} />

                  <Animated.View style={[styles.radarSweepLine, sweepStyle]}>
                    <LinearGradient
                      colors={["rgba(124,58,237,0.45)", "rgba(139,92,246,0.12)", "transparent"]}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>

                  <View style={styles.centerSelfPin}>
                    <View style={styles.pinGlow} />
                    <LinearGradient colors={T.purpleGrad} style={styles.pinCore}>
                      <Text style={{ fontSize: 16 }}>{emoji}</Text>
                    </LinearGradient>
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
                        onPress={() => {
                          setSelectedUser(userItem);
                          openUserProfile(userItem);
                        }}
                        onLongPress={() => setSelectedUser(userItem)}
                        activeOpacity={0.85}
                      >
                        <Image source={{ uri: userItem.avatarUrl }} style={styles.radarAvatarImg} />
                        <View
                          style={[
                            styles.radarAvatarDot,
                            { backgroundColor: isPinged ? T.green : T.purple },
                          ]}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <Text style={styles.radarHint}>Tap an avatar to open profile · live within 1 km</Text>
            </View>

            {selectedUser ? (
              <Animated.View entering={ZoomIn.duration(280)} style={styles.highlightCard}>
                <TouchableOpacity activeOpacity={0.92} onPress={() => openUserProfile(selectedUser)}>
                  <LinearGradient colors={["#FFFFFF", "#F8F5FF"]} style={styles.highlightInner}>
                    <Image source={{ uri: selectedUser.avatarUrl }} style={styles.highlightImg} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.highlightNameRow}>
                        <Text style={styles.highlightName}>{selectedUser.name}</Text>
                        {selectedUser.age ? <Text style={styles.highlightAge}>, {selectedUser.age}</Text> : null}
                        {selectedUser.isVerified && (
                          <Ionicons name="checkmark-circle" size={15} color={T.purple} />
                        )}
                      </View>
                      <Text style={styles.highlightBio} numberOfLines={1}>
                        {selectedUser.bio || selectedUser.vibe}
                      </Text>
                      <View style={styles.badgeRow}>
                        <View style={styles.miniBadge}>
                          <Ionicons name="navigate" size={10} color={T.purple} />
                          <Text style={styles.miniBadgeText}>{selectedUser.distance}</Text>
                        </View>
                        <View style={styles.miniBadge}>
                          <Text style={styles.miniBadgeText}>{selectedUser.vibe}</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={T.purple} />
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.highlightActions}>
                  <TouchableOpacity
                    style={styles.pingBtn}
                    onPress={() => handleSendPing(selectedUser)}
                    activeOpacity={0.88}
                  >
                    {pingedUserIds.includes(selectedUser.id) ? (
                      <View style={[styles.pingBtnSolid, { backgroundColor: "#94A3B8" }]}>
                        <Ionicons name="checkmark-done" size={15} color="#FFF" />
                        <Text style={styles.pingBtnText}>Invited</Text>
                      </View>
                    ) : (
                      <View style={[styles.pingBtnSolid, { backgroundColor: T.green }]}>
                        {sendingPingId === selectedUser.id ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Ionicons name="flash" size={15} color="#FFF" />
                            <Text style={styles.pingBtnText}>Invite to Spot</Text>
                          </>
                        )}
                      </View>
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

        {/* People feed */}
        <View style={styles.gridSection}>
          <View style={styles.gridSecHeader}>
            <Text style={styles.gridSecTitle}>People Near You 🔥</Text>
            <Text style={styles.gridSecCount}>{nearbyUsers.length} live</Text>
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

      <TabBar dark={false} />
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
  ambientTop: {
    position: "absolute",
    top: -50,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  ambientRight: {
    position: "absolute",
    top: 180,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },

  heroWrap: { paddingHorizontal: 16, marginBottom: 12, marginTop: 4 },
  heroCard: {
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
    shadowColor: T.purple,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroShine: {
    position: "absolute",
    top: -40,
    right: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  backOnHero: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  heroEyebrow: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.8,
  },
  heroVenue: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
    letterSpacing: -0.3,
    marginTop: 2,
  },
  heroVibe: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  hudStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hudChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroShareChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34,197,94,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  hudChipText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
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

  loadingWrap: {
    padding: 48,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: T.muted,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
  },

  radarSection: { alignItems: "center", paddingBottom: 8 },
  radarCardWrap: {
    backgroundColor: T.card,
    padding: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: T.purple,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    overflow: "hidden",
    alignItems: "center",
  },
  radarCardBg: { ...StyleSheet.absoluteFillObject },
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
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 2,
    borderColor: "rgba(124,58,237,0.25)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  radarRingMid: {
    position: "absolute",
    width: RADAR_SIZE * 0.55,
    height: RADAR_SIZE * 0.55,
    borderRadius: RADAR_SIZE * 0.275,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.2)",
  },
  radarCrosshairH: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "rgba(124,58,237,0.14)",
  },
  radarCrosshairV: {
    position: "absolute",
    height: "100%",
    width: 1,
    backgroundColor: "rgba(124,58,237,0.14)",
  },
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(124,58,237,0.2)",
  },
  pinCore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFF",
  },
  radarAvatarMarker: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    borderColor: T.purple,
    overflow: "hidden",
    zIndex: 12,
    shadowColor: T.purple,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  radarAvatarSelected: {
    borderColor: T.purpleBright,
    borderWidth: 3,
  },
  radarAvatarPinged: {
    borderColor: T.green,
  },
  radarAvatarImg: { width: "100%", height: "100%" },
  radarAvatarDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  radarHint: {
    marginTop: 12,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },

  highlightCard: {
    width: SCREEN_W - 32,
    borderRadius: 22,
    overflow: "hidden",
    marginTop: 14,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: T.purple,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  highlightInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  highlightImg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#DDD6FE",
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
  pingBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
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
  gridSecCount: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.purple,
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
    height: 230,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: T.purple,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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
    backgroundColor: "rgba(124,58,237,0.9)",
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
    backgroundColor: "rgba(34,197,94,0.95)",
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
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
});
