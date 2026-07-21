import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import PulseDot from "../home/PulseDot";
import { ChatThread, formatChatTime } from "../../constants/chats";
import { VibeFonts } from "../../constants/vibeTheme";

const T = {
  ink: "#1A1F36",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E4DFF0",
  purple: "#8B5CF6",
  pink: "#EC4899",
  card: "#FFFBFE",
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
      style={[
        styles.wrap,
        hasUnread && styles.wrapUnread,
        isLast && styles.wrapLast,
      ]}
    >
      {hasUnread ? <View style={styles.accent} /> : null}

      <View style={styles.avatarWrap}>
        <LinearGradient
          colors={thread.isGroup ? ["#7C3AED", "#8B5CF6"] : [...T.cta]}
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
          <View style={styles.groupBadge}>
            <Ionicons name="people" size={9} color="#fff" />
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>
              {thread.matchName}
            </Text>
            {thread.isVerified ? (
              <Ionicons name="checkmark-circle" size={14} color={T.purple} />
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
            <LinearGradient colors={[...T.cta]} style={styles.unread}>
              <Text style={styles.unreadText}>
                {thread.unread > 9 ? "9+" : thread.unread}
              </Text>
            </LinearGradient>
          ) : (
            <Ionicons name="chevron-forward" size={15} color={T.faint} />
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
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    position: "relative",
    backgroundColor: T.card,
  },
  wrapLast: { borderBottomWidth: 0 },
  wrapUnread: {
    backgroundColor: "rgba(236,72,153,0.04)",
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: T.pink,
  },
  avatarWrap: { position: "relative" },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 20,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#fff",
  },
  online: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: T.card,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  groupBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: T.purple,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  body: { flex: 1, minWidth: 0 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  name: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: T.ink,
    flexShrink: 1,
  },
  nameUnread: { fontFamily: VibeFonts.extraBold },
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
    paddingHorizontal: 6,
  },
  unreadText: { fontSize: 10, fontFamily: VibeFonts.bold, color: "#fff" },
});
