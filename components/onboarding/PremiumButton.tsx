import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Radius, Spacing } from "../../constants/theme";

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function PremiumButton({ label, onPress, loading, disabled, icon = "arrow-forward" }: Props) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.88} style={styles.wrap}>
      <LinearGradient
        colors={disabled ? ["#E2E8F0", "#CBD5E1"] : ["#7C3AED", "#8B5CF6", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.btn}
      >
        <Text style={styles.text}>{loading ? "Please wait..." : label}</Text>
        {!loading && <Ionicons name={icon} size={20} color="#fff" />}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: Radius.full,
  },
  text: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
});
