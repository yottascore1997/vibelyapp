import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "./vibe/GlassCard";
import { VibeColors, VibeFonts } from "../constants/vibeTheme";
import { Colors, Radius, Spacing } from "../constants/theme";

interface Props {
  message: string;
  buttonText?: string;
  dark?: boolean;
  onPress?: () => void;
}

export default function NotificationBanner({ message, buttonText = "View >", dark, onPress }: Props) {
  if (dark) {
    return (
      <GlassCard style={styles.glassBanner}>
        <View style={styles.avatars}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.avatar, styles.avatarDark, { marginLeft: i > 1 ? -10 : 0, zIndex: 4 - i }]} />
          ))}
        </View>
        <Text style={styles.messageDark}>{message}</Text>
        <Pressable onPress={onPress}>
          <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={styles.btn}>
            <Text style={styles.btnText}>{buttonText}</Text>
          </LinearGradient>
        </Pressable>
      </GlassCard>
    );
  }

  return (
    <LinearGradient colors={["#FDF2F8", "#F3E8FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.banner}>
      <View style={styles.avatars}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.avatar, { marginLeft: i > 1 ? -10 : 0, zIndex: 4 - i }]} />
        ))}
      </View>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onPress}>
        <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={styles.btn}>
          <Text style={styles.btnText}>{buttonText}</Text>
        </LinearGradient>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.xl,
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  glassBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  avatars: { flexDirection: "row" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarDark: { borderColor: VibeColors.bgGlassBorder },
  message: { flex: 1, fontSize: 12, fontFamily: VibeFonts.medium, color: Colors.text, lineHeight: 17 },
  messageDark: { flex: 1, fontSize: 12, fontFamily: VibeFonts.medium, color: VibeColors.text, lineHeight: 17 },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  btnText: { color: "#fff", fontSize: 12, fontFamily: VibeFonts.bold },
});
