import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Radius, Spacing } from "../../constants/theme";

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: "default" | "email-address" | "numeric";
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  optional,
  multiline,
  maxLength,
  keyboardType = "default",
  icon,
}: Props) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {optional && <Text style={styles.optional}> · Optional</Text>}
      </Text>
      <View
        style={[
          styles.inputWrap,
          focused ? styles.inputWrapFocused : active ? styles.inputWrapFilled : null,
        ]}
      >
        {icon && (
          <View style={[styles.iconBox, active && styles.iconBoxActive]}>
            <Ionicons name={icon} size={18} color={active ? "#7C3AED" : "#94A3B8"} />
          </View>
        )}
        <TextInput
          style={[styles.input, multiline && styles.multiline, icon && { paddingLeft: 0 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor="#94A3B8"
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {maxLength && (
        <View style={styles.counterRow}>
          <View style={[styles.progressMini, { width: `${(value.length / maxLength) * 100}%` }]} />
          <Text style={styles.counter}>
            {value.length}/{maxLength}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "700", color: "#18181B", marginBottom: Spacing.xs, letterSpacing: 0.2 },
  optional: { fontWeight: "500", color: "#94A3B8" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: Spacing.md,
  },
  inputWrapFocused: { borderColor: "#7C3AED", backgroundColor: "#F5F3FF" },
  inputWrapFilled: { borderColor: "rgba(124, 58, 237, 0.4)", backgroundColor: "#FFFFFF" },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  iconBoxActive: { backgroundColor: "rgba(124, 58, 237, 0.15)" },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#18181B",
    fontWeight: "500",
  },
  multiline: { height: 110, textAlignVertical: "top", paddingTop: 14 },
  counterRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  progressMini: { flex: 1, height: 3, backgroundColor: "#7C3AED", borderRadius: 2, maxWidth: "70%" },
  counter: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
});
