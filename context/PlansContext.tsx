import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Alert } from "react-native";
import { useAuth } from "./AuthContext";
import { api } from "../services/api";
import { Plan } from "../constants/plans";

interface CreatePlanInput {
  activityId: string;
  activityName: string;
  emoji: string;
  timeId?: string;
  dateId?: string;
  customDate?: string;
  customTime?: string;
  location?: string;
  description?: string;
  maxParticipants?: number;
  imageUrl?: string;
  kind?: "HANGOUT" | "EVENT" | "TRAVEL";
  destination?: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
  visibility?: "PUBLIC" | "FRIENDS" | string;
  isPrivate?: boolean;
}

interface PlansContextType {
  myPlans: Plan[];
  nearbyPlans: Plan[];
  loading: boolean;
  requestStatuses: Record<string, "none" | "pending" | "accepted" | "rejected">;
  refresh: () => Promise<void>;
  createPlan: (input: CreatePlanInput) => Promise<Plan>;
  joinPlan: (planId: string) => Promise<void>;
  hasJoined: (planId: string) => boolean;
  getRequestStatus: (planId: string) => "none" | "pending" | "accepted" | "rejected";
  respondToRequest: (planId: string, userId: string, accept: boolean) => Promise<void>;
  cancelJoinPlan: (planId: string, remark: string) => Promise<void>;
  removeParticipant: (planId: string, userId: string, remark: string) => Promise<void>;
  getRejectionRemark: (planId: string) => string;
}

const PlansContext = createContext<PlansContextType | null>(null);

export function PlansProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [requestStatuses, setRequestStatuses] = useState<
    Record<string, "none" | "pending" | "accepted" | "rejected">
  >({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [mine, nearby] = await Promise.all([
        api.getMyPlans(user.id),
        api.getNearbyPlans(user.id),
      ]);
      const merged = [...(mine || []), ...(nearby || [])].filter(
        (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
      );
      setPlans(merged);

      const statuses: Record<string, "none" | "pending" | "accepted" | "rejected"> = {};
      for (const p of merged) {
        if (p.creatorId === user.id || p.participants?.some((x) => x.id === user.id)) {
          statuses[p.id] = "accepted";
        }
      }
      setRequestStatuses(statuses);
    } catch {
      // keep previous
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const myPlans = plans.filter(
    (p) => p.creatorId === user?.id || p.participants?.some((x) => x.id === user?.id)
  );
  const nearbyPlans = plans.filter((p) => p.creatorId !== user?.id);

  const createPlan = async (input: CreatePlanInput): Promise<Plan> => {
    if (!user) throw new Error("Login required");

    const { buildScheduledAt, formatPlanSchedule } = await import("../constants/plans");
    const scheduledAt = buildScheduledAt({
      timeId: input.timeId,
      dateId: input.dateId,
      customDate: input.customDate,
      customTime: input.customTime,
    });
    const { timeLabel, dateLabel } = formatPlanSchedule({
      timeId: input.timeId,
      dateId: input.dateId,
      customDate: input.customDate,
      customTime: input.customTime,
    });
    const title = `${input.emoji} ${input.activityName} Plan`;

    const plan = await api.createPlan({
      title,
      description: input.description?.trim() || undefined,
      location: input.location || input.destination || undefined,
      destination: input.destination,
      scheduledAt: scheduledAt.toISOString(),
      endDate: input.endDate,
      maxParticipants: input.maxParticipants || 8,
      activity: input.activityName,
      imageUrl: input.imageUrl,
      distance: 1.2,
      kind: input.kind || "HANGOUT",
      latitude: input.latitude,
      longitude: input.longitude,
      visibility: input.visibility || (input.isPrivate ? "FRIENDS" : "PUBLIC"),
      isPrivate: input.isPrivate ?? (input.visibility === "FRIENDS"),
    });

    if (!plan) throw new Error("Could not create plan. Check your connection.");

    setPlans((prev) => [plan, ...prev.filter((p) => p.id !== plan.id)]);
    setRequestStatuses((s) => ({ ...s, [plan.id]: "accepted" }));
    return plan;
  };

  const joinPlan = async (planId: string) => {
    if (!user) throw new Error("Login required");
    if (requestStatuses[planId] === "accepted") return;

    const plan = plans.find((p) => p.id === planId);
    const planTitle = plan ? plan.title : "the plan";

    setRequestStatuses((s) => ({ ...s, [planId]: "pending" }));

    try {
      const res = await api.joinPlan(planId);
      if (!res) throw new Error("Could not join plan. Please try again.");

      setRequestStatuses((s) => ({ ...s, [planId]: "accepted" }));
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id !== planId) return p;
          const already = p.participants?.some((x) => x.id === user.id);
          return {
            ...p,
            going: already ? p.going : p.going + 1,
            participants: already
              ? p.participants
              : [...(p.participants || []), { id: user.id, name: user.name, avatarUrl: undefined }],
          };
        })
      );

      try {
        await api.addJarItem({
          title: `Joined ${planTitle}`,
          type: "PLAN",
          description: plan?.location || undefined,
          meta: plan?.activity,
        });
      } catch {
        // jar save is best-effort
      }

      Alert.alert("You're in!", `Joined "${planTitle}" successfully.`);
    } catch (err) {
      setRequestStatuses((s) => ({ ...s, [planId]: "none" }));
      throw err instanceof Error ? err : new Error("Join failed");
    }
  };

  const hasJoined = (planId: string) => {
    if (requestStatuses[planId] === "accepted") return true;
    return plans.some((p) => p.id === planId && p.participants?.some((x) => x.id === user?.id));
  };

  const getRequestStatus = (planId: string) => requestStatuses[planId] || "none";

  const respondToRequest = async (_planId: string, _participantId: string, _accept: boolean) => {
    Alert.alert("Instant join", "Plans join instantly — no approval queue needed.");
  };

  const cancelJoinPlan = async (planId: string, _remark: string) => {
    if (!user) throw new Error("Login required");
    await api.leavePlan(planId);
    setRequestStatuses((s) => ({ ...s, [planId]: "none" }));
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        return {
          ...p,
          going: Math.max(1, p.going - 1),
          participants: p.participants?.filter((pt) => pt.id !== user.id) || [],
        };
      })
    );
    Alert.alert("Left", "You have left this hangout.");
    await refresh();
  };

  const removeParticipant = async (planId: string, targetUserId: string, remark: string) => {
    if (!user) throw new Error("Login required");
    await api.kickFromPlan(planId, targetUserId, remark);
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        return {
          ...p,
          going: Math.max(1, p.going - 1),
          participants: p.participants?.filter((pt) => pt.id !== targetUserId) || [],
        };
      })
    );
    Alert.alert("Removed", "Participant removed from the hangout.");
    await refresh();
  };

  const getRejectionRemark = () => "";

  return (
    <PlansContext.Provider
      value={{
        myPlans,
        nearbyPlans,
        loading,
        requestStatuses,
        refresh,
        createPlan,
        joinPlan,
        hasJoined,
        getRequestStatus,
        respondToRequest,
        cancelJoinPlan,
        removeParticipant,
        getRejectionRemark,
      }}
    >
      {children}
    </PlansContext.Provider>
  );
}

export function usePlans() {
  const ctx = useContext(PlansContext);
  if (!ctx) throw new Error("usePlans must be used within PlansProvider");
  return ctx;
}
