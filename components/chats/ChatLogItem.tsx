import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import PulseDot from "../home/PulseDot";
import { ChatThread, formatChatTime } from "../../constants/chats";
import { VibeFonts } from "../../constants/vibeTheme";

interface Props {
  thread: ChatThread;
  onPress: () => void;
}

export default function ChatLogItem({ thread, onPress }: Props) {
  const lastMsg =
    thread.messages && thread.messages.length > 0
      ? thread.messages[thread.messages.length - 1]
      : null;
  const isFromMe = lastMsg ? lastMsg.fromMe : false;
  const hasUnread = thread.unread > 0;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.wrap, hasUnread && styles.wrapUnread]}
    >
      {hasUnread ? <View style={styles.accent} /> : null}

      <View style={styles.avatarWrap}>
        {thread.isGroup ? (
          <LinearGradient colors={["#8A56FF", "#3B82F6"]} style={styles.avatarRing}>
            <Image source={{ uri: thread.avatarUrl }} style={styles.avatar} />
          </LinearGradient>
        ) : (
          <LinearGradient colors={["#FF4B81", "#8A56FF"]} style={styles.avatarRing}>
            <Image source={{ uri: thread.avatarUrl }} style={styles.avatar} />
          </LinearGradient>
        )}
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
            <Text style={styles.name} numberOfLines={1}>
              {thread.matchName}
            </Text>
            {thread.isVerified ? (
              <Ionicons name="checkmark-circle" size={14} color="#60A5FA" />
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
            {isFromMe ? (
              <Text style={styles.youPrefix}>You: </Text>
            ) : null}
            {thread.lastMessage}
          </Text>
          {hasUnread ? (
            <LinearGradient colors={["#FF4B81", "#8A56FF"]} style={styles.unread}>
              <Text style={styles.unreadText}>
                {thread.unread > 9 ? "9+" : thread.unread}
              </Text>
            </LinearGradient>
          ) : (
            <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.25)" />
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
    borderBottomColor: "rgba(255,255,255,0.06)",
    position: "relative",
  },
  wrapUnread: {
    backgroundColor: "rgba(255,75,129,0.06)",
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "#FF4B81",
  },
  avatarWrap: { position: "relative" },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 20,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#0A0A10",
  },
  online: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#050508",
    borderRadius: 8,
    padding: 2,
  },
  groupBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#8A56FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#050508",
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
    color: "#FFFFFF",
    flexShrink: 1,
  },
  time: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.35)",
  },
  timeUnread: { color: "#FF4B81", fontFamily: VibeFonts.bold },
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
    color: "rgba(255,255,255,0.4)",
  },
  previewUnread: {
    color: "rgba(255,255,255,0.88)",
    fontFamily: VibeFonts.semiBold,
  },
  youPrefix: { color: "#A855F7", fontFamily: VibeFonts.bold },
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
