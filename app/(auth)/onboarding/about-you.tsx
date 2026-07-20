import { useRouter } from "expo-router";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import FormInput from "../../../components/onboarding/FormInput";
import { useOnboarding } from "../../../context/OnboardingContext";

export default function AboutYouScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  return (
    <OnboardingLayout
      step={2}
      total={5}
      emoji="✍️"
      title="About You"
      subtitle="Show your personality — be authentic"
      onNext={() => router.push("/(auth)/onboarding/lifestyle")}
      nextDisabled={!data.bio.trim() || !data.occupation.trim() || !data.education.trim()}
    >
      <FormInput label="Bio" value={data.bio} onChangeText={(v) => update({ bio: v })} placeholder="What makes you, you?" multiline maxLength={500} icon="chatbubble-ellipses-outline" />
      <FormInput label="Occupation" value={data.occupation} onChangeText={(v) => update({ occupation: v })} placeholder="e.g. Software Engineer" icon="briefcase-outline" />
      <FormInput label="Company" value={data.company} onChangeText={(v) => update({ company: v })} placeholder="Where do you work?" optional icon="business-outline" />
      <FormInput label="Education" value={data.education} onChangeText={(v) => update({ education: v })} placeholder="e.g. B.Tech, MBA" icon="school-outline" />
      <FormInput label="College" value={data.college} onChangeText={(v) => update({ college: v })} placeholder="Your college/university" optional icon="library-outline" />
    </OnboardingLayout>
  );
}
