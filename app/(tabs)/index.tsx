import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInRight, FadeInUp, useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, ZoomIn, withRepeat } from "react-native-reanimated";
import NotificationBanner from "../../components/NotificationBanner";
import PremiumScreen from "../../components/vibe/PremiumScreen";
import PremiumHeader from "../../components/vibe/PremiumHeader";
import SectionHeader from "../../components/vibe/SectionHeader";
import GlassCard from "../../components/vibe/GlassCard";
import PulseDot from "../../components/home/PulseDot";
import OnlineStory from "../../components/home/OnlineStory";
import VibeHypeZone from "../../components/home/VibeHypeZone";
import { useMatches } from "../../context/MatchesContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { API_URL, Colors, Radius, Spacing } from "../../constants/theme";
import { VibeColors, VibeFonts } from "../../constants/vibeTheme";
import SpotBeaconModal from "../../components/vibe/SpotBeaconModal";

const homeActivities = [
  { id: "1", name: "Coffee", emoji: "☕", count: 12, bgLight: "#FFF7ED", borderLight: "rgba(249, 115, 22, 0.15)", textColor: "#C2410C" },
  { id: "2", name: "Food", emoji: "🍕", count: 8, bgLight: "#FFF5F5", borderLight: "rgba(239, 68, 68, 0.15)", textColor: "#B91C1C" },
  { id: "3", name: "Movie", emoji: "🎬", count: 15, bgLight: "#F5F3FF", borderLight: "rgba(138, 86, 255, 0.15)", textColor: "#6D28D9" },
  { id: "4", name: "Sports", emoji: "🏸", count: 6, bgLight: "#ECFDF5", borderLight: "rgba(16, 185, 129, 0.15)", textColor: "#047857" },
  { id: "5", name: "Bike", emoji: "🏍️", count: 4, bgLight: "#EFF6FF", borderLight: "rgba(59, 130, 246, 0.15)", textColor: "#1D4ED8" },
];

/** Limited core features — compact horizontal explore */
const APP_FEATURES = [
  { id: "nearby", title: "Nearby", icon: "radio" as const, colors: ["#FF3D7F", "#DB2777"] as const, route: "/people-nearby" },
  { id: "discover", title: "Discover", icon: "heart" as const, colors: ["#FF4B81", "#E11D48"] as const, route: "/(tabs)/discover" },
  { id: "hangout", title: "Hangout", icon: "cafe" as const, colors: ["#8A56FF", "#A855F7"] as const, route: "/hangout" },
  { id: "map", title: "Events Map", icon: "map" as const, colors: ["#14B8A6", "#0D9488"] as const, route: "/events-map" },
  { id: "friends", title: "Friends", icon: "people" as const, colors: ["#22C55E", "#16A34A"] as const, route: "/reels" },
  // { id: "travel", title: "Travel", icon: "airplane" as const, colors: ["#3B82F6", "#2563EB"] as const, route: "/travel" },
  { id: "events", title: "Events", icon: "calendar" as const, colors: ["#D4AF37", "#B8860B"] as const, route: "/explore-events" },
  { id: "create", title: "Create", icon: "add" as const, colors: ["#F97316", "#EA580C"] as const, route: "/create-plan" },
];

/** Auto-sliding promo banners — Hangout light palette */
const PROMO_BANNERS = [
  {
    id: "b1",
    tag: "HANGOUT",
    title: "Plans happening near you",
    subtitle: "Coffee, movie, sports — join in minutes",
    cta: "Open Hangout",
    emoji: "☕",
    colors: ["#7C3AED", "#8B5CF6", "#EC4899"] as const,
    route: "/hangout",
  },
  {
    id: "b2",
    tag: "NEARBY",
    title: "People within 10 km",
    subtitle: "Radar scan · find who is close right now",
    cta: "Find Nearby",
    emoji: "📡",
    colors: ["#EC4899", "#F472B6", "#8B5CF6"] as const,
    route: "/people-nearby",
  },
  {
    id: "b2b",
    tag: "DISCOVER",
    title: "New vibes in your city",
    subtitle: "Swipe, match & start real conversations",
    cta: "Start Discover",
    emoji: "💖",
    colors: ["#8B5CF6", "#A855F7", "#EC4899"] as const,
    route: "/(tabs)/discover",
  },
  {
    id: "b3",
    tag: "AI MATCH",
    title: "Smart plan picks for you",
    subtitle: "Ranked live hangouts near you — join in one tap",
    cta: "Try Smart Match",
    emoji: "✨",
    colors: ["#7C3AED", "#8B5CF6", "#EC4899"] as const,
    route: "/vibematch",
  },
];

const HOME_TODAY_EVENTS = [
  {
    id: "he-1",
    title: "Rooftop Sunset Hangout 🌅",
    category: "Chill",
    location: "Empress City Rooftop, Nagpur",
    timeLabel: "Today, 6:00 PM",
    goingCount: 12,
    totalSlots: 20,
    creatorName: "Rohan",
    imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=350",
    attendeeAvatars: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop",
    ]
  },
  {
    id: "he-2",
    title: "Night Football Match ⚽",
    category: "Sports",
    location: "Dharampeth Ground, Nagpur",
    timeLabel: "Today, 8:30 PM",
    goingCount: 18,
    totalSlots: 22,
    creatorName: "Karan",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=350",
    attendeeAvatars: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&fit=crop",
    ]
  }
];

