import { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import GlassCard from "../vibe/GlassCard";
import PulseDot from "./PulseDot";
import { VibeColors, VibeFonts } from "../../constants/vibeTheme";
import { Spacing } from "../../constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");

const LIVE_TICKER = [
  "☕ Priya just joined a Coffee plan · 2 min ago",
  "💘 3 new matches in Sitabuldi · right now",
  "🍺 Beer hangout filling fast · 6/8 spots left",
];

const TRENDING = [
  { id: "1", emoji: "☕", label: "Coffee", sub: "18 going", hot: true, color: "#F59E0B" },
  { id: "2", emoji: "🍕", label: "Food", sub: "11 plans", hot: false, color: "#F97316" },
  { id: "3", emoji: "🍺", label: "Beer", sub: "9 tonight", hot: true, color: "#EAB308" },
  { id: "4", emoji: "🏸", label: "Sports", sub: "6 active", hot: false, color: "#22C55E" },
];

function StatPill({ value, label, delay, light }: { value: string; label: string; delay: number; light?: boolean }) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={[styles.statPill, light && styles.statPillLight]}>
      <Text style={[styles.statValue, light && styles.statValueLight]}>{value}</Text>
      <Text style={[styles.statLabel, light && styles.statLabelLight]}>{label}</Text>
    </Animated.View>
  );
}

export default function VibeHypeZone({ light = false }: { light?: boolean }) {
  const router = useRouter();
  const marquee = useSharedValue(0);

  useEffect(() => {
    marquee.value = withRepeat(
      withTiming(-1, { duration: 14000, easing: Easing.linear }),
      -1,
      false
    );
  }, [marquee]);

  const marqueeAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: marquee.value * (SCREEN_W * 0.85) }],
  }));

  const tickerText = LIVE_TICKER.join("   •   ");

  const Container = light ? View : GlassCard;

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.wrap}>
      <Container style={StyleSheet.flatten([styles.card, light && styles.cardLight])}>
        <View style={styles.statsRow}>
          <StatPill value="128" label="Online now" delay={80} light={light} />
          <StatPill value="34" label="Plans today" delay={140} light={light} />
          <StatPill value="91%" label="Match vibe" delay={200} light={light} />
        </View>

        <View style={styles.tickerBox}>
          <LinearGradient colors={light ? ["rgba(138,86,255,0.08)", "rgba(255,75,129,0.05)"] : ["rgba(255,75,129,0.12)", "rgba(138,86,255,0.08)"]} style={styles.tickerGrad}>
            <Ionicons name="radio" size={14} color="#FF4B81" style={styles.tickerIcon} />
            <View style={styles.tickerClip}>
              <Animated.View style={[styles.tickerTrack, marqueeAnim]}>
                <Text style={[styles.tickerText, light && styles.tickerTextLight]}>{tickerText}</Text>
                <Text style={[styles.tickerText, light && styles.tickerTextLight]}>{tickerText}</Text>
              </Animated.View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.trendRow}>
          {TRENDING.map((t, i) => (
            <Animated.View key={t.id} entering={FadeInUp.delay(260 + i * 50).springify()} style={styles.trendCell}>
              <Pressable onPress={() => router.push("/hangout")} style={[styles.trendChip, light && styles.trendChipLight, { borderColor: light ? "rgba(138,86,255,0.08)" : `${t.color}55` }]}>
                {t.hot ? (
                  <View style={styles.hotDot}>
                    <PulseDot size={5} color="#FF4B81" />
                  </View>
                ) : null}
                <Text style={styles.trendEmoji}>{t.emoji}</Text>
                <Text style={[styles.trendLabel, light && styles.trendLabelLight]}>{t.label}</Text>
                <Text style={[styles.trendSub, { color: t.color }]}>{t.sub}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </Container>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.xl },
  card: { padding: Spacing.md },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: Spacing.md },
  statPill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statValue: { fontSize: 20, fontFamily: VibeFonts.extraBold, color: "#fff" },
  statLabel: { fontSize: 9, fontFamily: VibeFonts.semiBold, color: VibeColors.textMuted, marginTop: 2, textAlign: "center" },
  tickerBox: { marginBottom: Spacing.md, borderRadius: 14, overflow: "hidden" },
  tickerGrad: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12 },
  tickerIcon: { marginRight: 8 },
  tickerClip: { flex: 1, overflow: "hidden", height: 18 },
  tickerTrack: { flexDirection: "row", width: SCREEN_W * 1.7 },
  tickerText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.85)",
    width: SCREEN_W * 0.85,
  },
  trendRow: { flexDirection: "row", gap: 8 },
  trendCell: { flex: 1 },
  trendChip: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    position: "relative",
  },
  hotDot: { position: "absolute", top: 6, right: 6 },
  trendEmoji: { fontSize: 20, marginBottom: 4 },
  trendLabel: { fontSize: 10, fontFamily: VibeFonts.bold, color: VibeColors.text },
  trendSub: { fontSize: 9, fontFamily: VibeFonts.semiBold, marginTop: 2 },
  cardLight: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(138,86,255,0.08)",
    borderRadius: 20,
    shadowColor: "#8A56FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  statPillLight: {
    backgroundColor: "rgba(138,86,255,0.05)",
    borderColor: "rgba(138,86,255,0.08)",
  },
  statValueLight: { color: "#1F1A3A" },
  statLabelLight: { color: "rgba(31,26,58,0.6)" },
  tickerTextLight: { color: "#1F1A3A" },
  trendChipLight: {
    backgroundColor: "#FFF",
    borderColor: "rgba(138,86,255,0.08)",
    shadowColor: "#8A56FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  trendLabelLight: { color: "#1F1A3A" },
});
