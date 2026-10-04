import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  interpolate,
  FadeInDown,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { VibeFonts } from "../../constants/vibeTheme";
import ChaiHangoutModal from "./ChaiHangoutModal";

const { width: SCREEN_W } = Dimensions.get("window");

const chaiIcon = require("../../assets/icons/chai.png");
const chaiGuyImg = require("../../assets/home/chai-guy.png");

// Switch track dimensions: wide sleek pill
const TRACK_WIDTH = Math.min(SCREEN_W - 80, 270);
const TRACK_HEIGHT = 60;
const KNOB_SIZE = 50;
const PADDING = 5;
const MAX_SLIDE = TRACK_WIDTH - KNOB_SIZE - PADDING * 2;

export default function ChaiToggleWidget() {
  const [isOn, setIsOn] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const progress = useSharedValue(0);

  const handleToggle = () => {
    const next = !isOn;
    setIsOn(next);
    progress.value = withSpring(next ? 1 : 0, {
      damping: 14,
      stiffness: 170,
      mass: 0.85,
    });
  };

  // Track background color: Dark slate (#161F33) -> Warm Chai Caramel Amber (#D97706)
  const animatedTrackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ["#161F33", "#D97706"]
    );
    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(255,255,255,0.12)", "rgba(251, 191, 36, 0.45)"]
    );
    return {
      backgroundColor,
      borderColor,
    };
  });

  // Knob slide translation
  const animatedKnobStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [0, MAX_SLIDE]);
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, 1.08, 1]);
    return {
      transform: [{ translateX }, { scale }],
    };
  });

  // White circle knob (visible when OFF, fades out when ON)
  const animatedCircleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5], [1, 0]);
    return { opacity };
  });

  // Chai glass knob (fades in and scales as it slides to ON)
  const animatedChaiStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0.35, 1], [0, 1]);
    const scale = interpolate(progress.value, [0.35, 1], [0.8, 1]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // "stress off" label animation
  const animatedStressLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.4], [1, 0]);
    const translateY = interpolate(progress.value, [0, 0.4], [0, -8]);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // "chai on" label animation
  const animatedChaiLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0.6, 1], [0, 1]);
    const translateY = interpolate(progress.value, [0.6, 1], [8, 0]);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Ambient glow around the card
  const animatedCardStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(255,255,255,0.08)", "rgba(217, 119, 6, 0.35)"]
    );
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ["#080E1B", "#0C1322"]
    );
    return {
      borderColor,
      backgroundColor,
    };
  });

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(360)} style={styles.container}>
      <Animated.View style={[styles.card, animatedCardStyle]}>
        {/* ── Header Pill ── */}
        <View style={styles.headerRow}>
          <View style={styles.badgePill}>
            <Text style={styles.badgeEmoji}>✨</Text>
            <Text style={styles.badgeText}>CHAI MOOD</Text>
          </View>
          <Text style={styles.helperText}>
            {isOn ? "Chai mode active ☕" : "Tap switch to relax ☕"}
          </Text>
        </View>

        {/* ── Dynamic Animated Label (// stress off // vs // chai on //) ── */}
        <View style={styles.labelContainer}>
          {/* Left colored slashes */}
          <View style={styles.slashesWrapLeft}>
            <View style={[styles.slashBar, { backgroundColor: "#FACC15" }]} />
            <View style={[styles.slashBar, { backgroundColor: "#EC4899" }]} />
          </View>

          {/* Animated Center Text */}
          <View style={styles.centerTextWrap}>
            <Animated.View style={[styles.textAbsolute, animatedStressLabelStyle]}>
              <Text style={styles.labelText}>
                <Text style={styles.labelWhite}>stress </Text>
                <Text style={styles.labelRose}>off</Text>
              </Text>
            </Animated.View>
            <Animated.View style={[styles.textAbsolute, animatedChaiLabelStyle]}>
              <Text style={styles.labelText}>
                <Text style={styles.labelWhite}>chai </Text>
                <Text style={styles.labelLime}>on</Text>
              </Text>
            </Animated.View>
          </View>

          {/* Right colored slashes */}
          <View style={styles.slashesWrapRight}>
            <View style={[styles.slashBar, { backgroundColor: "#EC4899" }]} />
            <View style={[styles.slashBar, { backgroundColor: "#22D3EE" }]} />
          </View>
        </View>

        {/* ── Interactive Toggle Switch ── */}
        <Pressable
          onPress={handleToggle}
          hitSlop={12}
          style={styles.switchPressable}
        >
          <Animated.View style={[styles.switchTrack, animatedTrackStyle]}>
            {/* Sliding Knob */}
            <Animated.View style={[styles.knobWrap, animatedKnobStyle]}>
              {/* State OFF: Sleek white glowing circle knob */}
              <Animated.View style={[styles.whiteKnob, animatedCircleStyle]}>
                <Ionicons name="sparkles" size={18} color="#D97706" />
              </Animated.View>

              {/* State ON: Cutting Chai Glass overflowing track with steam */}
              <Animated.View style={[styles.chaiKnob, animatedChaiStyle]}>
                {/* 3 Steam lines rising above glass */}
                <View style={styles.steamLinesWrap}>
                  <View style={[styles.steamLine, { height: 9 }]} />
                  <View style={[styles.steamLine, { height: 13 }]} />
                  <View style={[styles.steamLine, { height: 9 }]} />
                </View>
                <Image
                  source={chaiIcon}
                  style={styles.chaiImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Pressable>

        {/* ── Active State Details (Guy, Bhaiya ik cup chai!, Button) ── */}
        {isOn ? (
          <Animated.View entering={FadeInDown.duration(280)} style={styles.activeFooter}>
            {/* Middle Row: Guy on left, Text & tag on right */}
            <View style={styles.bhaiyaRow}>
              <View style={styles.bhaiyaGuyWrap}>
                <Image
                  source={chaiGuyImg}
                  style={styles.bhaiyaGuyImg}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.bhaiyaTextCol}>
                <View style={styles.bhaiyaTitleRow}>
                  <Text style={styles.bhaiyaTitleWhite}>Bhaiya, ik cup </Text>
                  <View style={styles.chaiHighlightWrap}>
                    <Text style={styles.bhaiyaTitleLime}>chai!</Text>
                    <View style={styles.pinkBrushUnderline} />
                  </View>
                </View>

                {/* #चायप्रेमी • Daily Ritual */}
                <View style={styles.hindiTagPill}>
                  <Text style={styles.hindiTagText}>#चायप्रेमी</Text>
                  <Text style={styles.hindiTagDot}> • </Text>
                  <Text style={styles.hindiTagSub}>Daily Ritual</Text>
                </View>
              </View>
            </View>

            {/* Neon Gradient Action Button */}
            <Pressable
              onPress={() => setIsModalOpen(true)}
              style={styles.ctaButtonWrap}
            >
              <LinearGradient
                colors={["#D4F72C", "#10E5C9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButtonGrad}
              >
                <Text style={styles.ctaEmoji}>☕</Text>
                <Text style={styles.ctaButtonText}>Start a Chai Hangout</Text>
                <Ionicons name="arrow-forward" size={17} color="#0D1220" />
              </LinearGradient>
            </Pressable>

            {/* Subtext */}
            <Text style={styles.notifySubtext}>
              Notifies 4 nearby tea lovers in your circle
            </Text>
          </Animated.View>
        ) : (
          <Pressable onPress={handleToggle} style={styles.idleFooter}>
            <Text style={styles.idleText}>
              Too much stress? <Text style={styles.highlightText}>Slide to Chai On →</Text>
            </Text>
          </Pressable>
        )}
      </Animated.View>

      {/* ── Chai Hangout Bottom Sheet Modal ── */}
      <ChaiHangoutModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  card: {
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#080E1B",
    alignItems: "center",
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0C182B",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1D2D49",
  },
  badgeEmoji: {
    fontSize: 11,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },
  helperText: {
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },

  // ── Dynamic Label (// stress off // vs // chai on //) ──
  labelContainer: {
    height: 38,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  slashesWrapLeft: {
    flexDirection: "row",
    gap: 4,
    marginRight: 8,
    alignItems: "center",
  },
  slashesWrapRight: {
    flexDirection: "row",
    gap: 4,
    marginLeft: 8,
    alignItems: "center",
  },
  slashBar: {
    width: 3.5,
    height: 18,
    borderRadius: 2,
    transform: [{ rotate: "-28deg" }],
  },
  centerTextWrap: {
    position: "relative",
    width: 140,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  textAbsolute: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    fontSize: 27,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  labelWhite: {
    color: "#FFFFFF",
  },
  labelRose: {
    color: "#F87171",
  },
  labelLime: {
    color: "#E2F832",
  },

  // ── Toggle Switch ──
  switchPressable: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  switchTrack: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: PADDING,
    borderWidth: 1.5,
    justifyContent: "center",
    position: "relative",
  },
  knobWrap: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  whiteKnob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    position: "absolute",
  },
  chaiKnob: {
    width: KNOB_SIZE + 10,
    height: KNOB_SIZE + 24,
    top: -12,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  steamLinesWrap: {
    flexDirection: "row",
    gap: 3,
    marginBottom: -4,
    alignItems: "flex-end",
  },
  steamLine: {
    width: 2,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 1,
  },
  chaiImage: {
    width: "100%",
    height: "100%",
  },

  // ── Active Footer ──
  activeFooter: {
    marginTop: 10,
    alignItems: "center",
    width: "100%",
    gap: 10,
  },
  bhaiyaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    gap: 10,
    marginTop: 4,
  },
  bhaiyaGuyWrap: {
    width: 95,
    height: 105,
    alignItems: "center",
    justifyContent: "center",
  },
  bhaiyaGuyImg: {
    width: 95,
    height: 105,
  },
  bhaiyaTextCol: {
    flex: 1,
    justifyContent: "center",
  },
  bhaiyaTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
  },
  bhaiyaTitleWhite: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  chaiHighlightWrap: {
    position: "relative",
    alignItems: "center",
  },
  bhaiyaTitleLime: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: "#E2F832",
    letterSpacing: -0.2,
  },
  pinkBrushUnderline: {
    height: 3.5,
    backgroundColor: "#F43F5E",
    borderRadius: 2,
    marginTop: 2,
    width: "100%",
  },
  hindiTagPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1627",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  hindiTagText: {
    fontSize: 12.5,
    fontFamily: VibeFonts.bold,
    color: "#FACC15",
  },
  hindiTagDot: {
    fontSize: 12,
    color: "#64748B",
  },
  hindiTagSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },

  // ── Neon Gradient Button ──
  ctaButtonWrap: {
    width: "100%",
    marginTop: 6,
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#D4F72C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaButtonGrad: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
  },
  ctaEmoji: {
    fontSize: 16,
  },
  ctaButtonText: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#070A13",
    letterSpacing: -0.2,
  },
  notifySubtext: {
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 2,
    textAlign: "center",
  },

  // ── Idle Footer (when OFF) ──
  idleFooter: {
    marginTop: 12,
    paddingVertical: 4,
  },
  idleText: {
    fontSize: 12.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },
  highlightText: {
    color: "#10E5C9",
    fontFamily: VibeFonts.bold,
  },
});
