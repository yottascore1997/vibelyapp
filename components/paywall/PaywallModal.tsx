import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePremium, PremiumTier } from "../../context/PremiumContext";
import { VibeFonts } from "../../constants/vibeTheme";

const { width: SCREEN_W } = Dimensions.get("window");

/** Vibes → Night Out ambient (same as DiscoverVibesGate nightlife card) */
const PINK = "#F9A8D4";
const AMBIENT = "#3A1528";
const AMBIENT_MID = "#1A0C14";
const DEEP = "#070A14";

const CREAM = "#FBF0C8";
const INK = "#111111";
const MUTED_TAG = "#4A4A4A";
const TEXT = "#FFFFFF";
const TEXT_SOFT = "rgba(255,255,255,0.78)";
const LEGAL = "rgba(249,168,212,0.55)";
const ACCENT_ON_DARK = PINK;

type PlanId = "6m" | "3m" | "1m";

const FEATURES = [
  {
    title: "See who likes you",
    sub: "Match with people who already like you back",
    icon: "heart" as const,
  },
  {
    title: "Unlimited likes",
    sub: "Like the people you're interested in, as often as you want",
    icon: "hearts" as const,
  },
  {
    title: "Unlimited rewinds",
    sub: "Undo accidental left swipes whenever you need",
    icon: "rewind" as const,
  },
  {
    title: "Advanced filters",
    sub: "Find people by height, lifestyle, and more",
    icon: "filters" as const,
  },
  {
    title: "Spotlight boosts",
    sub: "Be seen first by more people nearby",
    icon: "boost" as const,
  },
];

const PLANS: {
  id: PlanId;
  months: number;
  label: string;
  badge: string;
  price: string;
  perMonth?: string;
  discount?: string;
  tier: PremiumTier;
}[] = [
  {
    id: "6m",
    months: 6,
    label: "months",
    badge: "Best price",
    price: "₹1,299.00",
    perMonth: "₹216.50/m.",
    discount: "-69%",
    tier: "VIP",
  },
  {
    id: "3m",
    months: 3,
    label: "months",
    badge: "Popular",
    price: "₹899.00",
    perMonth: "₹299.67/m.",
    discount: "-57%",
    tier: "GOLD",
  },
  {
    id: "1m",
    months: 1,
    label: "month",
    badge: "Unit price",
    price: "₹699.00",
    tier: "GOLD",
  },
];

function NightOutBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[AMBIENT, AMBIENT_MID, DEEP]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[`${PINK}55`, `${PINK}18`, "transparent"]}
        locations={[0, 0.35, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.colorWash}
      />
      <View style={[styles.glowOrb, { backgroundColor: PINK, shadowColor: PINK }]} />
      <View style={[styles.glowOrbBottom, { backgroundColor: PINK, shadowColor: PINK }]} />
      <View style={styles.doodleWrap}>
        <View style={[styles.doodleArc, styles.doodle1]} />
        <View style={[styles.doodleArc, styles.doodle2]} />
        <View style={[styles.doodleArc, styles.doodle3]} />
        <View style={[styles.doodleArc, styles.doodle4]} />
      </View>
    </View>
  );
}

function FeatureIcon({ kind }: { kind: string }) {
  if (kind === "hearts") {
    return (
      <View style={[styles.iconBox, styles.iconBoxRed]}>
        <Ionicons
          name="heart"
          size={22}
          color="#fff"
          style={{ position: "absolute", left: 14, top: 16, opacity: 0.95 }}
        />
        <Ionicons
          name="heart"
          size={26}
          color="#fff"
          style={{ position: "absolute", right: 12, top: 12 }}
        />
      </View>
    );
  }
  const map: Record<string, keyof Ionicons.glyphMap> = {
    heart: "heart",
    rewind: "arrow-undo",
    filters: "options",
    boost: "flash",
  };
  return (
    <View style={styles.iconBox}>
      <Ionicons name={map[kind] || "heart"} size={28} color="#fff" />
    </View>
  );
}