function isEventExpired(timeLabel: string): boolean {
  try {
    const now = new Date();
    let eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (timeLabel.toLowerCase().includes("today")) {
      // Already today
    } else if (timeLabel.toLowerCase().includes("tomorrow")) {
      eventDate.setDate(eventDate.getDate() + 1);
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(timeLabel)) {
      const match = timeLabel.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        eventDate = new Date(year, month, day);
      }
    } else {
      const match = timeLabel.match(/^(\d{1,2})\s+([A-Za-z]+)/);
      if (match) {
        const day = parseInt(match[1], 10);
        const monthStr = match[2].toLowerCase();
        const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const monthIndex = months.findIndex(m => monthStr.startsWith(m));
        if (monthIndex !== -1) {
          eventDate = new Date(now.getFullYear(), monthIndex, day);
        }
      }
    }

    eventDate.setHours(0, 0, 0, 0);

    const cutoffTime = eventDate.getTime() + 26 * 60 * 60 * 1000;
    return Date.now() > cutoffTime;
  } catch (error) {
    return false;
  }
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const BANNER_W = SCREEN_W - 40;

/** Light premium Hangout-matched palette */
const Luxe = {
  bg: "#F8F9FD",
  bgSoft: "#FFFFFF",
  ink: "#18181B",
  inkSoft: "#64748B",
  inkFaint: "#94A3B8",
  gold: "#F59E0B",
  goldBright: "#FBBF24",
  goldSoft: "rgba(245,158,11,0.16)",
  rose: "#EC4899",
  roseSoft: "rgba(236,72,153,0.12)",
  emerald: "#10B981",
  emeraldBright: "#059669",
  white: "#FFFFFF",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  border: "#E2E8F0",
  purple: "#7C3AED",
  purpleDeep: "#6D28D9",
  purpleBright: "#8B5CF6",
  softPurple: "#F3E8FF",
  pink: "#EC4899",
  cta: ["#7C3AED", "#8B5CF6"] as const,
  ctaSoft: ["#8B5CF6", "#EC4899"] as const,
  welcome: ["#FFFFFF", "#F8F9FD"] as const,
};

