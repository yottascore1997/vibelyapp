import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { height: H } = Dimensions.get("window");

/**
 * Premium Hangora mesh — deep ink base, soft champagne + rose washes.
 * Quiet atmosphere (not neon orbs).
 */
export default function MorphingMeshBackground() {
  return (
    <View pointerEvents="none" style={[styles.root, { minHeight: H }]}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#08080A" }]} />

      {/* Soft top champagne */}
      <LinearGradient
        colors={[
          "rgba(180, 140, 90, 0.22)",
          "rgba(120, 80, 50, 0.1)",
          "transparent",
        ]}
        locations={[0, 0.35, 0.7]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 0.5 }}
        style={styles.full}
      />

      {/* Quiet rose mid-right */}
      <LinearGradient
        colors={[
          "transparent",
          "rgba(160, 60, 100, 0.14)",
          "transparent",
        ]}
        locations={[0.2, 0.55, 0.9]}
        start={{ x: 0.6, y: 0.15 }}
        end={{ x: 1, y: 0.7 }}
        style={styles.full}
      />

      {/* Deep ink vignette bottom */}
      <LinearGradient
        colors={[
          "transparent",
          "transparent",
          "rgba(0, 0, 0, 0.55)",
        ]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.full}
      />

      {/* Subtle cool edge left */}
      <LinearGradient
        colors={[
          "rgba(40, 50, 70, 0.18)",
          "transparent",
        ]}
        locations={[0, 0.55]}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 0.55, y: 0.85 }}
        style={styles.full}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  full: {
    ...StyleSheet.absoluteFillObject,
  },
});
