import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import PulseDot from "../home/PulseDot";
import { ChatThread, formatChatTime } from "../../constants/chats";
import { VibeFonts } from "../../constants/vibeTheme";

const T = {
  ink: "#0F172A",
  muted: "#64748B",
  faint: "#94A3B8",
  border: "#E2E8F0",
  purple: "#8B5CF6",
  pink: "#EC4899",
  card: "#FFFFFF",
  cta: ["#8B5CF6", "#EC4899"] as const,
};

interface Props {
  thread: ChatThread;
  onPress: () => void;
  isLast?: boolean;
}

export default function ChatLogItem({ thread, onPress, isLast }: Props) {
  const lastMsg =
    thread.messages && thread.messages.length > 0
      ? thread.messages[thread.messages.length - 1]
      : null;
  const isFromMe = lastMsg ? lastMsg.fromMe : false;
  const hasUnread = thread.unread > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        hasUnread && styles.wrapUnread,
        isLast && styles.wrapLast,
        pressed && styles.wrapPressed,
      ]}
    >
      {hasUnread ? (
        <LinearGradient
          colors={[...T.cta]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.accent}
        />
      ) : null}

      <View style={styles.avatarWrap}>
        <LinearGradient
          colors={thread.isGroup ? ["#7C3AED", "#8B5CF6"] : [...T.cta]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarRing}
        >
          <Image source={{ uri: thread.avatarUrl }} style={styles.avatar} />
        </LinearGradient>

        {thread.isOnline ? (
          <View style={styles.online}>
            <PulseDot size={5} color="#22C55E" />
          </View>
        ) : null}

        {thread.isGroup ? (
          <LinearGradient colors={["#7C3AED", "#8B5CF6"]} style={styles.groupBadge}>
            <Ionicons name="people" size={10} color="#fff" />
          </LinearGradient>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>
              {thread.matchName}
            </Text>
            {thread.isVerified ? (
              <Ionicons name="checkmark-circle" size={15} color={T.purple} />
            ) : null}
          </View>
          <Text style={[styles.time, hasUnread && styles.timeUnread]}>
            {formatChatTime(thread.lastMessageAt)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text
            style={[styles.preview, hasUnread && styles.previewUnread]}
            numberOfLines={1}
          >
            {isFromMe ? <Text style={styles.youPrefix}>You: </Text> : null}
            {thread.lastMessage}
          </Text>

          {hasUnread ? (
            <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.unread}>
              <Text style={styles.unreadText}>
                {thread.unread > 9 ? "9+" : thread.unread}
              </Text>
            </LinearGradient>
          ) : (
            <Ionicons name="chevron-forward" size={16} color={T.faint} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.7)",
    position: "relative",
    backgroundColor: T.card,
  },
  wrapLast: { borderBottomWidth: 0 },
  wrapUnread: {
    backgroundColor: "rgba(244, 242, 255, 0.7)",
  },
  wrapPressed: {
    backgroundColor: "rgba(238, 233, 248, 0.9)",
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 3.5,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  avatarWrap: { position: "relative" },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 21,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  online: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 2,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  groupBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  body: { flex: 1, minWidth: 0 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  name: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: T.ink,
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  nameUnread: { fontFamily: VibeFonts.extraBold, color: "#0F172A" },
  time: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.faint,
  },
  timeUnread: { color: T.pink, fontFamily: VibeFonts.bold },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
  },
  preview: {
    flex: 1,
    fontSize: 13,
    fontFamily: VibeFonts.regular,
    color: T.muted,
  },
  previewUnread: {
    color: T.ink,
    fontFamily: VibeFonts.semiBold,
  },
  youPrefix: { color: T.purple, fontFamily: VibeFonts.bold },
  unread: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
    shadowColor: "#EC4899",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  unreadText: { fontSize: 10, fontFamily: VibeFonts.extraBold, color: "#FFFFFF" },
});
