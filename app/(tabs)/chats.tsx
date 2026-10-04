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
import MatchStrip from "../../components/chats/MatchStrip";
import ChatLogItem from "../../components/chats/ChatLogItem";
import CreateGroupModal from "../../components/chats/CreateGroupModal";
import { useMatches } from "../../context/MatchesContext";
import { MatchProfile } from "../../constants/matches";
import { VibeFonts } from "../../constants/vibeTheme";
import HomeHeader from "../../components/HomeHeader";

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matches, conversations } = useMatches();
  const [activeTab, setActiveTab] = useState<"chats" | "hangouts">("chats");
  const [query, setQuery] = useState("");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  const openChat = (matchId: string) => router.push(`/chat/${matchId}`);
  const openMatch = (m: MatchProfile) => openChat(m.id);

  // New Matches: Matches with whom no messages have been exchanged yet
  const newMatches = useMemo(() => {
    return matches.filter((m) => {
      const thread = conversations.find((t) => t.matchId === m.id);
      return !thread || !thread.messages || thread.messages.length === 0;
    });
  }, [matches, conversations]);

  const filteredNewMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return newMatches;
    return newMatches.filter((m) => m.name.toLowerCase().includes(q));
  }, [newMatches, query]);

  const filteredThreads = useMemo(() => {
    const base = conversations.filter((thread) => {
      if (activeTab === "chats") {
        if (thread.isGroup) return false;
        // Direct messages: only show chats where messaging has occurred
        return Boolean(thread.messages && thread.messages.length > 0);
      }
      return thread.isGroup === true;
    });
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (t) =>
        t.matchName.toLowerCase().includes(q) ||
        t.lastMessage.toLowerCase().includes(q)
    );
  }, [conversations, activeTab, query]);

  const directUnread = conversations
    .filter((t) => !t.isGroup && t.messages && t.messages.length > 0)
    .reduce((sum, t) => sum + t.unread, 0);
  const hangoutUnread = conversations
    .filter((t) => t.isGroup)
    .reduce((sum, t) => sum + t.unread, 0);


  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070A14" />

      {/* Header */}
      <HomeHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 95 },
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
              color="#22D3EE"
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name or message…"
              placeholderTextColor="#64748B"
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={19} color="#64748B" />
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

        {/* Mode Switcher Tabs */}
        <Animated.View
          entering={FadeInDown.delay(70).duration(380)}
          style={styles.modeSwitcherTrack}
        >
          {/* Direct DMs Tab */}
          <Pressable
            onPress={() => setActiveTab("chats")}
            style={[styles.modeSwitcherBtn]}
          >
            {activeTab === "chats" ? (
              <LinearGradient
                colors={["#D4F72C", "#22D3EE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activeTabGrad}
              >
                <Ionicons name="chatbubble-ellipses" size={15} color="#070A14" />
                <Text style={styles.modeSwitcherTextActive}>Direct DMs</Text>
                {directUnread > 0 ? (
                  <View style={styles.segBadgeDark}>
                    <Text style={styles.segBadgeDarkText}>{directUnread}</Text>
                  </View>
                ) : null}
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTabContent}>
                <Ionicons name="chatbubble-ellipses" size={15} color="#94A3B8" />
                <Text style={styles.modeSwitcherText}>Direct DMs</Text>
                {directUnread > 0 ? (
                  <View style={styles.segBadge}>
                    <Text style={styles.segBadgeText}>{directUnread}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </Pressable>

          {/* Groups Tab */}
          <Pressable
            onPress={() => setActiveTab("hangouts")}
            style={[styles.modeSwitcherBtn]}
          >
            {activeTab === "hangouts" ? (
              <LinearGradient
                colors={["#D4F72C", "#22D3EE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activeTabGrad}
              >
                <Ionicons name="people" size={16} color="#070A14" />
                <Text style={styles.modeSwitcherTextActive}>Groups 👥</Text>
                {hangoutUnread > 0 ? (
                  <View style={styles.segBadgeDark}>
                    <Text style={styles.segBadgeDarkText}>{hangoutUnread}</Text>
                  </View>
                ) : null}
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTabContent}>
                <Ionicons name="people" size={16} color="#94A3B8" />
                <Text style={styles.modeSwitcherText}>Groups 👥</Text>
                {hangoutUnread > 0 ? (
                  <View style={styles.segBadge}>
                    <Text style={styles.segBadgeText}>{hangoutUnread}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </Pressable>
        </Animated.View>

            {/* Matches Strip - only shown when there are new matches */}
            {activeTab === "chats" && filteredNewMatches.length > 0 ? (
              <Animated.View entering={FadeInRight.delay(100).duration(400)}>
                <MatchStrip
                  matches={filteredNewMatches}
                  onPressMatch={openMatch}
                  onDiscover={() => router.push("/(tabs)/discover")}
                />
              </Animated.View>
            ) : null}

            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.sectionTitle}>
                  {activeTab === "chats" ? "Direct Messages 💬" : "Groups 👥"}
                </Text>
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{filteredThreads.length}</Text>
                </View>
              </View>
              {activeTab === "hangouts" && (
                <Pressable
                  style={styles.newGroupBtn}
                  onPress={() => setShowCreateGroupModal(true)}
                >
                  <LinearGradient
                    colors={["#D4F72C", "#22D3EE"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.newGroupBtnGrad}
                  >
                    <Ionicons name="add" size={16} color="#070A14" />
                    <Text style={styles.newGroupBtnText}>New Group</Text>
                  </LinearGradient>
                </Pressable>
              )}
            </View>

            {/* Threads List */}
            <View style={styles.listContainer}>
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
                <View style={styles.emptyListCard}>
                  <View style={styles.emptyListIcon}>
                    <Ionicons
                      name={
                        activeTab === "chats"
                          ? "chatbubbles-outline"
                          : "people-outline"
                      }
                      size={28}
                      color="#22D3EE"
                    />
                  </View>
                  <Text style={styles.emptyListText}>
                    {query
                      ? "No chats match your search"
                      : activeTab === "chats"
                      ? "No DMs yet — open a match above to say hello"
                      : "No groups yet — tap '+ New Group' to create your crew"}
                  </Text>
                  {activeTab === "hangouts" && !query ? (
                    <Pressable
                      style={styles.emptyCreateGroupBtn}
                      onPress={() => setShowCreateGroupModal(true)}
                    >
                      <LinearGradient
                        colors={["#D4F72C", "#22D3EE"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.emptyCreateGroupBtnGrad}
                      >
                        <Ionicons name="add-circle" size={16} color="#070A14" />
                        <Text style={styles.emptyCreateGroupBtnText}>Create a Group</Text>
                      </LinearGradient>
                    </Pressable>
                  ) : null}
                </View>
              )}
            </View>

            {/* Tip Banner matching My Crew bottom card */}
            <Animated.View
              entering={FadeInDown.delay(350).duration(400)}
              style={styles.tipBannerCard}
            >
              <LinearGradient
                colors={["rgba(15, 23, 42, 0.95)", "rgba(10, 15, 29, 0.98)"]}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.tipContentRow}>
                <View style={styles.tipIconGlow}>
                  <Ionicons name="sparkles" size={18} color="#D4F72C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tipHeaderTitle}>Vibe Pro Tip</Text>
                  <Text style={styles.tipBodyText}>
                    Say hello within 48h of matching to permanently unlock chat and plan your hangout!
                  </Text>
                </View>
              </View>
            </Animated.View>
      </ScrollView>

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={(groupId) => openChat(groupId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070A14",
  },
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
  scroll: {
    paddingTop: 8,
  },

  // Search
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1424",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: "#FFFFFF",
    padding: 0,
  },
  searchHint: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(34, 211, 238, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  searchHintText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#22D3EE",
  },

  // Mode Switcher
  modeSwitcherTrack: {
    flexDirection: "row",
    backgroundColor: "rgba(13, 20, 36, 0.85)",
    borderRadius: 18,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  modeSwitcherBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  activeTabGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
  },
  inactiveTabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  modeSwitcherText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#94A3B8",
  },
  modeSwitcherTextActive: {
    color: "#070A14",
    fontFamily: VibeFonts.extraBold,
    fontSize: 13,
  },
  segBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  segBadgeText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  segBadgeDark: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(7, 10, 20, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  segBadgeDarkText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#070A14",
  },

  // Empty Card
  emptyCard: {
    backgroundColor: "#0D1424",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 28,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  emptySub: {
    fontSize: 13,
    fontFamily: VibeFonts.regular,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
  },
  ctaText: {
    color: "#070A14",
    fontFamily: VibeFonts.bold,
    fontSize: 14,
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  countPill: {
    backgroundColor: "rgba(34, 211, 238, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#22D3EE",
  },

  // Thread list
  listContainer: {
    paddingHorizontal: 16,
  },
  emptyListCard: {
    backgroundColor: "#0D1424",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyListIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyListText: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },

  // Tip Banner Card
  tipBannerCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1.2,
    borderColor: "rgba(34, 211, 238, 0.25)",
    backgroundColor: "#0B132B",
  },
  tipContentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  tipIconGlow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(212, 247, 44, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  tipHeaderTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#D4F72C",
  },
  tipBodyText: {
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    color: "#94A3B8",
    marginTop: 2,
    lineHeight: 17,
  },
  newGroupBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  newGroupBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 4,
  },
  newGroupBtnText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#070A14",
  },
  emptyCreateGroupBtn: {
    marginTop: 14,
    borderRadius: 14,
    overflow: "hidden",
  },
  emptyCreateGroupBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  emptyCreateGroupBtnText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#070A14",
  },
});
