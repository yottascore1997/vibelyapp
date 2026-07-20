import { View, Text, StyleSheet, Pressable, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInRight } from "react-native-reanimated";
import { Plan } from "../../constants/plans";
import { VibeColors, VibeFonts } from "../../constants/vibeTheme";
import { Radius, Spacing } from "../../constants/theme";
import GlassCard from "../vibe/GlassCard";

const BADGE: Record<string, { label: string; color: string }> = {
  Popular: { label: "🔥 Popular", color: "#F97316" },
  New: { label: "✨ New", color: "#8A56FF" },
  Trending: { label: "⚡ Trending", color: "#22C55E" },
  Soon: { label: "⏱ Soon", color: "#EAB308" },
  Today: { label: "📅 Today", color: "#3B82F6" },
  Live: { label: "🟢 Live", color: "#EF4444" },
};

interface Props {
  plan: Plan;
  onJoin?: () => void;
  requestStatus?: "none" | "pending" | "accepted" | "rejected";
  isMine?: boolean;
  index?: number;
  onAcceptRequest?: (planId: string, userId: string, accept: boolean) => void;
  onRejectRequest?: (planId: string, userId: string, accept: boolean) => void;
  lightMode?: boolean;
}

export default function NearbyPlanCard({
  plan,
  onJoin,
  requestStatus = "none",
  isMine,
  index = 0,
  onAcceptRequest,
  onRejectRequest,
  lightMode = false,
}: Props) {
  const router = useRouter();
  const badge = BADGE[plan.badge || "New"] || BADGE.New;

  const handleCardPress = () => {
    router.push({
      pathname: "/plan-details",
      params: { id: plan.id }
    });
  };

  // Determine local match tag (Nagpur matches)
  const isLocal = plan.location?.toLowerCase().includes("nagpur") || 
                  plan.location?.toLowerCase().includes("ccd") || 
                  plan.location?.toLowerCase().includes("sitabuldi") || 
                  (plan.distance !== undefined && plan.distance < 5.0);

  const tags = [
    plan.activity ? plan.activity.toUpperCase() : "HANGOUT",
    plan.badge ? plan.badge.toUpperCase() : "NEW"
  ];

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).springify()} style={styles.wrap}>
      <TouchableOpacity onPress={handleCardPress} activeOpacity={0.92}>
        <GlassCard style={styles.eventCard} lightMode={lightMode}>
          <View style={styles.cardMainRow}>
            {/* Left Thumbnail visual with badges overlay */}
            <View style={styles.cardLeftThumb}>
              <Image 
                source={{ uri: plan.imageUrl || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop" }} 
                style={styles.thumbImg} 
              />
              
              {/* Top-Left badge */}
              <View style={[styles.freeHangBadge, { backgroundColor: badge.color }]}>
                <Text style={styles.freeHangText}>{badge.label.toUpperCase()}</Text>
              </View>
 
              {/* Bottom counters overlay */}
              <View style={styles.countersRow}>
                <View style={styles.counterItem}>
                  <Ionicons name="people" size={10} color="#fff" />
                  <Text style={styles.counterText}>{plan.going}/{plan.maxParticipants}</Text>
                </View>
                {plan.distance !== undefined && (
                  <View style={styles.counterItem}>
                    <Ionicons name="navigate" size={10} color="#fff" />
                    <Text style={styles.counterText}>{plan.distance.toFixed(1)} km</Text>
                  </View>
                )}
              </View>
            </View>
 
            {/* Right Details content */}
            <View style={styles.cardRightDetails}>
              {/* Creator row */}
              <View style={styles.creatorRow}>
                <Image 
                  source={{ uri: plan.creatorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100" }} 
                  style={styles.creatorAvatar} 
                />
                <View style={styles.creatorMeta}>
                  <View style={styles.creatorNameRow}>
                    <Text style={[styles.creatorName, lightMode && { color: "#1F1A3A" }]}>{plan.creatorName || "Local User"}</Text>
                    <Ionicons name="checkmark-circle" size={12} color="#8A56FF" style={{ marginLeft: 3 }} />
                  </View>
                  <Text style={styles.creatorTimeAgo}>Active • 🌐</Text>
                </View>
 
                <View style={styles.creatorActions}>
                  <TouchableOpacity style={styles.cardActionIcon}>
                    <Ionicons name="bookmark-outline" size={16} color={lightMode ? "rgba(31, 26, 58, 0.4)" : "rgba(255,255,255,0.6)"} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cardActionIcon}>
                    <Ionicons name="ellipsis-vertical" size={16} color={lightMode ? "rgba(31, 26, 58, 0.4)" : "rgba(255,255,255,0.6)"} />
                  </TouchableOpacity>
                </View>
              </View>
 
              {/* Title & Emojis */}
              <Text style={[styles.eventTitle, lightMode && { color: "#1F1A3A" }]}>{plan.title}</Text>
 
              {/* Location with Pin */}
              <View style={styles.locationRow}>
                <Ionicons name="location" size={12} color="#C084FC" />
                <Text style={[styles.locationVal, lightMode && { color: "rgba(31, 26, 58, 0.6)" }]} numberOfLines={1}>{plan.location || "Location TBD"}</Text>
              </View>
 
              {/* Tags row */}
              <View style={styles.tagsCapsulesRow}>
                {tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagCapsule}>
                    <Text style={styles.tagCapsuleText}>{tag}</Text>
                  </View>
                ))}
                {isLocal && (
                  <View style={[styles.tagCapsule, { backgroundColor: "rgba(192, 132, 252, 0.12)", borderColor: "rgba(192, 132, 252, 0.25)" }]}>
                    <Text style={[styles.tagCapsuleText, { color: "#C084FC" }]}>LOCAL MATCH</Text>
                  </View>
                )}
              </View>
 
              {/* Tagline Description */}
              {plan.description ? (
                <Text style={[styles.eventDesc, lightMode && { color: "rgba(31, 26, 58, 0.7)" }]} numberOfLines={2}>{plan.description}</Text>
              ) : null}
            </View>
          </View>
 
          {/* Card Footer row */}
          <View style={[styles.cardFooter, lightMode && { borderTopColor: "rgba(31, 26, 58, 0.08)" }]}>
            <View style={[styles.footerCapsule, lightMode && { backgroundColor: "rgba(31, 26, 58, 0.03)", borderColor: "rgba(31, 26, 58, 0.08)" }]}>
              <Ionicons name="calendar-outline" size={12} color="#C084FC" />
              <Text style={[styles.footerCapsuleText, lightMode && { color: "rgba(31, 26, 58, 0.6)" }]}>{plan.timeLabel || plan.time || "Flexible"}</Text>
            </View>
 
            <View style={[styles.footerCapsule, lightMode && { backgroundColor: "rgba(31, 26, 58, 0.03)", borderColor: "rgba(31, 26, 58, 0.08)" }]}>
              <Ionicons name="people-outline" size={12} color="#22C55E" />
              <Text style={[styles.footerCapsuleText, { color: "#22C55E" }]}>
                {plan.maxParticipants - plan.going > 0 ? `${plan.maxParticipants - plan.going} spots` : "Full"}
              </Text>
            </View>
 
            {isMine ? (
              <View style={styles.interestBtn}>
                <LinearGradient 
                  colors={["#8A56FF", "#4F46E5"]} 
                  start={{ x: 0, y: 0 }} 
                  end={{ x: 1, y: 0 }} 
                  style={styles.interestGrad}
                >
                  <Text style={styles.interestBtnText}>Your Plan</Text>
                </LinearGradient>
              </View>
            ) : (
              requestStatus === "none" ? (
                <TouchableOpacity onPress={onJoin} style={styles.interestBtn}>
                  <LinearGradient 
                    colors={["#8A56FF", "#FF4B81"]} 
                    start={{ x: 0, y: 0 }} 
                    end={{ x: 1, y: 0 }} 
                    style={styles.interestGrad}
                  >
                    <Text style={styles.interestBtnText}>Join Plan</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : requestStatus === "pending" ? (
                <View style={[styles.interestBtn, { backgroundColor: "#EAB308" }]}>
                  <View style={styles.interestGrad}>
                    <Text style={styles.interestBtnText}>Pending ⌛</Text>
                  </View>
                </View>
              ) : requestStatus === "accepted" ? (
                <View style={[styles.interestBtn, { backgroundColor: "#22C55E" }]}>
                  <View style={styles.interestGrad}>
                    <Text style={styles.interestBtnText}>Joined ✅</Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.interestBtn, { backgroundColor: "#EF4444" }]}>
                  <View style={styles.interestGrad}>
                    <Text style={styles.interestBtnText}>Declined ❌</Text>
                  </View>
                </View>
              )
            )}
          </View>
 
          {/* Pending Incoming Requests for Owner to Approve/Decline */}
          {isMine && plan.requests && plan.requests.length > 0 && (
            <View style={[styles.requestsContainer, lightMode && { borderTopColor: "rgba(31, 26, 58, 0.08)" }]}>
              <Text style={[styles.requestsHeader, lightMode && { color: "#1F1A3A" }]}>Join Requests ({plan.requests.length})</Text>
              {plan.requests.map((req: any) => (
                <View key={req.id} style={[styles.requestRow, lightMode && { backgroundColor: "rgba(31, 26, 58, 0.03)", borderColor: "rgba(31, 26, 58, 0.08)" }]}>
                  <View style={styles.requesterInfo}>
                    <Image
                      source={{ uri: req.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }}
                      style={styles.requesterAvatar}
                    />
                    <Text style={[styles.requesterName, lightMode && { color: "#1F1A3A" }]} numberOfLines={1}>{req.name}</Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      onPress={() => onAcceptRequest?.(plan.id, req.id, true)}
                      style={[styles.reqBtn, styles.acceptBtn]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onRejectRequest?.(plan.id, req.id, false)}
                      style={[styles.reqBtn, styles.rejectBtn]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={13} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.md, width: "100%" },
  eventCard: { padding: Spacing.md },
  cardMainRow: { flexDirection: "row", gap: Spacing.md },
  
  // Left side image details
  cardLeftThumb: { width: 110, height: 140, borderRadius: Radius.lg, overflow: "hidden", position: "relative" },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  freeHangBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  freeHangText: { color: "#fff", fontSize: 7, fontFamily: VibeFonts.bold },
  countersRow: {
    position: "absolute",
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  counterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(5,5,8,0.75)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  counterText: { color: "#fff", fontSize: 7, fontFamily: VibeFonts.bold },

  // Right details elements
  cardRightDetails: { flex: 1, gap: 3 },
  creatorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  creatorAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  creatorMeta: { flex: 1 },
  creatorNameRow: { flexDirection: "row", alignItems: "center" },
  creatorName: { color: "#fff", fontSize: 11, fontFamily: VibeFonts.bold },
  creatorTimeAgo: { color: VibeColors.textMuted, fontSize: 8, fontFamily: VibeFonts.medium },
  creatorActions: { flexDirection: "row", gap: 4 },
  cardActionIcon: { padding: 2 },
  eventTitle: { fontSize: 14, fontFamily: VibeFonts.extraBold, color: "#fff", marginTop: 2 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locationVal: { color: VibeColors.textMuted, fontSize: 10, fontFamily: VibeFonts.medium, flex: 1 },
  tagsCapsulesRow: { flexDirection: "row", gap: 4, flexWrap: "wrap", marginVertical: 2 },
  tagCapsule: {
    backgroundColor: "rgba(138,86,255,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(138,86,255,0.25)",
  },
  tagCapsuleText: { color: "#C084FC", fontSize: 8, fontFamily: VibeFonts.bold },
  eventDesc: { color: "rgba(255,255,255,0.75)", fontSize: 10, fontFamily: VibeFonts.medium, lineHeight: 14 },

  // Card Bottom Row
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  footerCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  footerCapsuleText: { color: VibeColors.textMuted, fontSize: 9, fontFamily: VibeFonts.bold },
  interestBtn: { borderRadius: Radius.full, overflow: "hidden" },
  interestGrad: { paddingHorizontal: 14, paddingVertical: 8 },
  interestBtnText: { color: "#fff", fontSize: 9, fontFamily: VibeFonts.bold },

  // Requests Section for Plan Owner
  requestsContainer: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: Spacing.sm,
    marginTop: Spacing.md,
  },
  requestsHeader: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#fff",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: Spacing.xs,
    borderRadius: Radius.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  requesterInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  requesterAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  requesterName: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#fff",
    flex: 1,
  },
  requestActions: {
    flexDirection: "row",
    gap: 5,
  },
  reqBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: {
    backgroundColor: "#22C55E",
  },
  rejectBtn: {
    backgroundColor: "#EF4444",
  },
});
