import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { VibeColors, VibeFonts } from "../../constants/vibeTheme";

const actions = [
  { icon: "heart" as const, count: "39", color: "#fff" },
  { icon: "chatbubble" as const, count: "66", color: "#fff" },
  { icon: "repeat" as const, count: "2", color: "#fff" },
  { icon: "paper-plane" as const, count: "49", color: "#fff" },
];

function ActionBtn({ icon, count, color }: (typeof actions)[0]) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.85); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={styles.actionWrap}
    >
      <Animated.View style={anim}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={26} color={color} />
        </View>
        <Text style={styles.count}>{count}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function ReelsActionBar() {
  return (
    <View style={styles.bar}>
      {actions.map((a) => (
        <ActionBtn key={a.icon} {...a} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { alignItems: "center", gap: 22, paddingVertical: 8 },
  actionWrap: { alignItems: "center" },
  iconCircle: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  count: {
    color: VibeColors.text,
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    marginTop: 2,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
