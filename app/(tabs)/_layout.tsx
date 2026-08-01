import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import TabBar from "../../components/TabBar";
import { useTabBarVisibility } from "../../context/TabBarVisibilityContext";

export default function TabsLayout() {
  const { hidden } = useTabBarVisibility();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      {!hidden ? <TabBar dark /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070A14" },
  content: { flex: 1, backgroundColor: "#070A14" },
});
