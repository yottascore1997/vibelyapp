import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "../../constants/theme";

interface Item {
  name: string;
  icon: string;
  color: string;
}

interface Props {
  items: Item[];
  selected: string[];
  onToggle: (name: string) => void;
}

export default function InterestGrid({ items, selected, onToggle }: Props) {
  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const active = selected.includes(item.name);
        return (
          <TouchableOpacity key={item.name} onPress={() => onToggle(item.name)} activeOpacity={0.85} style={styles.chipWrap}>
            {active ? (
              <LinearGradient colors={[item.color + "CC", item.color]} style={styles.chipActive}>
                <View style={styles.iconWrap}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color="#fff" />
                </View>
                <Text style={styles.chipTextActive}>{item.name}</Text>
                <View style={styles.check}>
                  <Ionicons name="checkmark" size={10} color={item.color} />
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.chip}>
                <View style={[styles.iconWrap, { backgroundColor: item.color + "18" }]}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={item.color} />
                </View>
                <Text style={styles.chipText}>{item.name}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chipWrap: { width: "31%" },
  chip: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: "#F8F9FD",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  chipText: { fontSize: 11, fontWeight: "600", color: "#18181B", textAlign: "center" },
  chipTextActive: { fontSize: 11, fontWeight: "700", color: "#fff", textAlign: "center" },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
