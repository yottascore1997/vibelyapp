import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSidebar } from "../../context/SidebarContext";
import { VibeFonts } from "../../constants/vibeTheme";

const FLUENT_3D = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets";
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

const MODE_TABS = [
  {
    id: "hangout",
    label: "hangora",
    sub: "plans",
    accent: "#A78BFA",
    soft: "rgba(167, 139, 250, 0.16)",
    route: "/hangout",
    icon: `${FLUENT_3D}/Purple%20heart/3D/purple_heart_3d.png`,
  },
  {
    id: "discover",
    label: "MATCH",
    sub: "zone",
    accent: "#F472B6",
    soft: "rgba(244, 114, 182, 0.16)",
    route: "/(tabs)/discover",
    icon: `${FLUENT_3D}/Sparkling%20heart/3D/sparkling_heart_3d.png`,
  },
  {
    id: "nearby",
    label: "Near",
    sub: "You",
    accent: "#FB923C",
    soft: "rgba(251, 146, 60, 0.16)",
    route: "/people-nearby",
    icon: `${FLUENT_3D}/Round%20pushpin/3D/round_pushpin_3d.png`,
  },
  {
    id: "events",
    label: "Fresh",
    sub: "Tonight",
    accent: "#34D399",
    soft: "rgba(52, 211, 153, 0.16)",
    route: "/explore-events",
    icon: `${FLUENT_3D}/Party%20popper/3D/party_popper_3d.png`,
  },
] as const;

interface Props {
  avatarUrl?: string | null;
  city?: string | null;
  livePlans?: number;
  onSearchSubmit?: (q: string) => void;
  onPromoPress?: () => void;
}

/** Fixed top header — brand, tabs, search only (banner scrolls below) */
export default function ZeptoHomeHeader({
  avatarUrl,
  city,
  livePlans = 0,
  onSearchSubmit,
  onPromoPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const [activeTab, setActiveTab] = useState<(typeof MODE_TABS)[number]["id"]>("hangout");
  const [query, setQuery] = useState("");

  const locationLabel = city?.trim()
    ? `Home · ${city}`
    : "Near you · Set location";

  const avatar =
    avatarUrl ||
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop";

  const goSearch = () => {
    const q = query.trim();
    if (onSearchSubmit) onSearchSubmit(q);
    router.push("/hangout" as any);
  };

  const tabW = Math.min(92, (SCREEN_W - 40) / 4);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 4 }]}>
      <LinearGradient
        colors={["rgba(23,29,51,0.92)", "rgba(13,18,35,0.78)", "rgba(7,10,20,0.35)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.decorBlob} pointerEvents="none" />
      <View style={styles.decorBlob2} pointerEvents="none" />

      <View style={styles.topRow}>
        <Pressable onPress={openSidebar} style={styles.topLeft} hitSlop={8}>
          <View style={styles.brandRow}>
            <Text style={styles.brandHang}>Hang</Text>
            <Text style={styles.brandOra}>ora</Text>
          </View>
          <Pressable
            style={styles.locationRow}
            onPress={() => router.push("/people-nearby")}
            hitSlop={6}
          >
            <Ionicons name="location" size={13} color={T.purple} />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationLabel}
            </Text>
            <Ionicons name="chevron-down" size={13} color={T.muted} />
          </Pressable>
        </Pressable>

        <Pressable onPress={() => router.push("/(tabs)/profile")} style={styles.profileBtn}>
          <LinearGradient
            colors={["#FB923C", "#EC4899", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileRing}
          >
            <View style={styles.profileInner}>
              <Image source={{ uri: avatar }} style={styles.profileImg} />
            </View>
          </LinearGradient>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
      >
        {MODE_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => {
                setActiveTab(tab.id);
                if (tab.id !== "hangout") router.push(tab.route as any);
              }}
              style={[
                styles.tabCard,
                { width: tabW, backgroundColor: active ? T.card : tab.soft },
                active && styles.tabCardActive,
              ]}
            >
              <Image source={{ uri: tab.icon }} style={styles.tabIcon} resizeMode="contain" />
              <Text style={[styles.tabLabel, { color: tab.accent }]} numberOfLines={1}>
                {tab.label}
              </Text>
              <Text style={[styles.tabSub, { color: tab.accent }]} numberOfLines={1}>
                {tab.sub}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sheet}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <View style={styles.searchIconBubble}>
              <Ionicons name="search" size={16} color={T.purple} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder='Search for "Coffee"'
              placeholderTextColor={T.faint}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={goSearch}
            />
            {livePlans > 0 ? (
              <View style={styles.liveChip}>
                <View style={styles.liveDot} />
                <Text style={styles.liveChipText}>{livePlans}</Text>
              </View>
            ) : null}
          </View>

          <Pressable
            style={styles.promoTile}
            onPress={onPromoPress ?? (() => router.push("/create-plan"))}
          >
            <LinearGradient
              colors={["#A855F7", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.promoGrad}
            >
              <Text style={styles.promoTitle}>Create</Text>
              <Text style={styles.promoSub}>Plan ✦</Text>
              <Image
                source={{ uri: `${FLUENT_3D}/Party%20popper/3D/party_popper_3d.png` }}
                style={styles.promoIcon}
                resizeMode="contain"
              />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: T.bg,
    paddingHorizontal: 14,
    paddingBottom: 0,
    overflow: "hidden",
    zIndex: 20,
  },
  decorBlob: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(244,114,182,0.16)",
  },
  decorBlob2: {
    position: "absolute",
    top: 40,
    left: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(139,92,246,0.16)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  topLeft: {
    flex: 1,
    paddingRight: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  brandHang: {
    fontSize: 28,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -1,
    lineHeight: 32,
  },
  brandOra: {
    fontSize: 28,
    fontFamily: VibeFonts.extraBold,
    color: "#FBBF24",
    letterSpacing: -1,
    lineHeight: 32,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
    maxWidth: "95%",
  },
  locationText: {
    fontSize: 13,
    fontFamily: VibeFonts.semiBold,
    color: T.muted,
    flexShrink: 1,
  },
  profileBtn: {
    marginTop: 2,
  },
  profileRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2.5,
  },
  profileInner: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: T.bg,
  },
  profileImg: {
    width: "100%",
    height: "100%",
  },
  tabsScroll: {
    marginHorizontal: -14,
  },
  tabsRow: {
    paddingHorizontal: 14,
    gap: 8,
    paddingBottom: 10,
  },
  tabCard: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: T.border,
    minHeight: 78,
  },
  tabCardActive: {
    borderColor: "rgba(255,255,255,0.22)",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 16,
    marginBottom: -10,
    zIndex: 3,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tabIcon: {
    width: 28,
    height: 28,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.2,
  },
  tabSub: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    opacity: 0.75,
    marginTop: -1,
  },
  sheet: {
    backgroundColor: T.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginHorizontal: -14,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderColor: T.border,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(10,14,26,0.6)",
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 50,
  },
  searchIconBubble: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    paddingVertical: 0,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(52,211,153,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  liveChipText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#34D399",
  },
  promoTile: {
    width: 76,
    height: 50,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#EC4899",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  promoGrad: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: "center",
  },
  promoTitle: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    lineHeight: 13,
  },
  promoSub: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#FCE7F3",
    lineHeight: 14,
  },
  promoIcon: {
    position: "absolute",
    right: -4,
    bottom: -6,
    width: 34,
    height: 34,
  },
});
