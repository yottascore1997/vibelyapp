import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import PremiumScreen from "../components/vibe/PremiumScreen";
import SectionHeader from "../components/vibe/SectionHeader";
import GlassCard from "../components/vibe/GlassCard";
import PulseDot from "../components/home/PulseDot";
import { VibeColors, VibeFonts } from "../constants/vibeTheme";
import { onlineUsers, hangouts } from "../constants/mockData";
import { Radius, Spacing } from "../constants/theme";

type WhyItem = { icon: keyof typeof Ionicons.glyphMap; text: string; color: string };

type AiSuggestion = {
  id: string;
  activity: string;
  emoji: string;
  timeLabel: string;
  going: number;
  max: number;
  vibeMatch: number;
  heroImage: string;
  glowColor: string;
  accentColor: string;
  barGradient: [string, string];
  planTitle: string;
  location: string;
  distance: number;
  people: { id: string; name: string; avatarUrl: string; match: number }[];
  why: WhyItem[];
  joinEmoji: string;
  joinMsg: string;
};

const AI_SUGGESTIONS: AiSuggestion[] = [
  {
    id: "1",
    activity: "Coffee",
    emoji: "☕",
    timeLabel: "Next 20 mins",
    going: 3,
    max: 8,
    vibeMatch: 94,
    heroImage: hangouts[0].imageUrl!,
    glowColor: "rgba(245,158,11,0.18)",
    accentColor: "#F59E0B",
    barGradient: ["#F59E0B", "#EA580C"],
    planTitle: hangouts[0].title,
    location: hangouts[0].location,
    distance: hangouts[0].distance,
    people: [
      { ...onlineUsers[2], match: 91 },
      { ...onlineUsers[1], match: 88 },
      { ...onlineUsers[3], match: 85 },
    ],
    why: [
      { icon: "cafe", text: "You love coffee hangouts", color: "#F59E0B" },
      { icon: "location", text: "Only 3.2 km from you", color: "#C084FC" },
      { icon: "people", text: "91%+ vibe match with group", color: "#22C55E" },
    ],
    joinEmoji: "☕",
    joinMsg: "Coffee plan mein aa gaye. Group ko pata chal jayega!",
  },
  {
    id: "2",
    activity: "Movie",
    emoji: "🎬",
    timeLabel: "Tonight · 7 PM",
    going: 4,
    max: 10,
    vibeMatch: 87,
    heroImage: hangouts[1].imageUrl!,
    glowColor: "rgba(139,92,246,0.18)",
    accentColor: "#A78BFA",
    barGradient: ["#8B5CF6", "#6D28D9"],
    planTitle: hangouts[1].title,
    location: hangouts[1].location,
    distance: hangouts[1].distance,
    people: [
      { ...onlineUsers[4], match: 89 },
      { ...onlineUsers[2], match: 86 },
      { ...onlineUsers[1], match: 84 },
    ],
    why: [
      { icon: "film", text: "You watch movies on weekends", color: "#A78BFA" },
      { icon: "location", text: "PVR is 5.1 km away", color: "#C084FC" },
      { icon: "people", text: "4 people already going tonight", color: "#22C55E" },
    ],
    joinEmoji: "🎬",
    joinMsg: "Movie plan mein aa gaye. Milte hain PVR!",
  },
  {
    id: "3",
    activity: "Cricket",
    emoji: "🏏",
    timeLabel: "Tomorrow · 6 AM",
    going: 8,
    max: 12,
    vibeMatch: 82,
    heroImage: hangouts[2].imageUrl!,
    glowColor: "rgba(249,115,22,0.18)",
    accentColor: "#FB923C",
    barGradient: ["#F97316", "#EA580C"],
    planTitle: hangouts[2].title,
    location: hangouts[2].location,
    distance: hangouts[2].distance,
    people: [
      { ...onlineUsers[1], match: 83 },
      { ...onlineUsers[3], match: 81 },
      { ...onlineUsers[4], match: 80 },
    ],
    why: [
      { icon: "football", text: "Sports lovers in your circle", color: "#FB923C" },
      { icon: "location", text: "Ground just 2.8 km away", color: "#C084FC" },
      { icon: "time", text: "Morning plan — fresh start", color: "#22C55E" },
    ],
    joinEmoji: "🏏",
    joinMsg: "Cricket match mein aa gaye. Team ready!",
  },
];

