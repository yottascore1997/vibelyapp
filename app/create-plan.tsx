import { useEffect, useMemo, useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { PLAN_ACTIVITIES, formatPlanSchedule } from "../constants/plans";
import { CITIES, CityId, resolveCityId } from "../constants/mapEvents";
import { VibeFonts } from "../constants/vibeTheme";
import TabBar from "../components/TabBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const friendsHangout3d = require("../assets/friends_hangout_3d.png");
const { width: SCREEN_W } = Dimensions.get("window");

/** Premium Microsoft Fluent 3D emoji icons */
const FLUENT_3D = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets";
const ACT_3D: Record<string, string> = {
  coffee: `${FLUENT_3D}/Hot%20beverage/3D/hot_beverage_3d.png`,
  food: `${FLUENT_3D}/Pizza/3D/pizza_3d.png`,
  biryani: `${FLUENT_3D}/Curry%20rice/3D/curry_rice_3d.png`,
  beer: `${FLUENT_3D}/Beer%20mug/3D/beer_mug_3d.png`,
  sutta: `${FLUENT_3D}/Cigarette/3D/cigarette_3d.png`,
  movie: `${FLUENT_3D}/Clapper%20board/3D/clapper_board_3d.png`,
  sports: `${FLUENT_3D}/Badminton/3D/badminton_3d.png`,
  drinks: `${FLUENT_3D}/Cocktail%20glass/3D/cocktail_glass_3d.png`,
};

const T = {
  bg: "#F8F9FD",
  card: "#FFFFFF",
  ink: "#18181B",
  muted: "#475569",
  faint: "#94A3B8",
  border: "#F1F5F9",
  pink: "#EC4899",
  purple: "#7C3AED",
  purpleDeep: "#6D28D9",
  softPurple: "#F3E8FF",
  softPink: "#FCE7F3",
  green: "#10B981",
  amber: "#F59E0B",
  cta: ["#7C3AED", "#EC4899"] as const,
  promo: ["#7C3AED", "#D946EF", "#EC4899"] as const,
};

type IonName = keyof typeof Ionicons.glyphMap;

const VIBE_ORBS = [
  {
    id: "Lessgo",
    label: "Lessgo",
    description: "Up for anything",
    icon: "flash" as IonName,
    colors: ["#34D399", "#059669"] as const,
    soft: "#D1FAE5",
    accent: "#16A34A",
  },
  {
    id: "Maybe",
    label: "Maybe",
    description: "Soft yes",
    icon: "star" as IonName,
    colors: ["#FBBF24", "#F59E0B"] as const,
    soft: "#FEF3C7",
    accent: "#D97706",
  },
  {
    id: "Off grid",
    label: "Off grid",
    description: "Low key",
    icon: "moon" as IonName,
    colors: ["#F472B6", "#DB2777"] as const,
    soft: "#FCE7F3",
    accent: "#DB2777",
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
    accent: "#D97706",
    soft: "#FEF3C7",
    colors: ["#FBBF24", "#D97706"],
    icon3d: ACT_3D.coffee,
  },
  food: {
    icon: "pizza",
    accent: "#EA580C",
    soft: "#FFEDD5",
    colors: ["#FB923C", "#EA580C"],
    icon3d: ACT_3D.food,
  },
  biryani: {
    icon: "restaurant",
    accent: "#DC2626",
    soft: "#FEE2E2",
    colors: ["#F87171", "#DC2626"],
    icon3d: ACT_3D.biryani,
  },
  beer: {
    icon: "beer",
    accent: "#CA8A04",
    soft: "#FEF9C3",
    colors: ["#FACC15", "#CA8A04"],
    icon3d: ACT_3D.beer,
  },
  sutta: {
    icon: "flame",
    accent: "#6B7280",
    soft: "#F3F4F6",
    colors: ["#9CA3AF", "#4B5563"],
    icon3d: ACT_3D.sutta,
  },
  movie: {
    icon: "film",
    accent: "#7C3AED",
    soft: "#EDE9FE",
    colors: ["#A78BFA", "#7C3AED"],
    icon3d: ACT_3D.movie,
  },
  sports: {
    icon: "tennisball",
    accent: "#16A34A",
    soft: "#DCFCE7",
    colors: ["#4ADE80", "#16A34A"],
    icon3d: ACT_3D.sports,
  },
  drinks: {
    icon: "wine",
    accent: "#DB2777",
    soft: "#FCE7F3",
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
            colors={active ? (styleMeta.darkBg as any) : ["#0B0B0F", "#16161E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.actBtn,
              active
                ? {
                    borderColor: styleMeta.border,
                    borderWidth: 2.5,
                    shadowColor: styleMeta.glow,
                    shadowOpacity: 0.5,
                    shadowRadius: 14,
                    elevation: 7,
                  }
                : {
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    borderWidth: 1,
                  },
            ]}
          >
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
  { id: "morning", label: "Morning", icon: "sunny" as IonName, customTime: "10:00" },
  { id: "afternoon", label: "Afternoon", icon: "partly-sunny" as IonName, customTime: "15:00" },
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
  if (customTime === "15:00") return "Afternoon";
  if (customTime === "21:00") return "Night";
  return "Afternoon";
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
  { id: 3, label: "Details", icon: "options" as IonName },
];

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
  const { createPlan } = usePlans();
  const { token } = useAuth();
  const [selectedVibe, setSelectedVibe] = useState("Lessgo");
  const [activityId, setActivityId] = useState("coffee");
  const [timeId, setTimeId] = useState<string | undefined>(undefined);
  const [dateId, setDateId] = useState<string>("today");
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("15:00");
  const [maxPeople, setMaxPeople] = useState(4);
  const [visibility, setVisibility] = useState<"PUBLIC" | "FRIENDS">("PUBLIC");
  const [showCalendar, setShowCalendar] = useState(false);
  const [place, setPlace] = useState("");
  const [planCityId, setPlanCityId] = useState<CityId>("nagpur");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

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
    return n;
  }, [activityId, dateId, customDate, customTime, place, description]);

  const scheduleLabel = `${schedule.dateLabel} · ${formatPeriodLabel(customTime)}`;

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

  const handleCreate = async () => {
    setSaving(true);
    const energyLabel = `[Vibe: ${selectedVibe}]`;
    try {
      const placeText = place.trim();
      // Always stamp city so Events Map can place the pin in the right city
      const alreadyHasCity = !!resolveCityId(placeText);
      const location = placeText
        ? alreadyHasCity
          ? placeText
          : `${placeText}, ${planCity.name}`
        : planCity.name;

      await createPlan({
        activityId,
        activityName: activity.name,
        emoji: activity.emoji,
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
      });

      await AsyncStorage.setItem("@hangora_map_city", planCityId);

      Alert.alert(
        "Plan Live! ✨",
        `${activity.name} is live in ${planCity.name}. It will show on the ${planCity.name} Events Map.`,
        [
          {
            text: "View on Map",
            onPress: () => router.replace("/events-map"),
          },
          { text: "View Plans", onPress: () => router.replace("/hangout") },
        ]
      );
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not create plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      <LinearGradient
        colors={["rgba(167,139,250,0.32)", "transparent"]}
        style={styles.glowTop}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      />
      <LinearGradient
        colors={["rgba(244,114,182,0.18)", "transparent"]}
        style={styles.glowMid}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.coolOrb} />
      <View style={styles.pinkOrb} />

      <AppHeader variant="light" tagline="Craft a spontaneous hang" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={T.ink} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerBrand}>
            <Ionicons name="planet" size={12} color={T.purple} />
            <Text style={styles.headerEyebrow}>HANGOUT</Text>
          </View>
          <Text style={styles.headerTitle}>Create Plan</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={() => router.replace("/hangout")}>
          <Ionicons name="close" size={20} color={T.ink} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 190 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(420)} style={styles.heroWrap}>
          <LinearGradient
            colors={["#FFFFFF", "#F8F4FF", "#FFF0F8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroBlobA} />
            <View style={styles.heroBlobB} />
            <View style={styles.heroCopy}>
              <View style={styles.heroPill}>
                <Ionicons name="sparkles" size={11} color={T.purple} />
                <Text style={styles.heroPillText}>HANGOUT MOVES</Text>
              </View>
              <Text style={styles.heroTitle}>Craft your{"\n"}perfect hang 🚀</Text>
              <Text style={styles.heroSub}>
                Squad up · pick a quest · go live nearby.
              </Text>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Ionicons name="people" size={12} color={T.purple} />
                  <Text style={styles.heroStatText}>Squad ready</Text>
                </View>
                <View style={styles.heroStatDot} />
                <View style={styles.heroStat}>
                  <Ionicons name="game-controller" size={12} color={T.pink} />
                  <Text style={styles.heroStatText}>Pick & play</Text>
                </View>
              </View>
            </View>
            <FloatingFriends3D />
          </LinearGradient>
        </Animated.View>

        {/* Progress */}
        {/* Step 1 — Activity (Primary Focus!) */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.section}>
          <View style={styles.sectionCardLight}>
            <View style={styles.sectionHead}>
              <LinearGradient colors={[...T.cta]} style={styles.stepBadge}>
                <Ionicons name="game-controller" size={11} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitleDark}>Pick Activity</Text>
                <Text style={styles.sectionSubDark}>Tap a 3D move to start</Text>
              </View>
              <View style={styles.xpPillCompact}>
                <Ionicons name="flash" size={9} color="#fff" />
                <Text style={styles.xpPillText}>HOT</Text>
              </View>
            </View>

            <View style={styles.actGrid}>
              {PLAN_ACTIVITIES.map((act, idx) => {
                const meta = ACT_META[act.id] || ACT_META.coffee;
                return (
                  <GameActivityTile
                    key={act.id}
                    id={act.id}
                    name={act.name}
                    icon3d={meta.icon3d}
                    accent={meta.accent}
                    soft={`${meta.accent}30`}
                    active={activityId === act.id}
                    delay={200 + idx * 35}
                    onPress={() => setActivityId(act.id)}
                    dark={false}
                  />
                );
              })}
            </View>
          </View>
        </Animated.View>



        {/* Step 3 — When */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.section}>
          <View style={styles.sectionCardLight}>
            <View style={styles.sectionHead}>
              <LinearGradient colors={[...T.cta]} style={styles.stepBadge}>
                <Ionicons name="calendar" size={11} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitleDark}>When & Where</Text>
                <Text style={styles.sectionSubDark}>Schedule, venue, and people</Text>
              </View>
              <View style={styles.optionalPill}>
                <Text style={styles.optionalPillText}>Quick Pick</Text>
              </View>
            </View>

            <Text style={styles.simpleFieldLabel}>Date</Text>
            <View style={styles.simpleSegRow}>
              {SIMPLE_DATES.map((d) => {
                const active = dateId === d.id;
                return (
                  <Pressable
                    key={d.id}
                    onPress={() => pickQuickDate(d.id)}
                    style={[styles.simpleSeg, active && styles.simpleSegActiveWrap]}
                  >
                    {active ? (
                      <LinearGradient
                        colors={[...T.cta]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.simpleSegActive}
                      >
                        <Ionicons name={d.icon} size={14} color="#fff" />
                        <Text style={styles.simpleSegTextActive}>{d.label}</Text>
                      </LinearGradient>
                    ) : (
                      <>
                        <Ionicons name={d.icon} size={14} color="#C4B5FD" />
                        <Text style={styles.simpleSegText}>{d.label}</Text>
                      </>
                    )}
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setShowCalendar(true)}
                style={[
                  styles.simpleSeg,
                  styles.calendarSeg,
                  calendarActive && styles.simpleSegActiveWrap,
                ]}
              >
                {calendarActive ? (
                  <LinearGradient
                    colors={[...T.cta]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.simpleSegActive}
                  >
                    <Ionicons name="calendar" size={14} color="#fff" />
                    <Text style={styles.simpleSegTextActive} numberOfLines={1}>
                      {formatYmdLabel(customDate)}
                    </Text>
                  </LinearGradient>
                ) : (
                  <>
                    <Ionicons name="calendar" size={14} color="#C4B5FD" />
                    <Text style={styles.simpleSegText}>Calendar</Text>
                  </>
                )}
              </Pressable>
            </View>
            {calendarActive ? (
              <Pressable style={styles.pickedDateRow} onPress={() => setShowCalendar(true)}>
                <Ionicons name="checkmark-circle" size={14} color="#A78BFA" />
                <Text style={styles.pickedDateText}>{formatYmdLabel(customDate)}</Text>
                <Text style={styles.pickedDateChange}>Change</Text>
              </Pressable>
            ) : null}

            <Text style={[styles.simpleFieldLabel, { marginTop: 12 }]}>Time</Text>
            <View style={styles.simpleSegRow}>
              {SIMPLE_TIMES.map((t) => {
                const active = selectedPeriod === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => pickPeriod(t)}
                    style={[styles.simpleSeg, active && styles.simpleSegActiveWrap]}
                  >
                    {active ? (
                      <LinearGradient
                        colors={[...T.cta]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.simpleSegActive}
                      >
                        <Ionicons name={t.icon} size={14} color="#fff" />
                        <Text style={styles.simpleSegTextActive}>{t.label}</Text>
                      </LinearGradient>
                    ) : (
                      <>
                        <Ionicons name={t.icon} size={14} color="#C4B5FD" />
                        <Text style={styles.simpleSegText}>{t.label}</Text>
                      </>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.simpleFieldLabel, { marginTop: 12 }]}>People can join</Text>
            <View style={styles.peopleRow}>
              <Pressable
                onPress={() => setMaxPeople((n) => Math.max(2, n - 1))}
                style={styles.peopleStepBtn}
              >
                <Ionicons name="remove" size={16} color="#E2E8F0" />
              </Pressable>
              <View style={styles.peopleValueBox}>
                <Ionicons name="people" size={15} color="#C4B5FD" />
                <Text style={styles.peopleValue}>{maxPeople}</Text>
                <Text style={styles.peopleValueHint}>max</Text>
              </View>
              <Pressable
                onPress={() => setMaxPeople((n) => Math.min(12, n + 1))}
                style={styles.peopleStepBtn}
              >
                <Ionicons name="add" size={16} color="#E2E8F0" />
              </Pressable>
              <View style={styles.peopleQuickRow}>
                {PEOPLE_OPTIONS.map((n) => {
                  const active = maxPeople === n;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setMaxPeople(n)}
                      style={[styles.peopleChip, active && styles.peopleChipActive]}
                    >
                      <Text style={[styles.peopleChipText, active && styles.peopleChipTextActive]}>
                        {n}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.simpleFieldLabel, { marginTop: 14 }]}>Audience / Privacy</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                <Pressable
                  onPress={() => setVisibility("PUBLIC")}
                  style={[
                    styles.simpleSeg,
                    { flex: 1 },
                    visibility === "PUBLIC" && styles.simpleSegActiveWrap,
                  ]}
                >
                  {visibility === "PUBLIC" ? (
                    <LinearGradient
                      colors={[...T.cta]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.simpleSegActive}
                    >
                      <Ionicons name="earth" size={14} color="#fff" />
                      <Text style={styles.simpleSegTextActive}>Public 🌍</Text>
                    </LinearGradient>
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="earth-outline" size={14} color="#C4B5FD" />
                      <Text style={styles.simpleSegText}>Public 🌍</Text>
                    </View>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => setVisibility("FRIENDS")}
                  style={[
                    styles.simpleSeg,
                    { flex: 1 },
                    visibility === "FRIENDS" && styles.simpleSegActiveWrap,
                  ]}
                >
                  {visibility === "FRIENDS" ? (
                    <LinearGradient
                      colors={["#7C3AED", "#6D28D9"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.simpleSegActive}
                    >
                      <Ionicons name="lock-closed" size={14} color="#fff" />
                      <Text style={styles.simpleSegTextActive}>Friends Only 🔒</Text>
                    </LinearGradient>
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="lock-closed-outline" size={14} color="#C4B5FD" />
                      <Text style={styles.simpleSegText}>Friends Only 🔒</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>

            <CalendarPickerModal
              visible={showCalendar}
              selectedYmd={customDate || undefined}
              onClose={() => setShowCalendar(false)}
              onSelect={pickCalendarDate}
            />

            <View style={styles.whenDivider} />

            <Text style={styles.cityPickLabel}>City on map</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cityPickRow}
            >
              {CITIES.map((c) => {
                const active = planCityId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setPlanCityId(c.id)}
                    style={[styles.cityPickChip, active && styles.cityPickChipActive]}
                  >
                    <Text style={styles.cityPickEmoji}>{c.emoji}</Text>
                    <Text style={[styles.cityPickText, active && styles.cityPickTextActive]}>
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.inputRowDark}>
              <Ionicons name="navigate" size={16} color="#7C3AED" />
              <TextInput
                style={styles.inputDark}
                value={place}
                onChangeText={setPlace}
                placeholder={`Place in ${planCity.name} · cafe, park, mall...`}
                placeholderTextColor="#64748B"
              />
              {place.trim() ? (
                <Ionicons name="checkmark-circle" size={16} color={T.green} />
              ) : null}
            </View>

            <View style={[styles.inputRowDark, styles.noteRowDark]}>
              <Ionicons name="chatbubble-ellipses" size={16} color="#7C3AED" style={{ marginTop: 2 }} />
              <TextInput
                style={[styles.inputDark, styles.noteInputDark]}
                value={description}
                onChangeText={setDescription}
                placeholder="Note · one line for the squad..."
                placeholderTextColor="#64748B"
                multiline
                maxLength={120}
              />
            </View>
          </View>
        </Animated.View>

        {/* Live preview */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <View style={styles.previewHead}>
            <View style={styles.liveDotWrap}>
              <View style={styles.liveDot} />
              <Text style={styles.previewLabel}>LIVE PREVIEW</Text>
            </View>
            <View style={styles.previewHintPill}>
              <Ionicons name="eye" size={11} color={T.purpleDeep} />
              <Text style={styles.previewHintText}>How others see it</Text>
            </View>
          </View>

          <View style={[styles.previewCard, { borderColor: `${actMeta.accent}45` }]}>
            <LinearGradient
              colors={[`${actMeta.accent}22`, "rgba(255,255,255,0)", `${T.pink}12`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.previewTopRow}>
              <View style={[styles.previewVibe, { backgroundColor: vibe.soft }]}>
                <Ionicons name={vibe.icon} size={12} color={vibe.accent} />
                <Text style={[styles.previewVibeText, { color: vibe.accent }]}>{selectedVibe}</Text>
              </View>
              <View style={styles.previewLiveBadge}>
                <Ionicons name="radio" size={11} color="#fff" />
                <Text style={styles.previewLiveText}>LIVE</Text>
              </View>
            </View>

            <View style={[styles.previewIconOrb, { backgroundColor: actMeta.soft }]}>
              <Image
                source={{ uri: actMeta.icon3d }}
                style={styles.previewIcon3d}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.previewTitle}>hang for {activity.name.toLowerCase()}?</Text>

            <View style={styles.previewMetaGrid}>
              <View style={styles.previewMetaItem}>
                <Ionicons name="calendar-outline" size={14} color={actMeta.accent} />
                <Text style={[styles.previewMetaText, { color: actMeta.accent }]}>
                  {scheduleLabel}
                </Text>
              </View>
              <View style={styles.previewMetaItem}>
                <Ionicons name="people" size={14} color={T.muted} />
                <Text style={styles.previewMetaMuted}>{maxPeople} people can join</Text>
              </View>
              {place.trim() ? (
                <View style={styles.previewMetaItem}>
                  <Ionicons name="location" size={14} color={T.muted} />
                  <Text style={styles.previewMetaMuted}>{place.trim()}</Text>
                </View>
              ) : null}
            </View>

            {description.trim() ? (
              <View style={styles.previewQuote}>
                <Ionicons name="chatbubble" size={12} color={T.purple} />
                <Text style={styles.previewDesc}>"{description.trim()}"</Text>
              </View>
            ) : null}

            <View style={styles.previewFooter}>
              <View style={styles.avatarStack}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.avatarGhost,
                      { marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i, backgroundColor: i === 0 ? "#C4B5FD" : i === 1 ? "#F9A8D4" : "#A5B4FC" },
                    ]}
                  >
                    <Ionicons name="person" size={10} color="#fff" />
                  </View>
                ))}
              </View>
              <Text style={styles.previewFooterText}>Nearby people can join</Text>
            </View>
          </View>
        </Animated.View>

        {/* Tip banner */}
        <Animated.View entering={FadeInDown.delay(340).duration(360)} style={styles.tipBanner}>
          <LinearGradient colors={["#EDE7FF", "#FCE7F3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tipInner}>
            <View style={styles.tipIcon}>
              <Ionicons name="diamond" size={16} color={T.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Pro tip</Text>
              <Text style={styles.tipText}>
                Plans with place + time get 3× more joins. Keep notes playful.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.footer}>
        <LinearGradient colors={["transparent", T.bg]} style={styles.footerFade} />
        <View style={styles.ctaWrap}>
          <Pressable onPress={handleCreate} disabled={saving} style={styles.ctaPressGreen}>
            <LinearGradient
              colors={["#22C55E", "#16A34A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBtnCompact}
            >
              <Ionicons name="rocket" size={16} color="#fff" />
              <Text style={styles.ctaText}>
                {saving ? "Going live..." : "Create Plan & Go Live"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
        <TabBar dark={false} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerCenter: { alignItems: "center" },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerEyebrow: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.purple,
    letterSpacing: 1.4,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    marginTop: 1,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 2 },
  heroWrap: { marginBottom: 14 },
  hero: {
    borderRadius: 24,
    minHeight: 158,
    paddingHorizontal: 16,
    paddingVertical: 16,
    overflow: "visible",
    borderWidth: 1,
    borderColor: "#EDE7FF",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  heroBlobA: {
    position: "absolute",
    right: -10,
    top: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(139,92,246,0.14)",
  },
  heroBlobB: {
    position: "absolute",
    right: 40,
    bottom: -40,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(236,72,153,0.1)",
  },
  heroCopy: { flex: 1, paddingRight: 8, zIndex: 2 },
  heroPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.softPurple,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 7,
  },
  heroPillText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: T.purpleDeep,
    letterSpacing: 0.9,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  heroSub: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    lineHeight: 16,
    maxWidth: SCREEN_W * 0.52,
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
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: T.pink,
    paddingHorizontal: 7,
    paddingVertical: 3,
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
    backgroundColor: "#F3F0FA",
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
  section: { marginBottom: 14 },
  sectionCard: {
    backgroundColor: T.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionCardLight: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 16,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sectionCardDark: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 16,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
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
    color: "#18181B",
  },
  sectionSubDark: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
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
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: T.softPurple,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  optionalPillText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.purpleDeep,
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
    color: "#64748B",
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
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
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
    color: "#7C3AED",
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
    backgroundColor: "#F8F9FD",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputDark: {
    flex: 1,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: "#18181B",
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
    color: "#18181B",
  },
  peopleStepBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    alignItems: "center",
    justifyContent: "center",
  },
  peopleValueBox: {
    minWidth: 80,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  peopleValue: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
  },
  peopleValueHint: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },
  peopleChip: {
    minWidth: 32,
    height: 32,
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FD",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  peopleChipActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  peopleChipText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
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
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  cityPickLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
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
    backgroundColor: "#F8F9FD",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cityPickChipActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  cityPickEmoji: { fontSize: 14 },
  cityPickText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: "#18181B",
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
    backgroundColor: "#FFFFFF",
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
    rowGap: 10,
  },
  actCell: { width: "31%" },
  actBtn: {
    aspectRatio: 0.92,
    borderRadius: 22,
    backgroundColor: "#0B0B0F",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  actCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 17,
    height: 17,
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
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  actIcon3d: {
    width: 52,
    height: 52,
  },
  actName: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
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
  liveDotWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  previewLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.faint,
    letterSpacing: 1.4,
  },
  previewHintPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.softPurple,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  previewHintText: {
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
    color: T.purpleDeep,
  },
  previewCard: {
    borderRadius: 24,
    backgroundColor: T.card,
    borderWidth: 1.5,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  previewTopRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewVibe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  previewVibeText: { fontSize: 10, fontFamily: VibeFonts.bold },
  previewLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  previewLiveText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#fff",
    letterSpacing: 0.6,
  },
  previewIconOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 6,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  previewIcon3d: { width: 52, height: 52 },
  previewTitle: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  previewMetaGrid: {
    marginTop: 12,
    alignItems: "center",
    gap: 6,
  },
  previewMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  previewMetaText: {
    fontSize: 13,
    fontFamily: VibeFonts.semiBold,
  },
  previewMetaMuted: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },
  previewQuote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(237,231,255,0.7)",
    borderRadius: 12,
  },
  previewDesc: {
    flex: 1,
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    color: T.muted,
    fontStyle: "italic",
  },
  previewFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
    width: "100%",
    justifyContent: "center",
  },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  avatarGhost: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  previewFooterText: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: T.faint,
  },
  tipBanner: { marginBottom: 8 },
  tipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
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
    backgroundColor: T.bg,
  },
  footerFade: {
    position: "absolute",
    top: -36,
    left: 0,
    right: 0,
    height: 40,
  },
  ctaWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  ctaPress: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  ctaPressGreen: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#16A34A",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  ctaBtnCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    minHeight: 46,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },
  ctaSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    marginTop: 1,
  },
});
