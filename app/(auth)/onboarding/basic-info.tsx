import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useOnboarding } from "../../../context/OnboardingContext";
import { VibeFonts } from "../../../constants/vibeTheme";

const TOTAL = 4;

const GENDER = [
  { id: "MALE", label: "Man", emoji: "👦" },
  { id: "FEMALE", label: "Woman", emoji: "👧" },
  { id: "OTHER", label: "Other", emoji: "✨" },
];

const INTERESTED = [
  { id: "MEN", label: "Men", emoji: "👦" },
  { id: "WOMEN", label: "Women", emoji: "👧" },
  { id: "EVERYONE", label: "Everyone", emoji: "🌈" },
];

const HERO_IMG =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop";

function calcAge(dob: string) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function FieldLabel({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.fieldLabelRow}>
      <View style={styles.fieldIconBox}>
        <Ionicons name={icon} size={15} color="#7C3AED" />
      </View>
      <Text style={styles.fieldLabel}>{title}</Text>
    </View>
  );
}

function ChoiceRow({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string; emoji: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={styles.choiceRow}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={[styles.choicePill, active && styles.choicePillActive]}
          >
            {active ? (
              <LinearGradient
                colors={["#7C3AED", "#A855F7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.choicePillGrad}
              >
                <Text style={styles.choiceEmoji}>{opt.emoji}</Text>
                <Text style={styles.choiceTextActive}>{opt.label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.choicePillInner}>
                <Text style={styles.choiceEmoji}>{opt.emoji}</Text>
                <Text style={styles.choiceText}>{opt.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function BasicInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, update } = useOnboarding();
  const [dob, setDob] = useState(data.dateOfBirth);
  const [nameFocused, setNameFocused] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);

  const valid = data.firstName.trim() && dob && data.gender && data.interestedIn;

  const handleNext = () => {
    if (!dob.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Invalid Date", "Use format YYYY-MM-DD (e.g. 2000-05-15)");
      return;
    }
    if (calcAge(dob) < 18) {
      Alert.alert("Age Restriction", "You must be 18 or older to use Hangora");
      return;
    }
    update({ dateOfBirth: dob });
    router.push("/(auth)/onboarding/about-you");
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#F3E8FF", "#FAF5FF", "#F8F9FD"]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#7C3AED" />
          </Pressable>

          <View style={styles.stepper}>
            <View style={styles.stepLine} />
            {[1, 2, 3, 4].map((n) => (
              <View
                key={n}
                style={[styles.stepCircle, n === 1 && styles.stepCircleActive]}
              >
                <Text style={[styles.stepNum, n === 1 && styles.stepNumActive]}>{n}</Text>
              </View>
            ))}
          </View>

          <View style={styles.stepChip}>
            <Ionicons name="sparkles" size={11} color="#7C3AED" />
            <Text style={styles.stepChipText}>Step 1 of {TOTAL}</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 28 + insets.bottom }}
        >
          {/* Hero */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>
                Let's get{"\n"}
                <Text style={styles.heroTitleAccent}>to know you</Text>
              </Text>
              <Text style={styles.heroSub}>
                Just a few details to help us find your{" "}
                <Text style={styles.heroSubAccent}>perfect hangout partner</Text> ✨
              </Text>
            </View>

            <View style={styles.heroArt}>
              <View style={styles.floatWave}>
                <Text style={{ fontSize: 18 }}>👋</Text>
              </View>
              <View style={styles.floatHeart}>
                <Ionicons name="heart" size={14} color="#FFF" />
              </View>
              <View style={styles.floatStar}>
                <Ionicons name="star" size={10} color="#F9A8D4" />
              </View>
              <LinearGradient colors={["#DDD6FE", "#F5F3FF"]} style={styles.heroAvatarRing}>
                <Image source={{ uri: HERO_IMG }} style={styles.heroAvatar} />
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Form card */}
          <Animated.View entering={FadeInUp.delay(80).duration(420)} style={styles.card}>
            {/* First name */}
            <View style={styles.fieldBlock}>
              <FieldLabel icon="person" title="First Name" />
              <View style={[styles.inputRow, nameFocused && styles.inputRowFocus]}>
                <TextInput
                  style={styles.input}
                  value={data.firstName}
                  onChangeText={(v) => update({ firstName: v })}
                  placeholder="e.g. Ananya"
                  placeholderTextColor="#94A3B8"
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                />
                <Ionicons name="sparkles" size={16} color="#A855F7" />
              </View>
            </View>

            <View style={styles.divider} />

            {/* DOB */}
            <View style={styles.fieldBlock}>
              <FieldLabel icon="calendar" title="Date of Birth" />
              <View style={[styles.inputRow, dobFocused && styles.inputRowFocus]}>
                <TextInput
                  style={styles.input}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numbers-and-punctuation"
                  onFocus={() => setDobFocused(true)}
                  onBlur={() => setDobFocused(false)}
                />
                <Ionicons name="chevron-down" size={16} color="#7C3AED" />
              </View>
              <Text style={styles.hint}>
                Must be <Text style={styles.hintAccent}>18+</Text> · Format: YYYY-MM-DD
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Gender */}
            <View style={styles.fieldBlock}>
              <FieldLabel icon="person" title="I am a..." />
              <ChoiceRow
                options={GENDER}
                value={data.gender}
                onChange={(id) => update({ gender: id })}
              />
            </View>

            <View style={styles.divider} />

            {/* Interested */}
            <View style={styles.fieldBlock}>
              <FieldLabel icon="heart" title="Interested in" />
              <ChoiceRow
                options={INTERESTED}
                value={data.interestedIn}
                onChange={(id) => update({ interestedIn: id })}
              />
            </View>

            {/* Safety banner */}
            <Animated.View entering={FadeInDown.delay(120).duration(360)} style={styles.safeBanner}>
              <View style={styles.safeShield}>
                <Ionicons name="shield-checkmark" size={18} color="#FFF" />
              </View>
              <Text style={styles.safeText}>
                Your info is <Text style={styles.safeAccent}>safe with us</Text> and never shared
                without permission
              </Text>
              <View style={styles.lockWrap}>
                <LinearGradient colors={["#7C3AED", "#A855F7"]} style={styles.lockBubble}>
                  <Ionicons name="lock-closed" size={16} color="#FFF" />
                </LinearGradient>
                <View style={styles.lockHeart}>
                  <Ionicons name="heart" size={8} color="#FFF" />
                </View>
              </View>
            </Animated.View>

            {/* Continue */}
            <Pressable
              onPress={handleNext}
              disabled={!valid}
              style={[styles.ctaWrap, !valid && { opacity: 0.55 }]}
            >
              <LinearGradient
                colors={["#7C3AED", "#C026D3", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.ctaText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
                <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.85)" />
              </LinearGradient>
            </Pressable>

            {/* Trust row */}
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <Text style={styles.trustEmoji}>🔒</Text>
                <Text style={styles.trustLabel}>Secure</Text>
              </View>
              <View style={styles.trustItem}>
                <Text style={styles.trustEmoji}>🛡️</Text>
                <Text style={styles.trustLabel}>Private</Text>
              </View>
              <View style={styles.trustItem}>
                <Text style={styles.trustEmoji}>👥</Text>
                <Text style={styles.trustLabel}>Trusted</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FD" },

  topBar: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.12)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    position: "relative",
  },
  stepLine: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: "#E9D5FF",
    top: "50%",
    marginTop: -1,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  stepCircleActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  stepNum: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },
  stepNumActive: { color: "#FFF" },
  stepChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  stepChipText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },

  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  heroCopy: { flex: 1, paddingRight: 8 },
  heroTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    letterSpacing: -0.7,
  },
  heroTitleAccent: { color: "#7C3AED" },
  heroSub: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
  },
  heroSubAccent: {
    color: "#7C3AED",
    fontFamily: VibeFonts.bold,
  },
  heroArt: {
    width: 120,
    height: 130,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  heroAvatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatar: {
    width: 102,
    height: 102,
    borderRadius: 51,
  },
  floatWave: {
    position: "absolute",
    top: 8,
    left: 0,
    zIndex: 2,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  floatHeart: {
    position: "absolute",
    top: 18,
    right: 2,
    zIndex: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  floatStar: {
    position: "absolute",
    bottom: 18,
    left: 2,
    zIndex: 2,
  },

  card: {
    marginTop: 6,
    marginHorizontal: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.1)",
    minHeight: 520,
  },

  fieldBlock: { marginBottom: 4 },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  fieldIconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  inputRowFocus: {
    borderColor: "#7C3AED",
    backgroundColor: "#F5F3FF",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: VibeFonts.medium,
    color: "#18181B",
  },
  hint: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },
  hintAccent: {
    color: "#7C3AED",
    fontFamily: VibeFonts.bold,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },

  choiceRow: {
    flexDirection: "row",
    gap: 8,
  },
  choicePill: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  choicePillActive: {},
  choicePillGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 14,
  },
  choicePillInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  choiceEmoji: { fontSize: 14 },
  choiceText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#475569",
  },
  choiceTextActive: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
  },

  safeBanner: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F3E8FF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  safeShield: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  safeText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: VibeFonts.medium,
    color: "#475569",
  },
  safeAccent: {
    color: "#7C3AED",
    fontFamily: VibeFonts.extraBold,
  },
  lockWrap: { position: "relative" },
  lockBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  lockHeart: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EC4899",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },

  ctaWrap: {
    marginTop: 18,
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 999,
  },
  ctaText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
  },

  trustRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 22,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trustEmoji: { fontSize: 12 },
  trustLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: "#94A3B8",
  },
});
