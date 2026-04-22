import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius, Shadows, Palette, NunitoFont } from "@/constants/theme";

interface SummaryCardProps {
  totalValue: number;
  totalPL: number;
  totalPLPercent: number;
  holdingsCount: number;
}

// Portfolio hero — near-black panel with gold accent pill.
export function SummaryCard({
  totalValue,
  totalPL,
  totalPLPercent,
  holdingsCount,
}: SummaryCardProps) {
  const isPositive = totalPL >= 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-EG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "−";
    return `${sign}${Math.abs(value).toFixed(2)}%`;
  };

  // Gold for positive, muted gray-black for negative. Only black/gold/white.
  const accentColor = isPositive ? Palette.gold : Palette.black400;
  const accentPillBg = isPositive
    ? "rgba(212,168,90,0.14)"  // gold-tint
    : "rgba(255,255,255,0.06)";
  const accentPillBorder = isPositive
    ? "rgba(212,168,90,0.38)"
    : "rgba(255,255,255,0.14)";

  return (
    <View style={[styles.container, Shadows.medium]}>
      {/* Subtle gold corner glow for luxury feel */}
      <View style={styles.goldGlow} />

      <View style={styles.topRow}>
        <View style={styles.pill}>
          <ThemedText style={styles.pillText}>
            {holdingsCount} HOLDINGS
          </ThemedText>
        </View>
      </View>

      <ThemedText style={styles.label}>Portfolio Value</ThemedText>
      <ThemedText style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(totalValue)}
      </ThemedText>

      <View style={styles.divider} />

      <View style={styles.plRow}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.plLabel}>Total P / L</ThemedText>
          <ThemedText style={[styles.plValue, { color: accentColor }]}>
            {isPositive ? "+" : "−"}{formatNumber(totalPL)}
          </ThemedText>
        </View>

        <View
          style={[
            styles.percentPill,
            { backgroundColor: accentPillBg, borderColor: accentPillBorder },
          ]}
        >
          <ThemedText style={[styles.percentText, { color: accentColor }]}>
            {formatPercent(totalPLPercent)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.black900,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(212,168,90,0.15)",  // gold hairline
    marginTop: 6,
    marginBottom: 10,
    marginHorizontal: 2,
    overflow: "hidden",
  },
  goldGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Palette.gold,
    opacity: 0.08,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(212,168,90,0.14)",
    borderWidth: 1,
    borderColor: "rgba(212,168,90,0.30)",
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 10,
    fontFamily: NunitoFont.bold,
    color: Palette.gold,
    letterSpacing: 0.6,
  },
  label: {
    fontSize: 12,
    fontFamily: NunitoFont.medium,
    color: "rgba(255,255,255,0.60)",
    marginBottom: 2,
  },
  value: {
    fontSize: 32,
    fontFamily: NunitoFont.extrabold,
    fontWeight: "800",
    color: Palette.white,
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(212,168,90,0.18)",
    marginTop: 14,
    marginBottom: 14,
  },
  plRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  plLabel: {
    fontSize: 11,
    fontFamily: NunitoFont.medium,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 2,
  },
  plValue: {
    fontSize: 17,
    fontFamily: NunitoFont.bold,
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"],
  },
  percentPill: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  percentText: {
    fontSize: 13,
    fontFamily: NunitoFont.bold,
    letterSpacing: 0.2,
  },
});
