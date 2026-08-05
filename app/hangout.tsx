import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Alert,
  Image,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PremiumScreen from "../components/vibe/PremiumScreen";
import AppHeader from "../components/vibe/AppHeader";
import HangoutCinematicBackground from "../components/vibe/HangoutCinematicBackground";
import { usePlans } from "../context/PlansContext";
import { useAuth } from "../context/AuthContext";
import { useMatches } from "../context/MatchesContext";
import { VibeFonts } from "../constants/vibeTheme";
import { Spacing } from "../constants/theme";
import { formatFriendlyPlanWhen } from "../constants/plans";
import { clustersForCity, planMatchesCluster, AreaCluster } from "../constants/areaClusters";
import { resolveCityId } from "../constants/mapEvents";
import { api } from "../services/api";
import TabBar from "../components/TabBar";
import { ReelsContent } from "./reels";

function isLiveSpotPlan(p: any): boolean {
  if (!p || p.status === "CANCELLED" || p.status === "COMPLETED") return false;
  const title = String(p.title || "").toLowerCase();
  const isSpotTitle = title.includes("live spot");
  const end = p.endDate ? new Date(p.endDate).getTime() : 0;
  const now = Date.now();
  if (end && end > now) return true;
  if (!isSpotTitle) return false;
  const scheduled = p.scheduledAt ? new Date(p.scheduledAt).getTime() : 0;
  return scheduled > 0 && now - scheduled < 3 * 60 * 60 * 1000;
}

function formatDistanceLabel(plan: any): string | null {
  const d = plan.distanceKm ?? plan.distance;
  if (typeof d === "number" && Number.isFinite(d)) {
    if (d < 1) return `${Math.max(50, Math.round(d * 1000))}m`;
    return `${d.toFixed(1)} km`;
  }
  if (typeof d === "string" && d.trim()) return d;
  return null;
}

function formatUrgency(plan: any): string | null {
  const end = plan.endDate ? new Date(plan.endDate).getTime() : 0;
  if (end) {
    const mins = Math.round((end - Date.now()) / 60000);
    if (mins > 0 && mins <= 120) return `${mins}m left`;
  }
  const when = plan.scheduledAt ? new Date(plan.scheduledAt).getTime() : 0;
  if (when) {
    const mins = Math.round((when - Date.now()) / 60000);
    if (mins >= 0 && mins <= 90) return `in ${mins}m`;
    if (mins < 0 && mins > -60) return "happening now";
  }
  return null;
}

/** Premium dark hangout — multi-accent (purple / mint / gold), not mono-green */
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
  purpleBright: "#C4B5FD",
  softPurple: "rgba(139, 92, 246, 0.16)",
  pink: "#F472B6",
  green: "#34D399",
  yellow: "#FBBF24",
  red: "#F87171",
  blue: "#60A5FA",
  cta: ["#7C3AED", "#A78BFA"] as const,
  promo: ["#6D28D9", "#8B5CF6", "#EC4899"] as const,
};

const MOCK_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
];

const VIBE_ACT_ITEMS = [
  { id: "beer", name: "Beer & Drinks", emoji: "🍺", color: "#EAB308" },
  { id: "coffee", name: "Coffee", emoji: "☕", color: "#8B5E3C" },
  { id: "travel", name: "Travel / Trip", emoji: "✈️", color: "#06B6D4" },
  { id: "food", name: "Food / Lunch", emoji: "🍕", color: "#F97316" },
  { id: "movie", name: "Movie / Cinema", emoji: "🎬", color: "#818CF8" },
  { id: "gaming", name: "Gaming / Play", emoji: "🎮", color: "#34D399" },
  { id: "drive", name: "Late Drive", emoji: "🚗", color: "#3B82F6" },
  { id: "sutta", name: "Sutta & Chill", emoji: "🚬", color: "#6B7280" },
  { id: "drinks", name: "Cocktails 🍸", emoji: "🍸", color: "#EC4899" },
];

const VIBE_TIME_CHIPS = [
  { id: "now", label: "RIGHT NOW ⚡" },
  { id: "today_6pm", label: "TODAY 6 PM 🌆" },
  { id: "tonight", label: "TONIGHT 🍺" },
  { id: "tomorrow", label: "TOMORROW ☀️" },
];

