import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  Image,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import { VibeFonts } from "../../constants/vibeTheme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W * 0.84, 340);
const CARD_GAP = 14;
const SIDE_PAD = (SCREEN_W - CARD_W) / 2;

export type DiscoverMode = "friends" | "dating" | "everyone";

export type VibeGateCard = {
  id: string;
  title: string;
  reason: string;
  reasonIcon: keyof typeof Ionicons.glyphMap;
  bg: string;
  ink: string;
  accentShape: string;
  /** Deep ambient wash behind the card (matches reference screenshots) */
  ambient: string;
  ambientMid: string;
  titleColor: string;
  images: string[];
  mode: DiscoverMode;
};

export const VIBE_GATE_CARDS: VibeGateCard[] = [
  {
    id: "new",
    title: "New profiles",
    reason: "Because they just signed up",
    reasonIcon: "people",
    bg: "#C4B5FD",
    ink: "#18181B",
    accentShape: "rgba(109,40,217,0.18)",
    ambient: "#2A1B4A",
    ambientMid: "#1A1230",
    titleColor: "#E9D5FF",
    images: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop",
    ],
    mode: "everyone",
  },
  {
    id: "sport",
    title: "Sport Zone",
    reason: "Because you like: Swimming",
    reasonIcon: "heart",
    bg: "#FDBA74",
    ink: "#18181B",
    accentShape: "rgba(234,88,12,0.2)",
    ambient: "#3D2414",
    ambientMid: "#1F140C",
    titleColor: "#FDBA74",
    images: [
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1461896836934-ffe607ba6851?w=400&h=500&fit=crop",
    ],
    mode: "friends",
  },
  {
    id: "sunday",
    title: "Sunday Vibes",
    reason: "Because you like: Bike rides",
    reasonIcon: "heart",
    bg: "#F4F4F5",
    ink: "#18181B",
    accentShape: "rgba(113,113,122,0.12)",
    ambient: "#2A2A30",
    ambientMid: "#141418",
    titleColor: "#F4F4F5",
    images: [
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=500&fit=crop",
    ],
    mode: "dating",
  },
  {
    id: "coffee",
    title: "Coffee Crew",
    reason: "Because you like: Coffee",
    reasonIcon: "heart",
    bg: "#E8D5C4",
    ink: "#18181B",
    accentShape: "rgba(120,53,15,0.15)",
    ambient: "#3A2A1C",
    ambientMid: "#1C150F",
    titleColor: "#E8D5C4",
    images: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1442512595331-e89e7383991d?w=400&h=500&fit=crop",
    ],
    mode: "dating",
  },
  {
    id: "nightlife",
    title: "Night Out",
    reason: "Because you like: Drinks",
    reasonIcon: "heart",
    bg: "#F9A8D4",
    ink: "#18181B",
    accentShape: "rgba(190,24,93,0.18)",
    ambient: "#3A1528",
    ambientMid: "#1A0C14",
    titleColor: "#F9A8D4",
    images: [
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=400&h=500&fit=crop",
    ],
    mode: "dating",
  },
];

type Props = {
  badgeCount?: number;
  onSeeProfiles: (card: VibeGateCard) => void;
};

