import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import MatchStrip from "../../components/chats/MatchStrip";
import ChatLogItem from "../../components/chats/ChatLogItem";
import { useMatches } from "../../context/MatchesContext";
import { useSidebar } from "../../context/SidebarContext";
import { MatchProfile } from "../../constants/matches";
import { VibeFonts } from "../../constants/vibeTheme";

const T = {
  bg: "#EEE9F8",
  card: "#FFFBFE",
  ink: "#1A1F36",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E4DFF0",
  softPurple: "#EDE7FF",
  softPink: "#FCE7F3",
  purple: "#8B5CF6",
  purpleDeep: "#7C3AED",
  pink: "#EC4899",
  green: "#16A34A",
  amber: "#D97706",
  glass: "rgba(255,251,254,0.94)",
  cta: ["#8B5CF6", "#EC4899"] as const,
};

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openSidebar } = useSidebar();
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
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={["rgba(139,92,246,0.18)", "rgba(236,72,153,0.08)", "transparent"]}
        style={styles.glowTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(238,233,248,0.9)"]}
        style={styles.glowBottom}
        pointerEvents="none"
      />

      {/* Premium header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable style={styles.iconBtn} onPress={openSidebar}>
          <Ionicons name="menu" size={20} color={T.ink} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>Vibely</Text>
            {totalUnread > 0 ? (
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>{totalUnread} new</Text>
              </View>
            ) : (
              <View style={styles.inboxPill}>
                <Text style={styles.inboxPillText}>INBOX</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSub}>
            {conversations.length > 0
              ? `${conversations.length} conversations`
              : "Your messages live here"}
          </Text>
        </View>

        <Pressable style={styles.likesBtn} onPress={() => router.push("/my-matches")}>
          <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.likesBtnGrad}>
            <Ionicons name="heart" size={16} color="#fff" />
          </LinearGradient>
          {likesCount > 0 ? (
            <View style={styles.likesDot}>
              <Text style={styles.likesDotText}>{likesCount > 9 ? "9+" : likesCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search */}
        <Animated.View entering={FadeInDown.delay(50).duration(380)} style={styles.searchBox}>
          <Ionicons name="search" size={17} color={T.purple} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or message…"
            placeholderTextColor={T.faint}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color={T.faint} />
            </Pressable>
          ) : (
            <View style={styles.searchHint}>
              <Text style={styles.searchHintText}>{filteredThreads.length}</Text>
            </View>
          )}
        </Animated.View>

        {emptyAll ? (
          <Animated.View entering={FadeInDown.delay(90).duration(400)} style={styles.emptyCard}>
            <LinearGradient colors={[...T.cta]} style={styles.emptyIcon}>
              <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
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
                <Ionicons name="compass" size={18} color="#fff" />
                <Text style={styles.ctaText}>Go to Discover</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            {/* Segment tabs */}
            <Animated.View entering={FadeInDown.delay(80).duration(380)} style={styles.modeTrack}>
              <Pressable
                style={styles.modeChip}
                onPress={() => setActiveTab("chats")}
              >
                {activeTab === "chats" ? (
                  <LinearGradient
                    colors={[...T.cta]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modeChipFill}
                  >
                    <Ionicons name="chatbubble-ellipses" size={14} color="#fff" />
                    <Text style={styles.modeTextActive}>Direct DMs</Text>
                    {directUnread > 0 ? (
                      <View style={styles.segBadgeDark}>
                        <Text style={styles.segBadgeText}>{directUnread}</Text>
                      </View>
                    ) : null}
                  </LinearGradient>
                ) : (
                  <View style={styles.modeChipFill}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={T.muted} />
                    <Text style={styles.modeText}>Direct DMs</Text>
                    {directUnread > 0 ? <View style={styles.dot} /> : null}
                  </View>
                )}
              </Pressable>

              <Pressable
                style={styles.modeChip}
                onPress={() => setActiveTab("hangouts")}
              >
                {activeTab === "hangouts" ? (
                  <LinearGradient
                    colors={["#7C3AED", "#8B5CF6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modeChipFill}
                  >
                    <Ionicons name="people" size={14} color="#fff" />
                    <Text style={styles.modeTextActive}>Hangouts</Text>
                    {hangoutUnread > 0 ? (
                      <View style={styles.segBadgeDark}>
                        <Text style={styles.segBadgeText}>{hangoutUnread}</Text>
                      </View>
                    ) : null}
                  </LinearGradient>
                ) : (
                  <View style={styles.modeChipFill}>
                    <Ionicons name="people-outline" size={14} color={T.muted} />
                    <Text style={styles.modeText}>Hangouts</Text>
                    {hangoutUnread > 0 ? <View style={styles.dot} /> : null}
                  </View>
                )}
              </Pressable>
            </Animated.View>

            {matches.length > 0 && activeTab === "chats" ? (
              <Animated.View entering={FadeInRight.delay(100).duration(400)}>
                <MatchStrip
                  matches={matches}
                  onPressMatch={openMatch}
                  onDiscover={() => router.push("/(tabs)/discover")}
                />
              </Animated.View>
            ) : null}

            <View style={styles.listHead}>
              <Text style={styles.listTitle}>
                {activeTab === "chats" ? "Direct messages" : "Hangout groups"}
              </Text>
              <View style={styles.countPill}>
                <Text style={styles.countText}>{filteredThreads.length}</Text>
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
                      name={activeTab === "chats" ? "chatbubbles-outline" : "calendar-outline"}
                      size={28}
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
              <View style={styles.tipIcon}>
                <Ionicons name="sparkles" size={13} color={T.amber} />
              </View>
              <Text style={styles.tipText}>
                After a match: one hello · they reply in 24h or chat expires
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  glowTop: { position: "absolute", top: 0, left: 0, right: 0, height: 280 },
  glowBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 140 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: T.glass,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerCenter: { flex: 1 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.5,
  },
  inboxPill: {
    backgroundColor: T.ink,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inboxPillText: {
    fontSize: 8,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    letterSpacing: 0.7,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.softPink,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.pink,
  },
  livePillText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.pink,
  },
  headerSub: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },
  likesBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#EC4899",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  likesBtnGrad: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  likesDot: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: T.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: T.bg,
  },
  likesDotText: { fontSize: 9, fontFamily: VibeFonts.bold, color: "#fff" },

  scroll: { paddingHorizontal: 16, paddingBottom: 110, paddingTop: 4 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: T.glass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    padding: 0,
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

  emptyCard: {
    backgroundColor: T.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: T.border,
    padding: 28,
    alignItems: "center",
    marginTop: 4,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
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
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
  },
  ctaText: { color: "#fff", fontFamily: VibeFonts.bold, fontSize: 14 },

  modeTrack: {
    flexDirection: "row",
    backgroundColor: T.glass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    padding: 4,
    gap: 4,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  modeChip: { flex: 1, borderRadius: 14, overflow: "hidden" },
  modeChipFill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  modeText: { fontSize: 13, fontFamily: VibeFonts.bold, color: T.muted },
  modeTextActive: { fontSize: 13, fontFamily: VibeFonts.bold, color: "#fff" },
  segBadgeDark: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  segBadgeText: { fontSize: 10, fontFamily: VibeFonts.bold, color: "#fff" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.pink,
  },

  listHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    marginTop: 2,
  },
  listTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: T.ink,
    flex: 1,
  },
  countPill: {
    backgroundColor: T.softPurple,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  countText: { fontSize: 11, fontFamily: VibeFonts.bold, color: T.purpleDeep },

  listCard: {
    backgroundColor: T.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  emptyList: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 12,
  },
  emptyListIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyListText: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
    lineHeight: 19,
  },

  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  tipIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.amber,
    lineHeight: 16,
  },
});
