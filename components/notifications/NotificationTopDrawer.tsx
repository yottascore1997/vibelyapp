import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  ScrollView,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useNotifications, NotificationItem } from "../../context/NotificationContext";
import { VibeFonts } from "../../constants/vibeTheme";

const { height: SCREEN_H } = Dimensions.get("window");
// Compact top sheet height so it doesn't take over the entire screen
const ESTIMATED_DRAWER_HEIGHT = Math.min(SCREEN_H * 0.58, 430);

export default function NotificationTopDrawer() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    isOpen,
    closeNotifications,
    notifications,
    markAllAsRead,
    markAsRead,
    openInviteModal,
  } = useNotifications();

  const [shouldRender, setShouldRender] = useState(isOpen);
  const translateY = useSharedValue(-ESTIMATED_DRAWER_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      translateY.value = withSpring(0, {
        damping: 24,
        stiffness: 240,
        mass: 0.8,
      });
      backdropOpacity.value = withTiming(0.6, { duration: 220 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(
        -ESTIMATED_DRAWER_HEIGHT - 30,
        {
          duration: 220,
          easing: Easing.in(Easing.cubic),
        },
        (isFinished) => {
          if (isFinished) {
            runOnJS(setShouldRender)(false);
          }
        }
      );
    }
  }, [isOpen]);

  // PanResponder to handle smooth swipe-up gesture to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return Math.abs(gestureState.dy) > 6;
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.value = gestureState.dy;
        } else {
          translateY.value = gestureState.dy * 0.2;
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dy < -45 || gestureState.vy < -0.4) {
          runOnJS(closeNotifications)();
        } else {
          translateY.value = withSpring(0, {
            damping: 22,
            stiffness: 240,
            mass: 0.8,
          });
        }
      },
    })
  ).current;

  const drawerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleItemPress = (item: NotificationItem) => {
    markAsRead(item.id);
    closeNotifications();
    if (item.type === "invite") {
      const realName =
        item.inviteData?.senderName ||
        item.user?.name ||
        item.titleUser ||
        (item.titleHighlight && item.titleHighlight.includes(" invited you")
          ? item.titleHighlight.split(" invited you")[0]?.trim()
          : undefined) ||
        (item.titlePrefix && item.titlePrefix.includes(" invited you")
          ? item.titlePrefix.split(" invited you")[0]?.trim()
          : undefined) ||
        "Friend";

      const realAvatar = item.inviteData?.senderAvatar || item.user?.avatar;

      setTimeout(() => {
        openInviteModal({
          planId:
            item.inviteData?.planId ||
            (item.id.startsWith("invite-") ? item.id.replace("invite-", "") : item.id),
          senderName: realName,
          senderAvatar: realAvatar,
          category:
            item.inviteData?.category ||
            item.category ||
            (item.titleHighlight?.includes("sutta") ? "smoke" : "chai"),
          location:
            item.inviteData?.location ||
            item.subtitle.split("·")[1]?.trim() ||
            "CHAYOS, GALLERIA",
          time:
            item.inviteData?.time ||
            item.subtitle.split("·")[2]?.trim() ||
            "6 PM TODAY",
        });
      }, 160);
      return;
    }
    if (item.route) {
      setTimeout(() => {
        router.push(item.route as any);
      }, 160);
    }
  };

  const handleOpenAction = (item: NotificationItem) => {
    markAsRead(item.id);
    closeNotifications();
    if (item.type === "invite") {
      const realName =
        item.inviteData?.senderName ||
        item.user?.name ||
        item.titleUser ||
        (item.titleHighlight && item.titleHighlight.includes(" invited you")
          ? item.titleHighlight.split(" invited you")[0]?.trim()
          : undefined) ||
        (item.titlePrefix && item.titlePrefix.includes(" invited you")
          ? item.titlePrefix.split(" invited you")[0]?.trim()
          : undefined) ||
        "Friend";

      const realAvatar = item.inviteData?.senderAvatar || item.user?.avatar;

      setTimeout(() => {
        openInviteModal({
          planId:
            item.inviteData?.planId ||
            (item.id.startsWith("invite-") ? item.id.replace("invite-", "") : item.id),
          senderName: realName,
          senderAvatar: realAvatar,
          category:
            item.inviteData?.category ||
            item.category ||
            (item.titleHighlight?.includes("sutta") ? "smoke" : "chai"),
          location:
            item.inviteData?.location ||
            item.subtitle.split("·")[1]?.trim() ||
            "CHAYOS, GALLERIA",
          time:
            item.inviteData?.time ||
            item.subtitle.split("·")[2]?.trim() ||
            "6 PM TODAY",
        });
      }, 160);
      return;
    }
    setTimeout(() => {
      if (item.route) {
        router.push(item.route as any);
      } else {
        router.push("/hangout");
      }
    }, 160);
  };

  if (!shouldRender) return null;

  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      {/* Dimmed Backdrop */}
      <Animated.View style={[styles.backdrop, backdropAnimStyle]}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={closeNotifications}
        />
      </Animated.View>

      {/* Top Sliding Drawer - Compact & Clean */}
      <Animated.View
        style={[
          styles.drawerSheet,
          { paddingTop: Math.max(insets.top, 10) + 4 },
          drawerAnimStyle,
        ]}
      >
        <LinearGradient
          colors={["#111624", "#0A0D16"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Grab Handle */}
        <View style={styles.handleContainer} {...panResponder.panHandlers}>
          <View style={styles.handleBar} />
        </View>

        {/* Compact Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.titleText}>Notifications</Text>
          </View>
          <View style={styles.headerRightActions}>
            <Pressable
              style={({ pressed }) => [
                styles.markAllBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
              onPress={markAllAsRead}
              hitSlop={6}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
            <Pressable
              style={styles.closeBtn}
              onPress={closeNotifications}
              hitSlop={6}
            >
              <Ionicons name="close" size={16} color="#94A3B8" />
            </Pressable>
          </View>
        </View>

        {/* Notification List - Sleek & Compact */}
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {notifications.map((item) => {
            return (
              <Pressable
                key={item.id}
                onPress={() => handleItemPress(item)}
                style={({ pressed }) => [
                  styles.notifCard,
                  item.isRead && styles.notifCardRead,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
              >
                {/* Left Avatar / Icon with Badge */}
                <View style={styles.avatarContainer}>
                  {item.user?.avatar ? (
                    <Image
                      source={{ uri: item.user.avatar }}
                      style={styles.avatarImg}
                    />
                  ) : (
                    <View
                      style={[
                        styles.iconAvatarPlaceholder,
                        {
                          backgroundColor:
                            item.user?.badgeColor
                              ? `${item.user.badgeColor}22`
                              : "rgba(249, 115, 22, 0.2)",
                          borderColor:
                            item.user?.badgeColor
                              ? `${item.user.badgeColor}44`
                              : "rgba(249, 115, 22, 0.3)",
                        },
                      ]}
                    >
                      <Ionicons
                        name={(item.user?.badgeIcon as any) || "notifications"}
                        size={17}
                        color={item.user?.badgeColor || "#FB923C"}
                      />
                    </View>
                  )}

                  {/* Badge overlay on avatar */}
                  {item.user?.avatar && item.user?.badgeIcon && (
                    <View
                      style={[
                        styles.avatarBadge,
                        {
                          backgroundColor:
                            item.user.badgeColor || "#22C55E",
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.user.badgeIcon as any}
                        size={8.5}
                        color="#0B0F17"
                      />
                    </View>
                  )}
                </View>

                {/* Text Content Column */}
                <View style={styles.textContent}>
                  <Text style={styles.notifMainText} numberOfLines={2}>
                    {item.titlePrefix && (
                      <Text style={styles.regularText}>{item.titlePrefix} </Text>
                    )}
                    {item.titleUser && (
                      <Text style={styles.boldText}>{item.titleUser} </Text>
                    )}
                    {item.titleAction && (
                      <Text style={styles.regularText}>{item.titleAction} </Text>
                    )}
                    {item.titleHighlight && (
                      <Text style={styles.highlightText}>
                        {item.titleHighlight}
                      </Text>
                    )}
                    {item.titleSuffix && (
                      <Text style={styles.regularText}> {item.titleSuffix}</Text>
                    )}
                  </Text>

                  <Text style={styles.subtitleText}>{item.subtitle}</Text>
                </View>

                {/* Unread indicator dot or Open button */}
                {item.buttonText && !item.isRead ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.openBtn,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                    ]}
                    onPress={() => handleOpenAction(item)}
                    hitSlop={6}
                  >
                    <Text style={styles.openBtnText}>{item.buttonText}</Text>
                  </Pressable>
                ) : !item.isRead ? (
                  <View style={styles.unreadDot} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Bottom Pull-Up Bar / Drag Area */}
        <View style={styles.bottomHandleArea} {...panResponder.panHandlers}>
          <Pressable
            style={styles.bottomDismissWrap}
            onPress={closeNotifications}
            hitSlop={10}
          >
            <View style={styles.bottomHandleBar} />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 5, 10, 0.65)",
  },
  drawerSheet: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    maxHeight: ESTIMATED_DRAWER_HEIGHT,
    backgroundColor: "#0A0D16",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderTopWidth: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 25,
    overflow: "hidden",
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 4,
    width: "100%",
  },
  handleBar: {
    width: 32,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 8,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleText: {
    fontSize: 17,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  markAllBtn: {
    paddingHorizontal: 11,
    paddingVertical: 4.5,
    borderRadius: 12,
    backgroundColor: "#EF4444",
  },
  markAllText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollList: {
    maxHeight: 285,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 4,
    gap: 6,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.035)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  notifCardRead: {
    opacity: 0.55,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 10,
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E293B",
  },
  iconAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadge: {
    position: "absolute",
    bottom: -1,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#0A0D16",
  },
  textContent: {
    flex: 1,
    justifyContent: "center",
  },
  notifMainText: {
    fontSize: 13,
    lineHeight: 17,
    color: "#F1F5F9",
  },
  boldText: {
    fontFamily: VibeFonts.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  regularText: {
    fontFamily: VibeFonts.regular,
    color: "#CBD5E1",
  },
  highlightText: {
    fontFamily: VibeFonts.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitleText: {
    fontSize: 11,
    fontFamily: VibeFonts.regular,
    color: "#64748B",
    marginTop: 2,
  },
  openBtn: {
    backgroundColor: "#86EFAC",
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 12,
    marginLeft: 8,
  },
  openBtnText: {
    color: "#052e16",
    fontFamily: VibeFonts.bold,
    fontWeight: "700",
    fontSize: 11.5,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginLeft: 8,
  },
  bottomHandleArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    backgroundColor: "transparent",
  },
  bottomDismissWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 3,
  },
  bottomHandleBar: {
    width: 32,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
});
