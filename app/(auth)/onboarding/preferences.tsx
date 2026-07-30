import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useAuth } from "../../../context/AuthContext";
import { GENDER_PREF_OPTIONS, LOOKING_FOR_OPTIONS } from "../../../constants/onboarding";
import { VibeFonts } from "../../../constants/vibeTheme";
import {
  getCurrentUserLocation,
  openAppLocationSettings,
} from "../../../services/location";

const TOTAL = 4;
const STEP = 4;

const HERO_IMG =
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop";

function DualRangeSliderBar({
  minVal,
  maxVal,
  minLimit = 18,
  maxLimit = 65,
  unit = "y/o",
  onChange,
}: {
  minVal: number;
  maxVal: number;
  minLimit?: number;
  maxLimit?: number;
  unit?: string;
  onChange: (min: number, max: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);

  const handleTouch = (locationX: number) => {
    if (trackWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    const rawVal = Math.round(minLimit + ratio * (maxLimit - minLimit));
    const distToMin = Math.abs(rawVal - minVal);
    const distToMax = Math.abs(rawVal - maxVal);
    if (distToMin < distToMax) {
      onChange(Math.min(rawVal, maxVal - 1), maxVal);
    } else {
      onChange(minVal, Math.max(rawVal, minVal + 1));
    }
  };

  const minPercent = Math.max(0, Math.min(100, ((minVal - minLimit) / (maxLimit - minLimit)) * 100));
  const maxPercent = Math.max(0, Math.min(100, ((maxVal - minLimit) / (maxLimit - minLimit)) * 100));
  const rangeWidth = Math.max(0, maxPercent - minPercent);

  return (
    <View style={styles.sliderBox}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderTitle}>Age range</Text>
        <View style={styles.sliderBadge}>
          <Text style={styles.sliderBadgeText}>
            {minVal} – {maxVal} {unit}
          </Text>
        </View>
      </View>
      <View
        style={styles.sliderTouch}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => handleTouch(e.nativeEvent.locationX)}
        onResponderMove={(e) => handleTouch(e.nativeEvent.locationX)}
      >
        <View style={styles.sliderTrack}>
          <LinearGradient
            colors={["#7C3AED", "#A855F7", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.sliderFillRange, { left: `${minPercent}%`, width: `${rangeWidth}%` }]}
          />
        </View>
        <View style={[styles.thumb, { left: `${minPercent}%` }]}>
          <View style={styles.thumbDot} />
        </View>
        <View style={[styles.thumb, { left: `${maxPercent}%` }]}>
          <View style={styles.thumbDot} />
        </View>
      </View>
      <View style={styles.sliderEnds}>
        <Text style={styles.sliderEndText}>
          {minLimit} {unit}
        </Text>
        <Text style={styles.sliderEndText}>
          {maxLimit} {unit}
        </Text>
      </View>
    </View>
  );
}

function InteractiveSliderBar({
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);

  const calculateValueFromX = (locationX: number) => {
    if (trackWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    const stepped = Math.round((min + ratio * (max - min)) / step) * step;
    onChange(Math.max(min, Math.min(max, stepped)));
  };

  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <View style={styles.sliderBox}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderTitle}>Distance</Text>
        <View style={styles.sliderBadge}>
          <Text style={styles.sliderBadgeText}>
            {value} {unit}
          </Text>
        </View>
      </View>
      <View
        style={styles.sliderTouch}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => calculateValueFromX(e.nativeEvent.locationX)}
        onResponderMove={(e) => calculateValueFromX(e.nativeEvent.locationX)}
      >
        <View style={styles.sliderTrack}>
          <LinearGradient
            colors={["#7C3AED", "#A855F7", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.sliderFillSingle, { width: `${percentage}%` }]}
          />
        </View>
        <View style={[styles.thumb, { left: `${percentage}%` }]}>
          <View style={styles.thumbDot} />
        </View>
      </View>
      <View style={styles.sliderEnds}>
        <Text style={styles.sliderEndText}>
          {min} {unit}
        </Text>
        <Text style={styles.sliderEndText}>
          {max} {unit}
        </Text>
      </View>
    </View>
  );
}

