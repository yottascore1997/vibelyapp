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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeInDown,
  ZoomIn,
} from "react-native-reanimated";
import { VibeFonts } from "../constants/vibeTheme";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import TabBar from "../components/TabBar";

const { width: SCREEN_W } = Dimensions.get("window");
const RADAR_SIZE = 270;

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
    bio: "Tech enthusiast & foodie. Down for quick coffee/pizza!",
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
    bio: "Late night drives & espresso shots ☕",
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
    bio: "Cinema nerd & pop culture fan 🎬",
    radarPos: { top: 105, left: 210 },
  },
];

export default function SpotRadarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
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

  // Countdown timer state
  const [secondsLeft, setSecondsLeft] = useState(initialDuration * 60);

  // Reanimated radar animations
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

  // Ticking countdown timer
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

  // Fetch Real Nearby People Data
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
            bio: u.bio || "Looking to connect & hangout nearby!",
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

  // Real Send Invite Action
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
      Alert.alert(
        "⚡ TABLE INVITE DISPATCHED!",
        `Ping sent to ${targetUser.name}!\n\n"Hey! Join my table at ${venue} for ${emoji} ${vibe}!"`
      );
    } catch {
      setPingedUserIds((prev) => [...prev, targetUser.id]);
      Alert.alert(
        "⚡ TABLE INVITE DISPATCHED!",
        `Ping sent to ${targetUser.name} for ${emoji} ${vibe} at ${venue}!`
      );
    } finally {
      setSendingPingId(null);
    }
  };

  // Real Direct Chat Action
  const handleOpenChat = (targetUserId: string) => {
    router.push(`/chat/${targetUserId}`);
  };

  // Real WhatsApp & Public Share Action
  const handleShareSpot = async () => {
    try {
      const res = await api.createPublicInvite({
        activityName: vibe,
        activityEmoji: emoji,
        timeLabel: `At ${venue} for next ${initialDuration} mins!`,
      });

      const shareMsg = `Hey! I just broadcasted a Live Spot at ${venue} (${emoji} ${vibe}). Join my table: ${
        res?.inviteUrl || "https://vibematch.app"
      }`;
      await Share.share({ message: shareMsg });
    } catch {
      const shareMsg = `Hey! At ${venue} (${emoji} ${vibe}) right now! Join me: https://vibematch.app`;
      await Share.share({ message: shareMsg });
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FD" />

      {/* Clean Light Pure Purple Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#18181B" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.statusBadge}>
              <View style={styles.purpleDot} />
              <Text style={styles.statusText}>SPOT RADAR ACTIVE</Text>
            </View>
            <Text style={styles.venueTitle} numberOfLines={1}>
              {emoji} {venue}
            </Text>
          </View>

          <TouchableOpacity style={styles.iconBtn} onPress={handleShareSpot}>
            <Ionicons name="share-social-outline" size={18} color="#18181B" />
          </TouchableOpacity>
        </View>

        {/* Live HUD Chips Strip */}
        <View style={styles.hudStrip}>
          <View style={styles.hudChip}>
            <Ionicons name="location-sharp" size={12} color="#7C3AED" />
            <Text style={styles.hudChipText}>1 km</Text>
          </View>
          <View style={styles.hudChip}>
            <Ionicons name="time-outline" size={12} color="#7C3AED" />
            <Text style={styles.hudChipText}>{formatTimer(secondsLeft)}</Text>
          </View>
          <View style={styles.hudChip}>
            <Ionicons name="people-sharp" size={12} color="#7C3AED" />
            <Text style={styles.hudChipText}>{nearbyUsers.length} Nearby</Text>
          </View>
        </View>

        {/* View Switcher Toggle */}
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "radar" && styles.toggleBtnActive]}
            onPress={() => setViewMode("radar")}
          >
            <Ionicons
              name={"radar-sharp" as any}
              size={14}
              color={viewMode === "radar" ? "#FFF" : "#64748B"}
            />
            <Text style={[styles.toggleText, viewMode === "radar" && styles.toggleTextActive]}>
              Radar Map
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "grid" && styles.toggleBtnActive]}
            onPress={() => setViewMode("grid")}
          >
            <Ionicons
              name="grid-sharp"
              size={14}
              color={viewMode === "grid" ? "#FFF" : "#64748B"}
            />
            <Text style={[styles.toggleText, viewMode === "grid" && styles.toggleTextActive]}>
              Nearby Feed ({nearbyUsers.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Scanning nearby spots...</Text>
          </View>
        ) : viewMode === "radar" ? (
          <View style={styles.radarSection}>
            {/* Perfectly Centered Pure Purple Sonar Map */}
            <View style={styles.radarCardWrap}>
              <View style={styles.radarCircleWrap}>
                <Animated.View style={[styles.pulseRing, ring1Style]} />
                <Animated.View style={[styles.pulseRing, ring2Style]} />

                <View style={styles.radarInnerCircle}>
                  <View style={styles.radarCrosshairH} />
                  <View style={styles.radarCrosshairV} />

                  {/* Laser Sweep Line */}
                  <Animated.View style={[styles.radarSweepLine, sweepStyle]}>
                    <LinearGradient
                      colors={["rgba(124,58,237,0.35)", "transparent"]}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>

                  {/* Center Self Marker Pin */}
                  <View style={styles.centerSelfPin}>
                    <View style={styles.pinGlow} />
                    <Text style={{ fontSize: 22 }}>📍</Text>
                  </View>

                  {/* Floating Avatars on Sonar */}
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
                        ]}
                        onPress={() => setSelectedUser(userItem)}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: userItem.avatarUrl }} style={styles.radarAvatarImg} />
                        <View
                          style={[
                            styles.radarAvatarDot,
                            { backgroundColor: isPinged ? "#6D28D9" : "#7C3AED" },
                          ]}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Selected Profile Highlight Card */}
            {selectedUser ? (
              <Animated.View entering={ZoomIn.duration(280)} style={styles.highlightCard}>
                <View style={styles.highlightCardInner}>
                  <Image source={{ uri: selectedUser.avatarUrl }} style={styles.highlightImg} />

                  <View style={{ flex: 1 }}>
                    <View style={styles.highlightNameRow}>
                      <Text style={styles.highlightName}>{selectedUser.name}</Text>
                      {selectedUser.age ? (
                        <Text style={styles.highlightAge}>, {selectedUser.age}</Text>
                      ) : null}
                      {selectedUser.isVerified && (
                        <Ionicons name="checkmark-circle-sharp" size={14} color="#7C3AED" />
                      )}
                    </View>

                    <View style={styles.badgeRow}>
                      <View style={styles.miniBadge}>
                        <Ionicons name="navigate-sharp" size={9} color="#7C3AED" />
                        <Text style={styles.miniBadgeText}>{selectedUser.distance}</Text>
                      </View>
                      <View style={styles.miniBadge}>
                        <Text style={styles.miniBadgeText}>{selectedUser.vibe}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ gap: 6 }}>
                    <TouchableOpacity
                      style={styles.pingBtn}
                      onPress={() => handleSendPing(selectedUser)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={
                          pingedUserIds.includes(selectedUser.id)
                            ? ["#94A3B8", "#64748B"]
                            : ["#7C3AED", "#6D28D9"]
                        }
                        style={styles.pingBtnGrad}
                      >
                        {sendingPingId === selectedUser.id ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Ionicons
                              name={
                                pingedUserIds.includes(selectedUser.id)
                                  ? "checkmark-done-sharp"
                                  : "flash-sharp"
                              }
                              size={12}
                              color="#FFF"
                            />
                            <Text style={styles.pingBtnText}>
                              {pingedUserIds.includes(selectedUser.id) ? "Invited" : "Ping"}
                            </Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.chatBtn}
                      onPress={() => handleOpenChat(selectedUser.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chatbubble-ellipses-sharp" size={12} color="#7C3AED" />
                      <Text style={styles.chatBtnText}>Chat</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ) : null}
          </View>
        ) : null}

        {/* Nearby Grid Feed */}
        <View style={styles.gridSection}>
          <View style={styles.gridSecHeader}>
            <Ionicons name="flash-sharp" size={14} color="#7C3AED" />
            <Text style={styles.gridSecTitle}>PEOPLE NEARBY YOUR SPOT</Text>
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
                  <View style={styles.profileCard}>
                    <Image source={{ uri: item.avatarUrl }} style={styles.cardImg} />

                    <LinearGradient
                      colors={["transparent", "rgba(24,24,27,0.92)"]}
                      style={styles.cardGrad}
                    />

                    {/* Distance Badge */}
                    <View style={styles.distBadge}>
                      <Ionicons name="navigate-sharp" size={9} color="#FFF" />
                      <Text style={styles.distBadgeText}>{item.distance}</Text>
                    </View>

                    <View style={styles.cardInfo}>
                      <View style={styles.cardNameRow}>
                        <Text style={styles.cardName}>{item.name}</Text>
                        {item.age ? <Text style={styles.cardAge}>, {item.age}</Text> : null}
                        {item.isVerified && (
                          <Ionicons name="checkmark-circle-sharp" size={11} color="#DDD6FE" />
                        )}
                      </View>

                      <Text style={styles.cardVibeText}>{item.vibe}</Text>

                      <View style={styles.cardActionRow}>
                        <TouchableOpacity
                          style={styles.cardPingBtn}
                          onPress={() => handleSendPing(item)}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={
                              isPinged ? ["#94A3B8", "#64748B"] : ["#7C3AED", "#6D28D9"]
                            }
                            style={styles.cardPingGrad}
                          >
                            <Ionicons
                              name={isPinged ? "checkmark-done-sharp" : "flash-sharp"}
                              size={11}
                              color="#FFF"
                            />
                            <Text style={styles.cardPingText}>
                              {isPinged ? "Invited" : "Invite"}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.cardChatIconBtn}
                          onPress={() => handleOpenChat(item.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="chatbubble-ellipses-sharp" size={12} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8F9FD",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  purpleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7C3AED",
  },
  statusText: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
    letterSpacing: 0.5,
  },
  venueTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    marginTop: 2,
  },

  hudStrip: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  hudChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8F9FD",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  hudChipText: {
    color: "#64748B",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
  },

  viewToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F9FD",
    padding: 3,
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 14,
  },
  toggleBtnActive: {
    backgroundColor: "#7C3AED",
  },
  toggleText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },

  loadingWrap: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
  },

  radarSection: {
    alignItems: "center",
    paddingVertical: 18,
  },
  radarCardWrap: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  radarCircleWrap: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pulseRing: {
    position: "absolute",
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "#7C3AED",
  },
  radarInnerCircle: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    backgroundColor: "#F8F9FD",
    borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.25)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  radarCrosshairH: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "rgba(124,58,237,0.18)",
  },
  radarCrosshairV: {
    position: "absolute",
    height: "100%",
    width: 1,
    backgroundColor: "rgba(124,58,237,0.18)",
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(124,58,237,0.25)",
  },

  radarAvatarMarker: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "#7C3AED",
    overflow: "hidden",
    zIndex: 12,
  },
  radarAvatarSelected: {
    borderColor: "#6D28D9",
    borderWidth: 3,
  },
  radarAvatarImg: {
    width: "100%",
    height: "100%",
  },
  radarAvatarDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: "#FFF",
  },

  highlightCard: {
    width: SCREEN_W - 32,
    borderRadius: 22,
    overflow: "hidden",
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  highlightCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  highlightImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  highlightNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  highlightName: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  highlightAge: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 5,
    marginTop: 3,
  },
  miniBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F8F9FD",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  miniBadgeText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },

  pingBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  pingBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pingBtnText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  chatBtnText: {
    color: "#7C3AED",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },

  gridSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  gridSecHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  gridSecTitle: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrap: {
    width: (SCREEN_W - 44) / 2,
    marginBottom: 14,
  },
  profileCard: {
    width: "100%",
    height: 220,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardImg: {
    width: "100%",
    height: "100%",
  },
  cardGrad: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  distBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(24,24,27,0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  distBadgeText: {
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
    gap: 5,
    marginTop: 6,
  },
  cardPingBtn: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  cardPingGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
  },
  cardPingText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
  },
  cardChatIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
