import { useEffect, useRef } from "react";
import { Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

/** Extract invite code from hangora web or vibematch deep links */
function parseInviteCode(url: string): string | null {
  try {
    const cleaned = url.trim();
    const schemeMatch = cleaned.match(/^[a-z]+:\/\/p\/([A-Za-z0-9_-]+)/i);
    if (schemeMatch?.[1]) return schemeMatch[1];

    const parsed = new URL(cleaned);
    const path = parsed.pathname || "";
    const webMatch = path.match(/\/p\/([A-Za-z0-9_-]+)/i);
    if (webMatch?.[1]) return webMatch[1];

    const q = parsed.searchParams.get("invite") || parsed.searchParams.get("code");
    if (q) return q;
  } catch {
    const m = url.match(/\/p\/([A-Za-z0-9_-]+)/i);
    if (m?.[1]) return m[1];
  }
  return null;
}

/**
 * Opens WhatsApp / universal links into the app and joins the hangout when logged in.
 */
export default function InviteDeepLinkHandler() {
  const router = useRouter();
  const { user, token } = useAuth();
  const handling = useRef(false);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || handling.current) return;
      const code = parseInviteCode(url);
      if (!code) return;

      handling.current = true;
      try {
        if (!user || !token) {
          Alert.alert(
            "Join this hang",
            "Log in with your phone to join this invite.",
            [{ text: "OK", onPress: () => router.push("/(auth)/login") }]
          );
          return;
        }

        const invite = await api.getPublicInvite(code).catch(() => null);
        const hangoutId = invite?.hangoutId || invite?.hangout?.id || null;

        if (hangoutId) {
          await api.joinPlan(hangoutId, "Joined via invite link").catch(() => undefined);
          Alert.alert("You're in!", "Opening the hangout…");
          router.push({ pathname: "/plan-details", params: { id: String(hangoutId) } });
        } else {
          Alert.alert(
            "Invite opened",
            invite?.activityName
              ? `${invite.activityEmoji || ""} ${invite.activityName} — check Hangout for plans.`
              : "Invite accepted. Check Hangout for plans."
          );
          router.push("/hangout");
        }
      } finally {
        setTimeout(() => {
          handling.current = false;
        }, 1500);
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [user, token, router]);

  return null;
}
