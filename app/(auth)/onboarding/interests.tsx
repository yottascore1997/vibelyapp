import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useOnboarding } from "../../../context/OnboardingContext";
import { INTEREST_OPTIONS } from "../../../constants/onboarding";
import { VibeFonts } from "../../../constants/vibeTheme";

const TOTAL = 4;
const STEP = 3;
const MIN_PICKS = 3;

const HERO_IMG =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop";

export default function InterestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, update } = useOnboarding();

  const toggle = (name: string) => {
    const interests = data.interests.includes(name)
      ? data.interests.filter((i) => i !== name)
      : [...data.interests, name];
    update({ interests });
  };

  const count = data.interests.length;
  const progress = Math.min(count / MIN_PICKS, 1);
  const valid = count >= MIN_PICKS;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#070A13", "#0B1020", "#070A13"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#E3F650" />
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
                <Ionicons name="checkmark" size={12} color="#0A0F1D" />
              ) : (
                <Text style={[styles.stepNum, n === STEP && styles.stepNumActive]}>{n}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.stepChip}>
          <Ionicons name="sparkles" size={11} color="#E3F650" />
          <Text style={styles.stepChipText}>
            Step {STEP} of {TOTAL}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 + insets.bottom }}
      >
        <Animated.View entering={FadeIn.duration(400)} style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>
              Your{"\n"}
              <Text style={styles.heroTitleAccent}>Vibes</Text>
            </Text>
            <Text style={styles.heroSub}>
              Pick at least {MIN_PICKS} — we'll match you with people who{" "}
              <Text style={styles.heroSubAccent}>feel the same energy</Text> ✨
            </Text>
          </View>
          <View style={styles.heroArt}>
            <View style={styles.floatEmoji}>
              <Text style={{ fontSize: 16 }}>🎯</Text>
            </View>
            <View style={styles.floatHeart}>
              <Ionicons name="flash" size={13} color="#FFF" />
            </View>
            <LinearGradient colors={["#DDD6FE", "#F5F3FF"]} style={styles.heroAvatarRing}>
              <Image source={{ uri: HERO_IMG }} style={styles.heroAvatar} />
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(420)} style={styles.card}>
          {/* Counter */}
          <View style={styles.counterBox}>
            <LinearGradient
              colors={["#F5F3FF", "#FDF2F8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.counterGrad}
            >
              <View style={styles.counterTop}>
                <Text style={styles.counterNum}>{count}</Text>
                <View>
                  <Text style={styles.counterLabel}>selected</Text>
                  <Text style={styles.counterHint}>min {MIN_PICKS} vibes</Text>
                </View>
                {valid ? (
                  <View style={styles.readyPill}>
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                    <Text style={styles.readyText}>Ready</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.progressBg}>
                <LinearGradient
                  colors={["#FFF04B", "#94FA78", "#2EFA9E"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
              </View>
            </LinearGradient>
          </View>

          <View style={styles.fieldLabelRow}>
            <View style={styles.fieldIconBox}>
              <Ionicons name="color-palette" size={15} color="#E3F650" />
            </View>
            <Text style={styles.fieldLabel}>What are you into?</Text>
          </View>

          <View style={styles.grid}>
            {INTEREST_OPTIONS.map((item) => {
              const active = data.interests.includes(item.name);
              return (
                <Pressable
                  key={item.name}
                  onPress={() => toggle(item.name)}
                  style={styles.chipWrap}
                >
                  {active ? (
                    <LinearGradient
                      colors={["#FFF04B", "#94FA78", "#2EFA9E"]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.chipActive}
                    >
                      <View style={styles.iconWrapActive}>
                        <Ionicons
                          name={item.icon as keyof typeof Ionicons.glyphMap}
                          size={18}
                          color="#0A0F1D"
                        />
                      </View>
                      <Text style={styles.chipTextActive} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.check}>
                        <Ionicons name="checkmark" size={10} color="#0A0F1D" />
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.chip}>
                      <View
                        style={[
                          styles.iconWrap,
                          { backgroundColor: (item.color || "#7C3AED") + "18" },
                        ]}
                      >
                        <Ionicons
                          name={item.icon as keyof typeof Ionicons.glyphMap}
                          size={18}
                          color={item.color || "#7C3AED"}
                        />
                      </View>
                      <Text style={styles.chipText} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Animated.View entering={FadeInDown.delay(100).duration(360)} style={styles.safeBanner}>
            <View style={styles.safeShield}>
              <Ionicons name="sparkles" size={16} color="#0A0F1D" />
            </View>
            <Text style={styles.safeText}>
              Your vibes help us find <Text style={styles.safeAccent}>better hangout matches</Text>{" "}
              nearby
            </Text>
          </Animated.View>

          <Pressable
            onPress={() => router.push("/(auth)/onboarding/preferences")}
            disabled={!valid}
            style={[styles.ctaWrap, !valid && { opacity: 0.55 }]}
          >
            <LinearGradient
              colors={["#FFF04B", "#94FA78", "#2EFA9E"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#0A0F1D" />
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
  stepCircleActive: { backgroundColor: "#E3F650", borderColor: "#E3F650" },
  stepCircleDone: { backgroundColor: "#E3F650", borderColor: "#E3F650" },
  stepNum: { fontSize: 11, fontFamily: VibeFonts.bold, color: "#64748B" },
  stepNumActive: { color: "#0A0F1D" },
  stepChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(227,246,80,0.12)",
    borderWidth: 1,
    borderColor: "rgba(227,246,80,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  stepChipText: { fontSize: 11, fontFamily: VibeFonts.bold, color: "#E3F650" },

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
    color: "#FFFFFF",
    letterSpacing: -0.7,
  },
  heroTitleAccent: { color: "#E3F650" },
  heroSub: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.72)",
  },
  heroSubAccent: { color: "#E3F650", fontFamily: VibeFonts.bold },
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
  heroAvatar: { width: 102, height: 102, borderRadius: 51 },
  floatEmoji: {
    position: "absolute",
    top: 10,
    left: 0,
    zIndex: 2,
    backgroundColor: "#13192B",
    borderRadius: 12,
    padding: 4,
  },
  floatHeart: {
    position: "absolute",
    top: 18,
    right: 2,
    zIndex: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E3F650",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    marginTop: 6,
    backgroundColor: "#0D1222",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    minHeight: 520,
  },

  counterBox: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#13192B",
  },
  counterGrad: { padding: 14 },
  counterTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  counterNum: {
    fontSize: 32,
    fontFamily: VibeFonts.extraBold,
    color: "#E3F650",
    letterSpacing: -1,
  },
  counterLabel: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  counterHint: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.45)",
  },
  readyPill: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E3F650",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  readyText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#0A0F1D",
  },
  progressBg: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 999 },

  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  fieldIconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "rgba(227,246,80,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chipWrap: { width: "31.5%" },
  chip: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: "#13192B",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  chipActive: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  iconWrapActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(10,15,29,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  chipText: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: "#FFFFFF",
    textAlign: "center",
  },
  chipTextActive: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#0A0F1D",
    textAlign: "center",
  },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFF04B",
    alignItems: "center",
    justifyContent: "center",
  },

  safeBanner: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(227,246,80,0.08)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(227,246,80,0.2)",
  },
  safeShield: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E3F650",
    alignItems: "center",
    justifyContent: "center",
  },
  safeText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.75)",
  },
  safeAccent: { color: "#E3F650", fontFamily: VibeFonts.extraBold },

  ctaWrap: {
    marginTop: 18,
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#2EFA9E",
    shadowOpacity: 0.35,
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
  },
  ctaText: {
    color: "#0A0F1D",
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
  },
  trustRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 22,
  },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  trustEmoji: { fontSize: 12 },
  trustLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: "#94A3B8",
  },
});
