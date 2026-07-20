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
import { VibeColors, VibeFonts } from "../constants/vibeTheme";
import { Radius, Spacing } from "../constants/theme";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - Spacing.lg * 3.5) / 2;

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
      <StatusBar style="light" />

      <PremiumScreen
        title="My Matches 💖"
        subtitle={activeTab === "matches" ? `${matches.length} matched connections` : `${likesList.length} pending likes`}
        onBack={() => router.back()}
        heroImage="https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&fit=crop&q=80"
      >
        {/* Custom Segmented Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === "matches" && styles.tabItemActive]}
            onPress={() => setActiveTab("matches")}
          >
            <Ionicons name="heart" size={15} color={activeTab === "matches" ? "#fff" : "#A7A7AF"} />
            <Text style={[styles.tabText, activeTab === "matches" && styles.tabTextActive]}>
              Matches ({matches.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === "likes" && styles.tabItemActive]}
            onPress={() => setActiveTab("likes")}
          >
            <Ionicons name="lock-closed" size={14} color={activeTab === "likes" ? "#D4AF37" : "#A7A7AF"} />
            <Text style={[styles.tabText, activeTab === "likes" && styles.tabTextActive]}>
              Likes Received ({likesList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "matches" ? (
          matches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Animated.View entering={ZoomIn.duration(500)} style={styles.emptyCardWrap}>
                <GlassCard style={styles.emptyCard}>
                  <Ionicons name="heart-dislike-outline" size={60} color="#FF4B81" style={{ marginBottom: 16 }} />
                  <Text style={styles.emptyTitle}>No matches yet</Text>
                  <Text style={styles.emptyDesc}>
                    Swipe right on the dating feed. When someone likes you back, it's a match!
                  </Text>
                  <Pressable onPress={() => router.push("/(tabs)/discover")}>
                    <LinearGradient
                      colors={["#8A56FF", "#FF4B81"]}
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
                Your matched profiles. Click to view details or start a chat! ⚡
              </Text>

              <View style={styles.grid}>
                {matches.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.delay(index * 60).springify().damping(12)}
                    style={styles.cardWrap}
                  >
                    <Pressable
                      style={styles.matchCard}
                      onPress={() => setSelectedMatch(item)}
                    >
                      <Image source={{ uri: item.avatarUrl }} style={styles.cardImage} />
                      <LinearGradient
                        colors={["transparent", "rgba(5,5,8,0.95)"]}
                        style={styles.cardGradient}
                      />

                      <View style={styles.cardDetails}>
                        <View style={styles.nameAgeRow}>
                          <Text style={styles.cardName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {item.age && (
                            <Text style={styles.cardAge}>, {item.age}</Text>
                          )}
                        </View>
                        
                        <View style={styles.cityRow}>
                          <Ionicons name="location" size={11} color="#C084FC" />
                          <Text style={styles.cardCity} numberOfLines={1}>
                            {item.city || "Nagpur"}
                          </Text>
                        </View>

                        {item.isVerified && (
                          <View style={styles.verifiedRow}>
                            <Ionicons name="checkmark-circle" size={12} color="#8A56FF" />
                            <Text style={styles.verifiedText}>Verified</Text>
                          </View>
                        )}
                      </View>

                      {item.isOnline && (
                        <View style={styles.activePill}>
                          <View style={styles.pulseDot} />
                          <Text style={styles.activeText}>Active</Text>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </View>
          )
        ) : (
          likesList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Animated.View entering={ZoomIn.duration(500)} style={styles.emptyCardWrap}>
                <GlassCard style={styles.emptyCard}>
                  <Ionicons name="lock-closed" size={60} color="#D4AF37" style={{ marginBottom: 16 }} />
                  <Text style={styles.emptyTitle}>No pending likes</Text>
                  <Text style={styles.emptyDesc}>
                    Keep swiping! When users find you on Discover and like you, their locked profiles will appear here.
                  </Text>
                  <Pressable onPress={() => router.push("/(tabs)/discover")}>
                    <LinearGradient
                      colors={["#8A56FF", "#FF4B81"]}
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
                These users liked you! Swipe right on them inside Discover to unlock the match instantly. 🔒
              </Text>

              <View style={styles.grid}>
                {likesList.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.delay(index * 60).springify().damping(12)}
                    style={styles.cardWrap}
                  >
                    <Pressable
                      style={styles.matchCard}
                      onPress={() => setLockedModalProfile(item)}
                    >
                      <View style={{ width: "100%", height: "100%", overflow: "hidden", backgroundColor: "#0D0B18" }}>
                        <Image source={{ uri: item.avatarUrl }} style={[styles.cardImage, { opacity: 0.15 }]} />
                        <BlurView intensity={98} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(13,11,24,0.75)" }} />
                      </View>

                      <View style={styles.lockOverlayContainer}>
                        <Ionicons name="lock-closed" size={22} color="#D4AF37" />
                        <Text style={styles.lockOverlayText}>Swipe to Reveal</Text>
                      </View>

                      <LinearGradient
                        colors={["transparent", "rgba(5,5,8,0.95)"]}
                        style={styles.cardGradient}
                      />

                      <View style={styles.cardDetails}>
                        <View style={styles.nameAgeRow}>
                          <Text style={styles.cardName} numberOfLines={1}>
                            {maskName(item.name)}
                          </Text>
                          {item.age && (
                            <Text style={styles.cardAge}>, {item.age}</Text>
                          )}
                        </View>
                        
                        <View style={styles.cityRow}>
                          <Ionicons name="location" size={11} color="rgba(255,255,255,0.4)" />
                          <Text style={[styles.cardCity, { color: "rgba(255,255,255,0.4)" }]} numberOfLines={1}>
                            Nagpur
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </View>
          )
        )}
      </PremiumScreen>

      {/* Main Tabbar Navigation Footer */}
      <TabBar />

      {/* MATCH DETAILS MODAL SHEET */}
      <Modal
        visible={!!selectedMatch}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMatch(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.dismissOverlay} onPress={() => setSelectedMatch(null)} />
          
          <Animated.View entering={FadeInDown.duration(300)} style={styles.modalSheet}>
            {selectedMatch && (
              <>
                {/* Profile Image View */}
                <View style={styles.modalImageContainer}>
                  <Image source={{ uri: selectedMatch.avatarUrl }} style={styles.modalImage} />
                  <LinearGradient
                    colors={["rgba(8,8,14,0.3)", "transparent", "rgba(8,8,14,0.95)"]}
                    style={styles.modalImageGradient}
                  />

                  {/* Close Modal Button */}
                  <Pressable style={styles.closeModalBtn} onPress={() => setSelectedMatch(null)}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </Pressable>

                  {/* Absolute Profile title */}
                  <View style={styles.modalTitleDetails}>
                    <View style={styles.modalNameRow}>
                      <Text style={styles.modalName}>{selectedMatch.name}</Text>
                      {selectedMatch.age && <Text style={styles.modalAge}>, {selectedMatch.age}</Text>}
                      {selectedMatch.isVerified && (
                        <Ionicons name="checkmark-circle" size={18} color="#C084FC" style={{ marginLeft: 6 }} />
                      )}
                    </View>

                    <View style={styles.modalCityRow}>
                      <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.modalCity}>{selectedMatch.city || "Nagpur"}</Text>
                    </View>
                  </View>
                </View>

                {/* Details Scroll Section */}
                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  {/* Bio */}
                  {selectedMatch.bio && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>About Me</Text>
                      <GlassCard style={styles.bioCard}>
                        <Text style={styles.bioText}>{selectedMatch.bio}</Text>
                      </GlassCard>
                    </View>
                  )}

                  {/* Interests */}
                  {selectedMatch.interests && selectedMatch.interests.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>Interests</Text>
                      <View style={styles.interestsGrid}>
                        {selectedMatch.interests.map((interest: any, i: number) => (
                          <View
                            key={i}
                            style={[
                              styles.interestBadge,
                              { backgroundColor: `${interest.color || "#8A56FF"}20`, borderColor: `${interest.color || "#8A56FF"}40` }
                            ]}
                          >
                            <Text style={[styles.interestText, { color: interest.color || "#C084FC" }]}>
                              {interest.name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Bottom Action Footer */}
                <SafeAreaView edges={["bottom"]} style={styles.modalFooter}>
                  <Pressable onPress={() => handleOpenChat(selectedMatch.id)} style={styles.chatBtnWrap}>
                    <LinearGradient
                      colors={["#8A56FF", "#FF4B81"]}
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
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* LOCKED LIKES PROFILE MODAL */}
      <Modal
        visible={!!lockedModalProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setLockedModalProfile(null)}
      >
        <View style={styles.lockedOverlay}>
          <Pressable style={styles.dismissOverlay} onPress={() => setLockedModalProfile(null)} />
          <Animated.View entering={ZoomIn.duration(400).springify()} style={styles.lockedCard}>
            <LinearGradient colors={["#1c102c", "#0d0b16"]} style={styles.lockedCardInner}>
              <View style={styles.lockedIconCircle}>
                <Ionicons name="lock-closed" size={32} color="#D4AF37" />
              </View>

              <Text style={styles.lockedModalTitle}>Match is Locked! 🔒</Text>
              
              <Text style={styles.lockedModalSub}>
                Someone special from Nagpur liked your profile! Find them inside the Discover feed to match and unlock.
              </Text>

              <Pressable
                onPress={() => {
                  setLockedModalProfile(null);
                  router.push("/(tabs)/discover");
                }}
                style={{ width: "100%" }}
              >
                <LinearGradient
                  colors={["#8A56FF", "#FF4B81"]}
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
  root: { flex: 1, backgroundColor: VibeColors.bg },
  gridContainer: { flex: 1 },
  subtitle: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: VibeColors.textMuted,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },

  // Grid list styling
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
    borderRadius: Radius.xl,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
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
  cardCity: { fontSize: 10, fontFamily: VibeFonts.medium, color: VibeColors.textMuted, flex: 1 },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  verifiedText: { fontSize: 9, fontFamily: VibeFonts.bold, color: "#C084FC" },

  activePill: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
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
    backgroundColor: VibeColors.neonGreen,
  },
  activeText: { color: VibeColors.neonGreenDim, fontSize: 8, fontFamily: VibeFonts.bold },

  // Empty placeholder
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 40 },
  emptyCardWrap: { width: "100%" },
  emptyCard: { padding: Spacing.xl, alignItems: "center" },
  emptyTitle: { fontSize: 18, fontFamily: VibeFonts.bold, color: "#fff", marginTop: Spacing.sm },
  emptyDesc: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: VibeColors.textMuted,
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

  // Modal Details Sheet
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  dismissOverlay: { ...StyleSheet.absoluteFillObject },
  modalSheet: {
    backgroundColor: "#08080C",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    width: "100%",
    borderWidth: 1,
    borderColor: VibeColors.bgGlassBorder,
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
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
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
    color: VibeColors.textGold,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  bioCard: { padding: 12, borderRadius: Radius.md },
  bioText: { fontSize: 13, fontFamily: VibeFonts.medium, color: VibeColors.text, lineHeight: 20 },
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
    backgroundColor: "#08080C",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
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

  // Custom segmented tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 4,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  tabItemActive: {
    backgroundColor: "rgba(138, 86, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(138, 86, 255, 0.4)",
  },
  tabText: {
    color: "#A7A7AF",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  tabTextActive: {
    color: "#fff",
  },

  // Locked Modal styling
  lockedOverlay: {
    flex: 1,
    backgroundColor: "rgba(5,5,8,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  lockedCard: {
    width: "100%",
    borderRadius: Radius.xxl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  lockedCardInner: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  lockedIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(212, 175, 55, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  lockedModalTitle: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    marginBottom: 8,
  },
  lockedModalSub: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: VibeColors.textMuted,
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
    color: "rgba(255,255,255,0.5)",
    fontFamily: VibeFonts.bold,
    fontSize: 13,
  },
  lockOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    paddingBottom: 20,
  },
  lockOverlayText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    marginTop: 6,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 3,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
});
