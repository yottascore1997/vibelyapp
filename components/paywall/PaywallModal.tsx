import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { usePremium, PremiumTier } from "../../context/PremiumContext";
import { Radius, Spacing } from "../../constants/theme";

interface PlanOption {
  id: PremiumTier;
  title: string;
  badge?: string;
  priceMain: string;
  periodText: string;
  perDayText: string;
  saveText?: string;
  popular?: boolean;
  features: { icon: string; title: string; sub: string }[];
}

const PLANS: PlanOption[] = [
  {
    id: "GOLD",
    title: "VibeGold Pass",
    badge: "🔥 MOST POPULAR",
    priceMain: "₹99",
    periodText: "/ week",
    perDayText: "Only ₹14 / day",
    saveText: "SAVE 50%",
    popular: true,
    features: [
      { icon: "eye", title: "See Who Liked You", sub: "Instant Unblur 50+ Profiles" },
      { icon: "infinite", title: "Unlimited Swipes", sub: "No Daily Swipe Limits" },
      { icon: "options", title: "Advanced Filters", sub: "Height, Zodiac & Lifestyle" },
      { icon: "refresh", title: "Unlimited Rewinds", sub: "Undo Accidental Left Swipes" },
      { icon: "sparkles", title: "5 Super Likes / Day", sub: "Stand Out In Swipe Stack" },
    ],
  },
  {
    id: "VIP",
    title: "VibeVIP Pass",
    badge: "👑 VIP FULL UNLOCK",
    priceMain: "₹499",
    periodText: "/ month",
    perDayText: "Only ₹16 / day",
    saveText: "BEST VALUE",
    popular: false,
    features: [
      { icon: "navigate", title: "Live Spot Beacons", sub: "Broadcast Hangout Plans" },
      { icon: "paper-plane", title: "5 Direct DMs / Day", sub: "Message Anyone Instantly" },
      { icon: "planet", title: "Passport Travel Mode", sub: "Date in Any City Worldwide" },
      { icon: "rocket", title: "2 Free Boosts / Mo", sub: "5x Profile Spotlight Views" },
      { icon: "shield-checkmark", title: "Incognito Mode", sub: "Browse Profiles Privately" },
      { icon: "sparkles", title: "All Gold Perks Included", sub: "Full VIP Access" },
    ],
  },
];

