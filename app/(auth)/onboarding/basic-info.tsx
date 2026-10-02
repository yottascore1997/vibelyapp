import { useMemo, useState } from "react";
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
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useOnboarding } from "../../../context/OnboardingContext";
import { VibeFonts } from "../../../constants/vibeTheme";

/**
 * Figma Register / Create Account (59:586) — step 1 of 4.
 * x = width scale, y = height % of Figma 874 so layout fills phones.
 */

const { width: W, height: H } = Dimensions.get("window");
const FW = 402;
const FH = 874;
const sx = W / FW;
const sy = H / FH;
const fx = (n: number) => n * sx;
const fy = (n: number) => n * sy;

const registerBg = require("../../../assets/auth/register-bg.png");
const registerHero = require("../../../assets/auth/register-hero.png");

const GENDER = [
  {
    id: "MALE",
    label: "Men",
    icon: "gender-male" as const,
    color: "#3B82F6",
  },
  {
    id: "FEMALE",
    label: "Women",
    icon: "gender-female" as const,
    color: "#EC4899",
  },
  {
    id: "OTHER",
    label: "Non-binary",
    icon: "gender-male-female" as const,
    color: "#A78BFA",
  },
  {
    id: "PREFER_NOT",
    label: "Prefer not to say",
    icon: "fingerprint" as const,
    color: "#FBBF24",
  },
];

