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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import MatchStrip from "../../components/chats/MatchStrip";
import ChatLogItem from "../../components/chats/ChatLogItem";
import { useMatches } from "../../context/MatchesContext";
import { useSidebar } from "../../context/SidebarContext";
import { MatchProfile } from "../../constants/matches";
import { VibeFonts } from "../../constants/vibeTheme";

const T = {
  bg: "#050508",
  card: "#12121A",
  elevated: "#1A1A24",
  ink: "#FFFFFF",
  muted: "rgba(255,255,255,0.55)",
  faint: "rgba(255,255,255,0.32)",
  border: "rgba(255,255,255,0.08)",
  pink: "#FF4B81",
  purple: "#A855F7",
  green: "#22C55E",
  blue: "#60A5FA",
  amber: "#F59E0B",
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
      <LinearGradient
        colors={["rgba(255,75,129,0.22)", "transparent"]}
        style={styles.glowTop}
      />
      <LinearGradient
        colors={["transparent", "rgba(138,86,255,0.14)"]}
        style={styles.glowBottom}
      />

      {/* Custom inbox header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable style={styles.menuBtn} onPress={openSidebar}>
          <Ionicons name="menu" size={20} color={T.ink} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.eyebrow}>INBOX</Text>
          <Text style={styles.title}>Messages</Text>
        </View>
        <Pressable
          style={styles.likesBtn}
          onPress={() => router.push("/my-matches")}
        >
          <Ionicons name="heart" size={16} color={T.pink} />
          {likesCount > 0 ? (
            <View style={styles.likesDot}>
              <Text style={styles.likesDotText}>
                {likesCount > 9 ? "9+" : likesCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero strip */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroCard}>
          <LinearGradient
            colors={["#1F1020", "#0E0E16"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGrad}
          >
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>
                {totalUnread > 0
                  ? `${totalUnread} unread`
                  : "Your conversations"}
              </Text>
              <Text style={styles.heroSub}>
                {conversations.length > 0
                  ? `${conversations.length} threads · DMs & hangout groups`
                  : "Match or join a hangout to start chatting"}
              </Text>
            </View>
            <View style={styles.heroOrb}>
              <Ionicons name="chatbubbles" size={28} color={T.pink} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(60).duration(380)} style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={17} color={T.faint} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name or message..."
              placeholderTextColor={T.faint}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={18} color={T.faint} />
              </Pressable>
            ) : null}
          </View>
        </Animated.View>

        {emptyAll ? (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.emptyCard}>
            <LinearGradient
              colors={["rgba(138,86,255,0.2)", "rgba(255,75,129,0.08)"]}
              style={styles.emptyIcon}
            >
              <Ionicons name="lock-closed" size={28} color={T.purple} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptySub}>
              Swipe on Discover for a match, or join a hangout — then your threads show up here.
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/discover")}>
              <LinearGradient
                colors={["#FF4B81", "#8A56FF"]}
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
            <Animated.View
              entering={FadeInDown.delay(90).duration(380)}
              style={styles.segmentWrap}
            >
              <Pressable
                onPress={() => setActiveTab("chats")}
                style={styles.segmentSlot}
              >
                {activeTab === "chats" ? (
                  <LinearGradient
                    colors={["#FF4B81", "#8A56FF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.segmentActive}
                  >
                    <Ionicons name="chatbubble-ellipses" size={15} color="#fff" />
                    <Text style={styles.segmentActiveText}>Direct DMs</Text>
                    {directUnread > 0 ? (
                      <View style={styles.segBadge}>
                        <Text style={styles.segBadgeText}>{directUnread}</Text>
                      </View>
                    ) : null}
                  </LinearGradient>
                ) : (
                  <View style={styles.segmentIdle}>
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={15}
                      color={T.faint}
                    />
                    <Text style={styles.segmentIdleText}>Direct DMs</Text>
                    {directUnread > 0 ? <View style={styles.dot} /> : null}
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={() => setActiveTab("hangouts")}
                style={styles.segmentSlot}
              >
                {activeTab === "hangouts" ? (
                  <LinearGradient
                    colors={["#8A56FF", "#3B82F6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.segmentActive}
                  >
                    <Ionicons name="people" size={15} color="#fff" />
                    <Text style={styles.segmentActiveText}>Hangouts</Text>
                    {hangoutUnread > 0 ? (
                      <View style={styles.segBadge}>
                        <Text style={styles.segBadgeText}>{hangoutUnread}</Text>
                      </View>
                    ) : null}
                  </LinearGradient>
                ) : (
                  <View style={styles.segmentIdle}>
                    <Ionicons name="people-outline" size={15} color={T.faint} />
                    <Text style={styles.segmentIdleText}>Hangouts</Text>
                    {hangoutUnread > 0 ? <View style={styles.dot} /> : null}
                  </View>
                )}
              </Pressable>
            </Animated.View>

            {/* New matches strip */}
            {matches.length > 0 && activeTab === "chats" ? (
              <Animated.View entering={FadeInRight.delay(120).duration(400)}>
                <MatchStrip
                  matches={matches}
                  onPressMatch={openMatch}
                  onDiscover={() => router.push("/(tabs)/discover")}
                />
              </Animated.View>
            ) : null}

            {/* List header */}
            <View style={styles.listHead}>
              <Text style={styles.listTitle}>
                {activeTab === "chats" ? "Direct messages" : "Hangout groups"}
              </Text>
              <View style={styles.countPill}>
                <Text style={styles.countText}>{filteredThreads.length}</Text>
              </View>
            </View>

            {/* Threads */}
            <View style={styles.listCard}>
              {filteredThreads.length > 0 ? (
                filteredThreads.map((thread, i) => (
                  <Animated.View
                    key={thread.matchId}
                    entering={FadeInDown.delay(140 + i * 40).duration(320)}
                  >
                    <ChatLogItem
                      thread={thread}
                      onPress={() => openChat(thread.matchId)}
                    />
                  </Animated.View>
                ))
              ) : (
                <View style={styles.emptyList}>
                  <Ionicons
                    name={
                      activeTab === "chats"
                        ? "chatbubbles-outline"
                        : "calendar-outline"
                    }
                    size={36}
                    color={T.faint}
                  />
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

            {/* Tip */}
            <View style={styles.tipRow}>
              <Ionicons name="sparkles" size={14} color={T.amber} />
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
  glowTop: { position: "absolute", top: 0, left: 0, right: 0, height: 260 },
  glowBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 160 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { alignItems: "center" },
  eyebrow: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.pink,
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    marginTop: 1,
  },
  likesBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: "rgba(255,75,129,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  likesDot: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: T.pink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: T.bg,
  },
  likesDotText: { fontSize: 9, fontFamily: VibeFonts.bold, color: "#fff" },
  scroll: { paddingHorizontal: 16, paddingBottom: 110, paddingTop: 4 },

  heroCard: { marginBottom: 14, borderRadius: 22, overflow: "hidden" },
  heroGrad: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,75,129,0.28)",
  },
  heroCopy: { flex: 1, paddingRight: 10 },
  heroTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.4,
  },
  heroSub: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    lineHeight: 18,
  },
  heroOrb: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "rgba(255,75,129,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,75,129,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  searchRow: { marginBottom: 14 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    padding: 0,
  },

  emptyCard: {
    backgroundColor: T.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: T.border,
    padding: 28,
    alignItems: "center",
    marginTop: 8,
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
    paddingVertical: 13,
    borderRadius: 16,
  },
  ctaText: { color: "#fff", fontFamily: VibeFonts.bold, fontSize: 14 },

  segmentWrap: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  segmentSlot: { flex: 1 },
  segmentActive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
  },
  segmentActiveText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },
  segmentIdle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  segmentIdleText: {
    color: T.faint,
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },
  segBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.35)",
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
    marginTop: 4,
  },
  listTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: T.ink,
    flex: 1,
  },
  countPill: {
    backgroundColor: "rgba(168,85,247,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.35)",
  },
  countText: { fontSize: 11, fontFamily: VibeFonts.bold, color: T.purple },

  listCard: {
    backgroundColor: T.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
    marginBottom: 14,
  },
  emptyList: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyListText: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.faint,
    textAlign: "center",
    lineHeight: 19,
  },

  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#FBBF24",
    lineHeight: 15,
  },
});
