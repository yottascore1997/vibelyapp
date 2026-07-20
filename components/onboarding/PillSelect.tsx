import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "../../constants/theme";

interface Option {
  id: string;
  label: string;
  icon?: string;
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
              <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={styles.pillGradient}>
                <View style={styles.pillInner}>
                  {opt.icon && <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={20} color={Colors.primary} />}
                  <Text style={[styles.pillText, styles.pillTextActive]}>{opt.label}</Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.pill}>
                {opt.icon && <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={20} color={Colors.textSecondary} />}
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
  pillWrap: { marginBottom: Spacing.sm },
  pillGradient: { borderRadius: Radius.lg, padding: 2 },
  pillInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: Radius.lg - 2,
    backgroundColor: "#FDF4FF",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: Radius.lg,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#EDE9FE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pillText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  pillTextActive: { color: Colors.primary, fontWeight: "700" },
});
