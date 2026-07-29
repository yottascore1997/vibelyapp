import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { Radius, Spacing } from "../../constants/theme";
import { VibeFonts } from "../../constants/vibeTheme";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";

const MOCK_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80",
];

// Smooth VibrantInput component without flickering focus state
function VibrantInput({
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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(true);

  const orb1Y = useSharedValue(0);
  const orb2Y = useSharedValue(0);

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);

  useEffect(() => {
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(12, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orb2Y.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-15, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    headerTranslateY.value = withDelay(100, withTiming(0, { duration: 500 }));

    formOpacity.value = withDelay(250, withTiming(1, { duration: 500 }));
    formTranslateY.value = withDelay(250, withTiming(0, { duration: 500 }));
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

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb1Y.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb2Y.value }],
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
      <LinearGradient
        colors={["#F8F9FD", "#F3E8FF", "#FFF0F5", "#F8F9FD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.glowOrb, styles.glow1, orb1Style]} />
      <Animated.View style={[styles.glowOrb, styles.glow2, orb2Style]} />

      <SafeAreaView style={styles.safe}>
        <Animated.View style={headerAnimatedStyle}>
          <View style={styles.topNavRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#18181B" />
            </TouchableOpacity>

            <View style={styles.socialProofPill}>
              <View style={styles.avatarStack}>
                {MOCK_AVATARS.map((uri, idx) => (
                  <Image
                    key={idx}
                    source={{ uri }}
                    style={[styles.stackAvatar, { marginLeft: idx === 0 ? 0 : -8 }]}
                  />
                ))}
              </View>
              <View style={styles.livePulseDot} />
              <Text style={styles.socialProofText}>50K+ Live</Text>
            </View>
          </View>

          <View style={styles.header}>
            <LinearGradient
              colors={["#7C3AED", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badge}
            >
              <Ionicons name="flash" size={11} color="#FFFFFF" />
              <Text style={styles.badgeText}>REAL TIME MEETUPS</Text>
            </LinearGradient>

            <Text style={styles.title}>Create your vibe ✨</Text>
            <Text style={styles.subtitle}>Takes 2 minutes — then you're ready to hang out!</Text>
            
            <LinearGradient
              colors={["#7C3AED", "#EC4899", "#F59E0B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.accentLine}
            />
          </View>
        </Animated.View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View style={formAnimatedStyle}>
              
              <View style={styles.formCard}>
                <View style={styles.securityBanner}>
                  <LinearGradient
                    colors={["rgba(16,185,129,0.12)", "rgba(16,185,129,0.04)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.securityBannerGrad}
                  >
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                    <Text style={styles.securityText}>100% Encrypted & Privacy Safe</Text>
                  </LinearGradient>
                </View>

                <VibrantInput
                  label="📧 Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  icon="mail-outline"
                />

                <VibrantInput
                  label="🔒 Create Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min 6 characters"
                  secureTextEntry
                  icon="lock-closed-outline"
                />

                <VibrantInput
                  label="🔑 Confirm Password"
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Re-enter password"
                  secureTextEntry
                  icon="key-outline"
                />

                <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
                  <LinearGradient
                    colors={agreed ? ["#7C3AED", "#8B5CF6"] : ["#E2E8F0", "#E2E8F0"]}
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
                    colors={["#7C3AED", "#8B5CF6", "#EC4899"]}
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
                    Already a member? <Text style={styles.linkTextBold}>Sign In ›</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.perksRow}>
                {[
                  { icon: "flash-outline", label: "Instant Meets" },
                  { icon: "heart-outline", label: "Real Matches" },
                  { icon: "lock-closed-outline", label: "Privacy First" },
                ].map((item) => (
                  <View key={item.label} style={styles.perkChip}>
                    <Ionicons name={item.icon as any} size={13} color="#7C3AED" />
                    <Text style={styles.perkText}>{item.label}</Text>
                  </View>
                ))}
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

  glowOrb: { position: "absolute", borderRadius: 999, opacity: 0.7 },
  glow1: {
    width: 280,
    height: 280,
    top: -40,
    right: -50,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
  },
  glow2: {
    width: 240,
    height: 240,
    bottom: 80,
    left: -70,
    backgroundColor: "rgba(236, 72, 153, 0.1)",
  },

  topNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  socialProofPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.15)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  stackAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  socialProofText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },

  header: { marginBottom: Spacing.md },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginBottom: 8,
  },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontFamily: VibeFonts.bold, letterSpacing: 1 },
  title: { fontSize: 32, fontFamily: VibeFonts.extraBold, color: "#18181B", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: VibeFonts.medium, color: "#64748B", marginTop: 4 },
  accentLine: {
    height: 3,
    width: 60,
    borderRadius: 2,
    marginTop: 10,
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.15)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },

  securityBanner: {
    borderRadius: Radius.md,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  securityBannerGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  securityText: { fontSize: 12, fontFamily: VibeFonts.bold, color: "#10B981" },

  inputWrap: { marginBottom: Spacing.md },
  inputLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
    marginBottom: 6,
  },
  textInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
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
    borderRadius: 10,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  inputIconBoxActive: {
    backgroundColor: "rgba(124, 58, 237, 0.15)",
  },
  textInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: "#18181B",
    fontFamily: VibeFonts.medium,
  },

  termsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: Spacing.lg, marginTop: 4 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    borderColor: "transparent",
  },
  termsText: { flex: 1, fontSize: 12, fontFamily: VibeFonts.medium, color: "#64748B" },
  termsBold: { color: "#7C3AED", fontFamily: VibeFonts.bold },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: Radius.full,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  linkWrap: { marginTop: Spacing.lg, alignItems: "center" },
  linkText: { color: "#64748B", fontSize: 13, fontFamily: VibeFonts.regular },
  linkTextBold: { color: "#7C3AED", fontFamily: VibeFonts.bold },

  perksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: Spacing.xl,
    paddingHorizontal: 4,
  },
  perkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.12)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  perkText: {
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
    color: "#475569",
  },
});
