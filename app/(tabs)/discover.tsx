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

/** Light clean minimal aesthetic matching Hangout screen */
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
  cta: ["#7C3AED", "#8B5CF6"] as const,
  promo: ["#7C3AED", "#8B5CF6", "#EC4899"] as const,
};

const MODES = [
  { id: "friends" as const, label: "Friends 🤝", icon: "people" as const, color: T.green },
  { id: "dating" as const, label: "Dating 💘", icon: "heart" as const, color: T.pink },
  { id: "everyone" as const, label: "Everyone ✨", icon: "sparkles" as const, color: T.purple },
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
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      <AppHeader
        variant="light"
        badgeCount={likesCount}
        tagline="Swipe · Match · Hangout"
      />

      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* 3-Tab Segmented Mode Switcher matching Hangout screen */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.modeSwitcherTrack}>
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => selectMode(m.id)}
                style={[
                  styles.modeSwitcherBtn,
                  active && styles.modeSwitcherBtnActive,
                ]}
              >
                <Ionicons
                  name={m.icon}
                  size={15}
                  color={active ? m.color : T.muted}
                />
                <Text
                  style={[
                    styles.modeSwitcherText,
                    active && { color: m.color, fontFamily: VibeFonts.extraBold },
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.refreshBtn} onPress={() => refresh(mode)}>
            <Ionicons name="refresh" size={16} color={T.purple} />
          </Pressable>
        </Animated.View>

        {/* Deck area */}
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
              <Text style={styles.emptyEmoji}>🌙</Text>
              <Text style={styles.emptyTitle}>No more profiles nearby</Text>
              <Text style={styles.emptySub}>
                {matches.length > 0
                  ? `${matches.length} match${matches.length > 1 ? "es" : ""} — open Chats to start talking`
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
            colors={[...T.promo]}
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
                  ? `${likesCount} people liked you!`
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
  body: { flex: 1, paddingHorizontal: 16 },
  modeSwitcherTrack: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 4,
  },
  modeSwitcherBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
  },
  modeSwitcherBtnActive: {
    backgroundColor: "#F3E8FF",
  },
  modeSwitcherText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardArea: { flex: 1, minHeight: 0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, fontFamily: VibeFonts.medium, color: "#64748B" },
  emptyCard: {
    flex: 1,
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: {
    fontSize: 19,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  emptySub: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  emptyBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  emptyBtnText: { color: "#FFF", fontFamily: VibeFonts.bold, fontSize: 14 },
  emptyBtnOutline: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: "#F3E8FF",
  },
  emptyBtnOutlineText: {
    color: "#7C3AED",
    fontFamily: VibeFonts.bold,
    fontSize: 14,
  },
  likesBanner: {
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  likesBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
  },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  stackAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  bannerCenter: { flex: 1, marginLeft: 10 },
  bannerTitle: { fontSize: 13, fontFamily: VibeFonts.bold, color: "#FFF" },
  bannerSubtitle: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  bannerChevron: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
});

