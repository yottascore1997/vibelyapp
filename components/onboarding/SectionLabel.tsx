import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VibeFonts } from "../../constants/vibeTheme";

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
            <Ionicons name={icon} size={14} color="#7C3AED" />
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {optional ? <Text style={styles.optional}> · Optional</Text> : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14, marginBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBadge: { fontSize: 15 },
  title: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  optional: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 4,
    marginLeft: 34,
  },
});