export default function DiscoverVibesGate({ badgeCount = 0, onSeeProfiles }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const { user } = useAuth();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const progress = useSharedValue(0);

  const active = VIBE_GATE_CARDS[index] || VIBE_GATE_CARDS[0];
  const cardH = Math.min(SCREEN_H * 0.62, 540);

  useEffect(() => {
    progress.value = withTiming(index, { duration: 380 });
  }, [index]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / (CARD_W + CARD_GAP));
    if (next !== index && next >= 0 && next < VIBE_GATE_CARDS.length) {
      setIndex(next);
    }
  };

  const titleAnim = useAnimatedStyle(() => {
    const input = VIBE_GATE_CARDS.map((_, i) => i);
    return {
      color: interpolateColor(
        progress.value,
        input,
        VIBE_GATE_CARDS.map((c) => c.titleColor)
      ),
    };
  });

  return (
    <View style={styles.root}>
      {/* Card-matched ambient background + soft color shadow */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={[active.ambient, active.ambientMid, "#070A14"]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[`${active.bg}55`, `${active.bg}18`, "transparent"]}
          locations={[0, 0.35, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.colorWash}
        />
        <View
          style={[
            styles.glowOrb,
            {
              backgroundColor: active.bg,
              shadowColor: active.bg,
            },
          ]}
        />
        <View
          style={[
            styles.glowOrbBottom,
            {
              backgroundColor: active.bg,
              shadowColor: active.bg,
            },
          ]}
        />
      </View>

      <View style={[styles.foreground, { paddingTop: insets.top + 6 }]}>
        {/* Header — menu + Hangora + bell + avatar */}
        <Animated.View entering={FadeIn.duration(320)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.menuBtn} onPress={openSidebar}>
              <Ionicons name="menu-outline" size={22} color="#F4F6FB" />
            </Pressable>
            <View>
              <View style={styles.brandRow}>
                <Text style={styles.brandHang}>Hang</Text>
                <Text style={styles.brandOra}>ora</Text>
              </View>
              <Text style={styles.headerTag}>Vibes · Discover people</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              style={styles.bellBtn}
              onPress={() => router.push("/(tabs)/chats")}
              hitSlop={8}
            >
              <Ionicons name="notifications-outline" size={20} color="#F4F6FB" />
              {badgeCount > 0 && (
                <View style={styles.bellDot}>
                  <Text style={styles.bellDotText}>
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => router.push("/(tabs)/profile")} hitSlop={8}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Ionicons name="person" size={16} color="#A7B0C4" />
                </View>
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* Vibes title + reason */}
        <Animated.View entering={FadeIn.delay(60).duration(420)} style={styles.titleBlock}>
          <Animated.Text style={[styles.vibesTitle, titleAnim]}>Vibes</Animated.Text>
          <View
            style={[
              styles.reasonPill,
              { borderColor: `${active.bg}44`, backgroundColor: "rgba(0,0,0,0.28)" },
            ]}
          >
            <Ionicons
              name={active.reasonIcon}
              size={13}
              color={active.bg}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.reasonText} numberOfLines={1}>
              {active.reason}
            </Text>
          </View>
        </Animated.View>

        {/* Carousel */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(420)}
          style={styles.carouselWrap}
        >
          <FlatList
            ref={listRef}
            data={VIBE_GATE_CARDS}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W + CARD_GAP}
            decelerationRate="fast"
            style={{ flexGrow: 0, height: cardH }}
            contentContainerStyle={{
              paddingHorizontal: SIDE_PAD,
              alignItems: "flex-start",
            }}
            ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderItem={({ item, index: i }) => {
              const focused = i === index;
              return (
                <View
                  style={[
                    styles.card,
                    {
                      width: CARD_W,
                      height: cardH,
                      backgroundColor: item.bg,
                      shadowColor: item.bg,
                      opacity: focused ? 1 : 0.88,
                      transform: [{ scale: focused ? 1 : 0.96 }],
                    },
                  ]}
                >
                  <View style={[styles.cardBlob, { backgroundColor: item.accentShape }]} />
                  <View style={[styles.cardBlob2, { backgroundColor: item.accentShape }]} />

                  <View style={styles.cardArt}>
                    {item.images.map((uri, imgI) => (
                      <Image
                        key={`${item.id}-${imgI}`}
                        source={{ uri }}
                        style={[
                          styles.cardArtImg,
                          imgI === 0 && styles.artLeft,
                          imgI === 1 && styles.artCenter,
                          imgI === 2 && styles.artRight,
                        ]}
                        resizeMode="cover"
                      />
                    ))}
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={[styles.cardTitle, { color: item.ink }]}>{item.title}</Text>
                    <Pressable style={styles.seeBtn} onPress={() => onSeeProfiles(item)}>
                      <Text style={styles.seeBtnText}>See profiles</Text>
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />

          <View style={styles.dots}>
            {VIBE_GATE_CARDS.map((c, i) => (
              <View
                key={c.id}
                style={[
                  styles.dot,
                  i === index && [styles.dotActive, { backgroundColor: active.bg }],
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070A14",
  },
  foreground: {
    flex: 1,
    zIndex: 1,
  },
  colorWash: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOrb: {
    position: "absolute",
    top: SCREEN_H * 0.12,
    alignSelf: "center",
    left: SCREEN_W * 0.15,
    width: SCREEN_W * 0.7,
    height: SCREEN_W * 0.7,
    borderRadius: SCREEN_W * 0.35,
    opacity: 0.22,
    shadowOpacity: 0.7,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  brandHang: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  brandOra: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: "#C9A227",
    letterSpacing: -1,
  },
  headerTag: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.5)",
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E11D48",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#070A14",
  },
  bellDotText: {
    color: "#FFF",
    fontSize: 8,
    fontFamily: VibeFonts.bold,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  avatarFallback: {
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 10,
    paddingHorizontal: 24,
  },
  vibesTitle: {
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.2,
    fontFamily: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: VibeFonts.extraBold,
    }),
    fontWeight: Platform.OS === "ios" ? "600" : undefined,
    marginBottom: 8,
    textAlign: "center",
  },
  reasonPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    maxWidth: "92%",
    borderWidth: 1,
  },
  reasonText: {
    color: "#F4F6FB",
    fontSize: 13,
    fontFamily: VibeFonts.medium,
  },
  carouselWrap: {
    flexGrow: 0,
    justifyContent: "flex-start",
    paddingBottom: 8,
  },
  card: {
    borderRadius: 28,
    overflow: "hidden",
    paddingTop: 20,
    paddingBottom: 22,
    paddingHorizontal: 22,
    justifyContent: "space-between",
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 16,
  },
  cardBlob: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -30,
    right: -40,
  },
  cardBlob2: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    bottom: 100,
    left: -30,
  },
  cardArt: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  cardArtImg: {
    width: 96,
    height: 130,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  artLeft: {
    transform: [{ rotate: "-8deg" }, { translateX: 18 }],
    zIndex: 1,
    opacity: 0.92,
  },
  artCenter: {
    width: 112,
    height: 150,
    zIndex: 3,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
  },
  artRight: {
    transform: [{ rotate: "8deg" }, { translateX: -18 }],
    zIndex: 1,
    opacity: 0.92,
  },
  cardFooter: {
    gap: 14,
  },
  cardTitle: {
    fontSize: 28,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.6,
  },
  seeBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#111827",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  seeBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: VibeFonts.bold,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
    marginBottom: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  dotActive: {
    width: 8,
    height: 8,
  },
});
