import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import PillSelect from "../../../components/onboarding/PillSelect";
import SectionLabel from "../../../components/onboarding/SectionLabel";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useAuth } from "../../../context/AuthContext";
import { GENDER_PREF_OPTIONS, LOOKING_FOR_OPTIONS } from "../../../constants/onboarding";
import { Colors, Radius, Spacing } from "../../../constants/theme";

export default function PreferencesScreen() {
  const router = useRouter();
  const { data, update, saveProfile, saving } = useOnboarding();
  const { completeOnboarding } = useAuth();
  const [minAge, setMinAge] = useState(data.minAge);
  const [maxAge, setMaxAge] = useState(data.maxAge);
  const [distance, setDistance] = useState(data.maxDistance);

  const toggleLookingFor = (id: string) => {
    const list = data.lookingFor.includes(id)
      ? data.lookingFor.filter((l) => l !== id)
      : [...data.lookingFor, id];
    update({ lookingFor: list });
  };

  const handleFinish = async () => {
    if (!data.genderPreference || data.lookingFor.length === 0) {
      Alert.alert("Almost there!", "Please select gender preference and what you're looking for");
      return;
    }
    try {
      await saveProfile({ minAge, maxAge, maxDistance: distance, lookingFor: data.lookingFor, genderPreference: data.genderPreference });
      await completeOnboarding();
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Save Failed", e instanceof Error ? e.message : "Profile save nahi hui.");
    }
  };

  const RangeChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      {active ? (
        <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={styles.rangeChipActive}>
          <Text style={styles.rangeTextActive}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.rangeChip}>
          <Text style={styles.rangeText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <OnboardingLayout
      step={5}
      total={5}
      emoji="💫"
      title="Match Preferences"
      subtitle="Who are you looking for?"
      onNext={handleFinish}
      nextLabel={saving ? "Creating profile..." : "Start Matching 🎉"}
      nextDisabled={!data.genderPreference || data.lookingFor.length === 0 || saving}
    >
      <LinearGradient colors={["#1a0a2e", "#4a1a6b"]} style={styles.ageBanner}>
        <Text style={styles.ageBannerLabel}>Age Range</Text>
        <Text style={styles.ageBannerVal}>{minAge} – {maxAge} years</Text>
      </LinearGradient>

      <SectionLabel title="Min Age" />
      <View style={styles.rangeRow}>
        {[18, 22, 25, 30, 35, 40, 50, 60].map((age) => (
          <RangeChip key={`min-${age}`} label={String(age)} active={minAge === age} onPress={() => { setMinAge(age); if (age > maxAge) setMaxAge(age); }} />
        ))}
      </View>

      <SectionLabel title="Max Age" />
      <View style={styles.rangeRow}>
        {[25, 30, 35, 40, 45, 50, 55, 60].map((age) => (
          <RangeChip key={`max-${age}`} label={String(age)} active={maxAge === age} onPress={() => { setMaxAge(age); if (age < minAge) setMinAge(age); }} />
        ))}
      </View>

      <LinearGradient colors={["#1a0a2e", "#4a1a6b"]} style={styles.ageBanner}>
        <Text style={styles.ageBannerLabel}>Distance</Text>
        <Text style={styles.ageBannerVal}>{distance} km radius</Text>
      </LinearGradient>

      <View style={styles.rangeRow}>
        {[5, 10, 25, 50, 100].map((d) => (
          <RangeChip key={d} label={`${d} km`} active={distance === d} onPress={() => setDistance(d)} />
        ))}
      </View>

      <SectionLabel title="Show me" />
      <PillSelect options={GENDER_PREF_OPTIONS} value={data.genderPreference} onChange={(v) => update({ genderPreference: v })} columns={3} />

      <SectionLabel title="Looking for" subtitle="Select all that apply" />
      <View style={styles.lookingGrid}>
        {LOOKING_FOR_OPTIONS.map((opt) => {
          const active = data.lookingFor.includes(opt.id);
          return (
            <TouchableOpacity key={opt.id} onPress={() => toggleLookingFor(opt.id)} activeOpacity={0.85}>
              {active ? (
                <LinearGradient colors={[opt.color + "DD", opt.color]} style={styles.lookingCardActive}>
                  <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={22} color="#fff" />
                  <Text style={styles.lookingLabelActive}>{opt.label}</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={styles.lookingCard}>
                  <View style={[styles.lookingIcon, { backgroundColor: opt.color + "18" }]}>
                    <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={22} color={opt.color} />
                  </View>
                  <Text style={styles.lookingLabel}>{opt.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  ageBanner: { padding: Spacing.lg, borderRadius: Radius.lg, marginBottom: Spacing.md, marginTop: Spacing.sm },
  ageBannerLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "600", letterSpacing: 0.5 },
  ageBannerVal: { fontSize: 24, fontWeight: "800", color: "#fff", marginTop: 4 },
  rangeRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.lg },
  rangeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: "#FAFAFE", borderWidth: 1.5, borderColor: "#EDE9FE" },
  rangeChipActive: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full },
  rangeText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  rangeTextActive: { fontSize: 13, fontWeight: "700", color: "#fff" },
  lookingGrid: { gap: Spacing.sm },
  lookingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: "#FAFAFE",
    borderWidth: 1.5,
    borderColor: "#EDE9FE",
  },
  lookingCardActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  lookingIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  lookingLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: Colors.text },
  lookingLabelActive: { flex: 1, fontSize: 14, fontWeight: "700", color: "#fff" },
});
