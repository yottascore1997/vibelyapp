import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import PillSelect from "../../../components/onboarding/PillSelect";
import SectionLabel from "../../../components/onboarding/SectionLabel";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useAuth } from "../../../context/AuthContext";
import { GENDER_PREF_OPTIONS, LOOKING_FOR_OPTIONS } from "../../../constants/onboarding";
import { Radius, Spacing } from "../../../constants/theme";

// Unified Dual Range Slider Bar Component (Min & Max on single bar)
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
      const newMin = Math.min(rawVal, maxVal - 1);
      onChange(newMin, maxVal);
    } else {
      const newMax = Math.max(rawVal, minVal + 1);
      onChange(minVal, newMax);
    }
  };

  const minPercent = Math.max(0, Math.min(100, ((minVal - minLimit) / (maxLimit - minLimit)) * 100));
  const maxPercent = Math.max(0, Math.min(100, ((maxVal - minLimit) / (maxLimit - minLimit)) * 100));
  const rangeWidth = Math.max(0, maxPercent - minPercent);

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeaderRow}>
        <Text style={styles.sliderHeaderTitle}>Target Age</Text>
        <View style={styles.sliderValueBadge}>
          <Text style={styles.sliderValueBadgeText}>
            {minVal} – {maxVal} {unit}
          </Text>
        </View>
      </View>

      <View
        style={styles.sliderTouchArea}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => handleTouch(e.nativeEvent.locationX)}
        onResponderMove={(e) => handleTouch(e.nativeEvent.locationX)}
      >
        <View style={styles.sliderTrackBg}>
          <LinearGradient
            colors={["#7C3AED", "#8B5CF6", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.sliderTrackFill,
              { left: `${minPercent}%`, width: `${rangeWidth}%` },
            ]}
          />
        </View>

        {/* Min Thumb Knob */}
        <View style={[styles.sliderThumb, { left: `${minPercent}%` }]}>
          <View style={styles.sliderThumbInner} />
        </View>

        {/* Max Thumb Knob */}
        <View style={[styles.sliderThumb, { left: `${maxPercent}%` }]}>
          <View style={styles.sliderThumbInner} />
        </View>
      </View>

      <View style={styles.sliderMinMaxRow}>
        <Text style={styles.sliderMinMaxText}>{minLimit} {unit}</Text>
        <Text style={styles.sliderMinMaxText}>{maxLimit} {unit}</Text>
      </View>
    </View>
  );
}

// Single Slider Bar Component (for Distance)
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
    const rawVal = min + ratio * (max - min);
    const steppedVal = Math.round(rawVal / step) * step;
    const clampedVal = Math.max(min, Math.min(max, steppedVal));
    onChange(clampedVal);
  };

  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeaderRow}>
        <Text style={styles.sliderHeaderTitle}>Distance Limit</Text>
        <View style={styles.sliderValueBadge}>
          <Text style={styles.sliderValueBadgeText}>
            {value} {unit}
          </Text>
        </View>
      </View>

      <View
        style={styles.sliderTouchArea}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => calculateValueFromX(e.nativeEvent.locationX)}
        onResponderMove={(e) => calculateValueFromX(e.nativeEvent.locationX)}
      >
        <View style={styles.sliderTrackBg}>
          <LinearGradient
            colors={["#7C3AED", "#8B5CF6", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.sliderTrackFillSingle, { width: `${percentage}%` }]}
          />
        </View>
        <View style={[styles.sliderThumb, { left: `${percentage}%` }]}>
          <View style={styles.sliderThumbInner} />
        </View>
      </View>

      <View style={styles.sliderMinMaxRow}>
        <Text style={styles.sliderMinMaxText}>{min} {unit}</Text>
        <Text style={styles.sliderMinMaxText}>{max} {unit}</Text>
      </View>
    </View>
  );
}

