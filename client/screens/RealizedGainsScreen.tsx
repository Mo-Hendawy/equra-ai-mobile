import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { realizedGainsStorage } from "@/lib/storage";
import type { RealizedGain } from "@/types";

export default function RealizedGainsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const [gains, setGains] = useState<RealizedGain[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadGains = useCallback(async () => {
    try {
      const data = await realizedGainsStorage.getAll();
      setGains(data.sort((a, b) => 
        new Date(b.sellDate).getTime() - new Date(a.sellDate).getTime()
      ));
    } catch (error) {
      console.error("Failed to load gains:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGains();
    }, [loadGains])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGains();
    setRefreshing(false);
  }, [loadGains]);

  const totalProfit = gains.reduce((sum, g) => sum + g.profit, 0);
  const profitableCount = gains.filter((g) => g.profit > 0).length;
  const lossCount = gains.filter((g) => g.profit < 0).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
    }).format(value);
  };

  const renderHeader = () => (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Total Realized P/L
          </ThemedText>
          <ThemedText
            type="h3"
            style={[
              Typography.mono,
              { color: totalProfit >= 0 ? theme.success : theme.error },
            ]}
          >
            {totalProfit >= 0 ? "+" : ""}
            {formatCurrency(totalProfit)}
          </ThemedText>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: theme.success }]}>
            {profitableCount}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Profitable
          </ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: theme.error }]}>
            {lossCount}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Loss
          </ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{gains.length}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Total Trades
          </ThemedText>
        </View>
      </View>
    </Card>
  );

  const renderGain = ({ item }: { item: RealizedGain }) => {
    const isProfit = item.profit >= 0;
    const profitPercent = 
      item.buyPrice > 0 
        ? ((item.sellPrice - item.buyPrice) / item.buyPrice) * 100 
        : 0;

    return (
      <Card style={styles.gainCard}>
        <View style={styles.gainHeader}>
          <ThemedText type="h4">{item.symbol}</ThemedText>
          <ThemedText
            style={[
              styles.profit,
              Typography.mono,
              { color: isProfit ? theme.success : theme.error },
            ]}
          >
            {isProfit ? "+" : ""}
            {formatCurrency(item.profit)}
          </ThemedText>
        </View>
        <View style={styles.gainDetails}>
          <View style={styles.detailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Shares
            </ThemedText>
            <ThemedText type="small">{item.shares}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Buy Price
            </ThemedText>
            <ThemedText type="small" style={Typography.mono}>
              {formatCurrency(item.buyPrice)}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Sell Price
            </ThemedText>
            <ThemedText type="small" style={Typography.mono}>
              {formatCurrency(item.sellPrice)}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Return
            </ThemedText>
            <ThemedText
              type="small"
              style={[
                Typography.mono,
                { color: isProfit ? theme.success : theme.error },
              ]}
            >
              {isProfit ? "+" : ""}
              {profitPercent.toFixed(2)}%
            </ThemedText>
          </View>
        </View>
        <View style={styles.dateRow}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {new Date(item.buyDate).toLocaleDateString("en-EG", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {" → "}
            {new Date(item.sellDate).toLocaleDateString("en-EG", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </ThemedText>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
          gains.length === 0 && !loading && styles.emptyListContent,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={gains}
        keyExtractor={(item) => item.id}
        renderItem={renderGain}
        ListHeaderComponent={gains.length > 0 ? renderHeader : null}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              image={require("../../assets/images/empty-portfolio.png")}
              title="No Realized Gains Yet"
              message="Sell a position to record your realized profits or losses"
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
      />
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
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    marginBottom: Spacing.lg,
  },
  summaryItem: {
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  gainCard: {
    marginBottom: Spacing.md,
  },
  gainHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  profit: {
    fontSize: 18,
    fontWeight: "600",
  },
  gainDetails: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  dateRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
});
