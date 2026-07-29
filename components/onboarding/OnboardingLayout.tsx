import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AuthBackground from "./AuthBackground";
import PremiumButton from "./PremiumButton";
import { Colors, Radius, Spacing } from "../../constants/theme";

const STEP_LABELS = ["Basic", "About & Life", "Vibes", "Match"];

interface Props {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  emoji?: string;
  children: React.ReactNode;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}

export default function OnboardingLayout({
  step,
  total,
  title,
  subtitle,
  emoji,
  children,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  showBack = true,
}: Props) {
  const router = useRouter();

  return (
    <AuthBackground>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.topBar}>
          {showBack ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#18181B" />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}
          <View style={styles.stepDots}>
            {Array.from({ length: total }).map((_, i) => (
              <View key={i} style={[styles.dot, i + 1 <= step && styles.dotActive, i + 1 === step && styles.dotCurrent]} />
            ))}
          </View>
          <Text style={styles.stepNum}>{step}/{total}</Text>
        </View>

        <View style={styles.headerText}>
          {emoji && <Text style={styles.emoji}>{emoji}</Text>}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.stepLabels}>
            {STEP_LABELS.map((l, i) => (
              <Text key={l} style={[styles.stepLabel, i + 1 === step && styles.stepLabelActive]}>{l}</Text>
            ))}
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        <View style={styles.footer}>
          <PremiumButton label={nextLabel} onPress={onNext} disabled={nextDisabled} />
        </View>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  safe: { paddingHorizontal: Spacing.lg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: Spacing.xs },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  stepDots: { flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(124, 58, 237, 0.15)" },
  dotActive: { backgroundColor: "rgba(124, 58, 237, 0.4)" },
  dotCurrent: { width: 24, backgroundColor: "#7C3AED" },
  stepNum: { color: "#7C3AED", fontSize: 13, fontWeight: "700", width: 42, textAlign: "right" },
  headerText: { paddingTop: 4, paddingBottom: 8 },
  emoji: { fontSize: 26, marginBottom: 2 },
  title: { fontSize: 24, fontWeight: "800", color: "#18181B", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 2, lineHeight: 18 },
  stepLabels: { flexDirection: "row", gap: Spacing.sm, marginTop: 4 },
  stepLabel: { fontSize: 10, fontWeight: "600", color: "#94A3B8", letterSpacing: 0.5 },
  stepLabelActive: { color: "#7C3AED", fontWeight: "700" },
  flex: { flex: 1, marginTop: 4 },
  content: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 130,
    minHeight: 450,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.12)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 6,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
});
