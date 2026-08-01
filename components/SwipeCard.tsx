import React, { useRef, useState, useEffect } from "react";
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
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VibeFonts } from "../constants/vibeTheme";
import { Colors, Radius, Spacing } from "../constants/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const PURPLE_GRAD = ["#7C3AED", "#8B5CF6"] as [string, string];

function LivePulse() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.65);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.85, { duration: 900, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 900 }), withTiming(0.55, { duration: 900 })),
      -1,
      false
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseRing, ringStyle]} />
      <View style={styles.pulseCore} />
    </View>
  );
}

interface Props {
  name: string;
  age?: number;
  bio?: string;
  jobTitle?: string;
  company?: string;
  education?: string;
  city?: string;
  distance: number;
  avatarUrl: string;
  photos?: string[];
  isVerified?: boolean;
  isOnline?: boolean;
  freeNow?: boolean;
  lastSeenAt?: string | null;
  vibeMatch?: number;
  sharedInterestCount?: number;
  energy?: string;
  interests?: { name: string; color: string }[];
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
  photos,
  isVerified,
  isOnline,
  freeNow,
  lastSeenAt,
  vibeMatch,
  sharedInterestCount = 0,
  energy,
  interests = [],
  dark = false,
  onPass,
  onSuperLike,
  onLike,
}: Props) {
  const insets = useSafeAreaInsets();
  const [showDetails, setShowDetails] = useState(false);
  const photoList = (photos && photos.length > 0 ? photos : [avatarUrl]).filter(Boolean);
  const [photoIdx, setPhotoIdx] = useState(0);
  const position = useRef(new RNAnimated.ValueXY()).current;
  const onLikeRef = useRef(onLike);
  const onPassRef = useRef(onPass);
  const onSuperLikeRef = useRef(onSuperLike);
  const showDetailsRef = useRef(showDetails);

  useEffect(() => {
    setPhotoIdx(0);
  }, [avatarUrl, photos?.join("|")]);

  useEffect(() => {
    onLikeRef.current = onLike;
    onPassRef.current = onPass;
    onSuperLikeRef.current = onSuperLike;
  }, [onLike, onPass, onSuperLike]);

  useEffect(() => {
    showDetailsRef.current = showDetails;
  }, [showDetails]);

  const closeDetails = () => {
    setShowDetails(false);
  };

  const goPhoto = (dir: 1 | -1) => {
    setPhotoIdx((i) => {
      const next = i + dir;
      if (next < 0) return 0;
      if (next >= photoList.length) return photoList.length - 1;
      return next;
    });
  };

  const formatLastSeenShort = (iso?: string | null) => {
    if (!iso) return "Offline";
    const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const hr = Math.floor(diffMin / 60);
    if (hr < 24) return `${hr}h ago`;
    return "Recently";
  };

  const insightTitle =
    sharedInterestCount > 0
      ? `${sharedInterestCount} shared interest${sharedInterestCount > 1 ? "s" : ""}`
      : vibeMatch && vibeMatch >= 80
        ? "Strong nearby vibe"
        : "Worth a hello";

  const insightSub =
    sharedInterestCount > 0
      ? "You both like similar things — great hangout chemistry."
      : freeNow
        ? "They're free now — perfect moment to say hi."
        : "Nearby and open to meeting — send a hello.";
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gestureState) => {
        if (showDetailsRef.current) return false;
        return Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 8;
      },
      onPanResponderMove: (_event, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy * 0.35 });
      },
      onPanResponderRelease: (_event, gestureState) => {
        // Up swipe → Super Like
        if (gestureState.dy < -110 && Math.abs(gestureState.dx) < 90) {
          RNAnimated.timing(position, {
            toValue: { x: 0, y: -(SCREEN_H + 80) },
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            onSuperLikeRef.current?.();
            position.setValue({ x: 0, y: 0 });
          });
          return;
        }
        if (gestureState.dx > 110) {
          RNAnimated.timing(position, {
            toValue: { x: SCREEN_W + 80, y: gestureState.dy * 0.35 },
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            onLikeRef.current?.();
            position.setValue({ x: 0, y: 0 });
          });
        } else if (gestureState.dx < -110) {
          RNAnimated.timing(position, {
            toValue: { x: -(SCREEN_W + 80), y: gestureState.dy * 0.35 },
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            onPassRef.current?.();
            position.setValue({ x: 0, y: 0 });
          });
        } else {
          RNAnimated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-220, 0, 220],
    outputRange: ["-8deg", "0deg", "8deg"],
    extrapolate: "clamp",
  });

  const panStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate },
    ],
  };

  const likeOpacity = position.x.interpolate({
    inputRange: [20, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-100, -20],
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
          <LinearGradient colors={["#A78BFA", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.border} />
        )}
        
        <View style={[styles.card, dark && styles.cardDark, !dark && styles.cardLight]}>
          <Pressable
            style={styles.pressableCard}
            onPress={(e) => {
              if (photoList.length > 1) {
                const x = e.nativeEvent.locationX;
                const w = SCREEN_W - 32;
                if (x < w * 0.33) {
                  goPhoto(-1);
                  return;
                }
                if (x > w * 0.67) {
                  goPhoto(1);
                  return;
                }
              }
              setShowDetails(true);
            }}
          >
            <Image source={{ uri: photoList[photoIdx] || avatarUrl }} style={styles.image} />

            {photoList.length > 1 ? (
              <View style={styles.photoBars} pointerEvents="none">
                {photoList.map((_, i) => (
                  <View
                    key={`bar-${i}`}
                    style={[styles.photoBar, i === photoIdx && styles.photoBarActive]}
                  />
                ))}
              </View>
            ) : null}

            {/* DYNAMIC SWIPE DIRECTIONAL BADGE STAMPS */}
            <RNAnimated.View style={[styles.stampContainer, styles.likeStamp, { opacity: likeOpacity }]}>
              <Ionicons name="heart" size={20} color="#FF4B81" style={{ marginRight: 6 }} />
              <Text style={[styles.stampText, { color: "#FF4B81" }]}>LIKE</Text>
            </RNAnimated.View>
            <RNAnimated.View style={[styles.stampContainer, styles.nopeStamp, { opacity: nopeOpacity }]}>
              <Ionicons name="close" size={20} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={[styles.stampText, { color: "#64748B" }]}>PASS</Text>
            </RNAnimated.View>

            <View style={styles.topRow} pointerEvents="none">
              {freeNow ? (
                <View style={[styles.onlineBadge, { backgroundColor: "rgba(16,185,129,0.92)" }]}>
                  <View style={styles.greenPulseDot} />
                  <Text style={styles.onlineText}>Free now</Text>
                </View>
              ) : isOnline ? (
                <View style={styles.onlineBadge}>
                  <View style={styles.greenPulseDot} />
                  <Text style={styles.onlineText}>Online</Text>
                </View>
              ) : (
                <View style={[styles.onlineBadge, { backgroundColor: "rgba(15,23,42,0.45)" }]}>
                  <Text style={styles.onlineText}>{formatLastSeenShort(lastSeenAt)}</Text>
                </View>
              )}
              <View style={styles.topRight}>
                {vibeMatch ? (
                  <LinearGradient colors={["#7C3AED", "#8B5CF6"]} style={styles.matchPill}>
                    <Text style={styles.matchPillText}>{vibeMatch}%</Text>
                  </LinearGradient>
                ) : null}
                <View style={styles.photoCount}>
                  <Ionicons name="camera-outline" size={11} color="#fff" />
                  <Text style={styles.photoCountText}>
                    {photoIdx + 1}/{photoList.length}
                  </Text>
                </View>
              </View>
            </View>

            <LinearGradient colors={["transparent", "rgba(5,5,8,0.92)"]} style={styles.overlay}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {name}{age ? `, ${age}` : ""}
                </Text>
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

          {/* PROFILE DETAILS — premium full sheet */}
          <Modal
            visible={showDetails}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={closeDetails}
          >
            <View style={styles.modalOverlay}>
              <Pressable style={styles.dismissOverlay} onPress={closeDetails} />

              <Animated.View entering={FadeInDown.duration(320)} style={styles.modalSheet}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces
                  contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
                >
                  {/* Cinematic hero */}
                  <View style={styles.modalHero}>
                    <Image source={{ uri: photoList[photoIdx] || avatarUrl }} style={styles.modalImage} />
                    <LinearGradient
                      colors={["rgba(15,23,42,0.48)", "transparent", "rgba(15,23,42,0.2)", "#F8F9FD"]}
                      locations={[0, 0.3, 0.7, 1]}
                      style={styles.modalImageGradient}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(124,58,237,0.14)", "transparent"]}
                      start={{ x: 0.15, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.modalWash}
                    />

                    <View style={[styles.modalTopBar, { paddingTop: Math.max(insets.top, 14) }]}>
                      <TouchableOpacity
                        style={styles.modalGlassBtn}
                        onPress={closeDetails}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="chevron-down" size={22} color="#FFF" />
                      </TouchableOpacity>
                      <View style={styles.modalTopRight}>
                        {vibeMatch ? (
                          <LinearGradient colors={PURPLE_GRAD} style={styles.modalMatchChip}>
                            <Text style={styles.modalMatchChipText}>{vibeMatch}% match</Text>
                          </LinearGradient>
                        ) : null}
                      </View>
                    </View>

                    <Animated.View entering={FadeInUp.delay(80).duration(380)} style={styles.modalHeroInfo}>
                      {freeNow ? (
                        <View style={styles.modalLivePill}>
                          <LivePulse />
                          <Text style={styles.modalLiveText}>Free now</Text>
                        </View>
                      ) : isOnline ? (
                        <View style={styles.modalLivePill}>
                          <LivePulse />
                          <Text style={styles.modalLiveText}>Online now</Text>
                        </View>
                      ) : (
                        <View style={[styles.modalLivePill, styles.modalAwayPill]}>
                          <Text style={styles.modalLiveText}>
                            {formatLastSeenShort(lastSeenAt)}
                          </Text>
                        </View>
                      )}

                      <View style={styles.modalNameRow}>
                        <Text style={styles.modalName} numberOfLines={1}>
                          {name}{age ? `, ${age}` : ""}
                        </Text>
                        {isVerified ? (
                          <View style={styles.modalVerified}>
                            <Ionicons name="checkmark" size={12} color="#FFF" />
                          </View>
                        ) : null}
                      </View>

                      {jobTitle ? (
                        <Text style={styles.modalVibeLine} numberOfLines={1}>
                          {jobTitle}{company ? ` at ${company}` : ""}
                        </Text>
                      ) : null}

                      <View style={styles.modalHeroMeta}>
                        <View style={styles.modalMetaChip}>
                          <Ionicons name="location" size={12} color="#FFF" />
                          <Text style={styles.modalMetaChipText}>
                            {city ? `${city} · ` : ""}{distance} km
                          </Text>
                        </View>
                        {education ? (
                          <View style={styles.modalMetaChip}>
                            <Ionicons name="school" size={12} color="#FFF" />
                            <Text style={styles.modalMetaChipText} numberOfLines={1}>
                              {education}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </Animated.View>
                  </View>

                  {/* Content sheet */}
                  <View style={styles.modalBody}>
                    {/* Insight strip */}
                    <Animated.View entering={FadeInDown.delay(60).duration(360)} style={styles.insightCard}>
                      <LinearGradient colors={["#F5F3FF", "#FFFFFF"]} style={styles.insightGrad}>
                        <View style={styles.insightScoreWrap}>
                          <Text style={styles.insightScore}>{vibeMatch ?? "—"}</Text>
                          <Text style={styles.insightScoreLabel}>match</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.insightTitle}>{insightTitle}</Text>
                          <Text style={styles.insightSub}>{insightSub}</Text>
                          <View style={styles.insightTags}>
                            <View style={styles.insightTag}>
                              <Ionicons
                                name={freeNow ? "flash" : isOnline ? "radio" : "time"}
                                size={11}
                                color={freeNow || isOnline ? "#22C55E" : "#64748B"}
                              />
                              <Text
                                style={[
                                  styles.insightTagText,
                                  { color: freeNow || isOnline ? "#22C55E" : "#64748B" },
                                ]}
                              >
                                {freeNow ? "Free now" : isOnline ? "Online" : formatLastSeenShort(lastSeenAt)}
                              </Text>
                            </View>
                            <View style={styles.insightTag}>
                              <Ionicons name="navigate" size={11} color="#7C3AED" />
                              <Text style={styles.insightTagText}>{distance} km away</Text>
                            </View>
                            {energy ? (
                              <View style={styles.insightTag}>
                                <Ionicons name="battery-half" size={11} color="#F59E0B" />
                                <Text style={styles.insightTagText}>{energy}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </LinearGradient>
                    </Animated.View>

                    {/* About */}
                    {bio ? (
                      <Animated.View entering={FadeInDown.delay(120).duration(360)} style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>About</Text>
                        <Text style={styles.modalBioText}>{bio}</Text>
                      </Animated.View>
                    ) : null}

                    {/* Quick facts */}
                    {(jobTitle || education || city) && (
                      <Animated.View entering={FadeInDown.delay(160).duration(360)} style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Quick facts</Text>
                        <View style={styles.factsRow}>
                          {jobTitle ? (
                            <View style={styles.factPill}>
                              <Ionicons name="briefcase" size={13} color="#7C3AED" />
                              <Text style={styles.factText} numberOfLines={1}>
                                {jobTitle}
                              </Text>
                            </View>
                          ) : null}
                          {education ? (
                            <View style={styles.factPill}>
                              <Ionicons name="school" size={13} color="#7C3AED" />
                              <Text style={styles.factText} numberOfLines={1}>
                                {education}
                              </Text>
                            </View>
                          ) : null}
                          <View style={styles.factPill}>
                            <Ionicons name="location" size={13} color="#7C3AED" />
                            <Text style={styles.factText}>
                              {city || "Nagpur"} · {distance} km
                            </Text>
                          </View>
                        </View>
                      </Animated.View>
                    )}

                    {/* Interests */}
                    {interests && interests.length > 0 ? (
                      <Animated.View entering={FadeInDown.delay(200).duration(360)} style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Into</Text>
                        <View style={styles.interestsGrid}>
                          {interests.map((interest: any, i: number) => (
                            <Animated.View
                              key={`${interest.name}-${i}`}
                              entering={FadeIn.delay(220 + i * 35).duration(260)}
                              style={styles.interestPill}
                            >
                              <Text style={styles.interestPillText}>
                                {getInterestEmoji(interest.name)}
                                {interest.name}
                              </Text>
                            </Animated.View>
                          ))}
                        </View>
                      </Animated.View>
                    ) : null}

                    {/* Prompt */}
                    <Animated.View entering={FadeInDown.delay(240).duration(360)} style={styles.promptCard}>
                      <LinearGradient
                        colors={["#F5F3FF", "#ECFDF5"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.promptGrad}
                      >
                        <View style={styles.promptIcon}>
                          <Ionicons name="sparkles" size={16} color="#7C3AED" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.promptTitle}>Make the first move</Text>
                          <Text style={styles.promptSub}>
                            Like {name.split(" ")[0]} or Super Like to stand out.
                          </Text>
                        </View>
                      </LinearGradient>
                    </Animated.View>
                  </View>
                </ScrollView>

                {/* Sticky actions — only footer at bottom, no tab icons */}
                <View style={[styles.modalFooterActions, { paddingBottom: Math.max(insets.bottom, 14) }]}>
                  <TouchableOpacity
                    style={styles.modalPassBtn}
                    onPress={() => {
                      closeDetails();
                      onPass?.();
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="close" size={26} color="#64748B" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalStarBtn}
                    onPress={() => {
                      closeDetails();
                      onSuperLike?.();
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="star" size={20} color="#7C3AED" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalLikeBtn}
                    onPress={() => {
                      closeDetails();
                      onLike?.();
                    }}
                    activeOpacity={0.88}
                  >
                    <LinearGradient colors={PURPLE_GRAD} style={styles.modalLikeGrad}>
                      <Ionicons name="heart" size={24} color="#FFFFFF" />
                      <Text style={styles.modalLikeText}>Like</Text>
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
          <Ionicons name="star" size={18} color="#F59E0B" />
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
    shadowColor: "#7C3AED",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
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
  photoTapRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 4,
  },
  photoTapZone: { flex: 1 },
  photoBars: {
    position: "absolute",
    top: 8,
    left: 10,
    right: 10,
    flexDirection: "row",
    gap: 4,
    zIndex: 5,
  },
  photoBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  photoBarActive: {
    backgroundColor: "#FFFFFF",
  },
  
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

  // MODAL DETAILS — premium Hangout profile sheet
  pressableCard: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: "#F8F9FD",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: "100%",
    maxHeight: "100%",
    width: "100%",
    overflow: "hidden",
  },
  modalHero: {
    width: "100%",
    height: Math.min(SCREEN_H * 0.48, 420),
    backgroundColor: "#1E1B4B",
  },
  modalImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  modalImageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  modalWash: {
    ...StyleSheet.absoluteFillObject,
  },
  modalTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 5,
  },
  modalTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalGlassBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(15,23,42,0.3)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalMatchChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  modalMatchChipText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
  },
  modalHeroInfo: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 28,
  },
  modalLivePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(34,197,94,0.92)",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  modalAwayPill: {
    backgroundColor: "rgba(100,116,139,0.85)",
  },
  modalLiveText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
  pulseWrap: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFF",
  },
  pulseCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFF",
  },
  modalNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalName: {
    flexShrink: 1,
    fontSize: 30,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
    letterSpacing: -0.7,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  modalVerified: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
  modalVibeLine: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: VibeFonts.semiBold,
    color: "rgba(255,255,255,0.92)",
  },
  modalHeroMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  modalMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(15,23,42,0.32)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: "100%",
  },
  modalMetaChipText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
  },
  modalBody: {
    marginTop: -18,
    paddingHorizontal: 18,
    gap: 18,
    backgroundColor: "#F8F9FD",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
  },
  insightCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EDE7FF",
  },
  insightGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
  },
  insightScoreWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF",
    borderWidth: 3,
    borderColor: "#DDD6FE",
    alignItems: "center",
    justifyContent: "center",
  },
  insightScore: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
    letterSpacing: -0.4,
  },
  insightScoreLabel: {
    marginTop: -2,
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  insightTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    letterSpacing: -0.2,
  },
  insightSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
  },
  insightTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  insightTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  insightTagText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },
  modalSection: {
    gap: 10,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    letterSpacing: -0.2,
  },
  modalBioText: {
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: "#334155",
    lineHeight: 21,
  },
  factsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  factPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE7FF",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    maxWidth: "100%",
  },
  factText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
    flexShrink: 1,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE7FF",
  },
  interestPillText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  promptCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 4,
  },
  promptGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  promptIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  promptTitle: {
    fontSize: 13.5,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  promptSub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
  },
  modalFooterActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingTop: 14,
    paddingHorizontal: 20,
    backgroundColor: "#F8F9FD",
    borderTopWidth: 1,
    borderTopColor: "#EDE7FF",
  },
  modalPassBtn: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalStarBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    alignItems: "center",
    justifyContent: "center",
  },
  modalLikeBtn: {
    flex: 1,
    maxWidth: 180,
    height: 54,
    borderRadius: 18,
    overflow: "hidden",
  },
  modalLikeGrad: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalLikeText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
  },
});
