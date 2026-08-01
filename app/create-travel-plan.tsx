import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ImageBackground,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import TabBar from "../components/TabBar";
import { useAuth } from "../context/AuthContext";
import { VibeFonts } from "../constants/vibeTheme";
import { api } from "../services/api";

const { width: SCREEN_W } = Dimensions.get("window");

const COVER_BY_STYLE: Record<string, string> = {
  adventure: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop",
  beach: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=600&fit=crop",
  backpacking: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop",
  luxury: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
  road: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop",
  culture: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800&h=600&fit=crop",
};

const T = {
  bg: "#F7F5FC",
  card: "#FFFFFF",
  cardElevated: "#FFFBFE",
  ink: "#1A1F36",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E8E4F2",
  pink: "#EC4899",
  purple: "#8B5CF6",
  green: "#22C55E",
  amber: "#F59E0B",
  blue: "#3B82F6",
  cta: ["#8B5CF6", "#EC4899"] as const,
};

const STYLES = [
  { id: "adventure", label: "Adventure", icon: "bicycle" as const, color: "#34D399" },
  { id: "beach", label: "Beach", icon: "sunny" as const, color: "#FBBF24" },
  { id: "backpacking", label: "Backpack", icon: "walk" as const, color: "#60A5FA" },
  { id: "luxury", label: "Luxury", icon: "diamond" as const, color: "#C084FC" },
  { id: "road", label: "Road trip", icon: "car" as const, color: "#FB923C" },
  { id: "culture", label: "Culture", icon: "color-palette" as const, color: "#F472B6" },
];

const QUICK_DATES = [
  { id: "weekend", label: "This weekend" },
  { id: "nextweek", label: "Next week" },
  { id: "month", label: "This month" },
  { id: "custom", label: "Custom dates" },
];

function mapCategory(styleId: string, dates: string): string {
  if (styleId === "beach") return "beach";
  if (styleId === "adventure" || styleId === "backpacking") return "mountains";
  if (styleId === "luxury" || styleId === "culture") return "international";
  if (dates.toLowerCase().includes("weekend")) return "weekend";
  return "all";
}

