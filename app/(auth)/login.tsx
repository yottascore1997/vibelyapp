import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { VibeColors, VibeFonts } from "../../constants/vibeTheme";
import GlassCard from "../../components/vibe/GlassCard";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";

// Local Custom Light GlassInput component matching Hangout theme (no focus flicker)
function GlassInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={[
          styles.textInputContainer,
          focused ? styles.inputFocused : active ? styles.inputFilled : null,
        ]}
      >
        {icon && (
          <View style={[styles.inputIconBox, active && styles.inputIconBoxActive]}>
            <Ionicons
              name={icon}
              size={18}
              color={active ? "#7C3AED" : "#94A3B8"}
            />
          </View>
        )}
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Background Drift Shared Values
  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb1Scale = useSharedValue(1);

  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);

  // Mount/Entry Animations Shared Values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);

  // Background Glow animations
  useEffect(() => {
    orb1X.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-30, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(-40, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
        withTiming(40, { duration: 7000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb1Scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orb2X.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(25, { duration: 8000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(35, { duration: 6500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-35, { duration: 6500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Entry Animations on mount
  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    headerTranslateY.value = withDelay(100, withTiming(0, { duration: 600 }));

    formOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(300, withTiming(0, { duration: 600 }));
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (e: unknown) {
      Alert.alert("Login Failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setLoading(false);
    }
  };

  // Animated styles
  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb1X.value },
      { translateY: orb1Y.value },
      { scale: orb1Scale.value },
    ],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb2X.value },
      { translateY: orb2Y.value },
    ],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  return (
    <View style={styles.root}>
      {/* Light Clean Theme Background matching Hangout theme */}
      <LinearGradient
        colors={["#F8F9FD", "#F3E8FF", "#F8F9FD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Ambient Mesh Glow Orbs */}
      <Animated.View style={[styles.glowOrb, styles.glow1, orb1Style]} />
      <Animated.View style={[styles.glowOrb, styles.glow2, orb2Style]} />

      <SafeAreaView style={styles.safe}>
        {/* Back Button & Header Area */}
        <Animated.View style={headerAnimatedStyle}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#18181B" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.badge}>
              <Ionicons name="sparkles" size={11} color="#7C3AED" />
              <Text style={styles.badgeText}>WELCOME BACK</Text>
            </View>
            <Text style={styles.title}>Good to see you 👋</Text>
            <Text style={styles.subtitle}>Log in and pick up where you left off</Text>
          </View>
        </Animated.View>

        {/* Login Form Wrapper */}
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View style={formAnimatedStyle}>
              <View style={styles.glassCard}>
                <GlassInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  icon="mail-outline"
                />

                <GlassInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  icon="lock-closed-outline"
                />

                <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.88}>
                  <LinearGradient
                    colors={["#7C3AED", "#8B5CF6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitBtn}
                  >
                    <Text style={styles.submitBtnText}>{loading ? "Signing In..." : "Log In"}</Text>
                    <Ionicons name="log-in-outline" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace("/(auth)/register")} style={styles.linkWrap}>
                  <Text style={styles.linkText}>
                    New here? <Text style={styles.linkTextBold}>Create free account</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FD" },
  safe: { flex: 1, paddingHorizontal: Spacing.lg },
  flex: { flex: 1 },

  // Glowing Orbs
  glowOrb: { position: "absolute", borderRadius: 999, opacity: 0.6 },
  glow1: {
    width: 250,
    height: 250,
    top: -50,
    right: -50,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
  },
  glow2: {
    width: 220,
    height: 220,
    bottom: 120,
    left: -80,
    backgroundColor: "rgba(139, 92, 246, 0.06)",
  },

  // Back Button
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  // Header
  header: { marginBottom: Spacing.xl },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  badgeText: { color: "#7C3AED", fontSize: 9, fontFamily: VibeFonts.bold, letterSpacing: 1 },
  title: { fontSize: 32, fontFamily: VibeFonts.extraBold, color: "#18181B", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontFamily: VibeFonts.medium, color: "#64748B", marginTop: 8 },

  // Card Content
  glassCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.12)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // Inputs
  inputWrap: { marginBottom: Spacing.lg },
  inputLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
    marginBottom: Spacing.sm,
    letterSpacing: 0.2,
  },
  textInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: Spacing.md,
  },
  inputFocused: {
    borderColor: "#7C3AED",
    backgroundColor: "#F5F3FF",
  },
  inputFilled: {
    borderColor: "rgba(124, 58, 237, 0.4)",
    backgroundColor: "#FFFFFF",
  },
  inputIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  inputIconBoxActive: {
    backgroundColor: "rgba(124, 58, 237, 0.15)",
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#18181B",
    fontFamily: VibeFonts.medium,
  },

  // Submit Button
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },

  // Link wrapper
  linkWrap: { marginTop: Spacing.lg, alignItems: "center" },
  linkText: { color: "#64748B", fontSize: 13, fontFamily: VibeFonts.regular },
  linkTextBold: { color: "#7C3AED", fontFamily: VibeFonts.bold },
});
