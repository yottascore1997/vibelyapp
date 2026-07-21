import { Stack } from "expo-router";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import { AuthProvider } from "../context/AuthContext";
import { SidebarProvider } from "../context/SidebarContext";
import { OnboardingProvider } from "../context/OnboardingContext";
import { PlansProvider } from "../context/PlansContext";
import { MatchesProvider } from "../context/MatchesContext";
import { StatusBar } from "expo-status-bar";
import LoadingScreen from "../components/LoadingScreen";
import Sidebar from "../components/vibe/Sidebar";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <AuthProvider>
      <SidebarProvider>
        <OnboardingProvider>
          <PlansProvider>
          <MatchesProvider>
          {/* dark-content screens (Hangout/Travel/Profile) — avoid light icons on light bg */}
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              animationDuration: 140,
              // Match light app chrome so Travel → Profile doesn't flash a dark top band
              contentStyle: { backgroundColor: "#EEE9F8" },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ contentStyle: { backgroundColor: "#050508" } }} />
            <Stack.Screen
              name="(tabs)"
              options={{
                animation: "fade",
                animationDuration: 120,
                contentStyle: { backgroundColor: "#EEE9F8" },
              }}
            />
            <Stack.Screen
              name="hangout"
              options={{
                animation: "fade",
                animationDuration: 120,
                contentStyle: { backgroundColor: "#EEE9F8" },
              }}
            />
            <Stack.Screen
              name="travel"
              options={{
                animation: "fade",
                animationDuration: 120,
                contentStyle: { backgroundColor: "#EEE9F8" },
              }}
            />
            <Stack.Screen name="create-plan" options={{ animation: "slide_from_bottom" }} />
            <Stack.Screen name="create-travel-plan" options={{ animation: "slide_from_bottom" }} />
            <Stack.Screen name="reels" options={{ animation: "slide_from_bottom" }} />
            <Stack.Screen name="plan-details" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vibematch" />
            <Stack.Screen name="edit-profile" options={{ animation: "slide_from_bottom" }} />
            <Stack.Screen name="chat/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="my-matches" options={{ animation: "slide_from_right" }} />
            <Stack.Screen
              name="events-map"
              options={{
                animation: "slide_from_right",
                contentStyle: { backgroundColor: "#EEE9F8" },
              }}
            />
            <Stack.Screen name="explore-events" options={{ animation: "slide_from_right" }} />
          </Stack>
          <Sidebar />
          </MatchesProvider>
          </PlansProvider>
        </OnboardingProvider>
      </SidebarProvider>
    </AuthProvider>
  );
}
