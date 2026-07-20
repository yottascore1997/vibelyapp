import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import InterestGrid from "../../../components/onboarding/InterestGrid";
import { useOnboarding } from "../../../context/OnboardingContext";
import { INTEREST_OPTIONS } from "../../../constants/onboarding";
import { Colors, Radius, Spacing } from "../../../constants/theme";

export default function InterestsScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const toggle = (name: string) => {
    const interests = data.interests.includes(name)
      ? data.interests.filter((i) => i !== name)
      : [...data.interests, name];
    update({ interests });
  };

  const progress = Math.min(data.interests.length / 3, 1);

  return (
    <OnboardingLayout
      step={4}
      total={5}
      emoji="🎯"
      title="Your Vibes"
      subtitle="Pick at least 3 — we'll match you better"
      onNext={() => router.push("/(auth)/onboarding/preferences")}
      nextDisabled={data.interests.length < 3}
    >
      <LinearGradient colors={["#FDF4FF", "#FFF0F5"]} style={styles.counterBox}>
        <View style={styles.counterTop}>
          <Text style={styles.counterNum}>{data.interests.length}</Text>
          <Text style={styles.counterLabel}> selected · min 3</Text>
        </View>
        <View style={styles.progressBg}>
          <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </LinearGradient>
      <InterestGrid items={INTEREST_OPTIONS} selected={data.interests} onToggle={toggle} />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  counterBox: { padding: Spacing.lg, borderRadius: Radius.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: "#EDE9FE" },
  counterTop: { flexDirection: "row", alignItems: "baseline", marginBottom: Spacing.sm },
  counterNum: { fontSize: 28, fontWeight: "800", color: Colors.primary },
  counterLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: "600" },
  progressBg: { height: 6, backgroundColor: "#EDE9FE", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
});
