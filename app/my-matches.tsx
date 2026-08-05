import React, { useMemo, useState } from "react";
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
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeInDown, FadeInRight } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useMatches } from "../context/MatchesContext";
import { usePremium } from "../context/PremiumContext";
import { MatchProfile } from "../constants/matches";
import { VibeFonts } from "../constants/vibeTheme";
import { API_URL } from "../constants/theme";
import HangoutCinematicBackground from "../components/vibe/HangoutCinematicBackground";
import AppHeader from "../components/vibe/AppHeader";
import TabBar from "../components/TabBar";

const { width: SCREEN_W } = Dimensions.get("window");

const T = {
  bg: "#070A14",
  card: "rgba(22, 26, 46, 0.94)",
  ink: "#F4F6FB",
  muted: "#A7B0C4",
  faint: "#7C869C",
  border: "rgba(160, 170, 200, 0.14)",
  purple: "#A78BFA",
  purpleDeep: "#8B5CF6",
  pink: "#EC4899",
  green: "#22C55E",
  greenSoft: "#4ADE80",
  gold: "#FBBF24",
  red: "#EF4444",
  matchGrad: ["#8B5CF6", "#EC4899"] as const,
  likeGrad: ["#7C3AED", "#DB2777"] as const,
  bannerGrad: ["#2A1850", "#1A1238", "#120E28"] as const,
  cta: ["#8B5CF6", "#D946EF"] as const,
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

function HeartBurst() {
  return (
    <View style={styles.heartBurst}>
      <Text style={styles.heartBig}>💕</Text>
      <Text style={[styles.sparkle, { top: 2, left: 8 }]}>✦</Text>
      <Text style={[styles.sparkle, { top: 10, right: 4, fontSize: 9, color: "#F9A8D4" }]}>✧</Text>
      <Text style={[styles.sparkle, { bottom: 8, left: 14, fontSize: 8, color: "#C4B5FD" }]}>✦</Text>
    </View>
  );
}

export default function MyMatchesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matches, likesList, likesCount, conversations } = useMatches();
  const { openPaywall, hasFeature, isPremium } = usePremium();
  const canSeeLikes = isPremium || hasFeature("SEE_LIKES");

  const [activeTab, setActiveTab] = useState<"matches" | "likes">("matches");
  const [selectedMatch, setSelectedMatch] = useState<MatchProfile | null>(null);
  const [sortRecent] = useState(true);

  const onlineCount = useMemo(
    () => matches.filter((m) => m.isOnline).length,
    [matches]
  );

  const likesTotal = Math.max(likesCount, likesList.length);
  const newestMatch = matches[0] || null;

  const sortedMatches = useMemo(() => {
    const list = [...matches];
    if (sortRecent) {
      list.sort(
        (a, b) =>
          new Date(b.matchedAt || 0).getTime() - new Date(a.matchedAt || 0).getTime()
      );
    }
    return list;
  }, [matches, sortRecent]);

  const unreadFor = (matchId: string) =>
    conversations.find((c) => c.matchId === matchId)?.unread || 0;

  const openChat = (id: string) => {
    setSelectedMatch(null);
    router.push(`/chat/${id}`);
  };

  return (
    <View style={styles.root}>
      <HangoutCinematicBackground />
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />

      <AppHeader
        variant="dark"
        tagline={`${onlineCount} online now · Matches & likes`}
        onBellPress={() => router.push("/(tabs)/chats")}
        badgeCount={likesTotal}
      />

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable style={styles.tab} onPress={() => setActiveTab("matches")}>
          {activeTab === "matches" ? (
            <LinearGradient colors={[...T.matchGrad]} style={styles.tabActive}>
              <Ionicons name="heart" size={14} color="#fff" />
              <Text style={styles.tabActiveText}>Matches</Text>
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{matches.length}</Text>
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.tabIdle}>
              <Ionicons name="heart-outline" size={14} color={T.muted} />
              <Text style={styles.tabIdleText}>Matches</Text>
              <View style={styles.tabBadgeIdle}>
                <Text style={styles.tabBadgeIdleText}>{matches.length}</Text>
              </View>
            </View>
          )}
        </Pressable>
        <Pressable style={styles.tab} onPress={() => setActiveTab("likes")}>
          {activeTab === "likes" ? (
            <LinearGradient colors={[...T.likeGrad]} style={styles.tabActive}>
              <Ionicons name="sparkles" size={14} color="#fff" />
              <Text style={styles.tabActiveText}>Likes</Text>
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{likesTotal}</Text>
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.tabIdle}>
              <Ionicons name="sparkles-outline" size={14} color={T.muted} />
              <Text style={styles.tabIdleText}>Likes</Text>
              <View style={styles.tabBadgeIdle}>
                <Text style={styles.tabBadgeIdleText}>{likesTotal}</Text>
              </View>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 110 + insets.bottom }]}
      >
        {activeTab === "matches" ? (
          <>
            {/* New sparks */}
            <View style={styles.sectionHead}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="flash" size={14} color={T.purple} />
                <Text style={styles.sectionTitle}>New sparks</Text>
              </View>
              <Pressable onPress={() => setActiveTab("likes")}>
                <Text style={styles.seeAll}>See all ›</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sparksScroll}
            >
              {/* New Likes circle */}
              <Animated.View entering={FadeInRight.duration(300)}>
                <Pressable style={styles.sparkItem} onPress={() => setActiveTab("likes")}>
                  <View style={styles.newLikesWrap}>
                    <LinearGradient
                      colors={["#A78BFA", "#EC4899", "#8B5CF6"]}
                      style={styles.newLikesRing}
                    >
                      <View style={styles.newLikesInner}>
                        <Text style={{ fontSize: 28 }}>💗</Text>
                      </View>
                    </LinearGradient>
                    <View style={styles.newTag}>
                      <Text style={styles.newTagText}>NEW</Text>
                    </View>
                  </View>
                  <Text style={styles.sparkName}>New Likes</Text>
                  <Text style={styles.sparkLikesCount}>{likesTotal}</Text>
                </Pressable>
              </Animated.View>

              {sortedMatches.slice(0, 10).map((m, i) => (
                <Animated.View
                  key={m.id}
                  entering={FadeInRight.delay(40 + i * 35).duration(300)}
                >
                  <Pressable style={styles.sparkItem} onPress={() => openChat(m.id)}>
                    <LinearGradient
                      colors={["#C084FC", "#EC4899"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.sparkRing}
                    >
                      {resolveAvatar(m.avatarUrl) ? (
                        <Image
                          source={{ uri: resolveAvatar(m.avatarUrl)! }}
                          style={styles.sparkAvatar}
                        />
                      ) : (
                        <View style={[styles.sparkAvatar, styles.avatarFallback]}>
                          <Text style={styles.avatarInitials}>{initials(m.name)}</Text>
                        </View>
                      )}
                    </LinearGradient>
                    {m.isOnline && <View style={styles.sparkOnline} />}
                    <Text style={styles.sparkName} numberOfLines={1}>
                      {m.name.split(" ")[0]}
                    </Text>
                    {m.isOnline ? (
                      <Text style={styles.sparkOnlineLabel}>Online</Text>
                    ) : (
                      <Text style={styles.sparkOffline}>Tap to chat</Text>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>

            {/* New match banner */}
            {newestMatch && (
              <Animated.View entering={FadeIn.delay(80).duration(400)}>
                <LinearGradient
                  colors={[...T.bannerGrad]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.banner}
                >
                  <View style={styles.bannerGlow} />
                  <HeartBurst />
                  <View style={styles.bannerCopy}>
                    <Text style={styles.bannerTitle}>You&apos;ve got a new match!</Text>
                    <Text style={styles.bannerSub}>
                      Start the conversation and create something amazing.
                    </Text>
                    <Pressable onPress={() => openChat(newestMatch.id)}>
                      <LinearGradient colors={[...T.cta]} style={styles.bannerBtn}>
                        <Ionicons name="paper-plane" size={14} color="#fff" />
                        <Text style={styles.bannerBtnText}>Send a message</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Your Matches list */}
            <View style={[styles.sectionHead, { marginTop: 18 }]}>
              <Text style={styles.sectionTitleLg}>Your Matches</Text>
              <View style={styles.recentPill}>
                <Text style={styles.recentText}>Recent</Text>
                <Ionicons name="chevron-down" size={12} color={T.muted} />
              </View>
            </View>

            {sortedMatches.length === 0 ? (
              <View style={styles.emptyDash}>
                <Text style={{ fontSize: 22 }}>💕</Text>
                <Text style={styles.emptyDashText}>
                  More matches are on the way. Keep exploring and good things will happen!
                </Text>
              </View>
            ) : (
              <>
                {sortedMatches.map((m, i) => {
                  const unread = unreadFor(m.id);
                  const avatar = resolveAvatar(m.avatarUrl);
                  return (
                    <Animated.View
                      key={m.id}
                      entering={FadeInDown.delay(Math.min(i, 6) * 40).duration(300)}
                    >
                      <Pressable
                        style={styles.matchRow}
                        onPress={() => setSelectedMatch(m)}
                      >
                        <View style={styles.matchAvatarWrap}>
                          {avatar ? (
                            <Image source={{ uri: avatar }} style={styles.matchAvatar} />
                          ) : (
                            <LinearGradient
                              colors={["#7C3AED", "#A78BFA"]}
                              style={[styles.matchAvatar, styles.avatarFallback]}
                            >
                              <Text style={styles.avatarInitials}>{initials(m.name)}</Text>
                            </LinearGradient>
                          )}
                          {m.isOnline && <View style={styles.matchOnline} />}
                        </View>

                        <View style={styles.matchInfo}>
                          <View style={styles.matchNameRow}>
                            <Text style={styles.matchName} numberOfLines={1}>
                              {m.name}
                            </Text>
                            {m.isVerified && (
                              <Ionicons name="checkmark-circle" size={15} color={T.purple} />
                            )}
                          </View>
                          {!!m.city && (
                            <View style={styles.locRow}>
                              <Ionicons name="location-outline" size={12} color={T.faint} />
                              <Text style={styles.locText} numberOfLines={1}>
                                {m.city}
                              </Text>
                            </View>
                          )}
                          {isJustMatched(m.matchedAt) && (
                            <View style={styles.justMatched}>
                              <Text style={styles.justMatchedText}>✨ Just matched</Text>
                            </View>
                          )}
                        </View>

                        <Pressable
                          style={styles.chatBtn}
                          onPress={() => openChat(m.id)}
                          hitSlop={6}
                        >
                          <LinearGradient
                            colors={["#7C3AED", "#8B5CF6"]}
                            style={styles.chatBtnGrad}
                          >
                            <Ionicons name="chatbubble" size={16} color="#fff" />
                          </LinearGradient>
                          {unread > 0 && <View style={styles.chatNotif} />}
                        </Pressable>
                      </Pressable>
                    </Animated.View>
                  );
                })}

                <View style={styles.emptyDash}>
                  <Text style={{ fontSize: 20 }}>💞</Text>
                  <Text style={styles.emptyDashText}>
                    More matches are on the way. Keep exploring and good things will happen!
                  </Text>
                </View>
              </>
            )}
          </>
        ) : (
          /* Likes tab */
          <Animated.View entering={FadeIn.duration(320)}>
            {!canSeeLikes ? (
              <View style={styles.likesTease}>
                <View style={styles.likesStack}>
                  {(likesList.length
                    ? likesList.slice(0, 3)
                    : [
                        { id: "1", avatarUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300" },
                        { id: "2", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300" },
                        { id: "3", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300" },
                      ]
                  ).map((p: any, i: number) => (
                    <View
                      key={p.id}
                      style={[
                        styles.likesStackCard,
                        {
                          left: 36 + i * 48,
                          zIndex: 3 - i,
                          transform: [{ rotate: `${(i - 1) * 7}deg` }],
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: resolveAvatar(p.avatarUrl) || p.avatarUrl }}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                    </View>
                  ))}
                </View>
                <Text style={styles.likesTitle}>
                  {likesTotal > 0 ? `${likesTotal} people like you` : "See who likes you"}
                </Text>
                <Text style={styles.likesSub}>
                  Unlock blurred profiles and match faster.
                </Text>
                <Pressable onPress={openPaywall}>
                  <LinearGradient colors={["#F5D78E", "#D4AF37"]} style={styles.unlockBtn}>
                    <Ionicons name="diamond" size={15} color="#1A1520" />
                    <Text style={styles.unlockText}>Unlock with Premium</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : likesList.length === 0 ? (
              <View style={styles.emptyDash}>
                <Text style={{ fontSize: 22 }}>✨</Text>
                <Text style={styles.emptyDashText}>
                  No new likes yet. Keep exploring!
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {likesList.map((item, i) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.delay(i * 35).duration(280)}
                  >
                    <Pressable
                      style={styles.matchRow}
                      onPress={() => router.push("/(tabs)/discover")}
                    >
                      <Image
                        source={{ uri: resolveAvatar(item.avatarUrl) || item.avatarUrl }}
                        style={styles.matchAvatar}
                      />
                      <View style={styles.matchInfo}>
                        <Text style={styles.matchName}>
                          {item.name?.split(" ")[0] || "Someone"}
                          {item.age ? `, ${item.age}` : ""}
                        </Text>
                        <View style={styles.justMatched}>
                          <Text style={styles.justMatchedText}>💗 Liked you</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={T.faint} />
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      <TabBar dark />

      {/* Detail sheet */}
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
                  <LinearGradient colors={["#7C3AED", "#EC4899"]} style={styles.sheetImg}>
                    <Text style={[styles.avatarInitials, { fontSize: 48 }]}>
                      {initials(selectedMatch.name)}
                    </Text>
                  </LinearGradient>
                )}
                <LinearGradient
                  colors={["transparent", "rgba(7,10,20,0.97)"]}
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
                  <Pressable onPress={() => openChat(selectedMatch.id)}>
                    <LinearGradient colors={[...T.cta]} style={styles.sheetCta}>
                      <Ionicons name="paper-plane" size={16} color="#fff" />
                      <Text style={styles.sheetCtaText}>Send a message</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "rgba(12, 16, 32, 0.95)",
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: T.border,
    gap: 4,
  },
  tab: { flex: 1, borderRadius: 14, overflow: "hidden" },
  tabActive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  tabActiveText: {
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
  },
  tabIdle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  tabIdleText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: T.muted,
  },
  tabBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
  },
  tabBadgeIdle: {
    backgroundColor: "rgba(255,255,255,0.08)",
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeIdleText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.muted,
  },

  scroll: { paddingHorizontal: 16 },
  sectionHead: {
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
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  sectionTitleLg: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  seeAll: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: T.purple,
  },
  recentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: T.border,
  },
  recentText: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: T.muted,
  },

  sparksScroll: { gap: 14, paddingBottom: 6, paddingRight: 8 },
  sparkItem: { width: 76, alignItems: "center", gap: 4 },
  newLikesWrap: { position: "relative", marginBottom: 2 },
  newLikesRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  newLikesInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#14182A",
    alignItems: "center",
    justifyContent: "center",
  },
  newTag: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: T.pink,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: T.bg,
  },
  newTagText: {
    fontSize: 8,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    letterSpacing: 0.4,
  },
  sparkRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EC4899",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  sparkAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1a1f32",
  },
  sparkOnline: {
    position: "absolute",
    right: 4,
    bottom: 22,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: T.green,
    borderWidth: 2,
    borderColor: T.bg,
  },
  sparkName: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: T.ink,
    maxWidth: 76,
    textAlign: "center",
  },
  sparkOnlineLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.greenSoft,
  },
  sparkOffline: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: T.faint,
  },
  sparkLikesCount: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
    color: T.pink,
  },

  banner: {
    marginTop: 14,
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    overflow: "hidden",
  },
  bannerGlow: {
    position: "absolute",
    left: -20,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(236,72,153,0.18)",
  },
  heartBurst: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  heartBig: { fontSize: 42 },
  sparkle: {
    position: "absolute",
    color: T.gold,
    fontSize: 11,
  },
  bannerCopy: { flex: 1, gap: 4 },
  bannerTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  bannerSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    lineHeight: 16,
    marginBottom: 6,
  },
  bannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  bannerBtnText: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
  },

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  matchAvatarWrap: { position: "relative" },
  matchAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
  },
  matchOnline: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: T.green,
    borderWidth: 2,
    borderColor: T.card,
  },
  matchInfo: { flex: 1, gap: 3 },
  matchNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  matchName: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    maxWidth: SCREEN_W * 0.4,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.faint,
    flex: 1,
  },
  justMatched: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(139,92,246,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 2,
  },
  justMatchedText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.purple,
  },
  chatBtn: { position: "relative" },
  chatBtnGrad: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  chatNotif: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: T.red,
    borderWidth: 1.5,
    borderColor: T.card,
  },

  emptyDash: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(167,139,250,0.28)",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    backgroundColor: "rgba(139,92,246,0.05)",
  },
  emptyDashText: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
    lineHeight: 19,
  },

  likesTease: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 24,
  },
  likesStack: {
    width: SCREEN_W - 64,
    height: 180,
    marginBottom: 18,
    position: "relative",
  },
  likesStackCard: {
    position: "absolute",
    top: 16,
    width: 110,
    height: 145,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(236,72,153,0.4)",
  },
  likesTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    textAlign: "center",
  },
  likesSub: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  unlockText: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: "#1A1520",
  },

  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(4,6,14,0.72)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0D1220",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
    minHeight: 380,
    borderWidth: 1,
    borderColor: T.border,
  },
  sheetImg: {
    width: "100%",
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetGrad: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
  },
  sheetClose: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetInfo: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 28,
    gap: 4,
  },
  sheetName: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  sheetCity: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginBottom: 12,
  },
  sheetCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 999,
  },
  sheetCtaText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
  },
});
