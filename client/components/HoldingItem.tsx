import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { STOCK_ROLES } from "@/constants/egxStocks";
import type { PortfolioHolding } from "@/types";

interface HoldingItemProps {
  holding: PortfolioHolding;
  onPress: () => void;
  onLongPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HoldingItem({ holding, onPress, onLongPress }: HoldingItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const currentValue = holding.shares * holding.currentPrice;
  const costBasis = holding.shares * holding.averageCost;
  const pl = currentValue - costBasis;
  const plPercent = costBasis > 0 ? (pl / costBasis) * 100 : 0;
  const isPositive = pl >= 0;

  const role = STOCK_ROLES.find((r) => r.id === holding.role);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () =>
    (scale.value = withSpring(0.98, { damping: 15, stiffness: 150 }));
  const handlePressOut = () =>
    (scale.value = withSpring(1, { damping: 15, stiffness: 150 }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const formatValue = (value: number) =>
    new Intl.NumberFormat("en-EG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const plColor = isPositive ? theme.success : theme.error;
  const accentColor = isPositive ? theme.success : theme.error;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.cardBorder,
        },
        Shadows.small,
        animatedStyle,
      ]}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      {/* Content */}
      <View style={styles.inner}>
        {/* Left: ticker + name */}
        <View style={styles.left}>
          <View style={styles.tickerRow}>
            <ThemedText style={styles.symbol}>{holding.symbol}</ThemedText>
            {role ? (
              <View
                style={[styles.rolePill, { backgroundColor: role.color + "20" }]}
              >
                <ThemedText style={[styles.roleText, { color: role.color }]}>
                  {role.label}
                </ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText
            style={[styles.name, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {holding.nameEn}
          </ThemedText>
          <ThemedText
            style={[styles.shares, { color: theme.textSecondary }]}
          >
            {holding.shares.toLocaleString()} shares · EGP{" "}
            {holding.currentPrice.toFixed(2)}
          </ThemedText>
        </View>

        {/* Right: value + P/L */}
        <View style={styles.right}>
          <ThemedText style={styles.currentValue}>
            EGP {formatValue(currentValue)}
          </ThemedText>
          <View
            style={[
              styles.plPill,
              { backgroundColor: plColor + "18" },
            ]}
          >
            <ThemedText style={[styles.plText, { color: plColor }]}>
              {isPositive ? "+" : ""}
              {plPercent.toFixed(2)}%
            </ThemedText>
          </View>
          <ThemedText style={[styles.plAmount, { color: plColor }]}>
            {isPositive ? "+" : ""}
            {formatValue(pl)}
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
  },
  accentBar: {
    width: 4,
  },
  inner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 12,
    gap: 10,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  tickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  symbol: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 11,
  },
  shares: {
    fontSize: 10,
  },
  right: {
    alignItems: "flex-end",
    gap: 3,
  },
  currentValue: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  plPill: {
    borderRadius: 9999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  plText: {
    fontSize: 11,
    fontWeight: "700",
  },
  plAmount: {
    fontSize: 10,
    fontWeight: "600",
  },
});
