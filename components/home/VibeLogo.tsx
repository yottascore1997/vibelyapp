import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { VibeFonts } from "../../constants/vibeTheme";

interface Props {
  size?: "sm" | "md";
  dark?: boolean;
}

export default function VibeLogo({ size = "md", dark }: Props) {
  const sparkle = useSharedValue(1);
  const glow = useSharedValue(0.6);

  useEffect(() => {
    sparkle.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.6, { duration: 1200 })
      ),
      -1,
      false
    );
  }, [sparkle, glow]);

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkle.value }, { rotate: `${(sparkle.value - 1) * 20}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  const isSmall = size === "sm";

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.glow, glowStyle]} />
      <View style={styles.row}>
        <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={[styles.iconBox, isSmall && styles.iconBoxSm]}>
          <Text style={[styles.iconLetter, isSmall && styles.iconLetterSm]}>V</Text>
        </LinearGradient>
        <View>
          <View style={styles.nameRow}>
            <Text style={[styles.name, isSmall && styles.nameSm, dark && styles.nameDark]}>Vibe</Text>
            <Text style={[styles.match, isSmall && styles.matchSm, dark && styles.matchDark]}>Match</Text>
            <Animated.Text style={[styles.sparkle, sparkleStyle]}>✨</Animated.Text>
          </View>
          {!isSmall && <Text style={[styles.tagline, dark && styles.taglineDark]}>find your vibe</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  glow: {
    position: "absolute",
    top: -4,
    left: -4,
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#8A56FF33",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8A56FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  iconBoxSm: { width: 32, height: 32, borderRadius: 10 },
  iconLetter: { fontSize: 20, fontFamily: VibeFonts.extraBold, color: "#fff" },
  iconLetterSm: { fontSize: 16 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  name: { fontSize: 20, fontFamily: VibeFonts.extraBold, color: "#1A1A2E", letterSpacing: -0.5 },
  nameDark: { color: "#fff" },
  nameSm: { fontSize: 16 },
  match: { fontSize: 20, fontFamily: VibeFonts.extraBold, color: "#8A56FF", letterSpacing: -0.5 },
  matchDark: { color: "#C084FC" },
  matchSm: { fontSize: 16 },
  sparkle: { fontSize: 14, marginLeft: 2 },
  tagline: { fontSize: 10, fontFamily: VibeFonts.medium, color: "#9CA3AF", letterSpacing: 0.5, marginTop: -2 },
  taglineDark: { color: "rgba(255,255,255,0.5)" },
});
