import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { VibeFonts } from "../constants/vibeTheme";

type Props = {
  /** Extra offset above the tab bar shell */
  bottomOffset?: number;
};

export default function CreatePlanFab({ bottomOffset = 0 }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 72 + Math.max(insets.bottom, 12);
  const expand = useSharedValue(0);
  const [labelReady, setLabelReady] = useState(false);

  useEffect(() => {
    expand.value = withDelay(
      280,
      withSpring(1, { damping: 16, stiffness: 140 })
    );
    const t = setTimeout(() => setLabelReady(true), 420);
    return () => clearTimeout(t);
  }, []);

  const shellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(expand.value, [0, 1], [0.72, 1]) }],
    opacity: interpolate(expand.value, [0, 1], [0, 1]),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    maxWidth: interpolate(expand.value, [0, 1], [0, 140]),
    opacity: interpolate(expand.value, [0.45, 1], [0, 1]),
    marginLeft: interpolate(expand.value, [0, 1], [0, 8]),
  }));

  return (
    <Animated.View
      style={[
        styles.wrap,
        shellStyle,
        { bottom: tabBarHeight + 12 + bottomOffset },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={() => router.push("/create-plan")}
        style={({ pressed }) => [styles.press, pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] }]}
        accessibilityRole="button"
        accessibilityLabel="Create a plan"
      >
        <LinearGradient
          colors={["#22C55E", "#16A34A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <View style={styles.plusBubble}>
            <Ionicons name="add" size={22} color="#16A34A" />
          </View>
          {labelReady ? (
            <Animated.View style={[styles.labelClip, labelStyle]}>
              <Text style={styles.label} numberOfLines={1}>
                Create a plan
              </Text>
            </Animated.View>
          ) : (
            <View style={styles.labelClip} />
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 16,
    zIndex: 80,
    elevation: 12,
  },
  press: {
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#16A34A",
    shadowOpacity: 0.38,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 16,
    borderRadius: 999,
    minHeight: 52,
  },
  plusBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  labelClip: {
    overflow: "hidden",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.2,
  },
});
