import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
  Dimensions,
  StatusBar,
  Modal,
  Share,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import MaskedView from "@react-native-masked-view/masked-view";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";
import AppHeader from "../components/vibe/AppHeader";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { usePlans } from "../context/PlansContext";
import { useMatches } from "../context/MatchesContext";
import { PLAN_ACTIVITIES, formatPlanSchedule } from "../constants/plans";
import { CITIES, CityId, resolveCityId } from "../constants/mapEvents";
import { VibeFonts } from "../constants/vibeTheme";
import TabBar from "../components/TabBar";
import MorphingMeshBackground from "../components/vibe/MorphingMeshBackground";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { MatchProfile } from "../constants/matches";

const friendsHangout3d = require("../assets/friends_hangout_3d.png");
const MOCKUP_ACTIVITY_ORDER = [
  "coffee",
  "travel",
  "food",
  "movie",
  "biryani",
  "drinks",
  "beer",
  "sutta",
] as const;
const coffeeVideo = require("../assets/cofee.mp4");
const smokeVideo = require("../assets/smoke.mp4");
const drinkVideo = require("../assets/drink.mp4");
const { width: SCREEN_W } = Dimensions.get("window");

/** Activity → local looping video */
const ACT_VIDEOS: Record<string, number> = {
  coffee: coffeeVideo,
  sutta: smokeVideo,
  drinks: drinkVideo,
  beer: drinkVideo,
};

/** Premium Microsoft Fluent 3D emoji icons — matched to mockup */
const FLUENT_3D = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets";
const ACT_3D: Record<string, string> = {
  coffee: `${FLUENT_3D}/Hot%20beverage/3D/hot_beverage_3d.png`,
  travel: `${FLUENT_3D}/Luggage/3D/luggage_3d.png`,
  food: `${FLUENT_3D}/Hamburger/3D/hamburger_3d.png`,
  biryani: `${FLUENT_3D}/Curry%20rice/3D/curry_rice_3d.png`,
  beer: `${FLUENT_3D}/Beer%20mug/3D/beer_mug_3d.png`,
  sutta: `${FLUENT_3D}/Cigarette/3D/cigarette_3d.png`,
  movie: `${FLUENT_3D}/Clapper%20board/3D/clapper_board_3d.png`,
  sports: `${FLUENT_3D}/Badminton/3D/badminton_3d.png`,
  drinks: `${FLUENT_3D}/Cocktail%20glass/3D/cocktail_glass_3d.png`,
};

/** Premium Hangora — ink black + champagne / soft rose (restrained) */
const T = {
  bg: "#08080A",
  card: "rgba(255, 255, 255, 0.045)",
  ink: "#F7F5F2",
  muted: "rgba(247,245,242,0.62)",
  faint: "rgba(247,245,242,0.38)",
  border: "rgba(255, 255, 255, 0.09)",
  pink: "#E879A9",
  purple: "#C4B5FD",
  purpleDeep: "#A78BFA",
  orange: "#E8A87C",
  orangeDeep: "#D4895A",
  yellow: "#D4AF37",
  yellowDeep: "#C9A227",
  softPurple: "rgba(167, 139, 250, 0.14)",
  softOrange: "rgba(232, 168, 124, 0.14)",
  softYellow: "rgba(212, 175, 55, 0.14)",
  softPink: "rgba(232, 121, 169, 0.12)",
  green: "#3DDC97",
  greenDeep: "#1FA971",
  amber: "#D4AF37",
  cta: ["#C9A227", "#E879A9"] as const,
  accentPurple: ["#7C3AED", "#A78BFA"] as const,
  accentOrange: ["#D4895A", "#E8A87C"] as const,
  accentYellow: ["#C9A227", "#D4AF37"] as const,
  accentGreen: ["#1FA971", "#3DDC97"] as const,
  promo: ["#C9A227", "#E879A9"] as const,
};

type IonName = keyof typeof Ionicons.glyphMap;

const VIBE_ORBS = [
  {
    id: "Lessgo",
    label: "Lessgo",
    description: "Up for anything",
    icon: "flash" as IonName,
    colors: ["#34D399", "#059669"] as const,
    soft: "rgba(52, 211, 153, 0.16)",
    accent: "#6EE7B7",
  },
  {
    id: "Maybe",
    label: "Maybe",
    description: "Soft yes",
    icon: "star" as IonName,
    colors: ["#FBBF24", "#F59E0B"] as const,
    soft: "rgba(251, 191, 36, 0.16)",
    accent: "#FBBF24",
  },
  {
    id: "Off grid",
    label: "Off grid",
    description: "Low key",
    icon: "moon" as IonName,
    colors: ["#F472B6", "#DB2777"] as const,
    soft: "rgba(244, 114, 182, 0.16)",
    accent: "#F9A8D4",
  },
];

const ACT_META: Record<
  string,
  {
    icon: IonName;
    accent: string;
    soft: string;
    colors: readonly [string, string];
    icon3d: string;
  }
> = {
  coffee: {
    icon: "cafe",
    accent: "#FBBF24",
    soft: "rgba(251, 191, 36, 0.14)",
    colors: ["#FBBF24", "#D97706"],
    icon3d: ACT_3D.coffee,
  },
  travel: {
    icon: "airplane",
    accent: "#38BDF8",
    soft: "rgba(56, 189, 248, 0.14)",
    colors: ["#38BDF8", "#0284C7"],
    icon3d: ACT_3D.travel,
  },
  food: {
    icon: "pizza",
    accent: "#FB923C",
    soft: "rgba(249, 115, 22, 0.14)",
    colors: ["#FB923C", "#EA580C"],
    icon3d: ACT_3D.food,
  },
  biryani: {
    icon: "restaurant",
    accent: "#F87171",
    soft: "rgba(248, 113, 113, 0.14)",
    colors: ["#F87171", "#DC2626"],
    icon3d: ACT_3D.biryani,
  },
  beer: {
    icon: "beer",
    accent: "#FACC15",
    soft: "rgba(250, 204, 21, 0.14)",
    colors: ["#FACC15", "#CA8A04"],
    icon3d: ACT_3D.beer,
  },
  sutta: {
    icon: "flame",
    accent: "#94A3B8",
    soft: "rgba(148, 163, 184, 0.14)",
    colors: ["#9CA3AF", "#4B5563"],
    icon3d: ACT_3D.sutta,
  },
  movie: {
    icon: "film",
    accent: "#A78BFA",
    soft: "rgba(139, 92, 246, 0.16)",
    colors: ["#A78BFA", "#7C3AED"],
    icon3d: ACT_3D.movie,
  },
  sports: {
    icon: "tennisball",
    accent: "#6EE7B7",
    soft: "rgba(52, 211, 153, 0.14)",
    colors: ["#4ADE80", "#16A34A"],
    icon3d: ACT_3D.sports,
  },
  drinks: {
    icon: "wine",
    accent: "#F9A8D4",
    soft: "rgba(244, 114, 182, 0.14)",
    colors: ["#F472B6", "#DB2777"],
    icon3d: ACT_3D.drinks,
  },
};

/** Floating 3D friends for hero — game-like bob + sway */
function FloatingFriends3D() {
  const t = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    glow.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [0, -10]) },
      { translateX: interpolate(t.value, [0, 1], [0, 4]) },
      { scale: interpolate(t.value, [0, 1], [1, 1.04]) },
      { rotate: `${interpolate(t.value, [0, 1], [-2, 2.5])}deg` },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.35, 0.7]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.92, 1.08]) }],
  }));

  const sparkA = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [0, -14]) },
      { translateX: interpolate(t.value, [0, 1], [0, 8]) },
    ],
    opacity: interpolate(t.value, [0, 0.5, 1], [0.4, 1, 0.5]),
  }));

  const sparkB = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [-4, 10]) },
      { translateX: interpolate(t.value, [0, 1], [6, -4]) },
    ],
    opacity: interpolate(t.value, [0, 0.5, 1], [0.7, 0.35, 0.8]),
  }));

  return (
    <View style={styles.friendsStage}>
      <Animated.View style={[styles.friendsGlowRing, ringStyle]} />
      <Animated.View style={[styles.friendsFloat, floatStyle]}>
        <Image source={friendsHangout3d} style={styles.friendsImage} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={[styles.sparkle, styles.sparkleA, sparkA]}>
        <Ionicons name="sparkles" size={12} color={T.purple} />
      </Animated.View>
      <Animated.View style={[styles.sparkle, styles.sparkleB, sparkB]}>
        <Ionicons name="heart" size={11} color={T.pink} />
      </Animated.View>
    </View>
  );
}

/** Floating 3D activity icon for live preview hero */
function PreviewHeroIcon({ icon3d, accent }: { icon3d: string; accent: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [t]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [0, -8]) },
      { scale: interpolate(t.value, [0, 1], [1, 1.06]) },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.35, 0.75]),
    transform: [{ scale: interpolate(t.value, [0, 1], [0.9, 1.12]) }],
  }));

  return (
    <View style={styles.previewHeroIconWrap}>
      <Animated.View
        style={[styles.previewHeroRing, { backgroundColor: `${accent}55` }, ringStyle]}
      />
      <Animated.View style={[styles.previewHeroOrb, { borderColor: `${accent}88` }, floatStyle]}>
        <LinearGradient
          colors={[`${accent}40`, "rgba(255,255,255,0.06)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <Image source={{ uri: icon3d }} style={styles.previewHeroIcon3d} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

function LivePulseDot() {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }),
      -1,
      false
    );
  }, [p]);
  const pulse = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 1], [0.55, 0]),
    transform: [{ scale: interpolate(p.value, [0, 1], [1, 2.2]) }],
  }));
  return (
    <View style={styles.livePulseWrap}>
      <Animated.View style={[styles.livePulseRing, pulse]} />
      <View style={styles.liveDot} />
    </View>
  );
}

