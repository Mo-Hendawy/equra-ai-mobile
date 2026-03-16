import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const BG = "#1A5C1A";
  const BG_LIGHT = "#1E6B1E";

  return (
    <View style={[styles.container, { backgroundColor: BG }, Shadows.large]}>
      {/* Decorative background circles */}
      <View style={[styles.decor, styles.decorLarge, { backgroundColor: BG_LIGHT }]} />
      <View style={[styles.decor, styles.decorSmall, { backgroundColor: BG_LIGHT }]} />

      {/* Holdings count pill — top right */}
      <View style={styles.holdingsPill}>
        <ThemedText style={styles.holdingsPillText}>
          {holdingsCount} Holdings
        </ThemedText>
      </View>

      {/* Label */}
      <ThemedText style={styles.label}>Portfolio Value</ThemedText>

      {/* Big value */}
      <ThemedText style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(totalValue)}
      </ThemedText>

      {/* Divider */}
      <View style={styles.divider} />

      {/* P/L row */}
      <View style={styles.plRow}>
        <View>
          <ThemedText style={styles.plLabel}>Total P / L</ThemedText>
          <ThemedText
            style={[
              styles.plValue,
              { color: isPositive ? "#A5D6A7" : "#EF9A9A" },
            ]}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(totalPL)}
          </ThemedText>
        </View>

        <View
          style={[
            styles.percentPill,
            {
              backgroundColor: isPositive
                ? "rgba(165, 214, 167, 0.20)"
                : "rgba(239, 154, 154, 0.20)",
              borderColor: isPositive
                ? "rgba(165, 214, 167, 0.40)"
                : "rgba(239, 154, 154, 0.40)",
            },
          ]}
        >
          <ThemedText
            style={[
              styles.percentText,
              { color: isPositive ? "#A5D6A7" : "#EF9A9A" },
            ]}
          >
            {formatPercent(totalPLPercent)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius["2xl"],
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  // Decorative circles
  decor: {
    position: "absolute",
    borderRadius: BorderRadius.full,
    opacity: 0.5,
  },
  decorLarge: {
    width: 200,
    height: 200,
    top: -60,
    right: -50,
  },
  decorSmall: {
    width: 120,
    height: 120,
    bottom: -40,
    left: -20,
  },
  // Holdings pill
  holdingsPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  holdingsPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.4,
  },
  label: {
    fontSize: 13,
    color: "rgba(255,255,255,0.60)",
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: Spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginBottom: Spacing.xl,
  },
  plRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  plLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  plValue: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  percentPill: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  percentText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
