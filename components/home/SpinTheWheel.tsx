import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { VibeFonts } from "../../constants/vibeTheme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const WHEEL_SIZE = 118;
const RADIUS = WHEEL_SIZE / 2;

const SPARK_COLORS = ["#FF4B81", "#8A56FF", "#FFD700", "#3B82F6", "#10B981", "#FF85A2", "#F59E0B", "#EF4444"];

export type WheelOption = {
  id: string;
  title: string;
  emoji: string;
  color: string;
};

export const WHEEL_OPTIONS: WheelOption[] = [
  { id: "coffee", title: "Coffee", emoji: "☕", color: "#F59E0B" },
  { id: "food", title: "Foodie", emoji: "🍕", color: "#EF4444" },
  { id: "movie", title: "Movie", emoji: "🍿", color: "#8B5CF6" },
  { id: "sports", title: "Sports", emoji: "⚽", color: "#22C55E" },
  { id: "drinks", title: "Drinks", emoji: "🍸", color: "#EC4899" },
  { id: "travel", title: "Trip", emoji: "✈️", color: "#0EA5E9" },
];

const N = WHEEL_OPTIONS.length;
const SEGMENT = 360 / N;

function PieSlice({ color, index }: { color: string; index: number }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.sliceHost, { transform: [{ rotate: `${index * SEGMENT}deg` }] }]}
    >
      <View style={styles.sliceClip}>
        <View
          style={[
            styles.slicePaint,
            {
              backgroundColor: color,
              transform: [
                { translateX: -RADIUS },
                { rotate: `${SEGMENT}deg` },
                { translateX: RADIUS },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
}

function SparkDot({
  angle,
  speed,
  color,
  size,
  rocketX,
  destY,
  progress,
}: {
  angle: number;
  speed: number;
  color: string;
  size: number;
  rocketX: number;
  destY: number;
  progress: Animated.SharedValue<number>;
}) {
  const sparkStyle = useAnimatedStyle(() => {
    if (progress.value < 1) return { opacity: 0 };
    const p = progress.value - 1;
    const currX = rocketX + Math.cos(angle) * speed * p;
    const currY = destY + Math.sin(angle) * speed * p + p * p * 28;
    return {
      transform: [{ translateX: currX }, { translateY: currY }, { scale: 1 - p * 0.55 }],
      opacity: 1 - p,
    };
  });

  return (
    <Animated.View
      style={[
        sparkStyle,
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 0.9,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
    />
  );
}

function Firecracker({ delayMs }: { delayMs: number }) {
  const progress = useSharedValue(0);
  const rocketX = 40 + Math.random() * (SCREEN_W - 80);
  const destY = SCREEN_H * 0.12 + Math.random() * (SCREEN_H * 0.28);
  const trailColor = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];

  const sparks = Array.from({ length: 16 }).map((_, i) => ({
    angle: (i * 2 * Math.PI) / 16 + Math.random() * 0.35,
    speed: 75 + Math.random() * 70,
    color: SPARK_COLORS[i % SPARK_COLORS.length],
    size: 5 + Math.random() * 5,
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = 0;
      progress.value = withTiming(
        1,
        { duration: 900, easing: Easing.bezier(0.22, 0.1, 0.25, 1) },
        (finished) => {
          if (finished) {
            progress.value = withTiming(2, {
              duration: 1200,
              easing: Easing.out(Easing.quad),
            });
          }
        }
      );
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  const rocketStyle = useAnimatedStyle(() => {
    if (progress.value >= 1) return { opacity: 0 };
    const currY = SCREEN_H - (SCREEN_H - destY) * progress.value;
    const wobble = Math.sin(progress.value * Math.PI * 3) * 6;
    return {
      transform: [{ translateX: rocketX + wobble }, { translateY: currY }],
      opacity: 1 - progress.value * 0.15,
    };
  });

  const trailStyle = useAnimatedStyle(() => {
    if (progress.value >= 1) return { opacity: 0 };
    const currY = SCREEN_H - (SCREEN_H - destY) * progress.value;
    const wobble = Math.sin(progress.value * Math.PI * 3) * 6;
    return {
      transform: [{ translateX: rocketX + wobble }, { translateY: currY + 14 }],
      opacity: Math.max(0, 0.7 - progress.value * 0.5),
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          trailStyle,
          {
            position: "absolute",
            width: 3,
            height: 14,
            borderRadius: 2,
            backgroundColor: trailColor,
            opacity: 0.5,
          },
        ]}
      />
      <Animated.View
        style={[
          rocketStyle,
          {
            position: "absolute",
            width: 5,
            height: 18,
            borderRadius: 2.5,
            backgroundColor: "#FFA500",
            shadowColor: "#FF8C00",
            shadowOpacity: 1,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      />
      {sparks.map((sp, i) => (
        <SparkDot
          key={i}
          angle={sp.angle}
          speed={sp.speed}
          color={sp.color}
          size={sp.size}
          rocketX={rocketX}
          destY={destY}
          progress={progress}
        />
      ))}
    </View>
  );
}

function FirecrackerShow({ showKey }: { showKey: number }) {
  const [rockets, setRockets] = useState<number[]>([]);

  useEffect(() => {
    setRockets([]);
    const ids: number[] = [];
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      ids.push(Date.now() + count);
      setRockets([...ids]);
      if (count >= 7) clearInterval(interval);
    }, 320);
    return () => clearInterval(interval);
  }, [showKey]);

  return (
    <>
      {rockets.map((id, index) => (
        <Firecracker key={`${showKey}-${id}`} delayMs={index * 40} />
      ))}
    </>
  );
}

interface Props {
  onResult?: (option: WheelOption) => void;
}

export default function SpinTheWheel({ onResult }: Props) {
  const rotation = useSharedValue(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelOption | null>(null);
  const [fireworks, setFireworks] = useState(false);
  const [fireworksKey, setFireworksKey] = useState(0);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const finishSpin = (option: WheelOption) => {
    setSpinning(false);
    setResult(option);
    setTimeout(() => onResult?.(option), 700);
  };

  const spin = () => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);
    setFireworksKey((k) => k + 1);
    setFireworks(true);
    setTimeout(() => setFireworks(false), 4200);

    const winIndex = Math.floor(Math.random() * N);
    const option = WHEEL_OPTIONS[winIndex];
    const center = winIndex * SEGMENT + SEGMENT / 2;
    const targetMod = (360 - center) % 360;
    const currentMod = ((rotation.value % 360) + 360) % 360;
    const delta = (targetMod - currentMod + 360) % 360;
    const next = rotation.value + (4 + Math.floor(Math.random() * 2)) * 360 + delta;

    rotation.value = withTiming(
      next,
      { duration: 3200, easing: Easing.bezier(0.12, 0.8, 0.2, 1) },
      (finished) => {
        if (finished) runOnJS(finishSpin)(option);
      }
    );
  };

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={["#312E81", "#6D28D9", "#DB2777"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.decor} />

        <View style={styles.wheelCol}>
          <View style={styles.pointer}>
            <View style={styles.pointerTip} />
          </View>
          <Animated.View style={[styles.wheel, wheelStyle]}>
            {WHEEL_OPTIONS.map((opt, i) => (
              <PieSlice key={opt.id} color={opt.color} index={i} />
            ))}
            {WHEEL_OPTIONS.map((opt, i) => {
              const mid = i * SEGMENT + SEGMENT / 2;
              return (
                <View
                  key={`lbl-${opt.id}`}
                  pointerEvents="none"
                  style={[
                    styles.labelWrap,
                    {
                      transform: [{ rotate: `${mid}deg` }, { translateY: -RADIUS * 0.55 }],
                    },
                  ]}
                >
                  <Text style={styles.labelEmoji}>{opt.emoji}</Text>
                </View>
              );
            })}
            <View style={styles.hub}>
              <Ionicons name="sparkles" size={14} color="#7C3AED" />
            </View>
          </Animated.View>
        </View>

        <View style={styles.copyCol}>
          <Text style={styles.eyebrow}>CONFUSED?</Text>
          <Text style={styles.title}>Spin the wheel</Text>
          <Text style={styles.sub} numberOfLines={2}>
            Aaj kya kare? Let fate pick a vibe
          </Text>

          <Pressable
            onPress={spin}
            disabled={spinning}
            style={({ pressed }) => [styles.spinBtn, (spinning || pressed) && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={spinning ? ["#94A3B8", "#64748B"] : ["#FFFFFF", "#FCE7F3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.spinBtnGrad}
            >
              <Text style={[styles.spinBtnText, spinning && { color: "#fff" }]}>
                {spinning ? "Spinning…" : "🎡 Spin"}
              </Text>
            </LinearGradient>
          </Pressable>

          {result ? (
            <Text style={styles.resultText}>
              {result.emoji} {result.title} — scanning…
            </Text>
          ) : null}
        </View>
      </LinearGradient>

      <Modal visible={fireworks} transparent animationType="none" statusBarTranslucent>
        <View style={styles.fireworksLayer} pointerEvents="none">
          <FirecrackerShow showKey={fireworksKey} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingLeft: 10,
    paddingRight: 14,
    minHeight: 132,
    gap: 10,
  },
  decor: {
    position: "absolute",
    right: -20,
    top: -24,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  wheelCol: {
    width: WHEEL_SIZE + 8,
    height: WHEEL_SIZE + 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pointer: {
    position: "absolute",
    top: 0,
    zIndex: 20,
  },
  pointerTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FDE047",
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: RADIUS,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.95)",
    backgroundColor: "#1E1B4B",
    alignItems: "center",
    justifyContent: "center",
  },
  sliceHost: {
    position: "absolute",
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  sliceClip: {
    position: "absolute",
    left: RADIUS,
    top: 0,
    width: RADIUS,
    height: RADIUS,
    overflow: "hidden",
  },
  slicePaint: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  labelWrap: {
    position: "absolute",
    width: 28,
    alignItems: "center",
  },
  labelEmoji: {
    fontSize: 13,
  },
  hub: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  copyCol: {
    flex: 1,
    paddingVertical: 4,
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: "#F9A8D4",
    letterSpacing: 0.9,
  },
  title: {
    marginTop: 2,
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    letterSpacing: -0.3,
  },
  sub: {
    marginTop: 3,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 15,
    marginBottom: 8,
  },
  spinBtn: {
    alignSelf: "flex-start",
    borderRadius: 999,
    overflow: "hidden",
  },
  spinBtnGrad: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  spinBtnText: {
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    color: "#6D28D9",
  },
  resultText: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#FDE68A",
  },
  fireworksLayer: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
