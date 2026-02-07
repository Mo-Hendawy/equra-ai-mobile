import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";

import { Card } from "@/components/Card";
import { DonutChart, DonutChartLegend } from "@/components/DonutChart";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import type { PortfolioHolding } from "@/types";

const CHART_COLORS = [
  "#2196F3",
  "#4CAF50", 
  "#FF9800",
  "#9C27B0",
  "#F44336",
  "#00BCD4",
  "#FFEB3B",
  "#E91E63",
  "#3F51B5",
  "#009688",
  "#FF5722",
  "#795548",
  "#607D8B",
  "#8BC34A",
  "#673AB7",
];

interface PortfolioDonutProps {
  holdings: PortfolioHolding[];
}

export function PortfolioDonut({ holdings }: PortfolioDonutProps) {
  const { theme } = useTheme();

  const chartData = useMemo(() => {
    const data = holdings
      .map((h, index) => ({
        label: h.symbol,
        value: h.shares * h.currentPrice,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    return data;
  }, [holdings]);

  const totalValue = useMemo(() => {
    return holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
  }, [holdings]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (holdings.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <ThemedText type="h4" style={styles.title}>
        Portfolio Distribution
      </ThemedText>
      
      <View style={styles.chartContainer}>
        <DonutChart
          data={chartData}
          size={180}
          strokeWidth={28}
          centerValue={formatCurrency(totalValue)}
          centerLabel="EGP"
        />
      </View>

      <DonutChartLegend data={chartData} total={totalValue} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