export default function HangoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { myPlans, nearbyPlans, joinPlan, getRequestStatus, refresh } = usePlans();
  const { matches } = useMatches();

  const [hangoutMode, setHangoutMode] = useState<"FRIENDS_PLANS" | "MY_PLANS">("FRIENDS_PLANS");
  const [planVisibility, setPlanVisibility] = useState<"PUBLIC" | "FRIENDS_ONLY">("PUBLIC");
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [selectedVibeAct, setSelectedVibeAct] = useState("beer");
  const [selectedTimeChip, setSelectedTimeChip] = useState("now");
  const [pinging, setPinging] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [myEnergy, setMyEnergy] = useState<"LESSGO" | "MAYBE" | "OFF_GRID">("LESSGO");
  const [joinTargetId, setJoinTargetId] = useState<string | null>(null);
  const [joinRemark, setJoinRemark] = useState("");
  const [joinSending, setJoinSending] = useState(false);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  const cityId = resolveCityId((user as any)?.city) || "nagpur";
  const areaClusters = useMemo(() => clustersForCity(cityId), [cityId]);

  const displayFriends = useMemo(() => {
    if (matches && matches.length > 0) return matches;
    return [
      { id: "demo-1", name: "Alex", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", energy: "LESSGO" },
      { id: "demo-2", name: "Sarah", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", energy: "MAYBE" },
      { id: "demo-3", name: "Priya", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop", energy: "LESSGO" },
      { id: "demo-4", name: "Rahul", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", energy: "OFF_GRID" },
    ];
  }, [matches]);

  useEffect(() => {
    if (displayFriends.length > 0 && !selectedFriend) {
      setSelectedFriend(displayFriends[0]);
    }
  }, [displayFriends, selectedFriend]);

  const loadInvites = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getInvites(user.id);
      if (res && Array.isArray(res)) {
        setInvites(res);
      }
    } catch (err) {
      console.error("Load invites error:", err);
    }
  }, [user]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const handleUpdateEnergy = async (energy: "LESSGO" | "MAYBE" | "OFF_GRID") => {
    setMyEnergy(energy);
    try {
      await api.updateSocialStatus({
        energy,
        freeNow: energy === "LESSGO",
        notifyMatches: energy === "LESSGO",
      });
    } catch {
      // ignore
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      await api.respondToInvite(inviteId, "accepted");
      Alert.alert("Invite Accepted! 🎉", "You matched up for this move!");
      loadInvites();
    } catch {
      Alert.alert("Error", "Could not accept invite.");
    }
  };

  const handleInstantPing = async (actName?: string, actEmoji?: string, timeText?: string) => {
    if (!user || !selectedFriend || pinging) return;
    if (String(selectedFriend.id).startsWith("demo-")) {
      Alert.alert("Add matches first", "Match with people to send real instant pings.");
      return;
    }
    const finalActObj = VIBE_ACT_ITEMS.find((a) => a.id === selectedVibeAct) || VIBE_ACT_ITEMS[0];
    const finalActName = actName || finalActObj.name;
    const finalActEmoji = actEmoji || finalActObj.emoji;
    const finalTimeText = timeText || VIBE_TIME_CHIPS.find((t) => t.id === selectedTimeChip)?.label || "RIGHT NOW ⚡";

    setPinging(true);
    try {
      const res = await api.sendInvite({
        receiverId: selectedFriend.id,
        activityName: finalActName,
        activityEmoji: finalActEmoji,
        timeLabel: finalTimeText,
      });
      if (res) {
        Alert.alert(
          "Vibe ping sent!",
          `Ping sent to ${selectedFriend.name.split(" ")[0]} for ${finalActEmoji} ${finalActName} (${finalTimeText})!`
        );
      } else {
        Alert.alert(
          "Vibe ping sent!",
          `Ping sent to ${selectedFriend.name.split(" ")[0]} for ${finalActEmoji} ${finalActName} (${finalTimeText})!`
        );
      }
    } catch {
      Alert.alert(
        "Could not send",
        `Try again — ping to ${selectedFriend.name.split(" ")[0]} failed.`
      );
    } finally {
      setPinging(false);
    }
  };

  const openJoinRequest = (planId: string) => {
    setJoinTargetId(planId);
    setJoinRemark("");
  };

  const submitJoinRequest = async () => {
    if (!joinTargetId || joinSending) return;
    setJoinSending(true);
    try {
      await joinPlan(joinTargetId, joinRemark.trim() || undefined);
      setJoinTargetId(null);
      setJoinRemark("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Request failed");
    } finally {
      setJoinSending(false);
    }
  };

  const handleRequestJoin = (planId: string) => openJoinRequest(planId);

  const filteredPlans = useMemo(() => {
    if (planVisibility === "FRIENDS_ONLY") {
      return nearbyPlans.filter((p) => p.isPrivate || p.visibility === "FRIENDS");
    }
    return nearbyPlans.filter((p) => !p.isPrivate && p.visibility !== "FRIENDS");
  }, [nearbyPlans, planVisibility]);

  const othersPlans = useMemo(() => {
    const mineIds = new Set(myPlans.map((p) => p.id));
    let list = filteredPlans.filter(
      (p) => !mineIds.has(p.id) && p.creatorId !== user?.id
    );
    if (selectedClusterId) {
      const cluster = areaClusters.find((c) => c.id === selectedClusterId);
      if (cluster) list = list.filter((p) => planMatchesCluster(p, cluster));
    }
    return list;
  }, [filteredPlans, myPlans, user?.id, selectedClusterId, areaClusters]);

  const liveSpots = useMemo(() => {
    const all = [...nearbyPlans, ...myPlans].filter(
      (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
    );
    return all.filter(isLiveSpotPlan).slice(0, 12);
  }, [nearbyPlans, myPlans]);

  const lessgoNearbyCount = useMemo(() => {
    return displayFriends.filter(
      (f: any) => f.energy === "LESSGO" || f.freeNow
    ).length;
  }, [displayFriends]);

  return (
    <View style={styles.screenRoot}>
      <HangoutCinematicBackground />
      <StatusBar barStyle="light-content" backgroundColor="#070A14" />
      <View style={styles.screenForeground}>
      <AppHeader variant="dark" tagline="Post & join plans · Real Moves" />

      <PremiumScreen
        heroImage=""
        title=""
        hideHeader={true}
        lightMode={true}
        transparentChrome={true}
        contentStyle={{ paddingHorizontal: 0, paddingTop: 0, backgroundColor: "transparent", paddingBottom: 120 + insets.bottom }}
      >
        <View style={{ height: insets.top + 4 }} />

        {/* Clear top: one headline + energy + create */}
        <View style={styles.sloganHeaderWrap}>
          <Text style={styles.sloganTitle}>Who&apos;s down?</Text>
          <Text style={styles.hangSubline}>Pick energy · join a plan · or start one</Text>
        </View>

        {/* Social Energy Selector */}
        <View style={styles.socialEnergyCard}>
          <Text style={styles.socialEnergyTitle}>Your energy</Text>
          <View style={styles.orbsContainer}>
            {/* Lessgo */}
            <TouchableOpacity
              style={styles.orbWrapper}
              activeOpacity={0.8}
              onPress={() => handleUpdateEnergy("LESSGO")}
            >
              <View style={[styles.orbSphere, styles.orbSphereGreen, myEnergy === "LESSGO" && styles.orbActiveGreen]}>
                <LinearGradient
                  colors={["#4ADE80", "#22C55E", "#15803D"]}
                  start={{ x: 0.2, y: 0.2 }}
                  end={{ x: 0.8, y: 0.8 }}
                  style={styles.orbGrad}
                >
                  <View style={styles.orbGlint} />
                </LinearGradient>
              </View>
              <Text style={[styles.orbLabel, { color: "#6EE7B7" }]}>Lessgo</Text>
            </TouchableOpacity>

            {/* Maybe */}
            <TouchableOpacity
              style={styles.orbWrapper}
              activeOpacity={0.8}
              onPress={() => handleUpdateEnergy("MAYBE")}
            >
              <View style={[styles.orbSphere, styles.orbSphereYellow, myEnergy === "MAYBE" && styles.orbActiveYellow]}>
                <LinearGradient
                  colors={["#FDE047", "#F59E0B", "#B45309"]}
                  start={{ x: 0.2, y: 0.2 }}
                  end={{ x: 0.8, y: 0.8 }}
                  style={styles.orbGrad}
                >
                  <View style={styles.orbGlint} />
                </LinearGradient>
              </View>
              <Text style={[styles.orbLabel, { color: "#FBBF24" }]}>Maybe</Text>
            </TouchableOpacity>

            {/* Off grid */}
            <TouchableOpacity
              style={styles.orbWrapper}
              activeOpacity={0.8}
              onPress={() => handleUpdateEnergy("OFF_GRID")}
            >
              <View style={[styles.orbSphere, styles.orbSphereRed, myEnergy === "OFF_GRID" && styles.orbActiveRed]}>
                <LinearGradient
                  colors={["#FCA5A5", "#EF4444", "#991B1B"]}
                  start={{ x: 0.2, y: 0.2 }}
                  end={{ x: 0.8, y: 0.8 }}
                  style={styles.orbGrad}
                >
                  <View style={styles.orbGlint} />
                </LinearGradient>
              </View>
              <Text style={[styles.orbLabel, { color: "#FCA5A5" }]}>Off grid</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instant Ping — high-intent path */}
        <View style={styles.instantPingCard}>
          <View style={styles.instantPingHead}>
            <Text style={styles.instantPingTitle}>Instant ping</Text>
            <Text style={styles.instantPingSub}>Pick a friend · vibe · send</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendScroll}>
            {displayFriends.map((f: any) => {
              const active = selectedFriend?.id === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.friendChip, active && styles.friendChipActive]}
                  onPress={() => setSelectedFriend(f)}
                  activeOpacity={0.88}
                >
                  <Image
                    source={{
                      uri:
                        f.avatarUrl ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop",
                    }}
                    style={styles.friendAvatar}
                  />
                  <Text style={[styles.friendName, active && styles.friendNameActive]} numberOfLines={1}>
                    {String(f.name || "Friend").split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vibeActScroll}>
            {VIBE_ACT_ITEMS.map((act) => {
              const active = selectedVibeAct === act.id;
              return (
                <TouchableOpacity
                  key={act.id}
                  style={[styles.vibeActChip, active && { borderColor: act.color, backgroundColor: `${act.color}22` }]}
                  onPress={() => setSelectedVibeAct(act.id)}
                >
                  <Text style={styles.vibeActEmoji}>{act.emoji}</Text>
                  <Text style={[styles.vibeActName, active && { color: act.color }]} numberOfLines={1}>
                    {act.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeChipScroll}>
            {VIBE_TIME_CHIPS.map((t) => {
              const active = selectedTimeChip === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.timeChipMini, active && styles.timeChipMiniActive]}
                  onPress={() => setSelectedTimeChip(t.id)}
                >
                  <Text style={[styles.timeChipMiniText, active && styles.timeChipMiniTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={styles.pingSendBtn}
            onPress={() => handleInstantPing()}
            disabled={pinging || !selectedFriend}
            activeOpacity={0.9}
          >
            <LinearGradient colors={[...T.cta]} style={styles.pingSendGrad}>
              {pinging ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="flash" size={16} color="#fff" />
                  <Text style={styles.pingSendText}>
                    Ping {selectedFriend ? String(selectedFriend.name).split(" ")[0] : "friend"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Live Spots nearby */}
        {liveSpots.length > 0 ? (
          <View style={styles.liveSpotsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Live Spots nearby</Text>
              <Pressable onPress={() => router.push("/live-map")} style={styles.refreshRow}>
                <Ionicons name="map" size={14} color={T.purple} />
                <Text style={styles.seeAllText}>Map</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
              {liveSpots.map((spot) => {
                const left = formatUrgency(spot);
                return (
                  <TouchableOpacity
                    key={spot.id}
                    style={styles.liveSpotCard}
                    onPress={() =>
                      router.push({ pathname: "/plan-details", params: { id: spot.id } })
                    }
                    activeOpacity={0.88}
                  >
                    <View style={styles.liveSpotDot} />
                    <Text style={styles.liveSpotTitle} numberOfLines={1}>
                      {spot.title}
                    </Text>
                    <Text style={styles.liveSpotMeta} numberOfLines={1}>
                      {spot.location || "Nearby"}
                      {left ? ` · ${left}` : ""}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <Pressable
          onPress={() => router.push("/create-plan")}
          style={styles.createPlanCtaWrap}
        >
          <LinearGradient
            colors={[...T.cta]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createPlanCta}
          >
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.createPlanCtaText}>Create a plan</Text>
          </LinearGradient>
        </Pressable>

        {/* 2-Tab: Friends Plans | My Plans */}
        <View style={styles.modeSwitcherTrack}>
          <Pressable
            onPress={() => setHangoutMode("FRIENDS_PLANS")}
            style={[
              styles.modeSwitcherBtn,
              hangoutMode === "FRIENDS_PLANS" && styles.modeBtnActivePublic,
            ]}
          >
            <Ionicons
              name="people"
              size={13}
              color={hangoutMode === "FRIENDS_PLANS" ? "#FFFFFF" : "#A8B4C8"}
            />
            <Text
              style={[
                styles.modeSwitcherText,
                hangoutMode === "FRIENDS_PLANS" && styles.modeTextActiveWhite,
              ]}
            >
              Friends Plans
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setHangoutMode("MY_PLANS")}
            style={[
              styles.modeSwitcherBtn,
              hangoutMode === "MY_PLANS" && styles.modeBtnActivePurple,
            ]}
          >
            <Ionicons
              name="calendar"
              size={13}
              color={hangoutMode === "MY_PLANS" ? "#FFFFFF" : "#A8B4C8"}
            />
            <Text
              style={[
                styles.modeSwitcherText,
                hangoutMode === "MY_PLANS" && styles.modeTextActiveWhite,
              ]}
            >
              My Plans
            </Text>
          </Pressable>
        </View>

        {hangoutMode === "FRIENDS_PLANS" ? (
          <View>
            {/* Public vs Friends-only inside one place */}
            <View style={styles.visibilityToggle}>
              <Pressable
                onPress={() => setPlanVisibility("PUBLIC")}
                style={[
                  styles.visibilityChip,
                  planVisibility === "PUBLIC" && styles.visibilityChipActive,
                ]}
              >
                <Ionicons
                  name="earth"
                  size={13}
                  color={planVisibility === "PUBLIC" ? "#34D399" : T.muted}
                />
                <Text
                  style={[
                    styles.visibilityChipText,
                    planVisibility === "PUBLIC" && styles.visibilityChipTextActive,
                  ]}
                >
                  Public
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPlanVisibility("FRIENDS_ONLY")}
                style={[
                  styles.visibilityChip,
                  planVisibility === "FRIENDS_ONLY" && styles.visibilityChipActiveFriends,
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={13}
                  color={planVisibility === "FRIENDS_ONLY" ? "#F472B6" : T.muted}
                />
                <Text
                  style={[
                    styles.visibilityChipText,
                    planVisibility === "FRIENDS_ONLY" && styles.visibilityChipTextActiveFriends,
                  ]}
                >
                  Closed · Friends only
                </Text>
              </Pressable>
            </View>

            {planVisibility === "FRIENDS_ONLY" ? (
              <View style={{ flex: 1, minHeight: 650, marginTop: 4 }}>
                <ReelsContent embed={true} initialTab="invite" hideSegTabs={true} />
              </View>
            ) : (
              <View>
            {/* Plans near you — primary list, no competing layers */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Plans near you</Text>
              <Pressable onPress={refresh} style={styles.refreshRow}>
                <Ionicons name="refresh" size={14} color={T.purple} />
                <Text style={styles.seeAllText}>Refresh</Text>
              </Pressable>
            </View>

            {lessgoNearbyCount > 0 ? (
              <Text style={styles.lessgoHint}>
                {lessgoNearbyCount} friend{lessgoNearbyCount === 1 ? "" : "s"} Lessgo nearby
              </Text>
            ) : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.clusterRow}
            >
              <TouchableOpacity
                style={[styles.clusterChip, !selectedClusterId && styles.clusterChipActive]}
                onPress={() => setSelectedClusterId(null)}
              >
                <Text style={[styles.clusterChipText, !selectedClusterId && styles.clusterChipTextActive]}>
                  All areas
                </Text>
              </TouchableOpacity>
              {areaClusters.map((c: AreaCluster) => {
                const active = selectedClusterId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.clusterChip, active && styles.clusterChipActive]}
                    onPress={() => setSelectedClusterId(active ? null : c.id)}
                  >
                    <Text style={[styles.clusterChipText, active && styles.clusterChipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.plansListContainer}>
              {othersPlans.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>🌙</Text>
                  <Text style={styles.emptyTitle}>No plans nearby</Text>
                  <Text style={styles.emptySub}>
                    Be the first — create a plan and invite others.
                  </Text>
                </View>
              ) : (
                othersPlans.map((plan) => (
                  <MockupPlanCard
                    key={plan.id}
                    plan={plan}
                    isMine={false}
                    requestStatus={getRequestStatus(plan.id)}
                    onJoin={() => handleRequestJoin(plan.id)}
                  />
                ))
              )}
            </View>
              </View>
            )}
          </View>
        ) : (
          /* My Plans — your hosted / joined hangouts */
          <View style={{ flex: 1, marginTop: 8, minHeight: 400 }}>
            <View style={[styles.myPlansHeaderRow, { paddingHorizontal: 16 }]}>
              <View>
                <Text style={styles.myPlansHeading}>Your hangouts</Text>
                <Text style={styles.myPlansSub}>
                  Plans you host, joined, or requested
                </Text>
              </View>
              <Pressable onPress={refresh} style={styles.refreshRow}>
                <Ionicons name="refresh" size={14} color={T.purple} />
                <Text style={styles.seeAllText}>Refresh</Text>
              </Pressable>
            </View>
            {myPlans.length === 0 ? (
              <View style={[styles.myPlansEmpty, { marginHorizontal: 16 }]}>
                <Ionicons name="calendar-outline" size={36} color={T.faint} />
                <Text style={styles.myPlansEmptyTitle}>No plans yet</Text>
                <Text style={styles.myPlansEmptySub}>
                  Create a hangout above, or join one from Friends Plans.
                </Text>
              </View>
            ) : (
              <View style={styles.plansListContainer}>
                {myPlans.map((plan) => (
                  <MockupPlanCard
                    key={plan.id}
                    plan={plan}
                    isMine={plan.creatorId === user?.id}
                    requestStatus={getRequestStatus(plan.id)}
                    onJoin={() => handleRequestJoin(plan.id)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 16 }} />
      </PremiumScreen>

      {/* Join request — remark sheet */}
      <Modal
        visible={!!joinTargetId}
        transparent
        animationType="fade"
        onRequestClose={() => !joinSending && setJoinTargetId(null)}
      >
        <Pressable
          style={styles.joinModalOverlay}
          onPress={() => !joinSending && setJoinTargetId(null)}
        >
          <Pressable style={styles.joinModalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.joinModalTitle}>Request to join</Text>
            <Text style={styles.joinModalSub}>
              Add a short note the host can read (optional)
            </Text>
            <TextInput
              style={styles.joinModalInput}
              value={joinRemark}
              onChangeText={setJoinRemark}
              placeholder="e.g. I can bring snacks · free after 7"
              placeholderTextColor="rgba(255,255,255,0.35)"
              multiline
              maxLength={160}
              editable={!joinSending}
            />
            <Pressable
              style={[styles.joinModalBtn, joinSending && { opacity: 0.7 }]}
              onPress={submitJoinRequest}
              disabled={joinSending}
            >
              <LinearGradient
                colors={[...T.cta]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.joinModalBtnGrad}
              >
                {joinSending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.joinModalBtnText}>Send request</Text>
                )}
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => setJoinTargetId(null)}
              disabled={joinSending}
              style={{ alignItems: "center", paddingTop: 8 }}
            >
              <Text style={styles.joinModalCancel}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <TabBar dark={true} />
      </View>
    </View>
  );
}

function MockupPlanCard({
  plan,
  onJoin,
  requestStatus,
  isMine,
}: {
  plan: any;
  onJoin: () => void;
  requestStatus: string;
  isMine: boolean;
}) {
  const router = useRouter();
  const spotsLeft = Math.max(0, (plan.maxParticipants || 4) - (plan.going || 1));
  const categoryTag = getCategoryTagForTitle(plan.title);
  const whenText = formatFriendlyPlanWhen({
    scheduledAt: plan.scheduledAt,
    timeLabel: plan.timeLabel,
    time: plan.time,
  });
  const distLabel = formatDistanceLabel(plan);
  const urgency = formatUrgency(plan);
  const realAvatars = (plan.participants || [])
    .map((p: any) => p.avatarUrl)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/plan-details", params: { id: plan.id } })
      }
      style={styles.heroPlanCard}
    >
      <View style={styles.cardImageWrap}>
        <Image
          source={{
            uri:
              plan.imageUrl ||
              "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&h=400&fit=crop",
          }}
          style={styles.cardHeroImage}
        />

        <View style={styles.cardBadgeRow}>
          <View style={styles.categoryBadgePill}>
            <Text style={styles.categoryBadgeEmoji}>{categoryTag.emoji}</Text>
            <Text style={styles.categoryBadgeText}>{categoryTag.label}</Text>
          </View>
          {urgency ? (
            <View style={styles.urgencyPill}>
              <Text style={styles.urgencyPillText}>{urgency}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardWhenPill}>
          <Ionicons name="time-outline" size={12} color="#FDE68A" />
          <Text style={styles.cardWhenPillText}>{whenText}</Text>
        </View>
      </View>

      <View style={styles.cardBottomInfo}>
        <View style={styles.cardHeaderLine}>
          <Text style={styles.cardTitleText} numberOfLines={1}>
            {plan.title}
          </Text>
          {plan.creatorName ? (
            <Text style={styles.verifiedHostText} numberOfLines={1}>
              {String(plan.creatorName).split(" ")[0]}
            </Text>
          ) : null}
        </View>

        <View style={styles.cardMetaLine}>
          <View style={styles.spotsRow}>
            <LinearGradient
              colors={spotsLeft <= 2 ? ["#F59E0B", "#EF4444"] : ["#8B5CF6", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.spotsCountBadge}
            >
              <Text style={styles.spotsCountText}>{spotsLeft}</Text>
            </LinearGradient>
            <Text style={styles.spotsLabelText}>
              {spotsLeft === 1 ? "spot left" : "spots left"}
              {distLabel ? ` · ${distLabel}` : ""}
            </Text>
          </View>

          <View style={styles.attendingRow}>
            {(realAvatars.length > 0 ? realAvatars : MOCK_AVATARS.slice(0, 2)).map(
              (url: string, idx: number) => (
                <Image
                  key={`${url}-${idx}`}
                  source={{ uri: url }}
                  style={[styles.attendingAvatar, { marginLeft: idx === 0 ? 0 : -8 }]}
                />
              )
            )}
            <View style={styles.moreAvatarBadge}>
              <Text style={styles.moreAvatarText}>{plan.going || 1}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooterRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1 }}>
            <Ionicons name="location" size={12} color="#A78BFA" />
            <Text style={styles.cardTimeText} numberOfLines={1}>
              {whenText}
              {plan.location ? ` · ${plan.location}` : ""}
            </Text>
          </View>

          {isMine ? (
            <View style={[styles.joinBtnPill, { backgroundColor: T.purple }]}>
              <Text style={styles.joinBtnText}>Mine</Text>
            </View>
          ) : requestStatus === "none" ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onJoin();
              }}
            >
              <LinearGradient
                colors={[...T.cta]}
                style={styles.joinBtnPill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.joinBtnText}>Request</Text>
              </LinearGradient>
            </Pressable>
          ) : requestStatus === "pending" ? (
            <View style={[styles.joinBtnPill, { backgroundColor: "#EAB308" }]}>
              <Text style={styles.joinBtnText}>Pending</Text>
            </View>
          ) : (
            <View style={[styles.joinBtnPill, { backgroundColor: "#22C55E" }]}>
              <Text style={styles.joinBtnText}>Joined</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function getCategoryTagForTitle(title?: string) {
  const n = (title || "").toLowerCase();
  if (n.includes("coffee") || n.includes("cafe")) return { emoji: "☕", label: "Coffee Chat" };
  if (n.includes("food") || n.includes("dinner") || n.includes("lunch")) return { emoji: "🍔", label: "Foodie Vibe" };
  if (n.includes("movie") || n.includes("film")) return { emoji: "🍿", label: "Cinema Night" };
  if (n.includes("sport") || n.includes("gym") || n.includes("run")) return { emoji: "🏃", label: "Fitness Vibe" };
  if (n.includes("board") || n.includes("game")) return { emoji: "🎲", label: "Board Games" };
  return { emoji: "🎯", label: "Social Move" };
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: "#070A14",
  },
  screenForeground: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  myPlansHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  myPlansHeading: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    marginBottom: 4,
  },
  myPlansSub: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },
  myPlansEmpty: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
  },
  myPlansEmptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  myPlansEmptySub: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  ambientTop: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  ambientBottom: {
    position: "absolute",
    bottom: 120,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  ambientOrbCool: {
    position: "absolute",
    top: "42%",
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(125, 211, 252, 0.1)",
  },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 10,
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    height: 48,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: T.ink,
    fontFamily: VibeFonts.medium,
    paddingVertical: 8,
  },
  searchFilterBtn: {
    width: 48,
    height: 48,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  filtersScroll: {
    marginBottom: 16,
  },
  filterPillActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 8,
    backgroundColor: T.purple,
    shadowColor: T.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  filterPillInactive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  filterTextInactive: {
    color: T.muted,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
  },

  sloganHeaderWrap: {
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 12,
  },
  sloganTitle: {
    fontSize: 26,
    fontFamily: VibeFonts.extraBold,
    color: "#F8FAFC",
    lineHeight: 32,
    letterSpacing: -0.6,
  },
  hangSubline: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },
  createPlanCtaWrap: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    overflow: "hidden",
  },
  createPlanCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  createPlanCtaText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
  },
  instantPingCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: T.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
  },
  instantPingHead: { marginBottom: 10 },
  instantPingTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  instantPingSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 2,
  },
  friendScroll: { marginBottom: 10 },
  friendChip: {
    alignItems: "center",
    marginRight: 12,
    width: 64,
    opacity: 0.7,
  },
  friendChipActive: { opacity: 1 },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: T.purple,
  },
  friendName: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
  },
  friendNameActive: { color: T.purpleBright, fontFamily: VibeFonts.bold },
  vibeActScroll: { marginBottom: 8 },
  vibeActChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    marginRight: 8,
    backgroundColor: "rgba(15,22,38,0.9)",
    maxWidth: 140,
  },
  vibeActEmoji: { fontSize: 14 },
  vibeActName: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: T.muted,
  },
  timeChipScroll: { marginBottom: 12 },
  timeChipMini: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(15,22,38,0.9)",
    borderWidth: 1,
    borderColor: T.border,
    marginRight: 8,
  },
  timeChipMiniActive: {
    backgroundColor: T.purpleDeep,
    borderColor: T.purple,
  },
  timeChipMiniText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.muted,
  },
  timeChipMiniTextActive: { color: "#fff" },
  pingSendBtn: { borderRadius: 14, overflow: "hidden" },
  pingSendGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  pingSendText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
  },
  liveSpotsSection: { marginBottom: 12 },
  liveSpotCard: {
    width: 168,
    backgroundColor: T.cardElevated,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.35)",
  },
  liveSpotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.green,
    marginBottom: 8,
  },
  liveSpotTitle: {
    color: T.ink,
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
  },
  liveSpotMeta: {
    color: T.muted,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    marginTop: 4,
  },
  lessgoHint: {
    marginHorizontal: 16,
    marginBottom: 8,
    color: T.green,
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
  },
  clusterRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 10,
  },
  clusterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(15,22,38,0.9)",
    borderWidth: 1,
    borderColor: T.border,
  },
  clusterChipActive: {
    backgroundColor: T.softPurple,
    borderColor: T.purple,
  },
  clusterChipText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: T.muted,
  },
  clusterChipTextActive: { color: T.purpleBright },
  joinModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(4,6,14,0.72)",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  joinModalSheet: {
    backgroundColor: "#121826",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    gap: 10,
  },
  joinModalTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
  },
  joinModalSub: {
    color: T.muted,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    marginBottom: 4,
  },
  joinModalInput: {
    minHeight: 80,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    color: "#fff",
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    textAlignVertical: "top",
  },
  joinModalBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
  },
  joinModalBtnGrad: {
    paddingVertical: 14,
    alignItems: "center",
  },
  joinModalBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
  },
  joinModalCancel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontFamily: VibeFonts.medium,
  },
  cardWhenPill: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(8,10,18,0.78)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
  },
  cardWhenPillText: {
    color: "#FDE68A",
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
  },

  heroPlanCard: {
    backgroundColor: T.card,
    borderRadius: 28,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 5,
  },
  cardImageWrap: {
    width: "100%",
    height: 195,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
  },
  cardHeroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardBadgeRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryBadgeEmoji: {
    fontSize: 12,
  },
  categoryBadgeText: {
    color: "#1E1B4B",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
  urgencyPill: {
    backgroundColor: "rgba(239,68,68,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  urgencyPillText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
  },
  floatingHeartBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  floatingClapBadge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  floatingSparkleBadge: {
    position: "absolute",
    top: 52,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(139, 92, 246, 0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBottomInfo: {
    backgroundColor: "rgba(14, 20, 36, 0.95)",
    borderRadius: 22,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardHeaderLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitleText: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#F8FAFC",
    flex: 1,
    marginRight: 6,
  },
  verifiedHostBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(96, 165, 250, 0.16)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedHostText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#93C5FD",
  },
  cardMetaLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  spotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  spotsCountBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  spotsCountText: {
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
  },
  spotsLabelText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#C4B5FD",
  },
  attendingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  attendingAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#1E2438",
  },
  moreAvatarBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
    borderWidth: 2,
    borderColor: "#1E2438",
  },
  moreAvatarText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.14)",
    paddingTop: 10,
  },
  cardTimeText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },
  joinBtnPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  joinBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },

  socialEnergyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
  },
  socialEnergyTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: "#F8FAFC",
    textAlign: "center",
    marginBottom: 14,
  },
  orbsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  orbWrapper: {
    alignItems: "center",
    gap: 6,
  },
  orbSphere: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  orbSphereGreen: { shadowColor: "#22C55E" },
  orbSphereYellow: { shadowColor: "#F59E0B" },
  orbSphereRed: { shadowColor: "#EF4444" },
  orbActiveGreen: { borderWidth: 2, borderColor: "#4ADE80", transform: [{ scale: 1.08 }] },
  orbActiveYellow: { borderWidth: 2, borderColor: "#FDE047", transform: [{ scale: 1.08 }] },
  orbActiveRed: { borderWidth: 2, borderColor: "#FCA5A5", transform: [{ scale: 1.08 }] },
  orbGrad: { width: "100%", height: "100%", borderRadius: 27, padding: 5 },
  orbGlint: { width: 12, height: 12, borderRadius: 6, backgroundColor: "rgba(255, 255, 255, 0.65)", marginLeft: 4, marginTop: 2 },
  orbLabel: { fontSize: 11, fontFamily: VibeFonts.bold },

  modeSwitcherTrack: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "rgba(15, 22, 38, 0.9)",
    borderRadius: 20,
    padding: 4,
    flexDirection: "row",
    gap: 4,
    borderWidth: 1,
    borderColor: T.border,
  },
  visibilityToggle: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    gap: 8,
  },
  visibilityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(20, 28, 48, 0.9)",
    borderWidth: 1,
    borderColor: T.border,
  },
  visibilityChipActive: {
    backgroundColor: "rgba(52, 211, 153, 0.14)",
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  visibilityChipActiveFriends: {
    backgroundColor: "rgba(244, 114, 182, 0.14)",
    borderColor: "rgba(244, 114, 182, 0.38)",
  },
  visibilityChipText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.muted,
  },
  visibilityChipTextActive: {
    color: "#6EE7B7",
  },
  visibilityChipTextActiveFriends: {
    color: "#F9A8D4",
  },
  modeSwitcherBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    backgroundColor: "transparent",
  },
  modeBtnActivePublic: {
    backgroundColor: "#7C3AED",
    shadowColor: "#A78BFA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  modeBtnActivePink: {
    backgroundColor: "#DB2777",
    shadowColor: "#F472B6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modeBtnActivePurple: {
    backgroundColor: "#6D28D9",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modeSwitcherText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#94A3B8",
  },
  modeTextActiveWhite: {
    color: "#FFFFFF",
    fontFamily: VibeFonts.extraBold,
  },

  heroCardContainer: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  heroCard: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 6,
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 132,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.32)",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  heroDecorBlob: {
    position: "absolute",
    right: -20,
    top: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(139, 92, 246, 0.12)",
  },
  heroStar1: {
    position: "absolute",
    top: 10,
    right: 60,
    color: "rgba(251, 191, 36, 0.55)",
    fontSize: 9,
    zIndex: 1,
  },
  heroStar2: {
    position: "absolute",
    top: 34,
    right: 24,
    color: "rgba(244, 114, 182, 0.4)",
    fontSize: 8,
    zIndex: 1,
  },
  heroStar3: {
    position: "absolute",
    bottom: 18,
    right: 72,
    color: "rgba(167, 139, 250, 0.4)",
    fontSize: 7,
    zIndex: 1,
  },
  heroCardLeft: {
    flex: 1.55,
    justifyContent: "center",
    zIndex: 3,
    paddingRight: 6,
    maxWidth: "64%",
  },
  luxePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 5,
  },
  luxePillText: {
    fontSize: 8,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  heroCardTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  heroCardSubtitle: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 4,
    marginBottom: 10,
    lineHeight: 15,
    paddingRight: 4,
  },
  heroCardBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: T.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  heroCardBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  heroCardRight: {
    width: 100,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    zIndex: 1,
  },
  heroCardImage: {
    width: 100,
    height: 118,
    marginRight: -2,
    marginBottom: -8,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#F1F5F9",
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#C4B5FD",
  },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hScroll: {
    marginBottom: 14,
  },

  liveVibeTag: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveVibeTagText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.5,
  },
  popCardWrap: {
    width: 125,
    marginRight: 12,
    borderRadius: 22,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  popCardInner: {
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  popTagPill: {
    backgroundColor: "rgba(7, 10, 20, 0.45)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 8,
  },
  popTagText: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
  },
  popIconSphere: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  popEmojiText: {
    fontSize: 24,
  },
  popActivityTitle: {
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    color: "#F8FAFC",
    textAlign: "center",
    marginBottom: 4,
  },
  popCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 8,
  },
  popCountText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
  popAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  popAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  popAvatarMore: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  popAvatarMoreText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontFamily: VibeFonts.bold,
  },

  activityCard: {
    width: 96,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginRight: 10,
    alignItems: "center",
    shadowColor: "#1A1F36",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityEmoji: {
    fontSize: 28,
    marginBottom: 3,
  },
  activityName: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.ink,
    textAlign: "center",
  },
  activityCount: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 1,
    marginBottom: 5,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  smallAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: "#fff",
  },
  smallAvatarTextWrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDE7FF",
  },
  smallAvatarText: {
    fontSize: 8,
    fontFamily: VibeFonts.bold,
    color: T.purple,
  },

  plansListContainer: {
    marginBottom: 18,
  },

  emptyCard: {
    marginHorizontal: 16,
    padding: Spacing.xl,
    alignItems: "center",
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyEmoji: { fontSize: 36, marginBottom: 6 },
  emptyTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 4,
    textAlign: "center",
  },
  emptyCta: {
    marginTop: 14,
    backgroundColor: T.purple,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyCtaText: {
    color: "#fff",
    fontFamily: VibeFonts.bold,
    fontSize: 12,
  },

  venueCard: {
    width: 200,
    height: 130,
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#ddd",
  },
  venueImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  venueOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  venueDistance: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(7, 10, 20, 0.72)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.35)",
  },
  venueDistanceText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#FDE68A",
  },
  venueTextWrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  venueName: {
    color: "#fff",
    fontSize: 15,
    fontFamily: VibeFonts.bold,
  },
  venuePlans: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    marginTop: 2,
  },

  bottomPromoContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  bottomPromo: {
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: T.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
  bottomPromoIconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomPromoEmoji: {
    fontSize: 30,
  },
  bottomPromoEmojiBadge: {
    position: "absolute",
    fontSize: 12,
    bottom: 0,
    right: 0,
  },
  bottomPromoCopy: {
    flex: 1,
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    lineHeight: 16,
  },
  bottomPromoBtn: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bottomPromoBtnText: {
    color: "#6D28D9",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
});
