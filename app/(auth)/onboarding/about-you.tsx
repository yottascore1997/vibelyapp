import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
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
import {
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
  WORKOUT_OPTIONS,
  DIET_OPTIONS,
  PETS_OPTIONS,
  ZODIAC_OPTIONS,
  LANGUAGE_OPTIONS,
} from "../../../constants/onboarding";
import { VibeFonts } from "../../../constants/vibeTheme";

const TOTAL = 4;
const STEP = 2;

const HERO_IMG =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=500&fit=crop";

function FieldLabel({
  icon,
  title,
  optional,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  optional?: boolean;
}) {
  return (
    <View style={styles.fieldLabelRow}>
      <View style={styles.fieldIconBox}>
        <Ionicons name={icon} size={15} color="#7C3AED" />
      </View>
      <Text style={styles.fieldLabel}>{title}</Text>
      {optional ? <Text style={styles.optionalTag}> · Optional</Text> : null}
    </View>
  );
}

function ChoiceGrid({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { id: string; label: string; emoji?: string }[];
  value: string;
  onChange: (id: string) => void;
  columns?: number;
}) {
  const width = columns === 3 ? "31.5%" : "48.5%";
  return (
    <View style={styles.choiceGrid}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={[styles.choicePill, { width }]}
          >
            {active ? (
              <LinearGradient
                colors={["#7C3AED", "#A855F7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.choicePillGrad}
              >
                {opt.emoji ? <Text style={styles.choiceEmoji}>{opt.emoji}</Text> : null}
                <Text style={styles.choiceTextActive} numberOfLines={1}>
                  {opt.label}
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.choicePillInner}>
                {opt.emoji ? <Text style={styles.choiceEmoji}>{opt.emoji}</Text> : null}
                <Text style={styles.choiceText} numberOfLines={1}>
                  {opt.label}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AboutYouScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, update } = useOnboarding();
  const [bioFocused, setBioFocused] = useState(false);
  const [heightFocused, setHeightFocused] = useState(false);
  const [religionFocused, setReligionFocused] = useState(false);

  const valid = data.bio.trim().length > 0;

  const toggleLanguage = (lang: string) => {
    const langs = data.languages.includes(lang)
      ? data.languages.filter((l) => l !== lang)
      : [...data.languages, lang];
    update({ languages: langs });
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
        {/* Top bar — same as Let's meet */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#7C3AED" />
          </Pressable>

          <View style={styles.stepper}>
            <View style={styles.stepLine} />
            {[1, 2, 3, 4].map((n) => (
              <View
                key={n}
                style={[
                  styles.stepCircle,
                  n < STEP && styles.stepCircleDone,
                  n === STEP && styles.stepCircleActive,
                ]}
              >
                {n < STEP ? (
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                ) : (
                  <Text style={[styles.stepNum, n === STEP && styles.stepNumActive]}>{n}</Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.stepChip}>
            <Ionicons name="sparkles" size={11} color="#7C3AED" />
            <Text style={styles.stepChipText}>
              Step {STEP} of {TOTAL}
            </Text>
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
                About &{"\n"}
                <Text style={styles.heroTitleAccent}>Lifestyle</Text>
              </Text>
              <Text style={styles.heroSub}>
                Share your vibe so we can match you with the{" "}
                <Text style={styles.heroSubAccent}>right hangout crew</Text> ✨
              </Text>
            </View>

            <View style={styles.heroArt}>
              <View style={styles.floatEmoji}>
                <Text style={{ fontSize: 16 }}>✨</Text>
              </View>
              <View style={styles.floatHeart}>
                <Ionicons name="cafe" size={13} color="#FFF" />
              </View>
              <LinearGradient colors={["#DDD6FE", "#F5F3FF"]} style={styles.heroAvatarRing}>
                <Image source={{ uri: HERO_IMG }} style={styles.heroAvatar} />
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Form card */}
          <Animated.View entering={FadeInUp.delay(80).duration(420)} style={styles.card}>
            {/* Bio */}
            <View style={styles.fieldBlock}>
              <FieldLabel icon="chatbubble-ellipses" title="Bio" />
              <View style={[styles.inputRow, styles.inputMulti, bioFocused && styles.inputRowFocus]}>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={data.bio}
                  onChangeText={(v) => update({ bio: v })}
                  placeholder="What makes you, you? Coffee lover, weekend explorer..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  maxLength={500}
                  onFocus={() => setBioFocused(true)}
                  onBlur={() => setBioFocused(false)}
                />
              </View>
              <Text style={styles.hint}>
                {data.bio.length}/500 · Tell people your hangout vibe
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Height */}
            <View style={styles.fieldBlock}>
              <FieldLabel icon="resize" title="Height" optional />
              <View style={[styles.inputRow, heightFocused && styles.inputRowFocus]}>
                <TextInput
                  style={styles.input}
                  value={data.height}
                  onChangeText={(v) => update({ height: v })}
                  placeholder="5'10 or 178 cm"
                  placeholderTextColor="#94A3B8"
                  onFocus={() => setHeightFocused(true)}
                  onBlur={() => setHeightFocused(false)}
                />
                <Ionicons name="sparkles" size={16} color="#A855F7" />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Languages */}
            <View style={styles.fieldBlock}>
              <FieldLabel icon="globe" title="Languages you speak" />
              <View style={styles.langGrid}>
                {LANGUAGE_OPTIONS.map((lang) => {
                  const active = data.languages.includes(lang);
                  return (
                    <Pressable key={lang} onPress={() => toggleLanguage(lang)}>
                      {active ? (
                        <LinearGradient
                          colors={["#7C3AED", "#A855F7"]}
                          style={styles.langChipActive}
                        >
                          <Text style={styles.langTextActive}>{lang}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.langChip}>
                          <Text style={styles.langText}>{lang}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Religion */}
            <View style={styles.fieldBlock}>
              <FieldLabel icon="heart" title="Religion" optional />
              <View style={[styles.inputRow, religionFocused && styles.inputRowFocus]}>
                <TextInput
                  style={styles.input}
                  value={data.religion}
                  onChangeText={(v) => update({ religion: v })}
                  placeholder="Optional"
                  placeholderTextColor="#94A3B8"
                  onFocus={() => setReligionFocused(true)}
                  onBlur={() => setReligionFocused(false)}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldBlock}>
              <FieldLabel icon="flame" title="Smoking Habits" />
              <ChoiceGrid
                options={SMOKING_OPTIONS}
                value={data.smoking}
                onChange={(v) => update({ smoking: v })}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldBlock}>
              <FieldLabel icon="wine" title="Drinking Habits" />
              <ChoiceGrid
                options={DRINKING_OPTIONS}
                value={data.drinking}
                onChange={(v) => update({ drinking: v })}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldBlock}>
              <FieldLabel icon="barbell" title="Workout Routine" />
              <ChoiceGrid
                options={WORKOUT_OPTIONS}
                value={data.workout}
                onChange={(v) => update({ workout: v })}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldBlock}>
              <FieldLabel icon="nutrition" title="Diet Preferences" />
              <ChoiceGrid
                options={DIET_OPTIONS}
                value={data.diet}
                onChange={(v) => update({ diet: v })}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldBlock}>
              <FieldLabel icon="paw" title="Pets" />
              <ChoiceGrid
                options={PETS_OPTIONS}
                value={data.pets}
                onChange={(v) => update({ pets: v })}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldBlock}>
              <FieldLabel icon="sparkles" title="Zodiac Sign" optional />
              <ChoiceGrid
                options={ZODIAC_OPTIONS}
                value={data.zodiac}
                onChange={(v) => update({ zodiac: v })}
                columns={3}
              />
            </View>

            {/* Safety banner */}
            <Animated.View entering={FadeInDown.delay(100).duration(360)} style={styles.safeBanner}>
              <View style={styles.safeShield}>
                <Ionicons name="shield-checkmark" size={18} color="#FFF" />
              </View>
              <Text style={styles.safeText}>
                Your lifestyle details stay <Text style={styles.safeAccent}>private</Text> — only
                shown on your profile
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
              onPress={() => router.push("/(auth)/onboarding/interests")}
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
  stepCircleDone: {
    backgroundColor: "#A78BFA",
    borderColor: "#A78BFA",
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
  floatEmoji: {
    position: "absolute",
    top: 10,
    left: 0,
    zIndex: 2,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 4,
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

  card: {
    marginTop: 6,
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
  optionalTag: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
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
  inputMulti: { alignItems: "flex-start", paddingVertical: 8 },
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
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
    paddingTop: 6,
  },
  hint: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },

  langGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  langChipActive: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  langText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },
  langTextActive: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
  },

  choiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  choicePill: {
    marginBottom: 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  choicePillGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: 14,
  },
  choicePillInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  choiceEmoji: { fontSize: 13 },
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
