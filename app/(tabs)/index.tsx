import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import HomeSlideBanner from "../../components/home/HomeSlideBanner";
import SpinTheWheel from "../../components/home/SpinTheWheel";
import OnlineStory from "../../components/home/OnlineStory";
import SpotBeaconModal from "../../components/vibe/SpotBeaconModal";
import CreatePlanFab from "../../components/CreatePlanFab";
import HangoutCinematicBackground from "../../components/vibe/HangoutCinematicBackground";
import AppHeader from "../../components/vibe/AppHeader";
import { useMatches } from "../../context/MatchesContext";
import { usePlans } from "../../context/PlansContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { API_URL } from "../../constants/theme";
import { VibeFonts } from "../../constants/vibeTheme";

const friendsHangout3d = require("../../assets/friends_hangout_3d.png");
const FLUENT_3D = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets";
const BEACON_3D = `${FLUENT_3D}/Satellite%20antenna/3D/satellite_antenna_3d.png`;
const PIN_3D = `${FLUENT_3D}/Round%20pushpin/3D/round_pushpin_3d.png`;

const { width: SCREEN_W } = Dimensions.get("window");

/** Match Hangout — cinematic dark UI */
const T = {
  bg: "#070A14",
  card: "rgba(22, 26, 46, 0.94)",
  ink: "#F4F6FB",
  muted: "#A7B0C4",
  faint: "#7C869C",
  border: "rgba(160, 170, 200, 0.16)",
  purple: "#A78BFA",
  pink: "#F472B6",
  softPurple: "rgba(139, 92, 246, 0.18)",
};

const TONIGHT_VIBES = [
  {
    id: "coffee",
    title: "Coffee",
    emoji: "☕",
    icon: `${FLUENT_3D}/Hot%20beverage/3D/hot_beverage_3d.png`,
  },
  {
    id: "food",
    title: "Foodie",
    emoji: "🍕",
    icon: `${FLUENT_3D}/Pizza/3D/pizza_3d.png`,
  },
  {
    id: "movie",
    title: "Movie",
    emoji: "🍿",
    icon: `${FLUENT_3D}/Clapper%20board/3D/clapper_board_3d.png`,
  },
  {
    id: "sports",
    title: "Sports",
    emoji: "⚽",
    icon: `${FLUENT_3D}/Soccer%20ball/3D/soccer_ball_3d.png`,
  },
  {
    id: "drinks",
    title: "Drinks",
    emoji: "🍸",
    icon: `${FLUENT_3D}/Beer%20mug/3D/beer_mug_3d.png`,
  },
  {
    id: "travel",
    title: "Trip",
    emoji: "✈️",
    icon: `${FLUENT_3D}/Airplane/3D/airplane_3d.png`,
  },
];

function SoftPress({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 140 });
      }}
    >
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}

