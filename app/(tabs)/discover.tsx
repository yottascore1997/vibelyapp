import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SwipeCard from "../../components/SwipeCard";
import MatchModal from "../../components/matches/MatchModal";
import HomeHeader from "../../components/HomeHeader";
import DiscoverVibesGate, {
  VibeGateCard,
  VIBE_GATE_CARDS,
} from "../../components/vibe/DiscoverVibesGate";
import { useMatches } from "../../context/MatchesContext";
import { api } from "../../services/api";
import { MatchProfile } from "../../constants/matches";
import { VibeFonts } from "../../constants/vibeTheme";

const T = {
  bg: "#070A14",
  card: "#0D1424",
  ink: "#FFFFFF",
  muted: "#94A3B8",
  faint: "#64748B",
  border: "rgba(255, 255, 255, 0.08)",
  purple: "#22D3EE",
  purpleDeep: "#06B6D4",
  softPurple: "rgba(34, 211, 238, 0.12)",
  pink: "#D4F72C",
  green: "#22C55E",
  cta: ["#D4F72C", "#22D3EE"] as const,
  promo: ["#06B6D4", "#0284C7"] as const,
};

const MODES = [
  { id: "friends" as const, label: "Friends 🤝", icon: "people" as const, color: "#22C55E" },
  { id: "dating" as const, label: "Dating 💘", icon: "heart" as const, color: "#F43F5E" },
  { id: "everyone" as const, label: "Everyone ✨", icon: "sparkles" as const, color: "#22D3EE" },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    deck,
    matches,
    likesCount,
    likesList,
    loading,
    hasGps,
    canRewind,
    swipe,
    rewind,
    refresh,
    updateDiscoverPrefs,
  } = useMatches();

  const sportCard =
    VIBE_GATE_CARDS.find((c) => c.id === "sport") || VIBE_GATE_CARDS[0];

  const [matchModal, setMatchModal] = useState<MatchProfile | null>(null);
  // Default to showing profiles for Sport Zone
  const [showProfiles, setShowProfiles] = useState(true);
  const [activeVibe, setActiveVibe] = useState<VibeGateCard | null>(sportCard);
  const [mode, setMode] = useState<"friends" | "dating" | "everyone">("friends");

  const [showFilters, setShowFilters] = useState(false);
  const [savingFilters, setSavingFilters] = useState(false);
  const [maxDistance, setMaxDistance] = useState("25");
  const [minAge, setMinAge] = useState("18");
  const [maxAge, setMaxAge] = useState("35");
  const [genderPreference, setGenderPreference] = useState("EVERYONE");

  const profile = deck[0];
  const likeAvatars = (likesList || [])
    .map((l: any) => l.avatarUrl)
    .filter(Boolean)
    .slice(0, 3);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        const me: any = await api.getProfile(token);
        const userProfile = me?.profile || me;
        if (userProfile?.maxDistance != null) setMaxDistance(String(userProfile.maxDistance));
        if (userProfile?.minAge != null) setMinAge(String(userProfile.minAge));
        if (userProfile?.maxAge != null) setMaxAge(String(userProfile.maxAge));
        if (userProfile?.genderPreference)
          setGenderPreference(String(userProfile.genderPreference).toUpperCase());
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    refresh("friends").catch(() => undefined);
  }, [refresh]);

  const selectMode = async (next: "friends" | "dating" | "everyone") => {
    setMode(next);
    await refresh(next);
  };

  const handleSeeProfiles = async (card: VibeGateCard) => {
    setActiveVibe(card);
    setShowProfiles(true);
    setMode(card.mode);
    await refresh(card.mode);
  };

  const handleBackToVibes = () => {
    setShowProfiles(false);
  };

  const handleAction = async (action: "LIKE" | "PASS" | "SUPER_LIKE") => {
    if (!profile) return;
    const result = await swipe(profile.id, action);
    if (result.isMatch && result.profile) {
      setMatchModal(result.profile as MatchProfile);
    }
  };

  const handleRewind = async () => {
    if (!canRewind) {
      Alert.alert("Nothing to undo", "Swipe someone first, then rewind.");
      return;
    }
    await rewind();
  };

  const saveFilters = async () => {
    const dist = Math.min(100, Math.max(1, Number(maxDistance) || 25));
    const minA = Math.min(99, Math.max(18, Number(minAge) || 18));
    const maxA = Math.min(99, Math.max(minA, Number(maxAge) || 35));
    setSavingFilters(true);
    const ok = await updateDiscoverPrefs({
      maxDistance: dist,
      minAge: minA,
      maxAge: maxA,
      genderPreference,
    });
    setSavingFilters(false);
    if (ok) {
      setMaxDistance(String(dist));
      setMinAge(String(minA));
      setMaxAge(String(maxA));
      setShowFilters(false);
      await refresh(mode);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.foreground}>
        {/* Home Header */}
        <HomeHeader
          showBack={showProfiles}
          onBackPress={showProfiles ? handleBackToVibes : undefined}
        />

        {!showProfiles ? (
          <DiscoverVibesGate badgeCount={likesCount} onSeeProfiles={handleSeeProfiles} />
        ) : (
          <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 12) + 70 }]}>
            {/* Swipe Deck Area */}
            <View style={[styles.cardArea, { marginTop: 6 }]}>
              {loading ? (
                <View style={styles.center}>
                  <ActivityIndicator color="#22D3EE" size="large" />
                  <Text style={styles.loadingText}>Finding people nearby...</Text>
                </View>
              ) : profile ? (
                <SwipeCard
                  key={profile.id}
                  dark={true}
                  name={profile.name}
                  age={profile.age}
                  bio={profile.bio}
                  jobTitle={profile.jobTitle}
                  company={profile.company}
                  education={profile.education}
                  city={profile.city}
                  distance={profile.distance}
                  avatarUrl={profile.avatarUrl}
                  photos={profile.photos}
                  isVerified={profile.isVerified}
                  isOnline={profile.isOnline}
                  freeNow={profile.freeNow || profile.socialStatus?.freeNow}
                  lastSeenAt={profile.lastSeenAt}
                  vibeMatch={profile.vibeMatch}
                  sharedInterestCount={profile.sharedInterestCount}
                  energy={profile.energy || profile.socialStatus?.energy}
                  interests={profile.interests?.map((i) => ({
                    name: i.name,
                    color: i.color || "#8B5CF6",
                  }))}
                  onPass={() => handleAction("PASS")}
                  onLike={() => handleAction("LIKE")}
                  onSuperLike={() => handleAction("SUPER_LIKE")}
                />
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>{hasGps ? "🌙" : "📍"}</Text>
                  <Text style={styles.emptyTitle}>
                    {hasGps ? "No more profiles nearby" : "Location needed"}
                  </Text>
                  <Text style={styles.emptySub}>
                    {hasGps
                      ? matches.length > 0
                        ? `${matches.length} match${matches.length > 1 ? "es" : ""} — open Chats to start talking`
                        : "Try filters, another mode, or check back later"
                      : "Turn on GPS so we can show people near you — Discover uses real distance."}
                  </Text>
                  {!hasGps ? (
                    <Pressable onPress={() => refresh(mode)}>
                      <LinearGradient colors={["#D4F72C", "#22D3EE"]} style={styles.emptyBtn}>
                        <Text style={styles.emptyBtnText}>Retry with location</Text>
                      </LinearGradient>
                    </Pressable>
                  ) : matches.length > 0 ? (
                    <Pressable onPress={() => router.push("/(tabs)/chats")}>
                      <LinearGradient colors={["#D4F72C", "#22D3EE"]} style={styles.emptyBtn}>
                        <Text style={styles.emptyBtnText}>View Matches</Text>
                      </LinearGradient>
                    </Pressable>
                  ) : (
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <Pressable onPress={() => setShowFilters(true)}>
                        <View style={styles.emptyBtnOutline}>
                          <Ionicons name="options-outline" size={16} color="#22D3EE" />
                          <Text style={styles.emptyBtnOutlineText}>Filters</Text>
                        </View>
                      </Pressable>
                      <Pressable onPress={() => refresh(mode)}>
                        <View style={styles.emptyBtnOutline}>
                          <Ionicons name="refresh" size={16} color="#22D3EE" />
                          <Text style={styles.emptyBtnOutlineText}>Refresh</Text>
                        </View>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Likes Banner */}
            <Pressable
              style={styles.likesBanner}
              onPress={() => router.push({ pathname: "/my-matches", params: { tab: "likes" } })}
            >
              <LinearGradient
                colors={["#0D1424", "#131C33"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.likesBannerInner}
              >
                <View style={styles.avatarStack}>
                  {likeAvatars.length > 0 ? (
                    likeAvatars.map((uri: string, i: number) => (
                      <Image
                        key={`${uri}-${i}`}
                        source={{ uri }}
                        style={[styles.stackAvatar, i > 0 && { marginLeft: -10 }]}
                      />
                    ))
                  ) : (
                    <View style={[styles.stackAvatar, styles.stackPlaceholder]}>
                      <Ionicons name="heart" size={14} color="#F43F5E" />
                    </View>
                  )}
                </View>
                <View style={styles.bannerCenter}>
                  <Text style={styles.bannerTitle}>
                    {likesCount > 0
                      ? `${likesCount} people liked you!`
                      : "See who liked you"}
                  </Text>
                  <Text style={styles.bannerSubtitle}>
                    {likesCount > 0 && (likesList as any[])?.[0]?.isSuperLike
                      ? "Includes Super Likes — open to reply"
                      : "Open matches & start chatting"}
                  </Text>
                </View>
                <View style={styles.bannerChevron}>
                  <Ionicons name="chevron-forward" size={16} color="#070A14" />
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        <MatchModal
          visible={!!matchModal}
          match={matchModal}
          onChat={() => {
            if (matchModal) {
              const matchId = matchModal.id;
              setMatchModal(null);
              router.push(`/chat/${matchId}`);
            }
          }}
          onKeepSwiping={() => setMatchModal(null)}
        />

        {/* Filter Modal */}
        <Modal
          visible={showFilters}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFilters(false)}
        >
          <View style={styles.filterOverlay}>
            <Pressable style={{ flex: 1 }} onPress={() => setShowFilters(false)} />
            <View style={[styles.filterSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <View style={styles.filterHandle} />
              <Text style={styles.filterTitle}>Discover filters</Text>
              <Text style={styles.filterSub}>Saved to your profile — deck refreshes instantly</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.filterLabel}>Max distance (km)</Text>
                <TextInput
                  style={styles.filterInput}
                  keyboardType="number-pad"
                  value={maxDistance}
                  onChangeText={setMaxDistance}
                  placeholder="25"
                  placeholderTextColor={T.faint}
                />
                <View style={styles.filterRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.filterLabel}>Min age</Text>
                    <TextInput
                      style={styles.filterInput}
                      keyboardType="number-pad"
                      value={minAge}
                      onChangeText={setMinAge}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.filterLabel}>Max age</Text>
                    <TextInput
                      style={styles.filterInput}
                      keyboardType="number-pad"
                      value={maxAge}
                      onChangeText={setMaxAge}
                    />
                  </View>
                </View>

                <Text style={styles.filterLabel}>Show me</Text>
                <View style={styles.genderRow}>
                  {[
                    { id: "EVERYONE", label: "Everyone" },
                    { id: "WOMEN", label: "Women" },
                    { id: "MEN", label: "Men" },
                  ].map((g) => (
                    <Pressable
                      key={g.id}
                      onPress={() => setGenderPreference(g.id)}
                      style={[
                        styles.genderChip,
                        genderPreference === g.id && styles.genderChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          genderPreference === g.id && styles.genderChipTextActive,
                        ]}
                      >
                        {g.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Pressable onPress={saveFilters} disabled={savingFilters}>
                <LinearGradient
                  colors={["#D4F72C", "#22D3EE"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.filterSave}
                >
                  <Text style={styles.filterSaveText}>
                    {savingFilters ? "Saving…" : "Apply filters"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#070A14" },
  foreground: { flex: 1, zIndex: 1, backgroundColor: "transparent" },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#070A14",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleCenter: {
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitleMy: {
    fontSize: 21,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  headerTitleCrew: {
    fontSize: 21,
    fontFamily: VibeFonts.extraBold,
    color: "#D4F72C",
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 2,
  },
  addButtonGlow: {
    shadowColor: "#D4F72C",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  addBtnGrad: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, paddingHorizontal: 16 },
  modeSwitcherTrack: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(13, 20, 36, 0.85)",
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 2,
  },
  profilesTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    marginTop: 2,
  },
  backVibesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.3)",
  },
  backVibesText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#22D3EE",
  },
  modeSwitcherBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 7,
    borderRadius: 12,
  },
  modeSwitcherBtnActive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  modeSwitcherText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#94A3B8",
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardArea: { flex: 1, minHeight: 0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, fontFamily: VibeFonts.medium, color: "#94A3B8" },
  emptyCard: {
    flex: 1,
    marginTop: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#0D1424",
  },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    textAlign: "center",
  },
  emptySub: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: VibeFonts.regular,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: { color: "#070A14", fontFamily: VibeFonts.bold, fontSize: 14 },
  emptyBtnOutline: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.3)",
    backgroundColor: "rgba(34, 211, 238, 0.1)",
  },
  emptyBtnOutlineText: { color: "#22D3EE", fontFamily: VibeFonts.bold, fontSize: 13 },
  likesBanner: { marginTop: 8, marginBottom: 4 },
  likesBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  stackAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#0D1424",
  },
  stackPlaceholder: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderWidth: 1.5,
    borderColor: "#F43F5E",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerCenter: { flex: 1 },
  bannerTitle: { color: "#FFFFFF", fontFamily: VibeFonts.bold, fontSize: 14 },
  bannerSubtitle: {
    color: "#94A3B8",
    fontFamily: VibeFonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  bannerChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D4F72C",
    alignItems: "center",
    justifyContent: "center",
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  filterSheet: {
    backgroundColor: "#0D1424",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "78%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  filterHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 14,
  },
  filterTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  filterSub: {
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    color: "#94A3B8",
    marginTop: 4,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: "#94A3B8",
    marginBottom: 6,
    marginTop: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: VibeFonts.medium,
    color: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  filterRow: { flexDirection: "row", gap: 12 },
  genderRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  genderChip: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  genderChipActive: {
    backgroundColor: "rgba(34, 211, 238, 0.15)",
    borderColor: "#22D3EE",
  },
  genderChipText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#94A3B8",
  },
  genderChipTextActive: { color: "#22D3EE" },
  filterSave: {
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  filterSaveText: { color: "#070A14", fontFamily: VibeFonts.bold, fontSize: 15 },
});
