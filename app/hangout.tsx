import { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlans } from "../context/PlansContext";
import { useAuth } from "../context/AuthContext";
import { VibeFonts } from "../constants/vibeTheme";
import { formatFriendlyPlanWhen } from "../constants/plans";
import TabBar from "../components/TabBar";
import HomeHeader from "../components/HomeHeader";

/**
 * Figma Hangout page 01 (node 112:31)
 * Dark navy + yellow CTA + blue Join + upcoming cards + vibe tiles.
 */

const { width: W, height: H } = Dimensions.get("window");

const BG = "#010103";
const CARD = "#12182A";
const YELLOW = "#F5C518";
const BLUE = "#2F6BFF";
const MUTED = "rgba(255,255,255,0.55)";

const coffeeIcon = require("../assets/icons/coffee.png");
const beerIcon = require("../assets/icons/beer.png");
const movieIcon = require("../assets/icons/movie.png");

const bgSpotlight = require("../assets/onboarding/bg-spotlight.png");
const cactusHero = require("../assets/hangout/cactus-hero.png");
const cactusCreate = require("../assets/hangout/cactus-create.png");

const MOCK_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
];

const DEMO_PLANS = [
  {
    id: "demo-coffee",
    title: "Coffee & Chill ☕",
    activity: "Coffee",
    imageUrl:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&h=400&fit=crop",
    scheduledAt: null,
    timeLabel: "Today, 5:30 PM",
    location: "Park Street, Kolkata",
    going: 4,
    badge: "Host picks",
    badgeColor: "#22C55E",
  },
  {
    id: "demo-taco",
    title: "Taco Night 🌮",
    activity: "Food",
    imageUrl:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop",
    scheduledAt: null,
    timeLabel: "Tonight, 8:00 PM",
    location: "Salt Lake, Kolkata",
    going: 6,
    badge: "Tonight",
    badgeColor: "#F97316",
  },
  {
    id: "demo-movie",
    title: "Movie Night 🎬",
    activity: "Movie",
    imageUrl:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop",
    scheduledAt: null,
    timeLabel: "Mar 10, 7:00 PM",
    location: "City Center",
    going: 3,
    badge: "Mar 10",
    badgeColor: "#8B5CF6",
  },
];

const VIBE_TILES = [
  {
    id: "coffee",
    label: "Coffee",
    emoji: "☕",
    iconImg: coffeeIcon,
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop",
    tint: "rgba(120, 53, 15, 0.45)",
  },
  {
    id: "travel",
    label: "Travel",
    emoji: "✈️",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a1093801?w=400&h=400&fit=crop",
    tint: "rgba(3, 105, 161, 0.45)",
  },
  {
    id: "food",
    label: "Food",
    emoji: "🍔",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
    tint: "rgba(154, 52, 18, 0.45)",
  },
  {
    id: "beer",
    label: "Beer",
    emoji: "🍺",
    iconImg: beerIcon,
    image:
      "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop",
    tint: "rgba(133, 77, 14, 0.5)",
  },
  {
    id: "movie",
    label: "Movie",
    emoji: "🎬",
    iconImg: movieIcon,
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=400&fit=crop",
    tint: "rgba(67, 56, 202, 0.5)",
  },
  {
    id: "gaming",
    label: "Gaming",
    emoji: "🎮",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop",
    tint: "rgba(6, 95, 70, 0.5)",
  },
  {
    id: "drive",
    label: "Drive",
    emoji: "🚗",
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop",
    tint: "rgba(30, 64, 175, 0.5)",
  },
  {
    id: "drinks",
    label: "Cocktails",
    emoji: "🍸",
    image:
      "https://images.unsplash.com/photo-1514362545857-3bc16549766b?w=400&h=400&fit=crop",
    tint: "rgba(157, 23, 77, 0.5)",
  },
];

function activityMeta(title?: string, activity?: string) {
  const n = `${title || ""} ${activity || ""}`.toLowerCase();
  if (n.includes("coffee") || n.includes("cafe")) return { emoji: "☕", label: "Coffee" };
  if (n.includes("taco") || n.includes("food") || n.includes("dinner") || n.includes("lunch"))
    return { emoji: "🌮", label: "Food" };
  if (n.includes("movie") || n.includes("film") || n.includes("cinema"))
    return { emoji: "🎬", label: "Movie" };
  if (n.includes("beer") || n.includes("drink")) return { emoji: "🍺", label: "Drinks" };
  if (n.includes("travel") || n.includes("trip")) return { emoji: "✈️", label: "Travel" };
  return { emoji: "✨", label: "Hangout" };
}