export default function CreateTravelPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 72 + Math.max(insets.bottom, 12);
  const { user } = useAuth();

  const [dest, setDest] = useState("");
  const [dates, setDates] = useState("");
  const [dateChip, setDateChip] = useState<string | undefined>("weekend");
  const [styleId, setStyleId] = useState("adventure");
  const [desc, setDesc] = useState("");
  const [maxCount, setMaxCount] = useState(6);
  const [saving, setSaving] = useState(false);

  const style = STYLES.find((s) => s.id === styleId) || STYLES[0];
  const userId = user?.id || "local-user";
  const userName = user?.name || "You";

  const applyDateChip = (id: string) => {
    setDateChip(id);
    if (id === "weekend") setDates("This weekend");
    else if (id === "nextweek") setDates("Next week");
    else if (id === "month") setDates("This month");
    else setDates("");
  };

  const handlePublish = async () => {
    if (!dest.trim()) {
      Alert.alert("Destination needed", "Where are you going?");
      return;
    }
    if (!dates.trim()) {
      Alert.alert("Dates needed", "When is the trip?");
      return;
    }
    if (!desc.trim()) {
      Alert.alert("Add a note", "Write a short vibe for people joining.");
      return;
    }
    if (!user) {
      Alert.alert("Login required", "Please log in to publish a trip.");
      return;
    }

    setSaving(true);
    try {
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + (dateChip === "nextweek" ? 7 : dateChip === "month" ? 14 : 2));
      scheduledAt.setHours(10, 0, 0, 0);

      await api.createPlan({
        title: `✈️ ${dest.trim()}`,
        description: desc.trim(),
        destination: dest.trim(),
        location: dest.trim(),
        scheduledAt: scheduledAt.toISOString(),
        maxParticipants: maxCount,
        activity: style.label,
        imageUrl: COVER_BY_STYLE[styleId] || COVER_BY_STYLE.adventure,
        kind: "TRAVEL",
        distance: 1,
      });

      Alert.alert("Trip published ✈️", "Your trip is live. Travel buddies can join now.", [
        { text: "View trips", onPress: () => router.replace("/travel") },
      ]);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not save travel plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["rgba(59,130,246,0.2)", "transparent"]} style={styles.glowTop} />
      <LinearGradient colors={["transparent", "rgba(34,197,94,0.1)"]} style={styles.glowBottom} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={T.ink} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>TRAVEL</Text>
          <Text style={styles.headerTitle}>Create Trip</Text>
        </View>
        <View style={styles.iconBtnGhost} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroWrap}>
          <ImageBackground
            source={{
              uri: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&h=500&fit=crop",
            }}
            style={styles.hero}
            imageStyle={{ borderRadius: 24 }}
          >
            <LinearGradient
              colors={["rgba(5,5,8,0.2)", "rgba(5,5,8,0.92)"]}
              style={styles.heroGrad}
            >
              <View style={styles.previewChip}>
                <Ionicons name="information-circle" size={13} color={T.amber} />
                <Text style={styles.previewChipText}>Live on your device</Text>
              </View>
              <Text style={styles.heroTitle}>Post a trip.{"\n"}Find your crew.</Text>
              <Text style={styles.heroSub}>
                Destination, dates & vibe — then go live for travel buddies.
              </Text>
            </LinearGradient>
          </ImageBackground>
        </Animated.View>

        {/* Step 1 — Destination */}
        <Animated.View entering={FadeInDown.delay(70).duration(400)} style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Destination</Text>
              <Text style={styles.sectionSub}>Where are you headed?</Text>
            </View>
          </View>
          <View style={styles.inputRow}>
            <Ionicons name="airplane-outline" size={18} color={T.blue} />
            <TextInput
              style={styles.input}
              value={dest}
              onChangeText={setDest}
              placeholder="Kasol, Ladakh, Goa, Bali..."
              placeholderTextColor={T.faint}
            />
          </View>
        </Animated.View>

        {/* Step 2 — Dates */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>When</Text>
              <Text style={styles.sectionSub}>Pick a window or type dates</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {QUICK_DATES.map((d) => {
              const active = dateChip === d.id;
              return (
                <Pressable key={d.id} onPress={() => applyDateChip(d.id)}>
                  {active ? (
                    <LinearGradient colors={["#3B82F6", "#8A56FF"]} style={styles.chipActive}>
                      <Text style={styles.chipTextActive}>{d.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{d.label}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.inputRow}>
            <Ionicons name="calendar-outline" size={18} color={T.purple} />
            <TextInput
              style={styles.input}
              value={dates}
              onChangeText={(v) => {
                setDates(v);
                setDateChip("custom");
              }}
              placeholder="e.g. Dec 10 – Dec 17"
              placeholderTextColor={T.faint}
            />
          </View>
        </Animated.View>

        {/* Step 3 — Style */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Travel style</Text>
              <Text style={styles.sectionSub}>What kind of trip is this?</Text>
            </View>
          </View>
          <View style={styles.styleGrid}>
            {STYLES.map((s) => {
              const active = styleId === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setStyleId(s.id)}
                  style={[
                    styles.styleCard,
                    active && { borderColor: s.color, backgroundColor: `${s.color}18` },
                  ]}
                >
                  <Ionicons name={s.icon} size={20} color={active ? s.color : T.muted} />
                  <Text style={[styles.styleLabel, active && { color: s.color }]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Step 4 — Details */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>4</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Details & crew size</Text>
              <Text style={styles.sectionSub}>Help people decide to join</Text>
            </View>
          </View>

          <View style={styles.descRow}>
            <TextInput
              style={styles.descInput}
              value={desc}
              onChangeText={setDesc}
              placeholder="Route, budget vibe, what you're looking for in a partner..."
              placeholderTextColor={T.faint}
              multiline
              maxLength={200}
            />
            <Text style={styles.charCount}>{desc.length}/200</Text>
          </View>

          <View style={styles.counterCard}>
            <View>
              <Text style={styles.counterTitle}>Max group members</Text>
              <Text style={styles.counterSub}>Including you</Text>
            </View>
            <View style={styles.counterCtrls}>
              <Pressable
                onPress={() => setMaxCount(Math.max(2, maxCount - 1))}
                style={styles.ctrlBtn}
              >
                <Text style={styles.ctrlText}>−</Text>
              </Pressable>
              <Text style={styles.countVal}>{maxCount}</Text>
              <Pressable
                onPress={() => setMaxCount(Math.min(15, maxCount + 1))}
                style={styles.ctrlBtn}
              >
                <Text style={styles.ctrlText}>+</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Live preview */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.section}>
          <Text style={styles.previewLabel}>TRIP CARD PREVIEW</Text>
          <View style={[styles.previewCard, { borderColor: `${style.color}55` }]}>
            <LinearGradient
              colors={[`${style.color}22`, "transparent"]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={[styles.styleBadge, { backgroundColor: `${style.color}22` }]}>
              <Ionicons name={style.icon} size={12} color={style.color} />
              <Text style={[styles.styleBadgeText, { color: style.color }]}>{style.label}</Text>
            </View>
            <Ionicons name="airplane" size={36} color={T.blue} style={{ marginBottom: 8 }} />
            <Text style={styles.previewTitle}>
              {dest.trim() || "Your destination"}
            </Text>
            <Text style={[styles.previewDates, { color: style.color }]}>
              {dates.trim() || "Pick dates"}
            </Text>
            <Text style={styles.previewMeta}>{maxCount} spots · including you</Text>
            {desc.trim() ? (
              <Text style={styles.previewDesc} numberOfLines={2}>
                "{desc.trim()}"
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Sticky CTA above TabBar */}
      <View style={[styles.footer, { bottom: tabBarHeight }]}>
        <LinearGradient colors={["transparent", T.bg]} style={styles.footerFade} />
        <View style={styles.ctaWrap}>
          <Pressable onPress={handlePublish} disabled={saving} style={styles.ctaPress}>
            <LinearGradient colors={T.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBtn}>
              <Ionicons name="rocket" size={18} color="#fff" />
              <Text style={styles.ctaText}>
                {saving ? "Publishing..." : "Create Travel Plan & Go Live"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
      <TabBar dark={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  glowTop: { position: "absolute", top: 0, left: 0, right: 0, height: 260 },
  glowBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 180 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
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
  },
  iconBtnGhost: { width: 42, height: 42 },
  headerCenter: { alignItems: "center" },
  headerEyebrow: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.blue,
    letterSpacing: 1.4,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    marginTop: 1,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  heroWrap: { marginBottom: 20 },
  hero: { height: 168, borderRadius: 24, overflow: "hidden" },
  heroGrad: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    justifyContent: "flex-end",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
  },
  previewChip: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(245,158,11,0.15)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  previewChipText: { fontSize: 11, fontFamily: VibeFonts.bold, color: T.amber },
  heroTitle: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  heroSub: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    maxWidth: SCREEN_W * 0.75,
  },
  section: { marginBottom: 22 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(59,130,246,0.2)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: { fontSize: 12, fontFamily: VibeFonts.bold, color: T.blue },
  sectionTitle: { fontSize: 16, fontFamily: VibeFonts.bold, color: T.ink },
  sectionSub: { fontSize: 12, fontFamily: VibeFonts.medium, color: T.faint, marginTop: 1 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    paddingVertical: 14,
  },
  chipRow: { gap: 8, paddingBottom: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  chipActive: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  chipText: { fontSize: 12, fontFamily: VibeFonts.bold, color: T.muted },
  chipTextActive: { fontSize: 12, fontFamily: VibeFonts.bold, color: "#fff" },
  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  styleCard: {
    width: "31.5%",
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: T.border,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
  },
  styleLabel: { fontSize: 11, fontFamily: VibeFonts.bold, color: T.muted },
  descRow: {
    padding: 14,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 12,
  },
  descInput: {
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    minHeight: 88,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: T.faint,
    textAlign: "right",
    marginTop: 6,
  },
  counterCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
  },
  counterTitle: { fontSize: 14, fontFamily: VibeFonts.bold, color: T.ink },
  counterSub: { fontSize: 11, fontFamily: VibeFonts.medium, color: T.faint, marginTop: 2 },
  counterCtrls: { flexDirection: "row", alignItems: "center", gap: 12 },
  ctrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: T.cardElevated,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlText: { fontSize: 18, color: T.ink, fontFamily: VibeFonts.bold },
  countVal: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    minWidth: 28,
    textAlign: "center",
  },
  previewLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.faint,
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  previewCard: {
    borderRadius: 24,
    backgroundColor: T.cardElevated,
    borderWidth: 1.5,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    overflow: "hidden",
  },
  styleBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  styleBadgeText: { fontSize: 10, fontFamily: VibeFonts.bold },
  previewTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    textAlign: "center",
  },
  previewDates: {
    fontSize: 14,
    fontFamily: VibeFonts.semiBold,
    marginTop: 8,
  },
  previewMeta: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.faint,
    marginTop: 6,
  },
  previewDesc: {
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    color: T.muted,
    marginTop: 10,
    fontStyle: "italic",
    textAlign: "center",
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
  ctaPress: { borderRadius: 18, overflow: "hidden" },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 18,
  },
  ctaText: { color: "#fff", fontSize: 15, fontFamily: VibeFonts.bold },
});
