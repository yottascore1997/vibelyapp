import { useEffect, useRef } from "react";
import { Alert, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const PENDING_INVITE_KEY = "@hangora_pending_invite_code";

/** Extract invite code from hangora web or app deep links */
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

async function openInviteInApp(
  code: string,
  opts: {
    user: { id?: string; name?: string } | null;
    token: string | null;
    router: ReturnType<typeof useRouter>;
  }
) {
  const { user, token, router } = opts;

  if (!user || !token) {
    await AsyncStorage.setItem(PENDING_INVITE_KEY, code);
    Alert.alert(
      "Join this hang",
      "Log in with your phone — we'll open the invite right after.",
      [{ text: "OK", onPress: () => router.push("/(auth)/login") }]
    );
    return;
  }

  await AsyncStorage.removeItem(PENDING_INVITE_KEY).catch(() => undefined);

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
        : "Invite opened. Check Hangout for plans."
    );
    router.push("/hangout");
  }
}

/**
 * Opens WhatsApp / universal / app-scheme links into Hangora and joins the hangout.
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
        await openInviteInApp(code, { user, token, router });
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

  // After login: resume invite saved from web → Open in App
  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      const code = await AsyncStorage.getItem(PENDING_INVITE_KEY);
      if (!code || handling.current) return;
      handling.current = true;
      try {
        await openInviteInApp(code, { user, token, router });
      } finally {
        setTimeout(() => {
          handling.current = false;
        }, 1500);
      }
    })();
  }, [user, token, router]);

  return null;
}
