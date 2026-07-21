import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  Modal,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import GlassCard from "../components/vibe/GlassCard";
import PremiumScreen from "../components/vibe/PremiumScreen";
import TabBar from "../components/TabBar";
import { useMatches } from "../context/MatchesContext";
import { VibeFonts } from "../constants/vibeTheme";
import { Radius, Spacing } from "../constants/theme";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - Spacing.lg * 3.5) / 2;

const T = {
  bg: "#EEE9F8",
  ink: "#1A1F36",
  muted: "#6B7280",
  faint: "#9CA3AF",
  card: "#FFFBFE",
  border: "#E4DFF0",
  softPurple: "#EDE7FF",
  purple: "#8B5CF6",
  purpleDeep: "#7C3AED",
  pink: "#EC4899",
  cta: ["#8B5CF6", "#EC4899"] as const,
  green: "#16A34A",
};

export default function MyMatchesScreen() {
  const router = useRouter();
  const { matches, likesList } = useMatches();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [lockedModalProfile, setLockedModalProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"matches" | "likes">("matches");

  const handleOpenChat = (matchId: string) => {
    setSelectedMatch(null);
    router.push(`/chat/${matchId}`);
  };

  const maskName = (name: string) => {
    if (!name) return "";
    const split = name.split(" ")[0];
    return split.length > 2 ? split.substring(0, 2) + "***" : split + "***";
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <PremiumScreen
        lightMode={true}
        title="My Matches"
        subtitle={
          activeTab === "matches"
            ? `${matches.length} matched connections`
            : `${likesList.length} pending likes`
        }
        onBack={() => router.back()}
        heroImage="https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&fit=crop&q=80"
      >
        {/* Segmented tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === "matches" && styles.tabItemActive]}
            onPress={() => setActiveTab("matches")}
            activeOpacity={0.85}
          >
            {activeTab === "matches" ? (
              <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.tabItemFill}>
                <Ionicons name="heart" size={15} color="#fff" />
                <Text style={styles.tabTextActive}>Matches ({matches.length})</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabItemFill}>
                <Ionicons name="heart" size={15} color={T.faint} />
                <Text style={styles.tabText}>Matches ({matches.length})</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === "likes" && styles.tabItemActive]}
            onPress={() => setActiveTab("likes")}
            activeOpacity={0.85}
          >
            {activeTab === "likes" ? (
              <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.tabItemFill}>
                <Ionicons name="lock-closed" size={14} color="#fff" />
                <Text style={styles.tabTextActive}>Likes ({likesList.length})</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabItemFill}>
                <Ionicons name="lock-closed" size={14} color={T.faint} />
                <Text style={styles.tabText}>Likes ({likesList.length})</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {activeTab === "matches" ? (
          matches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Animated.View entering={ZoomIn.duration(500)} style={styles.emptyCardWrap}>
                <GlassCard lightMode style={styles.emptyCard}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="heart-dislike-outline" size={36} color={T.pink} />
                  </View>
                  <Text style={styles.emptyTitle}>No matches yet</Text>
                  <Text style={styles.emptyDesc}>
                    Swipe right on Discover. When someone likes you back, it&apos;s a match!
                  </Text>
                  <Pressable onPress={() => router.push("/(tabs)/discover")}>
                    <LinearGradient
                      colors={[...T.cta]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.discoverBtn}
                    >
                      <Ionicons name="compass" size={16} color="#fff" />
                      <Text style={styles.discoverBtnText}>Go to Discover</Text>
                    </LinearGradient>
                  </Pressable>
                </GlassCard>
              </Animated.View>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              <Text style={styles.subtitle}>
                Your matched profiles — tap to view details or start chatting.
              </Text>

              <View style={styles.grid}>
                {matches.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.delay(index * 60).springify().damping(12)}
                    style={styles.cardWrap}
                  >
                    <Pressable style={styles.matchCard} onPress={() => setSelectedMatch(item)}>
                      <Image source={{ uri: item.avatarUrl }} style={styles.cardImage} />
                      <LinearGradient
                        colors={["transparent", "rgba(26,31,54,0.92)"]}
                        style={styles.cardGradient}
                      />

                      <View style={styles.cardDetails}>
                        <View style={styles.nameAgeRow}>
                          <Text style={styles.cardName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {item.age ? <Text style={styles.cardAge}>, {item.age}</Text> : null}
                        </View>

                        <View style={styles.cityRow}>
                          <Ionicons name="location" size={11} color="#E9D5FF" />
                          <Text style={styles.cardCity} numberOfLines={1}>
                            {item.city || "Nagpur"}
                          </Text>
                        </View>

                        {item.isVerified ? (
                          <View style={styles.verifiedRow}>
                            <Ionicons name="checkmark-circle" size={12} color="#C4B5FD" />
                            <Text style={styles.verifiedText}>Verified</Text>
                          </View>
                        ) : null}
                      </View>

                      {item.isOnline ? (
                        <View style={styles.activePill}>
                          <View style={styles.pulseDot} />
                          <Text style={styles.activeText}>Active</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </View>
          )
        ) : likesList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Animated.View entering={ZoomIn.duration(500)} style={styles.emptyCardWrap}>
              <GlassCard lightMode style={styles.emptyCard}>
                <View style={[styles.emptyIconWrap, { backgroundColor: "#EDE7FF" }]}>
                  <Ionicons name="lock-closed" size={32} color={T.purple} />
                </View>
                <Text style={styles.emptyTitle}>No pending likes</Text>
                <Text style={styles.emptyDesc}>
                  Keep swiping! When someone likes you on Discover, their locked profile will show here.
                </Text>
                <Pressable onPress={() => router.push("/(tabs)/discover")}>
                  <LinearGradient
                    colors={[...T.cta]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.discoverBtn}
                  >
                    <Ionicons name="compass" size={16} color="#fff" />
                    <Text style={styles.discoverBtnText}>Go to Discover</Text>
                  </LinearGradient>
                </Pressable>
              </GlassCard>
            </Animated.View>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            <Text style={styles.subtitle}>
              These people liked you. Swipe right on them in Discover to unlock the match.
            </Text>

            <View style={styles.grid}>
              {likesList.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(index * 60).springify().damping(12)}
                  style={styles.cardWrap}
                >
                  <Pressable style={styles.matchCard} onPress={() => setLockedModalProfile(item)}>
                    <View style={styles.lockedImageWrap}>
                      <Image
                        source={{ uri: item.avatarUrl }}
                        style={[styles.cardImage, { opacity: 0.2 }]}
                      />
                      <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
                      <View style={styles.lockedScrim} />
                    </View>

                    <View style={styles.lockOverlayContainer}>
                      <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={18} color={T.purpleDeep} />
                      </View>
                      <Text style={styles.lockOverlayText}>Swipe to reveal</Text>
                    </View>

                    <LinearGradient
                      colors={["transparent", "rgba(26,31,54,0.88)"]}
                      style={styles.cardGradient}
                    />

                    <View style={styles.cardDetails}>
                      <View style={styles.nameAgeRow}>
                        <Text style={styles.cardName} numberOfLines={1}>
                          {maskName(item.name)}
                        </Text>
                        {item.age ? <Text style={styles.cardAge}>, {item.age}</Text> : null}
                      </View>

                      <View style={styles.cityRow}>
                        <Ionicons name="location" size={11} color="rgba(255,255,255,0.45)" />
                        <Text style={[styles.cardCity, { color: "rgba(255,255,255,0.45)" }]} numberOfLines={1}>
                          Nagpur
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>
        )}
      </PremiumScreen>

      <TabBar dark={false} />

      {/* Match details sheet */}
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
                <View style={styles.modalImageContainer}>
                  <Image source={{ uri: selectedMatch.avatarUrl }} style={styles.modalImage} />
                  <LinearGradient
                    colors={["rgba(26,31,54,0.2)", "transparent", "rgba(26,31,54,0.92)"]}
                    style={styles.modalImageGradient}
                  />

                  <Pressable style={styles.closeModalBtn} onPress={() => setSelectedMatch(null)}>
                    <Ionicons name="close" size={22} color={T.ink} />
                  </Pressable>

                  <View style={styles.modalTitleDetails}>
                    <View style={styles.modalNameRow}>
                      <Text style={styles.modalName}>{selectedMatch.name}</Text>
                      {selectedMatch.age ? (
                        <Text style={styles.modalAge}>, {selectedMatch.age}</Text>
                      ) : null}
                      {selectedMatch.isVerified ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#C4B5FD"
                          style={{ marginLeft: 6 }}
                        />
                      ) : null}
                    </View>

                    <View style={styles.modalCityRow}>
                      <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.75)" />
                      <Text style={styles.modalCity}>{selectedMatch.city || "Nagpur"}</Text>
                    </View>
                  </View>
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  {selectedMatch.bio ? (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>About Me</Text>
                      <GlassCard lightMode style={styles.bioCard}>
                        <Text style={styles.bioText}>{selectedMatch.bio}</Text>
                      </GlassCard>
                    </View>
                  ) : null}

                  {selectedMatch.interests && selectedMatch.interests.length > 0 ? (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>Interests</Text>
                      <View style={styles.interestsGrid}>
                        {selectedMatch.interests.map((interest: any, i: number) => (
                          <View
                            key={i}
                            style={[
                              styles.interestBadge,
                              {
                                backgroundColor: `${interest.color || T.purple}18`,
                                borderColor: `${interest.color || T.purple}40`,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.interestText,
                                { color: interest.color || T.purpleDeep },
                              ]}
                            >
                              {interest.name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </ScrollView>

                <SafeAreaView edges={["bottom"]} style={styles.modalFooter}>
                  <Pressable onPress={() => handleOpenChat(selectedMatch.id)} style={styles.chatBtnWrap}>
                    <LinearGradient
                      colors={[...T.cta]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.chatGradientBtn}
                    >
                      <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                      <Text style={styles.chatGradientBtnText}>Send Message & Chat</Text>
                    </LinearGradient>
                  </Pressable>
                </SafeAreaView>
              </>
            ) : null}
          </Animated.View>
        </View>
      </Modal>

      {/* Locked likes modal */}
      <Modal
        visible={!!lockedModalProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setLockedModalProfile(null)}
      >
        <View style={styles.lockedOverlay}>
          <Pressable style={styles.dismissOverlay} onPress={() => setLockedModalProfile(null)} />
          <Animated.View entering={ZoomIn.duration(400).springify()} style={styles.lockedCard}>
            <LinearGradient colors={["#FFFFFF", "#F8F4FF"]} style={styles.lockedCardInner}>
              <View style={styles.lockedIconCircle}>
                <Ionicons name="lock-closed" size={28} color={T.purple} />
              </View>

              <Text style={styles.lockedModalTitle}>Match is Locked</Text>

              <Text style={styles.lockedModalSub}>
                Someone from Nagpur liked your profile. Find them in Discover to match and unlock.
              </Text>

              <Pressable
                onPress={() => {
                  setLockedModalProfile(null);
                  router.push("/(tabs)/discover");
                }}
                style={{ width: "100%" }}
              >
                <LinearGradient
                  colors={[...T.cta]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.lockedActionBtn}
                >
                  <Ionicons name="compass" size={18} color="#fff" />
                  <Text style={styles.lockedActionBtnText}>Go to Discover Feed</Text>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => setLockedModalProfile(null)} style={{ marginTop: 16 }}>
                <Text style={styles.lockedCloseText}>Cancel</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  gridContainer: { flex: 1 },
  subtitle: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  cardWrap: { width: CARD_WIDTH, marginBottom: Spacing.sm },
  matchCard: {
    width: "100%",
    height: 230,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: T.purple,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardImage: { width: "100%", height: "100%", resizeMode: "cover" },
  cardGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  cardDetails: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    gap: 3,
  },
  nameAgeRow: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap" },
  cardName: { fontSize: 14, fontFamily: VibeFonts.bold, color: "#fff" },
  cardAge: { fontSize: 13, fontFamily: VibeFonts.bold, color: "#fff" },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardCity: { fontSize: 10, fontFamily: VibeFonts.medium, color: "rgba(255,255,255,0.75)", flex: 1 },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  verifiedText: { fontSize: 9, fontFamily: VibeFonts.bold, color: "#C4B5FD" },

  activePill: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(22,163,74,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.green,
  },
  activeText: { color: T.green, fontSize: 8, fontFamily: VibeFonts.bold },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 40 },
  emptyCardWrap: { width: "100%" },
  emptyCard: { padding: Spacing.xl, alignItems: "center" },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FCE7F3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontFamily: VibeFonts.bold, color: T.ink, marginTop: Spacing.sm },
  emptyDesc: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 20,
  },
  discoverBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  discoverBtnText: { color: "#fff", fontFamily: VibeFonts.bold, fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(26,31,54,0.45)", justifyContent: "flex-end" },
  dismissOverlay: { ...StyleSheet.absoluteFillObject },
  modalSheet: {
    backgroundColor: T.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    width: "100%",
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  modalImageContainer: { width: "100%", height: 350 },
  modalImage: { width: "100%", height: "100%", resizeMode: "cover" },
  modalImageGradient: { ...StyleSheet.absoluteFillObject },
  closeModalBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  modalTitleDetails: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    gap: 6,
  },
  modalNameRow: { flexDirection: "row", alignItems: "center" },
  modalName: { fontSize: 24, fontFamily: VibeFonts.extraBold, color: "#fff" },
  modalAge: { fontSize: 24, fontFamily: VibeFonts.extraBold, color: "#fff" },
  modalCityRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  modalCity: { fontSize: 13, fontFamily: VibeFonts.medium, color: "rgba(255,255,255,0.75)" },

  modalScroll: { paddingHorizontal: 24, paddingVertical: 20, flexGrow: 1 },
  detailSection: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.purpleDeep,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  bioCard: { padding: 12, borderRadius: Radius.md },
  bioText: { fontSize: 13, fontFamily: VibeFonts.medium, color: T.ink, lineHeight: 20 },
  interestsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  interestText: { fontSize: 11, fontFamily: VibeFonts.bold },

  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: Spacing.md,
    backgroundColor: T.card,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  chatBtnWrap: { borderRadius: Radius.xl, overflow: "hidden", width: "100%" },
  chatGradientBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  chatGradientBtnText: { color: "#fff", fontSize: 14, fontFamily: VibeFonts.bold },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: T.card,
    padding: 4,
    borderRadius: 16,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: T.purple,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tabItem: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  tabItemActive: {},
  tabItemFill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabText: {
    color: T.faint,
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  tabTextActive: {
    color: "#fff",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },

  lockedOverlay: {
    flex: 1,
    backgroundColor: "rgba(26,31,54,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  lockedCard: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: T.purple,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  lockedCardInner: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  lockedIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: T.softPurple,
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  lockedModalTitle: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    marginBottom: 8,
  },
  lockedModalSub: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  lockedActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.xl,
  },
  lockedActionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },
  lockedCloseText: {
    color: T.muted,
    fontFamily: VibeFonts.bold,
    fontSize: 13,
  },
  lockedImageWrap: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: T.softPurple,
  },
  lockedScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(238,233,248,0.55)",
  },
  lockOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    paddingBottom: 20,
  },
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.purple,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  lockOverlayText: {
    color: T.ink,
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: T.border,
  },
});
