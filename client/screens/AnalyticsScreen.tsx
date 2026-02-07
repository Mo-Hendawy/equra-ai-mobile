import React, { useState, useCallback, useMemo } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { DonutChart, DonutChartLegend } from "@/components/DonutChart";
import { BarChart } from "@/components/BarChart";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { holdingsStorage } from "@/lib/storage";
import { STOCK_ROLES, SECTORS } from "@/constants/egxStocks";
import type { PortfolioHolding } from "@/types";

const SECTOR_COLORS = [
  "#1B5E20",
  "#1565C0",
  "#7B1FA2",
  "#F57C00",
  "#C62828",
  "#00838F",
  "#558B2F",
  "#AD1457",
  "#4527A0",
  "#FF6F00",
  "#00695C",
  "#6D4C41",
  "#37474F",
];

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHoldings = useCallback(async () => {
    try {
      const data = await holdingsStorage.getAll();
      setHoldings(data);
    } catch (error) {
      console.error("Failed to load holdings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHoldings();
    }, [loadHoldings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHoldings();
    setRefreshing(false);
  }, [loadHoldings]);

  const sectorData = useMemo(() => {
    const sectorMap = new Map<string, number>();

    holdings.forEach((h) => {
      const value = h.shares * h.currentPrice;
      sectorMap.set(h.sector, (sectorMap.get(h.sector) || 0) + value);
    });

    return Array.from(sectorMap.entries())
      .map(([label, value], index) => ({
        label,
        value,
        color: SECTOR_COLORS[index % SECTOR_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  const roleData = useMemo(() => {
    return STOCK_ROLES.map((role) => {
      const roleHoldings = holdings.filter((h) => h.role === role.id);
      const value = roleHoldings.reduce(
        (sum, h) => sum + h.shares * h.currentPrice,
        0
      );
      return {
        label: role.label,
        value,
        color: role.color,
      };
    }).filter((d) => d.value > 0);
  }, [holdings]);

  const topPerformers = useMemo(() => {
    return holdings
      .map((h) => {
        const value = h.shares * h.currentPrice;
        const cost = h.shares * h.averageCost;
        const pl = value - cost;
        const plPercent = cost > 0 ? (pl / cost) * 100 : 0;
        return { ...h, pl, plPercent };
      })
      .sort((a, b) => b.plPercent - a.plPercent)
      .slice(0, 5);
  }, [holdings]);

  const totalValue = useMemo(() => {
    return holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
  }, [holdings]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!loading && holdings.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.emptyContent,
            {
              paddingTop: headerHeight + Spacing.xl,
              paddingBottom: tabBarHeight + Spacing.xl,
            },
          ]}
        >
          <EmptyState
            image={require("../../assets/images/empty-portfolio.png")}
            title="No Analytics Yet"
            message="Add holdings to your portfolio to see charts and performance analytics"
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        <Card style={styles.chartCard}>
          <ThemedText type="h4" style={styles.chartTitle}>
            Sector Allocation
          </ThemedText>
          <View style={styles.donutContainer}>
            <DonutChart
              data={sectorData}
              size={180}
              strokeWidth={30}
              centerValue={holdings.length.toString()}
              centerLabel="Holdings"
            />
          </View>
          <DonutChartLegend data={sectorData} total={totalValue} />
        </Card>

        <Card style={styles.chartCard}>
          <ThemedText type="h4" style={styles.chartTitle}>
            Role Distribution
          </ThemedText>
          <BarChart
            data={roleData}
            showValues
            formatValue={formatCurrency}
          />
        </Card>

        <Card style={styles.chartCard}>
          <ThemedText type="h4" style={styles.chartTitle}>
            Top Performers
          </ThemedText>
          {topPerformers.map((holding, index) => (
            <View
              key={holding.id}
              style={[
                styles.performerRow,
                index < topPerformers.length - 1 && styles.performerBorder,
              ]}
            >
              <View style={styles.performerRank}>
                <ThemedText style={styles.rankNumber}>#{index + 1}</ThemedText>
              </View>
              <View style={styles.performerInfo}>
                <ThemedText style={styles.performerSymbol}>
                  {holding.symbol}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary }}
                >
                  {holding.nameEn}
                </ThemedText>
              </View>
              <View style={styles.performerValue}>
                <ThemedText
                  style={[
                    styles.performerPercent,
                    Typography.mono,
                    { color: holding.plPercent >= 0 ? theme.success : theme.error },
                  ]}
                >
                  {holding.plPercent >= 0 ? "+" : ""}
                  {holding.plPercent.toFixed(2)}%
                </ThemedText>
                <ThemedText
                  type="small"
                  style={[
                    Typography.mono,
                    { color: holding.pl >= 0 ? theme.success : theme.error },
                  ]}
                >
                  {holding.pl >= 0 ? "+" : ""}
                  {formatCurrency(holding.pl)}
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  emptyContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  chartCard: {
    marginBottom: Spacing.lg,
  },
  chartTitle: {
    marginBottom: Spacing.lg,
  },
  donutContainer: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  performerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  performerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  performerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: "600",
  },
  performerInfo: {
    flex: 1,
  },
  performerSymbol: {
    fontWeight: "600",
    marginBottom: 2,
  },
  performerValue: {
    alignItems: "flex-end",
  },
  performerPercent: {
    fontWeight: "600",
    marginBottom: 2,
  },
});
