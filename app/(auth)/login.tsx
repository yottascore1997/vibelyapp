import { useState, useEffect, useRef } from "react";
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import type { ConfirmationResult } from "firebase/auth";
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
import {
  getFirebaseWebConfig,
  isFirebaseConfigured,
  toE164,
  sendPhoneOtp,
  confirmPhoneOtp,
} from "../../services/firebase";

/** Demo number — OTP always 123456, no Firebase SMS */
const DUMMY_PHONE = "9420413822";
const DUMMY_OTP = "123456";

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithFirebase, loginWithDevOtp } = useAuth();
  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const dummyModeRef = useRef(false);

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [e164, setE164] = useState("");

  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb1Scale = useSharedValue(1);
  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);

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

    headerOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    headerTranslateY.value = withDelay(100, withTiming(0, { duration: 600 }));
    formOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(300, withTiming(0, { duration: 600 }));
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    const last10 = digits.slice(-10);

    // Dummy FIRST — never touch Firebase for this number
    if (last10 === DUMMY_PHONE || digits === DUMMY_PHONE) {
      console.log("[OTP] dummy mode — skipping Firebase");
      dummyModeRef.current = true;
      confirmationRef.current = null;
      setE164(`+91${DUMMY_PHONE}`);
      setPhone(DUMMY_PHONE);
      setStep("otp");
      setOtp("");
      setResendIn(30);
      return;
    }

    let normalized: string;
    try {
      normalized = toE164(phone);
    } catch (e) {
      Alert.alert("Invalid number", e instanceof Error ? e.message : "Check number");
      return;
    }

    dummyModeRef.current = false;

    const cfg = getFirebaseWebConfig();
    console.log("[OTP] Firebase project:", cfg.projectId, "authDomain:", cfg.authDomain);

    if (!isFirebaseConfigured()) {
      Alert.alert(
        "Firebase setup pending",
        "mobile/.env mein EXPO_PUBLIC_FIREBASE_* keys add karo, phir app restart karo."
      );
      return;
    }
    if (!recaptchaRef.current) {
      Alert.alert("Error", "reCAPTCHA not ready. Try again.");
      return;
    }

    setLoading(true);
    try {
      const confirmation = await sendPhoneOtp(normalized, recaptchaRef.current as any);
      confirmationRef.current = confirmation;
      setE164(normalized);
      setStep("otp");
      setOtp("");
      setResendIn(30);
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error("sendOtp error", e);
      if (/too-many-requests/i.test(msg)) {
        Alert.alert("Too many tries", "Thodi der baad OTP maango.");
      } else if (/invalid-phone/i.test(msg)) {
        Alert.alert("Invalid number", "Sahi mobile number daalo (+91…).");
      } else if (/billing-not-enabled/i.test(msg)) {
        Alert.alert(
          "Billing link incomplete",
          "Real SMS ke liye Google Cloud Billing link karo.\n\n" +
            "Abhi demo try karo:\n9420413822  →  OTP 123456\n\n" +
            "Neeche 'Demo login' button bhi hai."
        );
      } else if (/operation-not-allowed|region enabled/i.test(msg)) {
        Alert.alert(
          "SMS region blocked",
          "Firebase → SMS region policy mein India (IN) allow karo.\n\nDemo: 9420413822 / 123456"
        );
      } else if (/missing.*config|Firebase config/i.test(msg)) {
        Alert.alert("Firebase config", msg);
      } else {
        Alert.alert("OTP failed", msg || "Could not send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const finishWithUser = (user: { onboardingDone?: boolean } | null) => {
    if (user?.onboardingDone) {
      router.replace("/");
    } else {
      router.replace("/(auth)/onboarding/basic-info");
    }
  };

  const runDummyLogin = async () => {
    setLoading(true);
    dummyModeRef.current = true;
    try {
      console.log("[OTP] dummy login → /auth/dev-otp");
      const user = await loginWithDevOtp(`+91${DUMMY_PHONE}`, DUMMY_OTP);
      finishWithUser(user);
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error("dummy login error", e);
      Alert.alert(
        "Demo login failed",
        /404|HTML|not found|failed \(404\)/i.test(msg)
          ? "Server pe /auth/dev-otp deploy nahi hai. Web redeploy karo.\n\n" + msg
          : msg || "Try again"
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim() || otp.trim().length < 6) {
      Alert.alert("Enter OTP", "6-digit code daalo");
      return;
    }

    const digits = (e164 || phone).replace(/\D/g, "");
    const isDummy =
      dummyModeRef.current ||
      digits.endsWith(DUMMY_PHONE) ||
      phone.replace(/\D/g, "") === DUMMY_PHONE;

    // Dummy path — never Firebase
    if (isDummy) {
      if (otp.trim() !== DUMMY_OTP) {
        Alert.alert("Wrong OTP", "Demo OTP 123456 hai");
        return;
      }
      await runDummyLogin();
      return;
    }

    if (!confirmationRef.current) {
      Alert.alert("Session expired", "Pehle OTP dubara bhejo");
      setStep("phone");
      return;
    }
    setLoading(true);
    try {
      const { idToken } = await confirmPhoneOtp(confirmationRef.current, otp);
      const user = await loginWithFirebase(idToken);
      finishWithUser(user);
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error("verifyOtp error", e);
      if (/invalid-verification-code|code-expired/i.test(msg)) {
        Alert.alert("Wrong OTP", "OTP galat ya expire ho gaya. Dubara try karo.");
      } else {
        Alert.alert("Login failed", msg || "Try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb1X.value },
      { translateY: orb1Y.value },
      { scale: orb1Scale.value },
    ],
  }));
  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }],
  }));
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));
  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const firebaseConfig = isFirebaseConfigured() ? getFirebaseWebConfig() : null;

  return (
    <View style={styles.root}>
      {firebaseConfig ? (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaRef}
          firebaseConfig={firebaseConfig}
          attemptInvisibleVerification
        />
      ) : null}

      <LinearGradient
        colors={["#F8F9FD", "#F3E8FF", "#F8F9FD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.glowOrb, styles.glow1, orb1Style]} />
      <Animated.View style={[styles.glowOrb, styles.glow2, orb2Style]} />

      <SafeAreaView style={styles.safe}>
        <Animated.View style={headerAnimatedStyle}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#18181B" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.badge}>
              <Ionicons name="phone-portrait-outline" size={11} color="#7C3AED" />
              <Text style={styles.badgeText}>
                {step === "phone" ? "MOBILE LOGIN" : "VERIFY OTP"}
              </Text>
            </View>
            <Text style={styles.title}>
              {step === "phone" ? "Enter your number" : "Enter OTP"}
            </Text>
            <Text style={styles.subtitle}>
              {step === "phone"
                ? "We'll send a one-time code via SMS"
                : `Code sent to ${e164}`}
            </Text>
          </View>
        </Animated.View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={formAnimatedStyle}>
              <View style={styles.glassCard}>
                {step === "phone" ? (
                  <>
                    <Text style={styles.inputLabel}>Mobile number</Text>
                    <View style={styles.phoneRow}>
                      <View style={styles.countryBox}>
                        <Text style={styles.countryText}>🇮🇳 +91</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        value={phone}
                        onChangeText={(t) =>
                          setPhone(t.replace(/[^\d]/g, "").slice(0, 10))
                        }
                        placeholder="9876543210"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        maxLength={10}
                        autoFocus
                      />
                    </View>

                    <TouchableOpacity
                      onPress={sendOtp}
                      disabled={loading || phone.length < 10}
                      activeOpacity={0.88}
                    >
                      <LinearGradient
                        colors={["#7C3AED", "#8B5CF6"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.submitBtn,
                          (loading || phone.length < 10) && { opacity: 0.55 },
                        ]}
                      >
                        {loading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <Text style={styles.submitBtnText}>Send OTP</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={runDummyLogin}
                      disabled={loading}
                      style={styles.demoBtn}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.demoBtnText}>
                        Demo login · 9420413822
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.inputLabel}>6-digit OTP</Text>
                    <TextInput
                      style={styles.otpInput}
                      value={otp}
                      onChangeText={(t) =>
                        setOtp(t.replace(/[^\d]/g, "").slice(0, 6))
                      }
                      placeholder="••••••"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      maxLength={6}
                      textContentType="oneTimeCode"
                      autoFocus
                    />

                    <TouchableOpacity
                      onPress={verifyOtp}
                      disabled={loading || otp.length < 6}
                      activeOpacity={0.88}
                    >
                      <LinearGradient
                        colors={["#7C3AED", "#8B5CF6"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.submitBtn,
                          (loading || otp.length < 6) && { opacity: 0.55 },
                        ]}
                      >
                        {loading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <Text style={styles.submitBtnText}>Verify & continue</Text>
                            <Ionicons name="checkmark-circle" size={18} color="#fff" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.otpActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setStep("phone");
                          setOtp("");
                          confirmationRef.current = null;
                          dummyModeRef.current = false;
                        }}
                      >
                        <Text style={styles.changeNumber}>Change number</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={resendIn > 0 || loading}
                        onPress={sendOtp}
                      >
                        <Text
                          style={[
                            styles.resend,
                            resendIn > 0 && { color: "#94A3B8" },
                          ]}
                        >
                          {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                <Text style={styles.secureNote}>
                  Secured by Firebase phone authentication
                </Text>
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
  },
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
  badgeText: {
    color: "#7C3AED",
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 8,
  },
  glassCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.12)",
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
    marginBottom: Spacing.sm,
  },
  phoneRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: Spacing.lg,
  },
  countryBox: {
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    backgroundColor: "#F8F9FD",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    justifyContent: "center",
  },
  countryText: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  phoneInput: {
    flex: 1,
    backgroundColor: "#F8F9FD",
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 18,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
    letterSpacing: 1,
  },
  otpInput: {
    backgroundColor: "#F8F9FD",
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    fontSize: 28,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    letterSpacing: 10,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },
  otpActions: {
    marginTop: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  changeNumber: {
    color: "#7C3AED",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },
  resend: {
    color: "#7C3AED",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },
  secureNote: {
    marginTop: Spacing.lg,
    textAlign: "center",
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },
  demoBtn: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: "rgba(124, 58, 237, 0.35)",
    backgroundColor: "rgba(124, 58, 237, 0.06)",
  },
  demoBtnText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },
});
