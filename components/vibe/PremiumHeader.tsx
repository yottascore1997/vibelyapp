import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSidebar } from "../../context/SidebarContext";
import { VibeFonts } from "../../constants/vibeTheme";
import { Spacing } from "../../constants/theme";

const T = {
  ink: "#0F172A",
  muted: "#94A3B8",
  white: "#FFFFFF",
  badge: "#EF4444",
  heartPink: "#EC4899",
  heartPurple: "#A855F7",
  ring: ["#FB923C", "#EC4899", "#8B5CF6"] as const,
};

function MenuIcon() {
  return (
    <View style={styles.menuIcon}>
      <View style={[styles.menuLine, { width: 18 }]} />
      <View style={[styles.menuLine, { width: 22 }]} />
      <View style={[styles.menuLine, { width: 14 }]} />
    </View>
  );
}

function VibelyMark() {
  return (
    <View style={styles.markWrap}>
      <View style={styles.miniHeartDot} />
      <Ionicons name="heart" size={34} color={T.heartPink} style={styles.heartMain} />
      <Ionicons name="heart" size={34} color={T.heartPurple} style={styles.heartOverlay} />
    </View>
  );
}

function Badge({ count }: { count: number }) {
  if (!count || count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : String(count)}</Text>
    </View>
  );
}

export interface PremiumHeaderProps {
  tagline?: string;
  likesCount?: number;
  chatsCount?: number;
  avatarUrl?: string | null;
  onLikesPress?: () => void;
  onChatsPress?: () => void;
  onAvatarPress?: () => void;
}

/**
 * [menu · logo · Vibely/tagline]     [likes · chats · avatar]
 */
export default function PremiumHeader({
  tagline = "Find your vibe",
  likesCount = 0,
  chatsCount = 0,
  avatarUrl,
  onLikesPress,
  onChatsPress,
  onAvatarPress,
}: PremiumHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openSidebar } = useSidebar();

  const avatar =
    avatarUrl ||
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop";

  return (
    <Animated.View
      entering={FadeInDown.duration(320)}
      style={[styles.wrap, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.bar}>
        <View style={styles.left}>
          <Pressable onPress={openSidebar} hitSlop={12} style={styles.menuHit}>
            <MenuIcon />
          </Pressable>

          <View style={styles.brand}>
            <VibelyMark />
            <View style={styles.brandCopy}>
              <Text style={styles.brandName} numberOfLines={1}>
                Vibely
              </Text>
              <View style={styles.tagRow}>
                <Text style={styles.tagline} numberOfLines={1}>
                  {tagline}
                </Text>
                <Ionicons name="sparkles" size={12} color={T.heartPurple} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.right}>
          <Pressable
            style={styles.iconHit}
            onPress={onLikesPress ?? (() => router.push("/my-matches"))}
          >
            <Ionicons name="heart-outline" size={26} color={T.ink} />
            <Badge count={likesCount} />
          </Pressable>

          <Pressable
            style={styles.iconHit}
            onPress={onChatsPress ?? (() => router.push("/(tabs)/chats"))}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={25} color={T.ink} />
            <Badge count={chatsCount} />
          </Pressable>

          <Pressable onPress={onAvatarPress ?? (() => router.push("/(tabs)/profile"))}>
            <LinearGradient colors={[...T.ring]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                <Image source={{ uri: avatar }} style={styles.avatar} />
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: -Spacing.lg,
    marginTop: -Spacing.md,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: 12,
    marginRight: 10,
  },
  menuHit: {
    width: 28,
    height: 36,
    justifyContent: "center",
  },
  menuIcon: {
    height: 16,
    justifyContent: "space-between",
  },
  menuLine: {
    height: 2.4,
    borderRadius: 1.5,
    backgroundColor: T.ink,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  markWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  miniHeartDot: {
    position: "absolute",
    top: -1,
    left: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F472B6",
    zIndex: 2,
  },
  heartMain: {
    position: "absolute",
  },
  heartOverlay: {
    position: "absolute",
    opacity: 0.55,
    transform: [{ translateX: 1 }, { translateY: -1 }],
  },
  brandCopy: {
    flexShrink: 1,
    justifyContent: "center",
  },
  brandName: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.7,
    lineHeight: 28,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  tagline: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    lineHeight: 16,
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 14,
  },
  iconHit: {
    width: 30,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: T.badge,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: T.white,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#fff",
    lineHeight: 11,
  },
  avatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    padding: 2.5,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 21,
    overflow: "hidden",
    backgroundColor: T.white,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
});
