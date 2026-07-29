import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import PaywallModal from "../components/paywall/PaywallModal";
import { usePremium } from "../context/PremiumContext";

export default function PaywallScreen() {
  const { openPaywall } = usePremium();
  const router = useRouter();

  useEffect(() => {
    openPaywall();
  }, []);

  return (
    <View style={styles.root}>
      <PaywallModal />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FD" },
});