function Firecracker({ delay }: { delay: number }) {
  const progress = useSharedValue(0);
  const rocketX = Math.random() * (SCREEN_W - 100) + 50;
  const destY = SCREEN_H * 0.2 + Math.random() * (SCREEN_H * 0.35);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: 850, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
      (finished) => {
        if (finished) {
          progress.value = withTiming(2, { duration: 1100, easing: Easing.out(Easing.quad) });
        }
      }
    );
  }, []);

  const rocketStyle = useAnimatedStyle(() => {
    if (progress.value >= 1) return { opacity: 0 };
    const currY = SCREEN_H - (SCREEN_H - destY) * progress.value;
    return {
      transform: [
        { translateX: rocketX },
        { translateY: currY },
      ],
      opacity: 1 - progress.value * 0.2,
    };
  });

  const sparks = Array.from({ length: 14 }).map((_, i) => {
    const angle = (i * 2 * Math.PI) / 14;
    const speed = 70 + Math.random() * 50;
    const color = ["#FF4B81", "#8A56FF", "#FFD700", "#3B82F6", "#10B981", "#FF85A2"][i % 6];
    return { angle, speed, color };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          rocketStyle,
          {
            position: "absolute",
            width: 4,
            height: 20,
            borderRadius: 2,
            backgroundColor: "#FFA500",
          },
        ]}
      />

      {sparks.map((sp, i) => {
        const sparkStyle = useAnimatedStyle(() => {
          if (progress.value < 1) return { opacity: 0 };
          const p = progress.value - 1;
          const currX = rocketX + Math.cos(sp.angle) * sp.speed * p;
          const currY = destY + Math.sin(sp.angle) * sp.speed * p + (p * p * 20);
          return {
            transform: [
              { translateX: currX },
              { translateY: currY },
            ],
            opacity: 1 - p,
            scale: 1 - p * 0.5,
          };
        });

        return (
          <Animated.View
            key={i}
            style={[
              sparkStyle,
              {
                position: "absolute",
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: sp.color,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function FirecrackerLauncher() {
  const [rockets, setRockets] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRockets((prev) => {
        if (prev.length >= 8) {
          clearInterval(interval);
          return prev;
        }
        return [...prev, Date.now() + Math.random()];
      });
    }, 380);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {rockets.map((id, index) => (
        <Firecracker key={id} delay={index * 380} />
      ))}
    </>
  );
}

const WHEEL_OPTIONS = [
  { label: "Grab Coffee ☕", emoji: "☕", color: "#F97316", route: "/hangout" },
  { label: "Watch Movie 🎬", emoji: "🎬", color: "#C084FC", route: "/hangout" },
  { label: "Play Sports 🏸", emoji: "🏸", color: "#EAB308", route: "/hangout" },
  { label: "Drink Beer 🍺", emoji: "🍺", color: "#10B981", route: "/hangout" },
  { label: "Go on a Date 💖", emoji: "💖", color: "#FF4B81", route: "/(tabs)/discover" },
  { label: "Join Events 📅", emoji: "📅", color: "#60A5FA", route: "/explore-events" },
];
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const { likesCount, conversations } = useMatches();
  const { user, token } = useAuth();
  const [myVibe, setMyVibe] = useState<"Lessgo" | "Maybe" | "Off grid">("Lessgo");
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef<FlatList>(null);

  const handleOrbPress = async (vibe: "Lessgo" | "Maybe" | "Off grid") => {
    setMyVibe(vibe);
    const energy =
      vibe === "Lessgo" ? "LESSGO" : vibe === "Maybe" ? "MAYBE" : "OFF_GRID";
    try {
      await api.updateSocialStatus({
        energy,
        freeNow: vibe === "Lessgo",
      });
    } catch (err) {
      console.error("Failed to persist social status:", err);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res: any = await api.getSocialStatus();
        if (res?.energy) {
          if (res.energy === "LESSGO") setMyVibe("Lessgo");
          else if (res.energy === "MAYBE") setMyVibe("Maybe");
          else if (res.energy === "OFF_GRID") setMyVibe("Off grid");
        }
      } catch (err) {
        console.error("Failed to load social status:", err);
      }
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % PROMO_BANNERS.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3800);
    return () => clearInterval(id);
  }, []);

  const onBannerScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / (BANNER_W + 12));
    if (idx >= 0 && idx < PROMO_BANNERS.length) setBannerIndex(idx);
  }, []);

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [spinResetTime, setSpinResetTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const wheelRotation = useSharedValue(0);

  useEffect(() => {
    if (!spinResetTime) return;
    const timer = setInterval(() => {
      const remaining = spinResetTime - Date.now();
      if (remaining <= 0) {
        setSelectedOption(null);
        setSpinResetTime(null);
        setTimeLeft("");
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [spinResetTime]);

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSelectedOption(null);

    const extraSpins = 6 + Math.floor(Math.random() * 4);
    const randomOffset = Math.random() * 360;
    const finalAngle = wheelRotation.value + (extraSpins * 360) + randomOffset;

    wheelRotation.value = withTiming(
      finalAngle,
      {
        duration: 3500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
      (finished) => {
        if (finished) {
          runOnJS(handleSpinComplete)(finalAngle);
        }
      }
    );
  };

  const handleSpinComplete = (finalAngle: number) => {
    const angleInCircle = finalAngle % 360;
    const normalizedAngle = (360 - angleInCircle) % 360;
    const sliceSize = 360 / WHEEL_OPTIONS.length;
    const idx = Math.floor(normalizedAngle / sliceSize) % WHEEL_OPTIONS.length;
    setSelectedOption(WHEEL_OPTIONS[idx]);
    setIsSpinning(false);
    setSpinResetTime(Date.now() + 5 * 60 * 1000);
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
  };

  const wheelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wheelRotation.value}deg` }],
  }));

  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [spotModalVisible, setSpotModalVisible] = useState(false);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const users = await api.getOnlineUsers() as any;
        if (users) {
          const usersArr = Array.isArray(users) ? users : users.users || [];
          setActiveUsers(usersArr);
        }
      } catch (err) {
        console.error("Home online users load error:", err);
      } finally {
        setLoadingActive(false);
      }

      try {
        const projs = await api.getProfiles("dating", user?.id) as any;
        if (projs) {
          setSuggestions(Array.isArray(projs) ? projs : []);
        }
      } catch (err) {
        console.error("Home suggestions load error:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }

    loadHomeData();
  }, [user]);

  useEffect(() => {
    async function loadProfile() {
      if (!token) return;
      try {
        const res = await api.getProfile(token) as any;
        if (res) {
          setProfile(res.profile);
        }
      } catch (err) {
        console.error("Error fetching user profile for home:", err);
      }
    }
    loadProfile();
  }, [token]);

  const getFullAvatarUrl = (url?: string | null) => {
    if (url) {
      if (url.startsWith("/")) {
        const serverBaseUrl = API_URL.replace("/api", "");
        return `${serverBaseUrl}${url}`;
      }
      return url;
    }
    return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop";
  };

  const getAvatarUri = () => {
    if (profile?.avatarUrl) {
      if (profile.avatarUrl.startsWith("/")) {
        const serverBaseUrl = API_URL.replace("/api", "");
        return `${serverBaseUrl}${profile.avatarUrl}`;
      }
      return profile.avatarUrl;
    }
    return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop";
  };

  const chatsUnread = conversations.reduce((sum, t) => sum + (t.unread || 0), 0);

  const firstName = (profile?.name || user?.name || "there").split(" ")[0];

  return (
    <View style={{ flex: 1, backgroundColor: Luxe.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={Luxe.bg} />
      {showConfetti && (
        <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}>
          <FirecrackerLauncher />
        </View>
      )}
      <PremiumScreen
      heroImage=""
      title=""
      lightMode={true}
      hideHeader={true}
      contentStyle={{ backgroundColor: "transparent" }}
    >
      {/* Soft Hangout ambient */}
      <LinearGradient
        colors={["rgba(167,139,250,0.18)", "transparent"]}
        style={styles.ambientGlowLeft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={["rgba(244,114,182,0.12)", "transparent"]}
        style={styles.ambientGlowRight}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.coolOrb} />

      <PremiumHeader
        likesCount={likesCount}
        chatsCount={chatsUnread}
        avatarUrl={getAvatarUri()}
        tagline="Find your vibe"
      />

      {/* Premium welcome — Hangout slogan style */}
      <Animated.View entering={FadeInUp.duration(420).springify()} style={styles.sloganHeaderWrap}>
        <View style={styles.doodleRow}>
          <View style={styles.doodlePill}>
            <Text style={styles.doodleText}>Hey {firstName}</Text>
            <Ionicons name="sparkles" size={12} color="#7C3AED" />
          </View>
          <View style={styles.liveNowBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveNowText}>{activeUsers.length || "—"} online</Text>
          </View>
        </View>
        <Text style={styles.sloganTitle} numberOfLines={2}>
          Ready to find your{" "}
          <Text style={styles.sloganHighlight}>next vibe?</Text>
        </Text>
        <LinearGradient
          colors={["#7C3AED", "#EC4899", "#F59E0B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sloganUnderline}
        />
      </Animated.View>

      {/* Live Social Energy Card — Hangout match */}
      <Animated.View entering={FadeInUp.delay(40).duration(450).springify()}>
        <View style={styles.socialEnergyCard}>
          <Text style={styles.socialEnergyTitle}>What's your social energy today?</Text>
          <View style={styles.orbsContainer}>
            <TouchableOpacity
              style={styles.orbWrapper}
              activeOpacity={0.8}
              onPress={() => handleOrbPress("Lessgo")}
            >
              <View
                style={[
                  styles.orbSphere,
                  styles.orbSphereGreen,
                  myVibe === "Lessgo" && styles.orbActiveGreen,
                ]}
              >
                <LinearGradient
                  colors={["#4ADE80", "#22C55E", "#15803D"]}
                  start={{ x: 0.2, y: 0.2 }}
                  end={{ x: 0.8, y: 0.8 }}
                  style={styles.orbGrad}
                >
                  <View style={styles.orbGlint} />
                </LinearGradient>
              </View>
              <Text style={[styles.orbLabel, { color: "#16A34A" }]}>Lessgo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orbWrapper}
              activeOpacity={0.8}
              onPress={() => handleOrbPress("Maybe")}
            >
              <View
                style={[
                  styles.orbSphere,
                  styles.orbSphereYellow,
                  myVibe === "Maybe" && styles.orbActiveYellow,
                ]}
              >
                <LinearGradient
                  colors={["#FDE047", "#F59E0B", "#B45309"]}
                  start={{ x: 0.2, y: 0.2 }}
                  end={{ x: 0.8, y: 0.8 }}
                  style={styles.orbGrad}
                >
                  <View style={styles.orbGlint} />
                </LinearGradient>
              </View>
              <Text style={[styles.orbLabel, { color: "#D97706" }]}>Maybe</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orbWrapper}
              activeOpacity={0.8}
              onPress={() => handleOrbPress("Off grid")}
            >
              <View
                style={[
                  styles.orbSphere,
                  styles.orbSphereRed,
                  myVibe === "Off grid" && styles.orbActiveRed,
                ]}
              >
                <LinearGradient
                  colors={["#FCA5A5", "#EF4444", "#991B1B"]}
                  start={{ x: 0.2, y: 0.2 }}
                  end={{ x: 0.8, y: 0.8 }}
                  style={styles.orbGrad}
                >
                  <View style={styles.orbGlint} />
                </LinearGradient>
              </View>
              <Text style={[styles.orbLabel, { color: "#DC2626" }]}>Off grid</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Spot Beacon — elevated light CTA */}
      <Animated.View entering={FadeInUp.delay(80).duration(400).springify()}>
        <TouchableOpacity
          style={styles.spotHeroCard}
          onPress={() => setSpotModalVisible(true)}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={["#7C3AED", "#8B5CF6", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.spotHeroGrad}
          >
            <View style={styles.spotShine} />
            <View style={styles.spotHeroRow}>
              <View style={styles.spotHeroIconWrap}>
                <Ionicons name="flash" size={22} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.spotBadge}>
                  <Text style={styles.spotBadgeText}>INSTANT MEETUP</Text>
                </View>
                <Text style={styles.spotHeroTitle}>Bored at a cafe right now?</Text>
                <Text style={styles.spotHeroSub}>
                  Drop a Spot · find nearby companions in 30 mins
                </Text>
              </View>
              <View style={styles.spotArrow}>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Promo banners */}
      <View style={styles.bannerCarouselWrap}>
        <FlatList
          ref={bannerRef}
          data={PROMO_BANNERS}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled={false}
          snapToInterval={BANNER_W + 12}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScroll={onBannerScroll}
          scrollEventThrottle={16}
          onScrollToIndexFailed={() => {}}
          contentContainerStyle={{ paddingRight: 4 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(item.route as any)} style={{ width: BANNER_W, marginRight: 12 }}>
              <LinearGradient
                colors={item.colors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.promoBanner}
              >
                <View style={styles.promoShine} />
                <View style={styles.promoBannerLeft}>
                  <View style={styles.promoTag}>
                    <Text style={styles.promoTagText}>{item.tag}</Text>
                  </View>
                  <Text style={styles.promoTitle}>{item.title}</Text>
                  <Text style={styles.promoSub}>{item.subtitle}</Text>
                  <View style={styles.promoCta}>
                    <Text style={styles.promoCtaText}>{item.cta}</Text>
                    <Ionicons name="arrow-forward" size={12} color={Luxe.purpleDeep} />
                  </View>
                </View>
                <Text style={styles.promoEmoji}>{item.emoji}</Text>
              </LinearGradient>
            </Pressable>
          )}
        />
        <View style={styles.bannerDots}>
          {PROMO_BANNERS.map((b, i) => (
            <View key={b.id} style={[styles.bannerDot, i === bannerIndex && styles.bannerDotActive]} />
          ))}
        </View>
      </View>

      {/* Explore Hangora — premium tile chips */}
      <View style={styles.featureHubHeader}>
        <Text style={styles.featureHubTitle}>Explore Hangora</Text>
        <Text style={styles.featureHubLink} onPress={() => router.push("/hangout")}>See more</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.featureChipScroll}
        contentContainerStyle={styles.featureChipRow}
      >
        {APP_FEATURES.map((feat) => (
          <Pressable
            key={feat.id}
            onPress={() => router.push(feat.route as any)}
            style={styles.featureChip}
          >
            <LinearGradient
              colors={[...feat.colors]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featureChipIcon}
            >
              <Ionicons name={feat.icon} size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.featureChipText}>{feat.title}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Luxe.inkFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people, plans, events..."
          placeholderTextColor={Luxe.inkFaint}
          value={search}
          onChangeText={setSearch}
        />
        <Pressable>
          <LinearGradient colors={[...Luxe.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.filterBtn}>
            <Ionicons name="options-outline" size={16} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>

      <SectionHeader light title="Online Now" subtitle={`${activeUsers.length} active`} action="See All ›" onAction={() => router.push("/(tabs)/discover")} />
      <View style={styles.onlineRow}>
        <PulseDot size={8} />
        <Text style={styles.onlineLabel}>Live now</Text>
      </View>

      {loadingActive ? (
        <ActivityIndicator color={Luxe.purple} style={{ marginBottom: Spacing.xl }} />
      ) : activeUsers.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
          {activeUsers.map((u, i) => (
            <OnlineStory
              key={u.id}
              name={u.name}
              avatarUrl={getFullAvatarUrl(u.avatarUrl)}
              isYou={u.id === user?.id}
              index={i}
              dark={false}
            />
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>No users online right now</Text>
      )}

      {/* Today's Spontaneous Events Section */}
      {(() => {
        const activeTodayEvents = HOME_TODAY_EVENTS.filter(e => !isEventExpired(e.timeLabel));
        if (activeTodayEvents.length === 0) return null;

        return (
          <>
            <SectionHeader light title="Today's Hot Events" subtitle="Happening near you today" action="See All ›" onAction={() => router.push("/explore-events")} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.eventsScroll}>
              {activeTodayEvents.map((evt, idx) => {
                const filledRatio = evt.goingCount / evt.totalSlots;
                return (
                  <Animated.View key={evt.id} entering={FadeInRight.delay(idx * 100).springify()}>
                    <Pressable onPress={() => router.push("/explore-events")}>
                      <GlassCard style={styles.eventCardHome as any}>
                        <Image source={{ uri: evt.imageUrl }} style={styles.eventCardImageHome} />
                        <LinearGradient colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.85)"]} style={styles.eventCardOverlayHome}>
                          {/* Top Badges */}
                          <View style={styles.eventHeaderRow}>
                            <View style={styles.todayPill}>
                               <Text style={styles.todayPillText}>TODAY</Text>
                            </View>
                            <Text style={styles.eventTimeText}>{evt.timeLabel.split(",")[1] || evt.timeLabel}</Text>
                          </View>

                          {/* Details */}
                          <Text style={styles.eventTitleHome} numberOfLines={1}>{evt.title}</Text>
                          <View style={styles.eventLocRow}>
                            <Ionicons name="location-outline" size={12} color="#E9D5FF" />
                            <Text style={styles.eventLocText} numberOfLines={1}>{evt.location}</Text>
                          </View>

                          {/* Spots Progress Bar */}
                          <View style={styles.slotsProgressContainer}>
                            <View style={styles.slotsProgressLabelRow}>
                              <Text style={styles.slotsProgressText}>{evt.goingCount}/{evt.totalSlots} going</Text>
                              <Text style={styles.slotsRemainingText}>{evt.totalSlots - evt.goingCount} spots left</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                              <LinearGradient
                                colors={[...Luxe.cta]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.progressBarFilled, { width: `${filledRatio * 100}%` }]}
                              />
                            </View>
                          </View>

                          {/* Bottom Row: Facepile & Button */}
                          <View style={styles.eventFooterRow}>
                            <View style={styles.facepileHome}>
                              {evt.attendeeAvatars.map((av, fIdx) => (
                                <Image
                                  key={fIdx}
                                  source={{ uri: av }}
                                  style={[styles.faceAvatarHome, { marginLeft: fIdx > 0 ? -8 : 0 }]}
                                />
                              ))}
                            </View>

                            <LinearGradient
                              colors={[...Luxe.cta]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.joinEvtBtn}
                            >
                              <Text style={styles.joinEvtBtnText}>Join Hangout</Text>
                              <Ionicons name="arrow-forward" size={10} color="#fff" />
                            </LinearGradient>
                          </View>
                        </LinearGradient>
                      </GlassCard>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </>
        );
      })()}

      <VibeHypeZone light={true} />

      <SectionHeader light title="Confused What to Do?" subtitle="Spin the wheel of vibe decider!" />
      <LinearGradient
        colors={["#FFFFFF", "#F8F4FF", "#FFF5FA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.deciderCard}
      >
        <View style={styles.deciderContent}>
          {/* Left side: Animated Wheel */}
          <View style={styles.deciderLeft}>
            <View style={styles.wheelContainer}>
              {/* Pointer indicator */}
              <View style={styles.pointer}>
                <Ionicons name="caret-down" size={28} color="#8B5CF6" style={{ top: -2 }} />
              </View>
              {/* Spinning Wheel */}
              <Animated.View style={[styles.wheel, wheelAnimatedStyle]}>
                {/* Wheel Background Slices lines */}
                {WHEEL_OPTIONS.map((_, i) => (
                  <View
                    key={`line-${i}`}
                    style={[
                      styles.wheelLine,
                      { transform: [{ rotate: `${i * (360 / WHEEL_OPTIONS.length) + (360 / WHEEL_OPTIONS.length / 2)}deg` }] }
                    ]}
                  />
                ))}
                {/* Wheel Emojis */}
                {WHEEL_OPTIONS.map((opt, i) => (
                  <View
                    key={i}
                    style={[
                      styles.wheelSliceWrapper,
                      { transform: [{ rotate: `${i * (360 / WHEEL_OPTIONS.length)}deg` }] }
                    ]}
                  >
                    <View style={[styles.sliceEmojiBg, { backgroundColor: `${opt.color}15`, borderColor: `${opt.color}77` }]}>
                      <Text style={styles.sliceEmoji}>{opt.emoji}</Text>
                    </View>
                  </View>
                ))}
              </Animated.View>
              {/* Center cap */}
              <View style={styles.wheelCap}>
                <View style={styles.wheelCapInner} />
              </View>
            </View>
          </View>

          {/* Right side: Verdict & Spin Button */}
          <View style={styles.deciderRight}>
            <Text style={styles.deciderInfoText}>
              Cannot decide what activity to do today? Let our vibe wheel choose for you!
            </Text>
            
            {selectedOption ? (
              <Animated.View entering={ZoomIn.duration(400)} style={styles.verdictBox}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                  <Text style={styles.verdictLabel}>TODAY'S VERDICT</Text>
                  {timeLeft ? (
                    <Text style={styles.countdownText}>Reset in {timeLeft}</Text>
                  ) : null}
                </View>
                <Text style={[styles.verdictValue, { color: selectedOption.color }]}>
                  {selectedOption.label}
                </Text>
                <Pressable onPress={() => router.push(selectedOption.route as any)}>
                  <LinearGradient
                    colors={[...Luxe.cta]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.verdictBtn}
                  >
                    <Text style={styles.verdictBtnText}>Let's Go!</Text>
                    <Ionicons name="chevron-forward" size={12} color="#fff" />
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ) : (
              <Pressable onPress={spinWheel} disabled={isSpinning} style={{ marginTop: 8 }}>
                <LinearGradient
                  colors={isSpinning ? ["#D1D5DB", "#9CA3AF"] : [...Luxe.cta]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.spinBtn}
                >
                  <Ionicons name="play" size={14} color="#fff" />
                  <Text style={styles.spinBtnText}>
                    {isSpinning ? "SPINNING..." : "SPIN THE WHEEL"}
                  </Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </View>
      </LinearGradient>

      <SectionHeader light title="Suggested for You" subtitle="Matches matching your vibe" action="Discover ›" onAction={() => router.push("/(tabs)/discover")} />
      {loadingSuggestions ? (
        <ActivityIndicator color={Luxe.purple} style={{ marginVertical: Spacing.xl }} />
      ) : suggestions.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.suggestedScroll}>
          {suggestions.map((profile, i) => (
            <Animated.View key={profile.id} entering={FadeInRight.delay(i * 100).springify()}>
              <GlassCard style={styles.suggestedCard}>
                <Image source={{ uri: getFullAvatarUrl(profile.avatarUrl) }} style={styles.suggestedAvatar} />

                <LinearGradient colors={["transparent", "rgba(5,5,8,0.95)"]} style={styles.suggestedOverlay}>
                  <Text style={styles.suggestedName}>{profile.name}, {profile.age || 24}</Text>
                  <Text style={styles.suggestedSub} numberOfLines={1}>{profile.jobTitle || "Student"} · {profile.distance || 1.2} km</Text>

                  <Pressable
                    onPress={() => router.push("/(tabs)/discover")}
                    style={styles.suggestedVibeBtn}
                  >
                    <LinearGradient
                      colors={[...Luxe.cta]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.suggestedVibeBtnGradient}
                    >
                      <Text style={styles.suggestedVibeText}>Vibe Match {profile.vibeMatch || 90}%</Text>
                    </LinearGradient>
                  </Pressable>
                </LinearGradient>
              </GlassCard>
            </Animated.View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>No suggestions found. Swipe in discover to make matches!</Text>
      )}

      <SectionHeader light title="Popular Activities" action="Hangout ›" onAction={() => router.push("/hangout")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
        {homeActivities.map((act, i) => (
          <Animated.View key={act.id} entering={FadeInRight.delay(i * 60).springify()}>
            <Pressable onPress={() => router.push("/hangout")}>
              <View
                style={[
                  styles.actCard,
                  {
                    backgroundColor: act.bgLight,
                    borderColor: act.borderLight,
                  },
                ]}
              >
                <Text style={styles.actEmoji}>{act.emoji}</Text>
                <Text style={[styles.actName, { color: act.textColor }]}>{act.name}</Text>
                <Text style={[styles.actCount, { color: Luxe.inkFaint }]}>{act.count} planning</Text>
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>

      <NotificationBanner
        dark={false}
        message={likesCount > 0 ? `${likesCount} people liked you! Match karke explore unlock karo.` : "Discover · Hangout · Travel — sab ek jagah. Explore karo!"}
        buttonText="Discover ›"
        onPress={() => router.push("/(tabs)/discover")}
      />
    </PremiumScreen>

    <SpotBeaconModal
      visible={spotModalVisible}
      onClose={() => setSpotModalVisible(false)}
    />
  </View>
  );
}

const styles = StyleSheet.create({
  sloganHeaderWrap: {
    paddingHorizontal: 2,
    marginBottom: 16,
  },
  doodleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  doodlePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EDE7FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  doodleText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: "#7C3AED",
  },
  liveNowBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  liveNowText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#059669",
  },
  sloganTitle: {
    fontSize: 26,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  sloganHighlight: {
    color: "#7C3AED",
  },
  sloganUnderline: {
    height: 3,
    width: 72,
    borderRadius: 2,
    marginTop: 10,
  },
  spotHeroCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.18)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  spotHeroGrad: {
    padding: 18,
    position: "relative",
    overflow: "hidden",
  },
  spotShine: {
    position: "absolute",
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  spotHeroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  spotHeroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  spotBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  spotBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.8,
  },
  spotHeroTitle: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.3,
  },
  spotHeroSub: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    marginTop: 3,
  },
  spotArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  coolOrb: {
    position: "absolute",
    top: "40%",
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(125, 211, 252, 0.08)",
  },
  welcomeBlob: {
    position: "absolute",
    right: -20,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(139,92,246,0.12)",
  },
  welcomePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EDE7FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  luxePattern: {
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    height: 280,
    opacity: 0.04,
    backgroundColor: "transparent",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  topHeaderLeft: {
    flex: 1,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  menuToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFCFA",
    borderWidth: 1,
    borderColor: "rgba(26,21,32,0.06)",
    shadowColor: "#1A1520",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  logoText: {
    fontSize: 30,
    fontFamily: VibeFonts.extraBold,
    color: "#1A1520",
    letterSpacing: -1.4,
  },
  logoAccent: {
    fontSize: 30,
    fontFamily: VibeFonts.extraBold,
    color: "#C9A227",
    letterSpacing: -1.4,
  },
  taglineText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(26,21,32,0.45)",
    marginTop: 1,
    letterSpacing: 0.2,
  },
  topHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  premiumPillBtn: {
    borderRadius: Radius.full,
    overflow: "hidden",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumPillGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  premiumPillText: {
    color: "#1A1520",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    letterSpacing: 0.3,
  },
  headerBellBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFCFA",
    borderWidth: 1,
    borderColor: "rgba(26,21,32,0.06)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#E11D48",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#FAF7F2",
  },
  bellBadgeText: {
    color: "#FFF",
    fontSize: 8,
    fontFamily: VibeFonts.bold,
  },

  welcomeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 26,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "#EDE7FF",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  welcomeShine: {
    ...StyleSheet.absoluteFillObject,
  },
  welcomeLeft: {
    marginRight: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarGradientBorder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  editPenBtn: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#8B5CF6",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  welcomeCenter: {
    flex: 1,
    justifyContent: "center",
  },
  welcomeEyebrow: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
    letterSpacing: 1.2,
  },
  welcomeGreeting: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: "#1A1F36",
    letterSpacing: -0.6,
  },
  welcomeSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#6B7280",
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    flexWrap: "wrap",
    gap: 6,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDE7FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  scoreBadgeText: {
    color: "#7C3AED",
    fontSize: 8,
    fontFamily: VibeFonts.bold,
  },
  scoreValBox: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scoreValText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: VibeFonts.bold,
  },
  scoreStatus: {
    color: "#8B5CF6",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    marginLeft: 2,
  },
  welcomeRight: {
    width: 80,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  heart3D: {
    width: 72,
    height: 72,
    resizeMode: "contain",
  },
  miniAvatar: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    overflow: "hidden",
  },
  miniAvatarLeft: {
    bottom: 0,
    left: -2,
  },
  miniAvatarRight: {
    bottom: 5,
    right: -2,
  },
  miniAvatarImg: {
    width: "100%",
    height: "100%",
  },

  bannerCarouselWrap: {
    marginBottom: Spacing.md,
  },
  promoBanner: {
    height: 140,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 0,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  promoShine: {
    position: "absolute",
    top: -30,
    right: 40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  promoBannerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  promoTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 8,
  },
  promoTagText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  promoTitle: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  promoSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.78)",
    marginTop: 4,
    marginBottom: 10,
  },
  promoCta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  promoCtaText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },
  promoEmoji: {
    fontSize: 48,
    opacity: 0.95,
  },
  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DDD6FE",
  },
  bannerDotActive: {
    width: 18,
    backgroundColor: "#8B5CF6",
  },

  featureHubHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  featureHubTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    letterSpacing: -0.3,
  },
  featureHubLink: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: "#7C3AED",
  },
  featureChipScroll: {
    marginBottom: Spacing.sm,
    maxHeight: 48,
  },
  featureChipRow: {
    paddingRight: 8,
    alignItems: "center",
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE7FF",
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  featureChipIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  featureChipText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EDE7FF",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#18181B",
    paddingVertical: 14,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  onlineRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: -10, marginBottom: Spacing.sm },
  onlineLabel: { fontSize: 12, fontFamily: VibeFonts.semiBold, color: "#16A34A" },
  hScroll: { marginBottom: Spacing.md },
  emptyText: {
    color: "#9CA3AF",
    fontFamily: VibeFonts.medium,
    fontSize: 13,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm
  },

  suggestedScroll: { paddingRight: Spacing.md },
  suggestedCard: {
    width: 168,
    height: 228,
    borderRadius: 22,
    overflow: "hidden",
    marginRight: Spacing.md,
    position: "relative",
    borderWidth: 1,
    borderColor: "#EDE7FF",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  suggestedAvatar: { width: "100%", height: "100%", resizeMode: "cover" },
  suggestedOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, paddingTop: 36 },
  suggestedName: { fontSize: 14, fontFamily: VibeFonts.bold, color: "#fff" },
  suggestedSub: { fontSize: 10, fontFamily: VibeFonts.medium, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  suggestedVibeBtn: { marginTop: 10, borderRadius: Radius.sm, overflow: "hidden" },
  suggestedVibeBtnGradient: { paddingVertical: 6, alignItems: "center", justifyContent: "center" },
  suggestedVibeText: { color: "#fff", fontSize: 10, fontFamily: VibeFonts.bold },

  actCard: {
    alignItems: "center",
    marginRight: Spacing.md,
    padding: Spacing.md,
    width: 104,
    minHeight: 114,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  actCardDark: {
    backgroundColor: "#FFFBFE",
    borderWidth: 1,
    borderColor: "#E4DFF0",
    borderRadius: 20,
  },
  actEmoji: { fontSize: 30, marginBottom: 6 },
  actName: { fontSize: 12, fontFamily: VibeFonts.bold, color: "#1A1F36" },
  actCount: { fontSize: 10, fontFamily: VibeFonts.medium, color: "#9CA3AF", marginTop: 2 },

  aiBanner: {
    borderRadius: 24,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EDE7FF",
  },
  aiLeft: { flex: 1 },
  aiTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EDE7FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: 8,
  },
  aiTagText: { color: "#7C3AED", fontSize: 10, fontFamily: VibeFonts.semiBold },
  aiTitle: { color: "#1A1F36", fontSize: 16, fontFamily: VibeFonts.bold, lineHeight: 22, letterSpacing: -0.3 },
  aiAvatars: { flexDirection: "row", marginTop: 10 },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#C084FC" },
  aiBtn: { backgroundColor: "#8B5CF6", alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, marginTop: 10 },
  aiBtnText: { color: "#FFFFFF", fontSize: 13, fontFamily: VibeFonts.bold },
  aiEmoji: { fontSize: 48 },

  // Quick Actions (Dark Glass)
  quickBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 13, marginRight: Spacing.sm },
  quickText: { fontSize: 12, fontFamily: VibeFonts.semiBold },

  // Glowing & Wash Enhancements
  ambientGlowLeft: {
    position: "absolute",
    top: -60,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.8,
  },
  ambientGlowRight: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.8,
  },
  heartGlowCircle: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.7,
    zIndex: -1,
  },
  orbSubtitle: {
    fontSize: 9,
    fontFamily: VibeFonts.medium,
    color: "#9CA3AF",
    marginTop: 1,
    letterSpacing: -0.1,
  },
  socialEnergyCard: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE7FF",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  socialEnergyTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  orbsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  orbWrapper: {
    alignItems: "center",
    gap: 8,
  },
  orbSphere: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 5,
  },
  orbSphereGreen: { shadowColor: "#22C55E" },
  orbSphereYellow: { shadowColor: "#F59E0B" },
  orbSphereRed: { shadowColor: "#EF4444" },
  orbActiveGreen: { borderWidth: 2.5, borderColor: "#4ADE80", transform: [{ scale: 1.1 }] },
  orbActiveYellow: { borderWidth: 2.5, borderColor: "#FDE047", transform: [{ scale: 1.1 }] },
  orbActiveRed: { borderWidth: 2.5, borderColor: "#FCA5A5", transform: [{ scale: 1.1 }] },
  orbGrad: { width: "100%", height: "100%", borderRadius: 28, padding: 5 },
  orbGlint: { width: 12, height: 12, borderRadius: 6, backgroundColor: "rgba(255, 255, 255, 0.65)", marginLeft: 4, marginTop: 2 },
  orbLabel: { fontSize: 11, fontFamily: VibeFonts.bold },
  orbWrapperOuter: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1.5,
    borderStyle: "solid",
  },
  glassOrb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  shineSpot: {
    position: "absolute",
    top: 5,
    left: 8,
    width: 14,
    height: 8,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.45)",
    transform: [{ rotate: "-22deg" }],
  },
  orbTitle: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    marginTop: 8,
  },
  orbTitleActive: {
    fontFamily: VibeFonts.bold,
  },
  deciderCard: {
    padding: 16,
    marginBottom: Spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EDE7FF",
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  deciderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deciderLeft: {
    width: 190,
    alignItems: "center",
    justifyContent: "center",
  },
  deciderRight: {
    flex: 1,
    marginLeft: 14,
  },
  deciderInfoText: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#6B7280",
    lineHeight: 18,
  },
  wheelContainer: {
    position: "relative",
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  pointer: {
    position: "absolute",
    top: -10,
    zIndex: 10,
    alignItems: "center",
    width: 20,
    height: 20,
  },
  wheel: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 5,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#FFFFFF",
  },
  wheelLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    left: 84,
  },
  wheelSliceWrapper: {
    position: "absolute",
    width: 162,
    height: 162,
    top: 0,
    left: 0,
    alignItems: "center",
  },
  sliceEmojiBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 10,
  },
  sliceEmoji: {
    fontSize: 18,
  },
  wheelCap: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF4B81",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  wheelCapInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  spinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: Radius.md,
  },
  spinBtnText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
  verdictBox: {
    marginTop: 8,
    backgroundColor: "#EDE7FF",
    borderRadius: Radius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    alignItems: "flex-start",
  },
  verdictLabel: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
    letterSpacing: 0.5,
  },
  countdownText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#E11D48",
  },
  verdictValue: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    marginVertical: 4,
  },
  verdictBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    marginTop: 2,
  },
  verdictBtnText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
  },
  eventsScroll: {
    paddingRight: Spacing.xl,
  },
  eventCardHome: {
    width: 288,
    height: 200,
    borderRadius: 22,
    overflow: "hidden",
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(138, 86, 255, 0.12)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  eventCardImageHome: {
    width: "100%",
    height: "100%",
    position: "absolute",
    zIndex: 1,
  },
  eventCardOverlayHome: {
    width: "100%",
    height: "100%",
    position: "absolute",
    zIndex: 2,
    padding: 14,
    justifyContent: "flex-end",
  },
  eventHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
  },
  todayPill: {
    backgroundColor: "#FF4B81",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  todayPillText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: VibeFonts.bold,
  },
  eventTimeText: {
    color: "#E9D5FF",
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 4,
  },
  eventTitleHome: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#fff",
    marginBottom: 4,
  },
  eventLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  eventLocText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#D8B4FE",
    flex: 1,
  },
  slotsProgressContainer: {
    marginBottom: 12,
  },
  slotsProgressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  slotsProgressText: {
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
    color: "#FFFFFF",
  },
  slotsRemainingText: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "#FBCFE8",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFilled: {
    height: "100%",
  },
  eventFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  facepileHome: {
    flexDirection: "row",
    alignItems: "center",
  },
  faceAvatarHome: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#050508",
  },
  joinEvtBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  joinEvtBtnText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
  },
});


