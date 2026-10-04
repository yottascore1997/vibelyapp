import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Modal,
  TextInput,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  CITIES,
  CITY_BY_ID,
  CityId,
} from "../constants/mapEvents";
import { useAuth } from "../context/AuthContext";
import { useMatches } from "../context/MatchesContext";
import { usePlans } from "../context/PlansContext";
import { api } from "../services/api";
import { VibeFonts } from "../constants/vibeTheme";
import TabBar from "../components/TabBar";

const { width: SCREEN_W } = Dimensions.get("window");
const CITY_STORAGE_KEY = "@hangora_map_city";

// Home Page icons
const chaiIcon = require("../assets/icons/chai.png");
const coffeeIcon = require("../assets/icons/coffee.png");
const beerIcon = require("../assets/icons/beer.png");
const movieIcon = require("../assets/icons/movie.png");
const walkIcon = require("../assets/icons/walk.png");
const cokeIcon = require("../assets/icons/dietcoke.png");

// Figma Color Palette
const T = {
  bg: "#050811",
  card: "#0C1322",
  cardElevated: "#0E1729",
  ink: "#FFFFFF",
  muted: "#8E9CAE",
  faint: "#64748B",
  border: "rgba(255, 255, 255, 0.08)",
  borderActive: "rgba(210, 253, 56, 0.4)",
  lime: "#D2FD38",
  cyan: "#22D3EE",
  pink: "#EC4899",
  hotPink: "#FF136A",
  mint: "#2EFA9E",
  purple: "#8B5CF6",
  orange: "#FB923C",
};

// 10 Vibe Activities for 'What’s the move?' sheet
const VIBES = [
  { id: "tea", label: "Tea", image: chaiIcon, icon: "tea" as const, emoji: "☕", color: "#22D3EE" },
  { id: "coffee", label: "Coffee", image: coffeeIcon, icon: "coffee" as const, emoji: "☕", color: "#F59E0B" },
  { id: "beer", label: "Beer", image: beerIcon, icon: "beer" as const, emoji: "🍺", color: "#FACC15" },
  { id: "drinks", label: "Drinks", ionIcon: "wine" as const, icon: "glass-cocktail" as const, emoji: "🍸", color: "#EC4899" },
  { id: "biryani", label: "Biryani", icon: "pot-steam" as const, emoji: "🍲", color: "#F43F5E" },
  { id: "smoke", label: "Smoke", ionIcon: "leaf" as const, icon: "leaf" as const, emoji: "🚬", color: "#2EFA9E" },
  { id: "food", label: "Food", ionIcon: "restaurant" as const, icon: "silverware-fork-knife" as const, emoji: "🍴", color: "#EF4444" },
  { id: "walk", label: "Walk", image: walkIcon, icon: "shoe-sneaker" as const, emoji: "👟", color: "#38BDF8" },
  { id: "coke", label: "Diet Coke", image: cokeIcon, icon: "cup" as const, emoji: "🥤", color: "#FB7185" },
  { id: "movies", label: "Movies", image: movieIcon, icon: "movie-open" as const, emoji: "🎬", color: "#A855F7" },
];

// Time Options for 'What’s the move?' sheet
const TIME_OPTIONS = [
  { id: "now", title: "Now", sub: "Instant", icon: "lightning-bolt" as const, color: "#22D3EE" },
  { id: "30min", title: "+30 Min", sub: "~ 00:31", icon: "clock-outline" as const, color: "#22D3EE" },
  { id: "1hr", title: "+1 Hr", sub: "~ 01:01", icon: "alarm" as const, color: "#EC4899" },
  { id: "6pm", title: "6 PM", sub: "Today", icon: "weather-sunny" as const, color: "#FACC15" },
];

