import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Radius, Spacing } from "../../constants/theme";

export interface Option {
  id: string;
  label: string;
  icon?: string;
  emoji?: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  columns?: number;
}

export default function PillSelect({ options, value, onChange, columns = 2 }: Props) {
  const width = columns === 3 ? "31%" : "48%";

  return (
    <View style={styles.grid}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[styles.pillWrap, { width }]}
            onPress={() => onChange(opt.id)}
            activeOpacity={0.85}
          >
            {active ? (
              <LinearGradient colors={["#7C3AED", "#8B5CF6"]} style={styles.pillGradient}>
                <View style={styles.pillInner}>
                  {opt.emoji ? (
                    <Text style={styles.emojiText}>{opt.emoji}</Text>
                  ) : opt.icon ? (
                    <View style={styles.iconBoxActive}>
                      <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={16} color="#7C3AED" />
                    </View>
                  ) : null}
                  <Text style={[styles.pillText, styles.pillTextActive]}>{opt.label}</Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.pill}>
                {opt.emoji ? (
                  <Text style={styles.emojiText}>{opt.emoji}</Text>
                ) : opt.icon ? (
                  <View style={styles.iconBox}>
                    <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={16} color="#64748B" />
                  </View>
                ) : null}
                <Text style={styles.pillText}>{opt.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: Spacing.sm },
  pillWrap: { marginBottom: Spacing.xs },
  pillGradient: { borderRadius: Radius.lg, padding: 2 },
  pillInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: Radius.lg - 2,
    backgroundColor: "#F3E8FF",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: Radius.lg,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emojiText: { fontSize: 18 },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(100, 116, 139, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  pillTextActive: { color: "#7C3AED", fontWeight: "700" },
});
