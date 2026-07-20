import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInRight, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { VibeFonts } from "../constants/vibeTheme";
import { Colors, Radius, Spacing } from "../constants/theme";

interface Interest {
  name: string;
  color: string;
}

interface Props {
  name: string;
  age: number;
  distance: number;
  avatarUrl: string;
  isVerified?: boolean;
  interests?: Interest[];
  index?: number;
  onPass?: () => void;
  onWave?: () => void;
  onLike?: () => void;
}

export default function ProfileCard({
  name,
  age,
  distance,
  avatarUrl,
  isVerified,
  interests = [],
  index = 0,
  onPass,
  onWave,
  onLike,
}: Props) {
  const cardScale = useSharedValue(1);
  const cardAnim = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));

  return (
    <Animated.View entering={FadeInRight.delay(index * 120).springify()}>
      <Pressable
        onPressIn={() => { cardScale.value = withSpring(0.97); }}
        onPressOut={() => { cardScale.value = withSpring(1); }}
      >
        <Animated.View style={[styles.card, cardAnim]}>
          <Image source={{ uri: avatarUrl }} style={styles.image} />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.85)"]} style={styles.overlay}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}, {age}</Text>
              {isVerified && <Ionicons name="checkmark-circle" size={18} color="#8A56FF" style={{ marginLeft: 4 }} />}
            </View>
            <View style={styles.distanceRow}>
              <Ionicons name="location" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.distance}>{distance} km away</Text>
            </View>
            <View style={styles.tags}>
              {interests.slice(0, 3).map((tag) => (
                <View key={tag.name} style={[styles.tag, { backgroundColor: tag.color + "44" }]}>
                  <Text style={[styles.tagText, { color: "#fff" }]}>{tag.name}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
          <View style={styles.actions}>
            <Pressable style={styles.actionBtn} onPress={onPass}>
              <Ionicons name="close" size={26} color={Colors.textSecondary} />
            </Pressable>
            <Pressable onPress={onWave}>
              <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={styles.waveBtn}>
                <Ionicons name="hand-left" size={20} color="#fff" />
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.likeBtn} onPress={onLike}>
              <LinearGradient colors={["#FF6B9D", "#FF4B81"]} style={styles.likeGrad}>
                <Ionicons name="heart" size={22} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 230,
    height: 330,
    borderRadius: Radius.xxl,
    overflow: "hidden",
    marginRight: Spacing.lg,
    backgroundColor: Colors.white,
    shadowColor: "#8A56FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  image: { width: "100%", height: "100%", position: "absolute" },
  overlay: {
    position: "absolute",
    bottom: 58,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingTop: 50,
  },
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 19, fontFamily: VibeFonts.bold, color: "#fff" },
  distanceRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  distance: { fontSize: 12, fontFamily: VibeFonts.medium, color: "rgba(255,255,255,0.9)" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  tagText: { fontSize: 10, fontFamily: VibeFonts.semiBold },
  actions: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  actionBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  waveBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8A56FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  likeBtn: { borderRadius: 25, overflow: "hidden" },
  likeGrad: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF4B81",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
