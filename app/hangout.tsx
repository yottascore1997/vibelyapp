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
import { api } from "../services/api";
import TabBar from "../components/TabBar";
import CreatePlanFab from "../components/CreatePlanFab";
import { ReelsContent } from "./reels";

const friendsHangout3d = require("../assets/friends_hangout_3d.png");

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

const VENUE_FALLBACK = [
  {
    id: "v1",
    name: "Cafe Mocha",
    plans: 4,
    distance: "500 m",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop",
  },
  {
    id: "v2",
    name: "Central Park",
    plans: 7,
    distance: "1.2 km",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop",
  },
  {
    id: "v3",
    name: "City Cinema",
    plans: 3,
    distance: "2.0 km",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop",
  },
  {
    id: "v4",
    name: "Sports Arena",
    plans: 5,
    distance: "3.1 km",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop",
  },
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

const activitiesFallback = [
  { id: "act-1", name: "Coffee", icon: "cafe", peopleCount: 12 },
  { id: "act-2", name: "Food", icon: "pizza", peopleCount: 9 },
  { id: "act-3", name: "Movie", icon: "film", peopleCount: 15 },
  { id: "act-4", name: "Sports", icon: "tennisball", peopleCount: 8 },
];

export default function HangoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { myPlans, nearbyPlans, joinPlan, getRequestStatus, refresh } = usePlans();
  const { matches } = useMatches();

  const [hangoutMode, setHangoutMode] = useState<"FRIENDS_PLANS" | "MY_PLANS">("FRIENDS_PLANS");
  const [planVisibility, setPlanVisibility] = useState<"PUBLIC" | "FRIENDS_ONLY">("PUBLIC");
  const [dynamicActivities, setDynamicActivities] = useState<any[]>(activitiesFallback);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [selectedVibeAct, setSelectedVibeAct] = useState("beer");
  const [selectedTimeChip, setSelectedTimeChip] = useState("now");
  const [pinging, setPinging] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [myEnergy, setMyEnergy] = useState<"LESSGO" | "MAYBE" | "OFF_GRID">("LESSGO");

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
  }, [displayFriends]);

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
      await api.updateSocialStatus({ energy, freeNow: energy === "LESSGO" });
      Alert.alert("Energy Updated! ⚡", `Your status is now set to ${energy}.`);
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
          "🎉 VIBE MOVE DISPATCHED! 🚀",
          `Ping sent to ${selectedFriend.name.split(" ")[0]} for ${finalActEmoji} ${finalActName} (${finalTimeText})!\nAchievement Unlocked: Vibe Master 🏆`
        );
      } else {
        Alert.alert(
          "🎉 Vibe Ping Sent! 🚀",
          `Demo ping sent to ${selectedFriend.name.split(" ")[0]} for ${finalActEmoji} ${finalActName} (${finalTimeText})!`
        );
      }
    } catch {
      Alert.alert(
        "🎉 Vibe Ping Sent! 🚀",
        `Vibe ping sent to ${selectedFriend.name.split(" ")[0]} for ${finalActEmoji} ${finalActName}!`
      );
    } finally {
      setPinging(false);
    }
  };

  useEffect(() => {
    api
      .getActivities()
      .then((res: any) => {
        if (res && Array.isArray(res) && res.length > 0) {
          setDynamicActivities(res);
        } else {
          setDynamicActivities(activitiesFallback);
        }
      })
      .catch(() => setDynamicActivities(activitiesFallback));
  }, []);

  const getEmojiForActivity = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("coffee") || n.includes("cafe")) return "☕";
    if (n.includes("food") || n.includes("pizza") || n.includes("burger")) return "🍔";
    if (n.includes("movie") || n.includes("film") || n.includes("cinema")) return "🍿";
    if (n.includes("sport") || n.includes("cricket") || n.includes("badminton") || n.includes("tennis")) return "🏋️";
    if (n.includes("bike") || n.includes("ride") || n.includes("bicycle")) return "🏍️";
    return "🎯";
  };

  const getBgColorForActivity = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("coffee") || n.includes("cafe")) return "#F5EDE3";
    if (n.includes("food") || n.includes("pizza") || n.includes("burger")) return "#FFE8D6";
    if (n.includes("movie") || n.includes("film") || n.includes("cinema")) return "#EDE7FF";
    if (n.includes("sport") || n.includes("cricket") || n.includes("badminton") || n.includes("tennis")) return "#E3F7E8";
    if (n.includes("bike") || n.includes("ride") || n.includes("bicycle")) return "#FFE4EC";
    return "#F0E9FF";
  };

  const handleRequestJoin = async (planId: string) => {
    try {
      await joinPlan(planId);
      Alert.alert(
        "Request Sent ✉️",
        "Aapki join request owner ke paas chali gayi hai. Approval ka wait karein."
      );
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Request failed");
    }
  };

  const filteredPlans = useMemo(() => {
    if (planVisibility === "FRIENDS_ONLY") {
      return nearbyPlans.filter((p) => p.isPrivate || p.visibility === "FRIENDS");
    }
    return nearbyPlans.filter((p) => !p.isPrivate && p.visibility !== "FRIENDS");
  }, [nearbyPlans, planVisibility]);

  const othersPlans = useMemo(() => {
    const mineIds = new Set(myPlans.map((p) => p.id));
    return filteredPlans.filter(
      (p) => !mineIds.has(p.id) && p.creatorId !== user?.id
    );
  }, [filteredPlans, myPlans, user?.id]);

  const venueCards = useMemo(() => {
    const fromPlans = filteredPlans
      .filter((p) => p.location)
      .slice(0, 6)
      .map((p, idx) => ({
        id: `venue-${p.id}`,
        name: p.location as string,
        plans: Math.max(1, Math.round((p.going || 1) + idx)),
        distance:
          typeof p.distance === "number"
            ? p.distance < 1
              ? `${Math.round(p.distance * 1000)} m`
              : `${p.distance.toFixed(1)} km`
            : `${500 + idx * 400} m`,
        image:
          p.imageUrl ||
          VENUE_FALLBACK[idx % VENUE_FALLBACK.length].image,
      }));

    if (fromPlans.length >= 2) return fromPlans;
    return VENUE_FALLBACK;
  }, [filteredPlans]);

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

        {/* Enhanced Playful Header Slogan with Floating Emoji Stickers */}
        <View style={styles.sloganHeaderWrap}>
          <View style={styles.doodleRow}>
            <View style={styles.doodlePill}>
              <Text style={styles.doodleText}>Post & join plans</Text>
              <Ionicons name="return-down-forward" size={14} color="#A78BFA" />
            </View>
            <View style={styles.liveNowBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveNowText}>12 Plans Live</Text>
            </View>
          </View>
          <Text style={styles.sloganTitle} numberOfLines={1} adjustsFontSizeToFit>
            Swipe plans, <Text style={styles.sloganHighlight}>not profiles! ✨</Text>
          </Text>
          <LinearGradient
            colors={["#8B5CF6", "#F472B6", "#FBBF24"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sloganUnderline}
          />
        </View>

        {/* Social Energy Selector */}
        <View style={styles.socialEnergyCard}>
          <Text style={styles.socialEnergyTitle}>What's your social energy today?</Text>
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
            {/* Hero */}
            <View style={styles.heroCardContainer}>
              <LinearGradient
                colors={["#1A1530", "#151B2E", "#0E1424"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroDecorBlob} />
                <Text style={styles.heroStar1}>✦</Text>
                <Text style={styles.heroStar2}>✧</Text>
                <Text style={styles.heroStar3}>✦</Text>

                <View style={styles.heroCardLeft}>
                  <View style={styles.luxePill}>
                    <Ionicons name="diamond" size={10} color="#FBBF24" />
                    <Text style={styles.luxePillText}>PREMIUM</Text>
                  </View>
                  <Text style={styles.heroCardTitle}>What's the plan{"\n"}today?</Text>
                  <Text style={styles.heroCardSubtitle} numberOfLines={2}>
                    Create a plan or join others who are up for something fun!
                  </Text>
                  <Pressable onPress={() => router.push("/create-plan")}>
                    <LinearGradient
                      colors={[...T.cta]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.heroCardBtn}
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                      <Text style={styles.heroCardBtnText}>Create a Plan</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
                <View style={styles.heroCardRight} pointerEvents="none">
                  <Image
                    source={friendsHangout3d}
                    style={styles.heroCardImage}
                    resizeMode="contain"
                  />
                </View>
              </LinearGradient>
            </View>

            {/* Popular Right Now 🔥 */}
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.sectionTitle}>Popular Right Now 🔥</Text>
                <View style={styles.liveVibeTag}>
                  <Text style={styles.liveVibeTagText}>LIVE</Text>
                </View>
              </View>
              <Pressable>
                <Text style={styles.seeAllText}>See All ›</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.hScroll}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 24, paddingTop: 4, paddingBottom: 8 }}
            >
              {dynamicActivities.map((act) => {
                const theme = getActivityCardTheme(act.name);
                const people = act.peopleCount || Math.floor(Math.random() * 8) + 4;
                return (
                  <Pressable
                    key={act.id}
                    style={styles.popCardWrap}
                  >
                    <LinearGradient
                      colors={theme.bgGrad as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.popCardInner}
                    >
                      {/* Top Tag */}
                      <View style={styles.popTagPill}>
                        <Text style={[styles.popTagText, { color: theme.accent }]}>{theme.tag}</Text>
                      </View>

                      {/* 3D Glowing Emoji Icon Sphere */}
                      <LinearGradient
                        colors={theme.iconGrad as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.popIconSphere}
                      >
                        <Text style={styles.popEmojiText}>{getEmojiForActivity(act.name)}</Text>
                      </LinearGradient>

                      <Text style={styles.popActivityTitle} numberOfLines={1}>
                        {act.name}
                      </Text>

                      <View style={styles.popCountRow}>
                        <Ionicons name="flame" size={12} color={theme.accent} />
                        <Text style={[styles.popCountText, { color: theme.accent }]}>
                          {people} going
                        </Text>
                      </View>

                      {/* Overlapping Avatar Stack */}
                      <View style={styles.popAvatarRow}>
                        {MOCK_AVATARS.slice(0, 3).map((uri, idx) => (
                          <Image
                            key={idx}
                            source={{ uri }}
                            style={[styles.popAvatar, { marginLeft: idx === 0 ? 0 : -7 }]}
                          />
                        ))}
                        <LinearGradient
                          colors={theme.iconGrad as any}
                          style={[styles.popAvatarMore, { marginLeft: -7 }]}
                        >
                          <Text style={styles.popAvatarMoreText}>+{people > 3 ? people - 3 : 2}</Text>
                        </LinearGradient>
                      </View>
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Others' plans to join — not your own */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Plans near you</Text>
              <Pressable onPress={refresh} style={styles.refreshRow}>
                <Ionicons name="refresh" size={14} color={T.purple} />
                <Text style={styles.seeAllText}>Refresh</Text>
              </Pressable>
            </View>

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

            {/* Hangouts Near You — horizontal venue cards */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Hangouts Near You 📍</Text>
              <Pressable>
                <Text style={styles.seeAllText}>See All ›</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.hScroll}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 24, paddingBottom: 4 }}
            >
              {venueCards.map((venue) => (
                <Pressable
                  key={venue.id}
                  style={styles.venueCard}
                >
                  <Image source={{ uri: venue.image }} style={styles.venueImage} />
                  <LinearGradient
                    colors={["transparent", "rgba(15,10,30,0.75)"]}
                    style={styles.venueOverlay}
                  />
                  <View style={styles.venueDistance}>
                    <Text style={styles.venueDistanceText}>{venue.distance}</Text>
                  </View>
                  <View style={styles.venueTextWrap}>
                    <Text style={styles.venueName} numberOfLines={1}>
                      {venue.name}
                    </Text>
                    <Text style={styles.venuePlans}>{venue.plans} plans happening</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            {/* Bottom CTA */}
            <View style={styles.bottomPromoContainer}>
              <LinearGradient
                colors={[...T.promo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bottomPromo}
              >
                <View style={styles.bottomPromoIconWrap}>
                  <Text style={styles.bottomPromoEmoji}>📅</Text>
                  <Text style={styles.bottomPromoEmojiBadge}>😉</Text>
                </View>
                <Text style={styles.bottomPromoCopy}>
                  Don't find a plan you like? Create your own and invite others!
                </Text>
                <Pressable
                  style={styles.bottomPromoBtn}
                  onPress={() => router.push("/create-plan")}
                >
                  <Text style={styles.bottomPromoBtnText}>+ Create New Plan</Text>
                </Pressable>
              </LinearGradient>
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
                  Create a hangout with the green button, or join one from Friends Plans.
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
      <CreatePlanFab />
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
  const spotsLeft = Math.max(1, (plan.maxParticipants || 4) - (plan.going || 1));
  const categoryTag = getCategoryTagForTitle(plan.title);

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/plan-details", params: { id: plan.id } })
      }
      style={styles.heroPlanCard}
    >
      {/* Top Hero Image & Floating Reaction Badges */}
      <View style={styles.cardImageWrap}>

        <Image
          source={{
            uri:
              plan.imageUrl ||
              "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&h=400&fit=crop",
          }}
          style={styles.cardHeroImage}
        />

        {/* Top Floating Badge Row */}
        <View style={styles.cardBadgeRow}>
          <View style={styles.categoryBadgePill}>
            <Text style={styles.categoryBadgeEmoji}>{categoryTag.emoji}</Text>
            <Text style={styles.categoryBadgeText}>{categoryTag.label}</Text>
          </View>

          <TouchableOpacity style={styles.floatingHeartBtn} activeOpacity={0.8}>
            <Ionicons name="heart" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Floating Reactions overlay */}
        <View style={styles.floatingClapBadge}>
          <Text style={{ fontSize: 13, marginRight: 2 }}>👏</Text>
          <Text style={{ fontSize: 10, fontFamily: VibeFonts.bold, color: "#1E1B4B" }}>14 joined</Text>
        </View>

        <View style={styles.floatingSparkleBadge}>
          <Ionicons name="sparkles" size={13} color="#A78BFA" />
        </View>
      </View>

      {/* Bottom White Info Box Overlay */}
      <View style={styles.cardBottomInfo}>
        <View style={styles.cardHeaderLine}>
          <Text style={styles.cardTitleText} numberOfLines={1}>
            {plan.title}
          </Text>
          <View style={styles.verifiedHostBadge}>
            <Ionicons name="checkmark-circle" size={15} color="#2563EB" />
            <Text style={styles.verifiedHostText}>Verified</Text>
          </View>
        </View>

        <View style={styles.cardMetaLine}>
          <View style={styles.spotsRow}>
            <LinearGradient
              colors={["#8B5CF6", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.spotsCountBadge}
            >
              <Text style={styles.spotsCountText}>{spotsLeft}</Text>
            </LinearGradient>
            <Text style={styles.spotsLabelText}>spots left today!</Text>
          </View>

          <View style={styles.attendingRow}>
            {MOCK_AVATARS.slice(0, 3).map((url, idx) => (
              <Image
                key={idx}
                source={{ uri: url }}
                style={[styles.attendingAvatar, { marginLeft: idx === 0 ? 0 : -8 }]}
              />
            ))}
            <View style={styles.moreAvatarBadge}>
              <Text style={styles.moreAvatarText}>+{spotsLeft > 2 ? spotsLeft : 2}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooterRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1 }}>
            <Ionicons name="location" size={12} color="#A78BFA" />
            <Text style={styles.cardTimeText} numberOfLines={1}>
              {plan.timeLabel || plan.time || "Today"} · {plan.location || "Nearby"}
            </Text>
          </View>

          {isMine ? (
            <View style={[styles.joinBtnPill, { backgroundColor: T.purple }]}>
              <Text style={styles.joinBtnText}>Mine ✨</Text>
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
                <Text style={styles.joinBtnText}>Request ✋</Text>
              </LinearGradient>
            </Pressable>
          ) : requestStatus === "pending" ? (
            <View style={[styles.joinBtnPill, { backgroundColor: "#EAB308" }]}>
              <Text style={styles.joinBtnText}>Pending ⏳</Text>
            </View>
          ) : (
            <View style={[styles.joinBtnPill, { backgroundColor: "#22C55E" }]}>
              <Text style={styles.joinBtnText}>Joined 🎉</Text>
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

function getActivityCardTheme(name: string) {
  const n = name.toLowerCase();
  if (n.includes("coffee") || n.includes("cafe")) {
    return {
      bgGrad: ["#1F1A2E", "#1A1624"],
      iconGrad: ["#F59E0B", "#D97706"],
      accent: "#FBBF24",
      tag: "POPULAR ☕",
    };
  }
  if (n.includes("food") || n.includes("pizza") || n.includes("burger")) {
    return {
      bgGrad: ["#241A1E", "#1C1518"],
      iconGrad: ["#F97316", "#EA580C"],
      accent: "#FB923C",
      tag: "TRENDING 🍕",
    };
  }
  if (n.includes("movie") || n.includes("film") || n.includes("cinema")) {
    return {
      bgGrad: ["#1A1630", "#151228"],
      iconGrad: ["#A78BFA", "#7C3AED"],
      accent: "#C4B5FD",
      tag: "HOT 🍿",
    };
  }
  if (n.includes("sport") || n.includes("gym") || n.includes("run")) {
    return {
      bgGrad: ["#14241E", "#101C1A"],
      iconGrad: ["#34D399", "#059669"],
      accent: "#6EE7B7",
      tag: "ACTIVE 🏃",
    };
  }
  if (n.includes("drive") || n.includes("ride") || n.includes("bike")) {
    return {
      bgGrad: ["#221528", "#1A1220"],
      iconGrad: ["#EC4899", "#DB2777"],
      accent: "#F9A8D4",
      tag: "VIBE 🏎️",
    };
  }
  return {
    bgGrad: ["#161E32", "#121828"],
    iconGrad: ["#60A5FA", "#3B82F6"],
    accent: "#93C5FD",
    tag: "LIVE ✨",
  };
}

function getEmojiForTitle(title?: string) {
  const n = (title || "").toLowerCase();
  if (n.includes("coffee") || n.includes("cafe")) return "☕";
  if (n.includes("food") || n.includes("dinner") || n.includes("lunch")) return "🍔";
  if (n.includes("movie") || n.includes("film")) return "🍿";
  if (n.includes("sport") || n.includes("gym") || n.includes("run")) return "🏃";
  return "✨";
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
    marginBottom: 16,
  },
  doodleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  doodlePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(139, 92, 246, 0.18)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.35)",
  },
  doodleText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#C4B5FD",
  },
  liveNowBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16, 185, 129, 0.16)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.32)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  liveNowText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#6EE7B7",
  },
  sloganTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: "#F8FAFC",
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  sloganHighlight: {
    color: "#FBBF24",
  },
  sloganUnderline: {
    width: 240,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
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
