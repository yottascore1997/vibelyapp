import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import InteractiveCityMap, {
  InteractiveMapMarker,
} from "../components/map/InteractiveCityMap";
import {
  CITIES,
  CITY_BY_ID,
  CityId,
  MapEvent,
  MapPerson,
  buildCityEvents,
  getCityCenter,
  getCityZoom,
  resolveCityId,
} from "../constants/mapEvents";
import { useAuth } from "../context/AuthContext";
import { usePlans } from "../context/PlansContext";
import { api } from "../services/api";
import { VibeFonts } from "../constants/vibeTheme";
import AppHeader from "../components/vibe/AppHeader";
import TabBar from "../components/TabBar";

const CITY_STORAGE_KEY = "@vibely_map_city";

const T = {
  bg: "#F8F9FD",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  ink: "#18181B",
  muted: "#64748B",
  faint: "#94A3B8",
  border: "#E2E8F0",
  purple: "#7C3AED",
  purpleDeep: "#6D28D9",
  purpleBright: "#8B5CF6",
  softPurple: "#F3E8FF",
  pink: "#EC4899",
  green: "#10B981",
  yellow: "#F59E0B",
  red: "#EF4444",
  blue: "#2563EB",
  dark: "#18181B",
  darkSoft: "#27272A",
  glass: "rgba(255,255,255,0.92)",
  cta: ["#7C3AED", "#8B5CF6"] as const,
  promo: ["#7C3AED", "#8B5CF6", "#EC4899"] as const,
};

type MapMode = "events" | "people";

