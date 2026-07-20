import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { VibeColors, VibeFonts } from "../../constants/vibeTheme";
import { Spacing } from "../../constants/theme";

interface Props {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  light?: boolean;
}

export default function SectionHeader({ title, subtitle, action, onAction, light = false }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={styles.accent} />
        <View>
          <Text style={[styles.title, light && { color: "#1F1A3A" }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, light && { color: "rgba(31,26,58,0.6)" }]}>{subtitle}</Text> : null}
        </View>
      </View>
      {action && (
        <Pressable onPress={onAction}>
          <Text style={[styles.action, light && { color: "#8A56FF" }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  accent: { width: 3.5, height: 22, borderRadius: 2 },
  title: { fontSize: 15, fontFamily: VibeFonts.bold, color: VibeColors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 10, fontFamily: VibeFonts.medium, color: VibeColors.textMuted, marginTop: 1 },
  action: { fontSize: 12, fontFamily: VibeFonts.semiBold, color: "#C084FC" },
});
