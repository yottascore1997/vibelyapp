import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
  Dimensions,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, FadeInDown, FadeInRight } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useMatches } from "../context/MatchesContext";
import { usePremium } from "../context/PremiumContext";
import { useNotifications } from "../context/NotificationContext";
import { MatchProfile } from "../constants/matches";
import { VibeFonts } from "../constants/vibeTheme";
import { API_URL } from "../constants/theme";
import HomeHeader from "../components/HomeHeader";
import TabBar from "../components/TabBar";

const { width: SCREEN_W } = Dimensions.get("window");

const T = {
  bg: "#070A14",
  card: "#0D1424",
  cardElevated: "#121C33",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  ink: "#FFFFFF",
  muted: "#94A3B8",
  soft: "#64748B",
  gold: "#D4F72C",
  goldSoft: "rgba(212, 247, 44, 0.12)",
  cyan: "#22D3EE",
  cyanSoft: "rgba(34, 211, 238, 0.12)",
  green: "#22C55E",
  ctaGrad: ["#D4F72C", "#22D3EE"] as const,
};

function resolveAvatar(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("/")) return `${API_URL.replace(/\/api$/, "")}${url}`;
  return url;
}

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function isJustMatched(matchedAt?: string) {
  if (!matchedAt) return true;
  const ms = Date.now() - new Date(matchedAt).getTime();
  return Number.isFinite(ms) && ms < 48 * 60 * 60 * 1000;
}

const SAMPLE_LIKES = [
  {
    id: "sample-like-1",
    name: "Ananya",
    age: 23,
    city: "South Mumbai",
    distance: "2.4 km away",
    avatarUrl:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&auto=format&fit=crop&q=80",
    profession: "Graphic Designer",
    isVerified: true,
  },
  {
    id: "sample-like-2",
    name: "Priya",
    age: 22,
    city: "Bandra West",
    distance: "3.8 km away",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    profession: "Architect",
    isVerified: true,
  },
  {
    id: "sample-like-3",
    name: "Riya",
    age: 24,
    city: "Koregaon Park",
    distance: "4.1 km away",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80",
    profession: "Content Creator",
    isVerified: true,
  },
  {
    id: "sample-like-4",
    name: "Sneha",
    age: 23,
    city: "Indiranagar",
    distance: "5.0 km away",
    avatarUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80",
    profession: "Software Engineer",
    isVerified: false,
  },
  {
    id: "sample-like-5",
    name: "Tanvi",
    age: 25,
    city: "Salt Lake",
    distance: "6.2 km away",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
    profession: "Product Manager",
    isVerified: true,
  },
  {
    id: "sample-like-6",
    name: "Meera",
    age: 22,
    city: "Jubilee Hills",
    distance: "3.1 km away",
    avatarUrl:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80",
    profession: "Stylist",
    isVerified: true,
  },
];

