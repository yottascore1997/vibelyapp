import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import FormInput from "../../../components/onboarding/FormInput";
import PillSelect from "../../../components/onboarding/PillSelect";
import SectionLabel from "../../../components/onboarding/SectionLabel";
import { useOnboarding } from "../../../context/OnboardingContext";
import {
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
  WORKOUT_OPTIONS,
  DIET_OPTIONS,
  PETS_OPTIONS,
  ZODIAC_OPTIONS,
  LANGUAGE_OPTIONS,
} from "../../../constants/onboarding";
import { Radius, Spacing } from "../../../constants/theme";

export default function AboutYouScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const toggleLanguage = (lang: string) => {
    const langs = data.languages.includes(lang)
      ? data.languages.filter((l) => l !== lang)
      : [...data.languages, lang];
    update({ languages: langs });
  };

  const valid = data.bio.trim().length > 0;

  return (
    <OnboardingLayout
      step={2}
      total={4}
      emoji="✨"
      title="About & Lifestyle"
      subtitle="Tell us about yourself and how you live your life"
      onNext={() => router.push("/(auth)/onboarding/interests")}
      nextDisabled={!valid}
    >
      <FormInput
        label="Bio"
        value={data.bio}
        onChangeText={(v) => update({ bio: v })}
        placeholder="What makes you, you? Tell people about yourself..."
        multiline
        maxLength={500}
        icon="chatbubble-ellipses-outline"
      />

      <FormInput
        label="Height"
        value={data.height}
        onChangeText={(v) => update({ height: v })}
        placeholder="5'10 or 178 cm"
        optional
        icon="resize-outline"
      />

      <SectionLabel title="Languages you speak" emoji="🗣️" />
      <View style={styles.langGrid}>
        {LANGUAGE_OPTIONS.map((lang) => {
          const active = data.languages.includes(lang);
          return (
            <TouchableOpacity key={lang} onPress={() => toggleLanguage(lang)} activeOpacity={0.85}>
              {active ? (
                <LinearGradient colors={["#7C3AED", "#8B5CF6"]} style={styles.langChipActive}>
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

      <FormInput
        label="Religion"
        value={data.religion}
        onChangeText={(v) => update({ religion: v })}
        placeholder="Optional"
        optional
        icon="heart-outline"
      />

      <SectionLabel title="Smoking Habits" emoji="🚬" />
      <PillSelect
        options={SMOKING_OPTIONS}
        value={data.smoking}
        onChange={(v) => update({ smoking: v })}
        columns={2}
      />

      <SectionLabel title="Drinking Habits" emoji="🍷" />
      <PillSelect
        options={DRINKING_OPTIONS}
        value={data.drinking}
        onChange={(v) => update({ drinking: v })}
        columns={2}
      />

      <SectionLabel title="Workout Routine" emoji="🏋️" />
      <PillSelect
        options={WORKOUT_OPTIONS}
        value={data.workout}
        onChange={(v) => update({ workout: v })}
        columns={2}
      />

      <SectionLabel title="Diet Preferences" emoji="🥗" />
      <PillSelect
        options={DIET_OPTIONS}
        value={data.diet}
        onChange={(v) => update({ diet: v })}
        columns={2}
      />

      <SectionLabel title="Pets" emoji="🐾" />
      <PillSelect
        options={PETS_OPTIONS}
        value={data.pets}
        onChange={(v) => update({ pets: v })}
        columns={2}
      />

      <SectionLabel title="Zodiac Sign" emoji="✨" subtitle="Optional" />
      <PillSelect
        options={ZODIAC_OPTIONS}
        value={data.zodiac}
        onChange={(v) => update({ zodiac: v })}
        columns={3}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  langGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: 14 },
  langChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: "#F8F9FD",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  langChipActive: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full },
  langText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  langTextActive: { fontSize: 13, fontWeight: "700", color: "#fff" },
});
