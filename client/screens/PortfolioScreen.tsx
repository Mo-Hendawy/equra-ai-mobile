import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { holdingsStorage } from "@/lib/storage";
import { apiRequest } from "@/lib/query-client";
import { STOCK_ROLES } from "@/constants/egxStocks";
import type { PortfolioHolding } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type InsightTab = "sentiment" | "allocation" | "sector";
type FlatItem = { type: "header" | "holding"; key: string; data: any };

const SECTOR_COLORS = [
  "#1B5E20", "#1565C0", "#7B1FA2", "#F57C00", "#C62828",
  "#00838F", "#558B2F", "#AD1457", "#4527A0", "#FF6F00",
  "#00695C", "#6D4C41", "#37474F",
];

const INSIGHT_TABS: { id: InsightTab; label: string }[] = [
  { id: "sentiment", label: "Sentiment" },
  { id: "allocation", label: "Allocation" },
  { id: "sector", label: "Sector" },
];

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<InsightTab>("allocation");

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

  const fetchPricesForHoldings = useCallback(
    async (holdingsToUpdate: PortfolioHolding[]) => {
      if (holdingsToUpdate.length === 0) return;
      try {
        const symbols = holdingsToUpdate.map((h) => h.symbol);
        const response = await apiRequest("POST", "/api/prices/batch", { symbols });
        const data = await response.json();

        let updatedCount = 0;
        const updatedHoldings = [...holdingsToUpdate];

        for (const priceData of data.prices || []) {
          if (priceData.price !== null) {
            const idx = updatedHoldings.findIndex(
              (h) => h.symbol === priceData.symbol
            );
            if (idx >= 0) {
              const current = updatedHoldings[idx].currentPrice || 0;
              if (Math.abs(current - priceData.price) > 0.01) {
                await holdingsStorage.update(updatedHoldings[idx].id, {
                  currentPrice: priceData.price,
                });
                updatedHoldings[idx] = {
                  ...updatedHoldings[idx],
                  currentPrice: priceData.price,
                };
                updatedCount++;
              }
            }
          }
        }

        setHoldings(updatedHoldings);

        if (updatedCount > 0 && Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        console.error("Price fetch failed:", error);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        const data = await loadHoldings();
        if (data.length > 0) fetchPricesForHoldings(data);
      };
      run();
    }, [loadHoldings, fetchPricesForHoldings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const current = await holdingsStorage.getAll();
    await fetchPricesForHoldings(current);
    setRefreshing(false);
  }, [fetchPricesForHoldings]);

  // Only reorders the array — does not modify any field values on the holdings.
  const handleDragEnd = useCallback(async ({ data }: { data: FlatItem[] }) => {
    const reorderedHoldings = data
      .filter((item) => item.type === "holding")
      .map((item) => item.data as PortfolioHolding);
    setHoldings(reorderedHoldings);
    await holdingsStorage.reorder(reorderedHoldings);
  }, []);

  const summary = useMemo(() => {
    const totalValue = holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0);
    const totalCost = holdings.reduce((s, h) => s + h.shares * h.averageCost, 0);
    const totalPL = totalValue - totalCost;
    const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    return { totalValue, totalCost, totalPL, totalPLPercent, holdingsCount: holdings.length };
  }, [holdings]);

  // Group holdings by ROLE (Core / Growth / Speculative / Income / Swing) —
  // matches the Claude Design handoff Portfolio mockup pattern.
  const groupedHoldings = useMemo(() => {
    const groups: { status: string; label: string; color: string; holdings: PortfolioHolding[] }[] =
      [];
    STOCK_ROLES.forEach((role) => {
      const roleHoldings = holdings.filter((h) => h.role === role.id);
      if (roleHoldings.length > 0) {
        groups.push({
          status: role.id,
          label: role.label,
          color: role.color,
          holdings: roleHoldings,
        });
      }
    });
    return groups;
  }, [holdings]);

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

  const sortedSymbols = useMemo(
    () =>
      [...holdings]
        .sort((a, b) => b.shares * b.currentPrice - a.shares * a.currentPrice)
        .map((h) => h.symbol),
    [holdings]
  );

  const handleAddHolding = () => navigation.navigate("AddHolding");
  const handleHoldingPress = (holding: PortfolioHolding) =>
    navigation.navigate("HoldingDetail", { holdingId: holding.id });

  // ── Insights panel ────────────────────────────────────────────────
  const renderInsightsPanel = () => (
    <View
      style={[
        styles.insightsContainer,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
      ]}
    >
      {/* Tab strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabStrip}
      >
        {INSIGHT_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tabBtn,
                isActive
                  ? { backgroundColor: theme.primary }
                  : { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText
                style={[
                  styles.tabLabel,
                  { color: isActive ? "#fff" : theme.textSecondary },
                ]}
              >
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Panel content — use display:none to keep components mounted (avoids re-fetching) */}
      <View style={styles.tabContent}>
        <View style={activeTab !== "sentiment" ? styles.hidden : undefined}>
          <PortfolioSentimentGauge symbols={sortedSymbols} />
        </View>
        <View style={activeTab !== "allocation" ? styles.hidden : undefined}>
          <PortfolioDonut holdings={holdings} />
        </View>
        <View style={activeTab !== "sector" ? styles.hidden : undefined}>
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
        </View>
      </View>
    </View>
  );

  // ── List header (summary only; holdings render immediately below — handoff) ─
  const renderListHeader = () => (
    <SummaryCard
      totalValue={summary.totalValue}
      totalPL={summary.totalPL}
      totalPLPercent={summary.totalPLPercent}
      holdingsCount={summary.holdingsCount}
    />
  );

  // ── Flattened data ────────────────────────────────────────────────
  const flattenedData = useMemo<FlatItem[]>(() => {
    const data: FlatItem[] = [];
    groupedHoldings.forEach((group) => {
      data.push({ type: "header", key: `header-${group.status}`, data: group });
      group.holdings.forEach((holding) => {
        data.push({ type: "holding", key: holding.id, data: holding });
      });
    });
    return data;
  }, [groupedHoldings]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top }]}>
      <View style={styles.titleBar}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.screenTitle}>Portfolio</ThemedText>
          <ThemedText style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
            Last updated just now
          </ThemedText>
        </View>
        <Pressable onPress={onRefresh} hitSlop={10}>
          <Feather name="refresh-cw" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>
      <DraggableFlatList<FlatItem>
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: Spacing.sm, paddingBottom: 100 + insets.bottom + Spacing["4xl"] },
          holdings.length === 0 && styles.emptyListContent,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={holdings.length > 0 ? flattenedData : []}
        keyExtractor={(item) => item.key}
        onDragEnd={handleDragEnd}
        ListHeaderComponent={holdings.length > 0 ? renderListHeader : null}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              image={require("../../assets/images/empty-portfolio.png")}
              title="No Holdings Yet"
              message="Add your first stock holding to start tracking your EGX portfolio performance"
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item, drag, isActive }: RenderItemParams<FlatItem>) => {
          if (item.type === "header") {
            const group = item.data;
            return (
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: theme.primary }]} />
                <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  {group.label.toUpperCase()} · {group.holdings.length}
                </ThemedText>
                <View style={[styles.sectionLine, { backgroundColor: theme.divider }]} />
              </View>
            );
          }
          return (
            <ScaleDecorator>
              <HoldingItem
                holding={item.data}
                onPress={() => handleHoldingPress(item.data)}
                onLongPress={drag}
              />
            </ScaleDecorator>
          );
        }}
      />
      <FAB onPress={handleAddHolding} bottom={100 + insets.bottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg },
  emptyListContent: { flexGrow: 1 },

  // Screen title bar (matches handoff Portfolio .screen-title-bar)
  titleBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  // Insights panel
  insightsContainer: {
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  tabStrip: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  tabBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabContent: {
    padding: Spacing.md,
    paddingTop: 0,
  },

  // Holdings label
  holdingsLabel: {
    marginBottom: Spacing.sm,
  },
  holdingsLabelText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionDot: {
    width: 7,
    height: 7,
    borderRadius: BorderRadius.full,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },
  hidden: {
    display: "none",
  },
});
