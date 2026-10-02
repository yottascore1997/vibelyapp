import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import PulseDot from "../home/PulseDot";
import { ChatThread, formatChatTime, formatChatPreview } from "../../constants/chats";
import { VibeFonts } from "../../constants/vibeTheme";

interface Props {
  thread: ChatThread;
  onPress: () => void;
  isLast?: boolean;
}

export default function ChatLogItem({ thread, onPress }: Props) {
  const lastMsg =
    thread.messages && thread.messages.length > 0
      ? thread.messages[thread.messages.length - 1]
      : null;
  const isFromMe = lastMsg ? lastMsg.fromMe : false;
  const hasUnread = thread.unread > 0;

  const ringColors = thread.isGroup
    ? (["#A855F7", "#C084FC"] as const)
    : thread.isOnline
    ? (["#22D3EE", "#06B6D4"] as const)
    : (["#38BDF8", "#818CF8"] as const);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        hasUnread && styles.cardUnread,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Left Avatar with glowing ring */}
      <View style={styles.avatarWrap}>
        <LinearGradient
          colors={[...ringColors]}
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
          <View style={styles.groupBadge}>
            <Ionicons name="people" size={10} color="#050508" />
          </View>
        ) : null}
      </View>

      {/* Main Info */}
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, hasUnread && styles.nameUnread]}
              numberOfLines={1}
            >
              {thread.matchName}
            </Text>
            {thread.isVerified ? (
              <Ionicons name="checkmark-circle" size={15} color="#22D3EE" />
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
            {formatChatPreview(thread.lastMessage)}
          </Text>

          {hasUnread ? (
            <LinearGradient
              colors={["#D4F72C", "#22D3EE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.unread}
            >
              <Text style={styles.unreadText}>
                {thread.unread > 9 ? "9+" : thread.unread}
              </Text>
            </LinearGradient>
          ) : (
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1424",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 20,
    padding: 13,
    marginBottom: 10,
  },
  cardUnread: {
    borderColor: "rgba(34, 211, 238, 0.28)",
    backgroundColor: "#101930",
  },
  cardPressed: {
    backgroundColor: "#141F3D",
  },
  avatarWrap: {
    position: "relative",
    marginRight: 12,
  },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#0D1424",
  },
  online: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#070A14",
    borderRadius: 10,
    padding: 2,
    borderWidth: 1.5,
    borderColor: "#0D1424",
  },
  groupBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#D4F72C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#0D1424",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    flexShrink: 1,
  },
  nameUnread: {
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
  },
  time: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },
  timeUnread: {
    color: "#D4F72C",
    fontFamily: VibeFonts.bold,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 5,
  },
  preview: {
    flex: 1,
    fontSize: 13,
    fontFamily: VibeFonts.regular,
    color: "#94A3B8",
  },
  previewUnread: {
    color: "#F1F5F9",
    fontFamily: VibeFonts.semiBold,
  },
  youPrefix: {
    color: "#22D3EE",
    fontFamily: VibeFonts.bold,
  },
  unread: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#050508",
  },
});
