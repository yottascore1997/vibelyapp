import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import FormInput from "../../../components/onboarding/FormInput";
import PillSelect from "../../../components/onboarding/PillSelect";
import SectionLabel from "../../../components/onboarding/SectionLabel";
import { useOnboarding } from "../../../context/OnboardingContext";
import {
  SMOKING_OPTIONS, DRINKING_OPTIONS, WORKOUT_OPTIONS, DIET_OPTIONS,
  PETS_OPTIONS, ZODIAC_OPTIONS, LANGUAGE_OPTIONS,
} from "../../../constants/onboarding";
import { Colors, Radius, Spacing } from "../../../constants/theme";

export default function LifestyleScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const toggleLanguage = (lang: string) => {
    const langs = data.languages.includes(lang)
      ? data.languages.filter((l) => l !== lang)
      : [...data.languages, lang];
    update({ languages: langs });
  };

  const valid = data.height && data.smoking && data.drinking && data.workout && data.diet && data.pets;

  return (
    <OnboardingLayout
      step={3}
      total={5}
      emoji="🌿"
      title="Your Lifestyle"
      subtitle="The little things that define you"
      onNext={() => router.push("/(auth)/onboarding/interests")}
      nextDisabled={!valid}
    >
      <FormInput label="Height" value={data.height} onChangeText={(v) => update({ height: v })} placeholder="5'10 or 178 cm" icon="resize-outline" />

      <SectionLabel title="Languages you speak" />
      <View style={styles.langGrid}>
        {LANGUAGE_OPTIONS.map((lang) => {
          const active = data.languages.includes(lang);
          return (
            <TouchableOpacity key={lang} onPress={() => toggleLanguage(lang)} activeOpacity={0.85}>
              {active ? (
                <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={styles.langChipActive}>
                  <Text style={styles.langTextActive}>{lang}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.langChip}>
                  <Text style={styles.langText}>{lang}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <FormInput label="Religion" value={data.religion} onChangeText={(v) => update({ religion: v })} placeholder="Optional" optional icon="heart-outline" />

      <SectionLabel title="Smoking" />
      <PillSelect options={SMOKING_OPTIONS} value={data.smoking} onChange={(v) => update({ smoking: v })} columns={2} />

      <SectionLabel title="Drinking" />
      <PillSelect options={DRINKING_OPTIONS} value={data.drinking} onChange={(v) => update({ drinking: v })} columns={2} />

      <SectionLabel title="Workout" />
      <PillSelect options={WORKOUT_OPTIONS} value={data.workout} onChange={(v) => update({ workout: v })} columns={2} />

      <SectionLabel title="Diet" />
      <PillSelect options={DIET_OPTIONS} value={data.diet} onChange={(v) => update({ diet: v })} columns={2} />

      <SectionLabel title="Pets" />
      <PillSelect options={PETS_OPTIONS} value={data.pets} onChange={(v) => update({ pets: v })} columns={2} />

      <SectionLabel title="Zodiac" subtitle="Optional" />
      <PillSelect options={ZODIAC_OPTIONS} value={data.zodiac} onChange={(v) => update({ zodiac: v })} columns={3} />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  langGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.lg },
  langChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: "#FAFAFE", borderWidth: 1.5, borderColor: "#EDE9FE" },
  langChipActive: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full },
  langText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  langTextActive: { fontSize: 13, fontWeight: "700", color: "#fff" },
});
