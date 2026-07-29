import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect href="/(auth)/welcome" />;
  const isOnboardingDone = Boolean(user.onboardingDone ?? (user as any).profile?.onboardingDone ?? false);
  if (!isOnboardingDone) return <Redirect href="/(auth)/onboarding/basic-info" />;
  return <Redirect href="/(tabs)" />;
}
