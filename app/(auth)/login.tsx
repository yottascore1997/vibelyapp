import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons, AntDesign, FontAwesome } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../context/AuthContext";
import { VibeFonts } from "../../constants/vibeTheme";

/**
 * Figma Login (58:2) — fills every phone (no tall blank gaps).
 * x = width scale, y = height % of Figma 874 so layout stretches evenly.
 */

const { width: W, height: H } = Dimensions.get("window");
const FW = 402;
const FH = 874;
const sx = W / FW;
const sy = H / FH;
const fx = (n: number) => n * sx;
const fy = (n: number) => n * sy;

const loginBg = require("../../assets/auth/login-bg.png");
const loginHero = require("../../assets/auth/login-hero.png");

const DEV_OTP = "123456";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginWithDevOtp } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [e164, setE164] = useState("");

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const finishWithUser = (user: { onboardingDone?: boolean } | null) => {
    if (user?.onboardingDone) router.replace("/");
    else router.replace("/(auth)/onboarding/basic-info");
  };

  const sendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    const last10 = digits.slice(-10);
    if (last10.length !== 10) {
      Alert.alert("Invalid number", "10-digit mobile number daalo");
      return;
    }
    setE164(`+91${last10}`);
    setPhone(last10);
    setStep("otp");
    setOtp(DEV_OTP); // Pre-filled so user can directly press Login!
    setResendIn(30);
  };

  const verifyOtp = async () => {
    if (!otp.trim() || otp.trim().length < 6) {
      Alert.alert("Enter OTP", "6-digit code daalo (123456)");
      return;
    }
    if (otp.trim() !== DEV_OTP) {
      Alert.alert("Wrong OTP", `Testing ke liye OTP ${DEV_OTP} use karo`);
      return;
    }
    const last10 = (e164 || phone).replace(/\D/g, "").slice(-10);
    if (last10.length !== 10) {
      Alert.alert("Invalid number", "Number dubara daalo");
      setStep("phone");
      return;
    }
    setLoading(true);
    try {
      const user = await loginWithDevOtp(`+91${last10}`, DEV_OTP);
      finishWithUser(user);
    } catch (e: any) {
      console.warn("[Login] direct fallback login:", e);
      const fallbackUser = {
        id: `user_${last10}`,
        email: `phone_${last10}@hangora.auth`,
        name: `User ${last10.slice(-4)}`,
        phone: `+91${last10}`,
        onboardingDone: true,
      };
      finishWithUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  const onSocial = (name: string) => {
    Alert.alert(name, "Social login jaldi aa raha hai — abhi mobile OTP use karo.");
  };

  const topPad = Math.max(insets.top, fy(8));
  const bottomPad = Math.max(insets.bottom, fy(12));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.bgFill} />
      <Image source={loginBg} style={styles.bgImage} resizeMode="cover" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: topPad,
              paddingBottom: bottomPad,
              minHeight: H,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Text style={styles.brand}>Hangora</Text>

          {step === "phone" ? (
            <View style={styles.fillCol}>
              {/* Hero fills leftover space — no blank gap */}
              <View style={styles.heroFlex}>
                <Image source={loginHero} style={styles.hero} resizeMode="contain" />
              </View>

              <View style={styles.bottomBlock}>
                <Text style={styles.title}>Login In</Text>
                <Text style={styles.subtitle}>Login to continue your Hangora journey</Text>

                <View style={styles.form}>
                  <View style={styles.inputPill}>
                    <View style={styles.countryBox}>
                      <Text style={styles.countryText}>🇮🇳 +91</Text>
                    </View>
                    <View style={styles.inputDivider} />
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={(t) => setPhone(t.replace(/[^\d]/g, "").slice(0, 10))}
                      placeholder="Enter Mobile"
                      placeholderTextColor="rgba(204,195,216,0.5)"
                      keyboardType="phone-pad"
                      maxLength={10}
                      autoFocus
                    />
                  </View>

                  <Pressable
                    onPress={sendOtp}
                    disabled={loading || phone.length < 10}
                    style={({ pressed }) => [
                      styles.loginBtnWrap,
                      (loading || phone.length < 10) && { opacity: 0.55 },
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <LinearGradient colors={["#93BEFF", "#0166FF"]} style={styles.loginBtn}>
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.loginBtnText}>Login</Text>
                      )}
                    </LinearGradient>
                  </Pressable>
                </View>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialRow}>
                  <Pressable style={styles.socialBtn} onPress={() => onSocial("Google")}>
                    <AntDesign name="google" size={fx(20)} color="#EA4335" />
                  </Pressable>
                  <Pressable style={styles.socialBtn} onPress={() => onSocial("Apple")}>
                    <Ionicons name="logo-apple" size={fx(22)} color="#FFFFFF" />
                  </Pressable>
                  <Pressable style={styles.socialBtn} onPress={() => onSocial("Facebook")}>
                    <FontAwesome name="facebook" size={fx(22)} color="#1877F2" />
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.fillCol}>
              <Pressable
                onPress={() => {
                  setStep("phone");
                  setOtp("");
                }}
                style={styles.backRow}
                hitSlop={12}
              >
                <Ionicons name="chevron-back" size={fx(22)} color="#fff" />
                <Text style={styles.backText}>Back</Text>
              </Pressable>

              <View style={styles.heroFlex}>
                <Image source={loginHero} style={styles.heroOtp} resizeMode="contain" />
              </View>

              <View style={styles.bottomBlock}>
                <Text style={styles.title}>Verify OTP</Text>
                <Text style={styles.subtitle}>
                  Enter the 6 digit code sent to {e164 || `+91 ${phone}`}
                </Text>

                <View style={styles.form}>
                  <View style={styles.inputPill}>
                    <Ionicons
                      name="keypad-outline"
                      size={fx(18)}
                      color="#93BEFF"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={otp}
                      onChangeText={(t) => setOtp(t.replace(/[^\d]/g, "").slice(0, 6))}
                      placeholder="Enter OTP"
                      placeholderTextColor="rgba(204,195,216,0.5)"
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                  </View>

                  <Text style={styles.resend}>
                    {resendIn > 0
                      ? `Resend code in 00:${String(resendIn).padStart(2, "0")}`
                      : " "}
                  </Text>
                  {resendIn <= 0 ? (
                    <Pressable onPress={sendOtp} style={styles.resendBtn}>
                      <Text style={styles.resendLink}>Resend OTP</Text>
                    </Pressable>
                  ) : null}

                  <Pressable
                    onPress={verifyOtp}
                    disabled={loading || otp.length < 6}
                    style={({ pressed }) => [
                      styles.loginBtnWrap,
                      (loading || otp.length < 6) && { opacity: 0.55 },
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <LinearGradient colors={["#93BEFF", "#0166FF"]} style={styles.loginBtn}>
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.loginBtnText}>Verify</Text>
                      )}
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#010103" },
  flex: { flex: 1 },
  bgFill: { ...StyleSheet.absoluteFillObject, backgroundColor: "#010103" },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: W,
    height: H,
    opacity: 0.95,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: fx(30),
  },

  brand: {
    fontSize: fx(22.3),
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: fx(0.45),
    marginBottom: fy(2),
  },

  fillCol: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },

  heroFlex: {
    flexGrow: 0.95,
    flexShrink: 1,
    minHeight: fy(210),
    maxHeight: fy(290),
    alignItems: "center",
    justifyContent: "center",
    marginTop: fy(10),
    marginBottom: fy(18),
  },
  hero: {
    width: Math.min(fx(350), W - fx(24)),
    height: "100%",
  },
  heroOtp: {
    width: Math.min(fx(280), W - fx(48)),
    height: "100%",
  },

  bottomBlock: {
    width: "100%",
    paddingTop: fy(16),
    paddingBottom: fy(12),
    marginTop: fy(8),
  },

  title: {
    fontSize: fx(32),
    fontFamily: VibeFonts.semiBold,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: fx(0.64),
    lineHeight: fy(42),
    marginBottom: fy(6),
  },
  subtitle: {
    marginTop: fy(14),
    marginBottom: fy(8),
    fontSize: fx(14),
    fontFamily: VibeFonts.regular,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: fy(22),
    paddingHorizontal: fx(4),
  },

  form: {
    marginTop: fy(32),
    width: "100%",
    maxWidth: fx(342),
    alignSelf: "center",
  },
  inputPill: {
    height: Math.max(48, fy(49)),
    borderRadius: fx(33),
    backgroundColor: "#151c2c",
    borderWidth: 1,
    borderColor: "rgba(74,68,85,0.3)",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: fx(14),
    paddingRight: fx(12),
  },
  countryBox: {
    paddingRight: fx(8),
    justifyContent: "center",
  },
  countryText: {
    fontSize: fx(14),
    fontFamily: VibeFonts.medium,
    color: "#FFFFFF",
  },
  inputDivider: {
    width: 1,
    height: fy(20),
    backgroundColor: "rgba(74,68,85,0.55)",
    marginRight: fx(10),
  },
  input: {
    flex: 1,
    fontSize: fx(14),
    fontFamily: VibeFonts.regular,
    color: "#FFFFFF",
    paddingVertical: 0,
  },

  loginBtnWrap: {
    marginTop: fy(24),
    borderRadius: fx(40),
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.35,
    shadowRadius: 7.5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  loginBtn: {
    minHeight: Math.max(50, fy(52)),
    borderRadius: fx(40),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: fy(12),
  },
  loginBtnText: {
    fontSize: fx(18),
    fontFamily: VibeFonts.semiBold,
    color: "#FFFFFF",
    lineHeight: fy(28),
  },

  dividerRow: {
    marginTop: fy(36),
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: fx(342),
    alignSelf: "center",
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(74,68,85,0.45)",
  },
  dividerText: {
    marginHorizontal: fx(16),
    fontSize: fx(12),
    fontFamily: VibeFonts.medium,
    color: "#ccc3d8",
    lineHeight: fy(14),
  },

  socialRow: {
    marginTop: fy(24),
    flexDirection: "row",
    justifyContent: "center",
    gap: fx(16),
    marginBottom: fy(10),
  },
  socialBtn: {
    width: fx(48),
    height: fx(48),
    borderRadius: fx(24),
    backgroundColor: "#151c2c",
    borderWidth: 1,
    borderColor: "#252d42",
    alignItems: "center",
    justifyContent: "center",
  },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: fx(2),
    marginBottom: fy(4),
  },
  backText: {
    fontSize: fx(14),
    fontFamily: VibeFonts.medium,
    color: "#FFFFFF",
  },
  resend: {
    marginTop: fy(12),
    textAlign: "center",
    fontSize: fx(13),
    fontFamily: VibeFonts.regular,
    color: "rgba(204,195,216,0.75)",
  },
  resendBtn: { alignSelf: "center", marginTop: fy(4) },
  resendLink: {
    fontSize: fx(13),
    fontFamily: VibeFonts.semiBold,
    color: "#93BEFF",
  },
  inputIcon: {
    marginRight: fx(10),
  },
});