export default function MyMatchesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { matches, likesList, likesCount, conversations } = useMatches();
  const { openPaywall, hasFeature, isPremium } = usePremium();
  const { openInviteModal } = useNotifications();
  const canSeeLikes = isPremium || hasFeature("SEE_LIKES");

  const [activeTab, setActiveTab] = useState<"matches" | "likes">(
    params.tab === "likes" ? "likes" : "matches"
  );
  const [selectedMatch, setSelectedMatch] = useState<MatchProfile | null>(null);

  useEffect(() => {
    if (params.tab === "likes") setActiveTab("likes");
    else if (params.tab === "matches") setActiveTab("matches");
  }, [params.tab]);

  const likesTotal = Math.max(likesCount, likesList.length, 6);
  const newestMatch = matches[0] || null;

  const sortedMatches = useMemo(() => {
    const list = [...matches];
    list.sort(
      (a, b) =>
        new Date(b.matchedAt || 0).getTime() - new Date(a.matchedAt || 0).getTime()
    );
    return list;
  }, [matches]);

  const unchattedSparks = useMemo(() => {
    return sortedMatches.filter((m) => {
      const thread = conversations.find((c) => c.matchId === m.id);
      return !thread || !thread.messages || thread.messages.length === 0;
    });
  }, [sortedMatches, conversations]);

  // Combine real likes with samples so grid is always rich
  const displayedLikes = useMemo(() => {
    if (likesList && likesList.length > 0) {
      return likesList;
    }
    return SAMPLE_LIKES;
  }, [likesList]);

  const unreadFor = (matchId: string) =>
    conversations.find((c) => c.matchId === matchId)?.unread || 0;

  const openChat = (id: string) => {
    setSelectedMatch(null);
    router.push(`/chat/${id}`);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <LinearGradient
        colors={["rgba(14, 28, 54, 0.45)", "#070A14"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── 1. APP STANDARD HOME HEADER ── */}
      <HomeHeader showBack />

      {/* ── 2. EXECUTIVE SEGMENT SWITCHER ── */}
      <View style={styles.tabsContainer}>
        {/* Matches Tab */}
        <Pressable
          style={styles.tabBtn}
          onPress={() => setActiveTab("matches")}
        >
          {activeTab === "matches" ? (
            <LinearGradient
              colors={T.ctaGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabBtnActiveGrad}
            >
              <Ionicons name="heart" size={15} color="#070A14" />
              <Text style={styles.tabBtnActiveText}>Matches</Text>
              <View style={styles.tabCountBadgeActive}>
                <Text style={styles.tabCountTextActive}>{matches.length}</Text>
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.tabBtnIdle}>
              <Ionicons name="heart-outline" size={15} color={T.muted} />
              <Text style={styles.tabBtnIdleText}>Matches</Text>
              <View style={styles.tabCountBadgeIdle}>
                <Text style={styles.tabCountTextIdle}>{matches.length}</Text>
              </View>
            </View>
          )}
        </Pressable>

        {/* Likes Tab ("See who likes you") */}
        <Pressable
          style={styles.tabBtn}
          onPress={() => setActiveTab("likes")}
        >
          {activeTab === "likes" ? (
            <LinearGradient
              colors={T.ctaGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabBtnActiveGrad}
            >
              <Ionicons name="sparkles" size={15} color="#070A14" />
              <Text style={styles.tabBtnActiveText}>Likes</Text>
              <View style={styles.tabCountBadgeActive}>
                <Text style={styles.tabCountTextActive}>{likesTotal}</Text>
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.tabBtnIdle}>
              <Ionicons name="sparkles-outline" size={15} color={T.muted} />
              <Text style={styles.tabBtnIdleText}>Likes</Text>
              <View style={styles.tabCountBadgeIdle}>
                <Text style={styles.tabCountTextIdle}>{likesTotal}</Text>
              </View>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 20) + 110 },
        ]}
      >
        {activeTab === "matches" ? (
          <>
            {/* ── NEW SPARKS RAIL ── */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="flash" size={15} color={T.cyan} />
                <Text style={styles.sectionTitle}>New Sparks</Text>
              </View>
              <Pressable onPress={() => setActiveTab("likes")}>
                <Text style={styles.seeAllText}>See Likes ›</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sparksScroll}
            >
              {/* New Likes Circular Bubble */}
              <Animated.View entering={FadeInRight.duration(280)}>
                <Pressable style={styles.sparkItem} onPress={() => setActiveTab("likes")}>
                  <View style={styles.newLikesCircle}>
                    <LinearGradient
                      colors={["#D4F72C", "#22D3EE"]}
                      style={styles.newLikesRing}
                    >
                      <View style={styles.newLikesInner}>
                        <Ionicons name="heart" size={24} color="#D4F72C" />
                      </View>
                    </LinearGradient>
                    <View style={styles.newLikesTag}>
                      <Text style={styles.newLikesTagText}>NEW</Text>
                    </View>
                  </View>
                  <Text style={styles.sparkName}>Likes</Text>
                  <Text style={styles.sparkCountText}>{likesTotal} waiting</Text>
                </Pressable>
              </Animated.View>

              {/* Matched Users Avatars */}
              {unchattedSparks.slice(0, 10).map((m, i) => (
                <Animated.View
                  key={m.id}
                  entering={FadeInRight.delay(40 + i * 35).duration(280)}
                >
                  <Pressable style={styles.sparkItem} onPress={() => openChat(m.id)}>
                    <View style={styles.sparkAvatarRingWrap}>
                      <LinearGradient
                        colors={m.isOnline ? ["#22D3EE", "#22C55E"] : ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.05)"]}
                        style={styles.sparkAvatarRing}
                      >
                        {resolveAvatar(m.avatarUrl) ? (
                          <Image
                            source={{ uri: resolveAvatar(m.avatarUrl)! }}
                            style={styles.sparkAvatarImg}
                          />
                        ) : (
                          <View style={[styles.sparkAvatarImg, styles.avatarFallback]}>
                            <Text style={styles.avatarInitials}>{initials(m.name)}</Text>
                          </View>
                        )}
                      </LinearGradient>
                      {m.isOnline && <View style={styles.onlineBadgeDot} />}
                    </View>
                    <Text style={styles.sparkName} numberOfLines={1}>
                      {m.name.split(" ")[0]}
                    </Text>
                    <Text style={m.isOnline ? styles.sparkOnlineText : styles.sparkOfflineText}>
                      {m.isOnline ? "Online" : "Chat"}
                    </Text>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>


            {/* ── YOUR MATCHES LIST ── */}
            <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
              <Text style={styles.sectionTitleLg}>
                Your Matches <Text style={{ color: T.muted }}>({matches.length})</Text>
              </Text>
            </View>

            {sortedMatches.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="heart-dislike-outline" size={32} color={T.cyan} />
                </View>
                <Text style={styles.emptyCardTitle}>No matches yet</Text>
                <Text style={styles.emptyCardSub}>
                  Keep swiping on Discover or join local hangouts to find your match!
                </Text>
                <Pressable
                  style={styles.emptyCtaBtn}
                  onPress={() => router.push("/(tabs)/discover")}
                >
                  <Text style={styles.emptyCtaText}>Start Exploring ›</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.matchesList}>
                {sortedMatches.map((m, i) => {
                  const unread = unreadFor(m.id);
                  const avatar = resolveAvatar(m.avatarUrl);
                  return (
                    <Animated.View
                      key={m.id}
                      entering={FadeInDown.delay(Math.min(i, 6) * 35).duration(260)}
                    >
                      <Pressable
                        style={styles.matchCardRow}
                        onPress={() => setSelectedMatch(m)}
                      >
                        <View style={styles.matchAvatarCol}>
                          {avatar ? (
                            <Image source={{ uri: avatar }} style={styles.matchAvatarImg} />
                          ) : (
                            <View style={[styles.matchAvatarImg, styles.avatarFallback]}>
                              <Text style={styles.avatarInitials}>{initials(m.name)}</Text>
                            </View>
                          )}
                          {m.isOnline && <View style={styles.onlineBadgeDot} />}
                        </View>

                        <View style={styles.matchInfoCol}>
                          <View style={styles.matchNameRow}>
                            <Text style={styles.matchNameText} numberOfLines={1}>
                              {m.name}
                              {m.age ? `, ${m.age}` : ""}
                            </Text>
                            {m.isVerified && (
                              <Ionicons name="shield-checkmark" size={14} color={T.cyan} />
                            )}
                          </View>

                          <View style={styles.matchMetaRow}>
                            <Ionicons name="location-outline" size={12} color={T.muted} />
                            <Text style={styles.matchMetaText} numberOfLines={1}>
                              {m.city || "Nearby"} • {m.jobTitle || "Looking for vibes"}
                            </Text>
                          </View>

                          {isJustMatched(m.matchedAt) && (
                            <View style={styles.justMatchedPill}>
                              <Text style={styles.justMatchedPillText}>✨ Just matched</Text>
                            </View>
                          )}
                        </View>

                        {/* Action buttons */}
                        <View style={styles.matchActionsCol}>
                          <Pressable
                            style={styles.chaiBtn}
                            onPress={(e) => {
                              e.stopPropagation();
                              openInviteModal({
                                senderName: m.name,
                                senderAvatar: resolveAvatar(m.avatarUrl) || undefined,
                                category: "chai",
                                location: m.city
                                  ? `CHAYOS, ${m.city.toUpperCase()}`
                                  : "CHAYOS, GALLERIA",
                                time: "6 PM TODAY",
                              });
                            }}
                            hitSlop={6}
                          >
                            <LinearGradient
                              colors={["#D4F72C", "#22D3EE"]}
                              style={styles.chaiBtnGrad}
                            >
                              <Ionicons name="cafe" size={13} color="#070A14" />
                              <Text style={styles.chaiBtnText}>Chai?</Text>
                            </LinearGradient>
                          </Pressable>

                          <Pressable
                            style={styles.chatActionBtn}
                            onPress={() => openChat(m.id)}
                            hitSlop={6}
                          >
                            <Ionicons name="chatbubble" size={15} color="#FFFFFF" />
                            {unread > 0 && <View style={styles.unreadBadgeDot} />}
                          </Pressable>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          /* ── LIKES TAB ("SEE WHO LIKES YOU") ── */
          <Animated.View entering={FadeIn.duration(280)}>
            {/* VIP Spotlight Teaser Card */}
            <View style={styles.vipHeroCard}>
              <LinearGradient
                colors={["#0D1424", "#121C33"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.vipHeroGrad}
              >
                <View style={styles.vipBadgeRow}>
                  <View style={styles.vipGoldBadge}>
                    <Ionicons name="diamond" size={12} color="#070A14" />
                    <Text style={styles.vipGoldBadgeText}>VIBEGOLD VIP</Text>
                  </View>
                  <View style={styles.vipWaitingPill}>
                    <Text style={styles.vipWaitingPillText}>{likesTotal} Waiting</Text>
                  </View>
                </View>

                {/* 3 Fanned Cards Mockup */}
                <View style={styles.fanCardsStack}>
                  {[
                    { id: "1", uri: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400", deg: "-12deg", z: 1 },
                    { id: "2", uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400", deg: "0deg", z: 3 },
                    { id: "3", uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", deg: "12deg", z: 2 },
                  ].map((card, i) => (
                    <View
                      key={card.id}
                      style={[
                        styles.fanCard,
                        {
                          left: SCREEN_W / 2 - 45 + (i - 1) * 38,
                          zIndex: card.z,
                          transform: [{ rotate: card.deg }],
                          borderColor: i === 1 ? T.gold : T.cyan,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: card.uri }}
                        style={StyleSheet.absoluteFillObject}
                        blurRadius={30}
                      />
                      <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
                      <View style={styles.cardLockCenter}>
                        <Ionicons name="heart" size={22} color={i === 1 ? T.gold : T.cyan} />
                      </View>
                    </View>
                  ))}
                </View>

                <Text style={styles.vipHeroTitle}>
                  {likesTotal} People Secretly Like You
                </Text>
                <Text style={styles.vipHeroSub}>
                  Reveal blurred profiles, skip swiping decks, and match instantly.
                </Text>

                {/* VIP Perks */}
                <View style={styles.vipPerksRow}>
                  <View style={styles.vipPerkPill}>
                    <Ionicons name="eye" size={13} color={T.cyan} />
                    <Text style={styles.vipPerkText}>Unblur All</Text>
                  </View>
                  <View style={styles.vipPerkPill}>
                    <Ionicons name="flash" size={13} color={T.gold} />
                    <Text style={styles.vipPerkText}>Instant Match</Text>
                  </View>
                  <View style={styles.vipPerkPill}>
                    <Ionicons name="chatbubbles" size={13} color="#22C55E" />
                    <Text style={styles.vipPerkText}>Direct Chat</Text>
                  </View>
                </View>

                <Pressable onPress={openPaywall} style={styles.vipUnlockBtn}>
                  <LinearGradient
                    colors={T.ctaGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.vipUnlockGrad}
                  >
                    <Ionicons name="diamond" size={16} color="#070A14" />
                    <Text style={styles.vipUnlockText}>
                      {canSeeLikes ? "Manage VIP Gold" : "Unlock with VibeGold"}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </LinearGradient>
            </View>

            {/* ── 2-COLUMN LIKES GRID ── */}
            <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
              <Text style={styles.sectionTitleLg}>
                Recent Likes <Text style={{ color: T.muted }}>({displayedLikes.length})</Text>
              </Text>
              <Text style={styles.likesHintText}>
                {canSeeLikes ? "Tap to chat" : "Locked profiles"}
              </Text>
            </View>

            <View style={styles.likesGrid}>
              {displayedLikes.map((person, idx) => (
                <Pressable
                  key={person.id + idx}
                  style={styles.likeCard}
                  onPress={() => {
                    if (!canSeeLikes) {
                      openPaywall();
                    } else {
                      router.push(`/user/${person.id}`);
                    }
                  }}
                >
                  <Image
                    source={{ uri: resolveAvatar(person.avatarUrl) || person.avatarUrl }}
                    style={styles.likeCardImg}
                    blurRadius={!canSeeLikes ? 35 : 0}
                  />

                  {/* Frosted Blur Overlay if not unlocked */}
                  {!canSeeLikes && (
                    <>
                      <View
                        style={[
                          StyleSheet.absoluteFillObject,
                          { backgroundColor: "rgba(7, 10, 20, 0.4)" },
                        ]}
                      />
                      <BlurView
                        intensity={80}
                        tint="dark"
                        style={StyleSheet.absoluteFillObject}
                      />
                    </>
                  )}

                  {/* Top-Left Heart Badge */}
                  <View style={styles.likeCardBadge}>
                    <Ionicons name="heart" size={11} color="#EF4444" />
                    <Text style={styles.likeCardBadgeText}>LIKED</Text>
                  </View>

                  {/* Center Lock Badge if free */}
                  {!canSeeLikes && (
                    <View style={styles.centerLockCircle}>
                      <Ionicons name="lock-closed" size={18} color={T.gold} />
                      <Text style={styles.lockSecretText}>SECRET</Text>
                    </View>
                  )}

                  {/* Bottom Vignette & Details */}
                  <LinearGradient
                    colors={["transparent", "rgba(7, 10, 20, 0.96)"]}
                    style={styles.likeCardVignette}
                  >
                    <Text style={styles.likePersonName} numberOfLines={1}>
                      {canSeeLikes ? person.name : "Secret Admirer"}
                      {canSeeLikes && person.age ? `, ${person.age}` : ""}
                    </Text>
                    <Text style={styles.likePersonCity} numberOfLines={1}>
                      {canSeeLikes
                        ? `${person.city || "Nearby"} • ${person.distance || "Active"}`
                        : "🔒 Liked your vibe"}
                    </Text>

                    {/* Quick CTA */}
                    {!canSeeLikes ? (
                      <LinearGradient
                        colors={["#22D3EE", "#06B6D4"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.tapToRevealPill}
                      >
                        <Ionicons name="eye" size={12} color="#070A14" />
                        <Text style={styles.tapToRevealText}>Tap to reveal</Text>
                      </LinearGradient>
                    ) : (
                      <Pressable
                        style={styles.matchInstantBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          openChat(person.id);
                        }}
                      >
                        <Text style={styles.matchInstantBtnText}>Match ⚡</Text>
                      </Pressable>
                    )}
                  </LinearGradient>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── DETAIL SHEET MODAL ── */}
      <Modal
        visible={!!selectedMatch}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMatch(null)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedMatch(null)} />
          <View style={styles.sheet}>
            {selectedMatch && (
              <>
                {resolveAvatar(selectedMatch.avatarUrl) ? (
                  <Image
                    source={{ uri: resolveAvatar(selectedMatch.avatarUrl)! }}
                    style={styles.sheetImg}
                  />
                ) : (
                  <View style={[styles.sheetImg, styles.avatarFallback]}>
                    <Text style={[styles.avatarInitials, { fontSize: 48 }]}>
                      {initials(selectedMatch.name)}
                    </Text>
                  </View>
                )}
                <LinearGradient
                  colors={["transparent", "rgba(7,10,20,0.98)"]}
                  style={styles.sheetGrad}
                />
                <Pressable style={styles.sheetClose} onPress={() => setSelectedMatch(null)}>
                  <Ionicons name="close" size={18} color="#fff" />
                </Pressable>
                <View style={styles.sheetInfo}>
                  <Text style={styles.sheetName}>
                    {selectedMatch.name}
                    {selectedMatch.age ? `, ${selectedMatch.age}` : ""}
                  </Text>
                  {!!selectedMatch.city && (
                    <Text style={styles.sheetCity}>{selectedMatch.city}</Text>
                  )}

                  {/* Hangout Vibe selector with Meme Stickers */}
                  <Text style={styles.sheetVibeLabel}>
                    Invite with Meme Sticker:
                  </Text>
                  <View style={styles.sheetVibeChips}>
                    {[
                      { id: "chai", label: "☕ Chai" },
                      { id: "beer", label: "🍺 Beer" },
                      { id: "coffee", label: "☕ Coffee" },
                      { id: "smoke", label: "🚬 Smoke" },
                      { id: "biryani", label: "🍛 Biryani" },
                      { id: "walk", label: "🚶 Walk" },
                    ].map((v) => (
                      <Pressable
                        key={v.id}
                        onPress={() => {
                          const m = selectedMatch;
                          setSelectedMatch(null);
                          openInviteModal({
                            senderName: m.name,
                            senderAvatar: resolveAvatar(m.avatarUrl) || undefined,
                            category: v.id,
                            location: m.city
                              ? `CHAYOS, ${m.city.toUpperCase()}`
                              : "CHAYOS, GALLERIA",
                            time: "6 PM TODAY",
                          });
                        }}
                        style={styles.sheetVibeChip}
                      >
                        <Text style={styles.sheetVibeChipText}>{v.label}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.sheetActionsRow}>
                    <Pressable
                      style={{ flex: 1.2 }}
                      onPress={() => {
                        const m = selectedMatch;
                        setSelectedMatch(null);
                        openInviteModal({
                          senderName: m.name,
                          senderAvatar: resolveAvatar(m.avatarUrl) || undefined,
                          category: "chai",
                          location: m.city
                            ? `CHAYOS, ${m.city.toUpperCase()}`
                            : "CHAYOS, GALLERIA",
                          time: "6 PM TODAY",
                        });
                      }}
                    >
                      <LinearGradient
                        colors={T.ctaGrad}
                        style={styles.sheetCta}
                      >
                        <Ionicons name="sparkles" size={16} color="#070A14" />
                        <Text style={[styles.sheetCtaText, { color: "#070A14" }]}>
                          Down for Chai? ☕
                        </Text>
                      </LinearGradient>
                    </Pressable>

                    <Pressable
                      onPress={() => openChat(selectedMatch.id)}
                      style={{ flex: 1 }}
                    >
                      <View style={styles.sheetSecBtn}>
                        <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                        <Text style={styles.sheetSecBtnText}>Message</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── BOTTOM NAV TAB BAR ── */}
      <TabBar dark />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  /* ── Segment Tabs ── */
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: "#0D1424",
    borderRadius: 22,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  tabBtnActiveGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    borderRadius: 18,
  },
  tabBtnActiveText: {
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    color: "#070A14",
  },
  tabCountBadgeActive: {
    backgroundColor: "rgba(7, 10, 20, 0.25)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabCountTextActive: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#070A14",
  },
  tabBtnIdle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
  },
  tabBtnIdleText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: T.muted,
  },
  tabCountBadgeIdle: {
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabCountTextIdle: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.muted,
  },

  /* ── Section Headers ── */
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  sectionTitleLg: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: T.cyan,
  },
  likesHintText: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.soft,
  },

  /* ── Sparks Horizontal Reel ── */
  sparksScroll: {
    gap: 14,
    paddingBottom: 6,
    paddingRight: 10,
  },
  sparkItem: {
    alignItems: "center",
    width: 66,
  },
  newLikesCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    position: "relative",
    marginBottom: 6,
  },
  newLikesRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  newLikesInner: {
    flex: 1,
    width: "100%",
    backgroundColor: "#070A14",
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  newLikesTag: {
    position: "absolute",
    bottom: -2,
    alignSelf: "center",
    backgroundColor: T.gold,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  newLikesTagText: {
    fontSize: 8,
    fontFamily: VibeFonts.extraBold,
    color: "#070A14",
  },
  sparkAvatarRingWrap: {
    position: "relative",
    marginBottom: 6,
  },
  sparkAvatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 27,
    backgroundColor: "#131C33",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A253D",
  },
  avatarInitials: {
    fontSize: 17,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  onlineBadgeDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#070A14",
  },
  sparkName: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    textAlign: "center",
  },
  sparkCountText: {
    fontSize: 9.5,
    fontFamily: VibeFonts.medium,
    color: T.gold,
    marginTop: 1,
  },
  sparkOnlineText: {
    fontSize: 9.5,
    fontFamily: VibeFonts.medium,
    color: "#22C55E",
    marginTop: 1,
  },
  sparkOfflineText: {
    fontSize: 9.5,
    fontFamily: VibeFonts.regular,
    color: T.soft,
    marginTop: 1,
  },

  /* ── New Match Banner ── */
  bannerWrap: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.2)",
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 10,
  },
  bannerGrad: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  bannerLeftInfo: {
    flex: 1,
  },
  bannerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  bannerBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.gold,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bannerBadgeText: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: "#070A14",
  },
  bannerMatchTime: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },
  bannerHeading: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  bannerSubheading: {
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    color: T.muted,
    marginTop: 3,
    marginBottom: 12,
  },
  bannerActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  bannerCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
  },
  bannerCtaText: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    color: "#070A14",
  },
  bannerSecBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  bannerSecText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  bannerAvatar: {
    width: 68,
    height: 80,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },

  /* ── Matches List ── */
  matchesList: {
    gap: 10,
  },
  matchCardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.cardBorder,
    padding: 12,
    gap: 12,
  },
  matchAvatarCol: {
    position: "relative",
  },
  matchAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#131C33",
  },
  matchInfoCol: {
    flex: 1,
  },
  matchNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  matchNameText: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  matchMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  matchMetaText: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },
  justMatchedPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(212, 247, 44, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.25)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginTop: 4,
  },
  justMatchedPillText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: T.gold,
  },
  matchActionsCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chaiBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  chaiBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chaiBtnText: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
    color: "#070A14",
  },
  chatActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadBadgeDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: T.cyan,
  },

  /* Empty Matches */
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.cardBorder,
    padding: 30,
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(34, 211, 238, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    marginBottom: 6,
  },
  emptyCardSub: {
    fontSize: 13,
    fontFamily: VibeFonts.regular,
    color: T.muted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
  },
  emptyCtaBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1,
    borderColor: T.cyan,
  },
  emptyCtaText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: T.cyan,
  },

  /* ── VIP Hero Card (Likes Tab) ── */
  vipHeroCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.25)",
    overflow: "hidden",
    marginBottom: 6,
  },
  vipHeroGrad: {
    padding: 18,
    alignItems: "center",
  },
  vipBadgeRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  vipGoldBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vipGoldBadgeText: {
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    color: "#070A14",
  },
  vipWaitingPill: {
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vipWaitingPillText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.cyan,
  },
  fanCardsStack: {
    width: "100%",
    height: 110,
    position: "relative",
    marginBottom: 14,
  },
  fanCard: {
    position: "absolute",
    width: 90,
    height: 110,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  cardLockCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  vipHeroTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  vipHeroSub: {
    fontSize: 12.5,
    fontFamily: VibeFonts.regular,
    color: T.muted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  vipPerksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  vipPerkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  vipPerkText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#E2E8F0",
  },
  vipUnlockBtn: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  vipUnlockGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
  },
  vipUnlockText: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: "#070A14",
  },

  /* ── 2-Column Likes Grid ── */
  likesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  likeCard: {
    width: (SCREEN_W - 32 - 12) / 2,
    height: 190,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#131C33",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  likeCardImg: {
    width: "100%",
    height: "100%",
  },
  likeCardBadge: {
    position: "absolute",
    top: 9,
    left: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(7, 10, 20, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 10,
  },
  likeCardBadgeText: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: "#EF4444",
    letterSpacing: 0.5,
  },
  centerLockCircle: {
    position: "absolute",
    top: "33%",
    left: "50%",
    marginLeft: -26,
    marginTop: -26,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(7, 10, 20, 0.85)",
    borderWidth: 1.5,
    borderColor: T.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
    gap: 2,
  },
  lockSecretText: {
    fontSize: 7.5,
    fontFamily: VibeFonts.extraBold,
    color: T.gold,
    letterSpacing: 0.5,
  },
  tapToRevealPill: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  tapToRevealText: {
    fontSize: 10.5,
    fontFamily: VibeFonts.extraBold,
    color: "#070A14",
    letterSpacing: 0.3,
  },
  likeCardVignette: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingTop: 30,
    paddingBottom: 10,
    zIndex: 10,
  },
  likePersonName: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  likePersonCity: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 1,
  },
  matchInstantBtn: {
    marginTop: 6,
    backgroundColor: T.gold,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  matchInstantBtnText: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
    color: "#070A14",
  },

  /* ── Detail Sheet Modal ── */
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0D1424",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    maxHeight: "82%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  sheetImg: {
    width: "100%",
    height: 280,
  },
  sheetGrad: {
    position: "absolute",
    top: 140,
    left: 0,
    right: 0,
    height: 140,
  },
  sheetClose: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  sheetInfo: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 34,
  },
  sheetName: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  sheetCity: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 2,
    marginBottom: 16,
  },
  sheetVibeLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sheetVibeChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  sheetVibeChip: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sheetVibeChipText: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#E2E8F0",
  },
  sheetActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  sheetCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 16,
  },
  sheetCtaText: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
  },
  sheetSecBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  sheetSecBtnText: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
});
