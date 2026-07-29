import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { VibeFonts } from "../../constants/vibeTheme";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();

  // Carousel State
  const [activeIndex, setActiveIndex] = useState(0);
  const cardOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);

  // Floating Member Badges Shared Values
  const av1Y = useSharedValue(0);
  const av2Y = useSharedValue(0);

  // Mount Animations
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(-15);

  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(15);

  const carouselOpacity = useSharedValue(0);
  const carouselScale = useSharedValue(0.95);

  const actionsOpacity = useSharedValue(0);
  const actionsTranslateY = useSharedValue(20);

  // Floating Member Badges Drift
  useEffect(() => {
    av1Y.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 3500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    av2Y.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-8, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Entry Animations on mount
  useEffect(() => {
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    logoTranslateY.value = withDelay(100, withTiming(0, { duration: 500 }));

    statsOpacity.value = withDelay(220, withTiming(1, { duration: 500 }));
    statsTranslateY.value = withDelay(220, withTiming(0, { duration: 500 }));

    carouselOpacity.value = withDelay(340, withTiming(1, { duration: 500 }));
    carouselScale.value = withDelay(340, withTiming(1, { duration: 500 }));

    actionsOpacity.value = withDelay(460, withTiming(1, { duration: 500 }));
    actionsTranslateY.value = withDelay(460, withTiming(0, { duration: 500 }));
  }, []);

  // Feature Carousel Auto-Rotation
  useEffect(() => {
    const interval = setInterval(() => {
      cardOpacity.value = withTiming(0, { duration: 220 }, (finished) => {
        if (finished) {
          runOnJS(setActiveIndex)((prev) => (prev + 1) % 3);
        }
      });
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  // Fade-in/scale-up card when active index changes
  useEffect(() => {
    cardScale.value = 0.97;
    cardOpacity.value = withTiming(1, { duration: 300 });
    cardScale.value = withTiming(1, { duration: 300 });
  }, [activeIndex]);

  // Animated styles
  const av1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: av1Y.value }],
  }));

  const av2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: av2Y.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: statsTranslateY.value }],
  }));

  const carouselAnimatedStyle = useAnimatedStyle(() => ({
    opacity: carouselOpacity.value,
    transform: [{ scale: carouselScale.value }],
  }));

  const actionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
    transform: [{ translateY: actionsTranslateY.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const renderCarouselCard = () => {
    switch (activeIndex) {
      case 0:
        return (
          <View style={styles.carouselCardLight}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=300&fit=crop&q=80",
              }}
              style={styles.cardImageHero}
            />
            <View style={styles.cardOverlayBadge}>
              <Text style={styles.overlayBadgeText}>☕ Instant Coffee Spot</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardHeaderRow}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80",
                  }}
                  style={styles.cardAvatar}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>Aisha, 22</Text>
                    <View style={styles.verifiedDot}>
                      <Ionicons name="checkmark" size={9} color="#FFF" />
                    </View>
                  </View>
                  <Text style={styles.cardSubtitle}>Starbucks • FC Road</Text>
                </View>
                <View style={styles.vibePill}>
                  <Text style={styles.vibePillText}>Lessgo! 🟢</Text>
                </View>
              </View>
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.carouselCardLight}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=300&fit=crop&q=80",
              }}
              style={styles.cardImageHero}
            />
            <View style={[styles.cardOverlayBadge, { backgroundColor: "#8A56FF" }]}>
              <Text style={styles.overlayBadgeText}>🍕 Group Hangout</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardHeaderRow}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80",
                  }}
                  style={styles.cardAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Late Night Pizza Move</Text>
                  <Text style={styles.cardSubtitle}>Domino's Central • Tonight 9 PM</Text>
                </View>
                <View style={[styles.vibePill, { backgroundColor: "#F3E8FF" }]}>
                  <Text style={[styles.vibePillText, { color: "#7C3AED" }]}>5 Joined 🔥</Text>
                </View>
              </View>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.carouselCardLight}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=300&fit=crop&q=80",
              }}
              style={styles.cardImageHero}
            />
            <View style={[styles.cardOverlayBadge, { backgroundColor: "#22C55E" }]}>
              <Text style={styles.overlayBadgeText}>🟢 Real-Time Vibe Status</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardHeaderRow}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80",
                  }}
                  style={styles.cardAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Set Your Energy Mood</Text>
                  <Text style={styles.cardSubtitle}>Signal friends when you're free</Text>
                </View>
                <View style={[styles.vibePill, { backgroundColor: "#DCFCE7" }]}>
                  <Text style={[styles.vibePillText, { color: "#15803D" }]}>Active ⚡</Text>
                </View>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent />

      {/* Fresh Light Ambient Gradient Top Backdrop matching Hangout theme */}
      <LinearGradient
        colors={["#F8F9FD", "#F3E8FF", "#F8F9FD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Soft Ambient Mesh Glows */}
      <View style={styles.ambientGlowPink} />
      <View style={styles.ambientGlowPurple} />

      <SafeAreaView style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* Header Section */}
          <Animated.View style={[styles.headerArea, logoAnimatedStyle]}>
            <View style={styles.pillBadge}>
              <Ionicons name="sparkles" size={12} color="#7C3AED" />
              <Text style={styles.pillBadgeText}>REAL TIME MEETUPS</Text>
            </View>

            <View style={styles.logoRow}>
              <Text style={styles.logoText}>VibeMatch</Text>
              <Ionicons name="flash" size={26} color="#7C3AED" style={{ marginLeft: 3 }} />
            </View>
            <Text style={styles.tagline}>Real vibes. Real people. Right now. ✨</Text>
          </Animated.View>

          {/* Floating Active Member Chips */}
          <View style={styles.floatingAvatarsRow}>
            <Animated.View style={[styles.floatingChip, av1Style]}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&q=80",
                }}
                style={styles.floatingChipImg}
              />
              <View>
                <Text style={styles.floatingChipName}>Simran, 23</Text>
                <Text style={styles.floatingChipSub}>🟢 Lessgo!</Text>
              </View>
            </Animated.View>

            <Animated.View style={[styles.floatingChip, av2Style]}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80",
                }}
                style={styles.floatingChipImg}
              />
              <View>
                <Text style={styles.floatingChipName}>Kabir, 25</Text>
                <Text style={styles.floatingChipSub}>☕ Coffee</Text>
              </View>
            </Animated.View>
          </View>

          {/* Showcase Feature Carousel */}
          <Animated.View style={[styles.carouselContainer, carouselAnimatedStyle]}>
            <Animated.View style={[styles.carouselCardContainer, cardAnimatedStyle]}>
              {renderCarouselCard()}
            </Animated.View>

            {/* Carousel Dots */}
            <View style={styles.indicatorContainer}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.indicatorDot,
                    activeIndex === i ? styles.indicatorDotActive : null,
                  ]}
                />
              ))}
            </View>
          </Animated.View>

          {/* Compact Light Stats Card */}
          <Animated.View style={[styles.statsCardWrapper, statsAnimatedStyle]}>
            <View style={styles.statsCardLight}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>50K+</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>4.9★</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>3.4K+</Text>
                <Text style={styles.statLabel}>Live Spots</Text>
              </View>
            </View>
          </Animated.View>

          {/* Actions & Security */}
          <Animated.View style={[styles.actionsArea, actionsAnimatedStyle]}>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              activeOpacity={0.88}
              style={styles.primaryBtnTouchable}
            >
              <LinearGradient
                colors={["#7C3AED", "#8B5CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryText}>Get Started Free</Text>
                <Ionicons name="arrow-forward" size={19} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push("/(auth)/login")}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryText}>Already a member? </Text>
              <Text style={styles.secondaryBold}>Sign In</Text>
            </TouchableOpacity>

            {/* Bottom Security Row */}
            <View style={styles.featuresRow}>
              {[
                { icon: "shield-checkmark-outline", text: "100% Verified" },
                { icon: "flash-outline", text: "Instant Meets" },
                { icon: "lock-closed-outline", text: "Privacy Safe" },
              ].map((f) => (
                <View key={f.text} style={styles.featureItem}>
                  <Ionicons name={f.icon as any} size={13} color="#7C3AED" />
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.lg,
  },

  // Soft Ambient Glows (Hangout theme)
  ambientGlowPink: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
  },
  ambientGlowPurple: {
    position: "absolute",
    top: 180,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(139, 92, 246, 0.06)",
  },

  // Header Area
  headerArea: {
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  pillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
    marginBottom: 8,
  },
  pillBadgeText: {
    color: "#7C3AED",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    letterSpacing: 1.1,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 38,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },

  // Floating Avatars Row
  floatingAvatarsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
    paddingHorizontal: Spacing.xs,
  },
  floatingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.15)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  floatingChipImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#7C3AED",
  },
  floatingChipName: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  floatingChipSub: {
    fontSize: 9,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
  },

  // Carousel Container
  carouselContainer: {
    alignItems: "center",
    marginVertical: 6,
    width: "100%",
  },
  carouselCardContainer: {
    width: "100%",
  },
  carouselCardLight: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xxl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.12)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardImageHero: {
    width: "100%",
    height: 140,
  },
  cardOverlayBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  overlayBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
  },
  cardBody: {
    padding: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#7C3AED",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  verifiedDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  cardSubtitle: {
    fontSize: 11,
    fontFamily: VibeFonts.regular,
    color: "#64748B",
    marginTop: 1,
  },
  vibePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: "#F3E8FF",
  },
  vibePillText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },

  // Carousel Indicators
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
  },
  indicatorDotActive: {
    backgroundColor: "#7C3AED",
    width: 18,
  },

  // Stats Card
  statsCardWrapper: {
    marginVertical: 6,
  },
  statsCardLight: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xl,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.1)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statVal: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E2E8F0",
  },

  // Actions Area
  actionsArea: {
    gap: Spacing.xs,
    marginTop: 6,
  },
  primaryBtnTouchable: {
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: Radius.full,
  },
  primaryText: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 6,
  },
  secondaryText: {
    color: "#64748B",
    fontSize: 13,
    fontFamily: VibeFonts.regular,
  },
  secondaryBold: {
    color: "#7C3AED",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },

  // Security Features Row
  featuresRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginTop: 4,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  featureText: {
    color: "#64748B",
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
  },
});