export default function VibeMatchScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [joinedId, setJoinedId] = useState<string | null>(null);

  const current = AI_SUGGESTIONS[index];
  const joined = joinedId === current.id;
  const next = AI_SUGGESTIONS[(index + 1) % AI_SUGGESTIONS.length];
  const others = AI_SUGGESTIONS.filter((_, i) => i !== index);

  const goNext = () => setIndex((i) => (i + 1) % AI_SUGGESTIONS.length);
  const goPrev = () => setIndex((i) => (i - 1 + AI_SUGGESTIONS.length) % AI_SUGGESTIONS.length);

  const handleJoin = () => {
    Alert.alert(
      "Preview only",
      "AI Match suggestions are demo picks for now. Join a real hangout or discover people instead.",
      [
        { text: "Open Hangout", onPress: () => router.replace("/hangout") },
        { text: "Discover", onPress: () => router.replace("/(tabs)/discover") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const footer = joined ? (
    <View style={styles.footerJoined}>
      <Ionicons name="checkmark-circle" size={20} color={VibeColors.neonGreen} />
      <Text style={styles.footerJoinedText}>You're in! {current.joinEmoji}</Text>
    </View>
  ) : (
    <View style={styles.footerRow}>
      <Pressable onPress={goNext} style={styles.skipBtn}>
        <Text style={styles.skipText}>Next ›</Text>
      </Pressable>
      <Pressable onPress={handleJoin} style={styles.footerJoinWrap}>
        <LinearGradient colors={["#22C55E", "#15803D"]} style={styles.footerBtn}>
          <Ionicons name="flash" size={18} color="#fff" />
          <Text style={styles.footerText}>Join {current.activity}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );

  return (
    <PremiumScreen
      heroImage={current.heroImage}
      title="AI Suggestion"
      subtitle={`Preview · ${index + 1} of ${AI_SUGGESTIONS.length}`}
      onBack={() => router.back()}
      footer={footer}
    >
      <View style={styles.previewBanner}>
        <Ionicons name="information-circle" size={16} color="#F59E0B" />
        <Text style={styles.previewBannerText}>Demo suggestions — not live AI matches yet</Text>
      </View>
      <View style={styles.dotsRow}>
        {AI_SUGGESTIONS.map((s, i) => (
          <Pressable key={s.id} onPress={() => setIndex(i)}>
            <View style={[styles.dot, i === index && styles.dotActive, i === index && { backgroundColor: current.accentColor }]} />
          </Pressable>
        ))}
      </View>

      {joined ? (
        <Animated.View entering={ZoomIn.duration(450).springify()} key={`success-${current.id}`}>
          <GlassCard style={styles.successCard}>
            <LinearGradient colors={["rgba(34,197,94,0.2)", "transparent"]} style={styles.successGlow} />
            <Text style={styles.successEmoji}>{current.joinEmoji}</Text>
            <Text style={styles.successTitle}>Plan joined!</Text>
            <Text style={styles.successSub}>
              {current.people.map((p) => p.name).join(", ")} + you · {current.timeLabel.toLowerCase()}
            </Text>
            <View style={styles.successBadge}>
              <PulseDot size={6} color={VibeColors.neonGreen} />
              <Text style={styles.successBadgeText}>CONFIRMED</Text>
            </View>
          </GlassCard>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.duration(350)} key={`hero-${current.id}`}>
        <GlassCard style={styles.heroCard}>
          <LinearGradient colors={[current.glowColor, "transparent"]} style={styles.heroGlow} />

          <View style={styles.heroTop}>
            <Pressable onPress={goPrev} style={styles.navBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color={VibeColors.textMuted} />
            </Pressable>
            <View style={styles.aiTag}>
              <Ionicons name="sparkles" size={12} color="#FFD700" />
              <Text style={styles.aiTagText}>AI PICK #{index + 1}</Text>
            </View>
            <Pressable onPress={goNext} style={styles.navBtn} hitSlop={8}>
              <Ionicons name="chevron-forward" size={20} color={VibeColors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.emojiWrap}>
            <View style={[styles.emojiGlow, { backgroundColor: `${current.accentColor}33` }]} />
            <Text style={styles.bigEmoji}>{current.emoji}</Text>
          </View>

          <Text style={styles.heroTitle}>{current.going} people want {current.activity}</Text>
          <Text style={[styles.heroTime, { color: current.accentColor }]}>{current.timeLabel}!</Text>

          <View style={styles.spotsRow}>
            <View style={styles.spotsTrack}>
              <LinearGradient
                colors={current.barGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.spotsFill, { width: `${(current.going / current.max) * 100}%` }]}
              />
            </View>
            <Text style={styles.spotsText}>
              {current.going}/{current.max} spots · {current.max - current.going} left
            </Text>
          </View>

          {!joined ? (
            <Pressable onPress={goNext} style={styles.nextHint}>
              <Text style={styles.nextHintText}>Pasand nahi? Next event dekho</Text>
              <Ionicons name="arrow-forward-circle" size={16} color="#C084FC" />
            </Pressable>
          ) : null}
        </GlassCard>
      </Animated.View>

      <SectionHeader title="Who's going" subtitle={`${current.vibeMatch}% avg vibe match`} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.peopleScroll}>
        {current.people.map((person, i) => (
          <Animated.View key={`${current.id}-${person.id}`} entering={FadeInUp.delay(i * 60).springify()}>
            <GlassCard style={styles.personCard}>
              <Image source={{ uri: person.avatarUrl }} style={styles.personAvatar} />
              <View style={styles.onlineRow}>
                <PulseDot size={6} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
              <Text style={styles.personName}>{person.name}</Text>
              <View style={styles.matchPill}>
                <Text style={styles.matchText}>{person.match}% match</Text>
              </View>
            </GlassCard>
          </Animated.View>
        ))}
      </ScrollView>

      <SectionHeader title="Plan details" />
      <GlassCard style={styles.detailCard}>
        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, { backgroundColor: `${current.accentColor}22` }]}>
            <Ionicons name="calendar" size={18} color={current.accentColor} />
          </View>
          <View style={styles.detailBody}>
            <Text style={styles.detailLabel}>Activity</Text>
            <Text style={styles.detailValue}>{current.planTitle}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, { backgroundColor: "rgba(192,132,252,0.15)" }]}>
            <Ionicons name="location" size={18} color="#C084FC" />
          </View>
          <View style={styles.detailBody}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{current.location}</Text>
            <Text style={styles.detailMeta}>{current.distance} km away</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, { backgroundColor: "rgba(34,197,94,0.15)" }]}>
            <Ionicons name="time" size={18} color="#22C55E" />
          </View>
          <View style={styles.detailBody}>
            <Text style={styles.detailLabel}>When</Text>
            <Text style={styles.detailValue}>{current.timeLabel}</Text>
          </View>
        </View>
      </GlassCard>

      <SectionHeader title="Why AI picked this" />
      {current.why.map((item, i) => (
        <Animated.View key={`${current.id}-${item.text}`} entering={FadeInUp.delay(i * 50).springify()}>
          <GlassCard style={styles.whyRow}>
            <View style={[styles.whyIcon, { backgroundColor: `${item.color}22` }]}>
              <Ionicons name={item.icon} size={16} color={item.color} />
            </View>
            <Text style={styles.whyText}>{item.text}</Text>
            <Ionicons name="checkmark-circle" size={18} color={VibeColors.neonGreenDim} />
          </GlassCard>
        </Animated.View>
      ))}

      <SectionHeader title="Next events" subtitle="Pasand nahi aaya? Ye bhi try karo" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nextScroll}>
        {others.map((s, i) => (
          <Animated.View key={s.id} entering={FadeIn.delay(i * 80)}>
            <Pressable
              onPress={() => setIndex(AI_SUGGESTIONS.findIndex((x) => x.id === s.id))}
              style={[styles.nextCard, { borderColor: `${s.accentColor}44` }]}
            >
              <LinearGradient colors={[s.glowColor, "rgba(20,20,26,0.92)"]} style={styles.nextCardInner}>
                <Text style={styles.nextEmoji}>{s.emoji}</Text>
                <Text style={styles.nextTitle}>{s.activity}</Text>
                <Text style={[styles.nextTime, { color: s.accentColor }]}>{s.timeLabel}</Text>
                <Text style={styles.nextGoing}>{s.going} going · {s.max - s.going} left</Text>
                <View style={styles.nextOpen}>
                  <Text style={styles.nextOpenText}>Open</Text>
                  <Ionicons name="arrow-forward" size={12} color="#C084FC" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ))}

        <Pressable onPress={goNext} style={styles.seeAllCard}>
          <GlassCard style={styles.seeAllInner}>
            <Ionicons name="refresh" size={22} color="#C084FC" />
            <Text style={styles.seeAllText}>Next: {next.emoji} {next.activity}</Text>
            <Text style={styles.seeAllSub}>Tap to switch</Text>
          </GlassCard>
        </Pressable>
      </ScrollView>
    </PremiumScreen>
  );
}

