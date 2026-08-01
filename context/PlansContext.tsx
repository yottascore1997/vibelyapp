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

type ReqStatus = "none" | "pending" | "accepted" | "rejected";

interface PlansContextType {
  myPlans: Plan[];
  nearbyPlans: Plan[];
  loading: boolean;
  requestStatuses: Record<string, ReqStatus>;
  refresh: () => Promise<void>;
  createPlan: (input: CreatePlanInput) => Promise<Plan>;
  joinPlan: (planId: string) => Promise<void>;
  hasJoined: (planId: string) => boolean;
  getRequestStatus: (planId: string) => ReqStatus;
  respondToRequest: (planId: string, userId: string, accept: boolean) => Promise<void>;
  cancelJoinPlan: (planId: string, remark: string) => Promise<void>;
  cancelPlan: (planId: string, remark: string) => Promise<void>;
  removeParticipant: (planId: string, userId: string, remark: string) => Promise<void>;
  getRejectionRemark: (planId: string) => string;
}

const PlansContext = createContext<PlansContextType | null>(null);

function statusFromPlan(p: Plan & { myParticipationStatus?: string | null }, userId: string): ReqStatus {
  if (p.creatorId === userId) return "accepted";
  const mine = (p as any).myParticipationStatus as string | null | undefined;
  if (mine === "ACCEPTED") return "accepted";
  if (mine === "PENDING") return "pending";
  if (mine === "REJECTED") return "rejected";
  if (p.participants?.some((x) => x.id === userId)) return "accepted";
  if (p.requests?.some((x) => x.id === userId)) return "pending";
  return "none";
}

export function PlansProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [requestStatuses, setRequestStatuses] = useState<Record<string, ReqStatus>>({});
  const [rejectionRemarks, setRejectionRemarks] = useState<Record<string, string>>({});
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

      const statuses: Record<string, ReqStatus> = {};
      const remarks: Record<string, string> = {};
      for (const p of merged) {
        statuses[p.id] = statusFromPlan(p as any, user.id);
        const remark = (p as any).rejectRemark;
        if (remark) remarks[p.id] = String(remark);
      }
      setRequestStatuses(statuses);
      setRejectionRemarks((prev) => ({ ...prev, ...remarks }));
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
    (p) =>
      p.creatorId === user?.id ||
      p.participants?.some((x) => x.id === user?.id) ||
      p.requests?.some((x) => x.id === user?.id) ||
      requestStatuses[p.id] === "pending" ||
      requestStatuses[p.id] === "accepted"
  );
  const nearbyPlans = plans.filter((p) => p.creatorId !== user?.id);

  const createPlan = async (input: CreatePlanInput): Promise<Plan> => {
    if (!user) throw new Error("Login required");

    const { buildScheduledAt } = await import("../constants/plans");
    const scheduledAt = buildScheduledAt({
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
      kind: input.kind || "HANGOUT",
      latitude: input.latitude,
      longitude: input.longitude,
      visibility: input.visibility || (input.isPrivate ? "FRIENDS" : "PUBLIC"),
      isPrivate: input.isPrivate ?? input.visibility === "FRIENDS",
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
      if (!res) throw new Error("Could not send join request. Please try again.");

      const status = (res.status || "pending").toLowerCase() as ReqStatus;
      if (status === "accepted") {
        setRequestStatuses((s) => ({ ...s, [planId]: "accepted" }));
        setPlans((prev) =>
          prev.map((p) => {
            if (p.id !== planId) return p;
            const already = p.participants?.some((x) => x.id === user.id);
            return {
              ...p,
              going: already ? p.going : (p.going || 0) + 1,
              participants: already
                ? p.participants
                : [...(p.participants || []), { id: user.id, name: user.name, avatarUrl: undefined }],
            };
          })
        );
        Alert.alert("You're in!", `Joined "${planTitle}" successfully.`);
        try {
          await api.addJarItem({
            title: `Joined ${planTitle}`,
            type: "PLAN",
            description: plan?.location || undefined,
            meta: plan?.activity,
          });
        } catch {
          /* best-effort */
        }
      } else {
        setRequestStatuses((s) => ({ ...s, [planId]: "pending" }));
        setPlans((prev) =>
          prev.map((p) => {
            if (p.id !== planId) return p;
            const alreadyReq = p.requests?.some((x) => x.id === user.id);
            return {
              ...p,
              requests: alreadyReq
                ? p.requests
                : [...(p.requests || []), { id: user.id, name: user.name, avatarUrl: undefined }],
            };
          })
        );
        Alert.alert("Request sent", `Waiting for host to approve "${planTitle}".`);
      }
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

  const respondToRequest = async (planId: string, targetUserId: string, accept: boolean) => {
    if (!user) throw new Error("Login required");
    await api.respondToJoinRequest(planId, targetUserId, accept);
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const req = p.requests?.find((r) => r.id === targetUserId);
        const nextRequests = (p.requests || []).filter((r) => r.id !== targetUserId);
        if (accept && req) {
          return {
            ...p,
            going: (p.going || 0) + 1,
            requests: nextRequests,
            participants: [...(p.participants || []), req],
            status:
              (p.going || 0) + 1 >= p.maxParticipants ? "FULL" : p.status,
          };
        }
        return { ...p, requests: nextRequests };
      })
    );
    Alert.alert(accept ? "Accepted" : "Declined", accept ? "Member added to your plan." : "Request declined.");
    await refresh();
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
          going: Math.max(1, (p.going || 1) - 1),
          participants: p.participants?.filter((pt) => pt.id !== user.id) || [],
          requests: p.requests?.filter((r) => r.id !== user.id) || [],
        };
      })
    );
    Alert.alert("Done", "You left / cancelled your join request.");
    await refresh();
  };

  const cancelPlan = async (planId: string, remark: string) => {
    if (!user) throw new Error("Login required");
    await api.cancelPlan(planId, remark);
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, status: "CANCELLED", badge: "Cancelled" } : p))
    );
    Alert.alert("Cancelled", "Your plan has been cancelled.");
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
          going: Math.max(1, (p.going || 1) - 1),
          participants: p.participants?.filter((pt) => pt.id !== targetUserId) || [],
          status: p.status === "FULL" ? "OPEN" : p.status,
        };
      })
    );
    Alert.alert("Removed", "Participant removed from the hangout.");
    await refresh();
  };

  const getRejectionRemark = (planId: string) => rejectionRemarks[planId] || "";

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
        cancelPlan,
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
