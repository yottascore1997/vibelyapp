import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VibeFonts } from "../../constants/vibeTheme";

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
        {optional ? <Text style={styles.optional}> · Optional</Text> : null}
      </Text>
      <View
        style={[
          styles.inputWrap,
          focused ? styles.inputWrapFocused : active ? styles.inputWrapFilled : null,
        ]}
      >
        {icon ? (
          <View style={[styles.iconBox, active && styles.iconBoxActive]}>
            <Ionicons name={icon} size={17} color={active ? "#7C3AED" : "#94A3B8"} />
          </View>
        ) : null}
        <TextInput
          style={[styles.input, multiline && styles.multiline, icon ? { paddingLeft: 0 } : null]}
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
      {maxLength ? (
        <View style={styles.counterRow}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressMini,
                { width: `${Math.min(100, (value.length / maxLength) * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.counter}>
            {value.length}/{maxLength}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
    marginBottom: 6,
  },
  optional: {
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
  },
  inputWrapFocused: {
    borderColor: "#7C3AED",
    backgroundColor: "#F5F3FF",
  },
  inputWrapFilled: {
    borderColor: "#DDD6FE",
    backgroundColor: "#FFFFFF",
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  iconBoxActive: {
    backgroundColor: "rgba(124, 58, 237, 0.15)",
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#18181B",
    fontFamily: VibeFonts.medium,
  },
  multiline: { height: 110, textAlignVertical: "top", paddingTop: 14 },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#EDE9FE",
    overflow: "hidden",
    maxWidth: "70%",
  },
  progressMini: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 2,
  },
  counter: {
    fontSize: 11,
    color: "#94A3B8",
    fontFamily: VibeFonts.semiBold,
  },
});
