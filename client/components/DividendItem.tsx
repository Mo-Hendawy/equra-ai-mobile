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
import type { Dividend } from "@/types";

interface DividendItemProps {
  dividend: Dividend;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DividendItem({ dividend, onPress }: DividendItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const paymentDate = new Date(dividend.paymentDate);
  const exDate = new Date(dividend.exDate);
  const isPaid = dividend.status === "paid";

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
      style: "currency",
      currency: "EGP",
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
        <View style={styles.symbolContainer}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isPaid ? theme.success + "15" : theme.accent + "15" },
            ]}
          >
            <Feather
              name={isPaid ? "check-circle" : "clock"}
              size={18}
              color={isPaid ? theme.success : theme.accent}
            />
          </View>
          <View>
            <ThemedText style={styles.symbol}>{dividend.symbol}</ThemedText>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isPaid ? theme.success + "20" : theme.accent + "20" },
              ]}
            >
              <ThemedText
                style={[
                  styles.statusText,
                  { color: isPaid ? theme.success : theme.accent },
                ]}
              >
                {isPaid ? "Paid" : "Announced"}
              </ThemedText>
            </View>
          </View>
        </View>
        <ThemedText
          style={[styles.amount, Typography.mono, { color: theme.success }]}
        >
          +{formatCurrency(dividend.amount)}
        </ThemedText>
      </View>

      <View style={styles.dates}>
        <View style={styles.dateItem}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Ex-Date
          </ThemedText>
          <ThemedText type="small">
            {exDate.toLocaleDateString("en-EG", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </ThemedText>
        </View>
        <View style={styles.dateItem}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Payment Date
          </ThemedText>
          <ThemedText type="small">
            {paymentDate.toLocaleDateString("en-EG", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  symbolContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  symbol: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  amount: {
    fontSize: 18,
    fontWeight: "600",
  },
  dates: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: Spacing.md,
  },
  dateItem: {
    flex: 1,
  },
});
