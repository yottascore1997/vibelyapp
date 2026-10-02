import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  interpolate,
  FadeInDown,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { VibeFonts } from "../../constants/vibeTheme";
import ChaiHangoutModal from "./ChaiHangoutModal";

const chaiIcon = require("../../assets/icons/chai.png");
const homeChaiImg = require("../../assets/icons/homechai.png");

// Switch dimensions
const TRACK_WIDTH = 164;
const TRACK_HEIGHT = 64;
const KNOB_SIZE = 54;
const PADDING = 5;
const MAX_SLIDE = TRACK_WIDTH - KNOB_SIZE - PADDING * 2; // 164 - 54 - 10 = 100

export default function ChaiToggleWidget() {
  const router = useRouter();
  const [isOn, setIsOn] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const progress = useSharedValue(0);

  const handleToggle = () => {
    const next = !isOn;
    setIsOn(next);
    progress.value = withSpring(next ? 1 : 0, {
      damping: 14,
      stiffness: 160,
      mass: 0.9,
    });
  };

  // Track background color: grey (#4B5563) -> warm chai caramel (#C87D32)
  const animatedTrackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ["#3E465A", "#C87D32"]
    );
    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(255,255,255,0.12)", "rgba(245, 158, 11, 0.45)"]
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
    const opacity = interpolate(progress.value, [0, 0.6], [1, 0]);
    return { opacity };
  });

  // Chai glass knob (fades in and scales as it slides to ON)
  const animatedChaiStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0.3, 1], [0, 1]);
    const scale = interpolate(progress.value, [0.3, 1], [0.8, 1]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // "stress off" label animation
  const animatedStressLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.4], [1, 0]);
    const translateY = interpolate(progress.value, [0, 0.4], [0, -6]);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // "chai on" label animation
  const animatedChaiLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0.6, 1], [0, 1]);
    const translateY = interpolate(progress.value, [0.6, 1], [6, 0]);
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
      ["rgba(255,255,255,0.08)", "rgba(200, 125, 50, 0.35)"]
    );
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ["#0D1220", "#131622"]
    );
    return {
      borderColor,
      backgroundColor,
    };
  });

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(360)} style={styles.container}>
      <Animated.View style={[styles.card, animatedCardStyle]}>
        {/* Header Pill */}
        <View style={styles.headerRow}>
          <View style={styles.badgePill}>
            <Text style={styles.badgeEmoji}>✨</Text>
            <Text style={styles.badgeText}>MOOD SWITCH</Text>
          </View>
          <Text style={styles.helperText}>
            {isOn ? "Chai mode active ☕" : "Tap switch to relax"}
          </Text>
        </View>

        {/* Dynamic Animated Label (stress off / chai on) */}
        <View style={styles.labelContainer}>
          <Animated.Text style={[styles.label, styles.stressLabel, animatedStressLabelStyle]}>
            stress off
          </Animated.Text>
          <Animated.Text style={[styles.label, styles.chaiLabel, animatedChaiLabelStyle]}>
            chai on
          </Animated.Text>
        </View>

        {/* Interactive Toggle Switch */}
        <Pressable
          onPress={handleToggle}
          hitSlop={12}
          style={styles.switchPressable}
        >
          <Animated.View style={[styles.switchTrack, animatedTrackStyle]}>
            {/* Sliding Knob */}
            <Animated.View style={[styles.knobWrap, animatedKnobStyle]}>
              {/* State OFF: White Circle */}
              <Animated.View style={[styles.whiteKnob, animatedCircleStyle]} />

              {/* State ON: Cutting Chai Glass overflowing track */}
              <Animated.View style={[styles.chaiKnob, animatedChaiStyle]}>
                <Image
                  source={chaiIcon}
                  style={styles.chaiImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Pressable>

        {/* Bottom Subtitle / Action directly below toggle */}
        {isOn ? (
          <Animated.View entering={FadeInDown.duration(260)} style={styles.activeFooter}>
            {/* homechai icon with Bhaiya ik cup chai in White */}
            <View style={styles.bhaiyaRow}>
              <Image
                source={homeChaiImg}
                style={styles.bhaiyaChaiIcon}
                resizeMode="contain"
              />
              <Text style={styles.bhaiyaChaiText}>
                Bhaiya, ik cup chai!
              </Text>
            </View>

            {/* #चायप्रेमी in Hindi */}
            <View style={styles.hindiTagPill}>
              <Text style={styles.hindiTagText}>#चायप्रेमी</Text>
            </View>

            <Pressable
              onPress={() => setIsModalOpen(true)}
              style={styles.ctaButton}
            >
              <Ionicons name="cafe" size={16} color="#0D1220" />
              <Text style={styles.ctaButtonText}>Start a Chai Hangout</Text>
              <Ionicons name="arrow-forward" size={14} color="#0D1220" />
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable onPress={handleToggle} style={styles.idleFooter}>
            <Text style={styles.idleText}>
              Too much stress? <Text style={styles.highlightText}>Slide to Chai On →</Text>
            </Text>
          </Pressable>
        )}
      </Animated.View>

      {/* ── Chai Hangout Bottom Sheet Popup with Smoke, Breakfast & Invite Friends ── */}
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
    marginBottom: 26,
  },
  card: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    alignItems: "center",
    shadowColor: "#C87D32",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  badgeEmoji: {
    fontSize: 11,
  },
  badgeText: {
    fontSize: 10.5,
    fontFamily: VibeFonts.extraBold,
    color: "#E2E8F0",
    letterSpacing: 0.6,
  },
  helperText: {
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },

  // Dynamic Label (stress off / chai on)
  labelContainer: {
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
    width: "100%",
  },
  label: {
    fontSize: 27,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.6,
    textAlign: "center",
    position: "absolute",
  },
  stressLabel: {
    color: "#F87171", // Soft rose / stress off red
  },
  chaiLabel: {
    color: "#22C55E", // Rich green / chai on green
  },

  // Toggle Switch
  switchPressable: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
    paddingBottom: 0,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 5,
    position: "absolute",
  },
  chaiKnob: {
    width: KNOB_SIZE + 10,
    height: KNOB_SIZE + 24, // Taller than track so it stands tall like in meme!
    top: -12, // Centers the tall chai glass vertically over track
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  chaiImage: {
    width: "100%",
    height: "100%",
  },

  // Footers
  activeFooter: {
    marginTop: 2, // Zero gap directly under toggle switch
    alignItems: "center",
    width: "100%",
    gap: 6,
  },
  bhaiyaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 0,
  },
  bhaiyaChaiIcon: {
    width: 60,
    height: 56,
  },
  bhaiyaChaiText: {
    fontSize: 21,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF", // WHITE as requested!
    textAlign: "center",
    letterSpacing: -0.2,
  },
  hindiTagPill: {
    backgroundColor: "rgba(234, 179, 8, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 4.5,
    borderRadius: 999,
  },
  hindiTagText: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#FDE047",
    letterSpacing: 0.5,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#22D3EE",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    fontSize: 12.5,
    fontFamily: VibeFonts.bold,
    color: "#070A13",
  },
  idleFooter: {
    marginTop: 12,
    paddingVertical: 4,
  },
  idleText: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },
  highlightText: {
    color: "#22D3EE",
    fontFamily: VibeFonts.bold,
  },
});