export default function PreferencesScreen() {
  const router = useRouter();
  const { data, update, saveProfile, saving } = useOnboarding();
  const { completeOnboarding } = useAuth();
  const [minAge, setMinAge] = useState(data.minAge || 18);
  const [maxAge, setMaxAge] = useState(data.maxAge || 35);
  const [distance, setDistance] = useState(data.maxDistance || 50);

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
    try {
      await saveProfile({
        minAge,
        maxAge,
        maxDistance: distance,
        lookingFor: data.lookingFor,
        genderPreference: data.genderPreference,
      });
      await completeOnboarding();
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Save Failed", e instanceof Error ? e.message : "Profile save nahi hui.");
    }
  };

  return (
    <OnboardingLayout
      step={4}
      total={4}
      emoji="💫"
      title="Match Preferences"
      subtitle="Slide to customize your age range & distance radius"
      onNext={handleFinish}
      nextLabel={saving ? "Creating profile..." : "Start Matching 🎉"}
      nextDisabled={!data.genderPreference || data.lookingFor.length === 0 || saving}
    >
      {/* Real-time Stat Hero Banner */}
      <LinearGradient colors={["#1E1B4B", "#2E1065", "#0F172A"]} style={styles.heroCard}>
        <View style={styles.heroCardGlow} />
        <View style={styles.heroRow}>
          <View style={styles.heroStatItem}>
            <View style={styles.heroStatIcon}>
              <Ionicons name="people" size={18} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.heroStatLabel}>IN-BETWEEN AGE</Text>
              <Text style={styles.heroStatVal}>{minAge} – {maxAge} yrs</Text>
            </View>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <View style={styles.heroStatIcon}>
              <Ionicons name="navigate" size={18} color="#10B981" />
            </View>
            <View>
              <Text style={styles.heroStatLabel}>MAX DISTANCE</Text>
              <Text style={styles.heroStatVal}>{distance} km</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Single Unified In-Between Dual Age Range Slider */}
      <SectionLabel title="Age Range (In-Between)" emoji="🎂" />
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

      {/* Distance Radius Interactive Slider */}
      <SectionLabel title="Distance Radius" emoji="📍" />
      <InteractiveSliderBar
        value={distance}
        min={1}
        max={100}
        unit="km"
        onChange={(val) => setDistance(val)}
      />

      {/* Show me */}
      <SectionLabel title="Show me" emoji="👁️" />
      <PillSelect
        options={GENDER_PREF_OPTIONS}
        value={data.genderPreference}
        onChange={(v) => update({ genderPreference: v })}
        columns={3}
      />

      {/* Looking for */}
      <SectionLabel title="Looking for" emoji="💘" subtitle="Select all relationship goals that apply" />
      <View style={styles.lookingGrid}>
        {LOOKING_FOR_OPTIONS.map((opt) => {
          const active = data.lookingFor.includes(opt.id);
          return (
            <TouchableOpacity key={opt.id} onPress={() => toggleLookingFor(opt.id)} activeOpacity={0.88}>
              {active ? (
                <LinearGradient colors={["#7C3AED", "#8B5CF6"]} style={styles.lookingCardActive}>
                  <View style={styles.lookingIconBoxActive}>
                    <Text style={styles.lookingEmoji}>{opt.emoji}</Text>
                  </View>
                  <View style={styles.lookingTextGroup}>
                    <Text style={styles.lookingLabelActive}>{opt.label}</Text>
                    <Text style={styles.lookingSubActive}>{opt.subtitle}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                </LinearGradient>
              ) : (
                <View style={styles.lookingCard}>
                  <View style={[styles.lookingIconBox, { backgroundColor: opt.color + "18" }]}>
                    <Text style={styles.lookingEmoji}>{opt.emoji}</Text>
                  </View>
                  <View style={styles.lookingTextGroup}>
                    <Text style={styles.lookingLabel}>{opt.label}</Text>
                    <Text style={styles.lookingSub}>{opt.subtitle}</Text>
                  </View>
                  <View style={styles.checkCircleEmpty} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  heroCardGlow: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(124, 58, 237, 0.25)",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 0.8,
  },
  heroStatVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },

  // Dual & Single Slider Bar Styles
  sliderContainer: {
    backgroundColor: "#F8F9FD",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.md,
  },
  sliderHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sliderHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#18181B",
  },
  sliderValueBadge: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  sliderValueBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7C3AED",
  },
  sliderTouchArea: {
    height: 30,
    justifyContent: "center",
    position: "relative",
  },
  sliderTrackBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
    width: "100%",
    position: "relative",
  },
  sliderTrackFill: {
    position: "absolute",
    height: 8,
    borderRadius: 4,
  },
  sliderTrackFillSingle: {
    height: 8,
    borderRadius: 4,
  },
  sliderThumb: {
    position: "absolute",
    top: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#7C3AED",
    marginLeft: -12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sliderThumbInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7C3AED",
  },
  sliderMinMaxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderMinMaxText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
  },

  lookingGrid: { gap: Spacing.sm },
  lookingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: "#F8F9FD",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  lookingCardActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  lookingIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  lookingIconBoxActive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  lookingEmoji: { fontSize: 22 },
  lookingTextGroup: { flex: 1 },
  lookingLabel: { fontSize: 14, fontWeight: "700", color: "#18181B" },
  lookingLabelActive: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  lookingSub: { fontSize: 11, color: "#64748B", marginTop: 2, fontWeight: "500" },
  lookingSubActive: { fontSize: 11, color: "rgba(255, 255, 255, 0.8)", marginTop: 2, fontWeight: "500" },
  checkCircleEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },
});
