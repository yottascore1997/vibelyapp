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

// Local Custom GlassInput component to avoid breaking light-themed onboarding inputs
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
  const filled = value.length > 0;

  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={[
          styles.textInputContainer,
          focused && styles.inputFocused,
          filled && styles.inputFilled,
        ]}
      >
        {icon && (
          <View style={styles.inputIconBox}>
            <Ionicons
              name={icon}
              size={18}
              color={focused || filled ? Colors.accent : "rgba(255,255,255,0.4)"}
            />
          </View>
        )}
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

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

  const handleRegister = async () => {
    if (!email || !password || !confirm) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Error", "Passwords don't match");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (!agreed) {
      Alert.alert("Error", "Please agree to Terms & Privacy Policy");
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password);
      router.replace("/(auth)/onboarding/basic-info");
    } catch (e: unknown) {
      Alert.alert("Registration Failed", e instanceof Error ? e.message : "Try again");
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
      {/* Dark Theme Background */}
      <LinearGradient
        colors={["#0A0618", "#050508", "#0F061E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Glowing Background Orbs */}
      <Animated.View style={[styles.glowOrb, styles.glow1, orb1Style]} />
      <Animated.View style={[styles.glowOrb, styles.glow2, orb2Style]} />

      <SafeAreaView style={styles.safe}>
        {/* Back Button & Header Area */}
        <Animated.View style={headerAnimatedStyle}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header}>
            <LinearGradient colors={["rgba(255,215,0,0.2)", "rgba(255,215,0,0.02)"]} style={styles.badge}>
              <Ionicons name="sparkles" size={11} color="#FFD700" />
              <Text style={styles.badgeText}>JOIN VIBEMATCH</Text>
            </LinearGradient>
            <Text style={styles.title}>Create your vibe ✨</Text>
            <Text style={styles.subtitle}>Takes 2 minutes — then you're in</Text>
          </View>
        </Animated.View>

        {/* Register Form Wrapper */}
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View style={formAnimatedStyle}>
              {/* Frosted Hint Box */}
              <GlassCard style={styles.hintBox}>
                <Ionicons name="shield-checkmark" size={16} color="#22C55E" />
                <Text style={styles.hintText}>Your data is safe & encrypted</Text>
              </GlassCard>

              <GlassCard style={styles.glassCard}>
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
                  placeholder="Min 6 characters"
                  secureTextEntry
                  icon="lock-closed-outline"
                />

                <GlassInput
                  label="Confirm Password"
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Re-enter password"
                  secureTextEntry
                  icon="key-outline"
                />

                {/* Glassmorphic Checkbox */}
                <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
                  <LinearGradient
                    colors={agreed ? [Colors.primary, Colors.secondary] : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.05)"]}
                    style={[styles.checkbox, agreed && styles.checkboxActive]}
                  >
                    {agreed && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </LinearGradient>
                  <Text style={styles.termsText}>
                    I agree to <Text style={styles.termsBold}>Terms</Text> & <Text style={styles.termsBold}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.88}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitBtn}
                  >
                    <Text style={styles.submitBtnText}>{loading ? "Creating Account..." : "Continue"}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={styles.linkWrap}>
                  <Text style={styles.linkText}>
                    Already a member? <Text style={styles.linkTextBold}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </GlassCard>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050508" },
  safe: { flex: 1, paddingHorizontal: Spacing.lg },
  flex: { flex: 1 },

  // Glowing Orbs
  glowOrb: { position: "absolute", borderRadius: 999, opacity: 0.6 },
  glow1: {
    width: 250,
    height: 250,
    top: -50,
    right: -50,
    backgroundColor: "rgba(138,86,255,0.18)",
  },
  glow2: {
    width: 220,
    height: 220,
    bottom: 120,
    left: -80,
    backgroundColor: "rgba(255,75,129,0.12)",
  },

  // Back Button
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },

  // Header
  header: { marginBottom: Spacing.md },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
  },
  badgeText: { color: "#FFD700", fontSize: 9, fontFamily: VibeFonts.bold, letterSpacing: 1 },
  title: { fontSize: 32, fontFamily: VibeFonts.extraBold, color: VibeColors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontFamily: VibeFonts.medium, color: VibeColors.textMuted, marginTop: 8 },

  // Hint Box
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
    backgroundColor: "rgba(34,197,94,0.06)",
  },
  hintText: { fontSize: 13, fontFamily: VibeFonts.bold, color: "#22C55E" },

  // Card Content
  glassCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
  },

  // Glass Inputs
  inputWrap: { marginBottom: Spacing.lg },
  inputLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "rgba(255,255,255,0.8)",
    marginBottom: Spacing.sm,
    letterSpacing: 0.2,
  },
  textInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: Spacing.md,
  },
  inputFocused: {
    borderColor: Colors.secondary,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  inputFilled: {
    borderColor: Colors.primary + "88",
  },
  inputIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#fff",
    fontFamily: VibeFonts.medium,
  },

  // Checkbox terms
  termsRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.xl, marginTop: Spacing.xs },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    borderColor: "transparent",
  },
  termsText: { flex: 1, fontSize: 13, fontFamily: VibeFonts.medium, color: "rgba(255,255,255,0.65)" },
  termsBold: { color: Colors.accent, fontFamily: VibeFonts.bold },

  // Submit Button
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },

  // Link wrapper
  linkWrap: { marginTop: Spacing.lg, alignItems: "center" },
  linkText: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: VibeFonts.regular },
  linkTextBold: { color: Colors.accent, fontFamily: VibeFonts.bold },
});
