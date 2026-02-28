import React, { useState, useCallback, useMemo } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { SummaryCard } from "@/components/SummaryCard";
import { HoldingItem } from "@/components/HoldingItem";
import { FAB } from "@/components/FAB";
import { EmptyState } from "@/components/EmptyState";
import { PortfolioDonut } from "@/components/PortfolioDonut";
import { PortfolioSentimentGauge } from "@/components/PortfolioSentimentGauge";
import { DonutChart, DonutChartLegend } from "@/components/DonutChart";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { holdingsStorage } from "@/lib/storage";
import { apiRequest } from "@/lib/query-client";
import { STOCK_STATUSES } from "@/constants/egxStocks";
import type { PortfolioHolding } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔍 DEBUG LOGGING
  console.log("📐 PORTFOLIO SCREEN LAYOUT:", {
    headerHeight,
    tabBarHeight,
    insetsTop: insets.top,
    insetsBottom: insets.bottom,
    spacingXl: Spacing.xl,
    calculatedpaddingTop: Spacing.xl,
  });

  const loadHoldings = useCallback(async () => {
    try {
      await holdingsStorage.seedInitialHoldings();
      const data = await holdingsStorage.getAll();
      setHoldings(data);
      return data;
    } catch (error) {
      console.error("Failed to load holdings:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPricesForHoldings = useCallback(async (holdingsToUpdate: PortfolioHolding[]) => {
    if (holdingsToUpdate.length === 0) return;
    
    try {
      const symbols = holdingsToUpdate.map(h => h.symbol);
      console.log("Fetching prices for symbols:", symbols);
      const response = await apiRequest("POST", "/api/prices/batch", { symbols });
      const data = await response.json();
      console.log("Price fetch response:", data);
      
      let updatedCount = 0;
      const updatedHoldings = [...holdingsToUpdate];
      
      for (const priceData of data.prices || []) {
        if (priceData.price !== null) {
          const holdingIndex = updatedHoldings.findIndex(h => h.symbol === priceData.symbol);
          if (holdingIndex >= 0) {
            // Always update if price is different (including from 0)
            const currentPrice = updatedHoldings[holdingIndex].currentPrice || 0;
            if (Math.abs(currentPrice - priceData.price) > 0.01) {
              await holdingsStorage.update(updatedHoldings[holdingIndex].id, { currentPrice: priceData.price });
              updatedHoldings[holdingIndex] = {
                ...updatedHoldings[holdingIndex],
                currentPrice: priceData.price,
              };
              updatedCount++;
            }
          }
        }
      }
      
      // Always update state to ensure UI reflects storage
      setHoldings(updatedHoldings);
      
      if (updatedCount > 0) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        console.log(`Updated ${updatedCount} prices`);
      } else {
        console.log("No prices updated. Current prices:", updatedHoldings.map(h => `${h.symbol}: ${h.currentPrice}`));
      }
    } catch (error) {
      console.error("Price fetch failed:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadAndFetchPrices = async () => {
        const data = await loadHoldings();
        if (data.length > 0) {
          fetchPricesForHoldings(data);
        }
      };
      loadAndFetchPrices();
    }, [loadHoldings, fetchPricesForHoldings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const currentHoldings = await holdingsStorage.getAll();
    await fetchPricesForHoldings(currentHoldings);
    setRefreshing(false);
  }, [fetchPricesForHoldings]);

  const summary = useMemo(() => {
    const totalValue = holdings.reduce(
      (sum, h) => sum + h.shares * h.currentPrice,
      0
    );
    const totalCost = holdings.reduce(
      (sum, h) => sum + h.shares * h.averageCost,
      0
    );
    const totalPL = totalValue - totalCost;
    const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalPL,
      totalPLPercent,
      holdingsCount: holdings.length,
    };
  }, [holdings]);

  const groupedHoldings = useMemo(() => {
    const groups: { status: string; label: string; holdings: PortfolioHolding[] }[] = [];

    STOCK_STATUSES.forEach((status) => {
      const statusHoldings = holdings.filter((h) => h.status === status.id);
      if (statusHoldings.length > 0) {
        groups.push({
          status: status.id,
          label: status.label,
          holdings: statusHoldings,
        });
      }
    });

    return groups;
  }, [holdings]);

  const handleAddHolding = () => {
    navigation.navigate("AddHolding");
  };

  const handleHoldingPress = (holding: PortfolioHolding) => {
    navigation.navigate("HoldingDetail", { holdingId: holding.id });
  };

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

  const renderListHeader = () => {
    const sortedSymbols = [...holdings]
      .sort((a, b) => (b.shares * b.currentPrice) - (a.shares * a.currentPrice))
      .map(h => h.symbol);
      
    return (
    <>
      <SummaryCard
        totalValue={summary.totalValue}
        totalPL={summary.totalPL}
        totalPLPercent={summary.totalPLPercent}
        holdingsCount={summary.holdingsCount}
      />
      <PortfolioSentimentGauge symbols={sortedSymbols} />
      <PortfolioDonut holdings={holdings} />
      <Card style={{ marginHorizontal: Spacing.md, marginBottom: Spacing.md }}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
          Sector Allocation
        </ThemedText>
        <View style={{ alignItems: "center" }}>
          <DonutChart
            data={sectorData}
            size={180}
            strokeWidth={30}
            centerValue={holdings.length.toString()}
            centerLabel="Holdings"
          />
        </View>
        <DonutChartLegend data={sectorData} total={summary.totalValue} />
      </Card>
    </>
    );
  };

  const renderEmptyComponent = () => (
    <EmptyState
      image={require("../../assets/images/empty-portfolio.png")}
      title="No Holdings Yet"
      message="Add your first stock holding to start tracking your EGX portfolio performance"
    />
  );

  const flattenedData = useMemo(() => {
    const data: { type: "header" | "holding"; key: string; data: any }[] = [];

    groupedHoldings.forEach((group) => {
      data.push({
        type: "header",
        key: `header-${group.status}`,
        data: group.label,
      });
      group.holdings.forEach((holding) => {
        data.push({
          type: "holding",
          key: holding.id,
          data: holding,
        });
      });
    });

    return data;
  }, [groupedHoldings]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: Spacing.xl,
            paddingBottom: tabBarHeight + Spacing["4xl"],
          },
          holdings.length === 0 && styles.emptyListContent,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={holdings.length > 0 ? flattenedData : []}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={holdings.length > 0 ? renderListHeader : null}
        ListEmptyComponent={loading ? null : renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.sectionDot,
                    {
                      backgroundColor:
                        STOCK_STATUSES.find((s) => s.label === item.data)?.color ||
                        theme.textSecondary,
                    },
                  ]}
                />
                <View style={styles.sectionLabelContainer}>
                  <View style={styles.sectionLabel}>
                    <View
                      style={[
                        styles.sectionDot,
                        {
                          backgroundColor:
                            STOCK_STATUSES.find((s) => s.label === item.data)
                              ?.color || theme.textSecondary,
                        },
                      ]}
                    />
                    <View style={styles.sectionTextContainer}>
                      <View
                        style={[
                          styles.sectionLabelText,
                          { color: theme.textSecondary },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            );
          }
          return (
            <HoldingItem
              holding={item.data}
              onPress={() => handleHoldingPress(item.data)}
            />
          );
        }}
      />
      <FAB onPress={handleAddHolding} bottom={tabBarHeight + 20} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  sectionLabelContainer: {
    flex: 1,
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionLabelText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
