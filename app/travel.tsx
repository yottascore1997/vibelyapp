import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSpring,
  interpolate,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import TabBar from "../components/TabBar";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { VibeFonts } from "../constants/vibeTheme";
import { api } from "../services/api";
import type { Plan } from "../constants/plans";

const createTrip3d = require("../assets/create_plan_3d.jpg");

const FAV_STORAGE_KEY = "@hangora_travel_favorites";
const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W * 0.46;

const T = {
  bg: "#EEE9F8",
  card: "#FFFFFF",
  ink: "#16122B",
  muted: "#6B6580",
  faint: "#A39BB8",
  border: "#E9E3F4",
  purple: "#8B5CF6",
  purpleDeep: "#6D28D9",
  softPurple: "#F0E9FF",
  pink: "#F43F8B",
  amber: "#F59E0B",
  green: "#22C55E",
  gold: "#E8B923",
  cta: ["#7C3AED", "#A855F7", "#EC4899"] as const,
};

type CategoryId = "all" | "weekend" | "mountains" | "beach" | "international" | "more";

interface JoinRequest {
  userId: string;
  userName: string;
  userAvatar: string;
}

export interface TravelPlan {
  id: string;
  title: string;
  dates: string;
  style: string;
  description: string;
  maxMembers: number;
  joinedCount: number;
  creator: string;
  creatorId: string;
  creatorAvatar: string;
  requests: JoinRequest[];
  joinedUsers: string[];
  joinedUserIds: string[];
  cover: string;
  category: CategoryId;
  trending?: boolean;
}

const HERO_IMG =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=600&fit=crop";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=700&h=800&fit=crop";

const AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
];

const CATEGORIES: { id: CategoryId; label: string; emoji: string; tint: string }[] = [
  { id: "all", label: "All Trips", emoji: "✨", tint: "#8B5CF6" },
  { id: "weekend", label: "Weekend", emoji: "🏕️", tint: "#F59E0B" },
  { id: "mountains", label: "Mountains", emoji: "🏔️", tint: "#10B981" },
  { id: "beach", label: "Beach", emoji: "🏖️", tint: "#06B6D4" },
  { id: "international", label: "Overseas", emoji: "✈️", tint: "#EC4899" },
  { id: "more", label: "More", emoji: "🗺️", tint: "#6366F1" },
];

interface WhyCard {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: readonly [string, string, ...string[]];
}

const WHY_CARDS: WhyCard[] = [
  {
    title: "Verified Travelers",
    icon: "shield-checkmark",
    color: "#8B5CF6",
    bg: ["#F5F3FF", "#EDE9FE"],
  },
  {
    title: "Split Expenses",
    icon: "wallet",
    color: "#EC4899",
    bg: ["#FDF2F8", "#FCE7F3"],
  },
  {
    title: "Shared Memories",
    icon: "camera",
    color: "#F59E0B",
    bg: ["#FEF3C7", "#FDE68A"],
  },
  {
    title: "Safety First",
    icon: "people",
    color: "#10B981",
    bg: ["#ECFDF5", "#D1FAE5"],
  },
];

function mapApiPlanToTravel(p: Plan): TravelPlan {
  const style = p.activity || "Travel";
  const low = style.toLowerCase();
  const cat = low.includes("beach")
    ? "beach"
    : low.includes("mountain")
      ? "mountains"
      : low.includes("weekend")
        ? "weekend"
        : "all";
  return {
    id: p.id,
    title: (p as any).destination || p.title?.replace(/^✈️\s*/, "") || "Trip",
    dates: p.timeLabel || p.time || "Flexible",
    style,
    description: p.description || p.location || "Travel together",
    maxMembers: p.maxParticipants || 6,
    joinedCount: p.going || 1,
    creator: p.creatorName || "Host",
    creatorId: p.creatorId,
    creatorAvatar:
      p.creatorAvatar ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    requests: [],
    joinedUsers: (p.participants || []).map((x) => x.name),
    joinedUserIds: (p.participants || []).map((x) => x.id),
    cover: p.imageUrl || DEFAULT_COVER,
    category: cat as CategoryId,
    trending: true,
  };
}

