import { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
} from "react-native-reanimated";
import { VibeColors, VibeFonts } from "../constants/vibeTheme";
import { Colors, Radius, Spacing } from "../constants/theme";

export type CategoryTheme = "friends" | "dating" | "hangout";

const THEMES: Record<
  CategoryTheme,
  { color: string; gradient: [string, string]; bg: string; iconBg: string; border: string; glow: string }
> = {
  friends: {
    color: "#4ADE80",
    gradient: ["#22C55E", "#15803D"],
    bg: "rgba(34, 197, 94, 0.14)",
    iconBg: "rgba(34, 197, 94, 0.22)",
    border: "rgba(74, 222, 128, 0.45)",
    glow: "rgba(34, 197, 94, 0.2)",
  },
  dating: {
    color: "#FB7185",
    gradient: ["#FF4B81", "#DB2777"],
    bg: "rgba(255, 75, 129, 0.14)",
    iconBg: "rgba(255, 75, 129, 0.22)",
    border: "rgba(251, 113, 133, 0.45)",
    glow: "rgba(255, 75, 129, 0.2)",
  },
  hangout: {
    color: "#FB923C",
    gradient: ["#F97316", "#EA580C"],
    bg: "rgba(249, 115, 22, 0.14)",
    iconBg: "rgba(249, 115, 22, 0.22)",
    border: "rgba(251, 146, 60, 0.45)",
    glow: "rgba(249, 115, 22, 0.2)",
  },
};

interface Props {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  fabIcon: keyof typeof Ionicons.glyphMap;
  theme?: CategoryTheme;
  color?: string;
  gradient?: readonly [string, string];
  emoji?: string;
  stat?: string;
  index?: number;
  dark?: boolean;
  onPress?: () => void;
}

export default function CategoryCard({
  title,
  subtitle,
  icon,
  fabIcon,
  theme,
  color: colorProp,
  gradient: gradientProp,
  emoji,
  stat,
  index = 0,
  dark,
  onPress,
}: Props) {
  const palette = theme ? THEMES[theme] : null;
  const color = palette?.color ?? colorProp ?? "#8A56FF";
  const gradient = palette?.gradient ?? (gradientProp as [string, string]) ?? (["#8A56FF", "#6B3FD4"] as [string, string]);
  const bg = palette?.bg ?? "rgba(138, 86, 255, 0.12)";
  const iconBg = palette?.iconBg ?? "rgba(138, 86, 255, 0.2)";
  const border = palette?.border ?? "rgba(138, 86, 255, 0.4)";
  const glow = palette?.glow ?? "rgba(138, 86, 255, 0.18)";

  const scale = useSharedValue(1);
  const fabPulse = useSharedValue(1);

  useEffect(() => {
    fabPulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 1400 }), withTiming(1, { duration: 1400 })),
      -1,
      false
    );
  }, [fabPulse]);

  const cardAnim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const fabAnim = useAnimatedStyle(() => ({ transform: [{ scale: fabPulse.value }] }));

  if (dark) {
    return (
      <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={styles.outer}>
        <Pressable
          onPress={onPress}
          onPressIn={() => { scale.value = withSpring(0.97); }}
          onPressOut={() => { scale.value = withSpring(1); }}
        >
          <Animated.View style={cardAnim}>
            <View style={[styles.darkShell, { borderColor: border }]}>
              <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.topBar} />
              <View style={[styles.darkInner, { backgroundColor: bg }]}>
                <View style={[styles.colorGlow, { backgroundColor: glow }]} />

                {stat ? (
                  <View style={[styles.statBadge, { borderColor: border }]}>
                    <View style={[styles.statDot, { backgroundColor: color }]} />
                    <Text style={[styles.statText, { color }]}>{stat}</Text>
                  </View>
                ) : null}

                <View style={[styles.iconRing, { backgroundColor: iconBg, borderColor: border }]}>
                  <Ionicons name={icon} size={20} color={color} />
                </View>

                <View style={styles.titleRow}>
                  {emoji ? <Text style={styles.titleEmoji}>{emoji}</Text> : null}
                  <Text style={styles.titleDark}>{title}</Text>
                </View>
                <Text style={styles.subtitleDark} numberOfLines={2}>{subtitle}</Text>

                <Animated.View style={[styles.fabWrap, fabAnim]}>
                  <LinearGradient colors={gradient} style={styles.fab}>
                    <Ionicons name={fabIcon} size={15} color="#fff" />
                  </LinearGradient>
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.outer}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <Animated.View style={cardAnim}>
          <View style={styles.cardShell}>
            <View style={styles.card}>
              <View style={[styles.iconBadge, { backgroundColor: color + "18" }]}>
                <Ionicons name={icon} size={20} color={color} />
              </View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
            </View>
            <LinearGradient colors={gradient} style={styles.fabLight}>
              <Ionicons name={fabIcon} size={15} color="#fff" />
            </LinearGradient>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: { marginRight: Spacing.sm + 2 },
  darkShell: {
    width: 132,
    height: 118,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#12121A",
  },
  topBar: { height: 3, width: "100%" },
  darkInner: { flex: 1, padding: Spacing.sm + 2, paddingBottom: 34, position: "relative", overflow: "hidden" },
  colorGlow: {
    position: "absolute",
    top: -24,
    right: -16,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  statBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    zIndex: 2,
  },
  statDot: { width: 4, height: 4, borderRadius: 2 },
  statText: { fontSize: 8, fontFamily: VibeFonts.bold },
  iconRing: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  titleEmoji: { fontSize: 13 },
  titleDark: { fontSize: 14, fontFamily: VibeFonts.extraBold, color: VibeColors.text, letterSpacing: -0.2 },
  subtitleDark: { fontSize: 10, fontFamily: VibeFonts.medium, color: VibeColors.textMuted, marginTop: 2, lineHeight: 13 },
  fabWrap: { position: "absolute", bottom: 6, right: 6 },
  fab: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: VibeColors.bg,
  },
  cardShell: { width: 132, height: 118, position: "relative" },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    paddingBottom: 36,
    shadowColor: "#8A56FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 14, fontFamily: VibeFonts.bold, color: Colors.text },
  subtitle: { fontSize: 10, fontFamily: VibeFonts.regular, color: Colors.textSecondary, marginTop: 2, lineHeight: 13 },
  fabLight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: VibeColors.bg,
  },
});
