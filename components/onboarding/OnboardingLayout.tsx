import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import AuthBackground from "./AuthBackground";
import PremiumButton from "./PremiumButton";
import { VibeFonts } from "../../constants/vibeTheme";

const STEP_LABELS = ["Meet", "About", "Vibes", "Match"];

interface Props {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  emoji?: string;
  children: React.ReactNode;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}

export default function OnboardingLayout({
  step,
  total,
  title,
  subtitle,
  emoji,
  children,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  showBack = true,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const progress = Math.min(1, step / total);

  return (
    <AuthBackground>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Top chrome */}
        <View style={styles.topBar}>
          {showBack ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
              <Ionicons name="chevron-back" size={20} color="#18181B" />
            </TouchableOpacity>
          ) : (
            <View style={styles.brandMark}>
              <LinearGradient colors={["#7C3AED", "#8B5CF6"]} style={styles.brandMarkGrad}>
                <Text style={styles.brandMarkText}>H</Text>
              </LinearGradient>
            </View>
          )}

          <View style={styles.brandCenter}>
            <Text style={styles.brandName}>
              Hang<Text style={styles.brandAccent}>ora</Text>
            </Text>
            <Text style={styles.brandTag}>Set up your vibe</Text>
          </View>

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              {step}/{total}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={["#7C3AED", "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <View style={styles.stepLabels}>
            {STEP_LABELS.slice(0, total).map((l, i) => (
              <Text
                key={l}
                style={[styles.stepLabel, i + 1 === step && styles.stepLabelActive, i + 1 < step && styles.stepLabelDone]}
              >
                {l}
              </Text>
            ))}
          </View>
        </View>

        {/* Hero title */}
        <Animated.View entering={FadeInDown.duration(380)} style={styles.headerText}>
          {emoji ? (
            <View style={styles.emojiWrap}>
              <Text style={styles.emoji}>{emoji}</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Animated.View entering={FadeInUp.delay(80).duration(400)} style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <PremiumButton
            label={nextLabel}
            onPress={onNext}
            disabled={nextDisabled}
            icon="arrow-forward"
          />
        </View>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  safe: { paddingHorizontal: 18 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  brandMark: { width: 40, height: 40 },
  brandMarkGrad: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
  },
  brandCenter: { alignItems: "center", flex: 1 },
  brandName: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    letterSpacing: -0.3,
  },
  brandAccent: { color: "#7C3AED" },
  brandTag: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 1,
  },
  stepBadge: {
    minWidth: 40,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  stepBadgeText: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
  },

  progressWrap: { marginTop: 14, marginBottom: 4 },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#EDE9FE",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  stepLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 2,
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
    color: "#94A3B8",
    letterSpacing: 0.3,
  },
  stepLabelActive: {
    color: "#7C3AED",
    fontFamily: VibeFonts.extraBold,
  },
  stepLabelDone: {
    color: "#A78BFA",
  },

  headerText: { paddingTop: 14, paddingBottom: 10 },
  emojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE7FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emoji: { fontSize: 24 },
  title: {
    fontSize: 28,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 6,
    lineHeight: 20,
  },

  flex: { flex: 1 },
  sheet: {
    flex: 1,
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "#EDE7FF",
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 120,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: "rgba(248,249,253,0.96)",
    borderTopWidth: 1,
    borderTopColor: "#EDE7FF",
  },
});
