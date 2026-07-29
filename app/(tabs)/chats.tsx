import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import AppHeader from "../../components/vibe/AppHeader";
import MatchStrip from "../../components/chats/MatchStrip";
import ChatLogItem from "../../components/chats/ChatLogItem";
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

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matches, conversations, likesCount } = useMatches();
  const [activeTab, setActiveTab] = useState<"chats" | "hangouts">("chats");
  const [query, setQuery] = useState("");

  const openChat = (matchId: string) => router.push(`/chat/${matchId}`);
  const openMatch = (m: MatchProfile) => openChat(m.id);

  const filteredThreads = useMemo(() => {
    const base = conversations.filter((thread) =>
      activeTab === "chats" ? !thread.isGroup : thread.isGroup === true
    );
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (t) =>
        t.matchName.toLowerCase().includes(q) ||
        t.lastMessage.toLowerCase().includes(q)
    );
  }, [conversations, activeTab, query]);

  const totalUnread = conversations.reduce((sum, t) => sum + t.unread, 0);
  const directUnread = conversations
    .filter((t) => !t.isGroup)
    .reduce((sum, t) => sum + t.unread, 0);
  const hangoutUnread = conversations
    .filter((t) => t.isGroup)
    .reduce((sum, t) => sum + t.unread, 0);

  const emptyAll = matches.length === 0 && conversations.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <AppHeader
        variant="light"
        tagline="Conversations & Hangout DMs · Real Vibe"
        badgeCount={totalUnread}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 120 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Section */}
        <Animated.View
          entering={FadeInDown.delay(40).duration(380)}
          style={styles.searchSection}
        >
          <View style={styles.searchBarWrapper}>
            <Ionicons
              name="search"
              size={18}
              color={T.muted}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name or message…"
              placeholderTextColor={T.faint}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={19} color={T.faint} />
              </Pressable>
            ) : (
              <View style={styles.searchHint}>
                <Text style={styles.searchHintText}>
                  {filteredThreads.length}
                </Text>
              </View>
            )}
          </View>
          <Pressable
            style={styles.likesQuickBtn}
            onPress={() => router.push("/my-matches")}
          >
            <LinearGradient
              colors={[...T.cta]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="heart" size={18} color="#fff" />
            {likesCount > 0 && (
              <View style={styles.likesBadge}>
                <Text style={styles.likesBadgeText}>
                  {likesCount > 9 ? "9+" : likesCount}
                </Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* 2-Tab Segmented Switcher matching Hangout screen */}
        <Animated.View
          entering={FadeInDown.delay(70).duration(380)}
          style={styles.modeSwitcherTrack}
        >
          <Pressable
            onPress={() => setActiveTab("chats")}
            style={[
              styles.modeSwitcherBtn,
              activeTab === "chats" && styles.modeSwitcherBtnActive,
            ]}
          >
            <Ionicons
              name="chatbubble-ellipses"
              size={15}
              color={activeTab === "chats" ? T.purple : T.muted}
            />
            <Text
              style={[
                styles.modeSwitcherText,
                activeTab === "chats" && styles.modeSwitcherTextActive,
              ]}
            >
              Direct DMs
            </Text>
            {directUnread > 0 ? (
              <View style={styles.segBadge}>
                <Text style={styles.segBadgeText}>{directUnread}</Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("hangouts")}
            style={[
              styles.modeSwitcherBtn,
              activeTab === "hangouts" && styles.modeSwitcherBtnActive,
            ]}
          >
            <Ionicons
              name="people"
              size={15}
              color={activeTab === "hangouts" ? T.pink : T.muted}
            />
            <Text
              style={[
                styles.modeSwitcherText,
                activeTab === "hangouts" && {
                  color: T.pink,
                  fontFamily: VibeFonts.extraBold,
                },
              ]}
            >
              Hangout Groups
            </Text>
            {hangoutUnread > 0 ? (
              <View style={[styles.segBadge, { backgroundColor: T.pink }]}>
                <Text style={styles.segBadgeText}>{hangoutUnread}</Text>
              </View>
            ) : null}
          </Pressable>
        </Animated.View>

        {emptyAll ? (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.emptyCard}
          >
            <LinearGradient colors={[...T.cta]} style={styles.emptyIcon}>
              <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptySub}>
              Swipe on Discover for a match, or join a hangout — then your threads show up here.
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/discover")}>
              <LinearGradient
                colors={[...T.cta]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaBtn}
              >
                <Ionicons name="compass" size={19} color="#fff" />
                <Text style={styles.ctaText}>Go to Discover</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            {matches.length > 0 && activeTab === "chats" ? (
              <Animated.View entering={FadeInRight.delay(100).duration(400)}>
                <MatchStrip
                  matches={matches}
                  onPressMatch={openMatch}
                  onDiscover={() => router.push("/(tabs)/discover")}
                />
              </Animated.View>
            ) : null}

            <View style={styles.sectionHeaderRow}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text style={styles.sectionTitle}>
                  {activeTab === "chats"
                    ? "Direct Messages 💬"
                    : "Hangout Groups 👥"}
                </Text>
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{filteredThreads.length}</Text>
                </View>
              </View>
            </View>

            <View style={styles.listCard}>
              {filteredThreads.length > 0 ? (
                filteredThreads.map((thread, i) => (
                  <Animated.View
                    key={thread.matchId}
                    entering={FadeInDown.delay(120 + i * 35).duration(300)}
                  >
                    <ChatLogItem
                      thread={thread}
                      onPress={() => openChat(thread.matchId)}
                      isLast={i === filteredThreads.length - 1}
                    />
                  </Animated.View>
                ))
              ) : (
                <View style={styles.emptyList}>
                  <View style={styles.emptyListIcon}>
                    <Ionicons
                      name={
                        activeTab === "chats"
                          ? "chatbubbles-outline"
                          : "calendar-outline"
                      }
                      size={30}
                      color={T.purple}
                    />
                  </View>
                  <Text style={styles.emptyListText}>
                    {query
                      ? "No chats match your search"
                      : activeTab === "chats"
                      ? "No DMs yet — open a match above to say hello"
                      : "Join a hangout plan to unlock group chat"}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.tipRow}>
              <LinearGradient
                colors={["#0F172A", "#1E293B"]}
                style={styles.tipGrad}
              >
                <View style={styles.tipIcon}>
                  <Ionicons name="sparkles" size={14} color="#F59E0B" />
                </View>
                <Text style={styles.tipText}>
                  After a match: send hello · reply in 48h to unlock chat
                  permanently
                </Text>
              </LinearGradient>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: 4,
  },
  sloganHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  doodleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  doodlePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  doodleText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },
  liveNowBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  liveNowText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#15803D",
  },
  sloganTitle: {
    fontSize: 28,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    lineHeight: 34,
    letterSpacing: -0.8,
  },
  sloganHighlight: {
    color: "#7C3AED",
  },
  sloganUnderline: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    width: 80,
  },

  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: "#18181B",
    padding: 0,
  },
  searchHint: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  searchHintText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },
  likesQuickBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  likesBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  likesBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: VibeFonts.bold,
  },

  modeSwitcherTrack: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  modeSwitcherBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modeSwitcherBtnActive: {
    backgroundColor: "#F3E8FF",
  },
  modeSwitcherText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },
  modeSwitcherTextActive: {
    color: "#7C3AED",
    fontFamily: VibeFonts.extraBold,
  },
  segBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  segBadgeText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 28,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 4,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#EC4899",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 21,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  emptySub: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaText: { color: "#fff", fontFamily: VibeFonts.bold, fontSize: 14 },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  countPill: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },

  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  emptyList: {
    paddingVertical: 44,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 12,
  },
  emptyListIcon: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyListText: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },

  tipRow: {
    borderRadius: 18,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  tipGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tipIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: "#FFFFFF",
    lineHeight: 16,
  },
});

