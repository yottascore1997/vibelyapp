import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { VibeFonts } from "../../constants/vibeTheme";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

const CATEGORIES = [
  { id: "Food & Drinks", label: "🍕 Food & Drinks", emoji: "🍕" },
  { id: "Tickets", label: "🎟️ Tickets & Entry", emoji: "🎟️" },
  { id: "Transport", label: "🚗 Transport", emoji: "🚗" },
  { id: "Other", label: "🍿 Other / Misc", emoji: "🍿" },
];

export default function VibeSplitModal({
  visible,
  onClose,
  hangoutId,
  eventId,
  titleName = "Hangout",
}: {
  visible: boolean;
  onClose: () => void;
  hangoutId?: string;
  eventId?: string;
  titleName?: string;
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"BALANCES" | "EXPENSES">("BALANCES");
  const [loading, setLoading] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);

  // Add Expense form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food & Drinks");
  const [adding, setAdding] = useState(false);

  const loadData = useCallback(async () => {
    if (!hangoutId && !eventId) return;
    setLoading(true);
    try {
      const res = await api.getExpenses({ hangoutId, eventId });
      if (res && res.success) {
        setTotalSpent(res.totalSpent || 0);
        setExpenses(res.expenses || []);
        setBalances(res.memberBalances || []);
      }
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [hangoutId, eventId]);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, loadData]);

  const handleAddExpense = async () => {
    if (!title.trim() || !amount.trim() || !user) {
      Alert.alert("Missing Fields", "Please enter a title and amount.");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid expense amount.");
      return;
    }

    setAdding(true);
    try {
      const res = await api.addExpense({
        hangoutId,
        eventId,
        payerId: user.id,
        title: title.trim(),
        amount: numAmount,
        category,
      });

      if (res && res.success) {
        Alert.alert("Expense Added! 💳", `Added ₹${numAmount} for ${title}.`);
        setTitle("");
        setAmount("");
        setShowAddForm(false);
        loadData();
      } else {
        Alert.alert("Error", "Could not add expense.");
      }
    } catch {
      Alert.alert("Error", "Failed to add expense.");
    } finally {
      setAdding(false);
    }
  };

  const handleSettle = async (splitId: string, memberName: string) => {
    try {
      const res = await api.settleExpenseSplit(splitId);
      if (res && res.success) {
        Alert.alert("Settled! 🤝", `Marked ${memberName}'s balance as settled.`);
        loadData();
      }
    } catch {
      Alert.alert("Error", "Could not settle balance.");
    }
  };

  const handleSendWhatsAppBill = async (member: {
    name: string;
    phone?: string | null;
    netBalance: number;
    owedTotal: number;
    pendingSplits?: { expenseTitle: string; amount: number }[];
  }) => {
    const oweAmount = Math.abs(Math.min(0, member.netBalance)) || member.owedTotal || 0;
    if (oweAmount <= 0) {
      Alert.alert("Nothing due", `${member.name} doesn't owe anything right now.`);
      return;
    }

    const lines = (member.pendingSplits || [])
      .map((s) => `• ${s.expenseTitle}: ₹${Math.round(s.amount)}`)
      .join("\n");

    const hostName = user?.name?.split(" ")[0] || "Host";
    const summary =
      `Hey ${member.name.split(" ")[0]}! 👋\n\n` +
      `Bill summary from Hangora (${titleName})\n` +
      `Your share: ₹${Math.round(oweAmount).toLocaleString("en-IN")}\n` +
      (lines ? `\nDetails:\n${lines}\n` : "\n") +
      `\nPlease pay ${hostName} when you can. Thanks! 🙏`;

    const digits = (member.phone || "").replace(/\D/g, "");
    // Prefer Indian numbers: if 10 digits, prefix 91
    const waPhone =
      digits.length === 10
        ? `91${digits}`
        : digits.length > 10
          ? digits.replace(/^0+/, "")
          : digits;

    try {
      if (waPhone.length >= 10) {
        const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(summary)}`;
        const can = await Linking.canOpenURL(url);
        if (can) {
          await Linking.openURL(url);
          return;
        }
      }
      // Fallback: open WhatsApp with text only (host picks contact)
      const fallback = `https://wa.me/?text=${encodeURIComponent(summary)}`;
      await Linking.openURL(fallback);
    } catch {
      Alert.alert("WhatsApp", "Could not open WhatsApp. Copy this summary:\n\n" + summary);
    }
  };

  const myBalanceObj = balances.find((b) => b.userId === user?.id);
  const myNet = myBalanceObj?.netBalance || 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top Grab Handle */}
          <View style={styles.grabHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.headerTitle}>VibeSplit 💳💸</Text>
                <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>BILL SPLITTER</Text>
                </LinearGradient>
              </View>
              <Text style={styles.headerSub}>{titleName} Shared Expenses</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Cards Summary Dashboard */}
          <View style={styles.summaryRow}>
            <LinearGradient colors={["#2E1065", "#1E1B4B"]} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>TOTAL SPENT</Text>
              <Text style={styles.summaryValueSpent}>₹{totalSpent.toLocaleString("en-IN")}</Text>
            </LinearGradient>

            <LinearGradient
              colors={
                myNet > 0
                  ? ["#064E3B", "#022C22"]
                  : myNet < 0
                  ? ["#881337", "#4C0519"]
                  : ["#1F2937", "#111827"]
              }
              style={styles.summaryCard}
            >
              <Text style={styles.summaryLabel}>YOUR NET BALANCE</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: myNet > 0 ? "#34D399" : myNet < 0 ? "#F87171" : "#9CA3AF" },
                ]}
              >
                {myNet > 0
                  ? `+₹${myNet.toLocaleString("en-IN")}`
                  : myNet < 0
                  ? `-₹${Math.abs(myNet).toLocaleString("en-IN")}`
                  : "₹0 (Settled)"}
              </Text>
            </LinearGradient>
          </View>

          {/* Segmented Switcher */}
          <View style={styles.tabRow}>
            <Pressable
              onPress={() => setActiveTab("BALANCES")}
              style={[styles.tabBtn, activeTab === "BALANCES" && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === "BALANCES" && styles.tabBtnTextActive]}>
                Balances & Settle 🤝
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("EXPENSES")}
              style={[styles.tabBtn, activeTab === "EXPENSES" && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === "EXPENSES" && styles.tabBtnTextActive]}>
                Expenses ({expenses.length}) 🧾
              </Text>
            </Pressable>
          </View>

          {/* Body Content */}
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#A78BFA" />
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {activeTab === "BALANCES" ? (
                <View style={{ gap: 10, paddingBottom: 16 }}>
                  {balances.length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <Text style={styles.emptyEmoji}>💸</Text>
                      <Text style={styles.emptyTitle}>No shared balances yet</Text>
                      <Text style={styles.emptySub}>Add an expense below to automatically split bills!</Text>
                    </View>
                  ) : (
                    balances.map((b) => {
                      const isMe = b.userId === user?.id;
                      const isOwed = b.netBalance > 0;
                      const owes = b.netBalance < 0;
                      const isWaGuest = Boolean(b.isWhatsAppGuest);
                      const firstPendingSplit = b.pendingSplits && b.pendingSplits.length > 0 ? b.pendingSplits[0].splitId : null;

                      return (
                        <View key={b.userId} style={styles.memberCard}>
                          <Image source={{ uri: b.avatarUrl }} style={styles.memberAvatar} />
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <Text style={styles.memberName}>{b.name}</Text>
                              {isMe && (
                                <View style={styles.youBadge}>
                                  <Text style={styles.youBadgeText}>YOU</Text>
                                </View>
                              )}
                              {isWaGuest ? (
                                <View style={styles.waBadge}>
                                  <Ionicons name="logo-whatsapp" size={10} color="#fff" />
                                  <Text style={styles.waBadgeText}>WA</Text>
                                </View>
                              ) : null}
                            </View>
                            <Text style={styles.memberSub}>
                              Paid ₹{b.paidTotal} · Owes ₹{b.owedTotal}
                            </Text>
                          </View>

                          <View style={{ alignItems: "flex-end", gap: 4 }}>
                            <Text
                              style={[
                                styles.balanceText,
                                { color: isOwed ? "#34D399" : owes ? "#F87171" : "#9CA3AF" },
                              ]}
                            >
                              {isOwed
                                ? `+₹${b.netBalance} (Gets back)`
                                : owes
                                ? `-₹${Math.abs(b.netBalance)} (Owes)`
                                : "Settled ✨"}
                            </Text>

                            {owes && !isMe ? (
                              <View style={{ gap: 4, alignItems: "flex-end" }}>
                                {(isWaGuest || b.phone) ? (
                                  <Pressable
                                    onPress={() => handleSendWhatsAppBill(b)}
                                    style={styles.waBillBtn}
                                  >
                                    <Ionicons name="logo-whatsapp" size={13} color="#fff" />
                                    <Text style={styles.settleBtnText}>WhatsApp bill</Text>
                                  </Pressable>
                                ) : null}
                                <Pressable
                                  onPress={() => handleSettle(firstPendingSplit || b.userId, b.name)}
                                  style={styles.settleBtn}
                                >
                                  <LinearGradient
                                    colors={["#10B981", "#059669"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.settleBtnGrad}
                                  >
                                    <Ionicons name="checkmark-circle" size={13} color="#FFF" />
                                    <Text style={styles.settleBtnText}>Settle Up</Text>
                                  </LinearGradient>
                                </Pressable>
                              </View>
                            ) : null}

                            {!owes && !isMe && isWaGuest && b.owedTotal === 0 && b.paidTotal === 0 ? (
                              <View style={styles.waGuestHint}>
                                <Text style={styles.waGuestHintText}>In split · add expense</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              ) : (
                <View style={{ gap: 10, paddingBottom: 16 }}>
                  {expenses.length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <Text style={styles.emptyEmoji}>🧾</Text>
                      <Text style={styles.emptyTitle}>No expense receipts</Text>
                      <Text style={styles.emptySub}>Add shared expenses for food, tickets, or transport!</Text>
                    </View>
                  ) : (
                    expenses.map((exp) => {
                      const perPerson = exp.splits && exp.splits.length > 0 ? Math.round(exp.amount / exp.splits.length) : exp.amount;
                      return (
                        <View key={exp.id} style={styles.expenseCard}>
                          <View style={styles.expIconWrap}>
                            <Text style={{ fontSize: 20 }}>
                              {CATEGORIES.find((c) => c.id === exp.category)?.emoji || "💳"}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.expTitle}>{exp.title}</Text>
                            <Text style={styles.expSub}>
                              Paid by <Text style={{ color: "#D1D5DB" }}>{exp.payer?.name?.split(" ")[0] || "Member"}</Text> · {exp.splits?.length || 1} people
                            </Text>
                          </View>
                          <View style={{ alignItems: "flex-end", gap: 2 }}>
                            <Text style={styles.expAmount}>₹{exp.amount.toLocaleString("en-IN")}</Text>
                            <View style={styles.perPersonPill}>
                              <Text style={styles.perPersonText}>₹{perPerson}/person</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </ScrollView>
          )}

          {/* Add Expense Form / Launch Button */}
          {showAddForm ? (
            <View style={styles.addFormContainer}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={styles.addFormTitle}>Add New Shared Expense 💳</Text>
                <Pressable onPress={() => setShowAddForm(false)}>
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </Pressable>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Title (e.g. Pizza & Beer)"
                placeholderTextColor="#6B7280"
                value={title}
                onChangeText={setTitle}
              />

              <View style={{ position: "relative" }}>
                <TextInput
                  style={styles.input}
                  placeholder="Amount in ₹ (e.g. 1200)"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              {/* Quick Amount Presets */}
              <View style={styles.presetRow}>
                {["200", "500", "1000", "2000"].map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => setAmount(preset)}
                    style={styles.presetChip}
                  >
                    <Text style={styles.presetChipText}>+₹{preset}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Category Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 8 }}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    style={[
                      styles.catChip,
                      category === cat.id && styles.catChipActive,
                    ]}
                  >
                    <Text style={[styles.catChipText, category === cat.id && styles.catChipTextActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                <Pressable onPress={() => setShowAddForm(false)} style={styles.cancelFormBtn}>
                  <Text style={styles.cancelFormText}>Cancel</Text>
                </Pressable>
                <Pressable disabled={adding} onPress={handleAddExpense} style={{ flex: 1 }}>
                  <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.submitFormBtn}>
                    {adding ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.submitFormText}>+ Add Expense 🚀</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setShowAddForm(true)} style={{ marginTop: 10 }}>
              <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.addExpenseBtn}>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.addExpenseBtnText}>+ Add New Expense</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5, 3, 15, 0.78)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#0D091B",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    paddingTop: 12,
    maxHeight: "88%",
    minHeight: "68%",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  grabHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "center",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: "#F9FAFB",
    letterSpacing: -0.3,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillBadgeText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#9CA3AF",
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  summaryLabel: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#9CA3AF",
    letterSpacing: 0.5,
  },
  summaryValueSpent: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#C4B5FD",
    marginTop: 3,
  },
  summaryValue: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    marginTop: 3,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 16,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "rgba(139, 92, 246, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.5)",
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#9CA3AF",
  },
  tabBtnTextActive: {
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#F9FAFB",
  },
  emptySub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "rgba(139, 92, 246, 0.5)",
  },
  memberName: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#F9FAFB",
  },
  youBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youBadgeText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#C4B5FD",
  },
  waBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#16A34A",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  waBadgeText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },
  waBillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#16A34A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  waGuestHint: {
    backgroundColor: "rgba(22, 163, 74, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  waGuestHintText: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "#86EFAC",
  },
  memberSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#9CA3AF",
    marginTop: 2,
  },
  balanceText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  settleBtn: {
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 2,
  },
  settleBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  settleBtnText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  expenseCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  expIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(139, 92, 246, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  expTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#F9FAFB",
  },
  expSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#9CA3AF",
    marginTop: 2,
  },
  expAmount: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: "#C4B5FD",
  },
  perPersonPill: {
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  perPersonText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#F472B6",
  },
  addFormContainer: {
    backgroundColor: "rgba(30, 20, 55, 0.95)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
    marginTop: 10,
  },
  addFormTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: "#C4B5FD",
  },
  input: {
    backgroundColor: "rgba(15, 10, 30, 0.8)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: "#F9FAFB",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    alignItems: "center",
  },
  presetChipText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#A78BFA",
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  catChipActive: {
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    borderColor: "#A78BFA",
  },
  catChipText: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#9CA3AF",
  },
  catChipTextActive: {
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  cancelFormBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelFormText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#9CA3AF",
  },
  submitFormBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitFormText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  addExpenseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
  },
  addExpenseBtnText: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
});
