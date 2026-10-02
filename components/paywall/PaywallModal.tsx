import React, { useState, ComponentProps } from "react";
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

type IconName = ComponentProps<typeof Ionicons>["name"];

type PlanId = "6m" | "3m" | "1m";

interface FeatureItem {
  title: string;
  sub: string;
  icon: IconName;
  tag: string;
}

const FEATURES: FeatureItem[] = [
  {
    title: "See Who Likes You",
    sub: "Instantly reveal blurred admirers and match directly without waiting",
    icon: "heart",
    tag: "MOST WANTED",
  },
  {
    title: "Unlimited Likes",
    sub: "Send as many likes as you want, zero daily swipe limits",
    icon: "infinite",
    tag: "UNRESTRICTED",
  },
  {
    title: "Unlimited Rewinds",
    sub: "Accidentally swiped left? Bring them back whenever you want",
    icon: "arrow-undo",
    tag: "SECOND CHANCE",
  },
  {
    title: "Advanced Filters",
    sub: "Dial into your exact vibe, height, lifestyle, and interests",
    icon: "options",
    tag: "PRECISION",
  },
  {
    title: "Unlimited Daily Hangouts",
    sub: "Create unlimited plans, hangouts & events with zero daily creation limits",
    icon: "sparkles",
    tag: "UNLIMITED",
  },
  {
    title: "Spotlight Boosts",
    sub: "Get up to 10x more profile visits and be seen first nearby",
    icon: "flash",
    tag: "HIGH PRIORITY",
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
    label: "Months",
    badge: "BEST VALUE",
    price: "₹1,299",
    perMonth: "₹216/mo",
    discount: "-69%",
    tier: "VIP",
  },
  {
    id: "3m",
    months: 3,
    label: "Months",
    badge: "POPULAR",
    price: "₹899",
    perMonth: "₹299/mo",
    discount: "-57%",
    tier: "GOLD",
  },
  {
    id: "1m",
    months: 1,
    label: "Month",
    badge: "STANDARD",
    price: "₹699",
    perMonth: "₹699/mo",
    tier: "GOLD",
  },
];

function CyberAmbientBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={["#070A14", "#0D1424", "#070A14"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Top right cyan ambient orb */}
      <View style={styles.ambientGlowCyan} />
      {/* Top center neon lime subtle wash */}
      <View style={styles.ambientGlowLime} />
      {/* Bottom ambient glow */}
      <View style={styles.ambientGlowBottom} />
    </View>
  );
}

