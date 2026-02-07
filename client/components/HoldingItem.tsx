import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { STOCK_STATUSES, STOCK_ROLES } from "@/constants/egxStocks";
import type { PortfolioHolding } from "@/types";

interface HoldingItemProps {
  holding: PortfolioHolding;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HoldingItem({ holding, onPress }: HoldingItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const currentValue = holding.shares * holding.currentPrice;
  const costBasis = holding.shares * holding.averageCost;
  const pl = currentValue - costBasis;
  const plPercent = costBasis > 0 ? ((pl / costBasis) * 100) : 0;
  const isPositive = pl >= 0;

  const status = STOCK_STATUSES.find((s) => s.id === holding.status);
  const role = STOCK_ROLES.find((r) => r.id === holding.role);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.symbolSection}>
          <ThemedText type="h3" style={styles.symbol}>
            {holding.symbol}
          </ThemedText>
          <View style={styles.badges}>
            {role ? (
              <View style={[styles.badge, { backgroundColor: role.color + "20" }]}>
                <ThemedText style={[styles.badgeText, { color: role.color }]}>
                  {role.label}
                </ThemedText>
              </View>
            ) : null}
            {status ? (
              <View style={[styles.badge, { backgroundColor: status.color + "15" }]}>
                <ThemedText style={[styles.badgeText, { color: status.color }]}>
                  {status.label}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>

      <ThemedText style={[styles.name, { color: theme.textSecondary }]} numberOfLines={1}>
        {holding.nameEn}
      </ThemedText>
      <ThemedText style={[styles.nameAr, { color: theme.textSecondary }]} numberOfLines={1}>
        {holding.nameAr}
      </ThemedText>

      <View style={[styles.divider, { backgroundColor: theme.textSecondary + "20" }]} />

      <View style={styles.dataGrid}>
        <View style={styles.dataRow}>
          <View style={styles.dataItem}>
            <ThemedText style={[styles.dataLabel, { color: theme.textSecondary }]}>
              Shares
            </ThemedText>
            <ThemedText style={[styles.dataValue, Typography.mono]}>
              {holding.shares.toLocaleString()}
            </ThemedText>
          </View>
          <View style={styles.dataItem}>
            <ThemedText style={[styles.dataLabel, { color: theme.textSecondary }]}>
              Avg. Cost
            </ThemedText>
            <ThemedText style={[styles.dataValue, Typography.mono]}>
              EGP {formatCurrency(holding.averageCost)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.dataRow}>
          <View style={styles.dataItem}>
            <ThemedText style={[styles.dataLabel, { color: theme.textSecondary }]}>
              Cost Basis (Paid)
            </ThemedText>
            <ThemedText style={[styles.dataValue, Typography.mono]}>
              EGP {formatCurrency(costBasis)}
            </ThemedText>
          </View>
          <View style={styles.dataItem}>
            <ThemedText style={[styles.dataLabel, { color: theme.textSecondary }]}>
              Current Price
            </ThemedText>
            <ThemedText style={[styles.dataValue, Typography.mono]}>
              EGP {formatCurrency(holding.currentPrice)}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.textSecondary + "20" }]} />

      <View style={styles.bottomSection}>
        <View style={styles.currentValueSection}>
          <ThemedText style={[styles.dataLabel, { color: theme.textSecondary }]}>
            Current Value
          </ThemedText>
          <ThemedText style={[styles.currentValue, Typography.mono]}>
            EGP {formatCurrency(currentValue)}
          </ThemedText>
        </View>

        <View style={[styles.plSection, { backgroundColor: isPositive ? theme.success + "15" : theme.error + "15" }]}>
          <ThemedText style={[styles.dataLabel, { color: isPositive ? theme.success : theme.error }]}>
            Profit / Loss
          </ThemedText>
          <ThemedText style={[styles.plValue, Typography.mono, { color: isPositive ? theme.success : theme.error }]}>
            {isPositive ? "+" : ""}{formatCurrency(pl)}
          </ThemedText>
          <ThemedText style={[styles.plPercent, { color: isPositive ? theme.success : theme.error }]}>
            {isPositive ? "+" : ""}{plPercent.toFixed(2)}%
          </ThemedText>
        </View>
      </View>

      {holding.notes ? (
        <View style={[styles.notesRow, { backgroundColor: theme.primary + "10" }]}>
          <ThemedText style={[styles.notesText, { color: theme.primary }]} numberOfLines={2}>
            {holding.notes}
          </ThemedText>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  symbolSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  symbol: {
    fontWeight: "700",
  },
  badges: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  name: {
    fontSize: 13,
    marginBottom: 2,
  },
  nameAr: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  dataGrid: {
    gap: Spacing.md,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dataItem: {
    flex: 1,
  },
  dataLabel: {
    fontSize: 11,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dataValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  currentValueSection: {
    flex: 1,
  },
  currentValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  plSection: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "flex-end",
  },
  plValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  plPercent: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  notesRow: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  notesText: {
    fontSize: 12,
    fontStyle: "italic",
  },
});