function PointsMarquee() {
  const x = useRef(new Animated.Value(0)).current;
  const text =
    "Earn Points  ✱  Complete The Tasks And Earn Points  ✱  Earn Points  ✱  Complete The Tasks And Earn Points  ✱  ";

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: -280,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [x]);

  return (
    <View style={styles.marqueeWrap}>
      <Animated.Text
        numberOfLines={1}
        style={[styles.marqueeText, { transform: [{ translateX: x }] }]}
      >
        {text}
        {text}
      </Animated.Text>
    </View>
  );
}

export default function HangoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { myPlans, nearbyPlans, joinPlan, getRequestStatus, refresh } = usePlans();

  const [joinTargetId, setJoinTargetId] = useState<string | null>(null);
  const [joinRemark, setJoinRemark] = useState("");
  const [joinSending, setJoinSending] = useState(false);

  const firstName = String(user?.name || "there").split(" ")[0];
  const avatarUri =
    (user as any)?.avatarUrl ||
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop";

  const upcoming = useMemo(() => {
    const mineIds = new Set(myPlans.map((p) => p.id));
    const real = [...nearbyPlans, ...myPlans]
      .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
      .filter((p) => p.status !== "CANCELLED" && p.status !== "COMPLETED")
      .filter((p) => !mineIds.has(p.id) || true)
      .slice(0, 10)
      .map((p) => ({
        ...p,
        badge: p.creatorId === user?.id ? "My plan" : "Host picks",
        badgeColor: p.creatorId === user?.id ? "#3B82F6" : "#22C55E",
        going: p.going || p.participants?.length || 1,
      }));
    if (real.length > 0) return real;
    return DEMO_PLANS;
  }, [nearbyPlans, myPlans, user?.id]);

  const submitJoinRequest = async () => {
    if (!joinTargetId || joinSending) return;
    if (String(joinTargetId).startsWith("demo-")) {
      setJoinTargetId(null);
      Alert.alert("Demo plan", "Create or join a real hangout to send requests.");
      return;
    }
    setJoinSending(true);
    try {
      await joinPlan(joinTargetId, joinRemark.trim() || undefined);
      setJoinTargetId(null);
      setJoinRemark("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Request failed");
    } finally {
      setJoinSending(false);
    }
  };

  const openPlan = (plan: any) => {
    if (String(plan.id).startsWith("demo-")) {
      router.push("/create-plan");
      return;
    }
    router.push({ pathname: "/plan-details", params: { id: plan.id } });
  };

  const onJoin = (plan: any) => {
    if (String(plan.id).startsWith("demo-")) {
      router.push("/create-plan");
      return;
    }
    const status = getRequestStatus?.(plan.id);
    if (status === "PENDING" || status === "APPROVED") {
      openPlan(plan);
      return;
    }
    setJoinTargetId(plan.id);
    setJoinRemark("");
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <View style={styles.bgFill} />
      <Image source={bgSpotlight} style={styles.bgImage} resizeMode="cover" />

      {/* Header */}
      <HomeHeader showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 10,
          paddingBottom: 120 + insets.bottom,
        }}
      >

        {/* Let's Hangout hero */}
        <Pressable
          style={styles.heroCard}
          onPress={() => router.push("/create-plan")}
        >
          <LinearGradient
            colors={["#1A1030", "#0E1528", "#12101F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroInner}
          >
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>
                Let's{"\n"}Hangout
              </Text>
              <View style={styles.yellowBtn}>
                <Ionicons name="sparkles" size={12} color="#111" />
                <Text style={styles.yellowBtnText}>Let's Do It</Text>
              </View>
            </View>
            <Image source={cactusHero} style={styles.heroCactus} resizeMode="contain" />
          </LinearGradient>
          <PointsMarquee />
        </Pressable>

        {/* Upcoming */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>✨ See Upcoming Hangouts</Text>
          <Pressable onPress={refresh} hitSlop={10}>
            <Ionicons name="refresh" size={16} color={MUTED} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.upcomingRow}
        >
          {upcoming.map((plan: any) => (
            <UpcomingCard
              key={plan.id}
              plan={plan}
              onPress={() => openPlan(plan)}
              onJoin={() => onJoin(plan)}
            />
          ))}
        </ScrollView>

        {/* Vibes — 2 rows × 4 */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>✨ What's your vibe today?</Text>
        </View>

        <View style={styles.vibeGrid}>
          {VIBE_TILES.map((v) => (
            <Pressable
              key={v.id}
              style={styles.vibeTile}
              onPress={() =>
                router.push({
                  pathname: "/create-plan",
                  params: { activity: v.label },
                })
              }
            >
              <Image source={{ uri: v.image }} style={styles.vibeImg} />
              <View style={[styles.vibeTint, { backgroundColor: v.tint }]} />
              <View style={styles.vibeIconBubble}>
                {v.iconImg ? (
                  <Image source={v.iconImg} style={{ width: 14, height: 14 }} resizeMode="contain" />
                ) : (
                  <Text style={{ fontSize: 11 }}>{v.emoji}</Text>
                )}
              </View>
              <Text style={styles.vibeLabel}>{v.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Create banner */}
        <Pressable
          style={styles.createCard}
          onPress={() => router.push("/create-plan")}
        >
          <LinearGradient
            colors={["#1B1233", "#120E22", "#0C0A18"]}
            style={styles.createInner}
          >
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.createTitle}>Create a Hangout</Text>
              <Text style={styles.createSub}>
                Plan, Invite &{" "}
                <Text style={{ color: YELLOW }}>Make Memories</Text>
              </Text>
              <View style={[styles.yellowBtn, { marginTop: 14, alignSelf: "flex-start" }]}>
                <Ionicons name="sparkles" size={12} color="#111" />
                <Text style={styles.yellowBtnText}>Create a Hangout</Text>
              </View>
            </View>
            <Image source={cactusCreate} style={styles.createCactus} resizeMode="contain" />
          </LinearGradient>
        </Pressable>
      </ScrollView>

      <Modal
        visible={!!joinTargetId}
        transparent
        animationType="fade"
        onRequestClose={() => !joinSending && setJoinTargetId(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !joinSending && setJoinTargetId(null)}
        >
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Request to join</Text>
            <Text style={styles.modalSub}>
              Add a short note the host can read (optional)
            </Text>
            <TextInput
              style={styles.modalInput}
              value={joinRemark}
              onChangeText={setJoinRemark}
              placeholder="e.g. I can bring snacks · free after 7"
              placeholderTextColor="rgba(255,255,255,0.35)"
              multiline
              maxLength={160}
              editable={!joinSending}
            />
            <Pressable
              style={[styles.modalBtn, joinSending && { opacity: 0.7 }]}
              onPress={submitJoinRequest}
              disabled={joinSending}
            >
              {joinSending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalBtnText}>Send request</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => setJoinTargetId(null)}
              disabled={joinSending}
              style={{ alignItems: "center", paddingTop: 10 }}
            >
              <Text style={{ color: MUTED, fontFamily: VibeFonts.medium }}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <TabBar dark />
    </View>
  );
}

function UpcomingCard({
  plan,
  onPress,
  onJoin,
}: {
  plan: any;
  onPress: () => void;
  onJoin: () => void;
}) {
  const meta = activityMeta(plan.title, plan.activity);
  const whenText =
    plan.timeLabel ||
    formatFriendlyPlanWhen({
      scheduledAt: plan.scheduledAt,
      timeLabel: plan.timeLabel,
      time: plan.time,
    });
  const going = plan.going || plan.participants?.length || 1;
  const avatars = (plan.participants || [])
    .map((p: any) => p.avatarUrl)
    .filter(Boolean)
    .slice(0, 3);
  const showAvatars = avatars.length > 0 ? avatars : MOCK_AVATARS.slice(0, 3);

  return (
    <Pressable onPress={onPress} style={styles.upCard}>
      <View style={styles.upImageWrap}>
        <Image
          source={{
            uri:
              plan.imageUrl ||
              "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&h=400&fit=crop",
          }}
          style={styles.upImage}
        />
        <View
          style={[
            styles.upBadge,
            { backgroundColor: plan.badgeColor || "#22C55E" },
          ]}
        >
          <Text style={styles.upBadgeText}>{plan.badge || "Host picks"}</Text>
        </View>
        <View style={styles.upAvatars}>
          {showAvatars.map((uri: string, i: number) => (
            <Image
              key={`${uri}-${i}`}
              source={{ uri }}
              style={[styles.upAvatar, { marginLeft: i === 0 ? 0 : -8 }]}
            />
          ))}
        </View>
      </View>

      <View style={styles.upBody}>
        <View style={styles.upCatRow}>
          <Text style={styles.upCatEmoji}>{meta.emoji}</Text>
          <Text style={styles.upCatLabel}>{meta.label}</Text>
        </View>
        <Text style={styles.upTitle} numberOfLines={1}>
          {plan.title || "Hangout"}
        </Text>
        <View style={styles.upMetaRow}>
          <Ionicons name="time-outline" size={11} color={MUTED} />
          <Text style={styles.upMetaText} numberOfLines={1}>
            {whenText}
          </Text>
        </View>
        <View style={styles.upMetaRow}>
          <Ionicons name="location-outline" size={11} color={MUTED} />
          <Text style={styles.upMetaText} numberOfLines={1}>
            {plan.location || "Nearby"}
          </Text>
        </View>
        <View style={styles.upFooter}>
          <Text style={styles.goingText}>{going} Going</Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onJoin();
            }}
            style={styles.joinBtn}
          >
            <Text style={styles.joinBtnText}>Join</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const CARD_W = Math.min(158, W * 0.4);
const VIBE_GAP = 8;
const VIBE_PAD = 16;
const VIBE_TILE_W = (W - VIBE_PAD * 2 - VIBE_GAP * 3) / 4;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  bgFill: { ...StyleSheet.absoluteFillObject, backgroundColor: BG },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: W,
    height: H,
    opacity: 0.85,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 16,
    gap: 10,
  },
  hi: {
    fontSize: 26,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  sub: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: VibeFonts.regular,
    color: MUTED,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },

  heroCard: {
    marginHorizontal: 16,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  heroInner: {
    minHeight: 148,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 4,
    paddingTop: 14,
    paddingBottom: 10,
  },
  heroCopy: { flex: 1, zIndex: 2 },
  heroTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.6,
  },
  heroCactus: {
    width: 140,
    height: 140,
    marginRight: -8,
  },
  yellowBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: YELLOW,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  yellowBtnText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#111111",
  },
  marqueeWrap: {
    backgroundColor: YELLOW,
    height: 28,
    justifyContent: "center",
    overflow: "hidden",
  },
  marqueeText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#111",
    width: 900,
  },

  sectionHead: {
    marginTop: 22,
    marginBottom: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },

  upcomingRow: {
    paddingHorizontal: 16,
    gap: 10,
  },
  upCard: {
    width: CARD_W,
    borderRadius: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  upImageWrap: {
    height: 78,
    backgroundColor: "#0B1020",
  },
  upImage: { width: "100%", height: "100%" },
  upBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  upBadgeText: {
    fontSize: 8,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
  },
  upAvatars: {
    position: "absolute",
    bottom: 5,
    left: 6,
    flexDirection: "row",
  },
  upAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CARD,
  },
  upBody: { padding: 8 },
  upCatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 2,
  },
  upCatEmoji: { fontSize: 10 },
  upCatLabel: {
    fontSize: 9,
    fontFamily: VibeFonts.medium,
    color: MUTED,
  },
  upTitle: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
    marginBottom: 4,
  },
  upMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 2,
  },
  upMetaText: {
    flex: 1,
    fontSize: 9,
    fontFamily: VibeFonts.regular,
    color: MUTED,
  },
  upFooter: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  goingText: {
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
    color: "#FFF",
  },
  joinBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  joinBtnText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
  },

  vibeGrid: {
    paddingHorizontal: VIBE_PAD,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: VIBE_GAP,
  },
  vibeTile: {
    width: VIBE_TILE_W,
    height: VIBE_TILE_W * 1.05,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  vibeImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  vibeTint: {
    ...StyleSheet.absoluteFillObject,
  },
  vibeIconBubble: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  vibeLabel: {
    marginBottom: 8,
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
  },

  createCard: {
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  createInner: {
    minHeight: 140,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingVertical: 16,
    paddingRight: 4,
  },
  createTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
  },
  createSub: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: VibeFonts.regular,
    color: MUTED,
  },
  createCactus: {
    width: 120,
    height: 120,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#151A2C",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.bold,
    color: "#FFF",
  },
  modalSub: {
    marginTop: 6,
    marginBottom: 14,
    fontSize: 13,
    fontFamily: VibeFonts.regular,
    color: MUTED,
  },
  modalInput: {
    minHeight: 80,
    borderRadius: 14,
    backgroundColor: "#0E1322",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 12,
    color: "#FFF",
    fontFamily: VibeFonts.regular,
    textAlignVertical: "top",
  },
  modalBtn: {
    marginTop: 14,
    backgroundColor: BLUE,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  modalBtnText: {
    color: "#FFF",
    fontFamily: VibeFonts.bold,
    fontSize: 15,
  },
});
