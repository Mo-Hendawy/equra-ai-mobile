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
import type { Expense } from "@/types";

interface ExpenseItemProps {
  expense: Expense;
  categoryColor?: string;
  onDelete: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ExpenseItem({ expense, categoryColor = "#757575", onDelete }: ExpenseItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const date = new Date(expense.date);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AnimatedPressable
      onLongPress={handleDelete}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <ThemedText style={styles.description} numberOfLines={1}>
            {expense.description}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {expense.category}
          </ThemedText>
        </View>
        <View style={styles.rightSection}>
          <ThemedText style={[styles.amount, Typography.mono, { color: theme.error }]}>
            -{formatCurrency(expense.amount)}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {date.toLocaleDateString("en-EG", {
              month: "short",
              day: "numeric",
            })}
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  categoryIndicator: {
    width: 4,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
  },
  leftSection: {
    flex: 1,
    marginRight: Spacing.md,
  },
  description: {
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  amount: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
});
