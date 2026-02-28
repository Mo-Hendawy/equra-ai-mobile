import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Platform, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Card } from "@/components/Card";
import { FormInput } from "@/components/FormInput";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { holdingsStorage, realizedGainsStorage, transactionsStorage } from "@/lib/storage";
import { TransactionHistory } from "@/components/TransactionHistory";
import { StockAnalysis } from "@/components/StockAnalysis";
import { SentimentGauge } from "@/components/SentimentGauge";
import { TransactionImportModal } from "@/components/TransactionImportModal";
import { ManusDeepAnalysis } from "@/components/ManusDeepAnalysis";
import { STOCK_ROLES, STOCK_STATUSES } from "@/constants/egxStocks";
import type { PortfolioHolding, StockTransaction } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "HoldingDetail">;
type RouteProps = RouteProp<RootStackParamList, "HoldingDetail">;

export default function HoldingDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();

  // 🔍 DEBUG LOGGING
  console.log("📐 HOLDING DETAIL LAYOUT:", {
    headerHeight,
    insetsTop: insets.top,
    insetsBottom: insets.bottom,
    spacingLg: Spacing.lg,
  });

  const [holding, setHolding] = useState<PortfolioHolding | null>(null);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [currentPrice, setCurrentPrice] = useState("");
  const [fairValueBase, setFairValueBase] = useState("");
  const [fairValueMid, setFairValueMid] = useState("");
  const [fairValueHigh, setFairValueHigh] = useState("");
  const [eps, setEps] = useState("");
  const [growthRate, setGrowthRate] = useState("");
  const [bookValue, setBookValue] = useState("");
  const [notes, setNotes] = useState("");
  const [importModalVisible, setImportModalVisible] = useState(false);

  const loadHolding = useCallback(async () => {
    try {
      const [data, txData] = await Promise.all([
        holdingsStorage.getById(route.params.holdingId),
        transactionsStorage.getByHolding(route.params.holdingId),
      ]);
      if (data) {
        setHolding(data);
        setCurrentPrice(data.currentPrice.toString());
        setFairValueBase(data.fairValueBase?.toString() || "");
        setFairValueMid(data.fairValueMid?.toString() || "");
        setFairValueHigh(data.fairValueHigh?.toString() || "");
        setEps(data.eps?.toString() || "");
        setGrowthRate(data.growthRate?.toString() || "");
        setBookValue(data.bookValue?.toString() || "");
        setNotes(data.notes || "");
      }
      setTransactions(txData);
    } catch (error) {
      console.error("Failed to load holding:", error);
    }
  }, [route.params.holdingId]);

  useFocusEffect(
    useCallback(() => {
      loadHolding();
    }, [loadHolding])
  );

  useEffect(() => {
    console.log("🔧 SETTING HEADER OPTIONS - holding:", holding?.symbol);
    navigation.setOptions({
      headerRight: () => {
        console.log("🎨 HEADER RIGHT RENDER - holding:", !!holding);
        return holding ? (
          <TouchableOpacity
            onPressOut={() => {
              console.log("✅✅✅ EDIT BUTTON PRESSED! Symbol:", holding.symbol);
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.navigate("AddHolding", { holding });
            }}
            style={{ padding: 8, marginRight: 8 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="edit-2" size={24} color={theme.primary} />
          </TouchableOpacity>
        ) : null;
      },
    });
  }, [navigation, holding, theme]);

  const handleUpdatePrice = async () => {
    if (!holding || !currentPrice) return;

    try {
      await holdingsStorage.update(holding.id, {
        currentPrice: parseFloat(currentPrice),
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      loadHolding();
    } catch (error) {
      console.error("Failed to update price:", error);
    }
  };

  const handleUpdateAnalysis = async () => {
    if (!holding) return;

    try {
      await holdingsStorage.update(holding.id, {
        fairValueBase: fairValueBase ? parseFloat(fairValueBase) : undefined,
        fairValueMid: fairValueMid ? parseFloat(fairValueMid) : undefined,
        fairValueHigh: fairValueHigh ? parseFloat(fairValueHigh) : undefined,
        eps: eps ? parseFloat(eps) : undefined,
        growthRate: growthRate ? parseFloat(growthRate) : undefined,
        bookValue: bookValue ? parseFloat(bookValue) : undefined,
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      loadHolding();
    } catch (error) {
      console.error("Failed to update analysis:", error);
    }
  };

  const handleUpdateNotes = async () => {
    if (!holding) return;

    try {
      await holdingsStorage.update(holding.id, {
        notes: notes.trim() || undefined,
      });
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      await loadHolding();
      Alert.alert("Success", "Notes saved successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to save notes");
      console.error("Failed to update notes:", error);
    }
  };

  const handleDelete = () => {
    if (!holding) return;

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    const deleteHolding = async () => {
      try {
        await holdingsStorage.delete(holding.id);
        navigation.goBack();
      } catch (error) {
        console.error("Failed to delete holding:", error);
      }
    };

    deleteHolding();
  };

  const handleImportTransactions = async (importedTx: any[]) => {
    if (!holding) return;

    try {
      const monthMap: { [key: string]: number } = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
      };

      // Parse dates and sort by date/time
      const parsedTransactions = importedTx.map((tx) => {
        let dateObj = new Date();

        try {
          const dateParts = tx.date.trim().split(/\s+/);
          const day = parseInt(dateParts[0]);
          const month = dateParts[1];
          const yearStr = dateParts[2];
          const year = yearStr.length === 2 ? parseInt("20" + yearStr) : parseInt(yearStr);

          // Handle time with or without space before AM/PM: "01:49PM" or "01:49 PM"
          const timeStr = (tx.time || "").replace(/\s+/g, "");
          const timeParts = timeStr.match(/(\d+):(\d+)(AM|PM)/i);
          let hours = 0;
          let minutes = 0;
          if (timeParts) {
            hours = parseInt(timeParts[1]);
            minutes = parseInt(timeParts[2]);
            const period = timeParts[3].toUpperCase();
            if (period === "PM" && hours !== 12) hours += 12;
            if (period === "AM" && hours === 12) hours = 0;
          }

          dateObj = new Date(year, monthMap[month] ?? 0, day, hours, minutes);
        } catch (e) {
          console.warn("Date parse failed for tx, using current date:", tx.date, tx.time);
        }

        return { ...tx, parsedDate: dateObj };
      });

      // Sort by date (oldest first)
      parsedTransactions.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

      // Add transactions to database using the correct method
      for (const tx of parsedTransactions) {
        await transactionsStorage.add({
          holdingId: holding.id,
          symbol: holding.symbol,
          type: tx.type,
          shares: tx.shares,
          pricePerShare: tx.price,
          fees: 0,
          date: tx.parsedDate.toISOString(),
          notes: "Imported from screenshot",
        });
      }

      // Reload transactions
      const updatedTx = await transactionsStorage.getByHolding(holding.id);
      setTransactions(updatedTx);

      // Recalculate average cost and shares from all transactions
      // Include pre-existing shares not covered by transactions
      let txShares = 0;
      let txCost = 0;

      for (const tx of updatedTx) {
        if (tx.type === "buy") {
          txCost += tx.shares * tx.pricePerShare;
          txShares += tx.shares;
        } else if (tx.type === "sell") {
          txShares -= tx.shares;
        }
      }

      // If holding had pre-existing shares before transactions, preserve them
      const preExistingShares = holding.shares - txShares + parsedTransactions.reduce(
        (sum, tx) => sum + (tx.type === "buy" ? tx.shares : -tx.shares), 0
      );
      
      const totalShares = preExistingShares > 0
        ? txShares + preExistingShares
        : txShares;
      
      const totalCost = preExistingShares > 0
        ? txCost + preExistingShares * holding.averageCost
        : txCost;

      const newAvgCost = totalShares > 0 ? totalCost / totalShares : holding.averageCost;

      // Update holding
      await holdingsStorage.update(holding.id, {
        shares: totalShares,
        averageCost: newAvgCost,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        "Success",
        `Imported ${parsedTransactions.length} transaction(s) successfully!`
      );

      loadHolding();
    } catch (error: any) {
      console.error("Failed to import transactions:", error);
      Alert.alert("Error", `Failed to import transactions.\n\n${error?.message || "Unknown error"}`);
    }
  };

  const recalcHoldingFromTransactions = async () => {
    if (!holding) return;
    const allTx = await transactionsStorage.getByHolding(holding.id);
    setTransactions(allTx);

    let txShares = 0;
    let txCost = 0;
    for (const tx of allTx) {
      if (tx.type === "buy") {
        txCost += tx.shares * tx.pricePerShare;
        txShares += tx.shares;
      } else {
        txShares -= tx.shares;
      }
    }

    // Preserve pre-existing shares not covered by transactions
    const prevNetTx = transactions.reduce((sum, tx) =>
      sum + (tx.type === "buy" ? tx.shares : -tx.shares), 0);
    const preExisting = holding.shares - prevNetTx;

    const totalShares = preExisting > 0 ? txShares + preExisting : txShares;
    const totalCost = preExisting > 0
      ? txCost + preExisting * ((holding.averageCost * holding.shares - transactions.reduce(
          (s, t) => s + (t.type === "buy" ? t.shares * t.pricePerShare : 0), 0
        )) / preExisting)
      : txCost;

    const newAvgCost = totalShares > 0 ? totalCost / totalShares : holding.averageCost;

    await holdingsStorage.update(holding.id, {
      shares: Math.max(0, totalShares),
      averageCost: newAvgCost,
    });

    loadHolding();
  };

  const handleUpdateTransaction = async (id: string, updates: { shares: number; pricePerShare: number; fees: number }) => {
    try {
      await transactionsStorage.update(id, updates);
      await recalcHoldingFromTransactions();
    } catch (error) {
      console.error("Failed to update transaction:", error);
      Alert.alert("Error", "Failed to update transaction.");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await transactionsStorage.delete(id);
      await recalcHoldingFromTransactions();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      Alert.alert("Error", "Failed to delete transaction.");
    }
  };

  if (!holding) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]} />
    );
  }

  const currentValue = holding.shares * holding.currentPrice;
  const costBasis = holding.shares * holding.averageCost;
  const pl = currentValue - costBasis;
  const plPercent = costBasis > 0 ? (pl / costBasis) * 100 : 0;
  const isPositive = pl >= 0;

  const role = STOCK_ROLES.find((r) => r.id === holding.role);
  const status = STOCK_STATUSES.find((s) => s.id === holding.status);

  const grahamNumber =
    eps && bookValue
      ? Math.sqrt(22.5 * parseFloat(eps) * parseFloat(bookValue))
      : null;

  const peRatio = eps && holding.currentPrice ? holding.currentPrice / parseFloat(eps) : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
    }).format(value);
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <Card style={styles.headerCard}>
        <View style={styles.symbolRow}>
          <View style={{ flex: 1 }}>
            <ThemedText type="h2">{holding.symbol}</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              {holding.nameEn}
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              {holding.nameAr}
            </ThemedText>
          </View>
          <View style={styles.badges}>
            {role ? (
              <View
                style={[styles.badge, { backgroundColor: role.color + "20" }]}
              >
                <ThemedText style={[styles.badgeText, { color: role.color }]}>
                  {role.label}
                </ThemedText>
              </View>
            ) : null}
            {status ? (
              <View
                style={[styles.badge, { backgroundColor: status.color + "20" }]}
              >
                <ThemedText style={[styles.badgeText, { color: status.color }]}>
                  {status.label}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <ThemedText type="h1" style={Typography.mono}>
              {formatCurrency(holding.currentPrice)}
            </ThemedText>
            <View
              style={[
                styles.plBadge,
                { backgroundColor: isPositive ? theme.success : theme.error },
              ]}
            >
              <ThemedText style={styles.plBadgeText}>
                {isPositive ? "+" : ""}
                {plPercent.toFixed(2)}%
              </ThemedText>
            </View>
          </View>
          <ThemedText
            style={[
              styles.plText,
              Typography.mono,
              { color: isPositive ? theme.success : theme.error },
            ]}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(pl)}
          </ThemedText>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Shares
            </ThemedText>
            <ThemedText style={styles.statValue}>
              {holding.shares.toLocaleString()}
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Avg Cost
            </ThemedText>
            <ThemedText style={[styles.statValue, Typography.mono]}>
              {formatCurrency(holding.averageCost)}
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Cost Basis
            </ThemedText>
            <ThemedText style={[styles.statValue, Typography.mono]}>
              {formatCurrency(costBasis)}
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Value
            </ThemedText>
            <ThemedText style={[styles.statValue, Typography.mono]}>
              {formatCurrency(currentValue)}
            </ThemedText>
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Trade
        </ThemedText>
        <View style={styles.tradeButtons}>
          <Button
            onPress={() => navigation.navigate("BuyStock", { holdingId: holding.id })}
            style={[styles.tradeButton, { backgroundColor: theme.success }]}
          >
            Buy More
          </Button>
          <Button
            onPress={() => navigation.navigate("SellStock", { holdingId: holding.id })}
            style={[styles.tradeButton, { backgroundColor: theme.error }]}
          >
            Sell Shares
          </Button>
        </View>
      </Card>

      <Card style={{ marginBottom: Spacing.md }}>
        <Button
          onPress={() => setImportModalVisible(true)}
        >
          📸 Import from Screenshot
        </Button>
      </Card>

      <Card style={{ marginBottom: Spacing.md }}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
          📝 Notes
        </ThemedText>
        <FormInput
          label="Stock Notes"
          placeholder="Add notes about this stock..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: "top" }}
        />
        <Button onPress={handleUpdateNotes}>
          Save Notes
        </Button>
      </Card>

      <TransactionHistory
        transactions={transactions}
        initialShares={holding.shares}
        initialAvgCost={holding.averageCost}
        onUpdateTransaction={handleUpdateTransaction}
        onDeleteTransaction={handleDeleteTransaction}
      />

      <SentimentGauge symbol={holding.symbol} />

      <StockAnalysis symbol={holding.symbol} />

      <ManusDeepAnalysis symbol={holding.symbol} />

      <Card style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Quick Update
        </ThemedText>
        <View style={styles.updateRow}>
          <View style={styles.updateInput}>
            <FormInput
              label="Current Price (EGP)"
              value={currentPrice}
              onChangeText={setCurrentPrice}
              keyboardType="decimal-pad"
              containerStyle={{ marginBottom: 0 }}
            />
          </View>
          <Button onPress={handleUpdatePrice} style={styles.updateButton}>
            Update
          </Button>
        </View>
      </Card>

      <Card style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Fair Value Analysis
        </ThemedText>
        <View style={styles.fairValueGrid}>
          <View style={[styles.fairValueCard, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Base (Conservative)
            </ThemedText>
            <FormInput
              label=""
              value={fairValueBase}
              onChangeText={setFairValueBase}
              keyboardType="decimal-pad"
              placeholder="0.00"
              containerStyle={{ marginBottom: 0, marginTop: Spacing.sm }}
            />
          </View>
          <View style={[styles.fairValueCard, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Mid (Moderate)
            </ThemedText>
            <FormInput
              label=""
              value={fairValueMid}
              onChangeText={setFairValueMid}
              keyboardType="decimal-pad"
              placeholder="0.00"
              containerStyle={{ marginBottom: 0, marginTop: Spacing.sm }}
            />
          </View>
          <View style={[styles.fairValueCard, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              High (Optimistic)
            </ThemedText>
            <FormInput
              label=""
              value={fairValueHigh}
              onChangeText={setFairValueHigh}
              keyboardType="decimal-pad"
              placeholder="0.00"
              containerStyle={{ marginBottom: 0, marginTop: Spacing.sm }}
            />
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Financial Metrics
        </ThemedText>
        <FormInput
          label="EPS (Earnings Per Share)"
          value={eps}
          onChangeText={setEps}
          keyboardType="decimal-pad"
          placeholder="e.g., 5.25"
        />
        <FormInput
          label="Growth Rate (%)"
          value={growthRate}
          onChangeText={setGrowthRate}
          keyboardType="decimal-pad"
          placeholder="e.g., 15"
        />
        <FormInput
          label="Book Value per Share"
          value={bookValue}
          onChangeText={setBookValue}
          keyboardType="decimal-pad"
          placeholder="e.g., 25.00"
        />

        {peRatio !== null || grahamNumber !== null ? (
          <View style={[styles.calculatedMetrics, { backgroundColor: theme.backgroundSecondary }]}>
            {peRatio !== null ? (
              <View style={styles.metricRow}>
                <ThemedText type="small">P/E Ratio</ThemedText>
                <ThemedText style={[styles.metricValue, Typography.mono]}>
                  {peRatio.toFixed(2)}x
                </ThemedText>
              </View>
            ) : null}
            {grahamNumber !== null ? (
              <View style={styles.metricRow}>
                <ThemedText type="small">Graham Number</ThemedText>
                <ThemedText style={[styles.metricValue, Typography.mono]}>
                  {formatCurrency(grahamNumber)}
                </ThemedText>
              </View>
            ) : null}
          </View>
        ) : null}

        <Button onPress={handleUpdateAnalysis} style={styles.saveButton}>
          Save Analysis
        </Button>
      </Card>

      <Button
        onPress={handleDelete}
        style={[styles.deleteButton, { backgroundColor: theme.error }]}
      >
        Delete Holding
      </Button>

      <TransactionImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onImport={handleImportTransactions}
        stockSymbol={holding.symbol}
      />
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  headerCard: {
    marginBottom: Spacing.lg,
  },
  symbolRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  badges: {
    alignItems: "flex-end",
    gap: Spacing.xs,
    flexShrink: 0,
    paddingLeft: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  priceSection: {
    marginBottom: Spacing.lg,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  plBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  plBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  plText: {
    marginTop: Spacing.xs,
    fontSize: 16,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: Spacing.lg,
  },
  statItem: {
    flex: 1,
    minWidth: "40%",
  },
  statValue: {
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  updateRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.md,
  },
  updateInput: {
    flex: 1,
  },
  updateButton: {
    marginBottom: 0,
  },
  tradeButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  tradeButton: {
    flex: 1,
    marginBottom: 0,
  },
  fairValueGrid: {
    gap: Spacing.md,
  },
  fairValueCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  calculatedMetrics: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  metricValue: {
    fontWeight: "600",
  },
  saveButton: {
    marginTop: Spacing.md,
  },
  deleteButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
