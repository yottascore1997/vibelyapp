import { View, Text, StyleSheet, Pressable, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { VibeActivities, VibeColors, VibeFonts } from "../../constants/vibeTheme";

function getTimeLabel(id: string) {
  const now = new Date();
  if (id === "now") return "";
  if (id === "30min") {
    const t = new Date(now.getTime() + 30 * 60000);
    return `~${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}`;
  }
  if (id === "1hr") {
    const t = new Date(now.getTime() + 60 * 60000);
    return `~${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}`;
  }
  return "";
}

const timeOptions = [
  { id: "now", label: "NOW", icon: "flash" as const },
  { id: "30min", label: "+30 MIN", icon: "time" as const },
  { id: "1hr", label: "+1 HR", icon: "alarm" as const },
  { id: "6pm", label: "6 PM TODAY", icon: "sunny" as const },
];

interface Props {
  friendName: string;
  friendAvatar: string;
  selectedActivity: string;
  selectedTime: string;
  onSelectActivity: (id: string) => void;
  onSelectTime: (id: string) => void;
  onSend: () => void;
}

function ActivityBtn({ act, selected, onPress }: { act: (typeof VibeActivities)[0]; selected: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.92); }}
      onPressOut={() => { scale.value = withSpring(selected ? 1.05 : 1); }}
      style={styles.actWrap}
    >
      <Animated.View 
        style={[
          styles.actBtn, 
          selected && { 
            borderColor: act.color, 
            backgroundColor: act.color + "22",
            shadowColor: act.color,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 6,
          }, 
          anim
        ]}
      >
        <Text style={styles.actEmoji}>{act.emoji}</Text>
        <Text style={[styles.actName, selected ? { color: act.color, fontFamily: VibeFonts.bold } : null]}>{act.name.toUpperCase()}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function MoveSheet({
  friendName,
  friendAvatar,
  selectedActivity,
  selectedTime,
  onSelectActivity,
  onSelectTime,
  onSend,
}: Props) {
  const act = VibeActivities.find((a) => a.id === selectedActivity);

  return (
    <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.sheet}>
      <LinearGradient colors={["rgba(13,13,20,0.95)", "#0D0D14"]} style={styles.sheetGradient}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Image source={{ uri: friendAvatar }} style={[styles.avatar, act ? { borderColor: act.color } : null]} />
          <Text style={styles.hangWith}>
            hang with <Text style={[styles.friendName, act ? { color: act.color } : null]}>{friendName}</Text>
          </Text>
        </View>

        <Text style={styles.title}>
          what's the <Text style={{ color: act?.color || VibeColors.neonGreen }}>move?</Text>
        </Text>

        <View style={styles.grid}>
          {VibeActivities.map((a) => (
            <ActivityBtn
              key={a.id}
              act={a}
              selected={selectedActivity === a.id}
              onPress={() => onSelectActivity(a.id)}
            />
          ))}
        </View>

        <Text style={styles.whenLabel}>When?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRow}>
          {timeOptions.map((t) => {
            const active = selectedTime === t.id;
            const sub = getTimeLabel(t.id);
            return (
              <Pressable key={t.id} onPress={() => onSelectTime(t.id)}>
                {active ? (
                  <LinearGradient colors={["rgba(138,86,255,0.15)", "rgba(5,5,8,0.95)"]} style={[styles.timeBtn, styles.timeBtnActive]}>
                    <Ionicons name={t.icon} size={18} color="#C084FC" />
                    <Text style={styles.timeLabelActive}>{t.label}</Text>
                    {sub ? <Text style={[styles.timeSub, { color: "#C084FC" }]}>{sub}</Text> : null}
                  </LinearGradient>
                ) : (
                  <View style={styles.timeBtn}>
                     <Ionicons name={t.icon} size={18} color={VibeColors.textMuted} />
                     <Text style={styles.timeLabel}>{t.label}</Text>
                     {sub ? <Text style={styles.timeSub}>{sub}</Text> : null}
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <Animated.View entering={FadeInDown.delay(200)}>
          <Pressable onPress={onSend}>
            <LinearGradient colors={["#8A56FF", "#FF4B81"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendBtn}>
              <Ionicons name="paper-plane" size={18} color="#fff" />
              <Text style={styles.sendText}>
                Send "{act?.name.toLowerCase()}" invite to {friendName}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: VibeColors.bgGlassBorder,
    borderBottomWidth: 0,
  },
  sheetGradient: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "#8A56FF" },
  hangWith: { fontSize: 14, fontFamily: VibeFonts.regular, color: VibeColors.textMuted },
  friendName: { color: "#8A56FF", fontFamily: VibeFonts.bold },
  title: { fontSize: 28, fontFamily: VibeFonts.extraBold, color: VibeColors.text, marginBottom: 20, letterSpacing: -0.5 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  actWrap: { width: "18%" },
  actBtn: {
    aspectRatio: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  actBtnActive: {},
  actEmoji: { fontSize: 26, marginBottom: 4 },
  actName: { fontSize: 8, fontFamily: VibeFonts.bold, color: VibeColors.textMuted, letterSpacing: 0.3 },
  whenLabel: { fontSize: 16, fontFamily: VibeFonts.bold, color: VibeColors.text, marginBottom: 12 },
  timeRow: { gap: 10, paddingBottom: 20 },
  timeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    minWidth: 100,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  timeBtnActive: { borderColor: "#8A56FF", borderWidth: 1.5 },
  timeLabel: { fontSize: 12, fontFamily: VibeFonts.bold, color: VibeColors.textMuted, marginTop: 6 },
  timeLabelActive: { fontSize: 12, fontFamily: VibeFonts.bold, color: "#C084FC", marginTop: 6 },
  timeSub: { fontSize: 10, fontFamily: VibeFonts.regular, color: VibeColors.textMuted, marginTop: 2 },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  sendText: { color: "#fff", fontSize: 14, fontFamily: VibeFonts.bold },
});