export default function EventsMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { matches } = useMatches();
  const { createPlan, refresh: refreshPlans } = usePlans();

  const [cityId, setCityId] = useState<CityId>("kolkata");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [likedCards, setLikedCards] = useState<Record<string, boolean>>({});
  const [joinedCards, setJoinedCards] = useState<Record<string, boolean>>({});
  const [nearbyPeople, setNearbyPeople] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    api.getNearbyPeople({ maxKm: 30, limit: 10 })
      .then((people) => {
        if (mounted && people && people.length > 0) {
          setNearbyPeople(people);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [cityId]);

  // Load saved city
  useEffect(() => {
    AsyncStorage.getItem(CITY_STORAGE_KEY).then((saved) => {
      if (saved && (saved in CITY_BY_ID)) {
        setCityId(saved as CityId);
      }
    }).catch(() => {});
  }, []);

  const handleSelectCity = (id: CityId) => {
    setCityId(id);
    AsyncStorage.setItem(CITY_STORAGE_KEY, id).catch(() => {});
    setShowCityPicker(false);
  };

  const city = CITY_BY_ID[cityId] || CITY_BY_ID.kolkata;

  // Bottom Sheet ('What’s the move?') state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<{
    id?: string;
    name: string;
    handle: string;
    avatar: any;
  }>({
    name: "Match",
    handle: "@hangora.match",
    avatar: require("../assets/events-map/figma_aanya_avatar.png"),
  });
  const [selectedVibe, setSelectedVibe] = useState("smoke");
  const [selectedTime, setSelectedTime] = useState("30min");
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);

  useEffect(() => {
    if (matches && matches.length > 0) {
      const first = matches[0];
      setSelectedFriend({
        id: first.id,
        name: first.name,
        handle: `@${first.name.toLowerCase().replace(/\s+/g, "")}`,
        avatar: first.avatarUrl
          ? { uri: first.avatarUrl }
          : require("../assets/events-map/figma_aanya_avatar.png"),
      });
    }
  }, [matches]);

  // Event Creation Modal state
  const [showEventCreateModal, setShowEventCreateModal] = useState(false);
  const [showSurpriseModal, setShowSurpriseModal] = useState(false);

  // Gamified Jar Progress & Animation
  const [hangoutCount, setHangoutCount] = useState(2);
  const jarScale = useSharedValue(1);

  const jarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: jarScale.value }],
  }));

  const incrementHangoutProgress = () => {
    jarScale.value = withSequence(
      withTiming(0.94, { duration: 90 }),
      withSpring(1.06, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    setHangoutCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setTimeout(() => setShowSurpriseModal(true), 400);
      }
      return next > 5 ? 1 : next;
    });
  };

  const handleCreateHangoutAction = () => {
    router.push("/create-plan");
  };

  const openMoveModal = (name: string, handle: string, avatar: any, id?: string) => {
    setSelectedFriend({ name, handle, avatar, id });
    setShowMoveModal(true);
  };

  const toggleLike = (key: string) => {
    setLikedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleJoin = (key: string) => {
    setJoinedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentVibe = VIBES.find((v) => v.id === selectedVibe) || VIBES[5];

  const filteredCities = CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.state.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Radiant Background Gradient matching Figma */}
      <LinearGradient
        colors={["#0C1628", "#060A14", "#020408"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Main Scrollable View */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) + 95 },
        ]}
      >
        {/* 1. Top App Bar Header */}
        <View style={styles.topHeader}>
          {/* Back Button */}
          <Pressable style={styles.circleBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </Pressable>

          {/* Centered Title & Location Pill */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Events <Text style={{ color: T.lime }}>Map</Text>
            </Text>

            {/* Location Pill */}
            <Pressable
              style={styles.cityPill}
              onPress={() => setShowCityPicker(true)}
            >
              <Text style={{ fontSize: 11, marginRight: 3 }}>📍</Text>
              <Text style={styles.cityNameText}>{city.name}</Text>
              <Ionicons name="chevron-down" size={12} color="#38BDF8" style={{ marginLeft: 3 }} />
            </Pressable>
          </View>

          {/* Right Camera Button */}
          <Pressable style={styles.circleBtn} onPress={() => router.push("/create-plan")}>
            <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* 2. Top Live Banner Card: Kolkata Hangout Live */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.liveBannerCard}>
          <Image
            source={require("../assets/events-map/figma_liveBannerThumb.png")}
            style={styles.bannerThumb}
          />
          <View style={styles.bannerInfo}>
            <View style={styles.bannerTitleRow}>
              <Text style={styles.bannerTitle}>{city.name} Hangout Live</Text>
              <View style={styles.liveTag}>
                <Text style={styles.liveTagText}>LIVE</Text>
              </View>
            </View>
            <View style={styles.bannerSubRow}>
              <View style={styles.pulsingDot} />
              <Text style={styles.bannerSubText}>3 Live Hangouts  •  12 People Nearby</Text>
            </View>
          </View>

          <Pressable
            style={styles.originalVibeBtn}
            onPress={() => router.push("/hangout")}
          >
            <Ionicons name="musical-notes" size={13} color="#22D3EE" style={{ marginRight: 4 }} />
            <Text style={styles.originalVibeText}>Original Vibe</Text>
          </Pressable>
        </Animated.View>

        {/* 3. The Gamified Centerpiece: Neon Blue Water Jar & Glossy Thermometer */}
        <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.jarSectionCard}>
          <View style={styles.jarRowContainer}>
            {/* Left: Glowing Glass Water Jar (Exact Figma Asset) */}
            <Pressable
              onPress={incrementHangoutProgress}
              style={styles.jarWrap}
            >
              <Animated.View style={[styles.jarInner, jarAnimatedStyle]}>
                <Image
                  source={require("../assets/events-map/figma_jar.png")}
                  style={styles.jarImage}
                  resizeMode="contain"
                />
              </Animated.View>
              {/* Cyan glow puddle under jar */}
              <View style={styles.jarGlowPuddle} />
            </Pressable>

            {/* Right: Glossy Thermometer with 5 Emotion Milestones (Exact Figma Asset) */}
            <View style={styles.thermometerWrap}>
              <Image
                source={require("../assets/events-map/figma_thermometer.png")}
                style={styles.thermometerImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* 4. Reward / Surprise Card */}
          <Pressable
            style={styles.surpriseCard}
            onPress={() => setShowSurpriseModal(true)}
          >
            <Image
              source={require("../assets/events-map/figma_giftBox.png")}
              style={styles.surpriseBoxImg}
              resizeMode="contain"
            />
            <View style={styles.surpriseInfoGroup}>
              <Text style={styles.surprisePreLabel}>FILL THE JAR TO GET A</Text>
              <Text style={styles.surpriseTitle}>Surprise!</Text>
              <Text style={styles.surpriseDescription}>
                Create more hangouts and unlock something special.
              </Text>
            </View>
          </Pressable>

          {/* 5. Full-width 'Create a Hangout ➔' Button */}
          <Pressable
            style={styles.createHangoutBtn}
            onPress={handleCreateHangoutAction}
          >
            <LinearGradient
              colors={["#D2FD38", "#00F0FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createHangoutGrad}
            >
              <Text style={styles.createHangoutBtnText}>Create a Hangout</Text>
              <Ionicons name="arrow-forward" size={19} color="#000000" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* 6. 'Pull up ✨' Section */}
        <Animated.View entering={FadeInDown.delay(180).duration(450)} style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Pressable
              hitSlop={10}
              onPress={() => {
                if (matches.length > 0) {
                  const m = matches[0];
                  openMoveModal(
                    m.name,
                    `@${m.name.toLowerCase().replace(/\s+/g, "")}`,
                    m.avatarUrl
                      ? { uri: m.avatarUrl }
                      : require("../assets/events-map/figma_aanya_avatar.png"),
                    m.id
                  );
                } else {
                  router.push("/invite-friends");
                }
              }}
            >
              <Text style={styles.sectionTitle}>Pull up ✨</Text>
            </Pressable>
            <Pressable
              hitSlop={10}
              onPress={() => router.push("/invite-friends")}
            >
              <Text style={styles.sectionLink}>Invite Matches →</Text>
            </Pressable>
          </View>

          <View style={styles.pullUpCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pullUpRow}>
              {/* 1. Add button */}
              <Pressable
                style={styles.pullUpItem}
                hitSlop={6}
                onPress={() => router.push("/invite-friends")}
              >
                <View style={styles.pickCircle}>
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.pullUpName}>Add</Text>
              </Pressable>

              {/* Real Matches Only */}
              {matches.map((m) => {
                const avatarSource = m.avatarUrl
                  ? { uri: m.avatarUrl }
                  : require("../assets/events-map/figma_aanya_avatar.png");
                const handle = `@${m.name.toLowerCase().replace(/\s+/g, "")}`;
                return (
                  <Pressable
                    key={m.id}
                    style={styles.pullUpItem}
                    onPress={() => openMoveModal(m.name, handle, avatarSource, m.id)}
                  >
                    <Image source={avatarSource} style={styles.avatarImg} />
                    <Text style={styles.pullUpName} numberOfLines={1}>
                      {m.name.split(" ")[0]}
                    </Text>
                  </Pressable>
                );
              })}

              {matches.length === 0 && (
                <Pressable
                  style={styles.pullUpItem}
                  onPress={() => router.push("/(tabs)/vibes")}
                >
                  <View
                    style={[
                      styles.avatarImg,
                      {
                        backgroundColor: "#1E293B",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <Ionicons name="sparkles" size={18} color="#D4F72C" />
                  </View>
                  <Text style={styles.pullUpName}>Find Match</Text>
                </Pressable>
              )}

              {/* More button */}
              <Pressable
                style={styles.pullUpItem}
                onPress={() => router.push("/invite-friends")}
              >
                <View style={styles.moreCircle}>
                  <Ionicons name="ellipsis-horizontal" size={20} color="#8E9CAE" />
                </View>
                <Text style={styles.pullUpName}>More</Text>
              </Pressable>
            </ScrollView>
          </View>
        </Animated.View>

        {/* 7. Office Gang is buzzing Card */}
        <Animated.View entering={FadeInDown.delay(240).duration(450)}>
          <Pressable
            style={styles.buzzingCard}
            onPress={() => openMoveModal("Office Gang", "@office.buzz", require("../assets/events-map/office-gang-thumb.png"))}
          >
            <Image
              source={require("../assets/events-map/office-gang-thumb.png")}
              style={styles.buzzingThumb}
            />
            <View style={styles.buzzingInfo}>
              <Text style={styles.buzzingTitle}>Office Gang is buzzing</Text>
              <Text style={styles.buzzingSub}>Hangout spot active right now</Text>
            </View>

            <View style={styles.buzzingLivePill}>
              <View style={styles.buzzingGreenDot} />
              <Text style={styles.buzzingLiveText}>LIVE</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" style={{ marginLeft: 6 }} />
          </Pressable>
        </Animated.View>

        {/* 8. Kabir Social Status Update Card (Exact Clean Figma Layout) */}
        <Animated.View entering={FadeInDown.delay(300).duration(450)}>
          <Pressable
            style={styles.socialPostCard}
            onPress={() => openMoveModal("Kabir", "@kabir.live", require("../assets/events-map/kabir-hd.jpg"))}
          >
            <Image
              source={require("../assets/events-map/kabir-hd.jpg")}
              style={styles.postAvatar}
            />

            <View style={styles.postInfo}>
              <View style={styles.postNameRow}>
                <Text style={styles.postName}>Kabir</Text>
                <Ionicons name="checkmark-circle" size={14} color="#38BDF8" style={{ marginLeft: 4 }} />
                <View style={styles.postTimePill}>
                  <Text style={styles.postTimeText}>10m ago</Text>
                </View>
              </View>
              <Text style={styles.postMessage}>terrace in 10? ☕</Text>
            </View>

            <Pressable
              style={styles.postMenuBtn}
              onPress={() => openMoveModal("Kabir", "@kabir.live", require("../assets/events-map/kabir-hd.jpg"))}
              hitSlop={8}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#64748B" />
            </Pressable>
          </Pressable>
        </Animated.View>

        {/* 9. Nearby Hangouts Section */}
        <Animated.View entering={FadeInDown.delay(360).duration(450)} style={{ marginTop: 22 }}>
          <View style={styles.nearbyHeaderRow}>
            <View style={styles.nearbyTitleGroup}>
              <View style={styles.pinkDot} />
              <Text style={styles.nearbyTitle}>Nearby Hangouts</Text>
            </View>
            <Pressable onPress={() => router.push("/(tabs)")}>
              <View style={styles.seeAllGroup}>
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={13} color="#8E9CAE" />
              </View>
            </Pressable>
          </View>

          {/* Two Side-By-Side Hangout Cards */}
          <View style={styles.cardsRow}>
            {/* Card 1: Coffee & Good Talks */}
            <View style={styles.hangoutCard}>
              <View style={styles.cardImageContainer}>
                <Image
                  source={require("../assets/home/nearby-coffee.png")}
                  style={styles.cardImg}
                />
                {/* Distance Badge */}
                <View style={styles.cardDistanceBadge}>
                  <Text style={{ fontSize: 10, marginRight: 2 }}>📍</Text>
                  <Text style={styles.cardDistanceText}>2.5 km</Text>
                </View>

                {/* Heart Button */}
                <Pressable
                  style={styles.cardHeartBtn}
                  onPress={() => toggleLike("coffee")}
                  hitSlop={6}
                >
                  <Ionicons
                    name={likedCards["coffee"] ? "heart" : "heart-outline"}
                    size={15}
                    color={likedCards["coffee"] ? "#FF136A" : "#FFFFFF"}
                  />
                </Pressable>

                {/* Attendee Avatar Stack */}
                <View style={styles.attendeeStack}>
                  <Image source={require("../assets/events-map/figma_aanya_avatar.png")} style={styles.attendeeAvatar} />
                  <Image source={require("../assets/events-map/figma_rohan_avatar.png")} style={[styles.attendeeAvatar, styles.attendeeAvatarOverlap]} />
                  <Image source={require("../assets/events-map/figma_sneha_avatar.png")} style={[styles.attendeeAvatar, styles.attendeeAvatarOverlap]} />
                  <Text style={styles.attendeeCountText}>+3</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Coffee & Good Talks
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  Today, 7:00 PM • Brew & Blush
                </Text>

                <View style={styles.tagChipsRow}>
                  <View style={[styles.tagChip, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
                    <Text style={[styles.tagChipText, { color: "#FACC15" }]}>☕ Coffee</Text>
                  </View>
                  <View style={[styles.tagChip, { backgroundColor: "rgba(34, 211, 238, 0.12)", borderColor: "rgba(34, 211, 238, 0.4)", borderWidth: 1, marginLeft: 5 }]}>
                    <Text style={[styles.tagChipText, { color: "#22D3EE" }]}>🎯 Chill Vibes</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Card 2: Beer & Better People */}
            <View style={styles.hangoutCard}>
              <View style={styles.cardImageContainer}>
                <Image
                  source={require("../assets/home/nearby-beer.png")}
                  style={styles.cardImg}
                />
                {/* Distance Badge */}
                <View style={styles.cardDistanceBadge}>
                  <Text style={{ fontSize: 10, marginRight: 2 }}>📍</Text>
                  <Text style={styles.cardDistanceText}>1.8 km</Text>
                </View>

                {/* Heart Button */}
                <Pressable
                  style={styles.cardHeartBtn}
                  onPress={() => toggleLike("beer")}
                  hitSlop={6}
                >
                  <Ionicons
                    name={likedCards["beer"] ? "heart" : "heart-outline"}
                    size={15}
                    color={likedCards["beer"] ? "#FF136A" : "#FFFFFF"}
                  />
                </Pressable>

                {/* Attendee Avatar Stack */}
                <View style={styles.attendeeStack}>
                  <Image source={require("../assets/events-map/figma_rohan_avatar.png")} style={styles.attendeeAvatar} />
                  <Image source={require("../assets/events-map/figma_sneha_avatar.png")} style={[styles.attendeeAvatar, styles.attendeeAvatarOverlap]} />
                  <Image source={require("../assets/events-map/kabir-hd.jpg")} style={[styles.attendeeAvatar, styles.attendeeAvatarOverlap]} />
                  <Text style={styles.attendeeCountText}>+5</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Beer & Better People
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  Today, 8:30 PM • The Local Bar
                </Text>

                <View style={styles.tagChipsRow}>
                  <View style={[styles.tagChip, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
                    <Text style={[styles.tagChipText, { color: "#FACC15" }]}>🍺 Beer</Text>
                  </View>

                  <Pressable
                    style={styles.joinBtnWrap}
                    onPress={() => toggleJoin("beer")}
                  >
                    <LinearGradient
                      colors={joinedCards["beer"] ? ["#10B981", "#059669"] : ["#8B5CF6", "#EC4899"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.joinBtnGrad}
                    >
                      <Text style={styles.joinBtnText}>
                        {joinedCards["beer"] ? "✓ Joined" : "✨ Join Now"}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Floating Bottom TabBar with Elevated Center 'Events Map' */}
      <TabBar dark={true} />

      {/* ===================== MODALS ===================== */}

      {/* City Picker Modal */}
      <Modal
        visible={showCityPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <View style={styles.cityModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCityPicker(false)} />
          <View style={styles.cityPickerCard}>
            <View style={styles.cityPickerHeader}>
              <Text style={styles.cityPickerTitle}>Select City</Text>
              <Pressable onPress={() => setShowCityPicker(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color="#8E9CAE" />
              </Pressable>
            </View>

            <View style={styles.citySearchBox}>
              <Ionicons name="search" size={16} color="#8E9CAE" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.citySearchInput}
                placeholder="Search city or state..."
                placeholderTextColor="#64748B"
                value={citySearch}
                onChangeText={setCitySearch}
              />
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {filteredCities.map((c) => {
                const isSelected = c.id === cityId;
                return (
                  <Pressable
                    key={c.id}
                    style={[styles.cityRow, isSelected && styles.cityRowActive]}
                    onPress={() => handleSelectCity(c.id)}
                  >
                    <Text style={{ fontSize: 18, marginRight: 10 }}>{c.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cityName, isSelected && { color: T.lime }]}>{c.name}</Text>
                      <Text style={styles.cityState}>{c.state}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={T.lime} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Surprise Gift Unlock Modal */}
      <Modal
        visible={showSurpriseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSurpriseModal(false)}
      >
        <View style={styles.eventModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSurpriseModal(false)} />
          <Animated.View entering={ZoomIn.duration(300)} style={styles.surpriseModalCard}>
            <Image
              source={require("../assets/events-map/figma_giftBox.png")}
              style={{ width: 120, height: 100, marginBottom: 12 }}
              resizeMode="contain"
            />
            <Text style={styles.surpriseModalHeading}>You Unlocked a Surprise!</Text>
            <Text style={styles.surpriseModalSub}>
              Congratulations! Your hangout jar is full. You've earned free VIP access to the next exclusive rooftop hangout!
            </Text>
            <Pressable
              style={styles.surpriseClaimBtn}
              onPress={() => {
                setShowSurpriseModal(false);
                router.push("/hangout");
              }}
            >
              <LinearGradient
                colors={["#D2FD38", "#00F0FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.surpriseClaimGrad}
              >
                <Text style={styles.surpriseClaimText}>Claim VIP Pass</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* 'What’s the move?' Bottom Sheet Modal */}
      <Modal
        visible={showMoveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoveModal(false)}
      >
        <View style={styles.moveModalOverlay}>
          <Pressable
            style={styles.moveModalDismissArea}
            onPress={() => setShowMoveModal(false)}
          />

          <View
            style={[
              styles.moveSheetCard,
              { paddingBottom: Math.max(insets.bottom, 16) + 12 },
            ]}
          >
            <View style={styles.sheetHandle} />

            {/* Header: 'hang with [Name]' & Close Button */}
            <View style={styles.moveHeaderRow}>
              <View style={styles.moveUserGroup}>
                <Image source={selectedFriend.avatar} style={styles.moveAvatarCircle} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.moveHangWith}>
                    hang with <Text style={{ color: T.lime }}>{selectedFriend.name}</Text>
                  </Text>
                  <Text style={styles.moveHandle}>{selectedFriend.handle}</Text>
                </View>
              </View>

              <Pressable
                style={styles.moveCloseBtn}
                onPress={() => setShowMoveModal(false)}
              >
                <Ionicons name="close" size={18} color="#8E9CAE" />
              </Pressable>
            </View>

            {/* Main Title: What’s the move? */}
            <Text style={styles.moveTitle}>
              What’s the <Text style={{ color: T.lime }}>move?</Text>
            </Text>
            <Text style={styles.moveSubtitle}>Pick a vibe and set the details.</Text>

            {/* Step 1: Activities */}
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Activities</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.stepLink}>Slide for more →</Text>
            </View>

            {/* 2x5 Vibe Grid */}
            <View style={styles.vibeGrid}>
              {VIBES.map((v) => {
                const isSelected = selectedVibe === v.id;
                return (
                  <Pressable
                    key={v.id}
                    style={[styles.vibeCard, isSelected && styles.vibeCardSelected]}
                    onPress={() => setSelectedVibe(v.id)}
                  >
                    {v.image ? (
                      <Image
                        source={v.image}
                        style={styles.vibeCardCustomIcon}
                        resizeMode="contain"
                      />
                    ) : v.ionIcon ? (
                      <Ionicons
                        name={v.ionIcon as any}
                        size={22}
                        color={isSelected ? T.cyan : v.color}
                        style={{ marginBottom: 4 }}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={v.icon as any}
                        size={22}
                        color={isSelected ? T.cyan : v.color}
                        style={{ marginBottom: 4 }}
                      />
                    )}
                    <Text
                      style={[styles.vibeCardText, isSelected && styles.vibeCardTextSelected]}
                      numberOfLines={1}
                    >
                      {v.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Step 2: When? */}
            <View style={[styles.stepHeaderRow, { marginTop: 18 }]}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>When?</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.stepLink}>Instant or Scheduled</Text>
            </View>

            {/* 4 Time Cards */}
            <View style={styles.timeCardsRow}>
              {TIME_OPTIONS.map((t) => {
                const isSelected = selectedTime === t.id;
                return (
                  <Pressable
                    key={t.id}
                    style={[styles.timeCard, isSelected && styles.timeCardSelected]}
                    onPress={() => setSelectedTime(t.id)}
                  >
                    <MaterialCommunityIcons
                      name={t.icon as any}
                      size={20}
                      color={isSelected ? T.cyan : t.color}
                      style={{ marginBottom: 4 }}
                    />
                    <Text style={[styles.timeCardTitle, isSelected && styles.timeCardTitleSelected]}>
                      {t.title}
                    </Text>
                    <Text style={[styles.timeCardSub, isSelected && { color: T.mint }]}>
                      {t.sub}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Step 3: Invite (Optional) */}
            <View style={[styles.stepHeaderRow, { marginTop: 18 }]}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>
                Invite Matches <Text style={{ color: T.muted, fontSize: 13, fontFamily: VibeFonts.regular }}>(Optional)</Text>
              </Text>
            </View>

            {/* Invite Friends Row - ONLY REAL MATCHES */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inviteRow}>
              <Pressable style={styles.inviteItem} onPress={() => router.push("/invite-friends")}>
                <View style={styles.addPeopleCircle}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.inviteName}>Add People</Text>
              </Pressable>

              {matches.map((m) => {
                const isInvited = invitedFriends.includes(m.id);
                const avatarSource = m.avatarUrl
                  ? { uri: m.avatarUrl }
                  : require("../assets/events-map/figma_aanya_avatar.png");
                return (
                  <Pressable
                    key={m.id}
                    style={styles.inviteItem}
                    onPress={() => {
                      setInvitedFriends((prev) =>
                        prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id]
                      );
                    }}
                  >
                    <Image
                      source={avatarSource}
                      style={[
                        styles.inviteAvatarImg,
                        isInvited && { borderWidth: 2, borderColor: T.cyan },
                      ]}
                    />
                    <Text style={styles.inviteName} numberOfLines={1}>
                      {m.name.split(" ")[0]}
                    </Text>
                  </Pressable>
                );
              })}

              {matches.length === 0 && (
                <View style={{ justifyContent: "center", paddingHorizontal: 12 }}>
                  <Text style={{ color: T.muted, fontSize: 12, fontFamily: VibeFonts.medium }}>
                    No matches yet to invite
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Big Action CTA Button: ask [Name] for [vibe] */}
            <Pressable
              style={styles.moveCtaBtnWrap}
              onPress={async () => {
                setShowMoveModal(false);
                const timeText =
                  selectedTime === "now"
                    ? "NOW ⚡"
                    : selectedTime === "30min"
                    ? "In 30 mins"
                    : "6 PM Today";

                if (selectedFriend?.id) {
                  try {
                    await api.sendInvite({
                      receiverId: selectedFriend.id,
                      activityName: currentVibe.label,
                      activityEmoji: currentVibe.emoji,
                      timeLabel: timeText,
                    });
                  } catch (err) {
                    console.warn("[events-map] failed to send invite to selected:", err);
                  }
                }

                for (const friendId of invitedFriends) {
                  if (friendId && friendId !== selectedFriend?.id) {
                    try {
                      await api.sendInvite({
                        receiverId: friendId,
                        activityName: currentVibe.label,
                        activityEmoji: currentVibe.emoji,
                        timeLabel: timeText,
                      });
                    } catch (err) {
                      console.warn("[events-map] failed to send invite to friend:", err);
                    }
                  }
                }

                setTimeout(() => setShowEventCreateModal(true), 280);
              }}
            >
              <LinearGradient
                colors={["#FFF04B", "#2EFA9E", "#00FFA3"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.moveCtaGrad}
              >
                <Ionicons name="paper-plane" size={17} color="#0A0F1D" />
                <Text style={styles.moveCtaText}>
                  ask {selectedFriend.name} for {currentVibe.label.toLowerCase()} {currentVibe.emoji}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#0A0F1D" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Event Broadcast Confirmation Modal */}
      <Modal
        visible={showEventCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEventCreateModal(false)}
      >
        <View style={styles.eventModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowEventCreateModal(false)} />
          <Animated.View entering={ZoomIn.duration(280)} style={styles.eventCreateCard}>
            <Pressable style={styles.eventModalCloseBtn} onPress={() => setShowEventCreateModal(false)}>
              <Ionicons name="close" size={18} color="#8E9CAE" />
            </Pressable>

            <View style={styles.eventHeroBadge}>
              <Text style={{ fontSize: 36 }}>🔥</Text>
            </View>

            <View style={styles.eventTagPill}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.eventTagPillText}>
                INVITE SENT TO {selectedFriend.name.toUpperCase()}! 🚀
              </Text>
            </View>

            <Text style={styles.eventModalTitle}>
              Turn this vibe into a <Text style={{ color: T.lime }}>Live Event!</Text>
            </Text>

            <Text style={styles.eventModalSubtitle}>
              {selectedFriend.name} just got your ping for{" "}
              <Text style={{ color: "#FFFFFF", fontFamily: VibeFonts.bold }}>
                {currentVibe.label} {currentVibe.emoji}
              </Text>
              . There are 18 people nearby looking for the same vibe right now!
            </Text>

            <Pressable
              style={styles.broadcastActionBtn}
              onPress={() => {
                setShowEventCreateModal(false);
                incrementHangoutProgress();
              }}
            >
              <LinearGradient
                colors={["#D2FD38", "#00F0FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.broadcastActionGrad}
              >
                <Text style={styles.broadcastActionText}>Broadcast to Radar</Text>
                <Ionicons name="radio" size={18} color="#000000" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020408",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // 1. Top App Bar Header
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
  },
  cityPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    marginTop: 4,
  },
  cityNameText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
  },

  // 2. Kolkata Hangout Live Banner Card
  liveBannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0C1322",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
  },
  bannerThumb: {
    width: 46,
    height: 46,
    borderRadius: 12,
  },
  bannerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bannerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontFamily: VibeFonts.bold,
  },
  liveTag: {
    backgroundColor: "#FF136A",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  liveTagText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.5,
  },
  bannerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  bannerSubText: {
    color: "#8E9CAE",
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
  },
  originalVibeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 211, 238, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.35)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  originalVibeText: {
    color: "#22D3EE",
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
  },

  // 3. Centerpiece: Neon Blue Water Jar & Glossy Thermometer
  jarSectionCard: {
    marginBottom: 8,
  },
  jarRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  jarWrap: {
    width: SCREEN_W * 0.51,
    alignItems: "center",
  },
  jarInner: {
    width: "100%",
    alignItems: "center",
  },
  jarImage: {
    width: SCREEN_W * 0.51,
    height: (SCREEN_W * 0.51) * (350 / 234),
  },
  jarGlowPuddle: {
    width: SCREEN_W * 0.42,
    height: 14,
    borderRadius: 10,
    backgroundColor: "#0090EC",
    opacity: 0.45,
    marginTop: -8,
  },
  thermometerWrap: {
    width: SCREEN_W * 0.42,
    alignItems: "center",
  },
  thermometerImage: {
    width: SCREEN_W * 0.42,
    height: (SCREEN_W * 0.42) * (284 / 189),
  },

  // 4. Reward / Surprise Card
  surpriseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0C1322",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.25)",
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
  },
  surpriseBoxImg: {
    width: 82,
    height: 72,
  },
  surpriseInfoGroup: {
    flex: 1,
    marginLeft: 12,
  },
  surprisePreLabel: {
    color: "#38BDF8",
    fontSize: 10.5,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.8,
  },
  surpriseTitle: {
    color: "#D2FD38",
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    marginTop: 2,
  },
  surpriseDescription: {
    color: "#8E9CAE",
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    marginTop: 3,
    lineHeight: 16,
  },

  // 5. Full-width 'Create a Hangout ➔' Button
  createHangoutBtn: {
    height: 56,
    borderRadius: 28,
    marginTop: 14,
    overflow: "hidden",
  },
  createHangoutGrad: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  createHangoutBtnText: {
    color: "#000000",
    fontSize: 15.5,
    fontFamily: VibeFonts.extraBold,
  },

  // 6. 'Pull up ✨' Section
  sectionWrap: {
    marginTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: VibeFonts.bold,
  },
  sectionLink: {
    color: "#8E9CAE",
    fontSize: 12.5,
    fontFamily: VibeFonts.medium,
  },
  pullUpCard: {
    backgroundColor: "#0C1322",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    padding: 14,
  },
  pullUpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pullUpItem: {
    alignItems: "center",
  },
  pickCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  moreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  pullUpName: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    marginTop: 6,
  },

  // 7. Office Gang is buzzing Card
  buzzingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0C1322",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  buzzingThumb: {
    width: 46,
    height: 46,
    borderRadius: 12,
  },
  buzzingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  buzzingTitle: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontFamily: VibeFonts.bold,
  },
  buzzingSub: {
    color: "#8E9CAE",
    fontSize: 11.5,
    fontFamily: VibeFonts.regular,
    marginTop: 2,
  },
  buzzingLivePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  buzzingGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 5,
  },
  buzzingLiveText: {
    color: "#10B981",
    fontSize: 10.5,
    fontFamily: VibeFonts.bold,
  },

  // 8. Kabir Social Status Update Card (Exact Figma Layout)
  socialPostCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0C1322",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  postAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  postInfo: {
    flex: 1,
    marginLeft: 12,
  },
  postNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  postName: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontFamily: VibeFonts.bold,
  },
  postTimePill: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  postTimeText: {
    color: "#8E9CAE",
    fontSize: 10.5,
    fontFamily: VibeFonts.regular,
  },
  postMessage: {
    color: "#CBD5E1",
    fontSize: 13.5,
    fontFamily: VibeFonts.medium,
    marginTop: 3,
  },
  postMenuBtn: {
    padding: 4,
  },

  // 9. Nearby Hangouts Section
  nearbyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  nearbyTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  pinkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F43F5E",
    marginRight: 6,
  },
  nearbyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: VibeFonts.bold,
  },
  seeAllGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    color: "#8E9CAE",
    fontSize: 12.5,
    fontFamily: VibeFonts.medium,
    marginRight: 2,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hangoutCard: {
    width: "48.5%",
    backgroundColor: "#0C1322",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    overflow: "hidden",
  },
  cardImageContainer: {
    height: 125,
    position: "relative",
  },
  cardImg: {
    width: "100%",
    height: "100%",
  },
  cardDistanceBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cardDistanceText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontFamily: VibeFonts.bold,
  },
  cardHeartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  attendeeStack: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  attendeeAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#0C1322",
  },
  attendeeAvatarOverlap: {
    marginLeft: -7,
  },
  attendeeCountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    marginLeft: 6,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 3,
  },
  cardBody: {
    padding: 10,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },
  cardSubtitle: {
    color: "#8E9CAE",
    fontSize: 10,
    fontFamily: VibeFonts.regular,
    marginTop: 2,
    marginBottom: 8,
  },
  tagChipsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagChipText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
  },
  joinBtnWrap: {
    marginLeft: 5,
    borderRadius: 10,
    overflow: "hidden",
  },
  joinBtnGrad: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  joinBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
  },

  // City Picker Modal
  cityModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cityPickerCard: {
    width: "100%",
    backgroundColor: "#0C1322",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    padding: 18,
  },
  cityPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cityPickerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: VibeFonts.bold,
  },
  citySearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  citySearchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: VibeFonts.regular,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  cityRowActive: {
    backgroundColor: "rgba(210, 253, 56, 0.08)",
  },
  cityName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.semiBold,
  },
  cityState: {
    color: "#64748B",
    fontSize: 11,
    fontFamily: VibeFonts.regular,
  },

  // Surprise Unlock Modal
  surpriseModalCard: {
    width: "88%",
    backgroundColor: "#0C1322",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.3)",
    padding: 24,
    alignItems: "center",
  },
  surpriseModalHeading: {
    color: "#D2FD38",
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    textAlign: "center",
  },
  surpriseModalSub: {
    color: "#8E9CAE",
    fontSize: 13,
    fontFamily: VibeFonts.regular,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  surpriseClaimBtn: {
    width: "100%",
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 18,
  },
  surpriseClaimGrad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  surpriseClaimText: {
    color: "#000000",
    fontSize: 14.5,
    fontFamily: VibeFonts.extraBold,
  },

  // 'What’s the move?' Bottom Sheet Modal
  moveModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  moveModalDismissArea: {
    flex: 1,
  },
  moveSheetCard: {
    backgroundColor: "#0C1322",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignSelf: "center",
    marginBottom: 14,
  },
  moveHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moveUserGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  moveAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  moveHangWith: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },
  moveHandle: {
    color: "#8E9CAE",
    fontSize: 11,
    fontFamily: VibeFonts.regular,
  },
  moveCloseBtn: {
    padding: 6,
  },
  moveTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    marginTop: 14,
  },
  moveSubtitle: {
    color: "#8E9CAE",
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    marginTop: 2,
  },
  stepHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 8,
  },
  stepNumBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: T.lime,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  stepNumText: {
    color: "#000000",
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
  },
  stepTitle: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontFamily: VibeFonts.bold,
  },
  stepLink: {
    color: "#38BDF8",
    fontSize: 11,
    fontFamily: VibeFonts.medium,
  },
  vibeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  vibeCard: {
    width: "18.5%",
    aspectRatio: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  vibeCardSelected: {
    borderColor: T.cyan,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
  },
  vibeCardCustomIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  vibeCardText: {
    color: "#8E9CAE",
    fontSize: 10,
    fontFamily: VibeFonts.medium,
  },
  vibeCardTextSelected: {
    color: "#FFFFFF",
    fontFamily: VibeFonts.bold,
  },
  timeCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeCard: {
    width: "23%",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  timeCardSelected: {
    borderColor: T.cyan,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
  },
  timeCardTitle: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontFamily: VibeFonts.bold,
  },
  timeCardTitleSelected: {
    color: T.cyan,
  },
  timeCardSub: {
    color: "#64748B",
    fontSize: 9.5,
    fontFamily: VibeFonts.regular,
    marginTop: 2,
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inviteItem: {
    alignItems: "center",
    marginRight: 16,
  },
  addPeopleCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  inviteName: {
    color: "#8E9CAE",
    fontSize: 10.5,
    fontFamily: VibeFonts.medium,
    marginTop: 4,
  },
  moveCtaBtnWrap: {
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    marginTop: 18,
  },
  moveCtaGrad: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  moveCtaText: {
    color: "#0A0F1D",
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
  },

  // Event Broadcast Confirmation Modal
  eventModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  eventCreateCard: {
    width: "100%",
    backgroundColor: "#0C1322",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    padding: 22,
    alignItems: "center",
  },
  eventModalCloseBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    padding: 6,
  },
  eventHeroBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(210, 253, 56, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(210, 253, 56, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  eventTagPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  eventTagPillText: {
    color: "#10B981",
    fontSize: 10.5,
    fontFamily: VibeFonts.bold,
  },
  eventModalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: VibeFonts.bold,
    textAlign: "center",
  },
  eventModalSubtitle: {
    color: "#8E9CAE",
    fontSize: 12.5,
    fontFamily: VibeFonts.regular,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 18,
  },
  broadcastActionBtn: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  broadcastActionGrad: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  broadcastActionText: {
    color: "#000000",
    fontSize: 14.5,
    fontFamily: VibeFonts.extraBold,
    marginRight: 8,
  },
});
