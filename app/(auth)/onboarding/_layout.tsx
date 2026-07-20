import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="basic-info" />
      <Stack.Screen name="about-you" />
      <Stack.Screen name="lifestyle" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="preferences" />
    </Stack>
  );
}
