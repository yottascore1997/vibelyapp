import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import InteractiveCityMap, {
  InteractiveMapMarker,
} from "../components/map/InteractiveCityMap";
import { getCityCenter, resolveCityId } from "../constants/mapEvents";
import { useAuth } from "../context/AuthContext";
import { usePlans } from "../context/PlansContext";
import { api } from "../services/api";
import { getCurrentUserLocation } from "../services/location";
import { VibeFonts } from "../constants/vibeTheme";
import AppHeader from "../components/vibe/AppHeader";
import HangoutCinematicBackground from "../components/vibe/HangoutCinematicBackground";
import TabBar from "../components/TabBar";

const { height: SCREEN_H } = Dimensions.get("window");

const T = {
  bg: "#070A14",
  card: "rgba(22, 26, 46, 0.94)",
  ink: "#F4F6FB",
  muted: "#A7B0C4",
  border: "rgba(160, 170, 200, 0.16)",
  purple: "#A78BFA",
  green: "#34D399",
};

function isLiveSpot(p: any) {
  if (!p || p.status === "CANCELLED" || p.status === "COMPLETED") return false;
  const end = p.endDate ? new Date(p.endDate).getTime() : 0;
  if (end && end > Date.now()) return true;
  const title = String(p.title || "").toLowerCase();
  if (!title.includes("live spot")) return false;
  const scheduled = p.scheduledAt ? new Date(p.scheduledAt).getTime() : 0;
  return scheduled > 0 && Date.now() - scheduled < 3 * 60 * 60 * 1000;
}

export default function LiveMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { nearbyPlans, myPlans, refresh } = usePlans();
  const [center, setCenter] = useState(() => {
    const city = resolveCityId((user as any)?.city) || "nagpur";
    return getCityCenter(city);
  });
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const loc = await getCurrentUserLocation({ highAccuracy: false });
      if (loc.ok) {
        setCenter({ latitude: loc.location.latitude, longitude: loc.location.longitude });
      }
      const [nearbyRes] = await Promise.all([
        api.getNearbyPeople({ maxKm: 8, limit: 30 }),
        refresh().catch(() => undefined),
      ]);
      if (Array.isArray(nearbyRes)) setPeople(nearbyRes);
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    load();
  }, [load]);

  const spotPlans = useMemo(() => {
    const all = [...nearbyPlans, ...myPlans].filter(
      (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
    );
    return all.filter(isLiveSpot);
  }, [nearbyPlans, myPlans]);

  const markers: InteractiveMapMarker[] = useMemo(() => {
    const list: InteractiveMapMarker[] = [];
    spotPlans.forEach((p, idx) => {
      const lat = (p as any).latitude ?? center.latitude + (idx % 3) * 0.004 - 0.004;
      const lng = (p as any).longitude ?? center.longitude + (idx % 4) * 0.004 - 0.006;
      list.push({
        id: `spot-${p.id}`,
        latitude: Number(lat),
        longitude: Number(lng),
        kind: "event",
        emoji: "📡",
        label: p.title,
        color: "#10B981",
      });
    });
    people.forEach((u, idx) => {
      const lat = u.latitude ?? center.latitude + ((idx % 5) - 2) * 0.003;
      const lng = u.longitude ?? center.longitude + ((idx % 4) - 1.5) * 0.0035;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      list.push({
        id: `person-${u.id}`,
        latitude: Number(lat),
        longitude: Number(lng),
        kind: "person",
        avatarUrl: u.avatarUrl,
        label: u.name,
        online: u.isOnline !== false,
        verified: !!u.isVerified,
      });
    });
    return list;
  }, [spotPlans, people, center]);

  const onMarkerPress = (id: string, kind: "event" | "person") => {
    setSelectedId(id);
    if (kind === "event") {
      const planId = id.replace(/^spot-/, "");
      router.push({ pathname: "/plan-details", params: { id: planId } });
    } else {
      const userId = id.replace(/^person-/, "");
      const person = people.find((p) => String(p.id) === userId);
      router.push({
        pathname: "/user/[id]",
        params: {
          id: userId,
          name: person?.name || "User",
          avatarUrl: person?.avatarUrl || "",
        },
      });
    }
  };

  return (
    <View style={styles.root}>
      <HangoutCinematicBackground />
      <StatusBar style="light" />
      <View style={[styles.foreground, { paddingTop: insets.top }]}>
        <AppHeader variant="dark" tagline="Live map · Spots + people" />

        <View style={styles.toolbar}>
          <Pressable style={styles.backChip} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={16} color="#FFF" />
            <Text style={styles.backChipText}>Back</Text>
          </Pressable>
          <View style={styles.statsChip}>
            <View style={styles.liveDot} />
            <Text style={styles.statsText}>
              {spotPlans.length} spots · {people.length} nearby
            </Text>
          </View>
          <Pressable style={styles.refreshChip} onPress={load}>
            <Ionicons name="refresh" size={16} color={T.purple} />
          </Pressable>
        </View>

        <View style={styles.mapCard}>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={T.purple} size="large" />
              <Text style={styles.loadingText}>Finding live signals…</Text>
            </View>
          ) : (
            <InteractiveCityMap
              latitude={center.latitude}
              longitude={center.longitude}
              zoom={14}
              markers={markers}
              selectedId={selectedId}
              onMarkerPress={onMarkerPress}
              style={styles.map}
            />
          )}
        </View>

        <Text style={styles.hint}>
          Tap a green beacon for a Live Spot · tap an avatar to open profile
        </Text>
      </View>
      <TabBar dark />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  foreground: { flex: 1, zIndex: 1 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  backChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  backChipText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  statsChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: T.green,
  },
  statsText: {
    color: T.ink,
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
  },
  refreshChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  mapCard: {
    marginHorizontal: 16,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: T.border,
    height: Math.min(SCREEN_H * 0.58, 480),
    backgroundColor: T.card,
  },
  map: { flex: 1, width: "100%", height: "100%" },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: T.muted,
    fontFamily: VibeFonts.medium,
    fontSize: 13,
  },
  hint: {
    marginTop: 12,
    marginHorizontal: 20,
    color: T.muted,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    textAlign: "center",
  },
});