function BeaconPulseRing() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.55, { duration: 1100, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1100, easing: Easing.out(Easing.ease) }),
        withTiming(0.55, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return <Animated.View style={[styles.beaconPulseRing, style]} />;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deck } = useMatches();
  const { nearbyPlans, myPlans, refresh: refreshPlans } = usePlans();
  const { user } = useAuth();

  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingOnline, setLoadingOnline] = useState(true);
  const [spotModalVisible, setSpotModalVisible] = useState(false);

  const resolveUrl = useCallback((url?: string | null, name?: string) => {
    if (url) {
      if (url.startsWith("/")) return `${API_URL.replace("/api", "")}${url}`;
      return url;
    }
    const label = encodeURIComponent((name || "U").split(" ")[0]);
    return `https://ui-avatars.com/api/?name=${label}&background=7C3AED&color=fff&size=200`;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const users = (await api.getOnlineUsers()) as any;
        if (!alive) return;
        const arr = Array.isArray(users) ? users : users?.users || [];
        setActiveUsers(arr);
      } catch {
        /* ignore */
      } finally {
        if (alive) setLoadingOnline(false);
      }

      try {
        if (user?.id) {
          const projs = (await api.getDiscoverProfiles(user.id, "dating")) as any;
          if (!alive) return;
          setSuggestions(Array.isArray(projs) ? projs.slice(0, 8) : []);
        }
      } catch {
        /* ignore */
      }

      refreshPlans().catch(() => undefined);
    })();
    return () => {
      alive = false;
    };
  }, [user?.id, refreshPlans]);

  const handleVibeSelect = async (v: (typeof TONIGHT_VIBES)[number]) => {
    try {
      await api.updateSocialStatus({
        energy: "LESSGO",
        freeNow: true,
        activity: `${v.emoji} ${v.title}`,
      });
    } catch {
      /* soft fail */
    }
    router.push({
      pathname: "/spot-radar",
      params: {
        venue: `${v.emoji} ${v.title}`,
        vibe: v.title,
        emoji: v.emoji,
        duration: "30",
        activityId: v.id,
      },
    });
  };

  const livePlans = [...nearbyPlans, ...myPlans]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .filter((p) => p.status !== "CANCELLED" && p.status !== "COMPLETED")
    .slice(0, 6);

  const suggested = (suggestions.length > 0 ? suggestions : deck).slice(0, 8);

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <HangoutCinematicBackground />
      <StatusBar barStyle="light-content" backgroundColor="#070A14" />

      <View style={styles.foreground}>
      <AppHeader
        variant="dark"
        tagline="Post & join plans · Real Moves"
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <HomeSlideBanner />

        {/* Pick a vibe tiles — 3 per row */}
        <Animated.View entering={FadeInDown.duration(360)} style={styles.block}>
          <View style={styles.sectionHead}>
            <Text style={styles.pickVibeTitle}>Pick a vibe</Text>
            <Pressable onPress={() => router.push("/hangout")} style={styles.seeAllPill}>
              <Text style={styles.seeAllPillText}>See all</Text>
            </Pressable>
          </View>
          <View style={styles.vibeGrid}>
            {TONIGHT_VIBES.map((v, i) => (
              <Animated.View
                key={v.id}
                entering={FadeInDown.delay(i * 40).duration(280)}
                style={styles.vibeCell}
              >
                <SoftPress onPress={() => handleVibeSelect(v)} style={styles.vibeTile}>
                  <View style={styles.vibeGrad}>
                    <Image source={{ uri: v.icon }} style={styles.vibeIcon} resizeMode="contain" />
                    <Text style={styles.vibeTitle}>{v.title}</Text>
                  </View>
                </SoftPress>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Spin the wheel — when confused what to do */}
        <Animated.View entering={FadeInDown.delay(40).duration(360)}>
          <SpinTheWheel
            onResult={(opt) => {
              handleVibeSelect({
                id: opt.id,
                title: opt.title,
                emoji: opt.emoji,
                icon: "",
              });
            }}
          />
        </Animated.View>

        {/* Beacon + Create plan */}
        <Animated.View entering={FadeInDown.delay(80).duration(360)} style={styles.heroStack}>
          <SoftPress onPress={() => setSpotModalVisible(true)} style={styles.beaconCardWrap}>
            <LinearGradient
              colors={["#9D174D", "#DB2777", "#FB7185"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.beaconCard}
            >
              <View style={styles.beaconDecorBlob} />
              <View style={styles.beaconCopy}>
                <View style={styles.beaconLivePill}>
                  <View style={styles.beaconLiveDot} />
                  <Text style={styles.beaconLiveText}>LIVE NOW</Text>
                </View>
                <Text style={styles.beaconTitle}>Drop a Spot Beacon</Text>
                <Text style={styles.beaconSub} numberOfLines={2}>
                  Friends nearby can find you instantly
                </Text>
                <View style={styles.beaconCta}>
                  <Text style={styles.beaconCtaText}>Broadcast</Text>
                  <Ionicons name="arrow-forward" size={14} color="#9D174D" />
                </View>
              </View>
              <View style={styles.beaconArt} pointerEvents="none">
                <BeaconPulseRing />
                <Image source={{ uri: BEACON_3D }} style={styles.beacon3dMain} resizeMode="contain" />
                <Image source={{ uri: PIN_3D }} style={styles.beacon3dPin} resizeMode="contain" />
              </View>
            </LinearGradient>
          </SoftPress>

          <LinearGradient
            colors={["#312E81", "#6D28D9", "#DB2777"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.planHeroCard}
          >
            <View style={styles.planHeroLeft}>
              <View style={styles.planHeroPill}>
                <Text style={styles.planHeroPillText}>✦ WHAT'S UP</Text>
              </View>
              <Text style={styles.planHeroTitle}>What's the plan{"\n"}today?</Text>
              <Text style={styles.planHeroSub} numberOfLines={2}>
                Create a plan or join people who are free!
              </Text>
              <Pressable onPress={() => router.push("/create-plan")}>
                <View style={styles.planHeroBtn}>
                  <Ionicons name="add" size={16} color="#6D28D9" />
                  <Text style={styles.planHeroBtnText}>Create a Plan</Text>
                </View>
              </Pressable>
            </View>
            <Image source={friendsHangout3d} style={styles.planHeroImage} resizeMode="contain" />
          </LinearGradient>
        </Animated.View>

        {/* Online now */}
        <View style={styles.onlineBlock}>
          <LinearGradient
            colors={["rgba(167,139,250,0.14)", "rgba(244,114,182,0.08)"]}
            style={styles.onlineInner}
          >
            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionPink}>LIVE · ONLINE</Text>
                <Text style={styles.sectionBig}>Who's around?</Text>
              </View>
              <Pressable onPress={() => router.push("/(tabs)/discover")} style={styles.seeAllPill}>
                <Text style={styles.seeAllPillText}>Discover</Text>
              </Pressable>
            </View>
            {loadingOnline ? (
              <ActivityIndicator color={T.pink} style={{ marginVertical: 16 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
                <OnlineStory name="You" isYou index={0} dark onPress={() => setSpotModalVisible(true)} />
                {activeUsers.slice(0, 12).map((u, i) => (
                  <OnlineStory
                    key={u.id || i}
                    name={(u.name || "User").split(" ")[0]}
                    avatarUrl={resolveUrl(u.avatarUrl, u.name)}
                    index={i + 1}
                    dark
                    onPress={() => router.push("/(tabs)/discover")}
                  />
                ))}
                {activeUsers.length === 0 ? (
                  <Text style={styles.emptyInline}>Nobody online yet — start Discover!</Text>
                ) : null}
              </ScrollView>
            )}
          </LinearGradient>
        </View>

        {/* Hangouts */}
        <View style={styles.block}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionPurple}>PLANS NEAR YOU</Text>
              <Text style={styles.sectionBig}>Hangouts</Text>
            </View>
            <Pressable onPress={() => router.push("/hangout")} style={styles.seeAllPill}>
              <Text style={styles.seeAllPillText}>See all</Text>
            </Pressable>
          </View>
          {livePlans.length === 0 ? (
            <SoftPress onPress={() => router.push("/create-plan")} style={styles.emptyPlan}>
              <Image
                source={{ uri: `${FLUENT_3D}/Hot%20beverage/3D/hot_beverage_3d.png` }}
                style={{ width: 48, height: 48 }}
                resizeMode="contain"
              />
              <Text style={styles.emptyPlanTitle}>No plans nearby yet</Text>
              <Text style={styles.emptyPlanSub}>Be first — create something fun tonight ✨</Text>
              <View style={styles.emptyCta}>
                <Text style={styles.emptyCtaText}>Create hangout</Text>
              </View>
            </SoftPress>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.planScroll}>
              {livePlans.map((plan, i) => (
                <Animated.View key={plan.id} entering={FadeInRight.delay(i * 60).duration(300)}>
                  <SoftPress
                    onPress={() => router.push({ pathname: "/plan-details", params: { id: plan.id } })}
                    style={styles.planCard}
                  >
                    <Image
                      source={{
                        uri:
                          plan.imageUrl ||
                          "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400",
                      }}
                      style={styles.planImage}
                    />
                    <LinearGradient colors={["transparent", "rgba(15,23,42,0.92)"]} style={styles.planOverlay}>
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>{plan.timeLabel || plan.badge || "Soon"}</Text>
                      </View>
                      <Text style={styles.planTitle} numberOfLines={2}>
                        {plan.title}
                      </Text>
                      <Text style={styles.planMeta} numberOfLines={1}>
                        {plan.location || plan.destination || "Nearby"}
                        {typeof plan.distance === "number" ? ` · ${Math.round(plan.distance)} km` : ""}
                      </Text>
                    </LinearGradient>
                  </SoftPress>
                </Animated.View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Suggested people */}
        <View style={[styles.block, { marginBottom: 36 }]}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionPink}>FOR YOU</Text>
              <Text style={styles.sectionBig}>People nearby</Text>
            </View>
            <Pressable onPress={() => router.push("/(tabs)/discover")} style={styles.seeAllPillPink}>
              <Text style={styles.seeAllPillPinkText}>Swipe ›</Text>
            </Pressable>
          </View>
          {suggested.length === 0 ? (
            <Text style={styles.emptyInline}>Turn on location to see people near you.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestScroll}>
              {suggested.map((p, i) => (
                <Animated.View key={p.id || i} entering={FadeInRight.delay(i * 50).duration(280)}>
                  <SoftPress onPress={() => router.push("/(tabs)/discover")} style={styles.suggestCard}>
                    <Image
                      source={{ uri: resolveUrl(p.avatarUrl || p.photos?.[0], p.name) }}
                      style={styles.suggestAvatar}
                    />
                    <LinearGradient colors={["transparent", "rgba(88,28,135,0.95)"]} style={styles.suggestOverlay}>
                      <Text style={styles.suggestName} numberOfLines={1}>
                        {p.name}
                        {p.age ? `, ${p.age}` : ""}
                      </Text>
                      <Text style={styles.suggestMeta} numberOfLines={1}>
                        {typeof p.distance === "number" ? `${p.distance} km` : "Nearby"}
                        {p.vibeMatch ? ` · ${p.vibeMatch}%` : ""}
                      </Text>
                    </LinearGradient>
                  </SoftPress>
                </Animated.View>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
      </View>

      <SpotBeaconModal visible={spotModalVisible} onClose={() => setSpotModalVisible(false)} />
      <CreatePlanFab />
    </View>
  );
}

const CARD_W = Math.min(188, SCREEN_W * 0.46);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  foreground: { flex: 1, zIndex: 1, backgroundColor: "transparent" },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
  },

  block: { marginBottom: 22 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionGreen: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    color: "#34D399",
    letterSpacing: 0.8,
  },
  sectionPink: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    color: T.pink,
    letterSpacing: 0.8,
  },
  sectionPurple: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    color: T.purple,
    letterSpacing: 0.8,
  },
  sectionBig: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  pickVibeTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.2,
  },
  sectionHighlight: {
    backgroundColor: "#FEF08A",
    color: "#0F172A",
    overflow: "hidden",
  },
  seeAllPill: {
    backgroundColor: T.softPurple,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  seeAllPillText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.purple,
  },
  seeAllPillPink: {
    backgroundColor: "rgba(244, 114, 182, 0.18)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  seeAllPillPinkText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.pink,
  },

  vibeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  vibeCell: {
    width: (SCREEN_W - 36 - 16) / 3,
  },
  vibeTile: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  vibeGrad: {
    height: 78,
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    gap: 4,
  },
  vibeIcon: {
    width: 36,
    height: 36,
  },
  vibeTitle: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#fff",
    textAlign: "center",
  },

  heroStack: { gap: 12, marginBottom: 20 },
  beaconCardWrap: {
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#DB2777",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  beaconCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 4,
    minHeight: 128,
    overflow: "hidden",
  },
  beaconDecorBlob: {
    position: "absolute",
    right: -28,
    top: -36,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  beaconCopy: {
    flex: 1.4,
    zIndex: 2,
    paddingRight: 6,
    maxWidth: "62%",
  },
  beaconLivePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(15,23,42,0.28)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  beaconLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#86EFAC",
  },
  beaconLiveText: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    letterSpacing: 0.8,
  },
  beaconTitle: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
  },
  beaconSub: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 16,
    marginBottom: 10,
  },
  beaconCta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  beaconCtaText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#9D174D",
  },
  beaconArt: {
    width: 118,
    height: 118,
    alignItems: "center",
    justifyContent: "center",
  },
  beaconPulseRing: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
  },
  beacon3dMain: { width: 92, height: 92 },
  beacon3dPin: {
    position: "absolute",
    width: 34,
    height: 34,
    bottom: 8,
    right: 6,
  },

  planHeroCard: {
    borderRadius: 22,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 4,
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 140,
    alignItems: "center",
  },
  planHeroLeft: {
    flex: 1.5,
    zIndex: 2,
    maxWidth: "62%",
    paddingRight: 6,
  },
  planHeroPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  planHeroPillText: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    letterSpacing: 0.6,
  },
  planHeroTitle: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    lineHeight: 24,
  },
  planHeroSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.88)",
    marginTop: 4,
    marginBottom: 10,
  },
  planHeroBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  planHeroBtnText: {
    color: "#6D28D9",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  planHeroImage: {
    width: 110,
    height: 128,
    marginRight: -4,
    marginBottom: -10,
  },

  onlineBlock: {
    marginBottom: 22,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  onlineInner: {
    padding: 14,
    paddingBottom: 10,
  },
  stories: {
    gap: 4,
    paddingRight: 8,
    alignItems: "center",
  },
  emptyInline: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    paddingVertical: 12,
    paddingRight: 24,
  },

  emptyPlan: {
    alignItems: "center",
    backgroundColor: T.card,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: T.border,
    borderStyle: "dashed",
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 4,
  },
  emptyPlanTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    marginTop: 6,
  },
  emptyPlanSub: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
    marginBottom: 10,
  },
  emptyCta: {
    backgroundColor: T.purple,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  emptyCtaText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },

  planScroll: { gap: 12, paddingRight: 8 },
  planCard: {
    width: CARD_W,
    height: 230,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: T.card,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  planImage: { width: "100%", height: "100%" },
  planOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    paddingTop: 48,
  },
  planBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F472B6",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  planBadgeText: {
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
  },
  planTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    lineHeight: 19,
  },
  planMeta: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.85)",
  },

  suggestScroll: { gap: 12, paddingRight: 8 },
  suggestCard: {
    width: 148,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: T.card,
    shadowColor: "#DB2777",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  suggestAvatar: { width: "100%", height: "100%" },
  suggestOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    paddingTop: 40,
  },
  suggestName: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
  },
  suggestMeta: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.85)",
  },
});
