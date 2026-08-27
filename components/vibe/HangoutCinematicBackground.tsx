import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { height: SCREEN_H, width: W } = Dimensions.get("window");

/**
 * Soft aurora mesh for Hangout — no circle orbs.
 * Matches mockup: charcoal + muted orange / olive / purple washes.
 */
export default function HangoutCinematicBackground() {
  return (
    <View pointerEvents="none" style={[styles.root, { minHeight: SCREEN_H }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#121212" }]} />

      <LinearGradient
        colors={[
          "rgba(140, 78, 36, 0.45)",
          "rgba(110, 60, 28, 0.2)",
          "transparent",
        ]}
        locations={[0, 0.4, 0.75]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.95, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={[
          "transparent",
          "rgba(40, 85, 70, 0.42)",
          "rgba(35, 70, 55, 0.22)",
          "transparent",
        ]}
        locations={[0.05, 0.3, 0.55, 0.9]}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={[
          "transparent",
          "transparent",
          "rgba(70, 35, 95, 0.35)",
          "rgba(55, 25, 75, 0.18)",
        ]}
        locations={[0, 0.4, 0.72, 1]}
        start={{ x: 0.35, y: 0.3 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={[
          "rgba(18,18,18,0.15)",
          "transparent",
          "transparent",
          "rgba(10,10,10,0.4)",
        ]}
        locations={[0, 0.2, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: "hidden",
    backgroundColor: "#121212",
    width: W,
  },
});
