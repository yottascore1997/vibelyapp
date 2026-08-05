import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

/** Email/password register removed — phone OTP is the only signup path. */
export default function RegisterRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/(auth)/login");
  }, [router]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color="#7C3AED" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FD",
  },
});
