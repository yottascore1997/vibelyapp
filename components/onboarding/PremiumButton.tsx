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
        colors={disabled ? ["#D1D5DB", "#9CA3AF"] : ["#8A56FF", "#B44BFF", "#FF4B81"]}
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
    shadowColor: "#8A56FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
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
