import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "BuyStock">;
type RouteProps = RouteProp<RootStackParamList, "BuyStock">;

export default function BuyStockScreen() {
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

  useEffect(() => {
    holdingsStorage.getById(holdingId).then(h => setHolding(h || null));
  }, [holdingId]);

  const totalCost = (parseFloat(shares) || 0) * (parseFloat(pricePerShare) || 0) + (parseFloat(fees) || 0);
  
  const newTotalShares = (holding?.shares || 0) + (parseFloat(shares) || 0);
  const oldTotalCost = (holding?.shares || 0) * (holding?.averageCost || 0);
  const newAvgCost = newTotalShares > 0 ? (oldTotalCost + totalCost) / newTotalShares : 0;

  const handleSave = useCallback(async () => {
    if (!shares || !pricePerShare || !holding) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setSaving(true);

    try {
      await transactionsStorage.buyStock({
        holdingId,
        symbol: holding.symbol,
        shares: parseFloat(shares),
        pricePerShare: parseFloat(pricePerShare),
        fees: parseFloat(fees) || 0,
        date,
        notes: notes || undefined,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      navigation.goBack();
    } catch (error) {
      console.error("Failed to buy stock:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSaving(false);
    }
  }, [shares, pricePerShare, fees, date, notes, holding, holdingId, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderButton onPress={() => navigation.goBack()}>
          <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
        </HeaderButton>
      ),
      headerRight: () => (
        <HeaderButton onPress={handleSave} disabled={saving}>
          <ThemedText
            style={{
              color: theme.primary,
              fontWeight: "600",
              opacity: saving ? 0.5 : 1,
            }}
          >
            Buy
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, handleSave, saving, theme]);

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
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <Card style={styles.stockInfoCard}>
        <ThemedText type="h4">{holding.symbol}</ThemedText>
        <ThemedText style={{ color: theme.textSecondary }}>{holding.nameEn}</ThemedText>
        <View style={styles.currentInfo}>
          <View style={styles.infoItem}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Current Shares</ThemedText>
            <ThemedText style={[styles.value, Typography.mono]}>{holding.shares}</ThemedText>
          </View>
          <View style={styles.infoItem}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Avg Cost</ThemedText>
            <ThemedText style={[styles.value, Typography.mono]}>EGP {formatCurrency(holding.averageCost)}</ThemedText>
          </View>
        </View>
      </Card>

      <FormInput
        label="Number of Shares to Buy"
        value={shares}
        onChangeText={setShares}
        keyboardType="numeric"
        placeholder="e.g., 100"
      />

      <FormInput
        label="Price per Share (EGP)"
        value={pricePerShare}
        onChangeText={setPricePerShare}
        keyboardType="decimal-pad"
        placeholder="e.g., 45.50"
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

      <Card style={[styles.summaryCard, { backgroundColor: theme.primary + "15" }]}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Transaction Summary</ThemedText>
        <View style={styles.summaryRow}>
          <ThemedText style={{ color: theme.textSecondary }}>Total Cost</ThemedText>
          <ThemedText style={[Typography.mono, styles.summaryValue]}>EGP {formatCurrency(totalCost)}</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={{ color: theme.textSecondary }}>New Total Shares</ThemedText>
          <ThemedText style={[Typography.mono, styles.summaryValue]}>{newTotalShares}</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={{ color: theme.textSecondary }}>New Avg Cost</ThemedText>
          <ThemedText style={[Typography.mono, styles.summaryValue]}>EGP {formatCurrency(newAvgCost)}</ThemedText>
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
    gap: Spacing.xl,
  },
  infoItem: {
    flex: 1,
  },
  label: {
    fontSize: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
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
});
