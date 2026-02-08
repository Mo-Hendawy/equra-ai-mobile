import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { targetsStorage, holdingsStorage } from "@/lib/storage";
import type { Target, PortfolioHolding } from "@/types";

export default function TargetsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const [targets, setTargets] = useState<Target[]>([]);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [targetsData, holdingsData] = await Promise.all([
        targetsStorage.getAll(),
        holdingsStorage.getAll(),
      ]);
      setTargets(targetsData);
      setHoldings(holdingsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const totalValue = holdings.reduce(
    (sum, h) => sum + h.shares * h.currentPrice,
    0
  );

  const sectorAllocations = React.useMemo(() => {
    const sectorMap = new Map<string, number>();
    holdings.forEach((h) => {
      const value = h.shares * h.currentPrice;
      sectorMap.set(h.sector, (sectorMap.get(h.sector) || 0) + value);
    });
    return Array.from(sectorMap.entries()).map(([sector, value]) => ({
      sector,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }));
  }, [holdings, totalValue]);

  const roleAllocations = React.useMemo(() => {
    const roleMap = new Map<string, number>();
    holdings.forEach((h) => {
      const value = h.shares * h.currentPrice;
      roleMap.set(h.role, (roleMap.get(h.role) || 0) + value);
    });
    return Array.from(roleMap.entries()).map(([role, value]) => ({
      role,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }));
  }, [holdings, totalValue]);

  const handleAddTarget = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await targetsStorage.add({
      name: "New Target",
      targetPercentage: 20,
      currentPercentage: 0,
      category: "custom",
    });
    loadData();
  };

  const handleDeleteTarget = async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await targetsStorage.delete(id);
    loadData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={[1]}
        keyExtractor={() => "content"}
        renderItem={() => (
          <>
            <Card style={styles.section}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Sector Allocation
              </ThemedText>
              {sectorAllocations.length === 0 ? (
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary, textAlign: "center" }}
                >
                  Add holdings to see sector allocation
                </ThemedText>
              ) : (
                sectorAllocations.map((item) => (
                  <View key={item.sector} style={styles.allocationRow}>
                    <View style={styles.allocationInfo}>
                      <ThemedText>{item.sector}</ThemedText>
                      <ThemedText
                        type="small"
                        style={{ color: theme.textSecondary }}
                      >
                        {formatCurrency(item.value)}
                      </ThemedText>
                    </View>
                    <View style={styles.progressContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          { backgroundColor: theme.divider },
                        ]}
                      >
                        <View
                          style={[
                            styles.progress,
                            {
                              backgroundColor: theme.primary,
                              width: `${Math.min(item.percentage, 100)}%`,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText style={styles.percentText}>
                        {item.percentage.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </View>
                ))
              )}
            </Card>

            <Card style={styles.section}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Role Allocation
              </ThemedText>
              {roleAllocations.length === 0 ? (
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary, textAlign: "center" }}
                >
                  Add holdings to see role allocation
                </ThemedText>
              ) : (
                roleAllocations.map((item) => (
                  <View key={item.role} style={styles.allocationRow}>
                    <View style={styles.allocationInfo}>
                      <ThemedText style={{ textTransform: "capitalize" }}>
                        {item.role.replace("_", " ")}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        style={{ color: theme.textSecondary }}
                      >
                        {formatCurrency(item.value)}
                      </ThemedText>
                    </View>
                    <View style={styles.progressContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          { backgroundColor: theme.divider },
                        ]}
                      >
                        <View
                          style={[
                            styles.progress,
                            {
                              backgroundColor: theme.accent,
                              width: `${Math.min(item.percentage, 100)}%`,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText style={styles.percentText}>
                        {item.percentage.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </View>
                ))
              )}
            </Card>

            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="h4">Custom Targets</ThemedText>
                <Pressable onPress={handleAddTarget}>
                  <Feather name="plus-circle" size={24} color={theme.primary} />
                </Pressable>
              </View>
              {targets.length === 0 ? (
                <ThemedText
                  type="small"
                  style={{
                    color: theme.textSecondary,
                    textAlign: "center",
                    marginTop: Spacing.md,
                  }}
                >
                  Tap + to add allocation targets
                </ThemedText>
              ) : (
                targets.map((target) => (
                  <Pressable
                    key={target.id}
                    onLongPress={() => handleDeleteTarget(target.id)}
                    style={styles.targetRow}
                  >
                    <View style={styles.allocationInfo}>
                      <ThemedText>{target.name}</ThemedText>
                      <ThemedText
                        type="small"
                        style={{ color: theme.textSecondary }}
                      >
                        Target: {target.targetPercentage}%
                      </ThemedText>
                    </View>
                    <View style={styles.progressContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          { backgroundColor: theme.divider },
                        ]}
                      >
                        <View
                          style={[
                            styles.progress,
                            {
                              backgroundColor:
                                target.currentPercentage >= target.targetPercentage
                                  ? theme.success
                                  : theme.warning,
                              width: `${Math.min(
                                (target.currentPercentage / target.targetPercentage) * 100,
                                100
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText style={styles.percentText}>
                        {target.currentPercentage.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </Pressable>
                ))
              )}
            </Card>
          </>
        )}
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
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  allocationRow: {
    marginBottom: Spacing.md,
  },
  targetRow: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  allocationInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: Spacing.sm,
  },
  progress: {
    height: "100%",
    borderRadius: 4,
  },
  percentText: {
    width: 50,
    textAlign: "right",
    fontWeight: "500",
    fontSize: 13,
  },
});
