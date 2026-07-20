import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Image, Modal, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { ZoomIn, useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from "react-native-reanimated";
import { VibeColors, VibeFonts } from "../../constants/vibeTheme";
import { Radius, Spacing } from "../../constants/theme";
import { MatchProfile } from "../../constants/matches";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

function Firecracker({ delay }: { delay: number }) {
  const progress = useSharedValue(0);
  const rocketX = Math.random() * (SCREEN_W - 100) + 50;
  const destY = SCREEN_H * 0.2 + Math.random() * (SCREEN_H * 0.35);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: 850, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
      (finished) => {
        if (finished) {
          progress.value = withTiming(2, { duration: 1100, easing: Easing.out(Easing.quad) });
        }
      }
    );
  }, []);

  const rocketStyle = useAnimatedStyle(() => {
    if (progress.value >= 1) return { opacity: 0 };
    const currY = SCREEN_H - (SCREEN_H - destY) * progress.value;
    return {
      transform: [
        { translateX: rocketX },
        { translateY: currY },
      ],
      opacity: 1 - progress.value * 0.2,
    };
  });

  const sparks = Array.from({ length: 14 }).map((_, i) => {
    const angle = (i * 2 * Math.PI) / 14;
    const speed = 70 + Math.random() * 50;
    const color = ["#FF4B81", "#8A56FF", "#FFD700", "#3B82F6", "#10B981", "#FF85A2"][i % 6];
    return { angle, speed, color };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          rocketStyle,
          {
            position: "absolute",
            width: 4,
            height: 20,
            borderRadius: 2,
            backgroundColor: "#FFA500",
          },
        ]}
      />

      {sparks.map((sp, i) => {
        const sparkStyle = useAnimatedStyle(() => {
          if (progress.value < 1) return { opacity: 0 };
          const p = progress.value - 1;
          const currX = rocketX + Math.cos(sp.angle) * sp.speed * p;
          const currY = destY + Math.sin(sp.angle) * sp.speed * p + (p * p * 20);
          return {
            transform: [
              { translateX: currX },
              { translateY: currY },
            ],
            opacity: 1 - p,
            scale: 1 - p * 0.5,
          };
        });

        return (
          <Animated.View
            key={i}
            style={[
              sparkStyle,
              {
                position: "absolute",
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: sp.color,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function FirecrackerLauncher() {
  const [rockets, setRockets] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRockets((prev) => {
        if (prev.length >= 8) {
          clearInterval(interval);
          return prev;
        }
        return [...prev, Date.now() + Math.random()];
      });
    }, 380);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {rockets.map((id, index) => (
        <Firecracker key={id} delay={index * 380} />
      ))}
    </>
  );
}

interface Props {
  visible: boolean;
  match: MatchProfile | null;
  onChat: () => void;
  onKeepSwiping: () => void;
}

export default function MatchModal({ visible, match, onChat, onKeepSwiping }: Props) {
  if (!match) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(450).springify()} style={styles.card}>
          <LinearGradient colors={["#1a1028", "#0d0d14", "#050508"]} style={styles.cardInner}>
            <Text style={styles.tag}>IT'S A MATCH! 💘</Text>
            <Text style={styles.title}>You & {match.name.split(" ")[0]}</Text>
            <Text style={styles.sub}>Local match in {match.city || "your area"} · ab explore kar sakte ho</Text>

            <View style={styles.avatars}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop" }}
                style={styles.avatar}
              />
              <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={styles.heartCircle}>
                <Ionicons name="heart" size={22} color="#fff" />
              </LinearGradient>
              <Image source={{ uri: match.avatarUrl }} style={styles.avatar} />
            </View>

            <Pressable onPress={onChat} style={styles.chatWrap}>
              <LinearGradient colors={["#FF4B81", "#8A56FF"]} style={styles.chatBtn}>
                <Ionicons name="chatbubble" size={18} color="#fff" />
                <Text style={styles.chatText}>Send Message</Text>
              </LinearGradient>
            </Pressable>

            <Pressable onPress={onKeepSwiping}>
              <Text style={styles.keepText}>Keep Swiping</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
        <FirecrackerLauncher />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5,5,8,0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  card: { width: "100%", borderRadius: Radius.xxl, overflow: "hidden" },
  cardInner: { padding: Spacing.xl, alignItems: "center" },
  tag: { fontSize: 11, fontFamily: VibeFonts.bold, color: VibeColors.textGold, letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 28, fontFamily: VibeFonts.extraBold, color: VibeColors.text, letterSpacing: -0.5 },
  sub: { fontSize: 13, fontFamily: VibeFonts.medium, color: VibeColors.textMuted, marginTop: 8, textAlign: "center" },
  avatars: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: Spacing.xl },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: "#fff" },
  heartCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -8,
    zIndex: 2,
  },
  chatWrap: { width: "100%", borderRadius: Radius.xl, overflow: "hidden", marginBottom: Spacing.md },
  chatBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  chatText: { color: "#fff", fontSize: 15, fontFamily: VibeFonts.bold },
  keepText: { fontSize: 14, fontFamily: VibeFonts.semiBold, color: "#C084FC" },
});
