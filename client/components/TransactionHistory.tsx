import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";

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

    let runningShares = 0;
    let runningCost = 0;

    sortedTransactions.forEach((tx, index) => {
      if (tx.type === "buy") {
        const txCost = tx.shares * tx.pricePerShare + tx.fees;
        runningCost += txCost;
        runningShares += tx.shares;
      } else {
        runningShares -= tx.shares;
        if (runningShares > 0) {
          runningCost = (runningCost / (runningShares + tx.shares)) * runningShares;
        }
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

  const chartWidth = 280;
  const chartHeight = 120;
  const padding = { top: 20, right: 40, bottom: 30, left: 10 };
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
          <Line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke={theme.textSecondary + "40"}
            strokeWidth={1}
          />
          
          {costHistory.length > 1 ? (
            <Path
              d={linePath}
              fill="none"
              stroke={theme.primary}
              strokeWidth={2}
            />
          ) : null}
          
          {costHistory.map((point, index) => (
            <Circle
              key={index}
              cx={getX(index)}
              cy={getY(point.avgCost)}
              r={5}
              fill={point.type === "buy" ? theme.success : point.type === "sell" ? theme.error : theme.primary}
            />
          ))}
          
          {costHistory.map((point, index) => (
            <SvgText
              key={`label-${index}`}
              x={getX(index)}
              y={chartHeight - 8}
              fontSize={9}
              fill={theme.textSecondary}
              textAnchor="middle"
            >
              {point.date}
            </SvgText>
          ))}
          
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
