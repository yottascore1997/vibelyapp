import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/** Soft Hangout light ambient for auth / onboarding */
export default function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#F8F9FD", "#F5F3FF", "#F8F9FD"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <LinearGradient
        colors={["transparent", "rgba(248,249,253,0.55)", "#F8F9FD"]}
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
    width: 260,
    height: 260,
    top: -90,
    right: -70,
    backgroundColor: "rgba(124, 58, 237, 0.14)",
  },
  orb2: {
    width: 180,
    height: 180,
    top: 180,
    left: -70,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
});
