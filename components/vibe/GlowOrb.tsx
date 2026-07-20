import { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { VibeFonts } from "../../constants/vibeTheme";

interface Props {
  color: string;
  glow: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function GlowOrb({ color, glow, label, selected, onPress }: Props) {
  const pulse = useSharedValue(1);
  const scale = useSharedValue(selected ? 1.08 : 1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulse]);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.1 : 1, { damping: 12 });
  }, [selected, scale]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selected ? pulse.value : 1 }],
    opacity: selected ? 0.9 : 0.5,
  }));

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <Animated.View style={[styles.glow, { backgroundColor: glow, shadowColor: color }, glowStyle]} />
      <Animated.View style={[styles.orb, { backgroundColor: color }, orbStyle]}>
        <View style={styles.shine} />
      </Animated.View>
      <Text style={[styles.label, { color }, selected && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", flex: 1 },
  glow: {
    position: "absolute",
    top: 8,
    width: 72,
    height: 72,
    borderRadius: 36,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  orb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  shine: {
    position: "absolute",
    top: 8,
    left: 12,
    width: 20,
    height: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.35)",
    transform: [{ rotate: "-20deg" }],
  },
  label: { fontSize: 13, fontFamily: VibeFonts.semiBold, marginTop: 10 },
  labelActive: { fontFamily: VibeFonts.bold },
});
