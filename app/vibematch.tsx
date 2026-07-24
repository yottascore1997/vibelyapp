import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import PremiumScreen from "../components/vibe/PremiumScreen";
import SectionHeader from "../components/vibe/SectionHeader";
import GlassCard from "../components/vibe/GlassCard";
import { VibeColors, VibeFonts } from "../constants/vibeTheme";
import { api } from "../services/api";
import { usePlans } from "../context/PlansContext";
import { Radius, Spacing } from "../constants/theme";
import type { Plan } from "../constants/plans";

type Suggestion = {
  id: string;
  activity: string;
  emoji: string;
  timeLabel: string;
  going: number;
  max: number;
  vibeMatch: number;
  heroImage: string;
  planTitle: string;
  location: string;
  distance: number;
};

function planToSuggestion(p: Plan, i: number): Suggestion {
  const score = Math.min(99, 98 - Math.round((p.distance || i + 1) * 1.5));
  return {
    id: p.id,
    activity: p.activity || "Hangout",
    emoji: "✨",
    timeLabel: p.timeLabel || p.time || "Soon",
    going: p.going || 1,
    max: p.maxParticipants || 8,
    vibeMatch: score,
    heroImage:
      p.imageUrl ||
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800",
    planTitle: p.title,
    location: p.location || "Nearby",
    distance: p.distance || 2 + i,
  };
}

