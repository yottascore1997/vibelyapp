import { useState } from "react";
import { Text, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import FormInput from "../../../components/onboarding/FormInput";
import PillSelect from "../../../components/onboarding/PillSelect";
import SectionLabel from "../../../components/onboarding/SectionLabel";
import { useOnboarding } from "../../../context/OnboardingContext";
import { GENDER_OPTIONS, INTERESTED_IN_OPTIONS, PRONOUNS_OPTIONS } from "../../../constants/onboarding";
import { Spacing } from "../../../constants/theme";

function calcAge(dob: string) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function BasicInfoScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [dob, setDob] = useState(data.dateOfBirth);

  const valid = data.firstName.trim() && dob && data.gender && data.interestedIn;

  const handleNext = () => {
    if (!dob.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Invalid Date", "Use format YYYY-MM-DD (e.g. 2000-05-15)");
      return;
    }
    if (calcAge(dob) < 18) {
      Alert.alert("Age Restriction", "You must be 18 or older to use VibeMatch");
      return;
    }
    update({ dateOfBirth: dob });
    router.push("/(auth)/onboarding/about-you");
  };

  return (
    <OnboardingLayout
      step={1}
      total={4}
      emoji="👋"
      title="Let's meet you"
      subtitle="Basic info — takes 30 seconds"
      onNext={handleNext}
      nextDisabled={!valid}
      showBack={false}
    >
      <FormInput label="First Name" value={data.firstName} onChangeText={(v) => update({ firstName: v })} placeholder="Your first name" icon="person-outline" />
      <FormInput label="Date of Birth" value={dob} onChangeText={setDob} placeholder="2000-05-15" icon="calendar-outline" />
      <Text style={styles.hint}>Must be 18+ · Format: YYYY-MM-DD</Text>

      <SectionLabel title="I am a..." emoji="👤" />
      <PillSelect options={GENDER_OPTIONS} value={data.gender} onChange={(v) => update({ gender: v })} columns={3} />

      <SectionLabel title="Interested in" emoji="💘" />
      <PillSelect options={INTERESTED_IN_OPTIONS} value={data.interestedIn} onChange={(v) => update({ interestedIn: v })} columns={3} />

      <SectionLabel title="Pronouns" emoji="🏷️" subtitle="Optional — helps others address you right" />
      <PillSelect options={PRONOUNS_OPTIONS} value={data.pronouns} onChange={(v) => update({ pronouns: v })} columns={2} />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 12, color: "#94A3B8", marginTop: -8, marginBottom: Spacing.md, fontWeight: "500" },
});
