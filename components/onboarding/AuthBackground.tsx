import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#F8F9FD", "#F3E8FF", "#FFF0F5", "#F8F9FD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />
      <LinearGradient
        colors={["transparent", "rgba(248,249,253,0.8)", "#F8F9FD"]}
        style={styles.fadeBottom}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FD" },
  orb: { position: "absolute", borderRadius: 999 },
  orb1: {
    width: 280,
    height: 280,
    top: -80,
    right: -60,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
  },
  orb2: {
    width: 200,
    height: 200,
    top: 120,
    left: -80,
    backgroundColor: "rgba(236, 72, 153, 0.1)",
  },
  orb3: {
    width: 160,
    height: 160,
    bottom: 200,
    right: 20,
    backgroundColor: "rgba(139, 92, 246, 0.08)",
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%",
  },
});