function calcAge(dob: string) {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDob(iso: string) {
  if (!iso.match(/^\d{4}-\d{2}-\d{2}$/)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function parseIsoDate(iso: string): Date {
  if (iso.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date();
  d.setFullYear(d.getFullYear() - 20);
  return d;
}

export default function BasicInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, update } = useOnboarding();
  const [dob, setDob] = useState(data.dateOfBirth);
  const [showPicker, setShowPicker] = useState(false);

  const pickerDate = useMemo(() => parseIsoDate(dob), [dob]);

  const valid = Boolean(data.firstName.trim() && dob && data.gender);

  const onDobChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (!selected) return;
    setDob(toIsoDate(selected));
  };

  const handleNext = () => {
    if (!dob.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Invalid Date", "Date of Birth select karo");
      return;
    }
    if (calcAge(dob) < 18) {
      Alert.alert("Age Restriction", "You must be 18 or older to use Hangora");
      return;
    }
    update({
      dateOfBirth: dob,
      interestedIn: data.interestedIn || "EVERYONE",
    });
    router.push("/(auth)/onboarding/about-you");
  };

  const topPad = Math.max(insets.top, fy(8));
  const bottomPad = Math.max(insets.bottom, fy(16));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.bgFill} />
      <Image source={registerBg} style={styles.bgImage} resizeMode="cover" />

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
          <View style={styles.headerRow}>
            <Text style={styles.brand}>Hangora</Text>
            <View style={styles.progress}>
              <View style={styles.progressLineTrack} />
              <View style={[styles.progressLineActive, { width: fx(57) }]} />
              {[1, 2, 3, 4].map((n) => {
                const active = n === 1;
                return (
                  <View
                    key={n}
                    style={[styles.stepDot, active && styles.stepDotActive]}
                  >
                    <Text style={[styles.stepNum, active && styles.stepNumActive]}>
                      {n}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.heroFlex}>
            <Image source={registerHero} style={styles.hero} resizeMode="contain" />
          </View>

          <Text style={styles.title}>Create your Account</Text>

          <View style={styles.form}>
            <View style={styles.inputPill}>
              <Ionicons
                name="person-outline"
                size={fx(18)}
                color="#E3F650"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={data.firstName}
                onChangeText={(v) => update({ firstName: v })}
                placeholder="Full Name"
                placeholderTextColor="rgba(204,195,216,0.5)"
                autoCapitalize="words"
              />
            </View>

            <Pressable
              style={styles.inputPill}
              onPress={() => setShowPicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={fx(17)}
                color="#E3F650"
                style={styles.inputIcon}
              />
              <Text
                style={[
                  styles.input,
                  !dob && styles.placeholder,
                  { paddingVertical: fy(12) },
                ]}
              >
                {dob ? formatDisplayDob(dob) : "Date of Birth"}
              </Text>
              <Ionicons name="calendar" size={fx(20)} color="#64748B" />
            </Pressable>

            {showPicker ? (
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                minimumDate={new Date(1920, 0, 1)}
                onChange={onDobChange}
                themeVariant="dark"
              />
            ) : null}
            {showPicker && Platform.OS === "ios" ? (
              <Pressable
                onPress={() => setShowPicker(false)}
                style={styles.pickerDone}
              >
                <Text style={styles.pickerDoneText}>Done</Text>
              </Pressable>
            ) : null}

            <View style={styles.genderGrid}>
              {GENDER.map((opt) => {
                const active = data.gender === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => update({ gender: opt.id })}
                    style={[styles.genderCard, active && styles.genderCardActive]}
                  >
                    <View style={styles.genderLeft}>
                      <MaterialCommunityIcons
                        name={opt.icon}
                        size={fx(20)}
                        color={opt.color}
                      />
                      <Text
                        style={styles.genderLabel}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {opt.label}
                      </Text>
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={handleNext}
            disabled={!valid}
            style={({ pressed }) => [
              styles.ctaWrap,
              !valid && { opacity: 0.55 },
              pressed && valid && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <LinearGradient
              colors={["#FFF04B", "#94FA78", "#2EFA9E"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Continue</Text>
              <Ionicons name="arrow-forward" size={fx(18)} color="#0A0F1D" style={{ marginLeft: 6 }} />
            </LinearGradient>
          </Pressable>
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

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: fy(4),
    minHeight: fy(28),
  },
  brand: {
    fontSize: fx(17.7),
    fontFamily: VibeFonts.semiBold,
    color: "#FFFFFF",
    letterSpacing: fx(0.35),
    width: fx(78),
  },
  progress: {
    flex: 1,
    maxWidth: fx(238),
    height: fy(22),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    marginLeft: fx(8),
  },
  progressLineTrack: {
    position: "absolute",
    left: fx(11),
    right: fx(11),
    height: fy(1.4),
    backgroundColor: "#202A44",
    top: "50%",
    marginTop: -fy(0.7),
  },
  progressLineActive: {
    position: "absolute",
    left: fx(11),
    height: fy(1.4),
    backgroundColor: "#E3F650",
    top: "50%",
    marginTop: -fy(0.7),
    zIndex: 1,
  },
  stepDot: {
    width: fx(22.3),
    height: fx(22.3),
    borderRadius: fx(12),
    backgroundColor: "#131A2D",
    borderWidth: 1,
    borderColor: "#202A44",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  stepDotActive: {
    backgroundColor: "#E3F650",
    borderColor: "#E3F650",
  },
  stepNum: {
    fontSize: fx(9.7),
    fontFamily: VibeFonts.medium,
    color: "#64748B",
  },
  stepNumActive: { color: "#0A0F1D" },

  heroFlex: {
    flexGrow: 0.7,
    flexShrink: 1,
    minHeight: fy(180),
    maxHeight: fy(260),
    alignItems: "center",
    justifyContent: "center",
    marginTop: fy(6),
    marginBottom: fy(4),
  },
  hero: {
    width: Math.min(fx(360), W - fx(24)),
    height: "100%",
  },

  title: {
    fontSize: fx(32),
    fontFamily: VibeFonts.semiBold,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: fx(0.64),
    lineHeight: fy(42),
    marginTop: fy(4),
    marginBottom: fy(8),
  },

  form: {
    marginTop: fy(12),
    width: "100%",
    maxWidth: fx(342),
    alignSelf: "center",
    gap: fy(14),
  },
  inputPill: {
    height: Math.max(46, fy(46)),
    borderRadius: fx(36),
    backgroundColor: "#151c2c",
    borderWidth: 1,
    borderColor: "#252d42",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: fx(16),
    paddingRight: fx(14),
  },
  inputIcon: { marginRight: fx(10) },
  input: {
    flex: 1,
    fontSize: fx(14),
    fontFamily: VibeFonts.regular,
    color: "#FFFFFF",
    paddingVertical: 0,
  },
  placeholder: {
    color: "rgba(204,195,216,0.5)",
  },
  pickerDone: {
    alignSelf: "flex-end",
    paddingVertical: fy(6),
    paddingHorizontal: fx(8),
  },
  pickerDoneText: {
    color: "#93BEFF",
    fontFamily: VibeFonts.semiBold,
    fontSize: fx(14),
  },

  genderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: fx(12),
    marginTop: fy(2),
  },
  genderCard: {
    width: (Math.min(fx(342), W - fx(60)) - fx(12)) / 2,
    height: Math.max(47, fy(47)),
    borderRadius: fx(12),
    backgroundColor: "#151c2c",
    borderWidth: 1,
    borderColor: "#202a44",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: fx(12),
  },
  genderCardActive: {
    borderColor: "#E3F650",
    backgroundColor: "rgba(227, 246, 80, 0.08)",
  },
  genderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: fx(6),
    flex: 1,
    paddingRight: fx(4),
  },
  genderLabel: {
    flexShrink: 1,
    fontSize: fx(12),
    fontFamily: VibeFonts.regular,
    color: "#FFFFFF",
    lineHeight: fy(18),
  },
  radio: {
    width: fx(16),
    height: fx(16),
    borderRadius: fx(8),
    borderWidth: 1,
    borderColor: "#6B7280",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: "#E3F650",
  },
  radioDot: {
    width: fx(8),
    height: fx(8),
    borderRadius: fx(4),
    backgroundColor: "#E3F650",
  },

  ctaWrap: {
    marginTop: fy(28),
    marginBottom: fy(8),
    width: "100%",
    maxWidth: fx(342),
    alignSelf: "center",
    borderRadius: fx(33),
    overflow: "hidden",
    shadowColor: "#2EFA9E",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cta: {
    minHeight: Math.max(50, fy(52)),
    borderRadius: fx(33),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: fy(14),
  },
  ctaText: {
    fontSize: fx(17),
    fontFamily: VibeFonts.bold,
    color: "#0A0F1D",
    letterSpacing: fx(0.2),
  },
});
