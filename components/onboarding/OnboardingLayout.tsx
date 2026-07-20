import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AuthBackground from "./AuthBackground";
import PremiumButton from "./PremiumButton";
import { Colors, Radius, Spacing } from "../../constants/theme";

const STEP_LABELS = ["Basic", "About", "Life", "Vibes", "Match"];

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
    <View style={styles.root}>
      <AuthBackground>
        <SafeAreaView style={styles.safe}>
          <View style={styles.topBar}>
            {showBack ? (
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
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
      </AuthBackground>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safe: { paddingHorizontal: Spacing.lg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: Spacing.sm },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDots: { flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.25)" },
  dotActive: { backgroundColor: "rgba(255,255,255,0.6)" },
  dotCurrent: { width: 24, backgroundColor: "#fff" },
  stepNum: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "700", width: 42, textAlign: "right" },
  headerText: { paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
  emoji: { fontSize: 40, marginBottom: Spacing.sm },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 8, lineHeight: 20 },
  stepLabels: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.lg },
  stepLabel: { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.35)", letterSpacing: 0.5 },
  stepLabelActive: { color: "#FFD700" },
  flex: { flex: 1, marginTop: -20 },
  content: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.lg,
    paddingBottom: 120,
    minHeight: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: "#F3F0FF",
  },
});
