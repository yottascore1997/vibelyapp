import { View, Text, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "../../constants/theme";

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
  const filled = value.length > 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {optional && <Text style={styles.optional}> · Optional</Text>}
      </Text>
      <View style={[styles.inputWrap, filled && styles.inputWrapFilled]}>
        {icon && (
          <View style={styles.iconBox}>
            <Ionicons name={icon} size={18} color={filled ? Colors.primary : Colors.textLight} />
          </View>
        )}
        <TextInput
          style={[styles.input, multiline && styles.multiline, icon && { paddingLeft: 0 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={Colors.textLight}
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
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
  wrap: { marginBottom: Spacing.lg },
  label: { fontSize: 13, fontWeight: "700", color: Colors.text, marginBottom: Spacing.sm, letterSpacing: 0.2 },
  optional: { fontWeight: "500", color: Colors.textLight },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFE",
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: "#EDE9FE",
    paddingHorizontal: Spacing.md,
    shadowColor: "#8A56FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  inputWrapFilled: { borderColor: Colors.primary + "55", backgroundColor: "#FDF4FF" },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500",
  },
  multiline: { height: 120, textAlignVertical: "top", paddingTop: 16 },
  counterRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  progressMini: { flex: 1, height: 3, backgroundColor: Colors.primary, borderRadius: 2, maxWidth: "70%" },
  counter: { fontSize: 11, color: Colors.textLight, fontWeight: "600" },
});
