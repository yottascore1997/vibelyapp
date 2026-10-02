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
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  CITIES,
  CITY_BY_ID,
  CityId,
  resolveCityId,
} from "../constants/mapEvents";
import { useAuth } from "../context/AuthContext";
import { useMatches } from "../context/MatchesContext";
import { usePlans } from "../context/PlansContext";
import { api } from "../services/api";
import { VibeFonts } from "../constants/vibeTheme";
import TabBar from "../components/TabBar";

const { width: SCREEN_W } = Dimensions.get("window");
const CITY_STORAGE_KEY = "@hangora_map_city";

// Home Page icons for consistency
const chaiIcon = require("../assets/icons/chai.png");
const coffeeIcon = require("../assets/icons/coffee.png");
const beerIcon = require("../assets/icons/beer.png");
const movieIcon = require("../assets/icons/movie.png");
const walkIcon = require("../assets/icons/walk.png");
const cokeIcon = require("../assets/icons/dietcoke.png");

// Hangora Dark Neon Design Palette
const T = {
  bg: "#050811",
  card: "#0B101D",
  cardElevated: "#0E1526",
  ink: "#FFFFFF",
  muted: "#94A3B8",
  faint: "#64748B",
  border: "rgba(255, 255, 255, 0.08)",
  borderActive: "rgba(212, 247, 44, 0.4)",
  lime: "#D4F72C",
  limeDark: "#B8E91A",
  mint: "#2EFA9E",
  cyan: "#22D3EE",
  pink: "#EC4899",
  hotPink: "#F43F5E",
  purple: "#8B5CF6",
  orange: "#FB923C",
};

