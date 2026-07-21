import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  TextInput,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PremiumScreen from "../components/vibe/PremiumScreen";
import { usePlans } from "../context/PlansContext";
import { useAuth } from "../context/AuthContext";
import { VibeFonts } from "../constants/vibeTheme";
import { Spacing } from "../constants/theme";
import { api } from "../services/api";
import TabBar from "../components/TabBar";

const friendsHangout3d = require("../assets/friends_hangout_3d.png");

/** Exact light mockup palette — cool lavender wash (not flat white) */
const T = {
  bg: "#EEE9F8",
  card: "#FFFBFE",
  ink: "#1A1F36",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E4DFF0",
  purple: "#8B5CF6",
  purpleDeep: "#7C3AED",
  pink: "#EC4899",
  softPurple: "#EDE7FF",
  cta: ["#8B5CF6", "#EC4899"] as const,
  promo: ["#8B5CF6", "#D946EF", "#EC4899"] as const,
};

const filters = [
  { key: "All", label: "All", icon: "grid" as const },
  { key: "Near You", label: "Near You", icon: "navigate" as const },
  { key: "Today", label: "Today", icon: "calendar" as const },
  { key: "This Week", label: "This Week", icon: "time" as const },
];

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

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dynamicActivities, setDynamicActivities] = useState<any[]>(activitiesFallback);

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

  const filteredPlans = nearbyPlans.filter((plan) => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchTitle = plan.title?.toLowerCase().includes(q);
      const matchDesc = plan.description?.toLowerCase().includes(q);
      const matchLoc = plan.location?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }

    if (activeFilter === "All") return true;
    if (activeFilter === "Near You") return (plan.distance || 0) < 5.0;
    if (activeFilter === "Today") {
      return (
        plan.badge?.toLowerCase() === "today" ||
        plan.timeLabel?.toLowerCase().includes("today")
      );
    }
    if (activeFilter === "This Week") return true;
    return true;
  });

  const yourPlansList = useMemo(() => {
    const mineIds = new Set(myPlans.map((p) => p.id));
    const near = filteredPlans.filter((p) => !mineIds.has(p.id));
    return [...myPlans, ...near];
  }, [myPlans, filteredPlans]);

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
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* Faint cool ambient wash */}
      <LinearGradient
        colors={["rgba(167,139,250,0.22)", "transparent"]}
        style={styles.ambientTop}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <LinearGradient
        colors={["rgba(244,114,182,0.12)", "transparent"]}
        style={styles.ambientBottom}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
      />
      <View style={styles.ambientOrbCool} />

      <PremiumScreen
        heroImage=""
        title=""
        hideHeader={true}
        lightMode={true}
        contentStyle={{ paddingHorizontal: 0, paddingTop: 0, backgroundColor: "transparent", paddingBottom: 120 + insets.bottom }}
      >
        <View style={{ height: insets.top + 4 }} />

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchBarWrapper}>
            <Ionicons name="search" size={18} color={T.faint} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search plans, people or activities..."
              placeholderTextColor={T.faint}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Pressable style={styles.searchFilterBtn} onPress={() => router.push("/events-map")}>
            <LinearGradient
              colors={[...T.cta]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="map" size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 24 }}
        >
          {filters.map((f) => {
            const isActive = activeFilter === f.key;
            return (
              <Pressable key={f.key} onPress={() => setActiveFilter(f.key)}>
                {isActive ? (
                  <View style={styles.filterPillActive}>
                    <Ionicons name={f.icon} size={14} color="#fff" />
                    <Text style={styles.filterTextActive}>{f.label}</Text>
                  </View>
                ) : (
                  <View style={styles.filterPillInactive}>
                    <Ionicons name={`${f.icon}-outline` as any} size={14} color={T.muted} />
                    <Text style={styles.filterTextInactive}>{f.label}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Hero */}
        <View style={styles.heroCardContainer}>
          <LinearGradient
            colors={["#F8F4FF", "#FFFFFF", "#FFF5FA"]}
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
                <Ionicons name="diamond" size={10} color={T.purple} />
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

        {/* Popular Right Now */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Popular Right Now 🔥</Text>
          <Pressable>
            <Text style={styles.seeAllText}>See All ›</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.hScroll}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 24 }}
        >
          {dynamicActivities.map((act) => (
            <Pressable
              key={act.id}
              style={[styles.activityCard, { backgroundColor: getBgColorForActivity(act.name) }]}
              onPress={() => setSearchQuery(act.name)}
            >
              <Text style={styles.activityEmoji}>{getEmojiForActivity(act.name)}</Text>
              <Text style={styles.activityName}>{act.name}</Text>
              <Text style={styles.activityCount}>{act.peopleCount || 0} planning</Text>
              <View style={styles.avatarRow}>
                {MOCK_AVATARS.slice(0, 3).map((uri, idx) => (
                  <Image
                    key={idx}
                    source={{ uri }}
                    style={[styles.smallAvatar, { marginLeft: idx === 0 ? 0 : -6 }]}
                  />
                ))}
                <View style={[styles.smallAvatar, styles.smallAvatarTextWrap, { marginLeft: -6 }]}>
                  <Text style={styles.smallAvatarText}>+{(act.peopleCount || 5) - 3}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Your Plans */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Your Plans ✨</Text>
          <Pressable onPress={refresh} style={styles.refreshRow}>
            <Ionicons name="refresh" size={14} color={T.purple} />
            <Text style={styles.seeAllText}>Refresh</Text>
          </Pressable>
        </View>

        <View style={styles.plansListContainer}>
          {yourPlansList.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🌙</Text>
              <Text style={styles.emptyTitle}>No plans yet</Text>
              <Text style={styles.emptySub}>
                Create a plan or join one nearby to see it here.
              </Text>
              <Pressable onPress={() => router.push("/create-plan")} style={styles.emptyCta}>
                <Text style={styles.emptyCtaText}>+ Create a Plan</Text>
              </Pressable>
            </View>
          ) : (
            yourPlansList.map((plan) => (
              <MockupPlanCard
                key={plan.id}
                plan={plan}
                isMine={plan.creatorId === user?.id || myPlans.some((m) => m.id === plan.id)}
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
              onPress={() => setSearchQuery(venue.name)}
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

        <View style={{ height: 16 }} />
      </PremiumScreen>
      <TabBar dark={false} />
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

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/plan-details", params: { id: plan.id } })
      }
      style={styles.planCard}
    >
      <View style={styles.planCardLeft}>
        <Image
          source={{
            uri:
              plan.imageUrl ||
              "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
          }}
          style={styles.planCardImage}
        />
        <View style={styles.planBadge}>
          <Ionicons name="star" size={9} color="#fff" />
          <Text style={styles.planBadgeText}>Live</Text>
        </View>
      </View>

      <View style={styles.planCardMiddle}>
        <Text style={styles.planTitle} numberOfLines={1}>
          {getEmojiForTitle(plan.title)} {plan.title}
        </Text>
        <Text style={styles.planDescription} numberOfLines={2}>
          {plan.description || "Let's connect and hang out!"}
        </Text>

        <View style={styles.metaSection}>
          <View style={styles.planMetaRow}>
            <Ionicons name="time-outline" size={12} color={T.faint} />
            <Text style={styles.planMetaText}>
              {plan.timeLabel || plan.time || "Today, 5:30 PM"}
            </Text>
          </View>
          <View style={styles.planMetaRow}>
            <Ionicons name="location-outline" size={12} color={T.faint} />
            <Text style={styles.planMetaText} numberOfLines={1}>
              {plan.location || "Nearby"}
            </Text>
          </View>
          <View style={styles.attendingRow}>
            {MOCK_AVATARS.slice(0, 3).map((url, idx) => (
              <Image
                key={idx}
                source={{ uri: url }}
                style={[styles.attendingAvatar, { marginLeft: idx === 0 ? 0 : -5 }]}
              />
            ))}
            <Text style={styles.attendingText}>
              +{Math.max(1, (plan.maxParticipants || 4) - (plan.going || 1))} going
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.planCardRight}>
        <View style={styles.ratioBox}>
          <Text style={styles.ratioText}>
            {plan.going || 1}/{plan.maxParticipants || 4}
          </Text>
          <Text style={styles.ratioSubText}>Going</Text>
        </View>

        {isMine ? (
          <View style={[styles.joinBtn, { backgroundColor: T.purple }]}>
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
              style={styles.joinBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.joinBtnText}>Join</Text>
            </LinearGradient>
          </Pressable>
        ) : requestStatus === "pending" ? (
          <View style={[styles.joinBtn, { backgroundColor: "#EAB308" }]}>
            <Text style={styles.joinBtnText}>Pending</Text>
          </View>
        ) : requestStatus === "accepted" ? (
          <View style={[styles.joinBtn, { backgroundColor: "#22C55E" }]}>
            <Text style={styles.joinBtnText}>Joined</Text>
          </View>
        ) : (
          <View style={[styles.joinBtn, { backgroundColor: "#EF4444" }]}>
            <Text style={styles.joinBtnText}>Declined</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
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
    backgroundColor: T.card,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    height: 48,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
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
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    backgroundColor: T.card,
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
    borderColor: "#EDE7FF",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  heroDecorBlob: {
    position: "absolute",
    right: -20,
    top: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(139,92,246,0.1)",
  },
  heroStar1: {
    position: "absolute",
    top: 10,
    right: 60,
    color: "rgba(139,92,246,0.4)",
    fontSize: 9,
    zIndex: 1,
  },
  heroStar2: {
    position: "absolute",
    top: 34,
    right: 24,
    color: "rgba(236,72,153,0.35)",
    fontSize: 8,
    zIndex: 1,
  },
  heroStar3: {
    position: "absolute",
    bottom: 18,
    right: 72,
    color: "rgba(139,92,246,0.3)",
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
    backgroundColor: T.softPurple,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 5,
  },
  luxePillText: {
    fontSize: 8,
    fontFamily: VibeFonts.bold,
    color: T.purpleDeep,
    letterSpacing: 0.8,
  },
  heroCardTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  heroCardSubtitle: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
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
    color: T.ink,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.purple,
  },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hScroll: {
    marginBottom: 14,
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
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  planCard: {
    flexDirection: "row",
    backgroundColor: T.card,
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#1A1F36",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  planCardLeft: {
    width: 88,
    height: 104,
    borderRadius: 16,
    overflow: "hidden",
  },
  planCardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  planBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: T.purple,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  planBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: VibeFonts.bold,
  },
  planCardMiddle: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  planTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: T.ink,
    opacity: 1,
  },
  planDescription: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#5B6478",
    marginTop: 2,
    lineHeight: 15,
    opacity: 1,
  },
  metaSection: {
    gap: 3,
  },
  planMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  planMetaText: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: T.faint,
    flexShrink: 1,
  },
  attendingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  attendingAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.2,
    borderColor: T.card,
  },
  attendingText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    marginLeft: 4,
    color: T.purple,
  },
  planCardRight: {
    width: 62,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  ratioBox: {
    width: 58,
    height: 42,
    borderRadius: 12,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  ratioText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.purpleDeep,
  },
  ratioSubText: {
    fontSize: 8,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: -1,
  },
  joinBtn: {
    width: 56,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  joinBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
  },

  emptyCard: {
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
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  venueDistanceText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.ink,
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bottomPromoBtnText: {
    color: T.purpleDeep,
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
});