export default function PaywallModal() {
  const insets = useSafeAreaInsets();
  const { paywallVisible, closePaywall, upgradeTier } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("3m");
  const [featureIndex, setFeatureIndex] = useState(1);
  const [purchasing, setPurchasing] = useState(false);

  const activePlan = PLANS.find((p) => p.id === selectedPlan) || PLANS[1];

  const onFeatureScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SCREEN_W);
    if (idx !== featureIndex && idx >= 0 && idx < FEATURES.length) {
      setFeatureIndex(idx);
    }
  };

  const handleContinue = async () => {
    setPurchasing(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      await upgradeTier(activePlan.tier);
      closePaywall();
      Alert.alert(
        "Premium unlocked",
        `${activePlan.months} ${activePlan.label} plan is now active.`
      );
    } catch {
      Alert.alert("Payment failed", "Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal
      visible={paywallVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closePaywall}
    >
      <StatusBar barStyle="light-content" backgroundColor={AMBIENT} />
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <NightOutBackground />

        <View style={[styles.topBar, styles.hPad]}>
          <Pressable onPress={closePaywall} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={TEXT} />
          </Pressable>
          <Text style={styles.title}>Premium</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onFeatureScroll}
          style={styles.featurePager}
          contentOffset={{ x: SCREEN_W * 1, y: 0 }}
        >
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureSlide}>
              <FeatureIcon kind={f.icon} />
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureSub}>{f.sub}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots}>
          {FEATURES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === featureIndex ? styles.dotActive : styles.dotIdle]}
            />
          ))}
        </View>

        <View style={[styles.plansRow, styles.hPad]}>
          {PLANS.map((plan) => {
            const selected = selectedPlan === plan.id;
            return (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                style={[styles.planCard, selected ? styles.planSelected : styles.planIdle]}
              >
                <View
                  style={[
                    styles.planBadge,
                    selected && styles.planBadgeOnDark,
                    (plan.id === "6m" || plan.id === "1m") && styles.planBadgePurple,
                  ]}
                >
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>

                <Text style={[styles.planMonthsNum, selected && styles.textOnDark]}>
                  {plan.months}
                </Text>
                <Text style={[styles.planMonthsLabel, selected && styles.textOnDark]}>
                  {plan.label}
                </Text>

                <Text style={[styles.planPrice, selected && styles.textOnDark]}>{plan.price}</Text>

                {!!plan.perMonth && (
                  <Text style={[styles.planPerMonth, selected && styles.perMonthOnDark]}>
                    {plan.perMonth}
                  </Text>
                )}

                {!!plan.discount && (
                  <View style={[styles.discountPill, selected && styles.discountOnDark]}>
                    <Text style={[styles.discountText, selected && styles.discountTextOnDark]}>
                      {plan.discount}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        <Text style={[styles.legal, styles.hPad]}>
          By clicking Continue, your payment will be made using your Google Play account and your
          selected subscription will be activated for the period of time indicated. At the end of
          that period, your subscription will automatically be renewed at the same price and for the
          same duration, unless you deactivate the renewal option in the Google Play settings.
        </Text>

        <Pressable
          style={[styles.continueBtn, styles.hPadBtn, purchasing && { opacity: 0.7 }]}
          onPress={handleContinue}
          disabled={purchasing}
        >
          <Text style={styles.continueText}>{purchasing ? "Processing…" : "Continue"}</Text>
        </Pressable>

        <View style={{ height: Math.max(insets.bottom, 12) }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DEEP,
  },
  colorWash: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOrb: {
    position: "absolute",
    top: "12%",
    left: SCREEN_W * 0.15,
    width: SCREEN_W * 0.7,
    height: SCREEN_W * 0.7,
    borderRadius: SCREEN_W * 0.35,
    opacity: 0.22,
    shadowOpacity: 0.7,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  glowOrbBottom: {
    position: "absolute",
    bottom: -40,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.14,
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  doodleWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  doodleArc: {
    position: "absolute",
    borderColor: "rgba(249,168,212,0.35)",
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  doodle1: {
    width: 160,
    height: 160,
    borderRadius: 80,
    top: 36,
    right: -30,
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
  },
  doodle2: {
    width: 120,
    height: 120,
    borderRadius: 60,
    top: 90,
    right: 40,
    borderRightColor: "transparent",
    borderTopColor: "transparent",
    opacity: 0.7,
  },
  doodle3: {
    width: 140,
    height: 140,
    borderRadius: 70,
    top: 70,
    left: -40,
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    opacity: 0.55,
  },
  doodle4: {
    width: 90,
    height: 90,
    borderRadius: 45,
    top: 180,
    left: 50,
    borderLeftColor: "transparent",
    borderTopColor: "transparent",
    opacity: 0.4,
  },
  hPad: {
    paddingHorizontal: 16,
  },
  hPadBtn: {
    marginHorizontal: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: TEXT,
    letterSpacing: -0.3,
  },
  featurePager: {
    maxHeight: 200,
  },
  featureSlide: {
    width: SCREEN_W,
    paddingHorizontal: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  iconBoxRed: {
    backgroundColor: "#E11D48",
  },
  featureTitle: {
    fontSize: 26,
    fontFamily: VibeFonts.extraBold,
    color: TEXT,
    textAlign: "center",
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  featureSub: {
    fontSize: 15,
    fontFamily: VibeFonts.medium,
    color: TEXT_SOFT,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 12,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    marginTop: 10,
    marginBottom: 22,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: { backgroundColor: PINK },
  dotIdle: { backgroundColor: "rgba(255,255,255,0.28)" },
  plansRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
  },
  planCard: {
    flex: 1,
    borderRadius: 22,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    minHeight: 210,
  },
  planIdle: {
    backgroundColor: CREAM,
  },
  planSelected: {
    backgroundColor: INK,
    transform: [{ scale: 1.02 }],
    shadowColor: PINK,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  planBadge: {
    backgroundColor: MUTED_TAG,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  planBadgePurple: {
    backgroundColor: "#7C3AED",
  },
  planBadgeOnDark: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  planBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
  },
  planMonthsNum: {
    fontSize: 40,
    fontFamily: VibeFonts.extraBold,
    color: INK,
    lineHeight: 44,
  },
  planMonthsLabel: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: INK,
    marginBottom: 10,
    marginTop: -2,
  },
  planPrice: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: INK,
    marginBottom: 2,
  },
  planPerMonth: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: INK,
    opacity: 0.85,
    marginBottom: 10,
  },
  perMonthOnDark: {
    color: ACCENT_ON_DARK,
    opacity: 1,
  },
  textOnDark: {
    color: "#fff",
  },
  discountPill: {
    marginTop: "auto" as const,
    backgroundColor: INK,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  discountOnDark: {
    backgroundColor: "#fff",
  },
  discountText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  discountTextOnDark: {
    color: INK,
  },
  legal: {
    fontSize: 10,
    lineHeight: 14,
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: VibeFonts.regular,
    marginBottom: 14,
    marginTop: 18,
  },
  continueBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
  },
});