function FieldLabel({
  icon,
  title,
  hint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint?: string;
}) {
  return (
    <View style={styles.fieldLabelRow}>
      <View style={styles.fieldIconBox}>
        <Ionicons name={icon} size={15} color="#7C3AED" />
      </View>
      <Text style={styles.fieldLabel}>{title}</Text>
      {hint ? <Text style={styles.fieldHint}> · {hint}</Text> : null}
    </View>
  );
}

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, update, saveProfile, saving } = useOnboarding();
  const { completeOnboarding } = useAuth();
  const [minAge, setMinAge] = useState(data.minAge || 18);
  const [maxAge, setMaxAge] = useState(data.maxAge || 35);
  const [distance, setDistance] = useState(data.maxDistance || 50);
  const [locLoading, setLocLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);

  const hasGps =
    data.latitude != null &&
    data.longitude != null &&
    Number.isFinite(data.latitude) &&
    Number.isFinite(data.longitude);

  const valid = !!data.genderPreference && data.lookingFor.length > 0 && hasGps;

  const detectLocation = useCallback(async () => {
    setLocLoading(true);
    setLocError(null);
    const result = await getCurrentUserLocation({ highAccuracy: true });
    if (result.ok) {
      update({
        latitude: result.location.latitude,
        longitude: result.location.longitude,
        city: result.location.city || data.city || "",
      });
      setLocError(null);
    } else {
      setLocError(result.message);
    }
    setLocLoading(false);
  }, [data.city, update]);

  useEffect(() => {
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleLookingFor = (id: string) => {
    const list = data.lookingFor.includes(id)
      ? data.lookingFor.filter((l) => l !== id)
      : [...data.lookingFor, id];
    update({ lookingFor: list });
  };

  const handleFinish = async () => {
    if (!data.genderPreference || data.lookingFor.length === 0) {
      Alert.alert("Almost there!", "Please select gender preference and what you're looking for");
      return;
    }
    if (!hasGps) {
      Alert.alert(
        "Location required",
        "Real distance matching needs your GPS location. Please allow location access.",
        [
          { text: "Open Settings", onPress: openAppLocationSettings },
          { text: "Try again", onPress: detectLocation },
        ]
      );
      return;
    }
    try {
      await saveProfile({
        minAge,
        maxAge,
        maxDistance: distance,
        lookingFor: data.lookingFor,
        genderPreference: data.genderPreference,
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
      });
      await completeOnboarding();
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Save Failed", e instanceof Error ? e.message : "Profile save nahi hui.");
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#F3E8FF", "#FAF5FF", "#F8F9FD"]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

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
        contentContainerStyle={{ paddingBottom: 28 + insets.bottom }}
      >
        <Animated.View entering={FadeIn.duration(400)} style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>
              Match{"\n"}
              <Text style={styles.heroTitleAccent}>Preferences</Text>
            </Text>
            <Text style={styles.heroSub}>
              Set age, distance & goals so we can{" "}
              <Text style={styles.heroSubAccent}>find your people</Text> 💫
            </Text>
          </View>
          <View style={styles.heroArt}>
            <View style={styles.floatEmoji}>
              <Text style={{ fontSize: 16 }}>💘</Text>
            </View>
            <View style={styles.floatHeart}>
              <Ionicons name="heart" size={13} color="#FFF" />
            </View>
            <LinearGradient colors={["#DDD6FE", "#F5F3FF"]} style={styles.heroAvatarRing}>
              <Image source={{ uri: HERO_IMG }} style={styles.heroAvatar} />
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(420)} style={styles.card}>
          {/* GPS status */}
          <Pressable
            onPress={hasGps ? undefined : locError ? detectLocation : undefined}
            style={[
              styles.gpsBox,
              hasGps && styles.gpsBoxOk,
              !!locError && !hasGps && styles.gpsBoxErr,
            ]}
          >
            <View
              style={[
                styles.gpsIcon,
                hasGps && { backgroundColor: "#DCFCE7" },
                !!locError && !hasGps && { backgroundColor: "#FEE2E2" },
              ]}
            >
              {locLoading ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <Ionicons
                  name={hasGps ? "navigate" : locError ? "warning" : "location"}
                  size={18}
                  color={hasGps ? "#16A34A" : locError ? "#DC2626" : "#7C3AED"}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsTitle}>
                {locLoading
                  ? "Detecting your location…"
                  : hasGps
                    ? data.city
                      ? `Near ${data.city}`
                      : "Location ready"
                    : "Location needed"}
              </Text>
              <Text style={styles.gpsSub}>
                {locLoading
                  ? "GPS se real distance match hoga"
                  : hasGps
                    ? `${data.latitude!.toFixed(4)}, ${data.longitude!.toFixed(4)}`
                    : locError || "Allow location for real nearby matches"}
              </Text>
            </View>
            {!locLoading && !hasGps ? (
              <Pressable onPress={detectLocation} style={styles.gpsRetry}>
                <Text style={styles.gpsRetryText}>Retry</Text>
              </Pressable>
            ) : null}
            {!locLoading && hasGps ? (
              <Pressable onPress={detectLocation} hitSlop={8}>
                <Ionicons name="refresh" size={18} color="#7C3AED" />
              </Pressable>
            ) : null}
          </Pressable>

          {/* Live summary */}
          <LinearGradient
            colors={["#F5F3FF", "#FDF2F8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryBox}
          >
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: "#EDE9FE" }]}>
                <Ionicons name="people" size={16} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Age</Text>
                <Text style={styles.summaryVal}>
                  {minAge}–{maxAge}
                </Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: "#FCE7F3" }]}>
                <Ionicons name="navigate" size={16} color="#DB2777" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Distance</Text>
                <Text style={styles.summaryVal}>{distance} km</Text>
              </View>
            </View>
          </LinearGradient>

          <FieldLabel icon="calendar" title="Age range" />
          <DualRangeSliderBar
            minVal={minAge}
            maxVal={maxAge}
            minLimit={18}
            maxLimit={65}
            unit="y/o"
            onChange={(min, max) => {
              setMinAge(min);
              setMaxAge(max);
            }}
          />

          <FieldLabel icon="location" title="Distance radius" />
          <InteractiveSliderBar
            value={distance}
            min={1}
            max={100}
            unit="km"
            onChange={setDistance}
          />

          <FieldLabel icon="eye" title="Show me" />
          <View style={styles.genderRow}>
            {GENDER_PREF_OPTIONS.map((opt) => {
              const active = data.genderPreference === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => update({ genderPreference: opt.id })}
                  style={styles.genderWrap}
                >
                  {active ? (
                    <LinearGradient
                      colors={["#7C3AED", "#A855F7"]}
                      style={styles.genderPillActive}
                    >
                      {opt.emoji ? <Text style={styles.genderEmoji}>{opt.emoji}</Text> : null}
                      <Text style={styles.genderTextActive}>{opt.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.genderPill}>
                      {opt.emoji ? <Text style={styles.genderEmoji}>{opt.emoji}</Text> : null}
                      <Text style={styles.genderText}>{opt.label}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <FieldLabel icon="heart" title="Looking for" hint="select all that apply" />
          <View style={styles.lookingGrid}>
            {LOOKING_FOR_OPTIONS.map((opt) => {
              const active = data.lookingFor.includes(opt.id);
              return (
                <Pressable key={opt.id} onPress={() => toggleLookingFor(opt.id)}>
                  {active ? (
                    <LinearGradient
                      colors={["#7C3AED", "#A855F7"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.lookingActive}
                    >
                      <View style={styles.lookingIconActive}>
                        <Text style={styles.lookingEmoji}>{opt.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lookingLabelActive}>{opt.label}</Text>
                        <Text style={styles.lookingSubActive}>{opt.subtitle}</Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                    </LinearGradient>
                  ) : (
                    <View style={styles.lookingCard}>
                      <View
                        style={[styles.lookingIcon, { backgroundColor: (opt.color || "#7C3AED") + "18" }]}
                      >
                        <Text style={styles.lookingEmoji}>{opt.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lookingLabel}>{opt.label}</Text>
                        <Text style={styles.lookingSub}>{opt.subtitle}</Text>
                      </View>
                      <View style={styles.checkEmpty} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Animated.View entering={FadeInDown.delay(100).duration(360)} style={styles.safeBanner}>
            <View style={styles.safeShield}>
              <Ionicons name="shield-checkmark" size={16} color="#FFF" />
            </View>
            <Text style={styles.safeText}>
              You can tweak preferences anytime from{" "}
              <Text style={styles.safeAccent}>Settings</Text>
            </Text>
          </Animated.View>

          <Pressable
            onPress={handleFinish}
            disabled={!valid || saving}
            style={[styles.ctaWrap, (!valid || saving) && { opacity: 0.55 }]}
          >
            <LinearGradient
              colors={["#7C3AED", "#C026D3", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.ctaText}>
                {saving ? "Creating profile..." : "Start Matching"}
              </Text>
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
  stepCircleActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  stepCircleDone: { backgroundColor: "#A78BFA", borderColor: "#A78BFA" },
  stepNum: { fontSize: 11, fontFamily: VibeFonts.bold, color: "#64748B" },
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
  stepChipText: { fontSize: 11, fontFamily: VibeFonts.bold, color: "#7C3AED" },

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
  heroSubAccent: { color: "#7C3AED", fontFamily: VibeFonts.bold },
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
    backgroundColor: "#FFF",
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
    backgroundColor: "#EC4899",
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

  gpsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8F9FD",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  gpsBoxOk: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  gpsBoxErr: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  gpsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  gpsTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  gpsSub: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
  },
  gpsRetry: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  gpsRetryText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
  },

  summaryBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#EDE7FF",
  },
  summaryItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: "#94A3B8",
  },
  summaryVal: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#E9D5FF",
    marginHorizontal: 8,
  },

  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
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
  fieldHint: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },

  sliderBox: {
    backgroundColor: "#F8F9FD",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  sliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sliderTitle: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  sliderBadge: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.2)",
  },
  sliderBadgeText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },
  sliderTouch: {
    height: 32,
    justifyContent: "center",
    position: "relative",
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
    width: "100%",
  },
  sliderFillRange: {
    position: "absolute",
    height: 8,
    borderRadius: 4,
  },
  sliderFillSingle: { height: 8, borderRadius: 4 },
  thumb: {
    position: "absolute",
    top: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#7C3AED",
    marginLeft: -12,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7C3AED",
  },
  sliderEnds: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderEndText: {
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
    color: "#94A3B8",
  },

  genderRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  genderWrap: { flex: 1 },
  genderPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F8F9FD",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  genderPillActive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: 14,
  },
  genderEmoji: { fontSize: 14 },
  genderText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: "#18181B",
  },
  genderTextActive: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
  },

  lookingGrid: { gap: 8, marginBottom: 4 },
  lookingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F8F9FD",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  lookingActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
  },
  lookingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  lookingIconActive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  lookingEmoji: { fontSize: 22 },
  lookingLabel: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  lookingLabelActive: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
  },
  lookingSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 2,
  },
  lookingSubActive: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  checkEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },

  safeBanner: {
    marginTop: 16,
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
  safeAccent: { color: "#7C3AED", fontFamily: VibeFonts.extraBold },

  ctaWrap: {
    marginTop: 18,
    borderRadius: 999,
    overflow: "hidden",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
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
  trustItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  trustEmoji: { fontSize: 12 },
  trustLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: "#94A3B8",
  },
});