// 10 Vibe Activities for 'What’s the move?' sheet (Exact matching Home Page Icons)
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
  const [mode, setMode] = useState<"events" | "people">("events");
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
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

  // Bottom Sheet Popup ('What’s the move?') state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<{
    id?: string;
    name: string;
    handle: string;
    avatar: any;
  }>({
    name: "Aanya",
    handle: "@aanya.official",
    avatar: require("../assets/events-map/aanya-hd.jpg"),
  });
  const [selectedVibe, setSelectedVibe] = useState("smoke");
  const [selectedTime, setSelectedTime] = useState("30min");
  const [invitedFriends, setInvitedFriends] = useState<string[]>(["aanya", "rohan", "sneha"]);

  // Animated Event Creation / Community Motivation Modal state
  const [showEventCreateModal, setShowEventCreateModal] = useState(false);
  const [eventBroadcasted, setEventBroadcasted] = useState(false);

  // Kabir's "terrace in 10? ☕" Interactive Live Poll State
  const [pollVotedId, setPollVotedId] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState([
    { id: "yes", label: "I'm in! 🏃‍♂️☕", votes: 14 },
    { id: "10m", label: "Need 10 mins ⏳", votes: 6 },
    { id: "cant", label: "Can't today 😴", votes: 2 },
  ]);

  const totalPollVotes = useMemo(() => {
    return pollOptions.reduce((acc, curr) => acc + curr.votes, 0);
  }, [pollOptions]);

  const handlePollVote = (optionId: string) => {
    setPollOptions((prev) =>
      prev.map((opt) => {
        if (pollVotedId === optionId) {
          // Unvote if tapped again
          return { ...opt, votes: Math.max(0, opt.votes - 1) };
        } else if (pollVotedId && opt.id === pollVotedId) {
          // Deselect previous
          return { ...opt, votes: Math.max(0, opt.votes - 1) };
        } else if (opt.id === optionId) {
          // Select new
          return { ...opt, votes: opt.votes + 1 };
        }
        return opt;
      })
    );
    setPollVotedId((prev) => (prev === optionId ? null : optionId));
  };

  // Radar wave pulse animation
  const pulseAnim = useSharedValue(1);
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1.35, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      true
    );
  }, [pulseAnim]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: 1.5 - pulseAnim.value,
  }));

  const city = CITY_BY_ID[cityId] || CITY_BY_ID["kolkata"];

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(CITY_STORAGE_KEY);
        if (saved && CITIES.some((c) => c.id === saved)) {
          setCityId(saved as CityId);
        } else if (token) {
          try {
            const res = (await api.getProfile(token)) as any;
            const profileResolved = resolveCityId(res?.profile?.city);
            if (profileResolved) {
              setCityId(profileResolved);
            }
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, [token]);

  const selectCity = useCallback(async (id: CityId) => {
    setCityId(id);
    setShowCityPicker(false);
    await AsyncStorage.setItem(CITY_STORAGE_KEY, id);
  }, []);

  const toggleLike = (key: string) => {
    setLikedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleJoin = (key: string) => {
    setJoinedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openMoveModal = (
    name = "Aanya",
    handle = "@aanya.official",
    avatar = require("../assets/events-map/aanya-hd.jpg"),
    id?: string
  ) => {
    setSelectedFriend({ name, handle, avatar, id });
    setShowMoveModal(true);
  };

  const pullUpPeople = useMemo(() => {
    const list: any[] = [];
    if (matches && matches.length > 0) {
      matches.slice(0, 4).forEach((m, idx) => {
        list.push({
          id: m.id,
          name: m.name.split(" ")[0],
          handle: `@${m.name.toLowerCase().replace(/\s+/g, "")}`,
          avatar: m.avatarUrl || require("../assets/events-map/aanya-hd.jpg"),
          isOnline: m.isOnline ?? true,
          ringColor: idx % 2 === 0 ? T.pink : T.mint,
        });
      });
    }
    if (nearbyPeople && nearbyPeople.length > 0) {
      nearbyPeople.slice(0, 5 - list.length).forEach((p, idx) => {
        if (!list.some((x) => x.id === p.id)) {
          list.push({
            id: p.id,
            name: p.name.split(" ")[0],
            handle: `@${p.name.toLowerCase().replace(/\s+/g, "")}`,
            avatar: p.avatarUrl || require("../assets/events-map/rohan-hd.jpg"),
            isOnline: p.isOnline ?? true,
            ringColor: idx % 2 === 0 ? T.cyan : T.lime,
          });
        }
      });
    }
    if (list.length === 0) {
      return [
        { id: "sample-1", name: "Aanya", handle: "@aanya.official", avatar: require("../assets/events-map/aanya-hd.jpg"), isOnline: true, ringColor: T.pink },
        { id: "sample-2", name: "Rohan", handle: "@rohan.vibe", avatar: require("../assets/events-map/rohan-hd.jpg"), isOnline: true, ringColor: T.mint },
        { id: "sample-3", name: "Sneha", handle: "@sneha.style", avatar: require("../assets/events-map/sneha-hd.jpg"), isOnline: true, ringColor: T.cyan },
        { id: "sample-4", name: "Kabir", handle: "@kabir.live", avatar: require("../assets/events-map/kabir-hd.jpg"), isOnline: false, ringColor: T.purple },
      ];
    }
    return list;
  }, [matches, nearbyPeople]);

  const currentVibe = VIBES.find((v) => v.id === selectedVibe) || VIBES[5];

  const filteredCities = CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.state.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Main Scrollable View */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) + 95 },
        ]}
      >
        {/* Top App Bar Header */}
        <View style={styles.topHeader}>
          {/* Back Button (Perfect Circle) */}
          <Pressable style={styles.circleBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </Pressable>

          {/* Center Brand Title & City Selector */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Events <Text style={{ color: T.lime }}>Map</Text>
            </Text>

            {/* City Selector Pill */}
            <Pressable
              style={styles.cityPill}
              onPress={() => setShowCityPicker(true)}
            >
              <Text style={styles.pinEmoji}>📍</Text>
              <Text style={styles.cityNameText}>{city.name}</Text>
              <Ionicons name="chevron-down" size={13} color="#38BDF8" style={{ marginLeft: 3 }} />
            </Pressable>
          </View>

          {/* Right Camera Button (Perfect Circle) */}
          <Pressable style={styles.circleBtn} onPress={() => router.push("/create-plan")}>
            <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Top Banner Card: Kolkata Hangout Live */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.liveBannerCard}>
          <Image
            source={require("../assets/events-map/kolkata-live-thumb.png")}
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
              <Text style={styles.bannerSubText}>3 Live Hangouts · 12 People Nearby</Text>
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

        {/* Interactive Radar Map Area */}
        <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.mapCard}>
          {/* Subtle Radar Concentric Rings in background */}
          <View style={styles.radarCenterAnchor} pointerEvents="none">
            <Animated.View style={[styles.radarWaveOuter, pulseStyle]} />
            <View style={styles.radarRing3} />
            <View style={styles.radarRing2} />
            <View style={styles.radarRing1} />
            <View style={styles.radarCrossH} />
            <View style={styles.radarCrossV} />
          </View>

          {/* Top-Left Toggle Pill: Events vs People */}
          <View style={styles.mapModeToggle}>
            <Pressable
              style={[styles.modeTab, mode === "events" && styles.modeTabActive]}
              onPress={() => setMode("events")}
            >
              <Text style={[styles.modeTabText, mode === "events" && styles.modeTabTextActive]}>
                🗓️ Events
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, mode === "people" && styles.modeTabActive]}
              onPress={() => setMode("people")}
            >
              <View style={styles.modeTabRow}>
                <Ionicons
                  name="people"
                  size={13}
                  color={mode === "people" ? "#0A0F1D" : T.muted}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.modeTabText, mode === "people" && styles.modeTabTextActive]}>
                  People
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Top-Right Compass Needle Button (Perfect Circle) */}
          <Pressable
            style={styles.compassBtn}
            onPress={() => setSelectedHotspot(null)}
          >
            <Ionicons name="navigate" size={16} color={T.hotPink} />
          </Pressable>

          {/* Left Vertical Zoom Controls (+ / -) */}
          <View style={styles.zoomControls}>
            <Pressable
              style={styles.zoomBtn}
              onPress={() => setMapZoom((z) => Math.min(z + 0.1, 1.4))}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </Pressable>
            <View style={styles.zoomDivider} />
            <Pressable
              style={styles.zoomBtn}
              onPress={() => setMapZoom((z) => Math.max(z - 0.1, 0.7))}
            >
              <Ionicons name="remove" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Hotspot 1: Park Street (Top Center) */}
          <Pressable
            style={[styles.hotspotAnchor, styles.hotspotParkStreet]}
            onPress={() => setSelectedHotspot("Park Street")}
          >
            <View style={styles.hotspotWrapper}>
              <View style={styles.hotspotRing}>
                <Image
                  source={require("../assets/events-map/park-street-hd.jpg")}
                  style={styles.circleImage}
                />
              </View>
              {/* Overlapping Count Badge (Perfect Circle) */}
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>12</Text>
              </View>
            </View>
            <Text style={styles.hotspotLabel}>Park Street</Text>
          </Pressable>

          {/* Hotspot 2: Salt Lake (Right) */}
          <Pressable
            style={[styles.hotspotAnchor, styles.hotspotSaltLake]}
            onPress={() => setSelectedHotspot("Salt Lake")}
          >
            <View style={styles.hotspotWrapper}>
              <View style={styles.hotspotRing}>
                <Image
                  source={require("../assets/events-map/salt-lake-hd.jpg")}
                  style={styles.circleImage}
                />
              </View>
              {/* Overlapping Count Badge (Perfect Circle) */}
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>8</Text>
              </View>
            </View>
            <Text style={styles.hotspotLabel}>Salt Lake</Text>
          </Pressable>

          {/* Hotspot 3: New Town (Bottom Left) */}
          <Pressable
            style={[styles.hotspotAnchor, styles.hotspotNewTown]}
            onPress={() => setSelectedHotspot("New Town")}
          >
            <View style={styles.hotspotWrapper}>
              <View style={styles.hotspotRing}>
                <Image
                  source={require("../assets/events-map/new-town-hd.jpg")}
                  style={styles.circleImage}
                />
              </View>
              {/* Overlapping Count Badge (Perfect Circle) */}
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>5</Text>
              </View>
            </View>
            <Text style={styles.hotspotLabel}>New Town</Text>
          </Pressable>

          {/* Center User Location Pin & 'You are here' Tooltip */}
          <View style={styles.userLocationWrap} pointerEvents="none">
            {/* Tooltip on top with exact lime-to-cyan gradient */}
            <LinearGradient
              colors={["#D4F72C", "#22D3EE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.youAreHerePill}
            >
              <Text style={styles.youAreHereText}>You are here</Text>
            </LinearGradient>

            {/* Outer translucent radar ring (Perfect Circle) */}
            <View style={styles.userRadarAura}>
              {/* Inner glowing cyan circle with coffee icon (Perfect Circle) */}
              <View style={styles.userCoffeeCircle}>
                <Text style={{ fontSize: 18 }}>☕</Text>
              </View>
            </View>
          </View>

          {/* Scattered Live Activity Neon Dots (Perfect Circles) */}
          <View style={[styles.dotLive, { top: "25%", left: "30%", backgroundColor: T.mint }]} />
          <View style={[styles.dotLive, { top: "21%", left: "68%", backgroundColor: T.mint }]} />
          <View style={[styles.dotLive, { top: "33%", left: "75%", backgroundColor: "#FACC15" }]} />
          <View style={[styles.dotLive, { top: "42%", left: "34%", backgroundColor: "#FACC15" }]} />
          <View style={[styles.dotLive, { top: "46%", left: "77%", backgroundColor: T.cyan }]} />
          <View style={[styles.dotLive, { top: "54%", left: "79%", backgroundColor: T.mint }]} />
          <View style={[styles.dotLive, { top: "60%", left: "10%", backgroundColor: T.mint }]} />
          <View style={[styles.dotLive, { top: "72%", left: "9%", backgroundColor: T.mint }]} />

          {/* Bottom Map Controls: '3 Live' & 'Recenter' */}
          <View style={styles.mapBottomBar}>
            <Pressable
              style={styles.mapBottomBtn}
              onPress={() => setSelectedHotspot("Park Street")}
            >
              <Text style={styles.mapBottomBtnText}>☕ 3 Live</Text>
            </Pressable>

            <Pressable
              style={styles.mapBottomBtn}
              onPress={() => {
                setMapZoom(1);
                setSelectedHotspot(null);
              }}
            >
              <Ionicons name="locate-outline" size={15} color="#22D3EE" style={{ marginRight: 5 }} />
              <Text style={styles.mapBottomBtnText}>Recenter</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* 'Pull up ✨' Section */}
        <Animated.View entering={FadeInDown.delay(180).duration(450)} style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Pressable
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => openMoveModal("Aanya", "@aanya.official", require("../assets/events-map/aanya-hd.jpg"))}
            >
              <Text style={styles.sectionTitle}>Pull up ✨</Text>
            </Pressable>
            <Pressable
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => openMoveModal("Aanya", "@aanya.official", require("../assets/events-map/aanya-hd.jpg"))}
            >
              <Text style={styles.sectionLink}>Tap to hang →</Text>
            </Pressable>
          </View>

          <View style={styles.pullUpRow}>
            {/* 1. Pick button */}
            <Pressable
              style={styles.pullUpItem}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                const first = pullUpPeople[0];
                if (first) openMoveModal(first.name, first.handle, first.avatar, first.id);
                else openMoveModal("Aanya", "@aanya.official", require("../assets/events-map/aanya-hd.jpg"));
              }}
            >
              <View style={styles.pickCircle}>
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.pullUpName}>Pick</Text>
            </Pressable>

            {/* Dynamic People list */}
            {pullUpPeople.map((person) => (
              <Pressable
                key={person.id || person.name}
                style={styles.pullUpItem}
                onPress={() => openMoveModal(person.name, person.handle, person.avatar, person.id)}
              >
                <View style={styles.avatarWrapper}>
                  <View style={[styles.avatarRing, { borderColor: person.ringColor || T.pink }]}>
                    <Image
                      source={typeof person.avatar === "string" ? { uri: person.avatar } : person.avatar}
                      style={styles.circleImage}
                    />
                  </View>
                  {person.isOnline && <View style={styles.onlineStatusDot} />}
                </View>
                <Text style={styles.pullUpName} numberOfLines={1}>{person.name}</Text>
              </Pressable>
            ))}

            {/* More */}
            <Pressable
              style={styles.pullUpItem}
              onPress={() => router.push("/invite-friends")}
            >
              <View style={styles.moreCircle}>
                <Ionicons name="ellipsis-horizontal" size={18} color="#94A3B8" />
              </View>
              <Text style={styles.pullUpName}>More</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Office Gang is buzzing Card */}
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

        {/* Kabir Social Post Card with Interactive Live Poll */}
        <Animated.View entering={FadeInDown.delay(300).duration(450)}>
          <View style={styles.socialPostCard}>
            {/* Post Header: Kabir Avatar + Info + Action */}
            <View style={styles.postHeaderRow}>
              <View style={styles.postAuthorGroup}>
                <View style={styles.postAvatarRing}>
                  <Image
                    source={require("../assets/events-map/kabir-hd.jpg")}
                    style={styles.circleImage}
                  />
                  <View style={styles.postOnlineBadge} />
                </View>

                <View style={styles.postInfo}>
                  <View style={styles.postNameRow}>
                    <Text style={styles.postName}>Kabir</Text>
                    <Ionicons name="checkmark-circle" size={14} color="#38BDF8" style={{ marginLeft: 4 }} />
                    <View style={styles.postTimePill}>
                      <Text style={styles.postTimeText}>10m ago</Text>
                    </View>
                  </View>
                  <Text style={styles.postSubText}>@kabir.live • 📍 Terrace Lounge</Text>
                </View>
              </View>

              <Pressable
                style={styles.postMenuBtn}
                onPress={() => openMoveModal("Kabir", "@kabir.live", require("../assets/events-map/kabir-hd.jpg"))}
                hitSlop={8}
              >
                <Ionicons name="ellipsis-vertical" size={16} color="#94A3B8" />
              </Pressable>
            </View>

            {/* Poll Question & Prompt */}
            <View style={styles.postQuestionContainer}>
              <Text style={styles.postMessage}>terrace in 10? ☕</Text>
              <Text style={styles.postQuestionSub}>Quick breather & chai before standup. Who's pulling up?</Text>
            </View>

            {/* Poll Status Bar */}
            <View style={styles.pollMetaRow}>
              <View style={styles.pollLiveTag}>
                <View style={styles.pollLiveDot} />
                <Text style={styles.pollLiveText}>LIVE POLL</Text>
              </View>
              <Text style={styles.pollStatsText}>
                Expires in 8m • {totalPollVotes} votes
              </Text>
            </View>

            {/* Poll Options */}
            <View style={styles.pollOptionsList}>
              {pollOptions.map((opt) => {
                const isSelected = pollVotedId === opt.id;
                const percent = totalPollVotes > 0 ? Math.round((opt.votes / totalPollVotes) * 100) : 0;

                return (
                  <Pressable
                    key={opt.id}
                    style={[styles.pollOptionItem, isSelected && styles.pollOptionItemActive]}
                    onPress={() => handlePollVote(opt.id)}
                  >
                    {/* Fill Progress Bar */}
                    <View
                      style={[
                        styles.pollProgressBar,
                        { width: `${percent}%` },
                        isSelected && styles.pollProgressBarActive,
                      ]}
                    />

                    {/* Option Details */}
                    <View style={styles.pollOptionContent}>
                      <View style={styles.pollOptionLeft}>
                        {isSelected ? (
                          <View style={styles.pollRadioSelected}>
                            <Ionicons name="checkmark-circle" size={18} color="#D4F72C" />
                          </View>
                        ) : (
                          <View style={styles.pollRadioCircle} />
                        )}
                        <Text style={[styles.pollOptionLabel, isSelected && styles.pollOptionLabelActive]}>
                          {opt.label}
                        </Text>
                      </View>

                      <View style={styles.pollOptionRight}>
                        <Text style={[styles.pollPercentText, isSelected && styles.pollPercentTextActive]}>
                          {percent}%
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Poll Footer with Feedback & Quick Reply */}
            <View style={styles.pollFooterRow}>
              <Text style={styles.pollStatusHint}>
                {pollVotedId
                  ? "✓ Vote recorded • Tap to change"
                  : "👉 Tap an option to cast vote"}
              </Text>

              <Pressable
                style={styles.pollQuickReplyBtn}
                onPress={() => openMoveModal("Kabir", "@kabir.live", require("../assets/events-map/kabir-hd.jpg"))}
              >
                <Ionicons name="chatbubble-ellipses" size={13} color="#D4F72C" />
                <Text style={styles.pollQuickReplyText}>Join Kabir</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Nearby Hangouts Section */}
        <Animated.View entering={FadeInDown.delay(360).duration(450)} style={{ marginTop: 22 }}>
          <View style={styles.nearbyHeaderRow}>
            <View style={styles.nearbyTitleGroup}>
              <View style={styles.pinkDot} />
              <Text style={styles.nearbyTitle}>Nearby Hangouts</Text>
            </View>
            <Pressable onPress={() => router.push("/(tabs)")}>
              <View style={styles.seeAllGroup}>
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={13} color="#94A3B8" />
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
                  <Text style={{ fontSize: 10 }}>📍</Text>
                  <Text style={styles.cardDistanceText}>2.5 km</Text>
                </View>

                {/* Heart Button (Perfect Circle) */}
                <Pressable
                  style={styles.cardHeartBtn}
                  onPress={() => toggleLike("coffee")}
                >
                  <Ionicons
                    name={likedCards["coffee"] ? "heart" : "heart-outline"}
                    size={15}
                    color={likedCards["coffee"] ? "#F43F5E" : "#FFFFFF"}
                  />
                </Pressable>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Coffee & Good Talks
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  Today, 7:00 PM • Brew & Blush
                </Text>

                <View style={styles.tagChipsRow}>
                  <View style={[styles.tagChip, { backgroundColor: "rgba(234, 179, 8, 0.12)" }]}>
                    <Text style={[styles.tagChipText, { color: "#FACC15" }]}>☕ Coffee</Text>
                  </View>
                  <View style={[styles.tagChip, { backgroundColor: "rgba(20, 184, 166, 0.12)", marginLeft: 6 }]}>
                    <Text style={[styles.tagChipText, { color: "#2DD4BF" }]}>🎯 Chill Vibes</Text>
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
                  <Text style={{ fontSize: 10 }}>📍</Text>
                  <Text style={styles.cardDistanceText}>1.8 km</Text>
                </View>

                {/* Heart Button (Perfect Circle) */}
                <Pressable
                  style={styles.cardHeartBtn}
                  onPress={() => toggleLike("beer")}
                >
                  <Ionicons
                    name={likedCards["beer"] ? "heart" : "heart-outline"}
                    size={15}
                    color={likedCards["beer"] ? "#F43F5E" : "#FFFFFF"}
                  />
                </Pressable>
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
                    <Text style={[styles.tagChipText, { color: "#F59E0B" }]}>🍺 Beer</Text>
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

      {/* Floating Bottom TabBar with Glowing Center 'Events Map' Button */}
      <TabBar dark={true} />

      {/* 'What’s the move?' Bottom Sheet Modal (Exact Figma Replica) */}
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
            {/* Top Sheet Drag Handle */}
            <View style={styles.sheetHandle} />

            {/* Header: 'hang with [Name]' & Close Button */}
            <View style={styles.moveHeaderRow}>
              <View style={styles.moveUserGroup}>
                <View style={styles.moveAvatarRing}>
                  <Image source={selectedFriend.avatar} style={styles.circleImage} />
                </View>
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
                <Ionicons name="close" size={18} color="#94A3B8" />
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
            <Text style={styles.stepSubtitle}>Choose a vibe for your hangout.</Text>

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
            <Text style={styles.stepSubtitle}>Set the date and time.</Text>

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
                    {isSelected ? (
                      <View style={styles.timeCheckBadge}>
                        <Ionicons name="checkmark" size={10} color="#0A0F1D" />
                      </View>
                    ) : null}
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
                Invite <Text style={{ color: T.muted, fontSize: 13, fontFamily: VibeFonts.regular }}>(Optional)</Text>
              </Text>
            </View>
            <Text style={styles.stepSubtitle}>Bring people along.</Text>

            {/* Invite Friends Row */}
            <View style={styles.inviteRow}>
              {/* + Add People */}
              <Pressable style={styles.inviteItem} onPress={() => router.push("/invite-friends")}>
                <View style={styles.addPeopleCircle}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.inviteName}>Add People</Text>
              </Pressable>

              {/* Aanya */}
              <Pressable
                style={styles.inviteItem}
                onPress={() => {
                  setInvitedFriends((prev) =>
                    prev.includes("aanya") ? prev.filter((x) => x !== "aanya") : [...prev, "aanya"]
                  );
                }}
              >
                <View style={styles.avatarWrapper}>
                  <View
                    style={[
                      styles.avatarRing,
                      { borderColor: invitedFriends.includes("aanya") ? T.cyan : "rgba(255,255,255,0.2)" },
                    ]}
                  >
                    <Image source={require("../assets/events-map/aanya-hd.jpg")} style={styles.circleImage} />
                  </View>
                  <View style={styles.onlineStatusDot} />
                </View>
                <Text style={styles.inviteName}>Aanya</Text>
              </Pressable>

              {/* Rohan */}
              <Pressable
                style={styles.inviteItem}
                onPress={() => {
                  setInvitedFriends((prev) =>
                    prev.includes("rohan") ? prev.filter((x) => x !== "rohan") : [...prev, "rohan"]
                  );
                }}
              >
                <View style={styles.avatarWrapper}>
                  <View
                    style={[
                      styles.avatarRing,
                      { borderColor: invitedFriends.includes("rohan") ? T.lime : "rgba(255,255,255,0.2)" },
                    ]}
                  >
                    <Image source={require("../assets/events-map/rohan-hd.jpg")} style={styles.circleImage} />
                  </View>
                  <View style={styles.onlineStatusDot} />
                </View>
                <Text style={styles.inviteName}>Rohan</Text>
              </Pressable>

              {/* Sneha */}
              <Pressable
                style={styles.inviteItem}
                onPress={() => {
                  setInvitedFriends((prev) =>
                    prev.includes("sneha") ? prev.filter((x) => x !== "sneha") : [...prev, "sneha"]
                  );
                }}
              >
                <View style={styles.avatarWrapper}>
                  <View
                    style={[
                      styles.avatarRing,
                      { borderColor: invitedFriends.includes("sneha") ? T.pink : "rgba(255,255,255,0.2)" },
                    ]}
                  >
                    <Image source={require("../assets/events-map/sneha-hd.jpg")} style={styles.circleImage} />
                  </View>
                  <View style={styles.onlineStatusDot} />
                </View>
                <Text style={styles.inviteName}>Sneha</Text>
              </Pressable>

              {/* More */}
              <Pressable style={styles.inviteItem} onPress={() => router.push("/invite-friends")}>
                <View style={styles.moreCircle}>
                  <Ionicons name="ellipsis-horizontal" size={18} color="#94A3B8" />
                </View>
                <Text style={styles.inviteName}>More</Text>
              </Pressable>
            </View>

            {/* Big Action CTA Button: ask [Name] for [vibe] */}
            <Pressable
              style={styles.moveCtaBtnWrap}
              onPress={() => {
                setShowMoveModal(false);
                setTimeout(() => {
                  setShowEventCreateModal(true);
                  setEventBroadcasted(false);
                }, 280);
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

      {/* Animated Event Creation & Community Motivation Modal */}
      <Modal
        visible={showEventCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEventCreateModal(false)}
      >
        <View style={styles.eventModalOverlay}>
          <Pressable
            style={styles.eventModalDismissArea}
            onPress={() => setShowEventCreateModal(false)}
          />

          <Animated.View
            entering={ZoomIn.springify().damping(12).stiffness(120)}
            style={styles.eventCreateCard}
          >
            {/* Top Close Button */}
            <Pressable
              style={styles.eventModalCloseBtn}
              onPress={() => setShowEventCreateModal(false)}
            >
              <Ionicons name="close" size={18} color="#94A3B8" />
            </Pressable>

            {/* Glowing Pulse Rings & Fire/Rocket Icon */}
            <View style={styles.eventHeroAuraWrap}>
              <Animated.View style={[styles.eventPulseRingOuter, pulseStyle]} />
              <View style={styles.eventPulseRingInner} />
              <LinearGradient
                colors={["#FFF04B", "#D4F72C", "#2EFA9E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.eventHeroBadge}
              >
                <Text style={{ fontSize: 32 }}>🔥</Text>
              </LinearGradient>
            </View>

            {/* Tag Pill */}
            <View style={styles.eventTagPill}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.eventTagPillText}>
                INVITE SENT TO {selectedFriend.name.toUpperCase()}! 🚀
              </Text>
            </View>

            {/* Headline */}
            <Text style={styles.eventModalTitle}>
              Turn this vibe into a{" "}
              <Text style={{ color: T.lime }}>Live Event!</Text> 🔥
            </Text>

            {/* Subtitle */}
            <Text style={styles.eventModalSubtitle}>
              {selectedFriend.name} just got your ping for{" "}
              <Text style={{ color: "#FFFFFF", fontFamily: VibeFonts.bold }}>
                {currentVibe.label} {currentVibe.emoji}
              </Text>
              . There are{" "}
              <Text style={{ color: T.cyan, fontFamily: VibeFonts.bold }}>
                18 people nearby
              </Text>{" "}
              looking for the same vibe right now!
            </Text>

            {/* Live Radar Signal & Community FOMO Card */}
            <View style={styles.radarSignalBox}>
              <View style={styles.radarSignalHeader}>
                <View style={styles.signalDotGroup}>
                  <View style={styles.buzzingGreenDot} />
                  <Text style={styles.signalHeaderText}>KOLKATA RADAR ACTIVE</Text>
                </View>
                <Text style={styles.signalPeopleCount}>18 Nearby</Text>
              </View>

              {/* Overlapping Avatars Row */}
              <View style={styles.signalAvatarsRow}>
                <View style={styles.avatarPile}>
                  <View style={[styles.miniAvatarWrap, { borderColor: T.pink, zIndex: 4 }]}>
                    <Image source={require("../assets/events-map/aanya-hd.jpg")} style={styles.circleImage} />
                  </View>
                  <View style={[styles.miniAvatarWrap, { borderColor: T.mint, marginLeft: -12, zIndex: 3 }]}>
                    <Image source={require("../assets/events-map/rohan-hd.jpg")} style={styles.circleImage} />
                  </View>
                  <View style={[styles.miniAvatarWrap, { borderColor: T.cyan, marginLeft: -12, zIndex: 2 }]}>
                    <Image source={require("../assets/events-map/sneha-hd.jpg")} style={styles.circleImage} />
                  </View>
                  <View style={[styles.miniAvatarWrap, styles.miniAvatarPlus, { marginLeft: -12, zIndex: 1 }]}>
                    <Text style={styles.miniAvatarPlusText}>+15</Text>
                  </View>
                </View>

                <View style={styles.signalVibeChip}>
                  <Text style={styles.signalVibeText}>
                    {currentVibe.emoji} {currentVibe.label} Vibe
                  </Text>
                </View>
              </View>

              {/* 3 Core Perks */}
              <View style={styles.perksRow}>
                <View style={styles.perkItem}>
                  <Text style={{ fontSize: 13 }}>📍</Text>
                  <Text style={styles.perkText}>Drops Map Pin</Text>
                </View>
                <View style={styles.perkDivider} />
                <View style={styles.perkItem}>
                  <Text style={{ fontSize: 13 }}>⚡</Text>
                  <Text style={styles.perkText}>1-Tap Pull Up</Text>
                </View>
                <View style={styles.perkDivider} />
                <View style={styles.perkItem}>
                  <Text style={{ fontSize: 13 }}>⭐</Text>
                  <Text style={styles.perkText}>+100 Karma</Text>
                </View>
              </View>
            </View>

            {/* Quick Event Draft Card */}
            <View style={styles.eventDraftCard}>
              <View style={styles.eventDraftIconWrap}>
                {currentVibe.image ? (
                  <Image source={currentVibe.image} style={{ width: 22, height: 22 }} resizeMode="contain" />
                ) : currentVibe.ionIcon ? (
                  <Ionicons name={currentVibe.ionIcon as any} size={22} color={T.lime} />
                ) : (
                  <MaterialCommunityIcons name={currentVibe.icon as any} size={22} color={T.lime} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.eventDraftTitle} numberOfLines={1}>
                  {currentVibe.label} & Chill with {selectedFriend.name}
                </Text>
                <Text style={styles.eventDraftSub}>
                  Park Street • Starting in 30 mins • Open Spot
                </Text>
              </View>
              <View style={styles.draftLivePill}>
                <Text style={styles.draftLiveText}>READY</Text>
              </View>
            </View>

            {/* Primary Action Button: Broadcast as Public Event */}
            <Pressable
              style={styles.broadcastActionBtn}
              onPress={async () => {
                setEventBroadcasted(true);
                try {
                  await createPlan({
                    activityId: currentVibe.id,
                    activityName: currentVibe.label,
                    emoji: currentVibe.emoji,
                    location: selectedHotspot ? `${selectedHotspot}, ${city.name}` : `${city.name} City Center`,
                    description: `Hangout with ${selectedFriend.name} for ${currentVibe.label}!`,
                    kind: "EVENT",
                    visibility: "PUBLIC",
                    customTime: selectedTime === "now" ? "Now" : selectedTime === "30min" ? "+30 Mins" : selectedTime === "1hr" ? "+1 Hour" : "6 PM",
                  });
                  if (selectedFriend.id && !selectedFriend.id.startsWith("sample-")) {
                    api.sendVibe({ receiverId: selectedFriend.id, vibeType: currentVibe.id }).catch(() => {});
                  }
                  refreshPlans().catch(() => {});
                } catch {}
                setTimeout(() => {
                  setShowEventCreateModal(false);
                  setSelectedHotspot(selectedHotspot || "Park Street");
                  setMapZoom(1.1);
                }, 1300);
              }}
            >
              <LinearGradient
                colors={
                  eventBroadcasted
                    ? ["#10B981", "#059669"]
                    : ["#FFF04B", "#D4F72C", "#2EFA9E"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.broadcastActionGrad}
              >
                <Ionicons
                  name={eventBroadcasted ? "checkmark-circle" : "flame"}
                  size={20}
                  color={eventBroadcasted ? "#FFFFFF" : "#0A0F1D"}
                />
                <Text
                  style={[
                    styles.broadcastActionText,
                    eventBroadcasted && { color: "#FFFFFF" },
                  ]}
                >
                  {eventBroadcasted
                    ? "✓ Spot Live on Kolkata Map!"
                    : "🚀 Broadcast as Public Event"}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={eventBroadcasted ? "#FFFFFF" : "#0A0F1D"}
                />
              </LinearGradient>
            </Pressable>

            {/* Secondary Option: Chat or Customize */}
            <View style={styles.secondaryActionsRow}>
              <Pressable
                style={styles.secondaryActionBtn}
                onPress={() => {
                  setShowEventCreateModal(false);
                  router.push("/chat/1");
                }}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={15} color={T.cyan} />
                <Text style={styles.secondaryActionText}>
                  Chat with {selectedFriend.name}
                </Text>
              </Pressable>

              <Pressable
                style={styles.secondaryActionBtn}
                onPress={() => {
                  setShowEventCreateModal(false);
                  router.push("/create-plan");
                }}
              >
                <Ionicons name="options-outline" size={15} color={T.lime} />
                <Text style={[styles.secondaryActionText, { color: T.lime }]}>
                  Studio Details
                </Text>
              </Pressable>
            </View>

            {/* Soft Dismiss */}
            <Pressable
              style={styles.dismissPillBtn}
              onPress={() => setShowEventCreateModal(false)}
            >
              <Text style={styles.dismissPillText}>Keep it 1-on-1 for now</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* City Picker Modal */}
      <Modal
        visible={showCityPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowCityPicker(false)}
        >
          <Animated.View
            entering={FadeInUp.duration(200)}
            style={styles.cityModalCard}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Choose City</Text>
                <Text style={styles.modalSubtitle}>Switch live radar & active hangouts</Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowCityPicker(false)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.modalSearchRow}>
              <Ionicons name="search" size={16} color={T.muted} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search city or state..."
                placeholderTextColor={T.faint}
                value={citySearch}
                onChangeText={setCitySearch}
              />
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {filteredCities.map((c) => {
                const isSelected = c.id === cityId;
                return (
                  <Pressable
                    key={c.id}
                    style={[styles.cityItemRow, isSelected && styles.cityItemRowActive]}
                    onPress={() => selectCity(c.id)}
                  >
                    <Text style={styles.cityEmojiBig}>{c.emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.cityItemName, isSelected && { color: T.lime }]}>
                        {c.name}
                      </Text>
                      <Text style={styles.cityItemState}>{c.state} · Live radar available</Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={20} color={T.lime} />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={T.faint} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // General reusable circular image style
  circleImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },

  // Top App Bar
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0D1424",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  cityPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1424",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    marginTop: 4,
  },
  pinEmoji: {
    fontSize: 11,
    marginRight: 4,
  },
  cityNameText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
  },

  // Kolkata Hangout Live Banner Card
  liveBannerCard: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bannerThumb: {
    width: 44,
    height: 44,
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
    fontSize: 13.5,
    fontFamily: VibeFonts.bold,
  },
  liveTag: {
    backgroundColor: T.hotPink,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginLeft: 6,
  },
  liveTagText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontFamily: VibeFonts.bold,
    letterSpacing: 0.5,
  },
  bannerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.mint,
    marginRight: 6,
  },
  bannerSubText: {
    color: T.muted,
    fontSize: 11,
    fontFamily: VibeFonts.regular,
  },
  originalVibeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 211, 238, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.28)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  originalVibeText: {
    color: T.cyan,
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },

  // Radar Map Card Area
  mapCard: {
    height: 380,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "#060914",
    position: "relative",
    marginBottom: 14,
  },
  radarCenterAnchor: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 0,
    height: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  radarWaveOuter: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: "rgba(34, 211, 238, 0.4)",
    backgroundColor: "rgba(34, 211, 238, 0.08)",
  },
  radarRing1: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.16)",
  },
  radarRing2: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.09)",
  },
  radarRing3: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.04)",
  },
  radarCrossH: {
    position: "absolute",
    width: 380,
    height: 1,
    backgroundColor: "rgba(34, 211, 238, 0.06)",
  },
  radarCrossV: {
    position: "absolute",
    height: 380,
    width: 1,
    backgroundColor: "rgba(34, 211, 238, 0.06)",
  },

  // Map Controls (Toggle & Compass)
  mapModeToggle: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    backgroundColor: "#0A101F",
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    zIndex: 20,
  },
  modeTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeTabActive: {
    backgroundColor: T.lime,
  },
  modeTabRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modeTabText: {
    color: T.muted,
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  modeTabTextActive: {
    color: "#0A0F1D",
  },
  compassBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0D1424",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  zoomControls: {
    position: "absolute",
    top: 68,
    left: 14,
    width: 32,
    borderRadius: 16,
    backgroundColor: "rgba(13, 20, 36, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    paddingVertical: 5,
    zIndex: 20,
  },
  zoomBtn: {
    padding: 4,
  },
  zoomDivider: {
    width: 16,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 3,
  },

  // Hotspots (Perfect Circular Rings + Photos + Count Badges)
  hotspotAnchor: {
    position: "absolute",
    alignItems: "center",
    zIndex: 10,
  },
  hotspotParkStreet: {
    top: "18%",
    left: "44%",
  },
  hotspotSaltLake: {
    top: "23%",
    right: "12%",
  },
  hotspotNewTown: {
    top: "54%",
    left: "14%",
  },
  hotspotWrapper: {
    width: 46,
    height: 46,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  hotspotRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: T.lime,
    overflow: "hidden",
    backgroundColor: "#060914",
    shadowColor: T.lime,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  countBadge: {
    position: "absolute",
    top: -4,
    right: -5,
    backgroundColor: T.lime,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.lime,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  countBadgeText: {
    color: "#0A0F1D",
    fontSize: 10.5,
    fontFamily: VibeFonts.bold,
  },
  hotspotLabel: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontFamily: VibeFonts.bold,
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 4,
  },

  // Center User Location (Perfect Circles)
  userLocationWrap: {
    position: "absolute",
    top: "44%",
    left: "37%",
    alignItems: "center",
    zIndex: 15,
  },
  youAreHerePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
    shadowColor: T.lime,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  youAreHereText: {
    color: "#0A0F1D",
    fontSize: 10.5,
    fontFamily: VibeFonts.bold,
  },
  userRadarAura: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  userCoffeeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#061A28",
    borderWidth: 2,
    borderColor: "#22D3EE",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },

  // Scattered live dots (Perfect Circles)
  dotLive: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: "#2EFA9E",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },

  // Bottom Map Bar Controls
  mapBottomBar: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 20,
  },
  mapBottomBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(11, 18, 32, 0.9)",
    borderWidth: 1.5,
    borderColor: "rgba(34, 211, 238, 0.35)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  mapBottomBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },

  // 'Pull up ✨' Section (Perfect Circles)
  sectionWrap: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16.5,
    fontFamily: VibeFonts.bold,
  },
  sectionLink: {
    color: T.faint,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    borderStyle: "dashed",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B101D",
  },
  onlineStatusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: T.mint,
    borderWidth: 1.5,
    borderColor: T.card,
    zIndex: 10,
  },
  officeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#22D3EE",
    backgroundColor: "#061A28",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  moreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.18)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  pullUpName: {
    color: T.muted,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    marginTop: 5,
  },

  // Office Gang is buzzing Card
  buzzingCard: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  buzzingThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  buzzingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  buzzingTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },
  buzzingSub: {
    color: T.muted,
    fontSize: 11,
    fontFamily: VibeFonts.regular,
    marginTop: 2,
  },
  buzzingLivePill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(46, 250, 158, 0.4)",
    backgroundColor: "rgba(46, 250, 158, 0.06)",
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 14,
  },
  buzzingGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.mint,
    marginRight: 5,
  },
  buzzingLiveText: {
    color: T.mint,
    fontSize: 10.5,
    fontFamily: VibeFonts.bold,
    letterSpacing: 0.5,
  },

  // Kabir Social Post Card with Interactive Live Poll
  socialPostCard: {
    backgroundColor: "#0D1424",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  postHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  postAuthorGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  postAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    position: "relative",
  },
  postOnlineBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#0D1424",
  },
  postInfo: {
    marginLeft: 10,
    flex: 1,
  },
  postNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  postName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: VibeFonts.bold,
  },
  postTimePill: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginLeft: 6,
  },
  postTimeText: {
    color: T.muted,
    fontSize: 9.5,
    fontFamily: VibeFonts.regular,
  },
  postSubText: {
    color: "#64748B",
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    marginTop: 1,
  },
  postMenuBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  postQuestionContainer: {
    marginBottom: 12,
  },
  postMessage: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: VibeFonts.bold,
    letterSpacing: -0.2,
  },
  postQuestionSub: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    marginTop: 3,
  },
  pollMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  pollLiveTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pollLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22D3EE",
    marginRight: 5,
  },
  pollLiveText: {
    color: "#22D3EE",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    letterSpacing: 0.5,
  },
  pollStatsText: {
    color: "#64748B",
    fontSize: 11,
    fontFamily: VibeFonts.medium,
  },
  pollOptionsList: {
    gap: 8,
  },
  pollOptionItem: {
    position: "relative",
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "#0B101D",
    overflow: "hidden",
    justifyContent: "center",
  },
  pollOptionItemActive: {
    borderColor: "#D4F72C",
    backgroundColor: "#0E1825",
  },
  pollProgressBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 10,
  },
  pollProgressBarActive: {
    backgroundColor: "rgba(212, 247, 44, 0.22)",
  },
  pollOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    zIndex: 1,
  },
  pollOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pollRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.25)",
    marginRight: 10,
  },
  pollRadioSelected: {
    marginRight: 10,
  },
  pollOptionLabel: {
    color: "#CBD5E1",
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    flex: 1,
  },
  pollOptionLabelActive: {
    color: "#FFFFFF",
    fontFamily: VibeFonts.bold,
  },
  pollOptionRight: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  pollPercentText: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    minWidth: 32,
    textAlign: "right",
  },
  pollPercentTextActive: {
    color: "#D4F72C",
  },
  pollFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
  },
  pollStatusHint: {
    color: "#64748B",
    fontSize: 11,
    fontFamily: VibeFonts.regular,
  },
  pollQuickReplyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 247, 44, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pollQuickReplyText: {
    color: "#D4F72C",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    marginLeft: 4,
  },

  // Nearby Hangouts Section
  nearbyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  nearbyTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  pinkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.hotPink,
    marginRight: 8,
  },
  nearbyTitle: {
    color: "#FFFFFF",
    fontSize: 16.5,
    fontFamily: VibeFonts.bold,
  },
  seeAllGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    color: T.muted,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    marginRight: 2,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hangoutCard: {
    width: (SCREEN_W - 40) / 2,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
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
    fontSize: 9.5,
    fontFamily: VibeFonts.bold,
    marginLeft: 3,
  },
  cardHeartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: 10,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontFamily: VibeFonts.bold,
  },
  cardSubtitle: {
    color: T.muted,
    fontSize: 10,
    fontFamily: VibeFonts.regular,
    marginTop: 2,
  },
  tagChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  tagChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagChipText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
  },
  joinBtnWrap: {
    marginLeft: 6,
    flex: 1,
  },
  joinBtnGrad: {
    paddingVertical: 3.5,
    paddingHorizontal: 7,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  joinBtnText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: VibeFonts.bold,
  },

  // 'What’s the move?' Bottom Sheet Modal Styles
  moveModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  moveModalDismissArea: {
    flex: 1,
  },
  moveSheetCard: {
    backgroundColor: "#070C18",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: "rgba(34, 211, 238, 0.22)",
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 24,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "center",
    marginBottom: 16,
  },
  moveHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  moveUserGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  moveAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: T.lime,
    overflow: "hidden",
    backgroundColor: "#0B101D",
  },
  moveHangWith: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: VibeFonts.bold,
  },
  moveHandle: {
    color: T.muted,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    marginTop: 2,
  },
  moveCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  moveTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.4,
  },
  moveSubtitle: {
    color: T.muted,
    fontSize: 13,
    fontFamily: VibeFonts.regular,
    marginTop: 3,
    marginBottom: 16,
  },

  // Steps
  stepHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
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
    color: "#0A0F1D",
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
  },
  stepTitle: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontFamily: VibeFonts.bold,
  },
  stepLink: {
    color: T.faint,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
  },
  stepSubtitle: {
    color: T.muted,
    fontSize: 11.5,
    fontFamily: VibeFonts.regular,
    marginLeft: 28,
    marginTop: 2,
    marginBottom: 10,
  },

  // Vibe Grid (2 rows x 5 items)
  vibeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  vibeCard: {
    width: (SCREEN_W - 40 - 24) / 5,
    height: 60,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  vibeCardCustomIcon: {
    width: 25,
    height: 25,
    marginBottom: 4,
  },
  vibeCardSelected: {
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1.5,
    borderColor: T.cyan,
  },
  vibeCardText: {
    color: T.muted,
    fontSize: 10,
    fontFamily: VibeFonts.medium,
  },
  vibeCardTextSelected: {
    color: "#FFFFFF",
    fontFamily: VibeFonts.bold,
  },

  // Time Cards
  timeCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeCard: {
    width: (SCREEN_W - 40 - 24) / 4,
    height: 72,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  timeCardSelected: {
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1.5,
    borderColor: T.cyan,
  },
  timeCheckBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: T.cyan,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  timeCardTitle: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontFamily: VibeFonts.bold,
  },
  timeCardTitleSelected: {
    color: T.cyan,
  },
  timeCardSub: {
    color: T.faint,
    fontSize: 9.5,
    fontFamily: VibeFonts.medium,
    marginTop: 2,
  },

  // Invite Row
  inviteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  inviteItem: {
    alignItems: "center",
  },
  addPeopleCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderStyle: "dashed",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteName: {
    color: T.muted,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    marginTop: 5,
  },

  // Bottom CTA
  moveCtaBtnWrap: {
    width: "100%",
    borderRadius: 27,
    overflow: "hidden",
    shadowColor: T.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  moveCtaGrad: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  moveCtaText: {
    color: "#0A0F1D",
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
  },

  // City Picker Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  cityModalCard: {
    width: "100%",
    backgroundColor: "#0D1322",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    padding: 18,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: VibeFonts.bold,
  },
  modalSubtitle: {
    color: T.muted,
    fontSize: 11.5,
    fontFamily: VibeFonts.regular,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#060A14",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 13,
  },
  cityItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  cityItemRowActive: {
    backgroundColor: "rgba(212, 247, 44, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.3)",
  },
  cityEmojiBig: {
    fontSize: 22,
  },
  cityItemName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },
  cityItemState: {
    color: T.muted,
    fontSize: 11,
    fontFamily: VibeFonts.regular,
    marginTop: 2,
  },

  // Animated Event Creation Modal Styles
  eventModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  eventModalDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  eventCreateCard: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: "#0A1020",
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(212, 247, 44, 0.35)",
    padding: 20,
    alignItems: "center",
    shadowColor: T.lime,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
    position: "relative",
  },
  eventModalCloseBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  eventHeroAuraWrap: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: 6,
  },
  eventPulseRingOuter: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: "rgba(212, 247, 44, 0.4)",
    backgroundColor: "rgba(212, 247, 44, 0.08)",
  },
  eventPulseRingInner: {
    position: "absolute",
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.3)",
  },
  eventHeroBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.lime,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  eventTagPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 247, 44, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.35)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 8,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.mint,
    marginRight: 6,
  },
  eventTagPillText: {
    color: T.lime,
    fontSize: 10.5,
    fontFamily: VibeFonts.bold,
    letterSpacing: 0.6,
  },
  eventModalTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontFamily: VibeFonts.extraBold,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  eventModalSubtitle: {
    color: T.muted,
    fontSize: 12.5,
    fontFamily: VibeFonts.regular,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  radarSignalBox: {
    width: "100%",
    backgroundColor: "#0E162B",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
    marginBottom: 12,
  },
  radarSignalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  signalDotGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  signalHeaderText: {
    color: T.muted,
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    letterSpacing: 0.5,
  },
  signalPeopleCount: {
    color: T.cyan,
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
  signalAvatarsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarPile: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniAvatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: "hidden",
    backgroundColor: "#0B101D",
  },
  miniAvatarPlus: {
    backgroundColor: "#182236",
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvatarPlusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
  },
  signalVibeChip: {
    backgroundColor: "rgba(34, 211, 238, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  signalVibeText: {
    color: T.cyan,
    fontSize: 10.5,
    fontFamily: VibeFonts.bold,
  },
  perksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  perkItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  perkText: {
    color: T.ink,
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    marginLeft: 4,
  },
  perkDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  eventDraftCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.25)",
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
  },
  eventDraftIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(212, 247, 44, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  eventDraftTitle: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontFamily: VibeFonts.bold,
  },
  eventDraftSub: {
    color: T.faint,
    fontSize: 10,
    fontFamily: VibeFonts.regular,
    marginTop: 2,
  },
  draftLivePill: {
    backgroundColor: "rgba(46, 250, 158, 0.15)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  draftLiveText: {
    color: T.mint,
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    letterSpacing: 0.5,
  },
  broadcastActionBtn: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: T.lime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 10,
  },
  broadcastActionGrad: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  broadcastActionText: {
    color: "#0A0F1D",
    fontSize: 14.5,
    fontFamily: VibeFonts.extraBold,
  },
  secondaryActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  secondaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flex: 0.485,
  },
  secondaryActionText: {
    color: T.muted,
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    marginLeft: 5,
  },
  dismissPillBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  dismissPillText: {
    color: T.faint,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
  },
});
