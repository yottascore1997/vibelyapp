import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { VibeFonts } from "../../constants/vibeTheme";

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
                  {opt.emoji ? <Text style={styles.emojiText}>{opt.emoji}</Text> : null}
                  {!opt.emoji && opt.icon ? (
                    <View style={styles.iconBoxActive}>
                      <Ionicons
                        name={opt.icon as keyof typeof Ionicons.glyphMap}
                        size={15}
                        color="#7C3AED"
                      />
                    </View>
                  ) : null}
                  <Text style={[styles.pillText, styles.pillTextActive]} numberOfLines={1}>
                    {opt.label}
                  </Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.pill}>
                {opt.emoji ? <Text style={styles.emojiText}>{opt.emoji}</Text> : null}
                {!opt.emoji && opt.icon ? (
                  <View style={styles.iconBox}>
                    <Ionicons
                      name={opt.icon as keyof typeof Ionicons.glyphMap}
                      size={15}
                      color="#64748B"
                    />
                  </View>
                ) : null}
                <Text style={styles.pillText} numberOfLines={1}>
                  {opt.label}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  pillWrap: { marginBottom: 4 },
  pillGradient: { borderRadius: 16, padding: 2 },
  pillInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "#F3E8FF",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#F8F9FD",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  emojiText: { fontSize: 16 },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(100, 116, 139, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: {
    fontSize: 13,
    fontFamily: VibeFonts.semiBold,
    color: "#64748B",
  },
  pillTextActive: {
    color: "#7C3AED",
    fontFamily: VibeFonts.extraBold,
  },
});
