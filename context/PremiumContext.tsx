import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PremiumTier = "FREE" | "GOLD" | "VIP";

interface PremiumContextType {
  tier: PremiumTier;
  isPremium: boolean;
  boostCredits: number;
  superLikeCredits: number;
  directDmCredits: number;
  paywallVisible: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  upgradeTier: (newTier: PremiumTier) => Promise<void>;
  buyCredits: (type: "boost" | "superLike" | "directDm", count: number) => Promise<void>;
  hasFeature: (feature: "SEE_LIKES" | "PASSPORT" | "UNLIMITED_SWIPES" | "BEACONS" | "DIRECT_DM") => boolean;
}

const STORAGE_KEY = "@vibematch_premium_data";

const PremiumContext = createContext<PremiumContextType | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<PremiumTier>("FREE");
  const [boostCredits, setBoostCredits] = useState(0);
  const [superLikeCredits, setSuperLikeCredits] = useState(1);
  const [directDmCredits, setDirectDmCredits] = useState(0);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.tier) setTier(parsed.tier);
          if (parsed.boostCredits !== undefined) setBoostCredits(parsed.boostCredits);
          if (parsed.superLikeCredits !== undefined) setSuperLikeCredits(parsed.superLikeCredits);
          if (parsed.directDmCredits !== undefined) setDirectDmCredits(parsed.directDmCredits);
        }
      } catch (e) {
        console.warn("Failed to load premium context data", e);
      }
    })();
  }, []);

  const saveState = async (newTier: PremiumTier, boost: number, superLikes: number, dms: number) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tier: newTier,
          boostCredits: boost,
          superLikeCredits: superLikes,
          directDmCredits: dms,
        })
      );
    } catch (e) {
      console.warn("Failed to save premium data", e);
    }
  };

  const isPremium = tier === "GOLD" || tier === "VIP";

  const openPaywall = () => setPaywallVisible(true);
  const closePaywall = () => setPaywallVisible(false);

  const upgradeTier = async (newTier: PremiumTier) => {
    setTier(newTier);
    const newBoost = newTier === "VIP" ? boostCredits + 2 : newTier === "GOLD" ? boostCredits + 1 : boostCredits;
    const newSuperLikes = newTier === "VIP" ? 10 : newTier === "GOLD" ? 5 : 1;
    const newDms = newTier === "VIP" ? directDmCredits + 5 : directDmCredits + 1;

    setBoostCredits(newBoost);
    setSuperLikeCredits(newSuperLikes);
    setDirectDmCredits(newDms);

    await saveState(newTier, newBoost, newSuperLikes, newDms);
    setPaywallVisible(false);
  };

  const buyCredits = async (type: "boost" | "superLike" | "directDm", count: number) => {
    let b = boostCredits;
    let sl = superLikeCredits;
    let dm = directDmCredits;

    if (type === "boost") b += count;
    if (type === "superLike") sl += count;
    if (type === "directDm") dm += count;

    setBoostCredits(b);
    setSuperLikeCredits(sl);
    setDirectDmCredits(dm);

    await saveState(tier, b, sl, dm);
  };

  const hasFeature = (feature: "SEE_LIKES" | "PASSPORT" | "UNLIMITED_SWIPES" | "BEACONS" | "DIRECT_DM"): boolean => {
    if (tier === "VIP") return true;
    if (tier === "GOLD") {
      return feature === "SEE_LIKES" || feature === "UNLIMITED_SWIPES" || feature === "PASSPORT";
    }
    return false;
  };

  return (
    <PremiumContext.Provider
      value={{
        tier,
        isPremium,
        boostCredits,
        superLikeCredits,
        directDmCredits,
        paywallVisible,
        openPaywall,
        closePaywall,
        upgradeTier,
        buyCredits,
        hasFeature,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used inside PremiumProvider");
  return ctx;
}
