import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, G, Circle } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({
  data,
  size = 180,
  strokeWidth = 30,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const { theme } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const center = size / 2;

  if (total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.divider}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>
        <View style={styles.centerLabel}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            No data
          </ThemedText>
        </View>
      </View>
    );
  }

  let accumulatedAngle = -90;

  const paths = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

    return (
      <Path
        key={index}
        d={d}
        stroke={item.color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="butt"
      />
    );
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G>{paths}</G>
      </Svg>
      {centerLabel || centerValue ? (
        <View style={styles.centerLabel}>
          {centerValue ? (
            <ThemedText type="h3" style={styles.centerValueText}>{centerValue}</ThemedText>
          ) : null}
          {centerLabel ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {centerLabel}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function DonutChartLegend({
  data,
  total,
}: {
  data: DonutChartData[];
  total: number;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.legend}>
      {data.map((item, index) => {
        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(2) : "0.00";
        return (
          <View key={index} style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <ThemedText style={styles.legendLabel}>
                {item.label}
              </ThemedText>
              <ThemedText style={[styles.legendDash, { color: theme.textSecondary }]}>
                {" – "}
              </ThemedText>
              <ThemedText style={[styles.legendPercent, { color: theme.textSecondary }]}>
                {percentage}%
              </ThemedText>
            </View>
            <View style={[styles.legendSquare, { backgroundColor: item.color }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    position: "absolute",
    alignItems: "center",
    width: 120,
  },
  centerValueText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  legend: {
    marginTop: Spacing.xl,
    width: "100%",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendLabel: {
    fontWeight: "600",
    fontSize: 14,
  },
  legendDash: {
    fontSize: 14,
  },
  legendPercent: {
    fontSize: 14,
  },
  legendSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
});
