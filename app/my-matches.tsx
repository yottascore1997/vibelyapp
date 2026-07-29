import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Dimensions,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useMatches } from "../context/MatchesContext";
import { VibeFonts } from "../constants/vibeTheme";
import { Radius, Spacing } from "../constants/theme";
import TabBar from "../components/TabBar";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 44) / 2;

/** Clean light minimal aesthetic matching Hangout screen design tokens */
const T = {
  bg: "#F8F9FD",
  card: "#FFFFFF",
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
  cta: ["#7C3AED", "#8B5CF6"] as const,
  heroGrad: ["#7C3AED", "#8B5CF6", "#EC4899"] as const,
};

const filterChips = [
  { key: "All", label: "All Matches", icon: "grid-outline" as const },
  { key: "Online", label: "Online Now ⚡", icon: "flash-outline" as const },
  { key: "Verified", label: "Verified 🛡️", icon: "checkmark-circle-outline" as const },
];

export default function MyMatchesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matches, likesList } = useMatches();

  const [activeTab, setActiveTab] = useState<"matches" | "likes">("matches");
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [lockedModalProfile, setLockedModalProfile] = useState<any>(null);

  // Filtered Matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      const matchSearch =
        !searchQuery ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.city && m.city.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (activeFilter === "Online") return m.isOnline;
      if (activeFilter === "Verified") return m.isVerified;

      return true;
    });
  }, [matches, searchQuery, activeFilter]);

  const handleOpenChat = (matchId: string) => {
    setSelectedMatch(null);
    router.push(`/chat/${matchId}`);
  };

  const maskName = (name: string) => {
    if (!name) return "Anonymous";
    const split = name.split(" ")[0];
    return split.length > 2 ? split.substring(0, 2) + "***" : split + "***";
  };

  const activeCount = useMemo(
    () => matches.filter((m) => m.isOnline).length,
    [matches]
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FD" />

      {/* Header bar matching Hangout Screen header style */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={T.ink} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>My Matches</Text>
            <Text style={styles.headerSubtitle}>
              {activeTab === "matches"
                ? `${matches.length} matches • ${activeCount} online now`
                : `${likesList.length} people liked your profile`}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.discoverNavBtn}
          onPress={() => router.push("/(tabs)/discover")}
          activeOpacity={0.8}
        >
          <LinearGradient colors={[...T.cta]} style={styles.discoverNavBtnGrad}>
            <Ionicons name="compass" size={14} color="#FFF" />
            <Text style={styles.discoverNavBtnText}>Discover</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
      >
        {/* Banner Hero Card — Hangout Style */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroBanner}>
          <LinearGradient
            colors={[...T.heroGrad]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBannerGrad}
          >
            <View style={styles.heroBannerContent}>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles" size={12} color="#FFF" />
                <Text style={styles.heroBadgeText}>VIBE MATCHES</Text>
              </View>

              <Text style={styles.heroTitle}>Your Connection Hub</Text>
              <Text style={styles.heroSub}>
                Start chatting with mutual matches or unlock people who swiped right on you.
              </Text>

              {/* Search Bar inside Hero */}
              <View style={styles.searchBarWrap}>
                <Ionicons name="search-outline" size={18} color={T.muted} style={{ marginLeft: 12 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search match by name or city..."
                  placeholderTextColor={T.faint}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")} style={{ paddingRight: 10 }}>
                    <Ionicons name="close-circle" size={18} color={T.faint} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Segmented Tab Switcher (Matches vs Likes) */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={styles.segmentedTab}
            onPress={() => setActiveTab("matches")}
            activeOpacity={0.85}
          >
            {activeTab === "matches" ? (
              <LinearGradient colors={[...T.cta]} style={styles.segmentedTabActive}>
                <Ionicons name="heart" size={15} color="#FFF" />
                <Text style={styles.segmentedTextActive}>Matches ({matches.length})</Text>
              </LinearGradient>
            ) : (
              <View style={styles.segmentedTabInactive}>
                <Ionicons name="heart-outline" size={15} color={T.muted} />
                <Text style={styles.segmentedTextInactive}>Matches ({matches.length})</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.segmentedTab}
            onPress={() => setActiveTab("likes")}
            activeOpacity={0.85}
          >
            {activeTab === "likes" ? (
              <LinearGradient colors={[...T.cta]} style={styles.segmentedTabActive}>
                <Ionicons name="lock-closed" size={14} color="#FFF" />
                <Text style={styles.segmentedTextActive}>Likes ({likesList.length})</Text>
              </LinearGradient>
            ) : (
              <View style={styles.segmentedTabInactive}>
                <Ionicons name="lock-closed-outline" size={14} color={T.muted} />
                <Text style={styles.segmentedTextInactive}>Likes ({likesList.length})</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Filter Chips Bar (only for Matches tab) */}
        {activeTab === "matches" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {filterChips.map((chip) => {
              const isActive = activeFilter === chip.key;
              return (
                <TouchableOpacity
                  key={chip.key}
                  style={[styles.chipBtn, isActive && styles.chipBtnActive]}
                  onPress={() => setActiveFilter(chip.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={chip.icon}
                    size={14}
                    color={isActive ? "#FFF" : T.muted}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Content Section */}
        {activeTab === "matches" ? (
          filteredMatches.length === 0 ? (
            <Animated.View entering={ZoomIn.duration(400)} style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="heart-dislike-outline" size={38} color={T.pink} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? "No matching profiles found" : "No matches yet"}
              </Text>
              <Text style={styles.emptyDesc}>
                {searchQuery
                  ? `No result for "${searchQuery}". Try a different name or clear search.`
                  : "Swipe right on profiles in Discover. When someone likes you back, your match will appear here!"}
              </Text>

              <TouchableOpacity
                style={{ marginTop: 16 }}
                onPress={() => router.push("/(tabs)/discover")}
                activeOpacity={0.88}
              >
                <LinearGradient colors={[...T.cta]} style={styles.emptyCtaBtn}>
                  <Ionicons name="compass" size={16} color="#FFF" />
                  <Text style={styles.emptyCtaText}>Go to Discover Feed</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={styles.grid}>
              {filteredMatches.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(index * 50).springify().damping(14)}
                  style={styles.cardWrap}
                >
                  <Pressable
                    style={styles.matchCard}
                    onPress={() => setSelectedMatch(item)}
                  >
                    <Image source={{ uri: item.avatarUrl }} style={styles.cardImage} />

                    <LinearGradient
                      colors={["transparent", "rgba(24,24,27,0.9)"]}
                      style={styles.cardGradient}
                    />

                    {/* Online status badge */}
                    {item.isOnline && (
                      <View style={styles.onlineBadge}>
                        <View style={styles.greenDot} />
                        <Text style={styles.onlineText}>Active</Text>
                      </View>
                    )}

                    {/* Verified badge */}
                    {item.isVerified && (
                      <View style={styles.verifiedTopBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#FFF" />
                        <Text style={styles.verifiedTopText}>Verified</Text>
                      </View>
                    )}

                    {/* Card details overlay */}
                    <View style={styles.cardDetails}>
                      <View style={styles.nameRow}>
                        <Text style={styles.cardName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.age ? <Text style={styles.cardAge}>, {item.age}</Text> : null}
                      </View>

                      <View style={styles.cityRow}>
                        <Ionicons name="location-outline" size={11} color="#CBD5E1" />
                        <Text style={styles.cardCity} numberOfLines={1}>
                          {item.city || "Nagpur"}
                        </Text>
                      </View>

                      {/* Quick Chat Action */}
                      <TouchableOpacity
                        style={styles.quickChatBtn}
                        onPress={() => handleOpenChat(item.id)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient colors={[...T.cta]} style={styles.quickChatGrad}>
                          <Ionicons name="chatbubble-ellipses" size={12} color="#FFF" />
                          <Text style={styles.quickChatText}>Chat Now</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )
        ) : likesList.length === 0 ? (
          <Animated.View entering={ZoomIn.duration(400)} style={styles.emptyWrap}>
            <View style={[styles.emptyIconCircle, { backgroundColor: T.softPurple }]}>
              <Ionicons name="lock-closed" size={34} color={T.purple} />
            </View>
            <Text style={styles.emptyTitle}>No pending likes</Text>
            <Text style={styles.emptyDesc}>
              Keep swiping on Discover feed! When someone likes your profile, their blurred profile card will show up here.
            </Text>

            <TouchableOpacity
              style={{ marginTop: 16 }}
              onPress={() => router.push("/(tabs)/discover")}
              activeOpacity={0.88}
            >
              <LinearGradient colors={[...T.cta]} style={styles.emptyCtaBtn}>
                <Ionicons name="compass" size={16} color="#FFF" />
                <Text style={styles.emptyCtaText}>Go to Discover Feed</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.grid}>
            {likesList.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 50).springify().damping(14)}
                style={styles.cardWrap}
              >
                <Pressable
                  style={styles.matchCard}
                  onPress={() => setLockedModalProfile(item)}
                >
                  <View style={styles.lockedImageWrap}>
                    <Image
                      source={{ uri: item.avatarUrl }}
                      style={[styles.cardImage, { opacity: 0.25 }]}
                    />
                    <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
                    <View style={styles.lockedScrim} />
                  </View>

                  <View style={styles.lockOverlayContainer}>
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={20} color={T.purple} />
                    </View>
                    <Text style={styles.lockOverlayText}>Tap to reveal</Text>
                  </View>

                  <LinearGradient
                    colors={["transparent", "rgba(24,24,27,0.85)"]}
                    style={styles.cardGradient}
                  />

                  <View style={styles.cardDetails}>
                    <View style={styles.nameRow}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {maskName(item.name)}
                      </Text>
                      {item.age ? <Text style={styles.cardAge}>, {item.age}</Text> : null}
                    </View>

                    <View style={styles.cityRow}>
                      <Ionicons name="location-outline" size={11} color="#94A3B8" />
                      <Text style={[styles.cardCity, { color: "#94A3B8" }]} numberOfLines={1}>
                        Nagpur
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      <TabBar dark={false} />

      {/* Match Detail Bottom Sheet Modal */}
      <Modal
        visible={!!selectedMatch}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMatch(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.dismissOverlay} onPress={() => setSelectedMatch(null)} />

          <Animated.View entering={FadeInDown.duration(300)} style={styles.modalSheet}>
            {selectedMatch ? (
              <>
                <View style={styles.modalCoverWrap}>
                  <Image source={{ uri: selectedMatch.avatarUrl }} style={styles.modalCoverImg} />
                  <LinearGradient
                    colors={["rgba(24,24,27,0.3)", "transparent", "rgba(24,24,27,0.92)"]}
                    style={StyleSheet.absoluteFill}
                  />

                  <TouchableOpacity
                    style={styles.closeModalBtn}
                    onPress={() => setSelectedMatch(null)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={20} color={T.ink} />
                  </TouchableOpacity>

                  <View style={styles.modalCoverDetails}>
                    <View style={styles.modalNameRow}>
                      <Text style={styles.modalName}>{selectedMatch.name}</Text>
                      {selectedMatch.age ? (
                        <Text style={styles.modalAge}>, {selectedMatch.age}</Text>
                      ) : null}
                      {selectedMatch.isVerified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#A78BFA"
                          style={{ marginLeft: 6 }}
                        />
                      )}
                    </View>

                    <View style={styles.modalCityRow}>
                      <Ionicons name="location" size={13} color="#E2E8F0" />
                      <Text style={styles.modalCity}>{selectedMatch.city || "Nagpur"}</Text>
                    </View>
                  </View>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {selectedMatch.bio ? (
                    <View style={styles.detailSec}>
                      <Text style={styles.secLabel}>ABOUT ME</Text>
                      <View style={styles.bioCard}>
                        <Text style={styles.bioText}>{selectedMatch.bio}</Text>
                      </View>
                    </View>
                  ) : null}

                  {selectedMatch.interests && selectedMatch.interests.length > 0 ? (
                    <View style={styles.detailSec}>
                      <Text style={styles.secLabel}>INTERESTS & VIBES</Text>
                      <View style={styles.interestsWrap}>
                        {selectedMatch.interests.map((interest: any, i: number) => (
                          <View key={i} style={styles.interestPill}>
                            <Text style={styles.interestPillText}>
                              {interest.name || interest}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    onPress={() => handleOpenChat(selectedMatch.id)}
                    style={{ width: "100%" }}
                    activeOpacity={0.88}
                  >
                    <LinearGradient colors={[...T.cta]} style={styles.modalChatBtn}>
                      <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
                      <Text style={styles.modalChatBtnText}>Start Conversation</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </Animated.View>
        </View>
      </Modal>

      {/* Locked Match Modal */}
      <Modal
        visible={!!lockedModalProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setLockedModalProfile(null)}
      >
        <View style={styles.lockedOverlay}>
          <Pressable style={styles.dismissOverlay} onPress={() => setLockedModalProfile(null)} />
          <Animated.View entering={ZoomIn.duration(350).springify()} style={styles.lockedCardModal}>
            <View style={styles.lockedCardInner}>
              <View style={styles.lockedIconCircle}>
                <Ionicons name="lock-closed" size={30} color={T.purple} />
              </View>

              <Text style={styles.lockedTitle}>Profile is Locked</Text>
              <Text style={styles.lockedSub}>
                Someone nearby liked your profile! Head over to Discover feed to find them and create a mutual match.
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setLockedModalProfile(null);
                  router.push("/(tabs)/discover");
                }}
                style={{ width: "100%" }}
                activeOpacity={0.88}
              >
                <LinearGradient colors={[...T.cta]} style={styles.lockedActionBtn}>
                  <Ionicons name="compass" size={16} color="#FFF" />
                  <Text style={styles.lockedActionBtnText}>Go to Discover Feed</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setLockedModalProfile(null)}
                style={{ marginTop: 14 }}
              >
                <Text style={styles.lockedCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#F8F9FD",
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.muted,
    marginTop: 1,
  },
  discoverNavBtn: {
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  discoverNavBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  discoverNavBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // Hero Banner Card
  heroBanner: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 4,
    shadowColor: T.purple,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  heroBannerGrad: {
    padding: 18,
  },
  heroBannerContent: {
    gap: 6,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
  },
  heroBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
    marginTop: 2,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 18,
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginTop: 8,
    height: 42,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.ink,
  },

  // Segmented Control
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 4,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: T.border,
  },
  segmentedTab: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  segmentedTabActive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
  },
  segmentedTabInactive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "transparent",
  },
  segmentedTextActive: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },
  segmentedTextInactive: {
    color: T.muted,
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },

  // Filter Chips
  filterScroll: {
    gap: 8,
    paddingBottom: 14,
  },
  chipBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: T.border,
  },
  chipBtnActive: {
    backgroundColor: T.purple,
    borderColor: T.purple,
  },
  chipText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.muted,
  },
  chipTextActive: {
    color: "#FFF",
  },

  // Grid & Cards
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrap: {
    width: CARD_WIDTH,
    marginBottom: 14,
  },
  matchCard: {
    width: "100%",
    height: 235,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: T.purple,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 130,
  },

  onlineBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.green,
  },
  onlineText: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: T.green,
  },

  verifiedTopBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(124,58,237,0.85)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  verifiedTopText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
  },

  cardDetails: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    gap: 3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  cardName: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
  },
  cardAge: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  cardCity: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "#E2E8F0",
    flex: 1,
  },
  quickChatBtn: {
    marginTop: 6,
    borderRadius: 12,
    overflow: "hidden",
  },
  quickChatGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
  },
  quickChatText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
  },

  // Empty State
  emptyWrap: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: T.border,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FCE7F3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  emptyDesc: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
  },
  emptyCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: Radius.full,
  },
  emptyCtaText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },

  // Modal Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(24,24,27,0.5)",
    justifyContent: "flex-end",
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    width: "100%",
    overflow: "hidden",
  },
  modalCoverWrap: {
    height: 280,
    width: "100%",
    position: "relative",
  },
  modalCoverImg: {
    width: "100%",
    height: "100%",
  },
  closeModalBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCoverDetails: {
    position: "absolute",
    bottom: 16,
    left: 20,
    right: 20,
    gap: 4,
  },
  modalNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalName: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
  },
  modalAge: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
  },
  modalCityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modalCity: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#E2E8F0",
  },
  modalBody: {
    padding: 20,
  },
  detailSec: {
    marginBottom: 16,
  },
  secLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
    color: T.purple,
    letterSpacing: 1,
    marginBottom: 8,
  },
  bioCard: {
    backgroundColor: "#F8F9FD",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  bioText: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    lineHeight: 20,
  },
  interestsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestPill: {
    backgroundColor: T.softPurple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  interestPillText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.purpleDeep,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: T.border,
    backgroundColor: "#FFFFFF",
  },
  modalChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
  },
  modalChatBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },

  // Locked Profile Modal & Card
  lockedImageWrap: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: T.softPurple,
  },
  lockedScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(248,249,253,0.6)",
  },
  lockOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    paddingBottom: 20,
  },
  lockBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  lockOverlayText: {
    color: T.ink,
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  lockedOverlay: {
    flex: 1,
    backgroundColor: "rgba(24,24,27,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  lockedCardModal: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: T.border,
    elevation: 6,
  },
  lockedCardInner: {
    padding: 22,
    alignItems: "center",
  },
  lockedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  lockedTitle: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    marginBottom: 6,
  },
  lockedSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
  lockedActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
  },
  lockedActionBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },
  lockedCancelText: {
    color: T.muted,
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },
});