async function loadPlans(): Promise<TravelPlan[]> {
  const [mine, nearby] = await Promise.all([
    api.getMyPlans(undefined, "TRAVEL").catch(() => [] as Plan[]),
    api.getNearbyPlans(undefined, "TRAVEL").catch(() => [] as Plan[]),
  ]);
  const merged = [...(mine || []), ...(nearby || [])].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
  );
  return merged.map(mapApiPlanToTravel);
}


function SoftPress({
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
        scale.value = withSpring(0.96, { damping: 14 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
    >
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}

function FloatingPlane() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [0, -12]) },
      { translateX: interpolate(t.value, [0, 1], [0, 8]) },
      { rotate: `${interpolate(t.value, [0, 1], [-14, 12])}deg` },
    ],
  }));
  return (
    <Animated.View style={[styles.planeWrap, style]}>
      <LinearGradient colors={[...T.cta]} style={styles.planeBubble}>
        <Ionicons name="airplane" size={13} color="#fff" />
      </LinearGradient>
    </Animated.View>
  );
}

function CustomBottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const translateY = useSharedValue(SCREEN_H);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      translateY.value = withTiming(0, { duration: 280 });
    } else {
      translateY.value = withTiming(SCREEN_H, { duration: 200 }, (finished) => {
        if (finished) runOnJS(setShouldRender)(false);
      });
    }
  }, [isOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!shouldRender) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.sheet, animatedStyle]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        {children}
      </Animated.View>
    </View>
  );
}

