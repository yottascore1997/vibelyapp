import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { useAuth } from "./AuthContext";
import { api } from "../services/api";
import { Plan } from "../constants/plans";

const STORAGE_KEY = "@vibematch_plans";
const REQUESTS_KEY = "@vibematch_request_statuses";
const REMARKS_KEY = "@vibematch_rejection_remarks";

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
  const [localPlans, setLocalPlans] = useState<Plan[]>([]);
  const [requestStatuses, setRequestStatuses] = useState<Record<string, "none" | "pending" | "accepted" | "rejected">>({});
  const [rejectionRemarks, setRejectionRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Load from Storage on mount
  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEY, REQUESTS_KEY, REMARKS_KEY]).then(([plans, requests, remarks]) => {
      if (plans[1]) setLocalPlans(JSON.parse(plans[1]));
      if (requests[1]) setRequestStatuses(JSON.parse(requests[1]));
      if (remarks[1]) setRejectionRemarks(JSON.parse(remarks[1]));
    });
  }, []);

  const persistLocal = async (plans: Plan[]) => {
    setLocalPlans(plans);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  };

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [mine, nearby] = await Promise.all([
        api.getMyPlans(user.id),
        api.getNearbyPlans(user.id),
      ]);
      if (mine?.length || nearby?.length) {
        await persistLocal([...(mine || []), ...(nearby || [])].filter(
          (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
        ));
      }
    } catch {
      // keep local
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const myPlans = localPlans.filter((p) => p.creatorId === user?.id);
  const nearbyPlans = localPlans.filter((p) => p.creatorId !== user?.id);

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
    const description = input.description?.trim() || undefined;
    const hasSchedule = Boolean(
      input.timeId || input.dateId || input.customDate || input.customTime
    );

    let plan: Plan | null = null;
    try {
      plan = await api.createPlan({
        title,
        description,
        location: input.location || undefined,
        scheduledAt: scheduledAt.toISOString(),
        maxParticipants: input.maxParticipants || 8,
        creatorId: user.id,
        activity: input.activityName,
        imageUrl: input.imageUrl,
        distance: 1.2,
      });
    } catch {
      // local fallback
    }

    if (!plan) {
      plan = {
        id: `local-${Date.now()}`,
        title,
        description,
        location: input.location || undefined,
        distance: 1.2,
        scheduledAt: scheduledAt.toISOString(),
        time: scheduledAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
        timeLabel: hasSchedule ? `${dateLabel} · ${timeLabel}` : "Anytime · Flexible",
        maxParticipants: input.maxParticipants || 8,
        going: 1,
        activity: input.activityName,
        badge: "New",
        color: "#8A56FF",
        imageUrl: input.imageUrl,
        creatorId: user.id,
        creatorName: user.name,
        participants: [{ id: user.id, name: user.name, avatarUrl: undefined }],
        requests: [], // Start with empty requests
      };
    }

    const finalPlan = plan as Plan;
    const updatedPlans = [finalPlan, ...localPlans.filter((p) => p.id !== finalPlan.id)];
    await persistLocal(updatedPlans);

    return plan;
  };

  // Join plan immediately via API (honest join — no fake timer)
  const joinPlan = async (planId: string) => {
    if (!user) throw new Error("Login required");
    if (requestStatuses[planId] === "accepted") return;

    const plan = localPlans.find((p) => p.id === planId);
    const planTitle = plan ? plan.title : "the plan";

    // Optimistic pending while request in flight
    const pendingStatuses = { ...requestStatuses, [planId]: "pending" as const };
    setRequestStatuses(pendingStatuses);
    await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(pendingStatuses));

    try {
      const res = await api.joinPlan(planId);
      if (!res) {
        const reverted = { ...requestStatuses, [planId]: "none" as const };
        setRequestStatuses(reverted);
        await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(reverted));
        throw new Error("Could not join plan. Please try again.");
      }

      const accepted = { ...requestStatuses, [planId]: "accepted" as const };
      setRequestStatuses(accepted);
      await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(accepted));

      setLocalPlans((prevPlans) => {
        const updated = prevPlans.map((p) => {
          if (p.id !== planId) return p;
          const already = p.participants?.some((x) => x.id === user.id);
          return {
            ...p,
            going: already ? p.going : p.going + 1,
            participants: already
              ? p.participants
              : [...(p.participants || []), { id: user.id, name: user.name, avatarUrl: undefined }],
          };
        });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      Alert.alert("You're in!", `Joined "${planTitle}" successfully.`);
    } catch (err) {
      const reverted = { ...requestStatuses, [planId]: "none" as const };
      setRequestStatuses(reverted);
      await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(reverted));
      throw err instanceof Error ? err : new Error("Join failed");
    }
  };

  const hasJoined = (planId: string) => requestStatuses[planId] === "accepted";
  const getRequestStatus = (planId: string) => requestStatuses[planId] || "none";

  // Owner accepting/rejecting a participant's request
  const respondToRequest = async (planId: string, participantId: string, accept: boolean) => {
    if (!user) throw new Error("Login required");

    setLocalPlans((prevPlans) => {
      const updated = prevPlans.map((p) => {
        if (p.id !== planId) return p;

        const filteredRequests = p.requests?.filter((r: any) => r.id !== participantId) || [];

        if (accept) {
          const alreadyParticipant = p.participants?.some((x) => x.id === participantId);
          const requesterInfo = p.requests?.find((r: any) => r.id === participantId);

          return {
            ...p,
            going: alreadyParticipant ? p.going : p.going + 1,
            requests: filteredRequests,
            participants: alreadyParticipant
              ? p.participants
              : [
                  ...(p.participants || []),
                  {
                    id: participantId,
                    name: requesterInfo?.name || "Attendee",
                    avatarUrl: requesterInfo?.avatarUrl || null,
                  },
                ],
          };
        } else {
          return {
            ...p,
            requests: filteredRequests,
          };
        }
      });

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    Alert.alert(
      "Request Response",
      accept ? "Request approved! The member is now part of the hangout." : "Request declined."
    );
  };

  // Participant cancelling their join request / leaving
  const cancelJoinPlan = async (planId: string, remark: string) => {
    if (!user) throw new Error("Login required");

    // Reset status to none
    const newStatuses = { ...requestStatuses, [planId]: "none" as const };
    setRequestStatuses(newStatuses);
    await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(newStatuses));

    // Remove user from participants list
    setLocalPlans((prevPlans) => {
      const updated = prevPlans.map((p) => {
        if (p.id !== planId) return p;
        const filteredParticipants = p.participants?.filter((pt) => pt.id !== user.id) || [];
        const wasGoing = p.participants?.some((pt) => pt.id === user.id);
        return {
          ...p,
          going: wasGoing ? Math.max(1, p.going - 1) : p.going,
          participants: filteredParticipants,
        };
      });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    // Save cancellation reason
    const remarks = { ...rejectionRemarks, [planId]: `You cancelled: ${remark}` };
    setRejectionRemarks(remarks);
    await AsyncStorage.setItem(REMARKS_KEY, JSON.stringify(remarks));

    Alert.alert("Success", "You have left this hangout.");
  };

  // Host removing a participant with a reason/remark
  const removeParticipant = async (planId: string, userId: string, remark: string) => {
    if (!user) throw new Error("Login required");

    setLocalPlans((prevPlans) => {
      const updated = prevPlans.map((p) => {
        if (p.id !== planId) return p;
        const filteredParticipants = p.participants?.filter((pt) => pt.id !== userId) || [];
        const wasGoing = p.participants?.some((pt) => pt.id === userId);
        return {
          ...p,
          going: wasGoing ? Math.max(1, p.going - 1) : p.going,
          participants: filteredParticipants,
        };
      });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    // If the removed user is the current user (on this simulator), update their request status
    if (userId === user.id) {
      const newStatuses = { ...requestStatuses, [planId]: "rejected" as const };
      setRequestStatuses(newStatuses);
      await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(newStatuses));
    }

    // Save removal remark
    const remarks = { ...rejectionRemarks, [planId]: `Removed by Host: ${remark}` };
    setRejectionRemarks(remarks);
    await AsyncStorage.setItem(REMARKS_KEY, JSON.stringify(remarks));

    Alert.alert("Removed", `Participant has been removed with remark: "${remark}"`);
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
