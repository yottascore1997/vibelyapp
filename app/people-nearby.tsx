import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { API_URL } from "../constants/theme";
import { VibeFonts } from "../constants/vibeTheme";
import TabBar from "../components/TabBar";

const { width: SCREEN_W } = Dimensions.get("window");
const RADAR = Math.min(SCREEN_W - 48, 320);
const MAX_KM = 10;

const T = {
  bg: "#07070B",
  card: "#12121A",
  ink: "#FFFFFF",
  muted: "rgba(255,255,255,0.55)",
  faint: "rgba(255,255,255,0.35)",
  pink: "#FF3D7F",
  purple: "#8B5CF6",
  green: "#22C55E",
  border: "rgba(255,255,255,0.1)",
};

type NearbyPerson = {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  city?: string;
  distance: number;
  isOnline?: boolean;
  isVerified?: boolean;
  avatarUrl?: string;
  jobTitle?: string;
  vibeMatch?: number;
  interests?: { name: string }[];
};

function resolveAvatar(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_URL.replace("/api", "")}${url}`;
}

function RadarRing({ size, delay }: { size: number; delay: number }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }), -1, false)
    );
  }, [delay, pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 0.7, 1], [0.55, 0.2, 0]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.72, 1.08]) }],
  }));

  return (
    <Animated.View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
}

function SweepArm() {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 2800, easing: Easing.linear }), -1, false);
  }, [rot]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.sweepWrap, style]}>
      <LinearGradient
        colors={["rgba(255,61,127,0.55)", "rgba(255,61,127,0.08)", "transparent"]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 0 }}
        style={styles.sweep}
      />
    </Animated.View>
  );
}

function FloatingDot({
  person,
  angle,
  radius,
  index,
}: {
  person: NearbyPerson;
  angle: number;
  radius: number;
  index: number;
}) {
  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = withDelay(400 + index * 180, withTiming(1, { duration: 500 }));
  }, [fade, index]);

  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateX: Math.cos(angle) * radius },
      { translateY: Math.sin(angle) * radius },
      { scale: fade.value },
    ],
  }));

  const avatar = resolveAvatar(person.avatarUrl);

  return (
    <Animated.View style={[styles.floatDot, style]}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.floatAvatar} />
      ) : (
        <View style={[styles.floatAvatar, styles.floatFallback]}>
          <Text style={styles.floatInitial}>{person.name?.[0] || "?"}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function PeopleNearbyScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [people, setPeople] = useState<NearbyPerson[]>([]);
  const [scanning, setScanning] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const [city, setCity] = useState<string>("Nearby");

  const load = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setScanning(true);
    setError(null);

    try {
      if (token) {
        const me: any = await api.getProfile(token);
        if (me?.avatarUrl) setMyAvatar(resolveAvatar(me.avatarUrl));
        if (me?.city) setCity(me.city);
      }

      // Brief radar moment so the discovering UI feels intentional
      await new Promise((r) => setTimeout(r, isRefresh ? 400 : 1600));

      const list = (await api.getNearbyPeople({ maxKm: MAX_KM, limit: 50 })) || [];
      setPeople(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not find people nearby");
      setPeople([]);
    } finally {
      setScanning(false);
      setRefreshing(false);
    }
  }, [token, user]);

  useEffect(() => {
    load();
  }, [load]);

  const radarPeople = useMemo(() => people.slice(0, 6), [people]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>People Nearby</Text>
            <Text style={styles.headerSub}>Within {MAX_KM} km · {city}</Text>
          </View>
          <Pressable onPress={() => load(true)} style={styles.iconBtn} hitSlop={12}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.pink} />
          }
        >
          {/* RADAR */}
          <View style={styles.radarBlock}>
            <View style={[styles.radar, { width: RADAR, height: RADAR }]}>
              <RadarRing size={RADAR * 0.95} delay={0} />
              <RadarRing size={RADAR * 0.72} delay={400} />
              <RadarRing size={RADAR * 0.48} delay={800} />
              <View style={styles.radarGrid} />
              <SweepArm />

              {radarPeople.map((p, i) => {
                const angle = (i / Math.max(radarPeople.length, 1)) * Math.PI * 2 - Math.PI / 2;
                const radius = RADAR * (0.22 + (i % 3) * 0.1);
                return (
                  <FloatingDot key={p.id} person={p} angle={angle} radius={radius} index={i} />
                );
              })}

              <View style={styles.centerMe}>
                {myAvatar ? (
                  <Image source={{ uri: myAvatar }} style={styles.meAvatar} />
                ) : (
                  <LinearGradient colors={[T.pink, T.purple]} style={styles.meAvatar}>
                    <Text style={styles.meInitial}>{user?.name?.[0] || "Y"}</Text>
                  </LinearGradient>
                )}
                <View style={styles.mePulse} />
              </View>
            </View>

            <Text style={styles.scanLabel}>
              {scanning ? "Discovering people nearby…" : `${people.length} people within ${MAX_KM} km`}
            </Text>
            {scanning ? (
              <Text style={styles.scanHint}>Scanning your area — keep location on for best results</Text>
            ) : null}
          </View>

          {/* LIST */}
          <View style={styles.listHead}>
            <Text style={styles.listTitle}>Nearby now</Text>
            <Text style={styles.listCount}>{people.length}</Text>
          </View>

          {error ? (
            <View style={styles.empty}>
              <Ionicons name="warning-outline" size={28} color={T.pink} />
              <Text style={styles.emptyTitle}>Search failed</Text>
              <Text style={styles.emptySub}>{error}</Text>
              <Pressable style={styles.retryBtn} onPress={() => load()}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {!scanning && !error && people.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="radio-outline" size={32} color={T.purple} />
              <Text style={styles.emptyTitle}>No one within {MAX_KM} km</Text>
              <Text style={styles.emptySub}>
                Try updating your city in profile, or check back when more people are online.
              </Text>
            </View>
          ) : null}

          {people.map((p, i) => {
            const avatar = resolveAvatar(p.avatarUrl);
            return (
              <Animated.View key={p.id} entering={FadeInDown.delay(Math.min(i * 60, 400)).springify()}>
                <Pressable
                  style={styles.card}
                  onPress={() => router.push("/(tabs)/discover")}
                >
                  <View>
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={styles.cardAvatar} />
                    ) : (
                      <View style={[styles.cardAvatar, styles.floatFallback]}>
                        <Text style={styles.floatInitial}>{p.name?.[0] || "?"}</Text>
                      </View>
                    )}
                    {p.isOnline ? <View style={styles.onlineDot} /> : null}
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {p.name}
                        {p.age ? `, ${p.age}` : ""}
                      </Text>
                      {p.isVerified ? (
                        <Ionicons name="checkmark-circle" size={16} color={T.pink} />
                      ) : null}
                    </View>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {p.jobTitle || p.bio || p.city || "Nearby"}
                    </Text>
                    <View style={styles.tags}>
                      <View style={styles.distPill}>
                        <Ionicons name="navigate" size={11} color={T.pink} />
                        <Text style={styles.distText}>{p.distance.toFixed(1)} km</Text>
                      </View>
                      {typeof p.vibeMatch === "number" ? (
                        <View style={styles.vibePill}>
                          <Text style={styles.vibeText}>{p.vibeMatch}% vibe</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <Pressable
                    style={styles.waveBtn}
                    onPress={() => router.push("/(tabs)/discover")}
                  >
                    <Ionicons name="hand-left" size={18} color="#fff" />
                  </Pressable>
                </Pressable>
              </Animated.View>
            );
          })}

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  headerTitle: {
    fontFamily: VibeFonts.extraBold,
    fontSize: 20,
    color: T.ink,
  },
  headerSub: {
    marginTop: 2,
    fontFamily: VibeFonts.medium,
    fontSize: 12,
    color: T.muted,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  radarBlock: { alignItems: "center", paddingTop: 8, paddingBottom: 20 },
  radar: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.08)",
    overflow: "hidden",
  },
  ring: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "rgba(255,61,127,0.35)",
  },
  radarGrid: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  sweepWrap: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  sweep: {
    position: "absolute",
    width: "50%",
    height: "50%",
    left: "50%",
    top: 0,
    borderTopRightRadius: 200,
  },
  centerMe: { alignItems: "center", justifyContent: "center", zIndex: 5 },
  meAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: T.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  meInitial: { fontFamily: VibeFonts.bold, fontSize: 22, color: "#fff" },
  mePulse: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: "rgba(255,61,127,0.35)",
  },
  floatDot: {
    position: "absolute",
    zIndex: 4,
  },
  floatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#fff",
  },
  floatFallback: {
    backgroundColor: T.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  floatInitial: { fontFamily: VibeFonts.bold, color: "#fff", fontSize: 13 },
  scanLabel: {
    marginTop: 18,
    fontFamily: VibeFonts.bold,
    fontSize: 16,
    color: T.ink,
    textAlign: "center",
  },
  scanHint: {
    marginTop: 6,
    fontFamily: VibeFonts.medium,
    fontSize: 12,
    color: T.faint,
    textAlign: "center",
  },
  listHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 4,
  },
  listTitle: { fontFamily: VibeFonts.extraBold, fontSize: 18, color: T.ink },
  listCount: {
    fontFamily: VibeFonts.bold,
    fontSize: 13,
    color: T.pink,
    backgroundColor: "rgba(255,61,127,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.card,
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardAvatar: { width: 56, height: 56, borderRadius: 18 },
  onlineDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: T.green,
    borderWidth: 2,
    borderColor: T.card,
  },
  cardBody: { flex: 1 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: { fontFamily: VibeFonts.bold, fontSize: 16, color: T.ink, maxWidth: "85%" },
  cardMeta: { marginTop: 2, fontFamily: VibeFonts.medium, fontSize: 12, color: T.muted },
  tags: { flexDirection: "row", gap: 6, marginTop: 8 },
  distPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,61,127,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  distText: { fontFamily: VibeFonts.semiBold, fontSize: 11, color: T.pink },
  vibePill: {
    backgroundColor: "rgba(139,92,246,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  vibeText: { fontFamily: VibeFonts.semiBold, fontSize: 11, color: "#C4B5FD" },
  waveBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.pink,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: { fontFamily: VibeFonts.bold, fontSize: 16, color: T.ink, textAlign: "center" },
  emptySub: { fontFamily: VibeFonts.medium, fontSize: 13, color: T.muted, textAlign: "center", lineHeight: 18 },
  retryBtn: {
    marginTop: 8,
    backgroundColor: T.pink,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  retryText: { fontFamily: VibeFonts.bold, color: "#fff", fontSize: 13 },
});