const styles = StyleSheet.create({
  previewBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: Spacing.md,
  },
  previewBannerText: {
    flex: 1,
    color: "#FBBF24",
    fontSize: 13,
    fontFamily: VibeFonts.body,
  },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: Spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)" },
  dotActive: { width: 18, borderRadius: 3 },
  heroCard: { padding: Spacing.lg, alignItems: "center", marginBottom: Spacing.lg, overflow: "hidden" },
  heroGlow: { ...StyleSheet.absoluteFillObject },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: Spacing.sm },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: VibeColors.bgGlassBorder,
  },
  aiTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,215,0,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  aiTagText: { fontSize: 10, fontFamily: VibeFonts.bold, color: VibeColors.textGold, letterSpacing: 1.2 },
  emojiWrap: { alignItems: "center", justifyContent: "center", width: 90, height: 90, marginBottom: Spacing.sm },
  emojiGlow: { position: "absolute", width: 72, height: 72, borderRadius: 36 },
  bigEmoji: { fontSize: 50 },
  heroTitle: { fontSize: 20, fontFamily: VibeFonts.extraBold, color: VibeColors.text, textAlign: "center", letterSpacing: -0.3 },
  heroTime: { fontSize: 15, fontFamily: VibeFonts.semiBold, marginTop: 4, marginBottom: Spacing.md },
  spotsRow: { width: "100%" },
  spotsTrack: { height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  spotsFill: { height: "100%", borderRadius: 3 },
  spotsText: { fontSize: 11, fontFamily: VibeFonts.medium, color: VibeColors.textMuted, textAlign: "center" },
  nextHint: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: Spacing.md, paddingTop: Spacing.sm },
  nextHintText: { fontSize: 12, fontFamily: VibeFonts.semiBold, color: "#C084FC" },
  peopleScroll: { marginBottom: Spacing.xl },
  personCard: { width: 120, padding: Spacing.md, alignItems: "center", marginRight: Spacing.sm, position: "relative" },
  personAvatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 8, borderWidth: 2, borderColor: "rgba(138,86,255,0.4)" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4, position: "absolute", top: 58, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  onlineText: { fontSize: 8, fontFamily: VibeFonts.bold, color: VibeColors.neonGreenDim },
  personName: { fontSize: 13, fontFamily: VibeFonts.bold, color: VibeColors.text, marginTop: 6 },
  matchPill: { marginTop: 6, backgroundColor: "rgba(138,86,255,0.2)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  matchText: { fontSize: 10, fontFamily: VibeFonts.semiBold, color: "#C084FC" },
  detailCard: { padding: Spacing.lg, marginBottom: Spacing.lg },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md },
  detailIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  detailBody: { flex: 1 },
  detailLabel: { fontSize: 10, fontFamily: VibeFonts.semiBold, color: VibeColors.textMuted, textTransform: "uppercase", letterSpacing: 0.8 },
  detailValue: { fontSize: 14, fontFamily: VibeFonts.bold, color: VibeColors.text, marginTop: 2 },
  detailMeta: { fontSize: 11, fontFamily: VibeFonts.medium, color: VibeColors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: VibeColors.bgGlassBorder, marginVertical: Spacing.md },
  whyRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.md, marginBottom: Spacing.sm },
  whyIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  whyText: { flex: 1, fontSize: 13, fontFamily: VibeFonts.medium, color: VibeColors.text },
  nextScroll: { marginBottom: Spacing.xl },
  nextCard: { width: 140, marginRight: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, overflow: "hidden" },
  nextCardInner: { padding: Spacing.md, minHeight: 148 },
  nextEmoji: { fontSize: 28, marginBottom: 6 },
  nextTitle: { fontSize: 15, fontFamily: VibeFonts.extraBold, color: VibeColors.text },
  nextTime: { fontSize: 11, fontFamily: VibeFonts.semiBold, marginTop: 2 },
  nextGoing: { fontSize: 10, fontFamily: VibeFonts.medium, color: VibeColors.textMuted, marginTop: 4 },
  nextOpen: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  nextOpenText: { fontSize: 11, fontFamily: VibeFonts.bold, color: "#C084FC" },
  seeAllCard: { marginRight: Spacing.md },
  seeAllInner: { width: 120, minHeight: 148, padding: Spacing.md, alignItems: "center", justifyContent: "center" },
  seeAllText: { fontSize: 12, fontFamily: VibeFonts.bold, color: VibeColors.text, marginTop: 8, textAlign: "center" },
  seeAllSub: { fontSize: 10, fontFamily: VibeFonts.medium, color: VibeColors.textMuted, marginTop: 4 },
  successCard: { padding: Spacing.xl, alignItems: "center", marginBottom: Spacing.lg, overflow: "hidden" },
  successGlow: { ...StyleSheet.absoluteFillObject },
  successEmoji: { fontSize: 48, marginBottom: 8 },
  successTitle: { fontSize: 22, fontFamily: VibeFonts.extraBold, color: VibeColors.text },
  successSub: { fontSize: 13, fontFamily: VibeFonts.medium, color: VibeColors.textMuted, marginTop: 6, textAlign: "center" },
  successBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: Spacing.md, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: "rgba(34,197,94,0.15)", borderWidth: 1, borderColor: "rgba(34,197,94,0.3)" },
  successBadgeText: { fontSize: 11, fontFamily: VibeFonts.bold, color: VibeColors.neonGreen, letterSpacing: 1 },
  footerRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  skipBtn: { paddingHorizontal: 18, paddingVertical: 15, borderRadius: Radius.xl, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: VibeColors.bgGlassBorder, justifyContent: "center" },
  skipText: { fontSize: 14, fontFamily: VibeFonts.bold, color: "#C084FC" },
  footerJoinWrap: { flex: 1, borderRadius: Radius.xl, overflow: "hidden" },
  footerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  footerText: { color: "#fff", fontSize: 14, fontFamily: VibeFonts.bold },
  footerJoined: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: Radius.xl, backgroundColor: "rgba(34,197,94,0.15)", borderWidth: 1, borderColor: "rgba(34,197,94,0.35)", marginBottom: 4 },
  footerJoinedText: { fontSize: 14, fontFamily: VibeFonts.bold, color: VibeColors.neonGreen },
});