export default function EventsMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { myPlans, nearbyPlans, refresh } = usePlans();

  const [cityId, setCityId] = useState<CityId>("nagpur");
  const [cityReady, setCityReady] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [mode, setMode] = useState<MapMode>("events");
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<MapPerson | null>(null);
  const [search, setSearch] = useState("");
  const [profileCity, setProfileCity] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);

  const city = CITY_BY_ID[cityId];
  const center = getCityCenter(cityId);
  const zoom = getCityZoom(cityId);
  const allPlans = useMemo(() => [...myPlans, ...nearbyPlans], [myPlans, nearbyPlans]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(CITY_STORAGE_KEY);
        let profileResolved: CityId | null = null;
        let cityLabel: string | null = null;
        if (token) {
          try {
            const res = (await api.getProfile(token)) as any;
            cityLabel = res?.profile?.city || null;
            profileResolved = resolveCityId(cityLabel);
          } catch {
            /* ignore */
          }
        }
        if (!cancelled) {
          setProfileCity(cityLabel);
          if (saved && CITIES.some((c) => c.id === saved)) setCityId(saved as CityId);
          else if (profileResolved) {
            setCityId(profileResolved);
            await AsyncStorage.setItem(CITY_STORAGE_KEY, profileResolved);
          } else setCityId("nagpur");
          setCityReady(true);
        }
      } catch {
        if (!cancelled) {
          setCityId("nagpur");
          setCityReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectCity = useCallback(async (id: CityId) => {
    setCityId(id);
    setSelectedEvent(null);
    setSelectedPerson(null);
    setShowCityPicker(false);
    setMapKey((k) => k + 1);
    await AsyncStorage.setItem(CITY_STORAGE_KEY, id);
  }, []);

  const useMyCity = useCallback(async () => {
    const resolved = resolveCityId(profileCity);
    if (resolved) await selectCity(resolved);
    else setShowCityPicker(true);
  }, [profileCity, selectCity]);

  const [people, setPeople] = useState<MapPerson[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);

  const events = useMemo(() => {
    const profileFallback = resolveCityId(profileCity);
    const built = buildCityEvents(cityId, allPlans, {
      includeDemo: false,
      fallbackCity: profileFallback,
    });
    if (!search.trim()) return built;
    const q = search.toLowerCase();
    return built.filter((e) => {
      const hay = `${e.title} ${e.location} ${e.area || ""} ${e.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [cityId, allPlans, search, profileCity]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (mode !== "people") return;
      setPeopleLoading(true);
      try {
        const list = (await api.getNearbyPeople({ maxKm: 25, limit: 40 })) || [];
        const center = getCityCenter(cityId);
        const mapped: MapPerson[] = (Array.isArray(list) ? list : []).map((p: any, i: number) => {
          const angle = (i / Math.max(list.length, 1)) * Math.PI * 2;
          const ring = 0.01 + (i % 5) * 0.004;
          return {
            id: p.id,
            cityId,
            name: p.name,
            age: p.age || 24,
            avatarUrl:
              p.avatarUrl ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
            latitude: center.latitude + Math.cos(angle) * ring,
            longitude: center.longitude + Math.sin(angle) * ring,
            isVerified: !!p.isVerified,
            isOnline: !!p.isOnline,
            vibeTag: p.jobTitle || p.city || "Nearby",
            distanceKm: typeof p.distance === "number" ? p.distance : 2 + (i % 6),
          };
        });
        if (alive) {
          let filtered = mapped;
          if (search.trim()) {
            const q = search.toLowerCase();
            filtered = mapped.filter((x) =>
              `${x.name} ${x.vibeTag || ""}`.toLowerCase().includes(q)
            );
          }
          setPeople(filtered);
        }
      } catch {
        if (alive) setPeople([]);
      } finally {
        if (alive) setPeopleLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [mode, cityId, search]);

  // keep markers below
  const markers: InteractiveMapMarker[] = useMemo(() => {
    if (mode === "people") {
      return people.map((p) => ({
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        kind: "person" as const,
        avatarUrl: p.avatarUrl,
        verified: p.isVerified,
        online: p.isOnline,
        label: p.name,
        color: p.isOnline ? "#22C55E" : "#7DD3FC",
      }));
    }
    return events.map((e) => ({
      id: e.id,
      latitude: e.latitude,
      longitude: e.longitude,
      kind: "event" as const,
      emoji: e.emoji,
      color: e.pinColor,
      label: e.title,
    }));
  }, [mode, people, events]);

  const selectedId = mode === "people" ? selectedPerson?.id : selectedEvent?.id;
  const spotsLeft = selectedEvent ? selectedEvent.totalSlots - selectedEvent.goingCount : 0;

  if (!cityReady) {
    return (
      <View style={[styles.root, styles.loadingWrap]}>
        <StatusBar style="dark" />
        <ActivityIndicator color={T.purple} size="large" />
        <Text style={styles.loadingText}>Loading live map…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <InteractiveCityMap
        key={`${cityId}-${mapKey}`}
        latitude={center.latitude}
        longitude={center.longitude}
        zoom={zoom}
        markers={markers}
        selectedId={selectedId}
        onMapPress={() => {
          setSelectedEvent(null);
          setSelectedPerson(null);
        }}
        onMarkerPress={(id, kind) => {
          if (kind === "person") {
            const p = people.find((x) => x.id === id) || null;
            setSelectedPerson(p);
            setSelectedEvent(null);
          } else {
            const e = events.find((x) => x.id === id) || null;
            setSelectedEvent(e);
            setSelectedPerson(null);
          }
        }}
        style={StyleSheet.absoluteFill}
      />

      {/* Soft premium washes */}
      <LinearGradient
        colors={["rgba(248,249,253,0.98)", "rgba(248,249,253,0.85)", "rgba(248,249,253,0.4)", "transparent"]}
        style={[styles.topWash, { height: insets.top + 180 }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(248,249,253,0.55)", "rgba(248,249,253,0.95)"]}
        style={styles.bottomWash}
        pointerEvents="none"
      />

      {/* Fixed Top Container (AppHeader + City Controls + Mode Switcher) */}
      <View style={styles.fixedTopOverlay}>
        <AppHeader variant="light" tagline="Explore live events & squad nearby" />

        <View style={styles.headerControlsRow}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={T.ink} />
          </Pressable>

          <Pressable style={styles.cityBtn} onPress={() => setShowCityPicker(true)}>
            <LinearGradient colors={[...T.cta]} style={styles.cityEmojiWrap}>
              <Text style={styles.cityEmoji}>{city.emoji}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <View style={styles.headerBrandRow}>
                <Text style={styles.headerTitle}>Live Map</Text>
                <View style={styles.premiumDot}>
                  <Text style={styles.premiumDotText}>PRO</Text>
                </View>
              </View>
              <View style={styles.headerCityRow}>
                <Ionicons name="location" size={11} color={T.purple} />
                <Text style={styles.headerCity}>
                  {city.name} · {mode === "people" ? people.length : events.length} nearby
                </Text>
                <Ionicons name="chevron-down" size={12} color={T.muted} />
              </View>
            </View>
          </Pressable>

          <Pressable style={styles.iconBtn} onPress={useMyCity}>
            <Ionicons name="navigate" size={18} color={T.purple} />
          </Pressable>
        </View>

        {/* Mode Switcher */}
        <View style={styles.modeRow}>
          <View style={styles.modeTrack}>
            <Pressable
              style={styles.modeChip}
              onPress={() => {
                setMode("events");
                setSelectedPerson(null);
              }}
            >
              {mode === "events" ? (
                <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modeChipFill}>
                  <Ionicons name="calendar" size={14} color="#fff" />
                  <Text style={styles.modeTextActive}>Events</Text>
                </LinearGradient>
              ) : (
                <View style={styles.modeChipFill}>
                  <Ionicons name="calendar-outline" size={14} color={T.muted} />
                  <Text style={styles.modeText}>Events</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={styles.modeChip}
              onPress={() => {
                setMode("people");
                setSelectedEvent(null);
              }}
            >
              {mode === "people" ? (
                <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modeChipFill}>
                  <Ionicons name="people" size={14} color="#fff" />
                  <Text style={styles.modeTextActive}>People</Text>
                </LinearGradient>
              ) : (
                <View style={styles.modeChipFill}>
                  <Ionicons name="people-outline" size={14} color={T.muted} />
                  <Text style={styles.modeText}>People</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Floating legend when nothing selected */}
      {!selectedEvent && !selectedPerson ? (
        <View style={[styles.floatLegend, { bottom: Math.max(insets.bottom, 12) + 145 }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: T.purple }]} />
            <Text style={styles.legendLabel}>Events</Text>
          </View>
          <View style={styles.legendDivider} />
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#22C55E" }]} />
            <Text style={styles.legendLabel}>Online</Text>
          </View>
        </View>
      ) : null}

      {/* Event sheet — premium */}
      {selectedEvent ? (
        <Animated.View
          entering={FadeInDown.springify().damping(16)}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 75 }]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHero}>
              <Image source={{ uri: selectedEvent.imageUrl }} style={styles.sheetImage} />
              <LinearGradient
                colors={["rgba(15,11,26,0.1)", "rgba(15,11,26,0.75)"]}
                style={styles.sheetImageFade}
              />
              <View style={[styles.categoryBadge, { backgroundColor: selectedEvent.pinColor }]}>
                <Text style={styles.categoryBadgeText}>
                  {selectedEvent.emoji} {selectedEvent.category}
                </Text>
              </View>
              {selectedEvent.isLivePlan ? (
                <View style={styles.liveBadge}>
                  <View style={styles.livePulse} />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              ) : null}
              <Text style={styles.sheetHeroTitle} numberOfLines={2}>
                {selectedEvent.title}
              </Text>
            </View>
            <View style={styles.sheetBody}>
              <View style={styles.metaRow}>
                <Ionicons name="location" size={13} color={T.purple} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {selectedEvent.location}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color={T.muted} />
                <Text style={styles.metaText}>{selectedEvent.timeLabel}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.distanceText}>{selectedEvent.distanceKm} km</Text>
                {selectedEvent.area ? (
                  <>
                    <Text style={styles.dot}>·</Text>
                    <Text style={styles.areaChip}>{selectedEvent.area}</Text>
                  </>
                ) : null}
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Ionicons name="people" size={12} color={T.purpleDeep} />
                  <Text style={styles.statText}>
                    {selectedEvent.goingCount}/{selectedEvent.totalSlots} going
                  </Text>
                </View>
                <View style={[styles.statPill, styles.spotsPill]}>
                  <Text style={styles.spotsText}>{Math.max(0, spotsLeft)} spots left</Text>
                </View>
                <Text style={styles.hostText}>by {selectedEvent.creatorName}</Text>
              </View>
              <Text style={styles.sheetDesc} numberOfLines={2}>
                {selectedEvent.description}
              </Text>
              <View style={styles.actionsRow}>
                <Pressable style={styles.secondaryBtn} onPress={() => setSelectedEvent(null)}>
                  <Text style={styles.secondaryBtnText}>Close</Text>
                </Pressable>
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (selectedEvent.planId) {
                      router.push({ pathname: "/plan-details", params: { id: selectedEvent.planId } });
                    } else router.push("/explore-events");
                  }}
                >
                  <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                    <Ionicons name="enter-outline" size={16} color="#fff" />
                    <Text style={styles.primaryBtnText}>
                      {selectedEvent.planId ? "Open Plan" : "Join Hangout"}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      ) : null}

      {/* Person sheet */}
      {selectedPerson ? (
        <Animated.View
          entering={FadeInDown.springify().damping(16)}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 75 }]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.personCard}>
            <View style={styles.personAvatarWrap}>
              <Image source={{ uri: selectedPerson.avatarUrl }} style={styles.personAvatar} />
              {selectedPerson.isOnline ? <View style={styles.personOnlineDot} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.personNameRow}>
                <Text style={styles.personName}>
                  {selectedPerson.name}, {selectedPerson.age}
                </Text>
                {selectedPerson.isVerified ? (
                  <Ionicons name="checkmark-circle" size={18} color={T.purple} />
                ) : null}
              </View>
              <Text style={styles.metaText}>
                {selectedPerson.distanceKm} km away · {selectedPerson.vibeTag || city.name}
              </Text>
              {selectedPerson.isOnline ? (
                <Text style={styles.onlineLabel}>● Online now</Text>
              ) : null}
              <View style={styles.actionsRow}>
                <Pressable style={styles.secondaryBtn} onPress={() => setSelectedPerson(null)}>
                  <Text style={styles.secondaryBtnText}>Close</Text>
                </Pressable>
                <Pressable style={{ flex: 1 }} onPress={() => router.push("/(tabs)/discover")}>
                  <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                    <Ionicons name="heart" size={14} color="#fff" />
                    <Text style={styles.primaryBtnText}>Discover</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      ) : null}

      {!selectedEvent && !selectedPerson ? (
        <Animated.View
          entering={ZoomIn.duration(280)}
          style={[styles.bottomBar, { bottom: Math.max(insets.bottom, 14) + 68 }]}
        >
          <Pressable
            style={styles.createFab}
            onPress={() => (mode === "people" ? router.push("/(tabs)/discover") : router.push("/create-plan"))}
          >
            <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createFabGrad}>
              <Ionicons name={mode === "people" ? "compass" : "add"} size={18} color="#fff" />
              <Text style={styles.createFabText}>
                {mode === "people" ? "Open Discover" : `Create in ${city.name}`}
              </Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.listBtn} onPress={() => setMapKey((k) => k + 1)}>
            <Ionicons name="locate" size={18} color={T.purpleDeep} />
          </Pressable>
          <Pressable style={styles.listBtn} onPress={() => router.push("/explore-events")}>
            <Ionicons name="list" size={18} color={T.purpleDeep} />
          </Pressable>
        </Animated.View>
      ) : null}

      {/* City picker */}
      <Modal visible={showCityPicker} transparent animationType="slide" onRequestClose={() => setShowCityPicker(false)}>
        <View style={styles.pickerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCityPicker(false)} />
          <View style={[styles.pickerSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <LinearGradient colors={["#7C3AED", "#6D28D9"]} style={styles.pickerHero}>
              <View style={styles.pickerHandle} />
              <Text style={styles.pickerKicker}>VIBELY MAP</Text>
              <Text style={styles.pickerTitle}>Choose your city</Text>
              <Text style={styles.pickerSubLight}>
                {profileCity ? `Profile city: ${profileCity}` : "Switch cities · map follows you"}
              </Text>
            </LinearGradient>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400, marginTop: 12 }}>
              {CITIES.map((c) => {
                const eCount = buildCityEvents(c.id, allPlans, {
                  includeDemo: false,
                  fallbackCity: resolveCityId(profileCity),
                }).length;
                const pCount = "nearby";
                const active = c.id === cityId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => selectCity(c.id)}
                    style={[styles.cityRow, active && styles.cityRowActive]}
                  >
                    <LinearGradient
                      colors={active ? [...T.cta] : ["#F3E8FF", "#EDE7FF"]}
                      style={styles.cityRowEmojiWrap}
                    >
                      <Text style={styles.cityRowEmoji}>{c.emoji}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cityRowName}>
                        {c.name}
                        <Text style={styles.cityRowState}> · {c.state}</Text>
                      </Text>
                      <Text style={styles.cityRowMeta}>
                        {eCount} events · {pCount} people
                      </Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={22} color={T.purple} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={T.faint} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Absolute Fixed Bottom Navigation Bar */}
      <View style={styles.fixedBottomNav}>
        <TabBar dark={false} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  fixedBottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  loadingWrap: { alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: VibeFonts.semiBold, color: T.muted, fontSize: 13 },
  topWash: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 2 },
  bottomWash: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    zIndex: 2,
  },

  fixedTopOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
  },
  headerControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
    marginTop: 2,
    marginBottom: 6,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#64748B",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cityBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 8,
    paddingVertical: 7,
    shadowColor: "#64748B",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cityEmojiWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cityEmoji: { fontSize: 18 },
  headerBrandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.2,
  },
  premiumDot: {
    backgroundColor: T.purple,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumDotText: {
    fontSize: 8,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    letterSpacing: 0.7,
  },
  headerCityRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerCity: { fontSize: 11, fontFamily: VibeFonts.semiBold, color: T.muted },

  modeRow: {
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  modeTrack: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    padding: 4,
    gap: 4,
    shadowColor: "#64748B",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modeChip: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  modeChipFill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
  },
  modeText: { fontSize: 13, fontFamily: VibeFonts.bold, color: T.muted },
  modeTextActive: { fontSize: 13, fontFamily: VibeFonts.bold, color: "#fff" },

  searchBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 14,
    marginHorizontal: 14,
    height: 44,
    shadowColor: "#64748B",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontFamily: VibeFonts.medium,
    fontSize: 13,
    color: T.ink,
    paddingVertical: 0,
  },
  searchHint: {
    minWidth: 28,
    height: 24,
    borderRadius: 8,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  searchHintText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.purpleDeep,
  },

  hintPillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 7,
    marginHorizontal: 24,
    marginTop: 6,
    borderRadius: 999,
    shadowColor: "#64748B",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  hintText: { fontSize: 11, fontFamily: VibeFonts.semiBold, color: T.muted },

  floatLegend: {
    position: "absolute",
    left: 14,
    zIndex: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#64748B",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: T.ink,
  },
  legendDivider: { width: 1, height: 12, backgroundColor: T.border },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    zIndex: 30,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.border,
    marginBottom: 10,
  },
  sheetCard: {
    backgroundColor: T.card,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#18181B",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  sheetHero: {
    position: "relative",
    height: 128,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  sheetImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: 128 },
  sheetImageFade: { ...StyleSheet.absoluteFillObject },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  categoryBadgeText: { color: "#fff", fontSize: 11, fontFamily: VibeFonts.bold },
  liveBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.green,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#BBF7D0",
  },
  liveBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.6,
  },
  sheetHeroTitle: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    letterSpacing: -0.3,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  sheetBody: { padding: 16 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  metaText: { fontSize: 12, fontFamily: VibeFonts.medium, color: T.muted, flexShrink: 1 },
  dot: { color: T.faint, fontFamily: VibeFonts.medium },
  distanceText: { fontSize: 12, fontFamily: VibeFonts.semiBold, color: T.purple },
  areaChip: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.pink,
    backgroundColor: "#FCE7F3",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.softPurple,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  spotsPill: { backgroundColor: "#FCE7F3" },
  statText: { fontSize: 11, fontFamily: VibeFonts.bold, color: T.purpleDeep },
  spotsText: { fontSize: 11, fontFamily: VibeFonts.bold, color: T.pink },
  hostText: { fontSize: 11, fontFamily: VibeFonts.medium, color: T.faint },
  sheetDesc: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    lineHeight: 19,
    marginTop: 10,
  },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: T.softPurple,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  secondaryBtnText: { fontSize: 13, fontFamily: VibeFonts.bold, color: T.purpleDeep },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
  },
  primaryBtnText: { color: "#fff", fontSize: 13, fontFamily: VibeFonts.bold },

  personCard: {
    backgroundColor: T.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    flexDirection: "row",
    gap: 14,
    shadowColor: "#18181B",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  personAvatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 3,
    backgroundColor: T.softPurple,
    position: "relative",
  },
  personAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#fff",
  },
  personOnlineDot: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: T.green,
    borderWidth: 2,
    borderColor: T.card,
  },
  personNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  personName: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.2,
  },
  onlineLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.green,
    marginTop: 4,
  },

  bottomBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    zIndex: 20,
  },
  createFab: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: T.purple,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  createFabGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  createFabText: { color: "#fff", fontSize: 14, fontFamily: VibeFonts.bold },
  listBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#64748B",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(24,24,27,0.5)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: T.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 18,
    paddingTop: 10,
    overflow: "hidden",
  },
  pickerHero: {
    marginHorizontal: -18,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    marginBottom: 4,
  },
  pickerHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
    marginBottom: 14,
  },
  pickerKicker: {
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  pickerTitle: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    letterSpacing: -0.4,
  },
  pickerSubLight: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  cityRowActive: {
    borderColor: "#C4B5FD",
    backgroundColor: T.softPurple,
  },
  cityRowEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cityRowEmoji: { fontSize: 24 },
  cityRowName: { fontSize: 15, fontFamily: VibeFonts.bold, color: T.ink },
  cityRowState: { fontFamily: VibeFonts.medium, color: T.muted, fontSize: 13 },
  cityRowMeta: { fontSize: 11, fontFamily: VibeFonts.medium, color: T.faint, marginTop: 2 },
});

