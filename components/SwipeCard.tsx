import React, { useRef, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Pressable, 
  Animated as RNAnimated, 
  PanResponder, 
  ScrollView,
  TouchableOpacity,
  Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import PulseDot from "./home/PulseDot";
import { VibeColors, VibeFonts } from "../constants/vibeTheme";
import { Colors, Radius, Spacing } from "../constants/theme";
import GlassCard from "./vibe/GlassCard";

interface Props {
  name: string;
  age: number;
  bio?: string;
  jobTitle?: string;
  company?: string;
  education?: string;
  city?: string;
  distance: number;
  avatarUrl: string;
  isVerified?: boolean;
  isOnline?: boolean;
  vibeMatch?: number;
  interests?: { name: string; color: string }[];
  photoIndex?: number;
  totalPhotos?: number;
  dark?: boolean;
  onPass?: () => void;
  onSuperLike?: () => void;
  onLike?: () => void;
}

export default function SwipeCard({
  name,
  age,
  bio,
  jobTitle,
  company,
  education,
  city,
  distance,
  avatarUrl,
  isVerified,
  isOnline,
  vibeMatch,
  interests = [],
  photoIndex = 1,
  totalPhotos = 12,
  dark = false,
  onPass,
  onSuperLike,
  onLike,
}: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const position = useRef(new RNAnimated.ValueXY()).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (event, gestureState) => {
        if (showDetails) return false;
        return Math.abs(gestureState.dx) > 7 || Math.abs(gestureState.dy) > 7;
      },
      onPanResponderMove: (event, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (event, gestureState) => {
        if (gestureState.dx > 120) {
          // Swipe Right (Like)
          RNAnimated.timing(position, {
            toValue: { x: 500, y: gestureState.dy },
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            onLike?.();
            position.setValue({ x: 0, y: 0 });
          });
        } else if (gestureState.dx < -120) {
          // Swipe Left (Pass)
          RNAnimated.timing(position, {
            toValue: { x: -500, y: gestureState.dy },
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            onPass?.();
            position.setValue({ x: 0, y: 0 });
          });
        } else {
          // Spring back to center
          RNAnimated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  const panStyle = {
    transform: [
      ...position.getTranslateTransform(),
      { rotate }
    ]
  };

  const likeOpacity = position.x.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-100, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const getInterestEmoji = (nameStr: string) => {
    const norm = nameStr.toLowerCase();
    if (norm.includes("coffee")) return "☕ ";
    if (norm.includes("travel")) return "✈️ ";
    if (norm.includes("music")) return "🎵 ";
    if (norm.includes("photo") || norm.includes("camera")) return "📷 ";
    if (norm.includes("art")) return "🎨 ";
    if (norm.includes("food") || norm.includes("cook")) return "🍕 ";
    if (norm.includes("sport") || norm.includes("fit")) return "🏸 ";
    return "";
  };

  const getTagBgStyle = (nameStr: string) => {
    const norm = nameStr.toLowerCase();
    if (norm.includes("coffee")) return { backgroundColor: "rgba(162, 115, 87, 0.4)", borderColor: "rgba(162, 115, 87, 0.65)" };
    if (norm.includes("travel")) return { backgroundColor: "rgba(59, 130, 246, 0.3)", borderColor: "rgba(59, 130, 246, 0.55)" };
    if (norm.includes("music")) return { backgroundColor: "rgba(168, 85, 247, 0.3)", borderColor: "rgba(168, 85, 247, 0.55)" };
    if (norm.includes("photo") || norm.includes("camera")) return { backgroundColor: "rgba(107, 114, 128, 0.4)", borderColor: "rgba(107, 114, 128, 0.65)" };
    return { backgroundColor: "rgba(255, 255, 255, 0.12)", borderColor: "rgba(255, 255, 255, 0.2)" };
  };

  const tags = interests.slice(0, 4);

  return (
    <View style={styles.wrapper}>
      {/* Animated swipe card container */}
      <RNAnimated.View 
        style={[styles.cardOuter, dark && styles.cardOuterDark, panStyle]}
        {...panResponder.panHandlers}
      >
        {dark ? (
          <LinearGradient colors={["#8A56FF", "#FF4B81"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.border} />
        ) : (
          <LinearGradient colors={["#C4B5FD", "#F9A8D4"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.border} />
        )}
        
        <View style={[styles.card, dark && styles.cardDark, !dark && styles.cardLight]}>
          <Pressable style={styles.pressableCard} onPress={() => setShowDetails(true)}>
            <Image source={{ uri: avatarUrl }} style={styles.image} />

            {/* DYNAMIC SWIPE DIRECTIONAL BADGE STAMPS */}
            <RNAnimated.View style={[styles.stampContainer, styles.likeStamp, { opacity: likeOpacity }]}>
              <Ionicons name="heart" size={20} color="#FF4B81" style={{ marginRight: 6 }} />
              <Text style={[styles.stampText, { color: "#FF4B81" }]}>LIKE</Text>
            </RNAnimated.View>
            <RNAnimated.View style={[styles.stampContainer, styles.nopeStamp, { opacity: nopeOpacity }]}>
              <Ionicons name="close" size={20} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={[styles.stampText, { color: "#64748B" }]}>PASS</Text>
            </RNAnimated.View>

            <View style={styles.topRow}>
              {isOnline ? (
                <View style={styles.onlineBadge}>
                  <View style={styles.greenPulseDot} />
                  <Text style={styles.onlineText}>Online</Text>
                </View>
              ) : (
                <View />
              )}
              <View style={styles.topRight}>
                {vibeMatch ? (
                  <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={styles.matchPill}>
                    <Text style={styles.matchPillText}>{vibeMatch}%</Text>
                  </LinearGradient>
                ) : null}
                <View style={styles.photoCount}>
                  <Ionicons name="camera-outline" size={11} color="#fff" />
                  <Text style={styles.photoCountText}>{photoIndex}/{totalPhotos}</Text>
                </View>
              </View>
            </View>

            <LinearGradient colors={["transparent", "rgba(5,5,8,0.92)"]} style={styles.overlay}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{name}, {age}</Text>
                {isVerified ? <Ionicons name="checkmark-circle" size={18} color="#3B82F6" /> : null}
              </View>

              {jobTitle ? (
                <Text style={styles.detail} numberOfLines={1}>{jobTitle}{company ? ` at ${company}` : ""}</Text>
              ) : null}

              <View style={styles.detailRow}>
                <Ionicons name="location" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.detail}>{city ? `${city} • ` : ""}{distance} km away</Text>
              </View>

              {education ? (
                <View style={styles.detailRow}>
                  <Ionicons name="school" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.detail}>{education}</Text>
                </View>
              ) : null}

              {tags.length > 0 ? (
                <View style={styles.tags}>
                  {tags.map((tag) => (
                    <View key={tag.name} style={[styles.tag, getTagBgStyle(tag.name)]}>
                      <Text style={styles.tagText}>{getInterestEmoji(tag.name)}{tag.name}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {bio ? (
                <View style={styles.bioPromptBox}>
                  <Text style={styles.bioText} numberOfLines={2}>{bio}</Text>
                </View>
              ) : null}
            </LinearGradient>
          </Pressable>

          {/* PROFILE DETAILS MODAL SHEET (Hangout Light Clean Theme) */}
          <Modal
            visible={showDetails}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDetails(false)}
          >
            <View style={styles.modalOverlay}>
              <Pressable style={styles.dismissOverlay} onPress={() => setShowDetails(false)} />
              
              <Animated.View entering={FadeInDown.duration(300)} style={styles.modalSheet}>
                {/* Profile Image Header */}
                <View style={styles.modalImageContainer}>
                  <Image source={{ uri: avatarUrl }} style={styles.modalImage} />
                  <LinearGradient
                    colors={["rgba(24,24,27,0.4)", "transparent", "#F8F9FD"]}
                    style={styles.modalImageGradient}
                  />

                  {/* Close Modal Button */}
                  <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowDetails(false)} activeOpacity={0.8}>
                    <Ionicons name="close" size={20} color="#18181B" />
                  </TouchableOpacity>

                  {/* Absolute Profile Title Banner */}
                  <View style={styles.modalTitleDetails}>
                    <View style={styles.modalNameRow}>
                      <Text style={styles.modalName}>{name}</Text>
                      {age && <Text style={styles.modalAge}>, {age}</Text>}
                      {isVerified && (
                        <Ionicons name="checkmark-circle" size={20} color="#7C3AED" style={{ marginLeft: 6 }} />
                      )}
                    </View>

                    <View style={styles.modalCityRow}>
                      <Ionicons name="location" size={14} color="#7C3AED" />
                      <Text style={styles.modalCity}>{city || "Nagpur"} • {distance} km away</Text>
                    </View>
                  </View>
                </View>

                {/* Details Scroll Section */}
                <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
                  {/* Overview Card */}
                  {(jobTitle || education || distance) && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>OVERVIEW</Text>
                      <View style={styles.lightCard}>
                        {jobTitle && (
                          <View style={[styles.modalDetailRow, { marginTop: 0 }]}>
                            <View style={styles.iconCircle}>
                              <Ionicons name="briefcase" size={15} color="#7C3AED" />
                            </View>
                            <Text style={styles.overviewText}>
                              {jobTitle}{company ? ` at ${company}` : ""}
                            </Text>
                          </View>
                        )}
                        <View style={styles.modalDetailRow}>
                          <View style={styles.iconCircle}>
                            <Ionicons name="location" size={15} color="#EC4899" />
                          </View>
                          <Text style={styles.overviewText}>
                            {city ? `${city} • ` : ""}{distance} km away
                          </Text>
                        </View>
                        {education && (
                          <View style={styles.modalDetailRow}>
                            <View style={styles.iconCircle}>
                              <Ionicons name="school" size={15} color="#7C3AED" />
                            </View>
                            <Text style={styles.overviewText}>{education}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Bio Card */}
                  {bio && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>ABOUT ME</Text>
                      <View style={styles.lightCard}>
                        <Text style={styles.modalBioText}>{bio}</Text>
                      </View>
                    </View>
                  )}

                  {/* Interests Grid */}
                  {interests && interests.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>MY VIBE & INTERESTS</Text>
                      <View style={styles.interestsGrid}>
                        {interests.map((interest: any, i: number) => (
                          <View key={i} style={styles.interestPill}>
                            <Text style={styles.interestPillText}>{interest.name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Floating Quick Action Footer inside Modal */}
                <View style={styles.modalFooterActions}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.modalPassBtn]}
                    onPress={() => {
                      setShowDetails(false);
                      onPass?.();
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="close" size={26} color="#64748B" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.modalStarBtn]}
                    onPress={() => {
                      setShowDetails(false);
                      onSuperLike?.();
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="star" size={22} color="#7C3AED" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.modalLikeBtn]}
                    onPress={() => {
                      setShowDetails(false);
                      onLike?.();
                    }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={["#7C3AED", "#8B5CF6", "#EC4899"]} style={styles.modalLikeGrad}>
                      <Ionicons name="heart" size={26} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </Modal>
        </View>
      </RNAnimated.View>

      {/* ACTION SWIPE ACTION BUTTONS */}
      <View style={styles.actions}>
        <Pressable style={[styles.actionBtn, styles.passBtn]} onPress={onPass}>
          <Ionicons name="close" size={28} color="#64748B" />
        </Pressable>
        <Pressable onPress={onSuperLike} style={[styles.actionBtn, styles.starBtn]}>
          <Ionicons name="star" size={18} color="#8A56FF" />
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.likeBtn]} onPress={onLike}>
          <Ionicons name="heart" size={28} color="#FF4B81" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, minHeight: 0 },
  cardOuter: {
    flex: 1,
    minHeight: 0,
    borderRadius: Radius.xxl + 2,
    overflow: "hidden",
    backgroundColor: Colors.white,
    padding: 2,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  cardOuterDark: { padding: 1.5, borderRadius: Radius.xxl + 2 },
  border: { ...StyleSheet.absoluteFillObject, borderRadius: Radius.xxl + 2 },
  card: {
    flex: 1,
    borderRadius: Radius.xxl,
    overflow: "hidden",
    backgroundColor: "#141418",
  },
  cardDark: { borderRadius: Radius.xxl },
  cardLight: {
    borderRadius: Radius.xxl,
    backgroundColor: "#1A1F36",
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  
  // DYNAMIC BADGE STAMPS
  stampContainer: { 
    position: "absolute", 
    top: 45, 
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1.5, 
    borderColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 16, 
    paddingVertical: 6, 
    borderRadius: Radius.md, 
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  likeStamp: { 
    left: 24, 
    transform: [{ rotate: "-12deg" }] 
  },
  nopeStamp: { 
    right: 24, 
    transform: [{ rotate: "12deg" }] 
  },
  stampText: { 
    fontSize: 18, 
    fontFamily: VibeFonts.bold,
    letterSpacing: 1,
  },

  topRow: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 2,
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#16A34A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  onlineText: { color: "#fff", fontSize: 10, fontFamily: VibeFonts.bold },
  matchPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  matchPillText: { fontSize: 11, fontFamily: VibeFonts.extraBold, color: "#fff" },
  photoCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.48)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  photoCountText: { color: "#fff", fontSize: 10, fontFamily: VibeFonts.semiBold },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: 48,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { flex: 1, fontSize: 23, fontFamily: VibeFonts.extraBold, color: "#fff", letterSpacing: -0.3 },
  detail: { fontSize: 12, fontFamily: VibeFonts.medium, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 0.5,
  },
  tagText: { fontSize: 10, fontFamily: VibeFonts.bold, color: "#fff" },
  bioPromptBox: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  bioText: {
    color: "#fff",
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    flexShrink: 0,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#8A56FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  passBtn: {
    // Solid white circle, no red background!
  },
  starBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#8A56FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  likeBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  // MODAL DETAILS STYLES (Hangout Light Clean Theme)
  pressableCard: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(24, 24, 27, 0.6)",
    justifyContent: "flex-end",
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: "#F8F9FD",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    maxHeight: "92%",
    width: "100%",
    overflow: "hidden",
  },
  modalImageContainer: {
    width: "100%",
    height: 350,
  },
  modalImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  modalImageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  closeModalBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  modalTitleDetails: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    gap: 4,
  },
  modalNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalName: {
    fontSize: 26,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    letterSpacing: -0.5,
  },
  modalAge: {
    fontSize: 26,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  modalCityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalCity: {
    fontSize: 13,
    fontFamily: VibeFonts.semiBold,
    color: "#64748B",
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexGrow: 1,
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  lightCard: {
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  overviewText: {
    fontSize: 13,
    fontFamily: VibeFonts.semiBold,
    color: "#18181B",
    marginLeft: 10,
    flex: 1,
  },
  modalDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  modalBioText: {
    fontSize: 13.5,
    fontFamily: VibeFonts.medium,
    color: "#3F3F46",
    lineHeight: 21,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  interestPillText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },

  // Modal Footer Action Buttons
  modalFooterActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "rgba(248, 249, 253, 0.96)",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  modalActionBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  modalPassBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  modalStarBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  modalLikeBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modalLikeGrad: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
