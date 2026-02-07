import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withDelay,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface BarChartData {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarChartData[];
  maxValue?: number;
  showValues?: boolean;
  formatValue?: (value: number) => string;
}

function AnimatedBar({
  item,
  maxValue,
  showValues,
  formatValue,
  index,
}: {
  item: BarChartData;
  maxValue: number;
  showValues: boolean;
  formatValue: (value: number) => string;
  index: number;
}) {
  const { theme } = useTheme();
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withDelay(
      index * 100,
      withSpring(maxValue > 0 ? (item.value / maxValue) * 100 : 0, {
        damping: 15,
        stiffness: 100,
      })
    );
  }, [item.value, maxValue, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.barRow}>
      <ThemedText type="small" style={styles.barLabel} numberOfLines={1}>
        {item.label}
      </ThemedText>
      <View style={styles.barContainer}>
        <View style={[styles.barBackground, { backgroundColor: theme.divider }]}>
          <Animated.View
            style={[
              styles.bar,
              { backgroundColor: item.color },
              animatedStyle,
            ]}
          />
        </View>
        {showValues ? (
          <ThemedText
            type="small"
            style={[styles.barValue, Typography.mono, { color: theme.textSecondary }]}
          >
            {formatValue(item.value)}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

export function BarChart({
  data,
  maxValue,
  showValues = true,
  formatValue = (v) => v.toString(),
}: BarChartProps) {
  const computedMax = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.container}>
      {data.map((item, index) => (
        <AnimatedBar
          key={item.label}
          item={item}
          maxValue={computedMax}
          showValues={showValues}
          formatValue={formatValue}
          index={index}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  barRow: {
    gap: Spacing.xs,
  },
  barLabel: {
    fontWeight: "500",
  },
  barContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  barBackground: {
    flex: 1,
    height: 24,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: BorderRadius.xs,
  },
  barValue: {
    width: 70,
    textAlign: "right",
  },
});