export default function TravelPartnersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openSidebar } = useSidebar();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryId>("all");
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TravelPlan | null>(null);
  const [showAllTrips, setShowAllTrips] = useState(false);

  const userId = user?.id || "local-user";
  const userName = user?.name || "You";
  const firstName = userName.split(" ")[0] || "Explorer";

  const refresh = useCallback(async () => {
    const [p, favRaw] = await Promise.all([
      loadPlans(),
      AsyncStorage.getItem(FAV_STORAGE_KEY),
    ]);
    setPlans(p);
    setFavorites(favRaw ? JSON.parse(favRaw) : []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const persistPlans = async (next: TravelPlan[]) => {
    setPlans(next);
  };

  const filtered = useMemo(() => {
    return plans.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          p.title.toLowerCase().includes(q) ||
          p.style.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.dates.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (category === "all" || category === "more") return true;
      return p.category === category || p.style.toLowerCase().includes(category);
    });
  }, [plans, search, category]);

  const popularTrips = useMemo(() => {
    return showAllTrips ? filtered : filtered.slice(0, 8);
  }, [filtered, showAllTrips]);

  const toggleFavorite = async (planId: string) => {
    const next = favorites.includes(planId)
      ? favorites.filter((id) => id !== planId)
      : [...favorites, planId];
    setFavorites(next);
    await AsyncStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(next));
  };

  const isMine = (plan: TravelPlan) =>
    plan.creatorId === userId || plan.creator.includes("(You)");

  const hasJoined = (plan: TravelPlan) =>
    plan.joinedUserIds?.includes(userId) || plan.joinedUsers.includes(userName);

  const hasRequested = (plan: TravelPlan) =>
    plan.requests.some((r) => r.userId === userId);

  const handleRequestJoin = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    if (isMine(plan)) {
      Alert.alert("Your trip", "You're already the organizer of this trip.");
      return;
    }
    if (hasJoined(plan)) {
      Alert.alert("Already in", "You're already part of this trip.");
      return;
    }
    if (plan.joinedCount >= plan.maxMembers) {
      Alert.alert("Full", "No seats left on this trip.");
      return;
    }

    try {
      await api.joinPlan(planId);
      await refresh();
      const updated = (await loadPlans()).find((p) => p.id === planId) || null;
      setSelectedPlan(updated);
      Alert.alert("You're in! ✈️", "Joined this trip successfully.");
    } catch (e) {
      Alert.alert("Join failed", e instanceof Error ? e.message : "Could not join trip");
    }
  };

  const handleAcceptRequest = async (planId: string, reqUserId: string) => {
    const next = plans.map((p) => {
      if (p.id !== planId) return p;
      const req = p.requests.find((r) => r.userId === reqUserId);
      if (!req || p.joinedCount >= p.maxMembers) return p;
      return {
        ...p,
        requests: p.requests.filter((r) => r.userId !== reqUserId),
        joinedCount: p.joinedCount + 1,
        joinedUsers: [...p.joinedUsers, req.userName],
        joinedUserIds: [...(p.joinedUserIds || []), req.userId],
      };
    });
    await persistPlans(next);
    setSelectedPlan(next.find((p) => p.id === planId) || null);
  };

  const seatsLeft = (plan: TravelPlan) =>
    Math.max(0, plan.maxMembers - plan.joinedCount);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* Premium mesh background */}
      <LinearGradient
        colors={["#EEE9F8", "#F7F2FC", "#FFF5F9", "#EEE9F8"]}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.orbA} />
      <View style={styles.orbB} />
      <View style={styles.orbC} />

      {/* Header */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <SoftPress style={styles.roundBtn} onPress={openSidebar}>
          <Ionicons name="menu-outline" size={22} color={T.ink} />
        </SoftPress>
        <SoftPress style={styles.roundBtn} onPress={() => router.push("/(tabs)/chats")}>
          <Ionicons name="notifications-outline" size={20} color={T.ink} />
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>2</Text>
          </View>
        </SoftPress>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 130 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO — mockup layout */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.heroRow}>
          <View style={styles.heroLeft}>
            <Animated.Text entering={FadeIn.delay(80)} style={styles.hiText}>
              Hi {firstName}! 👋
            </Animated.Text>
            <Text style={styles.heroTitle}>
              Find your{"\n"}
              <Text style={styles.travelWord}>travel</Text>
              <Text style={styles.heroTitleRest}> partner</Text>
            </Text>
            <View style={styles.underlineWrap}>
              <LinearGradient
                colors={["#A855F7", "#EC4899", "transparent"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.scriptStroke}
              />
            </View>
            <Text style={styles.heroSub}>
              Connect with like-minded travelers and explore the world together 🌍
            </Text>
          </View>

          <View style={styles.heroRight}>
            {/* Dotted flight arc */}
            <View style={styles.flightArc} />
            <FloatingPlane />
            <Animated.View entering={ZoomIn.delay(150).springify()} style={styles.blobOuter}>
              <LinearGradient colors={["#C4B5FD", "#F9A8D4", "#FDE68A"]} style={styles.blobRing}>
                <View style={styles.blobInner}>
                  <Image source={{ uri: HERO_IMG }} style={styles.blobImg} />
                </View>
              </LinearGradient>
            </Animated.View>
            <Animated.Text entering={FadeInUp.delay(300)} style={styles.balloon1}>
              🎈
            </Animated.Text>
            <Animated.Text entering={FadeInUp.delay(380)} style={styles.balloon2}>
              🎈
            </Animated.Text>
            <View style={styles.sparkle1} />
            <View style={styles.sparkle2} />
          </View>
        </Animated.View>

        {/* Search — premium pill */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.searchWrap}>
          <BlurView intensity={40} tint="light" style={styles.searchBlur}>
            <View style={styles.searchBar}>
              <View style={styles.pinCircle}>
                <Ionicons name="location" size={16} color={T.purple} />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Where do you want to go?"
                placeholderTextColor={T.faint}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
              <SoftPress style={styles.searchBtn} onPress={() => {}}>
                <LinearGradient colors={T.cta} style={styles.searchBtnGrad}>
                  <Ionicons name="search" size={18} color="#fff" />
                </LinearGradient>
              </SoftPress>
            </View>
          </BlurView>
        </Animated.View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {CATEGORIES.map((c, i) => {
            const active = category === c.id;
            return (
              <Animated.View key={c.id} entering={FadeInRight.delay(60 + i * 45).springify()}>
                <SoftPress style={styles.catItem} onPress={() => setCategory(c.id)}>
                  {active ? (
                    <View style={styles.catActiveRing}>
                      <LinearGradient colors={T.cta} style={styles.catCircleActive}>
                        <Text style={styles.catEmoji}>{c.emoji}</Text>
                      </LinearGradient>
                    </View>
                  ) : (
                    <View style={[styles.catCircle, { backgroundColor: `${c.tint}22` }]}>
                      <Text style={styles.catEmoji}>{c.emoji}</Text>
                    </View>
                  )}
                  <Text
                    style={[styles.catLabel, active && styles.catLabelActive]}
                    numberOfLines={2}
                  >
                    {c.label}
                  </Text>
                </SoftPress>
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Promo banner — premium */}
        <Animated.View entering={FadeInDown.delay(140).duration(450)}>
          <LinearGradient
            colors={[...T.cta]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promo}
          >
            <View style={styles.promoGlow} />
            <View style={styles.promoLeft}>
              <Text style={styles.promoEyebrow}>Plan it. Share it. Live it.</Text>
              <Text style={styles.promoTitle}>
                Your next{" "}
                <Text style={styles.promoAdventure}>adventure</Text>
                {"\n"}is waiting!
              </Text>
              <SoftPress onPress={() => router.push("/create-travel-plan")}>
                <View style={styles.promoBtn}>
                  <Text style={styles.promoBtnText}>Create a Trip</Text>
                  <View style={styles.promoArrow}>
                    <Ionicons name="arrow-forward" size={13} color={T.purpleDeep} />
                  </View>
                </View>
              </SoftPress>
            </View>
            <View style={styles.promoArt}>
              <Image source={createTrip3d} style={styles.promo3d} resizeMode="contain" />
              <Text style={styles.promoFloatCam}>📷</Text>
              <Text style={styles.promoFloatBag}>🧳</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Popular Trips */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Popular Trips ✨</Text>
          <Pressable onPress={() => setShowAllTrips((v) => !v)}>
            <Text style={styles.seeAll}>{showAllTrips ? "Show less" : "See all ›"}</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tripsRow}
          decelerationRate="fast"
          snapToInterval={CARD_W + 14}
        >
          {popularTrips.map((plan, i) => {
            const left = seatsLeft(plan);
            const fav = favorites.includes(plan.id);
            return (
              <Animated.View
                key={plan.id}
                entering={FadeInRight.delay(100 + i * 60).springify()}
              >
                <SoftPress style={styles.tripCard} onPress={() => setSelectedPlan(plan)}>
                  <View style={styles.tripImgWrap}>
                    <Image source={{ uri: plan.cover }} style={styles.tripImg} />
                    <LinearGradient
                      colors={["transparent", "rgba(22,18,43,0.15)"]}
                      style={StyleSheet.absoluteFillObject}
                    />
                    {plan.trending ? (
                      <LinearGradient
                        colors={["#F43F8B", "#FB7185"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.trendingPill}
                      >
                        <Ionicons name="flame" size={10} color="#fff" />
                        <Text style={styles.trendingText}>TRENDING</Text>
                      </LinearGradient>
                    ) : null}
                    <Pressable
                      style={styles.heartBtn}
                      onPress={() => toggleFavorite(plan.id)}
                      hitSlop={10}
                    >
                      <Ionicons
                        name={fav ? "heart" : "heart-outline"}
                        size={16}
                        color={fav ? T.pink : T.ink}
                      />
                    </Pressable>
                  </View>
                  <View style={styles.tripBody}>
                    <Text style={styles.tripTitle} numberOfLines={1}>
                      {plan.title}
                    </Text>
                    <View style={styles.tripMetaRow}>
                      <Ionicons name="calendar-outline" size={12} color={T.faint} />
                      <Text style={styles.tripDates}>{plan.dates}</Text>
                    </View>
                    <Text style={styles.tripSeats}>
                      {left > 0 ? `${left} Seats Left` : "Fully booked"}
                    </Text>
                    <View style={styles.avatarStack}>
                      {AVATARS.slice(0, 3).map((uri, idx) => (
                        <Image
                          key={uri}
                          source={{ uri }}
                          style={[
                            styles.stackAv,
                            { marginLeft: idx === 0 ? 0 : -9, zIndex: 3 - idx },
                          ]}
                        />
                      ))}
                      <View style={[styles.stackMore, { marginLeft: -9 }]}>
                        <Text style={styles.stackMoreText}>
                          +{Math.max(1, plan.joinedCount)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </SoftPress>
              </Animated.View>
            );
          })}
          {popularTrips.length === 0 ? (
            <View style={styles.emptyTrips}>
              <Text style={{ fontSize: 40 }}>🗺️</Text>
              <Text style={styles.emptyTripsText}>No trips yet — create yours!</Text>
              <SoftPress
                style={styles.emptyCreate}
                onPress={() => router.push("/create-travel-plan")}
              >
                <Text style={styles.emptyCreateText}>+ Create a Trip</Text>
              </SoftPress>
            </View>
          ) : null}
        </ScrollView>

        {/* Why travel together */}
        <View style={styles.whyHead}>
          <Text style={styles.sectionTitle}>Why travel together?</Text>
          <LinearGradient colors={T.cta} style={styles.whyArrow}>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </LinearGradient>
        </View>
        <View style={styles.whyGrid}>
          {WHY_CARDS.map((card, i) => (
            <Animated.View
              key={card.title}
              entering={ZoomIn.delay(120 + i * 70).springify()}
              style={{ width: (SCREEN_W - 40 - 10) / 2 }}
            >
              <LinearGradient colors={card.bg} style={styles.whyCard}>
                <View style={styles.whyIcon}>
                  <Ionicons name={card.icon} size={18} color={card.color} />
                </View>
                <Text style={styles.whyTitle}>{card.title}</Text>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Details sheet */}
      <CustomBottomSheet
        isOpen={selectedPlan !== null}
        onClose={() => setSelectedPlan(null)}
        title="Trip details"
      >
        {selectedPlan ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Image source={{ uri: selectedPlan.cover }} style={styles.detailCover} />
            <Text style={styles.detailTitle}>{selectedPlan.title}</Text>
            <View style={styles.detailMetaRow}>
              <Ionicons name="calendar-outline" size={14} color={T.purple} />
              <Text style={styles.detailMeta}>{selectedPlan.dates}</Text>
              <Ionicons
                name="people-outline"
                size={14}
                color={T.pink}
                style={{ marginLeft: 12 }}
              />
              <Text style={[styles.detailMeta, { color: T.pink }]}>
                {seatsLeft(selectedPlan)} seats left
              </Text>
            </View>
            <Text style={styles.detailDesc}>{selectedPlan.description}</Text>
            <Text style={styles.detailOrg}>Organized by {selectedPlan.creator}</Text>

            <Text style={styles.membersTitle}>Travel group</Text>
            <View style={styles.membersWrap}>
              {selectedPlan.joinedUsers.map((u) => (
                <View key={u} style={styles.memberPill}>
                  <Ionicons name="person-circle" size={14} color={T.purple} />
                  <Text style={styles.memberText}>{u}</Text>
                </View>
              ))}
            </View>

            {isMine(selectedPlan) ? (
              <View style={styles.ownerPanel}>
                <Text style={styles.reqTitle}>
                  Pending requests ({selectedPlan.requests.length})
                </Text>
                {selectedPlan.requests.length === 0 ? (
                  <Text style={styles.noReq}>No pending requests yet.</Text>
                ) : (
                  selectedPlan.requests.map((req) => (
                    <View key={req.userId} style={styles.reqRow}>
                      <Image source={{ uri: req.userAvatar }} style={styles.reqAvatar} />
                      <Text style={styles.reqName}>{req.userName}</Text>
                      <Pressable
                        onPress={() => handleAcceptRequest(selectedPlan.id, req.userId)}
                      >
                        <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.acceptBtn}>
                          <Text style={styles.acceptText}>Accept</Text>
                        </LinearGradient>
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            ) : hasJoined(selectedPlan) ? (
              <View style={styles.joinedBox}>
                <Ionicons name="checkmark-circle" size={18} color={T.green} />
                <Text style={styles.joinedText}>You're in this trip!</Text>
              </View>
            ) : hasRequested(selectedPlan) ? (
              <View style={styles.pendingBox}>
                <Ionicons name="time-outline" size={16} color={T.amber} />
                <Text style={styles.pendingText}>Request pending with organizer</Text>
              </View>
            ) : (
              <Pressable onPress={() => handleRequestJoin(selectedPlan.id)}>
                <LinearGradient colors={[...T.cta]} style={styles.joinBtn}>
                  <Ionicons name="airplane" size={16} color="#fff" />
                  <Text style={styles.joinText}>Request to join</Text>
                </LinearGradient>
              </Pressable>
            )}
          </ScrollView>
        ) : null}
      </CustomBottomSheet>

      <TabBar dark={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  orbA: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(167,139,250,0.28)",
  },
  orbB: {
    position: "absolute",
    top: 280,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(244,114,182,0.14)",
  },
  orbC: {
    position: "absolute",
    bottom: 200,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(125,211,252,0.12)",
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 6,
    zIndex: 5,
  },
  roundBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(228,223,240,0.9)",
    // Soft edge only — heavy top shadow was flashing during Travel → Profile fade
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bellBadge: {
    position: "absolute",
    top: 9,
    right: 9,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  bellBadgeText: { color: "#fff", fontSize: 9, fontFamily: VibeFonts.bold },

  scroll: { paddingHorizontal: 20 },

  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 2,
    minHeight: 120,
  },
  heroLeft: { flex: 1.2, paddingRight: 6, zIndex: 2 },
  hiText: {
    fontSize: 14,
    fontFamily: VibeFonts.semiBold,
    color: T.muted,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.6,
    lineHeight: 29,
  },
  travelWord: {
    fontFamily: VibeFonts.extraBold,
    fontStyle: "italic",
    color: T.purple,
    fontSize: 26,
  },
  heroTitleRest: {
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  underlineWrap: { marginTop: 1, marginBottom: 8, width: 72 },
  scriptStroke: {
    height: 3,
    borderRadius: 3,
    transform: [{ rotate: "-2deg" }],
  },
  heroSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    lineHeight: 16,
    maxWidth: 200,
  },

  heroRight: {
    width: 120,
    height: 128,
    alignItems: "center",
    justifyContent: "center",
  },
  flightArc: {
    position: "absolute",
    top: 18,
    left: -6,
    width: 70,
    height: 54,
    borderWidth: 1.5,
    borderColor: "rgba(139,92,246,0.4)",
    borderStyle: "dashed",
    borderRadius: 40,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    transform: [{ rotate: "-20deg" }],
  },
  planeWrap: { position: "absolute", top: 6, left: 2, zIndex: 5 },
  planeBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  blobOuter: {
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  blobRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  blobInner: {
    width: 103,
    height: 103,
    borderRadius: 52,
    overflow: "hidden",
    backgroundColor: "#ddd",
  },
  blobImg: { width: "100%", height: "100%" },
  balloon1: { position: "absolute", top: -2, right: 8, fontSize: 13, zIndex: 4 },
  balloon2: { position: "absolute", bottom: 6, left: 0, fontSize: 11, zIndex: 4 },
  sparkle1: {
    position: "absolute",
    top: 40,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F9A8D4",
  },
  sparkle2: {
    position: "absolute",
    bottom: 36,
    right: 16,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#C4B5FD",
  },

  searchWrap: {
    marginBottom: 12,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchBlur: { borderRadius: 24, overflow: "hidden" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 24,
    paddingLeft: 8,
    paddingRight: 5,
    paddingVertical: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    paddingVertical: 8,
  },
  searchBtn: { borderRadius: 18, overflow: "hidden" },
  searchBtnGrad: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  catRow: { gap: 10, paddingBottom: 12, paddingRight: 8 },
  catItem: { width: 64, alignItems: "center" },
  catCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    shadowColor: "#1A1F36",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  catActiveRing: {
    padding: 2,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(139,92,246,0.35)",
    marginBottom: 3,
  },
  catCircleActive: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  catEmoji: { fontSize: 20 },
  catLabel: {
    fontSize: 9,
    fontFamily: VibeFonts.semiBold,
    color: T.muted,
    textAlign: "center",
    lineHeight: 12,
  },
  catLabelActive: { color: T.purpleDeep, fontFamily: VibeFonts.bold },

  promo: {
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    marginBottom: 16,
    overflow: "hidden",
    minHeight: 112,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  promoGlow: {
    position: "absolute",
    right: -20,
    top: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  promoLeft: { flex: 1.15, justifyContent: "center", zIndex: 2 },
  promoEyebrow: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 4,
  },
  promoTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    lineHeight: 21,
    marginBottom: 10,
  },
  promoAdventure: {
    fontFamily: VibeFonts.extraBold,
    fontStyle: "italic",
    color: "#FDE68A",
    fontSize: 17,
  },
  promoBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingLeft: 12,
    paddingRight: 5,
    paddingVertical: 7,
    borderRadius: 20,
  },
  promoBtnText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.purpleDeep,
  },
  promoArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  promoArt: {
    width: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  promo3d: { width: 88, height: 88, marginRight: -6 },
  promoFloatCam: {
    position: "absolute",
    top: 4,
    right: 2,
    fontSize: 16,
  },
  promoFloatBag: {
    position: "absolute",
    bottom: 6,
    left: 0,
    fontSize: 15,
  },

  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.3,
  },
  seeAll: { fontSize: 12, fontFamily: VibeFonts.bold, color: T.purple },

  tripsRow: { gap: 12, paddingBottom: 16, paddingRight: 8 },
  tripCard: {
    width: CARD_W,
    backgroundColor: T.card,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#4C1D95",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  tripImgWrap: { height: 118, position: "relative" },
  tripImg: { width: "100%", height: "100%" },
  trendingPill: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  trendingText: {
    color: "#fff",
    fontSize: 8,
    fontFamily: VibeFonts.bold,
    letterSpacing: 0.5,
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tripBody: { padding: 10 },
  tripTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: T.ink,
    letterSpacing: -0.2,
  },
  tripMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  tripDates: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },
  tripSeats: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.pink,
    marginTop: 4,
  },
  avatarStack: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  stackAv: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  stackMore: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  stackMoreText: { fontSize: 8, fontFamily: VibeFonts.bold, color: T.purpleDeep },

  emptyTrips: {
    width: SCREEN_W * 0.7,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTripsText: { fontSize: 13, fontFamily: VibeFonts.medium, color: T.muted },
  emptyCreate: {
    marginTop: 8,
    backgroundColor: T.purple,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
  },
  emptyCreateText: { color: "#fff", fontFamily: VibeFonts.bold, fontSize: 13 },

  whyHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  whyArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  whyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  whyCard: {
    borderRadius: 18,
    padding: 12,
    minHeight: 96,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  whyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  whyTitle: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.ink,
    lineHeight: 16,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22,18,43,0.5)",
    zIndex: 100,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: T.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 22,
    paddingBottom: 40,
    maxHeight: SCREEN_H * 0.82,
    zIndex: 101,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(26,21,32,0.12)",
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    marginBottom: 14,
  },
  detailCover: {
    width: "100%",
    height: 160,
    borderRadius: 20,
    marginBottom: 14,
  },
  detailTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    marginBottom: 8,
  },
  detailMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  detailMeta: { fontSize: 13, fontFamily: VibeFonts.semiBold, color: T.purple },
  detailDesc: {
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    lineHeight: 20,
    marginBottom: 8,
  },
  detailOrg: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.faint,
    marginBottom: 14,
  },
  membersTitle: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: T.ink,
    marginBottom: 8,
  },
  membersWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  memberPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.softPurple,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  memberText: { fontSize: 12, fontFamily: VibeFonts.medium, color: T.ink },
  ownerPanel: { marginTop: 18 },
  reqTitle: { fontSize: 13, fontFamily: VibeFonts.bold, color: T.ink, marginBottom: 10 },
  noReq: { fontSize: 12, fontFamily: VibeFonts.medium, color: T.faint },
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    backgroundColor: T.bg,
    borderRadius: 14,
    padding: 10,
  },
  reqAvatar: { width: 36, height: 36, borderRadius: 18 },
  reqName: { flex: 1, fontSize: 13, fontFamily: VibeFonts.semiBold, color: T.ink },
  acceptBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  acceptText: { color: "#fff", fontSize: 12, fontFamily: VibeFonts.bold },
  pendingBox: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FCD34D",
    padding: 14,
    borderRadius: 14,
  },
  pendingText: { fontSize: 13, fontFamily: VibeFonts.semiBold, color: T.amber, flex: 1 },
  joinedBox: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#86EFAC",
    padding: 14,
    borderRadius: 14,
  },
  joinedText: { fontSize: 13, fontFamily: VibeFonts.bold, color: T.green },
  joinBtn: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
  },
  joinText: { color: "#fff", fontSize: 15, fontFamily: VibeFonts.bold },
});
