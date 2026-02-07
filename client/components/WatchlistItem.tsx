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
import type { WatchlistItem as WatchlistItemType } from "@/types";

interface WatchlistItemProps {
  item: WatchlistItemType;
  onPress: () => void;
  onDelete: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function WatchlistItem({ item, onPress, onDelete }: WatchlistItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

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

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete();
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
      onLongPress={handleDelete}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "15" }]}>
          <Feather name="eye" size={18} color={theme.primary} />
        </View>
        <View style={styles.info}>
          <ThemedText style={styles.symbol}>{item.symbol}</ThemedText>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary }}
            numberOfLines={1}
          >
            {item.nameEn}
          </ThemedText>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary }}
            numberOfLines={1}
          >
            {item.nameAr}
          </ThemedText>
        </View>
      </View>

      <View style={styles.rightSection}>
        {item.targetPrice ? (
          <View style={styles.targetContainer}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Target
            </ThemedText>
            <ThemedText style={[styles.targetPrice, Typography.mono]}>
              {formatCurrency(item.targetPrice)}
            </ThemedText>
          </View>
        ) : null}
        <ThemedText type="small" style={[styles.sector, { color: theme.textSecondary }]}>
          {item.sector}
        </ThemedText>
      </View>

      <Feather
        name="chevron-right"
        size={20}
        color={theme.textSecondary}
        style={styles.chevron}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
    marginRight: Spacing.md,
  },
  symbol: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  rightSection: {
    alignItems: "flex-end",
    marginRight: Spacing.sm,
  },
  targetContainer: {
    alignItems: "flex-end",
    marginBottom: Spacing.xs,
  },
  targetPrice: {
    fontWeight: "600",
  },
  sector: {
    fontSize: 12,
  },
  chevron: {
    opacity: 0.5,
  },
});