function getActivityCardStyle(id: string) {
  switch (id) {
    case "coffee":
      return {
        darkBg: ["#231709", "#110B03"],
        border: "#F59E0B",
        glow: "#D97706",
        text: "#FBBF24",
        effects: ["♨️", "💨", "☁️"],
        type: "smoke",
      };
    case "travel":
      return {
        darkBg: ["#071821", "#030B12"],
        border: "#38BDF8",
        glow: "#0EA5E9",
        text: "#7DD3FC",
        effects: ["✈️", "✨", "🌍"],
        type: "stars",
      };
    case "food":
    case "biryani":
      return {
        darkBg: ["#261007", "#130703"],
        border: "#F97316",
        glow: "#EA580C",
        text: "#FB923C",
        effects: ["🔥", "♨️", "💨"],
        type: "steam",
      };
    case "movie":
      return {
        darkBg: ["#1C0E2B", "#0D0617"],
        border: "#A855F7",
        glow: "#7C3AED",
        text: "#C084FC",
        effects: ["⭐", "✨", "🌟"],
        type: "stars",
      };
    case "sports":
      return {
        darkBg: ["#0A2114", "#04110A"],
        border: "#10B981",
        glow: "#059669",
        text: "#34D399",
        effects: ["⚡", "💨", "💥"],
        type: "speed",
      };
    case "beer":
    case "drinks":
      return {
        darkBg: ["#231F07", "#111002"],
        border: "#FACC15",
        glow: "#CA8A04",
        text: "#FDE047",
        effects: ["🫧", "⚪", "🫧"],
        type: "bubbles",
      };
    default:
      return {
        darkBg: ["#270C1B", "#13040C"],
        border: "#EC4899",
        glow: "#DB2777",
        text: "#F472B6",
        effects: ["✨", "💫", "🌟"],
        type: "sparkle",
      };
  }
}

/** Realistic Hot Steam Smoke / Sizzling Aroma / Carbonated Bubbles Component */
function IconContextEffect({ effects, active }: { effects: string[]; active: boolean }) {
  const smokeVal = useSharedValue(0);

  useEffect(() => {
    smokeVal.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
      -1,
      false
    );
  }, []);

  const smokeStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(smokeVal.value, [0, 1], [6, -26]) },
      { translateX: interpolate(smokeVal.value, [0, 0.5, 1], [-2, 4, -3]) },
      { scale: interpolate(smokeVal.value, [0, 0.5, 1], [0.5, 1.2, 0.8]) },
      { rotate: `${interpolate(smokeVal.value, [0, 1], [-10, 20])}deg` },
    ],
    opacity: interpolate(smokeVal.value, [0, 0.2, 0.7, 1], [0, 0.95, 0.5, 0]),
  }));

  const smokeStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(smokeVal.value, [0, 1], [4, -30]) },
      { translateX: interpolate(smokeVal.value, [0, 0.5, 1], [3, -6, 5]) },
      { scale: interpolate(smokeVal.value, [0, 0.5, 1], [0.4, 1.1, 0.6]) },
      { rotate: `${interpolate(smokeVal.value, [0, 1], [10, -25])}deg` },
    ],
    opacity: interpolate(smokeVal.value, [0, 0.25, 0.75, 1], [0, 0.9, 0.4, 0]),
  }));

  const smokeStyle3 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(smokeVal.value, [0, 1], [8, -20]) },
      { translateX: interpolate(smokeVal.value, [0, 0.5, 1], [0, 3, -1]) },
      { scale: interpolate(smokeVal.value, [0, 0.5, 1], [0.6, 1.3, 0.9]) },
    ],
    opacity: interpolate(smokeVal.value, [0, 0.15, 0.65, 1], [0, 0.85, 0.35, 0]),
  }));

  return (
    <View style={styles.vapourContainer} pointerEvents="none">
      {/* Smoke Trail 1 (Left Cup Rim) */}
      <Animated.Text style={[styles.vapourParticle, { left: 4 }, smokeStyle1]}>
        {effects[0]}
      </Animated.Text>

      {/* Smoke Trail 2 (Right Cup Rim) */}
      <Animated.Text style={[styles.vapourParticle, { right: 4 }, smokeStyle2]}>
        {effects[1]}
      </Animated.Text>

      {/* Smoke Trail 3 (Center Cup Rising Steam) */}
      <Animated.Text style={[styles.vapourParticle, { left: "38%" }, smokeStyle3]}>
        {effects[2]}
      </Animated.Text>
    </View>
  );
}

/** Game-style activity tile with realistic hot coffee smoke & contextual visual effects */
function GameActivityTile({
  id,
  name,
  icon3d,
  accent,
  soft,
  active,
  delay,
  onPress,
}: {
  id: string;
  name: string;
  icon3d: string;
  accent: string;
  soft: string;
  active: boolean;
  delay: number;
  onPress: () => void;
  dark?: boolean;
}) {
  const scale = useSharedValue(1);
  const styleMeta = getActivityCardStyle(id);

  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withSpring(1.08, { damping: 12, stiffness: 260 }),
        withSpring(1.02, { damping: 14 })
      );
    } else {
      scale.value = withSpring(1, { damping: 14 });
    }
  }, [active]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(delay).duration(300)} style={styles.actCell}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.92, { damping: 14 });
        }}
        onPressOut={() => {
          scale.value = withSpring(active ? 1.02 : 1);
        }}
      >
        <Animated.View style={pressStyle}>
          <LinearGradient
            colors={
              active
                ? (styleMeta.darkBg as any)
                : ["rgba(255,255,255,0.045)", "rgba(255,255,255,0.015)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.actBtn,
              active
                ? {
                    borderColor: styleMeta.border,
                    borderWidth: 2,
                    shadowColor: styleMeta.glow,
                    shadowOpacity: 0.55,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 4,
                  }
                : {
                    borderColor: "rgba(255, 255, 255, 0.14)",
                    borderWidth: 1,
                  },
            ]}
          >
            {!active ? (
              <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFillObject} />
            ) : null}
            {active ? (
              <Animated.View
                entering={ZoomIn.duration(200)}
                style={[styles.actCheck, { backgroundColor: styleMeta.border }]}
              >
                <Ionicons name="checkmark" size={10} color="#fff" />
              </Animated.View>
            ) : null}

            <View style={styles.actIconPad}>
              <Image
                source={{ uri: icon3d }}
                style={styles.actIcon3d}
                resizeMode="contain"
              />
            </View>

            <Text
              style={[
                styles.actName,
                { color: active ? styleMeta.text : "#F1F5F9" },
                active && { fontFamily: VibeFonts.extraBold },
              ]}
              numberOfLines={1}
            >
              {name}
            </Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const SIMPLE_DATES = [
  { id: "today", label: "Today", icon: "sunny" as IonName },
  { id: "tomorrow", label: "Tomorrow", icon: "partly-sunny" as IonName },
];

const SIMPLE_TIMES = [
  { id: "morning", label: "AM", icon: "sunny" as IonName, customTime: "10:00" },
  { id: "afternoon", label: "PM", icon: "partly-sunny" as IonName, customTime: "16:00" },
  { id: "night", label: "Night", icon: "moon" as IonName, customTime: "21:00" },
];

