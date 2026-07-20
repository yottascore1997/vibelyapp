import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={["#1a0a2e", "#2d1b69", "#4a1a6b", "#1a0a2e"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />
      <LinearGradient
        colors={["transparent", "rgba(248,247,252,0.95)", "#F8F7FC"]}
        style={styles.fadeBottom}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1a0a2e" },
  orb: { position: "absolute", borderRadius: 999 },
  orb1: {
    width: 280,
    height: 280,
    top: -80,
    right: -60,
    backgroundColor: "rgba(138,86,255,0.35)",
  },
  orb2: {
    width: 200,
    height: 200,
    top: 120,
    left: -80,
    backgroundColor: "rgba(255,75,129,0.25)",
  },
  orb3: {
    width: 160,
    height: 160,
    bottom: 200,
    right: 20,
    backgroundColor: "rgba(168,85,247,0.2)",
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%",
  },
});
