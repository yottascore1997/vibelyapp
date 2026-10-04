import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VibeFonts } from "../../constants/vibeTheme";
import { api } from "../../services/api";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// ── Icons & Stickers Mapping ──
const CHAI_JOIN_IMAGES = [
  require("../../assets/icons/chaijoin1.png"),
  require("../../assets/icons/chaijoin2.png"),
];

const BEER_JOIN_IMAGES = [
  require("../../assets/icons/beerjoin1.png"),
];

const COFFEE_JOIN_IMAGES = [
  require("../../assets/icons/coffeejoin1.png"),
];

const SMOKE_JOIN_IMAGES = [
  require("../../assets/icons/smokejoin1.png"),
];

const FOOD_JOIN_IMAGES = [
  require("../../assets/icons/biryanijoin1.png"),
];

const WALK_JOIN_IMAGES = [
  require("../../assets/icons/walkjoin1.png"),
];

export interface HangoutInviteData {
  id?: string;
  senderName: string;
  senderAvatar?: string;
  category: "chai" | "tea" | "beer" | "coffee" | "smoke" | "food" | "biryani" | "walk" | string;
  location?: string;
  time?: string;
  planId?: string;
}

interface HangoutInviteModalProps {
  visible: boolean;
  onClose: () => void;
  onJoin?: () => void;
  onCounter?: (counterVibe: string) => void;
  data?: HangoutInviteData | null;
}

// ── Cigarette Graphic (matching screenshot) ──
function CigaretteGraphic() {
  return (
    <View style={styles.cigWrapper}>
      {/* Smoke wisps */}
      <View style={styles.cigSmoke}>
        <Text style={styles.cigSmokeText}>〰️</Text>
      </View>
      {/* Cigarette cylinder angled */}
      <View style={styles.cigStick}>
        <View style={styles.cigFilter} />
        <View style={styles.cigBody} />
        <View style={styles.cigEmber} />
      </View>
    </View>
  );
}

