import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "../../constants/theme";

interface Props {
  title: string;
  subtitle: string;
  onBack?: () => void;
  badge?: string;
}

export default function AuthHeader({ title, subtitle, onBack, badge }: Props) {
  return (
    <View style={styles.wrap}>
      {onBack && (
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
      )}
      {badge && (
        <LinearGradient colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.08)"]} style={styles.badge}>
          <Ionicons name="sparkles" size={12} color="#FFD700" />
          <Text style={styles.badgeText}>{badge}</Text>
        </LinearGradient>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  title: { fontSize: 32, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "rgba(255,255,255,0.75)", marginTop: 8, lineHeight: 22 },
});