export default function PaywallModal() {
  const { paywallVisible, closePaywall, upgradeTier } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PremiumTier>("GOLD");
  const [purchasing, setPurchasing] = useState(false);

  const activePlanObj = PLANS.find((p) => p.id === selectedPlan) || PLANS[0];

  const handleSubscribe = async () => {
    setPurchasing(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      await upgradeTier(selectedPlan);
      Alert.alert(
        "🎉 VibeMatch Premium Active!",
        `Congratulations! Your ${activePlanObj.title} is now active.`
      );
    } catch {
      Alert.alert("Payment Failed", "Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal
      visible={paywallVisible}
      animationType="slide"
      transparent
      onRequestClose={closePaywall}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Soft Mesh Glow Orbs */}
          <View style={[styles.orb, styles.orb1]} />
          <View style={[styles.orb, styles.orb2]} />

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={closePaywall} activeOpacity={0.8}>
            <Ionicons name="close" size={20} color="#18181B" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header Crown */}
            <View style={styles.headerBox}>
              <View style={styles.crownRing}>
                <Text style={styles.crownEmoji}>👑</Text>
              </View>

              {/* Special Countdown Tag */}
              <View style={styles.countdownPill}>
                <View style={styles.livePulseDot} />
                <Text style={styles.countdownText}>SPECIAL LAUNCH PRICE • ENDS IN 14:59</Text>
              </View>

              <Text style={styles.heroTitle}>Unlock VibeMatch Premium</Text>
              <Text style={styles.heroSub}>
                🔥 Join 12,400+ members matching 3x faster with Premium
              </Text>
            </View>

            {/* Plan Selection Cards */}
            <View style={styles.plansRow}>
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    onPress={() => setSelectedPlan(plan.id)}
                    activeOpacity={0.88}
                    style={styles.planCardItem}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={["#7C3AED", "#8B5CF6"]}
                        style={styles.planCardSelectedGrad}
                      >
                        <View style={styles.planCardSelectedInner}>
                          {plan.badge && (
                            <View style={styles.planBadgeSelected}>
                              <Text style={styles.planBadgeTextSelected}>{plan.badge}</Text>
                            </View>
                          )}
                          <Text style={styles.planTitleSelected}>{plan.title}</Text>
                          <View style={styles.priceRow}>
                            <Text style={styles.priceMainSelected}>{plan.priceMain}</Text>
                            <Text style={styles.pricePeriodSelected}>{plan.periodText}</Text>
                          </View>
                          <Text style={styles.perDaySelected}>{plan.perDayText}</Text>
                          {plan.saveText && (
                            <View style={styles.saveTagSelected}>
                              <Text style={styles.saveTagTextSelected}>{plan.saveText}</Text>
                            </View>
                          )}
                        </View>
                      </LinearGradient>
                    ) : (
                      <View style={styles.planCardIdle}>
                        {plan.badge && (
                          <View style={styles.planBadgeIdle}>
                            <Text style={styles.planBadgeTextIdle}>{plan.badge}</Text>
                          </View>
                        )}
                        <Text style={styles.planTitleIdle}>{plan.title}</Text>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceMainIdle}>{plan.priceMain}</Text>
                          <Text style={styles.pricePeriodIdle}>{plan.periodText}</Text>
                        </View>
                        <Text style={styles.perDayIdle}>{plan.perDayText}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Feature Cards Grid (Hangout Light Aesthetic) */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionHeaderTitle}>
                WHAT YOU UNLOCK WITH {activePlanObj.title.toUpperCase()}:
              </Text>
              <View style={styles.featuresGrid}>
                {activePlanObj.features.map((feat, idx) => (
                  <View key={idx} style={styles.featureCard}>
                    <View style={styles.featureIconBox}>
                      <Ionicons name={feat.icon as any} size={18} color="#7C3AED" />
                    </View>
                    <View style={styles.featureTextGroup}>
                      <Text style={styles.featureItemTitle}>{feat.title}</Text>
                      <Text style={styles.featureItemSub}>{feat.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Security Guarantee Bar */}
            <View style={styles.securityBar}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.securityText}>100% Safe Payment • Cancel Anytime</Text>
            </View>
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.footerContainer}>
            <TouchableOpacity onPress={handleSubscribe} disabled={purchasing} activeOpacity={0.88}>
              <LinearGradient
                colors={["#7C3AED", "#8B5CF6", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>
                  {purchasing ? "ACTIVATING PREMIUM..." : `GET ${activePlanObj.title.toUpperCase()}`}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.legalNote}>Cancel anytime from App Store or Play Store settings.</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(24, 24, 27, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    height: "92%",
    backgroundColor: "#F8F9FD",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    overflow: "hidden",
    position: "relative",
  },
  orb: { position: "absolute", borderRadius: 999 },
  orb1: {
    width: 260,
    height: 260,
    top: -50,
    right: -40,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
  },
  orb2: {
    width: 220,
    height: 220,
    top: 200,
    left: -50,
    backgroundColor: "rgba(236, 72, 153, 0.06)",
  },
  closeBtn: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  headerBox: {
    alignItems: "center",
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  crownRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "rgba(124, 58, 237, 0.25)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  crownEmoji: { fontSize: 32 },

  countdownPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
    marginBottom: 8,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7C3AED",
  },
  countdownText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#7C3AED",
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#18181B",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: Spacing.md,
  },

  // Plan Selection Row
  plansRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: Spacing.md,
  },
  planCardItem: {
    flex: 1,
  },
  planCardSelectedGrad: {
    borderRadius: 20,
    padding: 2,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  planCardSelectedInner: {
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#F3E8FF",
  },
  planCardIdle: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  planBadgeSelected: {
    alignSelf: "flex-start",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  planBadgeTextSelected: { fontSize: 9, fontWeight: "800", color: "#FFFFFF" },
  planBadgeIdle: {
    alignSelf: "flex-start",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  planBadgeTextIdle: { fontSize: 9, fontWeight: "700", color: "#64748B" },
  planTitleSelected: { fontSize: 14, fontWeight: "800", color: "#7C3AED" },
  planTitleIdle: { fontSize: 14, fontWeight: "700", color: "#18181B" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 3, marginTop: 4 },
  priceMainSelected: { fontSize: 24, fontWeight: "800", color: "#18181B" },
  priceMainIdle: { fontSize: 20, fontWeight: "800", color: "#18181B" },
  pricePeriodSelected: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  pricePeriodIdle: { fontSize: 11, color: "#94A3B8", fontWeight: "500" },
  perDaySelected: { fontSize: 10, color: "#7C3AED", fontWeight: "700", marginTop: 2 },
  perDayIdle: { fontSize: 10, color: "#94A3B8", fontWeight: "500", marginTop: 2 },
  saveTagSelected: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveTagTextSelected: { fontSize: 9, fontWeight: "800", color: "#FFFFFF" },

  // Feature Section
  featuresSection: {
    marginBottom: Spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#7C3AED",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  featuresGrid: {
    gap: 8,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextGroup: { flex: 1 },
  featureItemTitle: { fontSize: 13, fontWeight: "700", color: "#18181B" },
  featureItemSub: { fontSize: 11, color: "#64748B", marginTop: 1, fontWeight: "500" },

  securityBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  securityText: { fontSize: 11, fontWeight: "700", color: "#10B981" },

  // Footer CTA
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: Radius.full,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
  legalNote: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 6,
    fontWeight: "500",
  },
});
