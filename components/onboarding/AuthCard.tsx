import { View, StyleSheet } from "react-native";
import { Radius, Spacing } from "../../constants/theme";

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    shadowColor: "#8A56FF",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
});