export default function VibeMatchScreen() {
  const router = useRouter();
  const { joinPlan } = usePlans();
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [plans, setPlans] = useState<Suggestion[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = (await api.getNearbyPlans()) || [];
        const ranked = [...list]
          .sort((a, b) => (a.distance || 99) - (b.distance || 99))
          .slice(0, 12)
          .map(planToSuggestion);
        setPlans(ranked);
        setIndex(0);
      } catch {
        setPlans([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const current = plans[index];
  const others = useMemo(() => plans.filter((_, i) => i !== index), [plans, index]);

  const handleJoin = async () => {
    if (!current) return;
    setJoining(true);
    try {
      await joinPlan(current.id);
      try {
        await api.addJarItem({
          title: `Joined ${current.planTitle}`,
          type: "PLAN",
          description: current.location,
          meta: current.activity,
        });
      } catch {
        // optional
      }
      Alert.alert("Joined!", `${current.planTitle} — you're in.`, [
        { text: "Open Hangout", onPress: () => router.replace("/hangout") },
        { text: "OK" },
      ]);
    } catch (e) {
      Alert.alert("Could not join", e instanceof Error ? e.message : "Try again");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <PremiumScreen>
        <View style={styles.center}>
          <ActivityIndicator color={VibeColors.neonPink} size="large" />
          <Text style={styles.loadingText}>Finding best vibes near you…</Text>
        </View>
      </PremiumScreen>
    );
  }

  if (!current) {
    return (
      <PremiumScreen>
        <View style={styles.center}>
          <Ionicons name="sparkles" size={36} color={VibeColors.neonPurple} />
          <Text style={styles.emptyTitle}>No live plans nearby</Text>
          <Text style={styles.emptySub}>Create a hangout or check Discover meanwhile.</Text>
          <Pressable style={styles.cta} onPress={() => router.replace("/hangout")}>
            <Text style={styles.ctaText}>Open Hangout</Text>
          </Pressable>
        </View>
      </PremiumScreen>
    );
  }

  return (
    <PremiumScreen
      footer={
        <View style={styles.footerRow}>
          <Pressable
            onPress={() => setIndex((i) => (i + 1) % plans.length)}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Next ›</Text>
          </Pressable>
          <Pressable onPress={handleJoin} style={styles.footerJoinWrap} disabled={joining}>
            <LinearGradient colors={["#22C55E", "#15803D"]} style={styles.footerBtn}>
              <Ionicons name="flash" size={18} color="#fff" />
              <Text style={styles.footerText}>{joining ? "Joining…" : `Join ${current.activity}`}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View>
            <Text style={styles.eyebrow}>SMART MATCH</Text>
            <Text style={styles.title}>Best plans for you</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80)} style={styles.heroCard}>
          <Image source={{ uri: current.heroImage }} style={styles.heroImg} />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.85)"]} style={styles.heroGrad}>
            <Text style={styles.heroMatch}>{current.vibeMatch}% match</Text>
            <Text style={styles.heroTitle}>{current.planTitle}</Text>
            <Text style={styles.heroMeta}>
              {current.location} · {current.distance.toFixed?.(1) || current.distance} km · {current.going}/{current.max}
            </Text>
            <Text style={styles.heroTime}>{current.timeLabel}</Text>
          </LinearGradient>
        </Animated.View>

        <SectionHeader title="Why this plan" subtitle="Ranked by distance & availability" />
        <GlassCard style={styles.whyCard}>
          <Text style={styles.whyLine}>📍 Close to you ({current.distance} km)</Text>
          <Text style={styles.whyLine}>👥 {current.going} people already going</Text>
          <Text style={styles.whyLine}>⏰ {current.timeLabel}</Text>
        </GlassCard>

        {others.length > 0 ? (
          <>
            <SectionHeader title="More suggestions" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: Spacing.md }}>
              {others.slice(0, 6).map((o) => (
                <Pressable
                  key={o.id}
                  style={styles.mini}
                  onPress={() => setIndex(plans.findIndex((p) => p.id === o.id))}
                >
                  <Image source={{ uri: o.heroImage }} style={styles.miniImg} />
                  <Text style={styles.miniTitle} numberOfLines={1}>{o.planTitle}</Text>
                  <Text style={styles.miniMeta}>{o.vibeMatch}%</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}
      </ScrollView>
    </PremiumScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  loadingText: { color: "rgba(255,255,255,0.7)", fontFamily: VibeFonts.medium },
  emptyTitle: { color: "#fff", fontFamily: VibeFonts.bold, fontSize: 18, marginTop: 8 },
  emptySub: { color: "rgba(255,255,255,0.55)", textAlign: "center", fontFamily: VibeFonts.medium },
  cta: { marginTop: 12, backgroundColor: VibeColors.neonPink, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
  ctaText: { color: "#fff", fontFamily: VibeFonts.bold },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: Spacing.md, marginBottom: 12 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },
  eyebrow: { color: VibeColors.neonPink, fontSize: 11, fontFamily: VibeFonts.bold, letterSpacing: 1 },
  title: { color: "#fff", fontSize: 22, fontFamily: VibeFonts.extraBold },
  heroCard: { marginHorizontal: Spacing.md, borderRadius: 24, overflow: "hidden", height: 360 },
  heroImg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  heroGrad: { flex: 1, justifyContent: "flex-end", padding: 16 },
  heroMatch: { color: VibeColors.neonGreen, fontFamily: VibeFonts.bold, marginBottom: 4 },
  heroTitle: { color: "#fff", fontSize: 24, fontFamily: VibeFonts.extraBold },
  heroMeta: { color: "rgba(255,255,255,0.75)", marginTop: 4, fontFamily: VibeFonts.medium },
  heroTime: { color: "rgba(255,255,255,0.9)", marginTop: 6, fontFamily: VibeFonts.semiBold },
  whyCard: { marginHorizontal: Spacing.md, padding: 14, gap: 8 },
  whyLine: { color: "rgba(255,255,255,0.85)", fontFamily: VibeFonts.medium },
  mini: { width: 140, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" },
  miniImg: { width: "100%", height: 90 },
  miniTitle: { color: "#fff", padding: 8, fontFamily: VibeFonts.semiBold, fontSize: 12 },
  miniMeta: { color: VibeColors.neonPink, paddingHorizontal: 8, paddingBottom: 8, fontFamily: VibeFonts.bold, fontSize: 11 },
  footerRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  skipBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  skipText: { color: "rgba(255,255,255,0.7)", fontFamily: VibeFonts.bold },
  footerJoinWrap: { flex: 1, borderRadius: Radius.full, overflow: "hidden" },
  footerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  footerText: { color: "#fff", fontFamily: VibeFonts.bold },
});