export default function HangoutInviteModal({
  visible,
  onClose,
  onJoin,
  onCounter,
  data,
}: HangoutInviteModalProps) {
  const insets = useSafeAreaInsets();

  const senderName = data?.senderName || "Friend";
  const senderAvatar =
    data?.senderAvatar ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop";

  // Active category state that can switch on counter tap
  const [activeCategory, setActiveCategory] = useState<string>("chai");
  const [activeLocation, setActiveLocation] = useState<string>("CHAYOS, GALLERIA");
  const [activeTime, setActiveTime] = useState<string>("6 PM TODAY");

  // State to track shuffled image
  const [shuffledImage, setShuffledImage] = useState<any>(CHAI_JOIN_IMAGES[0]);

  // Pick / Shuffle image according to category
  const pickStickerForCategory = (cat: string) => {
    const norm = cat.toLowerCase();
    if (norm.includes("chai") || norm.includes("tea")) {
      // Shuffle randomly between chaijoin1 and chaijoin2!
      const randIdx = Math.floor(Math.random() * CHAI_JOIN_IMAGES.length);
      return CHAI_JOIN_IMAGES[randIdx];
    } else if (norm.includes("beer") || norm.includes("drinks") || norm.includes("alcohol")) {
      return BEER_JOIN_IMAGES[0];
    } else if (norm.includes("coffee") || norm.includes("cafe")) {
      return COFFEE_JOIN_IMAGES[0];
    } else if (norm.includes("smoke") || norm.includes("cigarette") || norm.includes("sutta")) {
      return SMOKE_JOIN_IMAGES[0];
    } else if (norm.includes("food") || norm.includes("biryani") || norm.includes("eat")) {
      return FOOD_JOIN_IMAGES[0];
    } else if (norm.includes("walk") || norm.includes("fitness")) {
      return WALK_JOIN_IMAGES[0];
    } else {
      const randIdx = Math.floor(Math.random() * CHAI_JOIN_IMAGES.length);
      return CHAI_JOIN_IMAGES[randIdx];
    }
  };

  useEffect(() => {
    if (visible) {
      const initialCat = (data?.category || "chai").toLowerCase();
      setActiveCategory(initialCat);
      setActiveLocation(data?.location || "CHAYOS, GALLERIA");
      setActiveTime(data?.time || "6 PM TODAY");
      setShuffledImage(pickStickerForCategory(initialCat));
    }
  }, [visible, data]);

  // Vibe Display Word in headline
  const vibeWord = useMemo(() => {
    const norm = activeCategory.toLowerCase();
    if (norm.includes("chai") || norm.includes("tea")) return "chai?";
    if (norm.includes("beer")) return "beer?";
    if (norm.includes("coffee")) return "coffee?";
    if (norm.includes("smoke") || norm.includes("cigarette")) return "smoke?";
    if (norm.includes("biryani")) return "biryani?";
    if (norm.includes("food")) return "food?";
    if (norm.includes("walk")) return "walk?";
    return `${activeCategory}?`;
  }, [activeCategory]);

  const handleJoinPress = async () => {
    if (data?.planId && !String(data.planId).startsWith("dummy")) {
      try {
        await api.respondToInvite(data.planId, "accepted");
      } catch (err) {
        console.warn("[HangoutInviteModal] respondToInvite error:", err);
      }
    }
    if (onJoin) {
      onJoin();
    } else {
      Alert.alert(
        "Hangout Accepted! 🎉",
        `You're in! ${senderName} will be waiting at ${activeLocation} around ${activeTime}.`,
        [{ text: "Awesome!", onPress: onClose }]
      );
    }
  };

  const handleCounterPress = async (counterItem: "cigarette" | "food" | "drinks") => {
    let cName = "Chai";
    let cEmoji = "☕";
    if (counterItem === "cigarette") {
      setActiveCategory("smoke");
      setShuffledImage(SMOKE_JOIN_IMAGES[0]);
      setActiveLocation("TAPRI, GALLERIA");
      setActiveTime("6 PM TODAY");
      cName = "Smoke";
      cEmoji = "🚬";
    } else if (counterItem === "food") {
      setActiveCategory("biryani");
      setShuffledImage(FOOD_JOIN_IMAGES[0]);
      setActiveLocation("BEHROUZ BIRYANI, GALLERIA");
      setActiveTime("8 PM TODAY");
      cName = "Biryani";
      cEmoji = "🍛";
    } else if (counterItem === "drinks") {
      setActiveCategory("beer");
      setShuffledImage(BEER_JOIN_IMAGES[0]);
      setActiveLocation("THE BEER CAFE, GALLERIA");
      setActiveTime("7 PM TODAY");
      cName = "Beer";
      cEmoji = "🍺";
    }

    if (data?.planId && !String(data.planId).startsWith("dummy")) {
      try {
        await api.respondToInvite(data.planId, "counter", {
          activityName: cName,
          activityEmoji: cEmoji,
        });
      } catch (err) {
        console.warn("[HangoutInviteModal] counter error:", err);
      }
    }

    if (onCounter) {
      onCounter(counterItem);
    }
  };

  // Allow clicking center sticker to re-shuffle if it's chai
  const handleStickerTap = () => {
    if (activeCategory.includes("chai") || activeCategory.includes("tea")) {
      const randIdx = Math.floor(Math.random() * CHAI_JOIN_IMAGES.length);
      setShuffledImage(CHAI_JOIN_IMAGES[randIdx]);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlayRoot}>
        {/* Dimmed backdrop */}
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(180)}
          style={styles.backdrop}
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>

        {/* Back Button on top left (matching screenshot) */}
        <View style={[styles.topNavRow, { top: Math.max(insets.top, 16) + 4 }]}>
          <Pressable onPress={onClose} style={styles.backCircleBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Connected Bottom Sheet - Smooth cubic ease-out, balanced height */}
        <Animated.View
          entering={SlideInDown.duration(260).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutDown.duration(200).easing(Easing.in(Easing.cubic))}
          style={[
            styles.cardSheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 10 },
          ]}
        >
          {/* Top Handle Bar */}
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Header Row: Avatar + Title + Close */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.senderWrap}>
              <Image source={{ uri: senderAvatar }} style={styles.senderAvatar} />
              <Text style={styles.senderTitle}>{senderName} wants to hang</Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Center Category Meme Sticker (Shuffled) */}
          <Pressable onPress={handleStickerTap} style={styles.stickerWrap}>
            <Image
              source={shuffledImage}
              style={styles.stickerImg}
              resizeMode="contain"
            />
          </Pressable>

          {/* Headline: Down for a <vibe>? */}
          <View style={styles.headlineWrap}>
            <Text style={styles.headlineText}>
              Down for a <Text style={styles.headlineHighlight}>{vibeWord}</Text>
            </Text>
            <Text style={styles.subDetailText}>
              {activeLocation.toUpperCase()} {activeTime.toUpperCase()}
            </Text>
          </View>

          {/* Primary CTA Button: ➤ Join the hang */}
          <Pressable
            onPress={handleJoinPress}
            style={({ pressed }) => [
              styles.joinBtnWrap,
              pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
            ]}
          >
            <LinearGradient
              colors={["#D4F72C", "#10E5C9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinBtnGrad}
            >
              <Ionicons name="navigate" size={18} color="#070A14" style={styles.joinIcon} />
              <Text style={styles.joinBtnText}>Join the hang</Text>
            </LinearGradient>
          </Pressable>

          {/* Divider: ── not feeling it? counter with — ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>not feeling it? counter with —</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Counter Options (3 Cards matching screenshot) */}
          <View style={styles.counterRow}>
            {/* 1. Cigarette */}
            <Pressable
              onPress={() => handleCounterPress("cigarette")}
              style={({ pressed }) => [
                styles.counterCard,
                { borderColor: "#D4F72C" },
                activeCategory.includes("smoke") && styles.counterCardActive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={styles.counterIconWrap}>
                <CigaretteGraphic />
              </View>
              <Text style={styles.counterLabel}>cigarette</Text>
            </Pressable>

            {/* 2. Food */}
            <Pressable
              onPress={() => handleCounterPress("food")}
              style={({ pressed }) => [
                styles.counterCard,
                { borderColor: "#C026D3" },
                (activeCategory.includes("food") || activeCategory.includes("biryani")) &&
                  styles.counterCardActive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={styles.counterIconWrap}>
                <Text style={styles.emojiIconText}>🍕</Text>
              </View>
              <Text style={styles.counterLabel}>food</Text>
            </Pressable>

            {/* 3. Drinks */}
            <Pressable
              onPress={() => handleCounterPress("drinks")}
              style={({ pressed }) => [
                styles.counterCard,
                { borderColor: "#06B6D4" },
                (activeCategory.includes("beer") || activeCategory.includes("drink")) &&
                  styles.counterCardActive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={styles.counterIconWrap}>
                <Text style={styles.emojiIconText}>🍸</Text>
              </View>
              <Text style={styles.counterLabel}>drinks</Text>
            </Pressable>
          </View>

          {/* Bottom dismiss link */}
          <Pressable onPress={onClose} style={styles.dismissLinkWrap} hitSlop={10}>
            <Text style={styles.dismissLinkText}>Not right now</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  topNavRow: {
    position: "absolute",
    left: 20,
    zIndex: 10,
  },
  backCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Connected Bottom Sheet (Edge-to-Edge) ──
  cardSheet: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: "#0A0F1D",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    paddingTop: 4,
    paddingHorizontal: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  sheetHandleWrap: {
    width: "100%",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 8,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  senderWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  senderAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: "#10E5C9",
  },
  senderTitle: {
    fontSize: 15.5,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Sticker Center ──
  stickerWrap: {
    width: "100%",
    height: 175,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  stickerImg: {
    width: 200,
    height: 165,
  },

  // ── Headline & Details ──
  headlineWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headlineText: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  headlineHighlight: {
    color: "#E2F832",
    fontFamily: VibeFonts.extraBold,
  },
  subDetailText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#22C55E",
    letterSpacing: 0.7,
    marginTop: 3,
    textAlign: "center",
  },

  // ── Action Join Button ──
  joinBtnWrap: {
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#D4F72C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 13,
  },
  joinBtnGrad: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13.5,
    borderRadius: 999,
  },
  joinIcon: {
    transform: [{ rotate: "45deg" }],
  },
  joinBtnText: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#070A14",
    letterSpacing: -0.2,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dividerText: {
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },

  // ── Counter Options ──
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 9,
    marginBottom: 12,
  },
  counterCard: {
    flex: 1,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#0B1220",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  counterCardActive: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    transform: [{ scale: 1.03 }],
  },
  counterIconWrap: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiIconText: {
    fontSize: 23,
  },
  counterLabel: {
    fontSize: 11.5,
    fontFamily: VibeFonts.semiBold,
    color: "#E2E8F0",
  },

  // ── Cigarette Graphic Styles ──
  cigWrapper: {
    width: 32,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  cigSmoke: {
    position: "absolute",
    top: -2,
    right: 3,
    opacity: 0.6,
  },
  cigSmokeText: {
    fontSize: 9.5,
    color: "#94A3B8",
    transform: [{ rotate: "85deg" }],
  },
  cigStick: {
    width: 28,
    height: 5.5,
    borderRadius: 2.75,
    flexDirection: "row",
    overflow: "hidden",
    transform: [{ rotate: "-32deg" }],
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.3)",
    backgroundColor: "#FFFFFF",
  },
  cigFilter: {
    width: 8.5,
    height: "100%",
    backgroundColor: "#D97706",
  },
  cigBody: {
    flex: 1,
    height: "100%",
    backgroundColor: "#F8FAFC",
  },
  cigEmber: {
    width: 2.5,
    height: "100%",
    backgroundColor: "#EF4444",
  },

  // ── Dismiss Link ──
  dismissLinkWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
  },
  dismissLinkText: {
    fontSize: 12.5,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
  },
});
