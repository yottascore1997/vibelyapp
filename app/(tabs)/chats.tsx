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
import HangoutCinematicBackground from "../../components/vibe/HangoutCinematicBackground";
import MatchStrip from "../../components/chats/MatchStrip";
import ChatLogItem from "../../components/chats/ChatLogItem";
import { useMatches } from "../../context/MatchesContext";
import { MatchProfile } from "../../constants/matches";
import { VibeFonts } from "../../constants/vibeTheme";

/** Match Hangout — dark navy + premium multi-accent */
const T = {
  bg: "#070A14",
  card: "rgba(22, 26, 46, 0.94)",
  cardElevated: "rgba(28, 32, 54, 0.96)",
  ink: "#F4F6FB",
  muted: "#A7B0C4",
  faint: "#7C869C",
  border: "rgba(160, 170, 200, 0.16)",
  purple: "#A78BFA",
  purpleDeep: "#8B5CF6",
  purpleBright: "#C4B5FD",
  softPurple: "rgba(139, 92, 246, 0.18)",
  pink: "#F472B6",
  green: "#34D399",
  yellow: "#FBBF24",
  red: "#F87171",
  blue: "#60A5FA",
  cta: ["#7C3AED", "#A78BFA"] as const,
  promo: ["#6D28D9", "#8B5CF6", "#EC4899"] as const,
};

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matches, conversations } = useMatches();
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
      <HangoutCinematicBackground />
      <StatusBar barStyle="light-content" backgroundColor="#070A14" />
      <View style={styles.foreground}>
        <AppHeader
          variant="dark"
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
          </Animated.View>

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
                color={activeTab === "chats" ? "#FFFFFF" : T.muted}
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
                activeTab === "hangouts" && styles.modeSwitcherBtnActivePink,
              ]}
            >
              <Ionicons
                name="people"
                size={15}
                color={activeTab === "hangouts" ? "#FFFFFF" : T.muted}
              />
              <Text
                style={[
                  styles.modeSwitcherText,
                  activeTab === "hangouts" && styles.modeSwitcherTextActiveWhite,
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
                  colors={["#1A1530", "#151B2E"]}
                  style={styles.tipGrad}
                >
                  <View style={styles.tipIcon}>
                    <Ionicons name="sparkles" size={14} color="#FBBF24" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#070A14" },
  foreground: { flex: 1, zIndex: 1, backgroundColor: "transparent" },
  scroll: {
    paddingTop: 4,
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
    backgroundColor: T.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    padding: 0,
  },
  searchHint: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  searchHintText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.purpleBright,
  },

  modeSwitcherTrack: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 22, 38, 0.9)",
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
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
    backgroundColor: "#7C3AED",
  },
  modeSwitcherBtnActivePink: {
    backgroundColor: "#DB2777",
  },
  modeSwitcherText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: T.muted,
  },
  modeSwitcherTextActive: {
    color: "#FFFFFF",
    fontFamily: VibeFonts.extraBold,
  },
  modeSwitcherTextActiveWhite: {
    color: "#FFFFFF",
    fontFamily: VibeFonts.extraBold,
  },
  segBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.25)",
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
    backgroundColor: T.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: T.border,
    padding: 28,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 4,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 21,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
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
    color: T.ink,
  },
  countPill: {
    backgroundColor: T.softPurple,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.purpleBright,
  },

  listCard: {
    backgroundColor: T.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 16,
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
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyListText: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
    lineHeight: 20,
  },

  tipRow: {
    borderRadius: 18,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.28)",
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
    backgroundColor: "rgba(251, 191, 36, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: "#E2E8F0",
    lineHeight: 16,
  },
});
