import React, { useMemo, useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText, Rect, G } from "react-native-svg";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { StockTransaction } from "@/types";

interface TransactionHistoryProps {
  transactions: StockTransaction[];
  initialShares: number;
  initialAvgCost: number;
}

interface CostDataPoint {
  date: string;
  avgCost: number;
  shares: number;
  type: "buy" | "sell" | "initial";
}

export function TransactionHistory({ 
  transactions, 
  initialShares, 
  initialAvgCost 
}: TransactionHistoryProps) {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [selectedDot, setSelectedDot] = useState<number | null>(null);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [transactions]);

  const costHistory = useMemo(() => {
    const history: CostDataPoint[] = [];
    
    if (sortedTransactions.length === 0) {
      return [{
        date: "Initial",
        avgCost: initialAvgCost,
        shares: initialShares,
        type: "initial" as const,
      }];
    }

    // Calculate net shares from transactions alone
    let netTxShares = 0;
    let sumBuyCost = 0;
    sortedTransactions.forEach(tx => {
      if (tx.type === "buy") {
        netTxShares += tx.shares;
        sumBuyCost += tx.shares * tx.pricePerShare;
      } else {
        netTxShares -= tx.shares;
      }
    });

    // Determine if there were pre-existing shares before any transactions
    const preExistingShares = initialShares - netTxShares;

    let runningShares: number;
    let runningCost: number;

    if (preExistingShares > 0) {
      // Solve for the pre-existing avg cost:
      // finalAvgCost * finalShares = preExistingShares * preAvgCost + sumBuyCost (approx for buy-only)
      const preAvgCost = (initialAvgCost * initialShares - sumBuyCost) / preExistingShares;

      runningShares = preExistingShares;
      runningCost = preExistingShares * Math.max(0, preAvgCost);

      history.push({
        date: "Initial",
        avgCost: runningCost / runningShares,
        shares: runningShares,
        type: "initial" as const,
      });
    } else {
      runningShares = 0;
      runningCost = 0;
    }

    sortedTransactions.forEach((tx) => {
      if (tx.type === "buy") {
        runningCost += tx.shares * tx.pricePerShare;
        runningShares += tx.shares;
      } else {
        if (runningShares > 0) {
          runningCost = (runningCost / runningShares) * (runningShares - tx.shares);
        }
        runningShares -= tx.shares;
      }

      const avgCost = runningShares > 0 ? runningCost / runningShares : 0;

      history.push({
        date: new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        avgCost,
        shares: runningShares,
        type: tx.type,
      });
    });

    return history;
  }, [sortedTransactions, initialShares, initialAvgCost]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const chartWidth = Math.min(screenWidth - Spacing.lg * 4, 400);
  const chartHeight = 160;
  const padding = { top: 40, right: 45, bottom: 30, left: 15 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const minCost = Math.min(...costHistory.map(d => d.avgCost)) * 0.95;
  const maxCost = Math.max(...costHistory.map(d => d.avgCost)) * 1.05;

  const getX = (index: number) => {
    if (costHistory.length === 1) return padding.left + graphWidth / 2;
    return padding.left + (index / (costHistory.length - 1)) * graphWidth;
  };

  const getY = (cost: number) => {
    if (maxCost === minCost) return padding.top + graphHeight / 2;
    return padding.top + graphHeight - ((cost - minCost) / (maxCost - minCost)) * graphHeight;
  };

  const linePath = costHistory.length > 1
    ? costHistory.map((point, index) => {
        const x = getX(index);
        const y = getY(point.avgCost);
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      }).join(" ")
    : "";

  if (transactions.length === 0) {
    return (
      <Card style={styles.card}>
        <ThemedText type="h4" style={styles.title}>Transaction History</ThemedText>
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          No transactions yet. Use Buy/Sell to track your trades.
        </ThemedText>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <ThemedText type="h4" style={styles.title}>Average Cost History</ThemedText>
      
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Baseline */}
          <Line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke={theme.textSecondary + "40"}
            strokeWidth={1}
          />
          
          {/* Line path */}
          {costHistory.length > 1 ? (
            <Path
              d={linePath}
              fill="none"
              stroke={theme.primary}
              strokeWidth={2}
            />
          ) : null}
          
          {/* Dots with tap targets */}
          {costHistory.map((point, index) => {
            const cx = getX(index);
            const cy = getY(point.avgCost);
            const isSelected = selectedDot === index;
            const dotColor = point.type === "buy" ? theme.success : point.type === "sell" ? theme.error : theme.primary;
            
            return (
              <G key={index} onPress={() => setSelectedDot(isSelected ? null : index)}>
                {/* Invisible larger tap target */}
                <Circle
                  cx={cx}
                  cy={cy}
                  r={18}
                  fill="transparent"
                />
                {/* Selected ring */}
                {isSelected ? (
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={9}
                    fill={dotColor + "30"}
                    stroke={dotColor}
                    strokeWidth={1.5}
                  />
                ) : null}
                {/* Visible dot */}
                <Circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 6 : 5}
                  fill={dotColor}
                />
              </G>
            );
          })}
          
          {/* Date labels */}
          {costHistory.map((point, index) => (
            <SvgText
              key={`label-${index}`}
              x={getX(index)}
              y={chartHeight - 8}
              fontSize={9}
              fill={selectedDot === index ? theme.text : theme.textSecondary}
              fontWeight={selectedDot === index ? "bold" : "normal"}
              textAnchor="middle"
            >
              {point.date}
            </SvgText>
          ))}
          
          {/* Y-axis labels */}
          <SvgText
            x={chartWidth - padding.right + 5}
            y={getY(maxCost) + 4}
            fontSize={10}
            fill={theme.textSecondary}
            textAnchor="start"
          >
            {formatCurrency(maxCost)}
          </SvgText>
          <SvgText
            x={chartWidth - padding.right + 5}
            y={getY(minCost) + 4}
            fontSize={10}
            fill={theme.textSecondary}
            textAnchor="start"
          >
            {formatCurrency(minCost)}
          </SvgText>

          {/* Tooltip for selected dot */}
          {selectedDot !== null && costHistory[selectedDot] ? (() => {
            const point = costHistory[selectedDot];
            const cx = getX(selectedDot);
            const cy = getY(point.avgCost);
            const label = `EGP ${formatCurrency(point.avgCost)}`;
            const subLabel = `${point.shares} shares`;
            const tooltipWidth = 100;
            const tooltipHeight = 32;
            // Keep tooltip within chart bounds
            let tooltipX = cx - tooltipWidth / 2;
            if (tooltipX < 2) tooltipX = 2;
            if (tooltipX + tooltipWidth > chartWidth - 2) tooltipX = chartWidth - tooltipWidth - 2;
            const tooltipY = cy - tooltipHeight - 14;

            return (
              <G>
                <Rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx={6}
                  fill={theme.text}
                  opacity={0.92}
                />
                <SvgText
                  x={tooltipX + tooltipWidth / 2}
                  y={tooltipY + 13}
                  fontSize={11}
                  fontWeight="bold"
                  fill={theme.backgroundRoot}
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
                <SvgText
                  x={tooltipX + tooltipWidth / 2}
                  y={tooltipY + 26}
                  fontSize={9}
                  fill={theme.backgroundRoot}
                  opacity={0.7}
                  textAnchor="middle"
                >
                  {subLabel}
                </SvgText>
              </G>
            );
          })() : null}
        </Svg>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Buy</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.error }]} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Sell</ThemedText>
        </View>
      </View>

      <ThemedText type="h4" style={[styles.title, { marginTop: Spacing.lg }]}>Transactions</ThemedText>
      
      {sortedTransactions.map((tx, index) => (
        <View 
          key={tx.id} 
          style={[
            styles.transactionRow,
            { borderBottomColor: theme.textSecondary + "20" },
            index === sortedTransactions.length - 1 && { borderBottomWidth: 0 }
          ]}
        >
          <View style={styles.txLeft}>
            <View style={[
              styles.txBadge, 
              { backgroundColor: tx.type === "buy" ? theme.success + "20" : theme.error + "20" }
            ]}>
              <ThemedText style={[
                styles.txBadgeText, 
                { color: tx.type === "buy" ? theme.success : theme.error }
              ]}>
                {tx.type.toUpperCase()}
              </ThemedText>
            </View>
            <View>
              <ThemedText style={styles.txDate}>
                {new Date(tx.date).toLocaleDateString("en-US", { 
                  month: "short", 
                  day: "numeric",
                  year: "numeric"
                })}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {tx.shares} shares @ {formatCurrency(tx.pricePerShare)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.txRight}>
            <ThemedText style={[Typography.mono, styles.txAmount]}>
              {tx.type === "buy" ? "-" : "+"}EGP {formatCurrency(tx.shares * tx.pricePerShare)}
            </ThemedText>
            {tx.fees > 0 ? (
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Fees: {formatCurrency(tx.fees)}
              </ThemedText>
            ) : null}
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.md,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  txBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  txBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  txDate: {
    fontWeight: "500",
    marginBottom: 2,
  },
  txRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontWeight: "600",
  },
});
