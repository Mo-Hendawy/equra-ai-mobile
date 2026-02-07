import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface SummaryCardProps {
  totalValue: number;
  totalPL: number;
  totalPLPercent: number;
  holdingsCount: number;
}

export function SummaryCard({
  totalValue,
  totalPL,
  totalPLPercent,
  holdingsCount,
}: SummaryCardProps) {
  const { theme } = useTheme();
  const isPositive = totalPL >= 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <View style={styles.topRow}>
        <View>
          <ThemedText style={styles.label}>Portfolio Value</ThemedText>
          <ThemedText style={styles.value}>{formatCurrency(totalValue)}</ThemedText>
        </View>
        <View style={styles.holdingsContainer}>
          <ThemedText style={styles.holdingsCount}>{holdingsCount}</ThemedText>
          <ThemedText style={styles.holdingsLabel}>Holdings</ThemedText>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View>
          <ThemedText style={styles.label}>Total P/L</ThemedText>
          <ThemedText
            style={[
              styles.plValue,
              { color: isPositive ? "#A5D6A7" : "#EF9A9A" },
            ]}
          >
            {formatCurrency(totalPL)}
          </ThemedText>
        </View>
        <View
          style={[
            styles.percentBadge,
            { backgroundColor: isPositive ? "#2E7D32" : "#C62828" },
          ]}
        >
          <ThemedText style={styles.percentText}>
            {formatPercent(totalPLPercent)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  label: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  holdingsContainer: {
    alignItems: "center",
  },
  holdingsCount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  holdingsLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: Spacing.lg,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  plValue: {
    fontSize: 20,
    fontWeight: "600",
    ...Typography.mono,
  },
  percentBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  percentText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    ...Typography.mono,
  },
});
