import { api } from "./api";
import { getCurrentUserLocation } from "./location";

export type SpotBroadcastInput = {
  activityId: string;
  activityName: string;
  emoji: string;
  venue: string;
  durationMins: number;
};

export type SpotBroadcastResult = {
  hangoutId?: string;
  venue: string;
  vibe: string;
  emoji: string;
  duration: number;
  activityId: string;
};

/**
 * Broadcast a live Spot: set LESSGO + create a real PUBLIC hangout with GPS + TTL.
 */
export async function broadcastLiveSpot(
  input: SpotBroadcastInput
): Promise<SpotBroadcastResult> {
  const venue = input.venue.trim() || `${input.emoji} ${input.activityName}`;
  const now = new Date();
  const end = new Date(now.getTime() + input.durationMins * 60 * 1000);
  const activityLabel = `${input.emoji} at ${venue}`;

  let latitude: number | undefined;
  let longitude: number | undefined;
  try {
    const loc = await getCurrentUserLocation({ highAccuracy: true });
    if (loc.ok) {
      latitude = loc.location.latitude;
      longitude = loc.location.longitude;
      await api.updateLocation({
        latitude,
        longitude,
        city: loc.location.city,
      }).catch(() => undefined);
    }
  } catch {
    // continue without GPS
  }

  await api
    .updateSocialStatus({
      energy: "LESSGO",
      freeNow: true,
      activityName: activityLabel,
      timeLabel: `Next ${input.durationMins} min`,
      freeUntil: end.toISOString(),
    })
    .catch(() => undefined);

  let hangoutId: string | undefined;
  try {
    const plan = await api.createPlan({
      title: `${input.emoji} Live Spot · ${venue}`,
      description: `Live Spot for ${input.durationMins} mins — join now!`,
      location: venue,
      scheduledAt: now.toISOString(),
      endDate: end.toISOString(),
      maxParticipants: 8,
      activity: input.activityName,
      kind: "HANGOUT",
      latitude,
      longitude,
      visibility: "PUBLIC",
      isPrivate: false,
    });
    hangoutId = plan?.id;
  } catch {
    // Spot still usable without hangout
  }

  return {
    hangoutId,
    venue,
    vibe: input.activityName,
    emoji: input.emoji,
    duration: input.durationMins,
    activityId: input.activityId,
  };
}
