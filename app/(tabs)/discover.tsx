import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import SwipeCard from "../../components/SwipeCard";
import MatchModal from "../../components/matches/MatchModal";
import AppHeader from "../../components/vibe/AppHeader";
import { useMatches } from "../../context/MatchesContext";
import { MatchProfile } from "../../constants/matches";
import { VibeFonts } from "../../constants/vibeTheme";

/** Same light palette as Hangout / Profile */
const T = {
  bg: "#EEE9F8",
  card: "#FFFBFE",
  ink: "#1A1F36",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E4DFF0",
  purple: "#8B5CF6",
  purpleDeep: "#7C3AED",
  pink: "#EC4899",
  softPurple: "#EDE7FF",
  green: "#22C55E",
  cta: ["#8B5CF6", "#EC4899"] as const,
};

const MODES = [
  { id: "friends" as const, label: "Friends", icon: "people" as const, color: T.green },
  { id: "dating" as const, label: "Dating", icon: "heart" as const, color: T.pink },
  { id: "everyone" as const, label: "Everyone", icon: "people-circle" as const, color: T.purple },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deck, matches, likesCount, loading, swipe, refresh } = useMatches();
  const [matchModal, setMatchModal] = useState<MatchProfile | null>(null);
  const [mode, setMode] = useState<"friends" | "dating" | "everyone">("dating");

  const profile = deck[0];

  const selectMode = async (next: "friends" | "dating" | "everyone") => {
    setMode(next);
    await refresh(next);
  };

  const handleAction = async (action: "LIKE" | "PASS" | "SUPER_LIKE") => {
    if (!profile) return;
    const result = await swipe(profile.id, action);
    if (result.isMatch && result.profile) {
      setMatchModal(result.profile);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      <LinearGradient
        colors={["rgba(167,139,250,0.22)", "transparent"]}
        style={styles.glowTop}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <LinearGradient
        colors={["rgba(244,114,182,0.14)", "transparent"]}
        style={styles.glowBottom}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
      />
      <View style={styles.coolOrb} />

      <AppHeader variant="light" badgeCount={likesCount} tagline="Swipe. Match. Meet." />

      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {/* Mode tabs */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.tabsRow}>
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => selectMode(m.id)}
                style={styles.tabSlot}
              >
                {active ? (
                  <LinearGradient
                    colors={
                      m.id === "friends"
                        ? ["#22C55E", "#16A34A"]
                        : m.id === "dating"
                          ? [...T.cta]
                          : ["#8B5CF6", "#6366F1"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tabActive}
                  >
                    <Ionicons name={m.icon} size={14} color="#fff" />
                    <Text style={styles.tabActiveText}>{m.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tabIdle}>
                    <Ionicons name={m.icon} size={14} color={m.color} />
                    <Text style={[styles.tabIdleText, { color: m.color }]}>{m.label}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
          <Pressable style={styles.refreshBtn} onPress={() => refresh(mode)}>
            <Ionicons name="refresh" size={16} color={T.purple} />
          </Pressable>
        </Animated.View>

        {/* Deck */}
        <View style={styles.cardArea}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={T.purple} size="large" />
              <Text style={styles.loadingText}>Finding people nearby...</Text>
            </View>
          ) : profile ? (
            <SwipeCard
              dark={false}
              name={profile.name}
              age={profile.age || 24}
              bio={profile.bio}
              jobTitle={profile.jobTitle}
              company={profile.company}
              education={profile.education}
              city={profile.city}
              distance={profile.distance}
              avatarUrl={profile.avatarUrl}
              isVerified={profile.isVerified}
              isOnline={profile.isOnline}
              vibeMatch={profile.vibeMatch}
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
              <LinearGradient
                colors={["#F8F4FF", "#FFFFFF", "#FFF5FA"]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.emptyEmoji}>🌙</Text>
              <Text style={styles.emptyTitle}>No more profiles nearby</Text>
              <Text style={styles.emptySub}>
                {matches.length > 0
                  ? `${matches.length} match${matches.length > 1 ? "es" : ""} — open Chats`
                  : "Try another mode or check back later"}
              </Text>
              {matches.length > 0 ? (
                <Pressable onPress={() => router.push("/(tabs)/chats")}>
                  <LinearGradient colors={[...T.cta]} style={styles.emptyBtn}>
                    <Text style={styles.emptyBtnText}>View Matches</Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <Pressable onPress={() => refresh(mode)}>
                  <View style={styles.emptyBtnOutline}>
                    <Ionicons name="refresh" size={16} color={T.purple} />
                    <Text style={styles.emptyBtnOutlineText}>Refresh deck</Text>
                  </View>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Likes banner */}
        <Pressable
          style={styles.likesBanner}
          onPress={() => router.push("/my-matches")}
        >
          <LinearGradient
            colors={[...T.cta]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.likesBannerInner}
          >
            <View style={styles.avatarStack}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
                }}
                style={styles.stackAvatar}
              />
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80",
                }}
                style={[styles.stackAvatar, { marginLeft: -10 }]}
              />
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80",
                }}
                style={[styles.stackAvatar, { marginLeft: -10 }]}
              />
            </View>
            <View style={styles.bannerCenter}>
              <Text style={styles.bannerTitle}>
                {likesCount > 0
                  ? `${likesCount} people liked you`
                  : "See who liked you"}
              </Text>
              <Text style={styles.bannerSubtitle}>Open matches & start chatting</Text>
            </View>
            <View style={styles.bannerChevron}>
              <Ionicons name="chevron-forward" size={16} color={T.purpleDeep} />
            </View>
          </LinearGradient>
        </Pressable>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  glowTop: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  glowBottom: {
    position: "absolute",
    bottom: 80,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  coolOrb: {
    position: "absolute",
    top: "40%",
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(125, 211, 252, 0.1)",
  },
  body: { flex: 1, paddingHorizontal: 16 },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  tabSlot: { flex: 1 },
  tabActive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tabActiveText: { color: "#fff", fontSize: 12, fontFamily: VibeFonts.bold },
  tabIdle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  tabIdleText: { fontSize: 12, fontFamily: VibeFonts.bold },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A1F36",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardArea: { flex: 1, minHeight: 0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, fontFamily: VibeFonts.medium, color: T.muted },
  emptyCard: {
    flex: 1,
    marginTop: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    overflow: "hidden",
    backgroundColor: T.card,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  emptyBtn: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyBtnText: { color: "#fff", fontFamily: VibeFonts.bold, fontSize: 14 },
  emptyBtnOutline: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: T.softPurple,
  },
  emptyBtnOutlineText: {
    color: T.purpleDeep,
    fontFamily: VibeFonts.bold,
    fontSize: 14,
  },
  likesBanner: {
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  likesBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
  },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  stackAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  bannerCenter: { flex: 1, marginLeft: 10 },
  bannerTitle: { fontSize: 13, fontFamily: VibeFonts.bold, color: "#fff" },
  bannerSubtitle: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.88)",
    marginTop: 2,
  },
  bannerChevron: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
