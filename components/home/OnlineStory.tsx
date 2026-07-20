import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInRight } from "react-native-reanimated";
import PulseDot from "./PulseDot";
import { VibeFonts } from "../../constants/vibeTheme";
import { Colors, Radius, Spacing } from "../../constants/theme";

const STORY_GRADIENTS: [string, string][] = [
  ["#8A56FF", "#FF4B81"],
  ["#22C55E", "#16A34A"],
  ["#3B82F6", "#8B5CF6"],
  ["#F97316", "#EF4444"],
  ["#EC4899", "#FF4B81"],
];

interface Props {
  name: string;
  avatarUrl?: string;
  isYou?: boolean;
  index: number;
  dark?: boolean;
  onPress?: () => void;
}

export default function OnlineStory({ name, avatarUrl, isYou, index, dark, onPress }: Props) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const gradient = STORY_GRADIENTS[index % STORY_GRADIENTS.length];

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).springify()}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.92); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={styles.wrap}
      >
        <Animated.View style={anim}>
          {isYou ? (
            <LinearGradient colors={gradient} style={styles.ring}>
              <View style={styles.youInner}>
                <Ionicons name="add" size={26} color={Colors.primary} />
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.avatarWrap}>
              <LinearGradient colors={gradient} style={styles.ring}>
                <View style={{
                  width: 62,
                  height: 62,
                  borderRadius: 31,
                  backgroundColor: dark ? "#0D0D14" : "#F7F5FC",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Image source={{ uri: avatarUrl }} style={{ width: 54, height: 54, borderRadius: 27 }} />
                </View>
              </LinearGradient>
              <View style={styles.dotWrap}>
                <PulseDot size={12} />
              </View>
            </View>
          )}
        </Animated.View>
        <Text style={[styles.name, dark ? styles.nameDark : { color: "#1F1A3A", fontFamily: VibeFonts.bold }]} numberOfLines={1}>{name}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", width: 72, marginRight: Spacing.md },
  ring: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 62, height: 62, borderRadius: 31 },
  youInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: { position: "relative" },
  dotWrap: { position: "absolute", bottom: 2, right: 2 },
  name: { fontSize: 11, fontFamily: VibeFonts.medium, color: Colors.textSecondary, marginTop: 8, textAlign: "center" },
  nameDark: { color: "rgba(255,255,255,0.65)" },
});
