import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { VibeFonts } from "../../constants/vibeTheme";

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function PremiumButton({
  label,
  onPress,
  loading,
  disabled,
  icon = "arrow-forward",
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.88}
      style={[styles.wrap, disabled && styles.wrapDisabled]}
    >
      <LinearGradient
        colors={disabled ? ["#E2E8F0", "#CBD5E1"] : ["#7C3AED", "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.btn}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Text style={styles.text}>{label}</Text>
            <View style={styles.iconCircle}>
              <Ionicons name={icon} size={16} color="#7C3AED" />
            </View>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    overflow: "hidden",
  },
  wrapDisabled: { opacity: 0.75 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.2,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
