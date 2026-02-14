import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { FormInput } from "@/components/FormInput";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { transactionsStorage, holdingsStorage } from "@/lib/storage";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { PortfolioHolding } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "SellStock">;
type RouteProps = RouteProp<RootStackParamList, "SellStock">;

export default function SellStockScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();

  const { holdingId } = route.params;
  const [holding, setHolding] = useState<PortfolioHolding | null>(null);
  const [shares, setShares] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [fees, setFees] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    holdingsStorage.getById(holdingId).then(h => setHolding(h || null));
  }, [holdingId]);

  const sharesToSell = parseFloat(shares) || 0;
  const sellPrice = parseFloat(pricePerShare) || 0;
  const feesAmount = parseFloat(fees) || 0;
  
  const totalProceeds = sharesToSell * sellPrice - feesAmount;
  const costBasis = sharesToSell * (holding?.averageCost || 0);
  const realizedGainLoss = totalProceeds - costBasis;
  const remainingShares = (holding?.shares || 0) - sharesToSell;

  useEffect(() => {
    if (sharesToSell > (holding?.shares || 0)) {
      setError(`Cannot sell more than ${holding?.shares || 0} shares`);
    } else {
      setError("");
    }
  }, [sharesToSell, holding?.shares]);

  const handleSave = useCallback(async () => {
    if (!shares || !pricePerShare || !holding) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (sharesToSell > holding.shares) {
      setError(`Cannot sell more than ${holding.shares} shares`);
      return;
    }

    setSaving(true);

    try {
      await transactionsStorage.sellStock({
        holdingId,
        symbol: holding.symbol,
        shares: sharesToSell,
        pricePerShare: sellPrice,
        fees: feesAmount,
        date,
        notes: notes || undefined,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      navigation.goBack();
    } catch (error) {
      console.error("Failed to sell stock:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSaving(false);
    }
  }, [shares, pricePerShare, fees, date, notes, holding, holdingId, sharesToSell, sellPrice, feesAmount, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginLeft: 8 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !!error}
          style={{ padding: 8, marginRight: 8 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ThemedText
            style={{
              color: theme.error,
              fontWeight: "600",
              opacity: saving || error ? 0.5 : 1,
            }}
          >
            Sell
          </ThemedText>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSave, saving, error, theme]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (!holding) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

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
      <Card style={styles.stockInfoCard}>
        <ThemedText type="h4">{holding.symbol}</ThemedText>
        <ThemedText style={{ color: theme.textSecondary }}>{holding.nameEn}</ThemedText>
        <View style={styles.currentInfo}>
          <View style={styles.infoItem}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Available Shares</ThemedText>
            <ThemedText style={[styles.value, Typography.mono]}>{holding.shares}</ThemedText>
          </View>
          <View style={styles.infoItem}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Avg Cost</ThemedText>
            <ThemedText style={[styles.value, Typography.mono]}>EGP {formatCurrency(holding.averageCost)}</ThemedText>
          </View>
          <View style={styles.infoItem}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Current Price</ThemedText>
            <ThemedText style={[styles.value, Typography.mono]}>EGP {formatCurrency(holding.currentPrice)}</ThemedText>
          </View>
        </View>
      </Card>

      <FormInput
        label="Number of Shares to Sell"
        value={shares}
        onChangeText={setShares}
        keyboardType="numeric"
        placeholder={`Max: ${holding.shares}`}
      />

      {error ? (
        <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText>
      ) : null}

      <FormInput
        label="Sell Price per Share (EGP)"
        value={pricePerShare}
        onChangeText={setPricePerShare}
        keyboardType="decimal-pad"
        placeholder="e.g., 50.00"
      />

      <FormInput
        label="Fees (EGP)"
        value={fees}
        onChangeText={setFees}
        keyboardType="decimal-pad"
        placeholder="e.g., 25.00"
      />

      <FormInput
        label="Date"
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
      />

      <FormInput
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Add a note..."
        multiline
      />

      <Card style={[styles.summaryCard, { backgroundColor: realizedGainLoss >= 0 ? theme.success + "15" : theme.error + "15" }]}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Transaction Summary</ThemedText>
        <View style={styles.summaryRow}>
          <ThemedText style={{ color: theme.textSecondary }}>Total Proceeds</ThemedText>
          <ThemedText style={[Typography.mono, styles.summaryValue]}>EGP {formatCurrency(totalProceeds)}</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={{ color: theme.textSecondary }}>Cost Basis</ThemedText>
          <ThemedText style={[Typography.mono, styles.summaryValue]}>EGP {formatCurrency(costBasis)}</ThemedText>
        </View>
        <View style={[styles.summaryRow, styles.divider]}>
          <ThemedText style={{ fontWeight: "600" }}>Realized {realizedGainLoss >= 0 ? "Gain" : "Loss"}</ThemedText>
          <ThemedText style={[Typography.mono, styles.summaryValue, { color: realizedGainLoss >= 0 ? theme.success : theme.error }]}>
            {realizedGainLoss >= 0 ? "+" : ""}EGP {formatCurrency(realizedGainLoss)}
          </ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={{ color: theme.textSecondary }}>Remaining Shares</ThemedText>
          <ThemedText style={[Typography.mono, styles.summaryValue]}>{remainingShares}</ThemedText>
        </View>
      </Card>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  stockInfoCard: {
    marginBottom: Spacing.lg,
  },
  currentInfo: {
    flexDirection: "row",
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  infoItem: {
    flex: 1,
  },
  label: {
    fontSize: 12,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  summaryValue: {
    fontWeight: "600",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
});