export default function PaywallModal() {
  const insets = useSafeAreaInsets();
  const { paywallVisible, closePaywall, upgradeTier } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("3m");
  const [featureIndex, setFeatureIndex] = useState(0);
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
        "Premium Unlocked! ✨",
        `${activePlan.months} ${activePlan.label} plan is now active. You can now see who likes you!`
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
      <StatusBar barStyle="light-content" backgroundColor="#070A14" />
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <CyberAmbientBackground />

        {/* Top Bar matching app header */}
        <View style={styles.topBar}>
          <Pressable onPress={closePaywall} hitSlop={12} style={styles.backButton}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={styles.titleCenter}>
            <View style={styles.titleRow}>
              <Text style={styles.titleVibe}>VIBE</Text>
              <Text style={styles.titlePremium}>PREMIUM</Text>
            </View>
            <Text style={styles.subtitle}>ELEVATE YOUR DATING EXPERIENCE</Text>
          </View>

          <View style={styles.vipPill}>
            <Ionicons name="sparkles" size={12} color="#070A14" />
            <Text style={styles.vipPillText}>VIP</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
        >
          {/* Feature Carousel */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onFeatureScroll}
            style={styles.featurePager}
          >
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureSlide}>
                <View style={styles.featureTagChip}>
                  <Text style={styles.featureTagText}>{f.tag}</Text>
                </View>

                <View style={styles.iconRingWrap}>
                  <LinearGradient
                    colors={["#D4F72C", "#22D3EE"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconRingGrad}
                  >
                    <View style={styles.iconInner}>
                      <Ionicons
                        name={f.icon}
                        size={32}
                        color={f.icon === "heart" ? "#22D3EE" : "#D4F72C"}
                      />
                    </View>
                  </LinearGradient>
                </View>

                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Carousel Dots */}
          <View style={styles.dots}>
            {FEATURES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === featureIndex ? styles.dotActive : styles.dotIdle,
                ]}
              />
            ))}
          </View>

          {/* Plan Cards Row */}
          <View style={styles.plansContainer}>
            <Text style={styles.choosePlanTitle}>SELECT YOUR MEMBERSHIP</Text>
            <View style={styles.plansRow}>
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => setSelectedPlan(plan.id)}
                    style={[
                      styles.planCard,
                      isSelected ? styles.planCardSelected : styles.planCardIdle,
                    ]}
                  >
                    {/* Badge */}
                    <View
                      style={[
                        styles.planBadge,
                        isSelected ? styles.planBadgeSelected : styles.planBadgeIdle,
                      ]}
                    >
                      <Text
                        style={[
                          styles.planBadgeText,
                          isSelected && styles.planBadgeTextSelected,
                        ]}
                      >
                        {plan.badge}
                      </Text>
                    </View>

                    {/* Months Number */}
                    <Text
                      style={[
                        styles.planMonthsNum,
                        isSelected ? styles.textLime : styles.textWhite,
                      ]}
                    >
                      {plan.months}
                    </Text>
                    <Text style={styles.planMonthsLabel}>{plan.label}</Text>

                    {/* Price */}
                    <Text style={styles.planPrice}>{plan.price}</Text>

                    {/* Per Month */}
                    {!!plan.perMonth && (
                      <Text
                        style={[
                          styles.planPerMonth,
                          isSelected && styles.perMonthActive,
                        ]}
                      >
                        {plan.perMonth}
                      </Text>
                    )}

                    {/* Discount Pill */}
                    {!!plan.discount ? (
                      <View
                        style={[
                          styles.discountPill,
                          isSelected ? styles.discountSelected : styles.discountIdle,
                        ]}
                      >
                        <Text
                          style={[
                            styles.discountText,
                            isSelected && styles.discountTextSelected,
                          ]}
                        >
                          SAVE {plan.discount}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ height: 24, marginTop: "auto" }} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Perks Summary Box */}
          <View style={styles.perksBox}>
            <View style={styles.perkLine}>
              <Ionicons name="checkmark-circle" size={17} color="#D4F72C" />
              <Text style={styles.perkLineText}>Reveal & chat with all who liked you</Text>
            </View>
            <View style={styles.perkLine}>
              <Ionicons name="checkmark-circle" size={17} color="#22D3EE" />
              <Text style={styles.perkLineText}>Unlimited daily profile swipes</Text>
            </View>
            <View style={styles.perkLine}>
              <Ionicons name="checkmark-circle" size={17} color="#D4F72C" />
              <Text style={styles.perkLineText}>Priority match spotlight in your area</Text>
            </View>
          </View>

          {/* Legal / Policy */}
          <Text style={styles.legal}>
            Recurring billing. Cancel anytime in Google Play Store subscriptions. By tapping Continue, you agree to our Terms & Privacy Policy.
          </Text>

          {/* Continue CTA Button */}
          <Pressable
            style={[styles.continueBtnWrap, purchasing && { opacity: 0.7 }]}
            onPress={handleContinue}
            disabled={purchasing}
          >
            <LinearGradient
              colors={["#D4F72C", "#22D3EE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueBtn}
            >
              <Ionicons name="diamond" size={18} color="#070A14" />
              <Text style={styles.continueText}>
                {purchasing ? "Activating VIP Access…" : `Continue with ${activePlan.months} ${activePlan.label}`}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070A14",
  },
  ambientGlowCyan: {
    position: "absolute",
    top: 20,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
  },
  ambientGlowLime: {
    position: "absolute",
    top: 60,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(212, 247, 44, 0.08)",
  },
  ambientGlowBottom: {
    position: "absolute",
    bottom: -60,
    left: SCREEN_W * 0.25,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(34, 211, 238, 0.07)",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  titleVibe: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.5,
  },
  titlePremium: {
    color: "#D4F72C",
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 9.5,
    fontFamily: VibeFonts.bold,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  vipPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D4F72C",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  vipPillText: {
    color: "#070A14",
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.5,
  },
  featurePager: {
    marginTop: 14,
    maxHeight: 225,
  },
  featureSlide: {
    width: SCREEN_W,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTagChip: {
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.28)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  featureTagText: {
    color: "#22D3EE",
    fontSize: 9.5,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.8,
  },
  iconRingWrap: {
    marginBottom: 12,
    shadowColor: "#22D3EE",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  iconRingGrad: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0D1424",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  featureSub: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 14,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    marginBottom: 18,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 22,
    backgroundColor: "#D4F72C",
  },
  dotIdle: {
    width: 6,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  plansContainer: {
    paddingHorizontal: 16,
  },
  choosePlanTitle: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: "center",
  },
  plansRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  planCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    minHeight: 205,
  },
  planCardIdle: {
    backgroundColor: "#0D1424",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  planCardSelected: {
    backgroundColor: "#131C33",
    borderWidth: 2,
    borderColor: "#D4F72C",
    transform: [{ scale: 1.02 }],
    shadowColor: "#D4F72C",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  planBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  planBadgeIdle: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  planBadgeSelected: {
    backgroundColor: "#D4F72C",
  },
  planBadgeText: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  planBadgeTextSelected: {
    color: "#070A14",
  },
  planMonthsNum: {
    fontSize: 34,
    fontFamily: VibeFonts.extraBold,
    lineHeight: 38,
  },
  textLime: {
    color: "#D4F72C",
  },
  textWhite: {
    color: "#FFFFFF",
  },
  planMonthsLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#94A3B8",
    marginBottom: 8,
    marginTop: -2,
  },
  planPrice: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  planPerMonth: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginBottom: 8,
  },
  perMonthActive: {
    color: "#22D3EE",
    fontFamily: VibeFonts.bold,
  },
  discountPill: {
    marginTop: "auto",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountIdle: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  discountSelected: {
    backgroundColor: "rgba(212, 247, 44, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.4)",
  },
  discountText: {
    fontSize: 9.5,
    fontFamily: VibeFonts.extraBold,
    color: "#94A3B8",
    letterSpacing: 0.4,
  },
  discountTextSelected: {
    color: "#D4F72C",
  },
  perksBox: {
    marginHorizontal: 16,
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#0D1424",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 10,
  },
  perkLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  perkLineText: {
    fontSize: 12.5,
    fontFamily: VibeFonts.medium,
    color: "#E2E8F0",
  },
  legal: {
    fontSize: 10,
    lineHeight: 14,
    color: "#64748B",
    textAlign: "center",
    fontFamily: VibeFonts.regular,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 16,
  },
  continueBtnWrap: {
    marginHorizontal: 16,
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#D4F72C",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 999,
  },
  continueText: {
    color: "#070A14",
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.2,
  },
});
