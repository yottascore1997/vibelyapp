import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { VibeFonts } from "../constants/vibeTheme";

import { useNotifications } from "../context/NotificationContext";

const hangoraLogo = require("../assets/home/hangora-logo.png");
const userAvatar = require("../assets/home/user-avatar.png");

interface HomeHeaderProps {
  showBack?: boolean;
  onBackPress?: () => void;
  onNotificationPress?: () => void;
}

export default function HomeHeader({
  showBack = false,
  onBackPress,
  onNotificationPress,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { openNotifications, unreadCount } = useNotifications();

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      openNotifications();
    }
  };

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate("/(tabs)");
    }
  };

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <View style={styles.headerLeft}>
        {showBack && (
          <Pressable
            style={styles.backBtn}
            onPress={handleBack}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
        )}
        <Image source={hangoraLogo} style={styles.logoImage} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Hangout</Text>
          <Text style={styles.headerSubtitle}>Meet. Vibe. Make it Real.</Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <Pressable
          onPress={handleNotificationPress}
          style={styles.iconCircleBtn}
          hitSlop={8}
        >
          <Ionicons name="notifications-outline" size={23} color="#FFFFFF" />
          {unreadCount > 0 && <View style={styles.notifBadgeDot} />}
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/profile")}
          style={styles.avatarWrap}
          hitSlop={8}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Image source={userAvatar} style={styles.avatarImage} />
          )}
          <View style={styles.onlineDot} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#070A13",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerTextCol: {
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadgeDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF2A55",
    borderWidth: 1.5,
    borderColor: "#070A13",
  },
  avatarWrap: {
    position: "relative",
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  onlineDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#070A13",
  },
});
