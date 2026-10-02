import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { VibeFonts } from "../../constants/vibeTheme";

const { width: W, height: H } = Dimensions.get("window");
const FW = 402;
const s = W / FW;
const fx = (n: number) => Math.round(n * s);

const heroPeople = require("../../assets/onboarding/hero-people.png");
const heroHangouts = require("../../assets/onboarding/hero-hangouts.png");
const heroCreate = require("../../assets/onboarding/hero-create.png");
const heroFinal = require("../../assets/onboarding/figma-onboarding-4.png");

interface OnboardingSlide {
  id: string;
  type: "standard" | "final";
  title?: string;
  highlight?: string;
  subtitle: string;
  hero: any;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: "people",
    type: "standard",
    title: "Meet Real People",
    highlight: "Beyond Screens",
    subtitle: "Find like-minded people, make new\nfriends and turn chats into real hangouts.",
    hero: heroPeople,
  },
  {
    id: "hangouts",
    type: "standard",
    title: "Find Hangouts",
    highlight: "For Every Mood",
    subtitle: "Find like-minded people, make new\nfriends and turn chats into real hangouts.",
    hero: heroHangouts,
  },
  {
    id: "create",
    type: "standard",
    title: "Create Your Own",
    highlight: "Hangout",
    subtitle: "Find like-minded people, make new\nfriends and turn chats into real hangouts.",
    hero: heroCreate,
  },
  {
    id: "final",
    type: "final",
    title: "Hangout",
    subtitle: "Meet. Vibe. Make it Real.",
    hero: heroFinal,
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const goLogin = () => router.replace("/(auth)/login");

  const goNext = () => {
    if (currentIndex >= SLIDES.length - 1) {
      goLogin();
      return;
    }
    const next = currentIndex + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / W);
    if (i >= 0 && i < SLIDES.length && i !== currentIndex) {
      setCurrentIndex(i);
    }
  };

  const isFinalSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Top Skip Button */}
      <View style={[styles.topBar, { top: Math.max(insets.top + 6, 44) }]}>
        <Pressable
          onPress={goLogin}
          hitSlop={16}
          style={styles.skipBtn}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Swipable Carousel */}
      <FlatList
        ref={listRef}
        style={styles.list}
        data={SLIDES}
        horizontal
        pagingEnabled
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
        renderItem={({ item }) => {
          if (item.type === "final") {
            return (
              <View style={styles.slide}>
                <Image source={item.hero} style={styles.fullBgImage} resizeMode="cover" />
                <LinearGradient
                  colors={["transparent", "rgba(5, 7, 15, 0.45)", "rgba(5, 7, 15, 0.95)"]}
                  style={styles.finalGradientOverlay}
                />
                <View style={[styles.finalContentBlock, { bottom: insets.bottom + fx(110) }]}>
                  <Text style={styles.finalTitle}>{item.title}</Text>
                  <Text style={styles.finalSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
            );
          }

          return (
            <View style={styles.slide}>
              <View style={[styles.textBlock, { marginTop: Math.max(insets.top + fx(60), fx(90)) }]}>
                <Text style={styles.h1}>{item.title}</Text>
                <Text style={styles.highlightText}>{item.highlight}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>

              <View style={styles.heroContainer}>
                <Image
                  source={item.hero}
                  style={styles.heroImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          );
        }}
      />

      {/* Bottom Controls (Dots + Gradient CTA Button) */}
      <View
        style={[
          styles.bottomControls,
          { paddingBottom: Math.max(insets.bottom, fx(20)) },
        ]}
      >
        {/* Slider Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <View
                key={idx}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* Primary CTA Button (Yellow-to-Lime gradient pill) */}
        <Pressable
          onPress={goNext}
          style={({ pressed }) => [
            styles.ctaPressable,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isFinalSlide ? "Get Started" : "Next"}
        >
          <LinearGradient
            colors={["#FFF04B", "#94FA78", "#2EFA9E"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>
              {isFinalSlide ? "Get Started" : "Next"}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={fx(20)}
              color="#0A0F1D"
              style={styles.ctaArrow}
            />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070A13",
  },
  list: {
    flex: 1,
  },
  slide: {
    width: W,
    height: H,
    backgroundColor: "#070A13",
    alignItems: "center",
  },
  topBar: {
    position: "absolute",
    right: fx(24),
    zIndex: 100,
  },
  skipBtn: {
    paddingVertical: fx(8),
    paddingHorizontal: fx(12),
  },
  skipText: {
    fontSize: fx(15),
    fontFamily: VibeFonts.semiBold,
    color: "#FFFFFF",
    letterSpacing: fx(0.4),
  },
  textBlock: {
    alignItems: "center",
    paddingHorizontal: fx(24),
  },
  h1: {
    fontSize: fx(32),
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: fx(0.3),
    lineHeight: fx(40),
  },
  highlightText: {
    fontSize: fx(32),
    fontFamily: VibeFonts.extraBold,
    color: "#E3F650",
    textAlign: "center",
    letterSpacing: fx(0.3),
    lineHeight: fx(40),
    marginTop: fx(2),
  },
  subtitle: {
    fontSize: fx(15),
    fontFamily: VibeFonts.regular,
    color: "rgba(255, 255, 255, 0.72)",
    textAlign: "center",
    lineHeight: fx(22),
    marginTop: fx(12),
  },
  heroContainer: {
    flex: 1,
    width: W,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: fx(20),
    marginBottom: fx(140),
  },
  heroImage: {
    width: W * 0.88,
    height: H * 0.46,
  },
  fullBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: W,
    height: H,
  },
  finalGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  finalContentBlock: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: fx(24),
  },
  finalTitle: {
    fontSize: fx(38),
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: fx(0.5),
  },
  finalSubtitle: {
    fontSize: fx(17),
    fontFamily: VibeFonts.medium,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    marginTop: fx(10),
    letterSpacing: fx(0.5),
  },
  bottomControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: fx(28),
    zIndex: 50,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: fx(12),
    marginBottom: fx(24),
  },
  dot: {
    width: fx(10),
    height: fx(10),
    borderRadius: fx(5),
  },
  dotActive: {
    backgroundColor: "#E3F650",
    width: fx(24),
  },
  dotInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  ctaPressable: {
    width: "100%",
    height: fx(56),
    borderRadius: fx(999),
    overflow: "hidden",
    shadowColor: "#2EFA9E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: fx(999),
    paddingHorizontal: fx(24),
  },
  ctaText: {
    fontSize: fx(17),
    fontFamily: VibeFonts.bold,
    color: "#0A0F1D",
    letterSpacing: fx(0.3),
  },
  ctaArrow: {
    marginLeft: fx(8),
  },
});
