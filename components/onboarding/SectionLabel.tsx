import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Spacing } from "../../constants/theme";

interface Props {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  optional?: boolean;
}

export default function SectionLabel({ title, subtitle, icon, emoji, optional }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        {emoji ? (
          <Text style={styles.emojiBadge}>{emoji}</Text>
        ) : icon ? (
          <View style={styles.iconBox}>
            <Ionicons name={icon} size={15} color="#7C3AED" />
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {optional && <Text style={styles.optional}> · Optional</Text>}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: Spacing.md, marginBottom: Spacing.xs },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBadge: { fontSize: 16 },
  title: { fontSize: 14, fontWeight: "700", color: "#18181B", letterSpacing: 0.2 },
  optional: { fontSize: 12, fontWeight: "500", color: "#94A3B8" },
  subtitle: { fontSize: 12, color: "#64748B", marginTop: 2 },
});