const PEOPLE_OPTIONS = [2, 3, 4, 5, 6, 8];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatYmdLabel(ymd: string) {
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatPeriodLabel(customTime?: string) {
  if (customTime === "10:00") return "Morning";
  if (customTime === "15:00" || customTime === "16:00") return "Afternoon";
  if (customTime === "21:00") return "Night";
  return "Afternoon";
}

function formatClockLabel(customTime?: string) {
  if (!customTime) return "4:00 PM";
  const [h, m] = customTime.split(":").map(Number);
  if (Number.isNaN(h)) return customTime;
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Date-only calendar */
function CalendarPickerModal({
  visible,
  selectedYmd,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selectedYmd?: string;
  onClose: () => void;
  onSelect: (ymd: string) => void;
}) {
  const today = startOfDay(new Date());
  const initial = selectedYmd ? new Date(`${selectedYmd}T12:00:00`) : today;
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [draftYmd, setDraftYmd] = useState(selectedYmd || toYmd(today));

  useEffect(() => {
    if (!visible) return;
    const base = selectedYmd ? new Date(`${selectedYmd}T12:00:00`) : new Date();
    setCursor(new Date(base.getFullYear(), base.getMonth(), 1));
    setDraftYmd(selectedYmd || toYmd(new Date()));
  }, [visible, selectedYmd]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const canGoPrev =
    year > today.getFullYear() ||
    (year === today.getFullYear() && month > today.getMonth());

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.calOverlay} onPress={onClose}>
        <Pressable style={styles.calSheet} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={["#1F1833", "#14101F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.calInner}
          >
            <View style={styles.calHeader}>
              <Text style={styles.calTitle}>Pick a date</Text>
              <Pressable onPress={onClose} style={styles.calClose}>
                <Ionicons name="close" size={18} color="#E2E8F0" />
              </Pressable>
            </View>

            <View style={styles.calMonthRow}>
              <Pressable
                onPress={() => {
                  if (!canGoPrev) return;
                  setCursor(new Date(year, month - 1, 1));
                }}
                style={[styles.calNavBtn, !canGoPrev && { opacity: 0.3 }]}
                disabled={!canGoPrev}
              >
                <Ionicons name="chevron-back" size={18} color="#fff" />
              </Pressable>
              <Text style={styles.calMonthLabel}>{monthLabel}</Text>
              <Pressable
                onPress={() => setCursor(new Date(year, month + 1, 1))}
                style={styles.calNavBtn}
              >
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.calWeekRow}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={styles.calWeekday}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {cells.map((day, idx) => {
                if (day == null) {
                  return <View key={`e-${idx}`} style={styles.calDayCell} />;
                }
                const cellDate = new Date(year, month, day);
                const ymd = toYmd(cellDate);
                const disabled = startOfDay(cellDate) < today;
                const selected = draftYmd === ymd;
                const isToday = toYmd(today) === ymd;

                return (
                  <Pressable
                    key={ymd}
                    disabled={disabled}
                    onPress={() => setDraftYmd(ymd)}
                    style={[
                      styles.calDayCell,
                      selected && styles.calDaySelected,
                      isToday && !selected && styles.calDayToday,
                      disabled && { opacity: 0.28 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        selected && styles.calDayTextSelected,
                        isToday && !selected && { color: "#C4B5FD" },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => {
                onSelect(draftYmd);
                onClose();
              }}
              style={styles.calConfirmPress}
            >
              <LinearGradient
                colors={["#22C55E", "#16A34A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.calConfirmBtn}
              >
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.calConfirmText}>Confirm · {formatYmdLabel(draftYmd)}</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const STEPS = [
  { id: 1, label: "Vibe", icon: "sparkles" as IonName },
  { id: 2, label: "Activity", icon: "grid" as IonName },
  { id: 3, label: "Invite", icon: "people" as IonName },
  { id: 4, label: "Send", icon: "paper-plane" as IonName },
];

function ActivityLoopVideo({ source }: { source: number }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.sendMedia}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

function InviteActivityMedia({
  activityId,
  imageUrl,
  icon3d,
}: {
  activityId: string;
  imageUrl?: string;
  icon3d: string;
}) {
  const videoSource = ACT_VIDEOS[activityId];
  if (videoSource) {
    return <ActivityLoopVideo source={videoSource} />;
  }

  return (
    <View style={styles.sendMediaFallback}>
      <Image source={{ uri: imageUrl || icon3d }} style={styles.sendMediaImg} resizeMode="cover" />
      <LinearGradient
        colors={["transparent", "rgba(7,10,20,0.55)"]}
        style={StyleSheet.absoluteFill}
      />
      <Image source={{ uri: icon3d }} style={styles.sendMediaIcon} resizeMode="contain" />
    </View>
  );
}

function ProgressStepper({ filled }: { filled: number }) {
  return (
    <View style={styles.stepper}>
      {STEPS.map((step, i) => {
        const done = filled > i;
        const current = filled === i;
        return (
          <View key={step.id} style={styles.stepItem}>
            {i > 0 ? (
              <View style={[styles.stepLine, done && styles.stepLineDone]} />
            ) : (
              <View style={styles.stepLineSpacer} />
            )}
            <View
              style={[
                styles.stepDot,
                done && styles.stepDotDone,
                current && styles.stepDotCurrent,
              ]}
            >
              {done ? (
                <Ionicons name="checkmark" size={12} color="#fff" />
              ) : (
                <Ionicons
                  name={step.icon}
                  size={12}
                  color={current ? "#fff" : T.faint}
                />
              )}
            </View>
            <Text style={[styles.stepLabel, (done || current) && styles.stepLabelActive]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function CreatePlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 72 + Math.max(insets.bottom, 12);
  const scrollRef = useRef<ScrollView>(null);
  const { createPlan } = usePlans();
  const { matches } = useMatches();
  const { token, user } = useAuth();
  const [selectedVibe, setSelectedVibe] = useState("Lessgo");
  const [activityId, setActivityId] = useState("coffee");
  const [timeId, setTimeId] = useState<string | undefined>(undefined);
  const [dateId, setDateId] = useState<string>("today");
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("16:00");
  const [maxPeople, setMaxPeople] = useState(4);
  const [visibility, setVisibility] = useState<"PUBLIC" | "FRIENDS">("PUBLIC");
  const [showCalendar, setShowCalendar] = useState(false);
  const [place, setPlace] = useState("");
  const [planCityId, setPlanCityId] = useState<CityId>("nagpur");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedInviteeIds, setSelectedInviteeIds] = useState<string[]>([]);
  const [inviteWhatsApp, setInviteWhatsApp] = useState(false);
  const [showSendPreview, setShowSendPreview] = useState(false);
  const [showPlanBuilder, setShowPlanBuilder] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("@hangora_map_city");
        if (saved && CITIES.some((c) => c.id === saved)) {
          setPlanCityId(saved as CityId);
          return;
        }
        if (token) {
          const res = (await api.getProfile(token)) as any;
          const resolved = resolveCityId(res?.profile?.city);
          if (resolved) setPlanCityId(resolved);
        }
      } catch {
        /* keep default */
      }
    })();
  }, [token]);

  const planCity = CITIES.find((c) => c.id === planCityId) || CITIES[0];
  const activity = PLAN_ACTIVITIES.find((a) => a.id === activityId)!;
  const schedule = formatPlanSchedule({ timeId, dateId, customDate, customTime });
  const vibe = VIBE_ORBS.find((o) => o.id === selectedVibe) || VIBE_ORBS[0];
  const actMeta = ACT_META[activityId] || ACT_META.coffee;
  const calendarActive = dateId === "custom" && !!customDate;
  const selectedPeriod =
    SIMPLE_TIMES.find((t) => t.customTime === customTime)?.id || "afternoon";

  const progressFilled = useMemo(() => {
    let n = 1;
    if (activityId) n = 2;
    if (dateId || customDate || customTime || place.trim() || description.trim()) n = 3;
    if (selectedInviteeIds.length > 0 || inviteWhatsApp) n = 4;
    return n;
  }, [
    activityId,
    dateId,
    customDate,
    customTime,
    place,
    description,
    selectedInviteeIds.length,
    inviteWhatsApp,
  ]);

  const scheduleLabel =
    schedule.timeLabel === "Flexible"
      ? `${schedule.dateLabel} · ${formatPeriodLabel(customTime)}`
      : `${schedule.dateLabel} · ${schedule.timeLabel}`;
  const inviteTimeLabel = scheduleLabel;
  const upcomingPlace = place.trim() || "Downtown Cafe";
  const upcomingTitle = `${activity.name} at ${upcomingPlace}`;
  const upcomingTimeLine = `${schedule.dateLabel} • ${formatClockLabel(customTime)}`;
  const upcomingAvatars = matches.slice(0, 3);

  const selectedInvitees = useMemo(
    () => matches.filter((m) => selectedInviteeIds.includes(m.id)),
    [matches, selectedInviteeIds]
  );

  const inviteTargetLabel = useMemo(() => {
    if (selectedInvitees.length === 1) {
      return `to ${selectedInvitees[0].name.split(" ")[0]}`;
    }
    if (selectedInvitees.length > 1) {
      return `to ${selectedInvitees[0].name.split(" ")[0]} +${selectedInvitees.length - 1}`;
    }
    if (inviteWhatsApp) return "via WhatsApp";
    return "to nearby";
  }, [selectedInvitees, inviteWhatsApp]);

  const toggleInvitee = (id: string) => {
    setSelectedInviteeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openSendPreview = () => {
    setShowSendPreview(true);
  };

  const confirmSendInvite = () => {
    if (!inviteWhatsApp && selectedInviteeIds.length === 0) {
      Alert.alert("Pick someone", "Select WhatsApp or a match to invite.");
      return;
    }
    handleCreate({ forceWhatsApp: inviteWhatsApp });
  };

  const pickQuickDate = (id: string) => {
    setDateId(id);
    setCustomDate("");
  };

  const pickCalendarDate = (ymd: string) => {
    setDateId("custom");
    setCustomDate(ymd);
  };

  const pickPeriod = (opt: (typeof SIMPLE_TIMES)[number]) => {
    setCustomTime(opt.customTime);
    setTimeId(undefined);
  };

  const handleCreate = async (opts?: { forceWhatsApp?: boolean }) => {
    setSaving(true);
    const shareOnWhatsApp = opts?.forceWhatsApp || inviteWhatsApp;
    const energyLabel = `[Vibe: ${selectedVibe}]`;
    try {
      const placeText = place.trim();
      const alreadyHasCity = !!resolveCityId(placeText);
      let location = placeText
        ? alreadyHasCity
          ? placeText
          : `${placeText}, ${planCity.name}`
        : planCity.name;

      // Don't block invite send on GPS — attach coords if already available quickly
      let gps: { latitude: number; longitude: number; city?: string } | null = null;
      try {
        const { getCurrentUserLocation } = await import("../services/location");
        const locPromise = getCurrentUserLocation({ highAccuracy: false });
        const loc = await Promise.race([
          locPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
        ]);
        if (loc && "ok" in loc && loc.ok) {
          gps = {
            latitude: loc.location.latitude,
            longitude: loc.location.longitude,
            city: loc.location.city,
          };
          if (loc.location.city && !placeText) {
            location = loc.location.city;
          } else if (loc.location.city && placeText && !alreadyHasCity) {
            location = `${placeText}, ${loc.location.city}`;
          }
          // best-effort location sync in background
          api
            .updateLocation({
              latitude: loc.location.latitude,
              longitude: loc.location.longitude,
              city: loc.location.city,
            })
            .catch(() => {});
        } else {
          // finish GPS in background without delaying create
          locPromise
            .then((l) => {
              if (l.ok) {
                api
                  .updateLocation({
                    latitude: l.location.latitude,
                    longitude: l.location.longitude,
                    city: l.location.city,
                  })
                  .catch(() => {});
              }
            })
            .catch(() => {});
        }
      } catch {
        /* create still works without GPS */
      }

      const plan = await createPlan({
        activityId,
        activityName: activity.name,
        emoji: activity.emoji || "✨",
        timeId,
        dateId,
        customDate: dateId === "custom" ? customDate || undefined : undefined,
        customTime: customTime || undefined,
        maxParticipants: maxPeople,
        location,
        description: description.trim() ? `${energyLabel} ${description.trim()}` : energyLabel,
        imageUrl: activity.image,
        visibility,
        isPrivate: visibility === "FRIENDS",
        latitude: gps?.latitude,
        longitude: gps?.longitude,
      });

      await AsyncStorage.setItem("@hangora_map_city", planCityId);

      // Send invites to selected matches
      let inviteOk = 0;
      let inviteFail = 0;
      let lastInviteErr = "";
      const invitedNames: string[] = [];
      for (const invitee of selectedInvitees) {
        try {
          await api.sendInvite({
            receiverId: invitee.id,
            activityName: activity.name,
            activityEmoji: activity.emoji || "✨",
            timeLabel: inviteTimeLabel || "Soon",
            senderId: user?.id,
            hangoutId: plan.id,
          });
          inviteOk += 1;
          invitedNames.push(invitee.name.split(" ")[0]);
        } catch (err) {
          inviteFail += 1;
          lastInviteErr = err instanceof Error ? err.message : "Invite failed";
        }
      }

      // WhatsApp share — MUST include /p/{code} web RSVP page (guests without app)
      if (shareOnWhatsApp) {
        const {
          buildHangoutInviteShareMessage,
          buildWhatsAppShareUrl,
          resolveRsvpInviteUrl,
        } = await import("../utils/inviteShare");

        let pub: any = null;
        let inviteUrl: string | null = null;
        try {
          pub = await api.createPublicInvite({
            activityName: activity.name,
            activityEmoji: activity.emoji || "✨",
            timeLabel: inviteTimeLabel || "Soon",
            hangoutId: plan.id,
          });
          inviteUrl = resolveRsvpInviteUrl(pub);
          if (!inviteUrl) {
            // one retry
            pub = await api.createPublicInvite({
              activityName: activity.name,
              activityEmoji: activity.emoji || "✨",
              timeLabel: inviteTimeLabel || "Soon",
              hangoutId: plan.id,
            });
            inviteUrl = resolveRsvpInviteUrl(pub);
          }
        } catch (err) {
          console.error("WhatsApp invite create failed:", err);
        }

        if (!inviteUrl) {
          Alert.alert(
            "RSVP link nahi bani",
            "WhatsApp pe sirf website link nahi bhejenge.\n\nCheck internet / login, phir Invites → WhatsApp se dubara try karo.\nPlan save ho chuka hai."
          );
        } else {
          const msg = buildHangoutInviteShareMessage({
            senderName: user?.name || pub?.senderName,
            activityName: activity.name,
            activityEmoji: activity.emoji || "✨",
            timeLabel: inviteTimeLabel || "Soon",
            location,
            inviteUrl,
          });
          try {
            const waUrl = buildWhatsAppShareUrl(msg);
            const can = await Linking.canOpenURL(waUrl);
            if (can) await Linking.openURL(waUrl);
            else await Share.share({ message: msg });
          } catch {
            await Share.share({ message: msg });
          }
        }
      }

      setShowSendPreview(false);

      if (selectedInvitees.length > 0 && inviteOk === 0) {
        Alert.alert(
          "Plan ban gaya, invite nahi gaya",
          lastInviteErr ||
            "Internet weak lag raha hai. Plan save ho chuka hai — Invites se dubara bhejo.",
          [{ text: "OK", onPress: () => router.replace("/hangout") }]
        );
        return;
      }

      const who =
        invitedNames.length > 0
          ? ` Invite sent to ${invitedNames.join(", ")}${inviteFail > 0 ? ` (${inviteFail} failed)` : ""}.`
          : shareOnWhatsApp
            ? " Shared on WhatsApp — when they tap I'm Coming, they join your group & VibeSplit."
            : "";

      Alert.alert(
        "Invite sent! ✨",
        `${activity.name} is live.${who}`,
        [
          { text: "Open Chats", onPress: () => router.replace("/(tabs)/chats") },
          { text: "View Plans", onPress: () => router.replace("/hangout") },
        ]
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create plan";
      const isNet =
        /network|timed out|timeout|failed to fetch/i.test(msg) ||
        (e instanceof Error && (e as any).status === 0);
      Alert.alert(
        isNet ? "Connection issue" : "Error",
        isNet
          ? "Internet weak hai — dubara Sending Invite dabao. Plan abhi save nahi hua."
          : msg
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <MorphingMeshBackground />
      <StatusBar barStyle="light-content" backgroundColor="#08080A" />

      <View style={styles.foreground}>
      <AppHeader variant="dark" tagline="Craft a spontaneous hang ✨" />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: tabBarHeight + 100 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero — exact mockup: copy left + friends cutout right */}
        <Animated.View entering={FadeInDown.duration(420)} style={styles.heroWrap}>
          <View style={styles.hero}>
            <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFillObject} />
            <LinearGradient
              colors={[
                "rgba(255,120,40,0.18)",
                "rgba(255,45,122,0.08)",
                "rgba(18,14,22,0.55)",
                "rgba(12,10,16,0.72)",
              ]}
              locations={[0, 0.28, 0.65, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.heroSparkle}>
              <Ionicons name="sparkles" size={14} color="#FBBF24" />
            </View>
            <View style={styles.heroRow}>
              <View style={styles.heroCopy}>
                <View style={styles.heroMovesPill}>
                  <Text style={styles.heroMovesPillText}>✨ HANGOUT MODE</Text>
                </View>
                <Text style={styles.heroTitle}>Make Plans.</Text>
                <MaskedView
                  maskElement={
                    <Text style={[styles.heroTitle, styles.heroMemoriesMask]}>Make Memories.</Text>
                  }
                >
                  <LinearGradient
                    colors={["#E879A9", "#E8A87C", "#C9A227"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={[styles.heroTitle, styles.heroMemoriesMask, { opacity: 0 }]}>
                      Make Memories.
                    </Text>
                  </LinearGradient>
                </MaskedView>
                <Text style={styles.heroSub}>
                  Pick an activity, invite your people, and vibe together.
                </Text>
                <Pressable
                  onPress={() => {
                    setShowPlanBuilder(true);
                    openSendPreview();
                  }}
                  style={styles.heroCtaWrap}
                >
                  <LinearGradient
                  colors={["#C9A227", "#E879A9", "#D4895A"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.heroCta}
                >
                  <Text style={styles.heroCtaText}>Create a Plan</Text>
                  <View style={styles.heroCtaPlus}>
                    <Ionicons name="add" size={18} color="#1A1520" />
                  </View>
                </LinearGradient>
                </Pressable>
              </View>
              <View style={styles.heroFriendsWrap} pointerEvents="none">
                <Image
                  source={friendsHangout3d}
                  style={styles.heroFriendsImg}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Pick an Activity */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <View style={styles.pickHead}>
            <View style={styles.pickTitleRow}>
              <Ionicons name="game-controller" size={18} color="#A78BFA" />
              <Text style={styles.pickTitle}>Pick an Activity</Text>
              <Pressable
                onPress={() => router.push("/hangout")}
                style={styles.pickViewAll}
                hitSlop={8}
              >
                <Text style={styles.pickViewAllText}>View all</Text>
                <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.55)" />
              </Pressable>
            </View>
          </View>

          <View style={styles.actGrid}>
            {MOCKUP_ACTIVITY_ORDER.map((id) => PLAN_ACTIVITIES.find((a) => a.id === id))
              .filter(Boolean)
              .map((act, idx) => {
                const meta = ACT_META[act!.id] || ACT_META.coffee;
                return (
                  <GameActivityTile
                    key={act!.id}
                    id={act!.id}
                    name={act!.id === "sutta" ? "Sutta Meet" : act!.name}
                    icon3d={meta.icon3d}
                    accent={meta.accent}
                    soft={`${meta.accent}30`}
                    active={activityId === act!.id}
                    delay={160 + idx * 30}
                    onPress={() => setActivityId(act!.id)}
                  />
                );
              })}
          </View>
        </Animated.View>

        {/* Your upcoming plan — exact mockup card */}
        <Animated.View entering={FadeInDown.delay(160).duration(360)} style={styles.hangSummary}>
          <View style={styles.hangSummaryIconWrap}>
            <Image source={{ uri: actMeta.icon3d }} style={styles.hangSummaryIcon} />
          </View>
          <View style={styles.upcomingCopy}>
            <Text style={styles.upcomingLabel}>Your upcoming plan</Text>
            <Text style={styles.hangSummaryTitle} numberOfLines={1}>
              {upcomingTitle}
            </Text>
            <View style={styles.upcomingDetailsRow}>
              <View style={styles.upcomingMetaRow}>
                <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.55)" />
                <Text style={styles.hangSummaryMeta}>{upcomingTimeLine}</Text>
              </View>
              <View style={styles.upcomingMetaRow}>
                <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.45)" />
                <Text style={styles.hangSummaryCap}>{maxPeople} people joining</Text>
              </View>
            </View>
          </View>
          <View style={styles.hangAvatarStack}>
            {upcomingAvatars.length > 0
              ? upcomingAvatars.map((m, i) => (
                  <Image
                    key={m.id}
                    source={{ uri: m.avatarUrl }}
                    style={[
                      styles.hangAvatarImg,
                      {
                        marginLeft: i === 0 ? 0 : -10,
                        zIndex: 3 - i,
                      },
                    ]}
                  />
                ))
              : [0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.hangAvatarGhost,
                      {
                        marginLeft: i === 0 ? 0 : -10,
                        zIndex: 3 - i,
                        backgroundColor: ["#C4B5FD", "#FF8A3D", "#FF4D8D"][i],
                      },
                    ]}
                  >
                    <Ionicons name="person" size={10} color="#fff" />
                  </View>
                ))}
            <View style={[styles.hangAvatarGhost, styles.hangAvatarMore, { marginLeft: -8 }]}>
              <Text style={styles.hangAvatarMoreText}>+1</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color="rgba(255,255,255,0.45)"
              style={{ marginLeft: 6 }}
            />
          </View>
        </Animated.View>

        {showPlanBuilder ? (
        <>
        {/* Invite your people */}
        <Animated.View entering={FadeInDown.delay(260).duration(360)} style={styles.section}>
          <View style={styles.inviteHeadRow}>
            <Ionicons name="paper-plane" size={14} color={T.orange} />
            <Text style={styles.inviteHeadTitle}>Invite your people</Text>
          </View>
          <View style={styles.inviteTeaserRow}>
            <Pressable
              onPress={() => {
                setInviteWhatsApp(true);
                openSendPreview();
              }}
              style={styles.inviteTeaserWa}
            >
              <View style={styles.inviteTeaserWaIcon}>
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inviteTeaserTitle}>WhatsApp</Text>
                <Text style={styles.inviteTeaserSub}>Share invite</Text>
              </View>
            </Pressable>
            {matches[0] ? (
              <Pressable
                onPress={() => {
                  if (!selectedInviteeIds.includes(matches[0].id)) {
                    toggleInvitee(matches[0].id);
                  }
                  openSendPreview();
                }}
                style={styles.inviteTeaserMatch}
              >
                <Image source={{ uri: matches[0].avatarUrl }} style={styles.inviteTeaserAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.inviteTeaserTitle} numberOfLines={1}>
                    {matches[0].name.split(" ")[0]}
                  </Text>
                  <Text style={styles.inviteTeaserSub}>Share invite</Text>
                </View>
              </Pressable>
            ) : null}
            <View style={styles.inviteTeaserTip}>
              <Ionicons name="diamond" size={14} color={T.yellow} />
              <Text style={styles.inviteTeaserTipText}>
                Plans with place + time get 3× more joins. Keep notes playful.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* When & Where */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <View style={styles.sectionCardLight}>
            <View style={styles.sectionHead}>
              <View style={[styles.stepBadge, { backgroundColor: T.orangeDeep }]}>
                <Ionicons name="calendar" size={11} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitleDark}>When & Where</Text>
                <Text style={styles.sectionSubDark}>Schedule, spot · size</Text>
              </View>
            </View>

            {/* Date */}
            <View style={styles.wwSegRow}>
              {SIMPLE_DATES.map((d) => {
                const active = dateId === d.id;
                return (
                  <Pressable
                    key={d.id}
                    onPress={() => pickQuickDate(d.id)}
                    style={[styles.wwSeg, active && styles.wwSegPromoOn]}
                  >
                    <Ionicons name={d.icon} size={14} color={active ? "#fff" : T.orange} />
                    <Text style={[styles.wwSegText, active && styles.wwSegTextLight]}>{d.label}</Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setShowCalendar(true)}
                style={[styles.wwSeg, calendarActive && styles.wwSegPromoOn]}
              >
                <Ionicons name="calendar" size={14} color={calendarActive ? "#fff" : T.orange} />
                <Text style={[styles.wwSegText, calendarActive && styles.wwSegTextLight]} numberOfLines={1}>
                  {calendarActive ? formatYmdLabel(customDate) : "Pick"}
                </Text>
              </Pressable>
            </View>

            {/* Time */}
            <View style={[styles.wwSegRow, { marginTop: 8 }]}>
              {SIMPLE_TIMES.map((t) => {
                const active = selectedPeriod === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => pickPeriod(t)}
                    style={[styles.wwSeg, active && styles.wwSegPinkOn]}
                  >
                    <Ionicons name={t.icon} size={14} color={active ? "#fff" : T.pink} />
                    <Text style={[styles.wwSegText, active && styles.wwSegTextLight]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* People + Privacy */}
            <View style={styles.wwMetaRow}>
              <View style={styles.wwPeople}>
                <Pressable
                  onPress={() => setMaxPeople((n) => Math.max(2, n - 1))}
                  style={styles.wwStepOrange}
                >
                  <Ionicons name="remove" size={15} color={T.orange} />
                </Pressable>
                <View style={styles.wwPeopleVal}>
                  <Ionicons name="people" size={13} color="#fff" />
                  <Text style={styles.wwPeopleNum}>{maxPeople}</Text>
                </View>
                <Pressable
                  onPress={() => setMaxPeople((n) => Math.min(12, n + 1))}
                  style={styles.wwStepOrange}
                >
                  <Ionicons name="add" size={15} color={T.orange} />
                </Pressable>
              </View>

              <View style={styles.wwPrivacy}>
                <Pressable
                  onPress={() => setVisibility("PUBLIC")}
                  style={[styles.wwPrivBtn, visibility === "PUBLIC" && styles.wwPrivPromoOn]}
                >
                  <Ionicons
                    name="earth"
                    size={13}
                    color={visibility === "PUBLIC" ? "#fff" : "rgba(255,255,255,0.55)"}
                  />
                  <Text
                    style={[
                      styles.wwPrivText,
                      visibility === "PUBLIC" && styles.wwPrivTextOn,
                    ]}
                  >
                    Public
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setVisibility("FRIENDS")}
                  style={[styles.wwPrivBtn, visibility === "FRIENDS" && styles.wwPrivPromoOn]}
                >
                  <Ionicons
                    name="lock-closed"
                    size={12}
                    color={visibility === "FRIENDS" ? "#fff" : "rgba(255,255,255,0.55)"}
                  />
                  <Text
                    style={[
                      styles.wwPrivText,
                      visibility === "FRIENDS" && styles.wwPrivTextOn,
                    ]}
                  >
                    Friends
                  </Text>
                </Pressable>
              </View>
            </View>

            <CalendarPickerModal
              visible={showCalendar}
              selectedYmd={customDate || undefined}
              onClose={() => setShowCalendar(false)}
              onSelect={pickCalendarDate}
            />

            {/* City — ORANGE active */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.wwCityRow}
            >
              {CITIES.map((c) => {
                const active = planCityId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setPlanCityId(c.id)}
                    style={[styles.wwCityChip, active && styles.wwCityChipOn]}
                  >
                    <Text style={styles.wwCityEmoji}>{c.emoji}</Text>
                    <Text style={[styles.wwCityText, active && styles.wwCityTextOn]}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={[styles.wwInput, styles.wwInputOrange]}>
              <Ionicons name="location" size={15} color={T.orange} />
              <TextInput
                style={styles.wwInputText}
                value={place}
                onChangeText={setPlace}
                placeholder={`Place in ${planCity.name}…`}
                placeholderTextColor="rgba(255,255,255,0.35)"
              />
              {place.trim() ? (
                <Ionicons name="checkmark-circle" size={16} color={T.orange} />
              ) : null}
            </View>

            <View style={[styles.wwInput, styles.wwInputPurple, styles.wwNote]}>
              <Ionicons name="chatbubble-ellipses" size={15} color={T.pink} style={{ marginTop: 1 }} />
              <TextInput
                style={[styles.wwInputText, styles.wwNoteText]}
                value={description}
                onChangeText={setDescription}
                placeholder="One-liner for the squad…"
                placeholderTextColor="rgba(255,255,255,0.35)"
                multiline
                maxLength={120}
              />
            </View>
          </View>
        </Animated.View>
        </>
        ) : null}
      </ScrollView>

      {/* Sticky CTA — green Create Hangout */}
      <View style={[styles.footer, { bottom: tabBarHeight }]}>
        <LinearGradient
          colors={["transparent", "rgba(18,18,18,0.75)", "#121212"]}
          style={styles.footerFade}
        />
        <View style={styles.ctaWrap}>
          <Pressable
            onPress={() => {
              setShowPlanBuilder(true);
              openSendPreview();
            }}
            disabled={saving}
            style={({ pressed }) => [
              styles.ctaPressPromo,
              pressed && styles.ctaPressed,
              saving && { opacity: 0.7 },
            ]}
          >
            <LinearGradient
              colors={["#1FA971", "#3DDC97"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBtnPromo}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.ctaText}>
                {saving ? "Sending…" : "Create Hangout"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
      <TabBar dark={true} />
      </View>

      {/* Who's coming? — enhanced premium invite sheet */}
      <Modal
        visible={showSendPreview}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSendPreview(false)}
      >
        <View style={styles.sendModalRoot}>
          <Pressable style={styles.sendModalDim} onPress={() => setShowSendPreview(false)} />
          <View style={[styles.inviteSheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <LinearGradient
              colors={["#1A1520", "#141218", "#101014"]}
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              colors={[
                "rgba(255,138,0,0.16)",
                "rgba(255,45,122,0.1)",
                "transparent",
                "rgba(168,85,247,0.12)",
              ]}
              locations={[0, 0.28, 0.6, 1]}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.sendHandle} />

            <Pressable style={styles.inviteCloseBtn} onPress={() => setShowSendPreview(false)}>
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.8)" />
            </Pressable>

            <View style={styles.inviteSheetHead}>
              <View style={styles.inviteSheetBadge}>
                <LinearGradient
                  colors={["#C9A227", "#E879A9"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Ionicons name="paper-plane" size={11} color="#fff" />
                <Text style={styles.inviteSheetBadgeText}>INVITE</Text>
              </View>
              <View style={styles.inviteTitleRow}>
                <Text style={styles.inviteSheetTitle}>Who’s </Text>
                <MaskedView
                  maskElement={
                    <Text style={[styles.inviteSheetTitle, styles.inviteTitleAccent]}>
                      coming?
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={["#E879A9", "#E8A87C", "#C9A227"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text
                      style={[styles.inviteSheetTitle, styles.inviteTitleAccent, { opacity: 0 }]}
                    >
                      coming?
                    </Text>
                  </LinearGradient>
                </MaskedView>
                <Text style={styles.inviteSpark}>✨</Text>
              </View>
              <Text style={styles.inviteSheetSub}>
                {activity.name} · {inviteTimeLabel} · {place.trim() || planCity.name}
              </Text>
            </View>

            <View style={styles.inviteVideoWrap}>
              <InviteActivityMedia
                activityId={activityId}
                imageUrl={activity.image}
                icon3d={actMeta.icon3d}
              />
              <LinearGradient
                colors={["transparent", "rgba(10,8,14,0.75)"]}
                style={styles.inviteVideoBottomFade}
              />
              <Text style={styles.inviteNeonCaption}>
                Good vibes · great company · best {activity.name.toLowerCase()} 💜
              </Text>
            </View>

            <View style={styles.inviteMetaCard}>
              <View style={[styles.inviteMetaIconRing, { borderColor: `${actMeta.accent}88` }]}>
                <Image source={{ uri: actMeta.icon3d }} style={styles.inviteMetaIcon} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.inviteMetaTitle} numberOfLines={1}>
                  hang for {activity.name.toLowerCase()}?
                </Text>
                <View style={styles.inviteMetaLocRow}>
                  <Ionicons name="location" size={11} color="rgba(255,255,255,0.55)" />
                  <Text style={styles.inviteMetaSub} numberOfLines={1}>
                    {place.trim() || planCity.name}
                  </Text>
                </View>
                <View style={styles.inviteMetaLocRow}>
                  <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.45)" />
                  <Text style={styles.inviteMetaSub}>{upcomingTimeLine}</Text>
                </View>
              </View>
              <View style={styles.inviteMetaCount}>
                <Ionicons name="people" size={13} color="#A78BFA" />
                <Text style={styles.inviteMetaCountText}>{maxPeople}</Text>
                <Text style={styles.inviteMetaCountHint}>spots</Text>
              </View>
            </View>

            <View style={styles.invitePickHead}>
              <Text style={styles.invitePickLabel}>SEND TO</Text>
              <View style={styles.invitePickCountPill}>
                <Text style={styles.invitePickCountText}>
                  {(inviteWhatsApp ? 1 : 0) + selectedInviteeIds.length} selected
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.invitePeopleRow}
            >
              <Pressable
                onPress={() => setInviteWhatsApp((v) => !v)}
                style={styles.invitePersonCard}
              >
                <View
                  style={[
                    styles.invitePersonRing,
                    inviteWhatsApp && styles.invitePersonRingOnWa,
                  ]}
                >
                  <LinearGradient
                    colors={inviteWhatsApp ? ["#22C55E", "#16A34A"] : ["#25D366", "#128C7E"]}
                    style={styles.invitePersonOrb}
                  >
                    <Ionicons name="logo-whatsapp" size={22} color="#fff" />
                  </LinearGradient>
                  {inviteWhatsApp ? (
                    <View style={[styles.invitePersonTick, { backgroundColor: "#22C55E" }]}>
                      <Ionicons name="checkmark" size={9} color="#fff" />
                    </View>
                  ) : null}
                </View>
                <Text style={styles.invitePersonLabel} numberOfLines={1}>
                  WhatsApp
                </Text>
              </Pressable>

              {matches.length === 0 ? (
                <View style={styles.invitePersonCard}>
                  <View style={styles.invitePersonRing}>
                    <View style={[styles.invitePersonOrb, styles.invitePersonOrbEmpty]}>
                      <Ionicons name="people-outline" size={20} color="#C4B5FD" />
                    </View>
                  </View>
                  <Text style={styles.invitePersonLabel}>No matches</Text>
                </View>
              ) : (
                matches.map((m) => {
                  const on = selectedInviteeIds.includes(m.id);
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => toggleInvitee(m.id)}
                      style={styles.invitePersonCard}
                    >
                      <View style={[styles.invitePersonRing, on && styles.invitePersonRingOn]}>
                        <Image source={{ uri: m.avatarUrl }} style={styles.invitePersonPhoto} />
                        {on ? (
                          <View style={styles.invitePersonTick}>
                            <Ionicons name="checkmark" size={9} color="#fff" />
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.invitePersonLabel} numberOfLines={1}>
                        {m.name.split(" ")[0]}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.inviteSendingRow}>
              {selectedInvitees.slice(0, 4).map((m, i) => (
                <Image
                  key={m.id}
                  source={{ uri: m.avatarUrl }}
                  style={[styles.inviteSendingAvatar, { marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i }]}
                />
              ))}
              {inviteWhatsApp ? (
                <View
                  style={[
                    styles.inviteSendingAvatar,
                    styles.inviteSendingWa,
                    { marginLeft: selectedInvitees.length > 0 ? -8 : 0 },
                  ]}
                >
                  <Ionicons name="logo-whatsapp" size={11} color="#fff" />
                </View>
              ) : null}
              <Text style={styles.invitePickSummary}>
                {selectedInvitees.length > 0 || inviteWhatsApp ? (
                  <>
                    Ready to invite{" "}
                    <Text style={{ color: "#86EFAC", fontFamily: VibeFonts.bold }}>
                      {inviteTargetLabel.replace(/^to |^via /, "")}
                    </Text>
                  </>
                ) : (
                  "Pick WhatsApp or friends to invite"
                )}
              </Text>
            </View>

            <Pressable
              onPress={confirmSendInvite}
              disabled={saving}
              style={({ pressed }) => [
                styles.inviteSheetCta,
                pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                saving && { opacity: 0.7 },
              ]}
            >
              <LinearGradient
                colors={["#1FA971", "#3DDC97"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.inviteSheetCtaGrad}
              >
                <Ionicons name="paper-plane" size={17} color="#fff" />
                <Text style={styles.inviteSheetCtaText}>
                  {saving ? "Sending…" : "Send Invite"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#08080A" },
  foreground: { flex: 1, zIndex: 1, backgroundColor: "transparent" },
  glowTop: {
    position: "absolute",
    top: -50,
    left: -30,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  glowMid: {
    position: "absolute",
    top: 180,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  coolOrb: {
    position: "absolute",
    top: "42%",
    left: -80,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(125, 211, 252, 0.12)",
  },
  pinkOrb: {
    position: "absolute",
    bottom: 220,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(244, 114, 182, 0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  headerCenter: { alignItems: "center" },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerEyebrow: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.purple,
    letterSpacing: 1.6,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    marginTop: 1,
    letterSpacing: -0.3,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 6 },
  heroWrap: { marginBottom: 22 },
  hero: {
    borderRadius: 24,
    minHeight: 208,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.28)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingLeft: 18,
    paddingTop: 18,
    paddingBottom: 18,
    minHeight: 208,
  },
  heroSparkle: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 5,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroFriendsWrap: {
    width: SCREEN_W * 0.36,
    maxWidth: 148,
    justifyContent: "flex-end",
    alignItems: "center",
    marginRight: -2,
  },
  heroFriendsImg: {
    width: "115%",
    height: 172,
    marginBottom: -6,
  },
  heroBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    opacity: 0.78,
  },
  heroBlobA: {
    position: "absolute",
    right: -10,
    top: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "transparent",
  },
  heroBlobB: {
    position: "absolute",
    right: 40,
    bottom: -40,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "transparent",
  },
  heroCopy: { flex: 1, zIndex: 2, paddingRight: 6, justifyContent: "center" },
  heroMovesPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.35)",
  },
  heroMovesPillText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#E8D5A3",
    letterSpacing: 1.1,
  },
  heroPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroPillText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 27,
    fontFamily: VibeFonts.extraBold,
    color: "#F7F5F2",
    letterSpacing: -0.9,
    lineHeight: 32,
  },
  heroMemoriesMask: {
    marginTop: 0,
  },
  heroTitleAccent: {
    color: "#E879A9",
  },
  heroTitleAccentPink: {
    color: "#E879A9",
  },
  heroTitleAccentMid: {
    color: "#E8A87C",
  },
  heroTitleAccentOrange: {
    color: "#C9A227",
  },
  heroSub: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "rgba(247,245,242,0.58)",
    lineHeight: 19,
    maxWidth: SCREEN_W * 0.52,
  },
  heroCtaWrap: {
    alignSelf: "flex-start",
    marginTop: 16,
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 18,
    paddingRight: 7,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: "#C9A227",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  heroCtaText: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#0A0A0C",
  },
  heroCtaPlus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F7F5F2",
    alignItems: "center",
    justifyContent: "center",
  },
  heroPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  heroMiniPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroMiniPillText: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: "#fff",
  },
  planTabs: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    padding: 4,
    overflow: "hidden",
  },
  planTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  planTabOn: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  planTabGrad: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
  },
  planTabText: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: "rgba(255,255,255,0.7)",
  },
  planTabTextOn: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },
  planTabDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  pickHead: {
    marginBottom: 12,
  },
  pickTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pickViewAll: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  pickViewAllText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: "rgba(247,245,242,0.42)",
  },
  pickTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: "#F7F5F2",
    letterSpacing: -0.4,
  },
  pickSub: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.45)",
  },
  hangSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
    marginTop: 4,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  hangSummaryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.4)",
  },
  hangSummaryIcon: { width: 36, height: 36 },
  upcomingCopy: { flex: 1, minWidth: 0 },
  upcomingLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: "#C9A227",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  upcomingDetailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  upcomingMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hangSummaryCap: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(247,245,242,0.42)",
  },
  hangSummaryTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#F7F5F2",
    letterSpacing: -0.2,
  },
  hangSummaryMeta: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "rgba(247,245,242,0.52)",
  },
  hangAvatarStack: { flexDirection: "row", alignItems: "center" },
  hangAvatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#141218",
  },
  hangAvatarGhost: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#0C0C10",
    alignItems: "center",
    justifyContent: "center",
  },
  hangAvatarMore: { backgroundColor: "rgba(255,255,255,0.16)" },
  hangAvatarMoreText: {
    fontSize: 8,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },
  inviteHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  inviteHeadTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
  },
  inviteTeaserRow: {
    flexDirection: "row",
    gap: 10,
  },
  inviteTeaserWa: {
    flex: 1.1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  inviteTeaserWaIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteTeaserMatch: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "rgba(139,92,246,0.28)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  inviteTeaserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  inviteTeaserTitle: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },
  inviteTeaserSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.7)",
  },
  inviteTeaserTip: {
    flex: 1.15,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    padding: 10,
    borderRadius: 18,
    backgroundColor: "rgba(88, 28, 135, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  inviteTeaserTipText: {
    flex: 1,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.75)",
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  heroStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroStatText: {
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
    color: T.muted,
  },
  heroStatDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: T.faint,
  },
  friendsStage: {
    position: "absolute",
    right: -2,
    bottom: -4,
    width: 126,
    height: 126,
    alignItems: "center",
    justifyContent: "center",
  },
  friendsGlowRing: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "rgba(167,139,250,0.28)",
  },
  friendsFloat: {
    width: 118,
    height: 118,
    zIndex: 2,
  },
  friendsImage: {
    width: "100%",
    height: "100%",
  },
  sparkle: {
    position: "absolute",
    zIndex: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sparkleA: { top: 6, left: 4 },
  sparkleB: { bottom: 14, right: 2 },
  summaryIcon3d: { width: 16, height: 16 },
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: T.pink,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  xpPillCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  xpPillText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#fff",
    letterSpacing: 0.4,
  },
  stepper: {
    flexDirection: "row",
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
    shadowColor: "#1A1F36",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  stepItem: { flex: 1, alignItems: "center" },
  stepLineSpacer: { height: 2, width: "40%", marginBottom: 8, opacity: 0 },
  stepLine: {
    position: "absolute",
    top: 13,
    left: -20,
    right: "50%",
    height: 2,
    backgroundColor: T.border,
    zIndex: 0,
  },
  stepLineDone: { backgroundColor: T.purple },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(139, 92, 246, 0.16)",
    borderWidth: 1.5,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  stepDotDone: {
    backgroundColor: T.purple,
    borderColor: T.purple,
  },
  stepDotCurrent: {
    backgroundColor: T.pink,
    borderColor: T.pink,
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
    color: T.faint,
  },
  stepLabelActive: { color: T.ink },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  summaryChipText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    maxWidth: 90,
  },
  section: { marginBottom: 18 },
  sectionCard: {
    backgroundColor: T.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  sectionCardLight: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    padding: 16,
    overflow: "hidden",
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  sectionPurple: {
    borderColor: "rgba(167, 139, 250, 0.45)",
    backgroundColor: "rgba(124, 58, 237, 0.10)",
  },
  sectionOrange: {
    borderColor: "rgba(251, 146, 60, 0.45)",
    backgroundColor: "rgba(249, 115, 22, 0.10)",
  },
  sectionYellow: {
    borderColor: "rgba(251, 191, 36, 0.5)",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
  },
  whenCard: {
    paddingBottom: 14,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  wwColorDots: { flexDirection: "row", alignItems: "center", gap: 5 },
  wwDot: { width: 8, height: 8, borderRadius: 4 },
  wwSegRow: {
    flexDirection: "row",
    gap: 8,
  },
  wwSeg: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
  },
  wwSegPurple: {
    borderColor: "rgba(167, 139, 250, 0.35)",
  },
  wwSegPurpleOn: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  wwSegPromoOn: {
    backgroundColor: "#FF8A3D",
    borderColor: "#FF8A3D",
  },
  wwSegPinkOn: {
    backgroundColor: "#FF4D8D",
    borderColor: "#FF4D8D",
  },
  wwSegYellow: {
    borderColor: "rgba(251, 191, 36, 0.35)",
  },
  wwSegYellowOn: {
    backgroundColor: "#FBBF24",
    borderColor: "#FBBF24",
  },
  wwSegText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: "rgba(255,255,255,0.78)",
  },
  wwSegTextLight: {
    color: "#FFFFFF",
    fontFamily: VibeFonts.bold,
  },
  wwSegTextDark: {
    color: "#0B0D12",
    fontFamily: VibeFonts.bold,
  },
  wwMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  wwPeople: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 138, 61, 0.45)",
  },
  wwStepOrange: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 138, 61, 0.18)",
  },
  wwPeopleVal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 52,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 10,
    backgroundColor: "#FF8A3D",
    justifyContent: "center",
  },
  wwPeopleNum: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
  },
  wwPrivacy: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 77, 141, 0.4)",
    gap: 2,
  },
  wwPrivBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 999,
  },
  wwPrivOn: {
    backgroundColor: "#8B5CF6",
  },
  wwPrivPromoOn: {
    backgroundColor: "#FF4D8D",
  },
  wwPrivText: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: "rgba(255,255,255,0.55)",
  },
  wwPrivTextOn: {
    color: "#FFFFFF",
    fontFamily: VibeFonts.bold,
  },
  wwCityRow: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 2,
  },
  wwCityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  wwCityChipOn: {
    backgroundColor: "rgba(249, 115, 22, 0.22)",
    borderColor: "rgba(251, 146, 60, 0.6)",
  },
  wwCityEmoji: { fontSize: 13 },
  wwCityText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: "rgba(255,255,255,0.65)",
  },
  wwCityTextOn: {
    color: T.orange,
    fontFamily: VibeFonts.bold,
  },
  wwInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 14,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
  },
  wwInputOrange: {
    borderColor: "rgba(251, 146, 60, 0.35)",
  },
  wwInputPurple: {
    borderColor: "rgba(236, 72, 153, 0.3)",
  },
  wwInputText: {
    flex: 1,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: "#FFFFFF",
    paddingVertical: 12,
  },
  wwNote: {
    alignItems: "flex-start",
    paddingVertical: 10,
    minHeight: 56,
  },
  wwNoteText: {
    minHeight: 36,
    textAlignVertical: "top",
    paddingTop: 0,
  },
  sectionCardDark: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 16,
    overflow: "hidden",
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  darkGlowA: {
    position: "absolute",
    top: -36,
    right: -24,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(139,92,246,0.16)",
  },
  darkGlowB: {
    position: "absolute",
    bottom: -40,
    left: -28,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(236,72,153,0.1)",
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.faint,
    marginTop: 1,
  },
  sectionTitleDark: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#F4F6FB",
  },
  sectionSubDark: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#A7B0C4",
    marginTop: 1,
  },
  sectionHint: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHintDark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(167,139,250,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionalPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  optionalPillYellow: {
    backgroundColor: "rgba(251, 191, 36, 0.16)",
    borderColor: "rgba(251, 191, 36, 0.35)",
  },
  optionalPillText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "rgba(255,255,255,0.85)",
  },
  optionalPillDark: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(167,139,250,0.18)",
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.25)",
  },
  optionalPillTextDark: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#C4B5FD",
  },
  simpleFieldLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  simpleSegRow: {
    flexDirection: "row",
    gap: 7,
  },
  simpleSeg: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  simpleSegActiveWrap: {
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  simpleSegActive: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 14,
  },
  simpleSegText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: "rgba(255,255,255,0.72)",
  },
  simpleSegTextActive: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },
  calendarSeg: {
    flex: 1.15,
  },
  peopleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  inputRowDark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  inputDark: {
    flex: 1,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: "#F4F6FB",
    paddingVertical: 13,
  },
  noteRowDark: {
    alignItems: "flex-start",
    marginTop: 10,
    paddingVertical: 10,
  },
  noteInputDark: {
    minHeight: 44,
    textAlignVertical: "top",
    paddingTop: 0,
    color: "#F4F6FB",
  },
  peopleStepBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(139, 92, 246, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  peopleValueBox: {
    minWidth: 80,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(251, 191, 36, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  peopleValue: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: T.yellow,
  },
  peopleValueHint: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.yellowDeep,
  },
  peopleChip: {
    minWidth: 32,
    height: 32,
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(12, 16, 30, 0.85)",
    borderWidth: 1,
    borderColor: T.border,
  },
  peopleChipActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  peopleChipText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#E2E8F0",
  },
  peopleChipTextActive: {
    color: "#FFFFFF",
    fontFamily: VibeFonts.extraBold,
  },
  pickedDateRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(167,139,250,0.14)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
  },
  pickedDateText: {
    flex: 1,
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: "#E9D5FF",
  },
  pickedDateChange: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#C4B5FD",
  },
  calOverlay: {
    flex: 1,
    backgroundColor: "rgba(10,8,18,0.72)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  calSheet: {
    borderRadius: 22,
    overflow: "hidden",
  },
  calInner: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
    padding: 16,
  },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#F8FAFC",
  },
  calClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  calMonthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(139,92,246,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  calMonthLabel: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#F1F5F9",
  },
  calWeekRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  calWeekday: {
    width: `${100 / 7}%` as unknown as number,
    textAlign: "center",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "rgba(226,232,240,0.45)",
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calDayCell: {
    width: `${100 / 7}%` as unknown as number,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  calDaySelected: {
    backgroundColor: "#8B5CF6",
  },
  calDayToday: {
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.55)",
  },
  calDayText: {
    fontSize: 13,
    fontFamily: VibeFonts.semiBold,
    color: "rgba(248,250,252,0.85)",
  },
  calDayTextSelected: {
    color: "#fff",
    fontFamily: VibeFonts.bold,
  },
  calConfirmPress: {
    marginTop: 14,
    borderRadius: 14,
    overflow: "hidden",
  },
  calConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  calConfirmText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },
  peopleQuickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    flex: 1,
  },
  whenDivider: {
    height: 1,
    backgroundColor: "rgba(148, 163, 184, 0.14)",
    marginVertical: 10,
  },
  cityPickLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#94A3B8",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  cityPickRow: {
    gap: 8,
    paddingBottom: 12,
  },
  cityPickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(12, 16, 30, 0.85)",
    borderWidth: 1,
    borderColor: T.border,
  },
  cityPickChipActive: {
    backgroundColor: T.yellowDeep,
    borderColor: T.yellow,
  },
  cityPickEmoji: { fontSize: 14 },
  cityPickText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: "#E2E8F0",
  },
  cityPickTextActive: {
    color: "#FFFFFF",
    fontFamily: VibeFonts.bold,
  },
  charCountDark: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 2,
  },
  vibeRow: { flexDirection: "row", gap: 8 },
  vibeCard: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: T.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    overflow: "hidden",
  },
  vibeCardDark: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    overflow: "hidden",
  },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  checkBadgeDark: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  vibeOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  vibeOrbDark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  vibeOrbActive: { transform: [{ scale: 1.06 }] },
  vibeLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  vibeDesc: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: T.faint,
    marginTop: 2,
    textAlign: "center",
  },
  vibeLabelDark: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#F1F5F9",
  },
  vibeDescDark: {
    fontSize: 9,
    fontFamily: VibeFonts.medium,
    color: "rgba(226,232,240,0.48)",
    marginTop: 1,
    textAlign: "center",
  },
  actGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  actCell: { width: "22.8%" },
  actBtn: {
    aspectRatio: 0.9,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    paddingTop: 12,
    paddingBottom: 10,
    overflow: "hidden",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  actCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  cardCenterGlow: {
    position: "absolute",
    top: "15%",
    left: "15%",
    width: "70%",
    height: "70%",
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
  },
  actIconPadFull: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  vapourContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  vapourParticle: {
    position: "absolute",
    fontSize: 10,
    top: 6,
  },
  actIconPad: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  actIcon3d: {
    width: 46,
    height: 46,
  },
  actName: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#F4F6FB",
    textAlign: "center",
    marginTop: 2,
  },
  fieldHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.ink,
    letterSpacing: 0.2,
  },
  chipRow: { gap: 10, paddingBottom: 12 },
  chip: {
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    gap: 6,
  },
  chipActive: {
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: "center",
    gap: 6,
  },
  timeChip: {
    minWidth: 104,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    gap: 4,
  },
  timeChipActive: {
    minWidth: 104,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: "center",
    gap: 4,
  },
  chipIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  chipIconCircleActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: 12, fontFamily: VibeFonts.bold, color: T.muted },
  chipTextActive: { fontSize: 12, fontFamily: VibeFonts.bold, color: "#fff" },
  chipSub: { fontSize: 10, fontFamily: VibeFonts.regular, color: T.faint },
  chipSubActive: {
    fontSize: 10,
    fontFamily: VibeFonts.regular,
    color: "rgba(255,255,255,0.85)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  inputIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    paddingVertical: 13,
  },
  descRow: {
    padding: 14,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  descInput: {
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    minHeight: 60,
    textAlignVertical: "top",
  },
  descFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  descHint: { flexDirection: "row", alignItems: "center", gap: 4 },
  descHintText: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: T.faint,
  },
  charCount: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: T.faint,
  },
  previewHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  liveDotWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  livePulseWrap: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  livePulseRing: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  previewLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "rgba(255,255,255,0.72)",
    letterSpacing: 1.6,
  },
  previewHintPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(167, 139, 250, 0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(196, 181, 253, 0.28)",
  },
  previewHintText: {
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
    color: T.purple,
  },
  previewCard: {
    borderRadius: 28,
    padding: 0,
    overflow: "hidden",
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
    alignItems: "stretch",
  },
  previewHero: {
    minHeight: 188,
    paddingTop: 14,
    paddingBottom: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  previewHeroFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
  },
  previewHeroIconWrap: {
    width: 108,
    height: 108,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    marginBottom: 8,
  },
  previewHeroRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  previewHeroOrb: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  previewHeroIcon3d: { width: 62, height: 62 },
  previewHeroSub: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: "rgba(255,255,255,0.55)",
  },
  previewTopRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 4,
  },
  previewVibe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  previewVibeText: { fontSize: 11, fontFamily: VibeFonts.bold },
  previewLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  previewLiveDotMini: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
  },
  previewLiveText: {
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    color: "#0B0D12",
    letterSpacing: 0.8,
  },
  previewIconOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 6,
  },
  previewIcon3d: { width: 52, height: 52 },
  previewTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  previewChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
  },
  previewChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    maxWidth: "100%",
  },
  previewChipWide: { flexGrow: 1, flexShrink: 1 },
  previewChipMuted: {
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.18)",
  },
  previewChipText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: "rgba(255,255,255,0.82)",
    maxWidth: 140,
  },
  previewMetaGrid: { marginTop: 12, alignItems: "center", gap: 6 },
  previewMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  previewMetaText: { fontSize: 13, fontFamily: VibeFonts.semiBold },
  previewMetaMuted: { fontSize: 13, fontFamily: VibeFonts.medium, color: T.muted },
  previewQuote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10,
    marginHorizontal: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(167, 139, 250, 0.12)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(196, 181, 253, 0.22)",
  },
  previewQuoteEmpty: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
  },
  previewDesc: {
    flex: 1,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.78)",
    fontStyle: "italic",
    lineHeight: 18,
  },
  previewFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  avatarGhost: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#161822",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMore: { backgroundColor: "rgba(255,255,255,0.16)" },
  avatarMoreText: { fontSize: 8, fontFamily: VibeFonts.bold, color: "#fff" },
  previewFooterTitle: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  previewFooterText: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: T.faint,
    marginTop: 1,
  },
  previewGoPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  tipBanner: { marginBottom: 8 },
  tipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 28,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(251, 191, 36, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  tipText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 2,
    lineHeight: 15,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  footerFade: {
    position: "absolute",
    top: -48,
    left: 0,
    right: 0,
    height: 56,
  },
  ctaWrap: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: "center",
  },
  ctaPress: {
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#fff",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  ctaPressPromo: {
    alignSelf: "stretch",
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#1FA971",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ctaBtnPromo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  ctaEmoji: { fontSize: 16 },
  ctaPressGreen: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: 8,
    minHeight: 44,
    minWidth: 0,
    maxWidth: "82%",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "#22C55E",
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  ctaPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  ctaPressWhite: {
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  ctaBtnCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    minHeight: 52,
  },
  ctaBtnWhite: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: 999,
    minHeight: 54,
    backgroundColor: "#FFFFFF",
  },
  ctaBtnGreen: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: 999,
    minHeight: 54,
    backgroundColor: "#22C55E",
  },
  ctaIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaIconBubbleGreen: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    letterSpacing: -0.2,
  },
  ctaTextDark: {
    color: "#0B0D12",
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.2,
  },
  ctaSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    marginTop: 1,
  },

  inviteScroll: {
    gap: 12,
    paddingVertical: 4,
    paddingRight: 8,
  },
  inviteWaCard: {
    width: 92,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.14)",
  },
  inviteWaCardActive: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.18)",
  },
  inviteWaIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  inviteWaTitle: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  inviteWaSub: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 2,
  },
  inviteEmptyCard: {
    width: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderStyle: "dashed",
  },
  inviteEmptyText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  inviteEmptyLink: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.purple,
  },
  inviteMatchCard: {
    width: 84,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.14)",
  },
  inviteMatchCardActive: {
    borderColor: T.orange,
    backgroundColor: "rgba(249, 115, 22, 0.18)",
  },
  inviteMatchAvatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  inviteMatchName: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.ink,
    maxWidth: 72,
    textAlign: "center",
  },
  inviteCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: T.orangeDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: "rgba(249, 115, 22, 0.14)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(251, 146, 60, 0.35)",
  },
  inviteSummaryText: {
    flex: 1,
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: T.orange,
  },

  sendModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sendModalDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  inviteSheet: {
    backgroundColor: "#141218",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    maxHeight: "88%",
    overflow: "hidden",
    elevation: 0,
    shadowOpacity: 0,
  },
  inviteCloseBtn: {
    position: "absolute",
    top: 12,
    right: 14,
    zIndex: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteSheetHead: { alignItems: "center", marginBottom: 10, paddingTop: 4 },
  inviteSheetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
    overflow: "hidden",
  },
  inviteSheetBadgeText: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: 1.1,
  },
  inviteTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  inviteSpark: { fontSize: 14, marginLeft: 2 },
  inviteSheetTitle: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  inviteTitleAccent: { color: "#FF8A3D" },
  inviteSheetSub: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  inviteVideoWrap: {
    width: "100%",
    height: 132,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.3)",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  inviteVideoBottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
  },
  inviteNeonCaption: {
    position: "absolute",
    left: 12,
    bottom: 10,
    right: 40,
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    fontStyle: "italic",
    color: "#FF6BA8",
    textShadowColor: "rgba(255,77,154,0.7)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  inviteVideoFade: {},
  inviteMetaBorder: {
    borderRadius: 16,
    padding: 1.5,
    marginBottom: 10,
  },
  inviteMetaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 12,
  },
  inviteMetaIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  inviteMetaIcon: { width: 34, height: 34 },
  inviteMetaTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  inviteMetaLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  inviteMetaSub: {
    flex: 1,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.55)",
  },
  inviteMetaCount: {
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(167,139,250,0.14)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
  },
  inviteMetaCountText: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: "#E9D5FF",
  },
  inviteMetaCountHint: {
    fontSize: 9,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.45)",
  },
  invitePickHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  invitePickLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  invitePickCountPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
  },
  invitePickCountText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#86EFAC",
  },
  invitePeopleRow: {
    gap: 14,
    paddingBottom: 4,
    paddingRight: 8,
  },
  invitePersonCard: {
    width: 68,
    alignItems: "center",
    gap: 6,
  },
  invitePersonRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  invitePersonRingOn: {
    borderColor: "#A855F7",
  },
  invitePersonRingOnWa: {
    borderColor: "#22C55E",
  },
  invitePersonOrb: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  invitePersonOrbEmpty: {
    backgroundColor: "rgba(167,139,250,0.18)",
  },
  invitePersonPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  invitePersonTick: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#A855F7",
    borderWidth: 2,
    borderColor: "#141218",
    alignItems: "center",
    justifyContent: "center",
  },
  invitePersonLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    maxWidth: 68,
  },
  inviteSendGrid: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 4,
  },
  inviteSendBorder: {
    flex: 1,
    borderRadius: 14,
    padding: 1.5,
  },
  inviteSendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 13,
    backgroundColor: "#1C1C24",
  },
  inviteSendRowWaOn: {
    backgroundColor: "rgba(34,197,94,0.12)",
  },
  inviteSendRowMatchOn: {
    backgroundColor: "rgba(168,85,247,0.14)",
  },
  inviteRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteRowAvatar: {
    width: 32,
    height: 32,
    borderRadius: 9,
  },
  inviteRowCheck: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#A855F7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fff",
    zIndex: 2,
  },
  inviteSendName: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  inviteSendHint: {
    marginTop: 0,
    fontSize: 9,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.42)",
  },
  inviteMoreRow: { gap: 6, paddingBottom: 2 },
  inviteChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inviteChipOn: {
    borderColor: "rgba(168,85,247,0.6)",
    backgroundColor: "rgba(168,85,247,0.15)",
  },
  inviteChipAvatar: { width: 18, height: 18, borderRadius: 9 },
  inviteChipName: {
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
    color: "#fff",
    maxWidth: 56,
  },
  invitePersonWa: { backgroundColor: "#25D366" },
  invitePersonIconEmpty: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.2)",
  },
  invitePersonIcon: {},
  invitePersonCheck: {},
  invitePerson: {},
  invitePersonAvatar: {},
  invitePersonName: {},
  invitePersonOn: {},
  inviteSendingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    marginBottom: 6,
    minHeight: 22,
  },
  inviteSendingAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#141218",
  },
  inviteSendingWa: {
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
  invitePickSummary: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.55)",
    marginLeft: 4,
  },
  inviteSheetCta: {
    marginTop: 6,
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#22C55E",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  inviteSheetCtaGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: 999,
  },
  inviteSheetCtaText: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
  },
  invitePickRow: {},
  inviteSendCard: {},
  inviteSendCardWaOn: {},
  inviteSendCardMatchOn: {},
  inviteSendAvatar: {},
  inviteVideoFade: {},
  inviteVideoCaption: {},
  invitePickCard: {},
  invitePickCardOn: {},
  invitePickAvatar: {},
  invitePickWa: {},
  invitePickName: {},
  invitePickCheck: {},
  invitePickEmpty: {},
  invitePickEmptyText: {},
  inviteMiniCard: {},
  inviteMiniIcon: {},
  inviteMiniTitle: {},
  inviteMiniMeta: {},
  sendHandle: {
    alignSelf: "center",
    width: 34,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.28)",
    marginBottom: 6,
  },
  sendSheet: {
    backgroundColor: "#0D1220",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  sendHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.45)",
    marginBottom: 14,
  },
  sendReady: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    color: "#FBBF24",
    letterSpacing: 1.4,
    marginBottom: 14,
  },
  sendCard: {
    backgroundColor: "rgba(22, 26, 46, 0.98)",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.28)",
    alignItems: "center",
    marginBottom: 16,
  },
  sendMediaWrap: {
    width: "100%",
    height: 200,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#12182C",
    marginBottom: 16,
  },
  sendMedia: {
    width: "100%",
    height: "100%",
  },
  sendMediaFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  sendMediaImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  sendMediaIcon: {
    width: 88,
    height: 88,
    zIndex: 2,
  },
  sendHangTitle: {
    fontSize: 26,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  sendTime: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FBBF24",
  },
  sendTo: {
    marginTop: 6,
    fontSize: 15,
    fontFamily: VibeFonts.semiBold,
    color: "rgba(244,246,251,0.85)",
  },
  sendAvatarRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  sendTinyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#1A2238",
  },
  sendCtaPress: {
    borderRadius: 999,
    overflow: "hidden",
  },
  sendCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  sendCtaText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    flexShrink: 1,
  },
  sendCancel: {
    alignItems: "center",
    paddingVertical: 14,
  },
  sendCancelText: {
    fontSize: 13,
    fontFamily: VibeFonts.semiBold,
    color: T.muted,
  },
});
