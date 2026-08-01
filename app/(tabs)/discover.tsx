import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SwipeCard from "../../components/SwipeCard";
import MatchModal from "../../components/matches/MatchModal";
import AppHeader from "../../components/vibe/AppHeader";
import HangoutCinematicBackground from "../../components/vibe/HangoutCinematicBackground";
import DiscoverVibesGate, {
  VibeGateCard,
} from "../../components/vibe/DiscoverVibesGate";
import { useMatches } from "../../context/MatchesContext";
import { api } from "../../services/api";
import { MatchProfile } from "../../constants/matches";
import { VibeFonts } from "../../constants/vibeTheme";

const T = {
  bg: "#070A14",
  card: "rgba(22, 26, 46, 0.94)",
  ink: "#F4F6FB",
  muted: "#A7B0C4",
  faint: "#7C869C",
  border: "rgba(160, 170, 200, 0.16)",
  purple: "#A78BFA",
  purpleDeep: "#8B5CF6",
  softPurple: "rgba(139, 92, 246, 0.18)",
  pink: "#F472B6",
  green: "#34D399",
  cta: ["#7C3AED", "#A78BFA"] as const,
  promo: ["#6D28D9", "#8B5CF6", "#EC4899"] as const,
};

const MODES = [
  { id: "friends" as const, label: "Friends 🤝", icon: "people" as const, color: T.green },
  { id: "dating" as const, label: "Dating 💘", icon: "heart" as const, color: T.pink },
  { id: "everyone" as const, label: "Everyone ✨", icon: "sparkles" as const, color: T.purple },
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
  const [matchModal, setMatchModal] = useState<MatchProfile | null>(null);
  const [showProfiles, setShowProfiles] = useState(false);
  const [activeVibe, setActiveVibe] = useState<VibeGateCard | null>(null);
  const [mode, setMode] = useState<"friends" | "dating" | "everyone">("dating");
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
        const profile = me?.profile || me;
        if (profile?.maxDistance != null) setMaxDistance(String(profile.maxDistance));
        if (profile?.minAge != null) setMinAge(String(profile.minAge));
        if (profile?.maxAge != null) setMaxAge(String(profile.maxAge));
        if (profile?.genderPreference)
          setGenderPreference(String(profile.genderPreference).toUpperCase());
      } catch {
        /* ignore */
      }
    })();
  }, []);

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
      {showProfiles ? <HangoutCinematicBackground /> : null}
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />

      <View style={styles.foreground}>
      {!showProfiles ? (
        <DiscoverVibesGate badgeCount={likesCount} onSeeProfiles={handleSeeProfiles} />
      ) : (
      <>
      <AppHeader
        variant="dark"
        badgeCount={likesCount}
        tagline={
          activeVibe ? `${activeVibe.title} · Swipe to match` : "Swipe · Match · Hangout"
        }
      />

      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Animated.View entering={FadeInDown.duration(350)} style={styles.profilesTopRow}>
          <Pressable style={styles.backVibesBtn} onPress={handleBackToVibes}>
            <Ionicons name="chevron-back" size={16} color={T.purple} />
            <Text style={styles.backVibesText}>Vibes</Text>
          </Pressable>
          <View style={styles.modeSwitcherTrack}>
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => selectMode(m.id)}
                style={[styles.modeSwitcherBtn, active && styles.modeSwitcherBtnActive]}
              >
                <Ionicons name={m.icon} size={14} color={active ? m.color : T.muted} />
                <Text
                  style={[
                    styles.modeSwitcherText,
                    active && { color: m.color, fontFamily: VibeFonts.extraBold },
                  ]}
                >
                  {m.label.split(" ")[0]}
                </Text>
              </Pressable>
            );
          })}
          </View>
          <Pressable style={styles.toolBtn} onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={16} color={T.purple} />
          </Pressable>
          <Pressable
            style={[styles.toolBtn, !canRewind && { opacity: 0.4 }]}
            onPress={handleRewind}
          >
            <Ionicons name="arrow-undo" size={16} color={T.purple} />
          </Pressable>
          <Pressable style={styles.toolBtn} onPress={() => refresh(mode)}>
            <Ionicons name="refresh" size={16} color={T.purple} />
          </Pressable>
        </Animated.View>

        <View style={styles.cardArea}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={T.purple} size="large" />
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
                  <LinearGradient colors={[...T.cta]} style={styles.emptyBtn}>
                    <Text style={styles.emptyBtnText}>Retry with location</Text>
                  </LinearGradient>
                </Pressable>
              ) : matches.length > 0 ? (
                <Pressable onPress={() => router.push("/(tabs)/chats")}>
                  <LinearGradient colors={[...T.cta]} style={styles.emptyBtn}>
                    <Text style={styles.emptyBtnText}>View Matches</Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable onPress={() => setShowFilters(true)}>
                    <View style={styles.emptyBtnOutline}>
                      <Ionicons name="options-outline" size={16} color={T.purple} />
                      <Text style={styles.emptyBtnOutlineText}>Filters</Text>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => refresh(mode)}>
                    <View style={styles.emptyBtnOutline}>
                      <Ionicons name="refresh" size={16} color={T.purple} />
                      <Text style={styles.emptyBtnOutlineText}>Refresh</Text>
                    </View>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>

        <Pressable style={styles.likesBanner} onPress={() => router.push("/my-matches")}>
          <LinearGradient
            colors={[...T.promo]}
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
                  <Ionicons name="heart" size={14} color={T.purple} />
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
              <Ionicons name="chevron-forward" size={16} color={T.purpleDeep} />
            </View>
          </LinearGradient>
        </Pressable>
      </View>
      </>
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
              <LinearGradient colors={[...T.cta]} style={styles.filterSave}>
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
  root: { flex: 1, backgroundColor: T.bg },
  foreground: { flex: 1, zIndex: 1, backgroundColor: "transparent" },
  body: { flex: 1, paddingHorizontal: 16 },
  modeSwitcherTrack: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 22, 38, 0.9)",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: T.border,
    gap: 2,
  },
  profilesTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  backVibesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: T.softPurple,
  },
  backVibesText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.purple,
  },
  modeSwitcherBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 9,
    borderRadius: 12,
  },
  modeSwitcherBtnActive: { backgroundColor: T.softPurple },
  modeSwitcherText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.muted,
  },
  toolBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  cardArea: { flex: 1, minHeight: 0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, fontFamily: VibeFonts.medium, color: T.muted },
  emptyCard: {
    flex: 1,
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: T.card,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    textAlign: "center",
  },
  emptySub: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: VibeFonts.regular,
    color: T.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: { color: "#fff", fontFamily: VibeFonts.bold, fontSize: 14 },
  emptyBtnOutline: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.softPurple,
  },
  emptyBtnOutlineText: { color: T.purple, fontFamily: VibeFonts.bold, fontSize: 13 },
  likesBanner: { marginTop: 10, marginBottom: 4 },
  likesBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  stackAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  stackPlaceholder: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerCenter: { flex: 1 },
  bannerTitle: { color: "#fff", fontFamily: VibeFonts.extraBold, fontSize: 14 },
  bannerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: VibeFonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  bannerChevron: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: "rgba(4,6,14,0.6)",
    justifyContent: "flex-end",
  },
  filterSheet: {
    backgroundColor: T.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: "78%",
    borderWidth: 1,
    borderColor: T.border,
    borderBottomWidth: 0,
  },
  filterHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.border,
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  filterSub: {
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    color: T.muted,
    marginTop: 4,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.muted,
    marginBottom: 6,
    marginTop: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: VibeFonts.semiBold,
    color: T.ink,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  filterRow: { flexDirection: "row", gap: 12 },
  genderRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  genderChip: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  genderChipActive: {
    backgroundColor: T.softPurple,
    borderColor: T.purpleDeep,
  },
  genderChipText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.muted,
  },
  genderChipTextActive: { color: T.purple },
  filterSave: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  filterSaveText: { color: "#fff", fontFamily: VibeFonts.extraBold, fontSize: 15 },
});
