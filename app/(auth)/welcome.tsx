import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { VibeColors, VibeFonts } from "../../constants/vibeTheme";
import GlassCard from "../../components/vibe/GlassCard";
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

  // Background Zoom Shared Value (Ken Burns Effect)
  const bgScale = useSharedValue(1);

  // Background Drift Orbs Shared Values
  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb1Scale = useSharedValue(1);

  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);

  const orb3X = useSharedValue(0);
  const orb3Y = useSharedValue(0);

  // Floating Avatars Shared Values (drift + scale)
  const av1X = useSharedValue(0);
  const av1Y = useSharedValue(0);
  const av1Scale = useSharedValue(1);

  const av2X = useSharedValue(0);
  const av2Y = useSharedValue(0);
  const av2Scale = useSharedValue(1);

  const av3X = useSharedValue(0);
  const av3Y = useSharedValue(0);
  const av3Scale = useSharedValue(1);

  const av4X = useSharedValue(0);
  const av4Y = useSharedValue(0);
  const av4Scale = useSharedValue(1);

  // Mount/Entry Animations Shared Values
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(-20);

  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(20);

  const carouselOpacity = useSharedValue(0);
  const carouselScale = useSharedValue(0.92);

  const actionsOpacity = useSharedValue(0);
  const actionsTranslateY = useSharedValue(30);

  const featuresOpacity = useSharedValue(0);

  // Cinematic Ken Burns Background Zoom Effect
  useEffect(() => {
    bgScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 18000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 18000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Floating Avatars Drifting & Pulsing animations
  useEffect(() => {
    // Avatar 1 (top-left)
    av1X.value = withRepeat(
      withSequence(
        withTiming(12, { duration: 5200, easing: Easing.inOut(Easing.ease) }),
        withTiming(-12, { duration: 5200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    av1Y.value = withRepeat(
      withSequence(
        withTiming(-18, { duration: 6200, easing: Easing.inOut(Easing.ease) }),
        withTiming(18, { duration: 6200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    av1Scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.94, { duration: 3200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Avatar 2 (top-right)
    av2X.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 6700, easing: Easing.inOut(Easing.ease) }),
        withTiming(15, { duration: 6700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    av2Y.value = withRepeat(
      withSequence(
        withTiming(16, { duration: 5700, easing: Easing.inOut(Easing.ease) }),
        withTiming(-16, { duration: 5700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    av2Scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 4200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 4200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Avatar 3 (mid-left)
    av3X.value = withRepeat(
      withSequence(
        withTiming(14, { duration: 5900, easing: Easing.inOut(Easing.ease) }),
        withTiming(-14, { duration: 5900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    av3Y.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 6900, easing: Easing.inOut(Easing.ease) }),
        withTiming(12, { duration: 6900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    av3Scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 3600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 3600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Avatar 4 (mid-right)
    av4X.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 7400, easing: Easing.inOut(Easing.ease) }),
        withTiming(10, { duration: 7400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    av4Y.value = withRepeat(
      withSequence(
        withTiming(-16, { duration: 6400, easing: Easing.inOut(Easing.ease) }),
        withTiming(16, { duration: 6400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    av4Scale.value = withRepeat(
      withSequence(
        withTiming(1.07, { duration: 4400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.93, { duration: 4400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Background Glow drifting animations
  useEffect(() => {
    orb1X.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-30, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(-40, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
        withTiming(40, { duration: 7000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb1Scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orb2X.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(25, { duration: 8000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(35, { duration: 6500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-35, { duration: 6500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orb3X.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 5500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-20, { duration: 5500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb3Y.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 5500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-20, { duration: 5500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Entry Animations on mount
  useEffect(() => {
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    logoTranslateY.value = withDelay(100, withTiming(0, { duration: 600 }));

    statsOpacity.value = withDelay(250, withTiming(1, { duration: 600 }));
    statsTranslateY.value = withDelay(250, withTiming(0, { duration: 600 }));

    carouselOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    carouselScale.value = withDelay(400, withTiming(1, { duration: 600 }));

    actionsOpacity.value = withDelay(550, withTiming(1, { duration: 600 }));
    actionsTranslateY.value = withDelay(550, withTiming(0, { duration: 600 }));

    featuresOpacity.value = withDelay(700, withTiming(1, { duration: 600 }));
  }, []);

  // Feature Carousel Auto-Rotation
  useEffect(() => {
    const interval = setInterval(() => {
      cardOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished) {
          runOnJS(setActiveIndex)((prev) => (prev + 1) % 3);
        }
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Fade-in/scale-up card when active index changes
  useEffect(() => {
    cardScale.value = 0.96;
    cardOpacity.value = withTiming(1, { duration: 350 });
    cardScale.value = withTiming(1, { duration: 350 });
  }, [activeIndex]);

  // Animated styles
  const bgAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bgScale.value }],
  }));

  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb1X.value },
      { translateY: orb1Y.value },
      { scale: orb1Scale.value },
    ],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb2X.value },
      { translateY: orb2Y.value },
    ],
  }));

  const orb3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb3X.value },
      { translateY: orb3Y.value },
    ],
  }));

  const av1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: av1X.value },
      { translateY: av1Y.value },
      { scale: av1Scale.value },
    ],
  }));

  const av2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: av2X.value },
      { translateY: av2Y.value },
      { scale: av2Scale.value },
    ],
  }));

  const av3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: av3X.value },
      { translateY: av3Y.value },
      { scale: av3Scale.value },
    ],
  }));

  const av4Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: av4X.value },
      { translateY: av4Y.value },
      { scale: av4Scale.value },
    ],
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

  const featuresAnimatedStyle = useAnimatedStyle(() => ({
    opacity: featuresOpacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const renderCarouselCard = () => {
    switch (activeIndex) {
      case 0:
        return (
          <GlassCard style={styles.carouselCardGlass}>
            <View style={styles.carouselCardHeader}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80" }}
                style={styles.cardAvatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Aisha, 22</Text>
                <Text style={styles.cardSubtitle}>Active Vibe Now</Text>
              </View>
              <View style={styles.vibeTag}>
                <Text style={styles.vibeTagText}>☕ Coffee Vibe</Text>
              </View>
            </View>
            <View style={styles.vibeActionsMock}>
              <View style={[styles.vibeActionBtn, styles.vibeBtnActive]}>
                <Ionicons name="cafe" size={14} color="#FFD700" />
                <Text style={[styles.vibeBtnText, { color: "#FFD700" }]}>Coffee</Text>
              </View>
              <View style={styles.vibeActionBtn}>
                <Ionicons name="videocam-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.vibeBtnText}>Movie</Text>
              </View>
              <View style={styles.vibeActionBtn}>
                <Ionicons name="chatbubbles-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.vibeBtnText}>Talk</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>Send a vibe to connect instantly over shared activities!</Text>
          </GlassCard>
        );
      case 1:
        return (
          <GlassCard style={styles.carouselCardGlass}>
            <View style={styles.carouselCardHeader}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80" }}
                style={styles.cardAvatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Pizza & Boardgames</Text>
                <Text style={styles.cardSubtitle}>Organized by Mayur</Text>
              </View>
              <View style={[styles.vibeTag, { backgroundColor: "rgba(34,197,94,0.15)", borderColor: "rgba(34,197,94,0.3)" }]}>
                <Text style={[styles.vibeTagText, { color: "#22C55E" }]}>5 Going</Text>
              </View>
            </View>
            <View style={styles.hangoutDetailsMock}>
              <View style={styles.hangoutTimeContainer}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=80&h=80&fit=crop&q=80" }}
                  style={styles.detailsThumb}
                />
                <View>
                  <Text style={styles.hangoutTime}>Saturday, 7:00 PM</Text>
                  <Text style={styles.hangoutTimeSub}>At Mayur's Place</Text>
                </View>
              </View>
              <View style={styles.mockJoinBtn}>
                <Text style={styles.joinBtnText}>Join Plan</Text>
                <Ionicons name="checkmark-circle" size={14} color="#fff" />
              </View>
            </View>
            <Text style={styles.cardDesc}>Create plans or join others doing what you love in your city.</Text>
          </GlassCard>
        );
      case 2:
        return (
          <GlassCard style={styles.carouselCardGlass}>
            <View style={styles.carouselCardHeader}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&q=80" }}
                style={styles.cardAvatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Set Your Energy</Text>
                <Text style={styles.cardSubtitle}>Let friends know you're free</Text>
              </View>
              <View style={[styles.vibeTag, { backgroundColor: "rgba(138,86,255,0.15)", borderColor: "rgba(138,86,255,0.3)" }]}>
                <Text style={[styles.vibeTagText, { color: "#A855F7" }]}>Active</Text>
              </View>
            </View>
            <View style={styles.socialEnergySelectorMock}>
              <View style={[styles.energyOption, styles.energyOptionActive]}>
                <View style={[styles.energyIndicator, { backgroundColor: "#22C55E" }]} />
                <Text style={styles.energyText}>Lessgo! 🟢</Text>
              </View>
              <View style={styles.energyOption}>
                <View style={[styles.energyIndicator, { backgroundColor: "#EAB308" }]} />
                <Text style={styles.energyText}>Maybe 🟡</Text>
              </View>
              <View style={styles.energyOption}>
                <View style={[styles.energyIndicator, { backgroundColor: "#EF4444" }]} />
                <Text style={styles.energyText}>Off Grid 🔴</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>Share your social energy status to hang out at a moment's notice.</Text>
          </GlassCard>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Zooming lifestyle couple background image (Ken Burns Effect) */}
      <Animated.Image
        source={{ uri: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1080&fit=crop&q=80" }}
        style={[StyleSheet.absoluteFillObject, bgAnimatedStyle]}
        resizeMode="cover"
      />

      {/* Dark overlay to blend background image with the app theme */}
      <LinearGradient
        colors={["rgba(5,5,8,0.28)", "rgba(10,6,24,0.76)", "rgba(5,5,8,0.94)", "#050508"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Glowing Background Orbs (rendered behind cards) */}
      <Animated.View style={[styles.glowOrb, styles.glow1, orb1Style]} />
      <Animated.View style={[styles.glowOrb, styles.glow2, orb2Style]} />
      <Animated.View style={[styles.glowOrb, styles.glow3, orb3Style]} />

      {/* Floating CUT-OUT Avatars of attractive members with glowing online badge (Luring element) */}
      <Animated.View style={[styles.floatingAvatar, { top: 120, left: 24 }, av1Style]}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80" }}
          style={styles.floatingAvatarImg}
        />
        <View style={styles.onlineIndicator} />
      </Animated.View>

      <Animated.View style={[styles.floatingAvatar, { top: 190, right: 20 }, av2Style]}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80" }}
          style={styles.floatingAvatarImg}
        />
        <View style={styles.onlineIndicator} />
      </Animated.View>

      <Animated.View style={[styles.floatingAvatar, { top: 380, left: 10 }, av3Style]}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80" }}
          style={styles.floatingAvatarImg}
        />
        <View style={styles.onlineIndicator} />
      </Animated.View>

      <Animated.View style={[styles.floatingAvatar, { top: 430, right: 15 }, av4Style]}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&q=80" }}
          style={styles.floatingAvatarImg}
        />
        <View style={styles.onlineIndicator} />
      </Animated.View>

      {/* Main SafeArea layout */}
      <SafeAreaView style={styles.safe}>
        {/* Header / Brand Area */}
        <Animated.View style={[styles.top, logoAnimatedStyle]}>
          <LinearGradient colors={["rgba(255,215,0,0.2)", "rgba(255,215,0,0.02)"]} style={styles.premiumBadge}>
            <Ionicons name="diamond" size={12} color="#FFD700" />
            <Text style={styles.premiumText}>PREMIUM EXPERIENCE</Text>
          </LinearGradient>
          <Text style={styles.logo}>VibeMatch</Text>
          <Text style={styles.tagline}>Where real vibes meet real people ✨</Text>
        </Animated.View>

        {/* Glassmorphic Stats Section */}
        <Animated.View style={[styles.statsCardWrapper, statsAnimatedStyle]}>
          <GlassCard style={styles.statsGlassCard}>
            <View style={styles.statsInnerRow}>
              {[
                { val: "50K+", label: "Members" },
                { val: "4.9★", label: "Rating" },
                { val: "128", label: "Online Now" },
              ].map((s) => (
                <View key={s.label} style={styles.stat}>
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Dynamic Showcase Slider */}
        <Animated.View style={[styles.carouselContainer, carouselAnimatedStyle]}>
          <Animated.View style={[styles.carouselCardContainer, cardAnimatedStyle]}>
            {renderCarouselCard()}
          </Animated.View>

          {/* Dots Indicator */}
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

        {/* Action Buttons */}
        <Animated.View style={[styles.actions, actionsAnimatedStyle]}>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")} activeOpacity={0.88}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryText}>Get Started Free</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/(auth)/login")} activeOpacity={0.7}>
            <Text style={styles.secondaryText}>Already a member? </Text>
            <Text style={styles.secondaryBold}>Sign In</Text>
          </TouchableOpacity>

          {/* Bottom Security / Feature badges */}
          <Animated.View style={[styles.features, featuresAnimatedStyle]}>
            {[
              { icon: "shield-checkmark-outline", text: "Verified" },
              { icon: "sparkles-outline", text: "AI Match" },
              { icon: "heart-outline", text: "Real Vibes" },
            ].map((f) => (
              <View key={f.text} style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon as any} size={14} color="#FF4B81" />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050508" },
  safe: { flex: 1, justifyContent: "space-between", padding: Spacing.lg, zIndex: 10 },

  // Glowing Orbs
  glowOrb: { position: "absolute", borderRadius: 999, opacity: 0.55 },
  glow1: {
    width: 250,
    height: 250,
    top: -50,
    right: -50,
    backgroundColor: "rgba(138,86,255,0.18)",
  },
  glow2: {
    width: 220,
    height: 220,
    bottom: 200,
    left: -80,
    backgroundColor: "rgba(255,75,129,0.1)",
  },
  glow3: {
    width: 180,
    height: 180,
    top: "40%",
    right: -90,
    backgroundColor: "rgba(168,85,247,0.08)",
  },

  // Floating Avatars (Luring Element)
  floatingAvatar: {
    position: "absolute",
    zIndex: 2,
  },
  floatingAvatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "#FF4B81", // Glowing boundary
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#22C55E", // Bright online dot
    borderWidth: 2.5,
    borderColor: "#050508",
  },

  // Header Area
  top: { alignItems: "center", marginTop: Spacing.md },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
    marginBottom: Spacing.md,
  },
  premiumText: {
    color: "#FFD700",
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    letterSpacing: 1.5,
  },
  logo: {
    fontSize: 38,
    fontFamily: VibeFonts.extraBold,
    color: VibeColors.text,
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: VibeColors.textMuted,
    marginTop: 6,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Stats Card Wrapper
  statsCardWrapper: {
    marginHorizontal: Spacing.xs,
  },
  statsGlassCard: {
    borderRadius: Radius.lg,
  },
  statsInnerRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
  },
  stat: { alignItems: "center" },
  statVal: {
    fontSize: 20,
    fontFamily: VibeFonts.bold,
    color: VibeColors.text,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: VibeColors.textMuted,
    marginTop: 2,
  },

  // Showcase Carousel Container
  carouselContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    width: "100%",
  },
  carouselCardContainer: {
    width: "100%",
    minHeight: 185,
    justifyContent: "center",
  },
  carouselCardGlass: {
    padding: Spacing.lg,
  },
  carouselCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: VibeColors.text,
  },
  cardSubtitle: {
    fontSize: 11,
    fontFamily: VibeFonts.regular,
    color: VibeColors.textMuted,
  },
  vibeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
    backgroundColor: "rgba(138,86,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(138,86,255,0.3)",
  },
  vibeTagText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: Colors.accent,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    color: VibeColors.textMuted,
    lineHeight: 17,
    marginTop: Spacing.sm,
  },

  // Mock Feature Visuals
  // Carousel slide 0: Vibe actions
  vibeActionsMock: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  vibeActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  vibeBtnActive: {
    backgroundColor: "rgba(138,86,255,0.15)",
    borderColor: "rgba(138,86,255,0.3)",
  },
  vibeBtnText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.7)",
  },

  // Carousel slide 1: Hangout layout
  hangoutDetailsMock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  hangoutTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailsThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  hangoutTime: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.85)",
  },
  hangoutTimeSub: {
    fontSize: 9,
    fontFamily: VibeFonts.regular,
    color: VibeColors.textMuted,
  },
  mockJoinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  joinBtnText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },

  // Carousel slide 2: Social energy options
  socialEnergySelectorMock: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  energyOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  energyOptionActive: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderColor: "rgba(34,197,94,0.3)",
  },
  energyIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  energyText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },

  // Dots
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.md,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  indicatorDotActive: {
    backgroundColor: Colors.accent,
    width: 14,
  },

  // Actions / Buttons
  actions: { gap: Spacing.md, paddingBottom: Spacing.md },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: Radius.full,
  },
  primaryText: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },
  secondaryBtn: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
  },
  secondaryText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontFamily: VibeFonts.regular,
  },
  secondaryBold: {
    color: Colors.accent,
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },

  // Security features row
  features: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xl,
    marginTop: Spacing.xs,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,75,129,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
  },
});
