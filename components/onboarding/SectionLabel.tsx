import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing } from "../../constants/theme";

interface Props {
  title: string;
  subtitle?: string;
}

export default function SectionLabel({ title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  title: { fontSize: 15, fontWeight: "700", color: Colors.text, letterSpacing: 0.2 },
  subtitle: { fontSize: 12, color: Colors.textLight, marginTop: 4 },
});
