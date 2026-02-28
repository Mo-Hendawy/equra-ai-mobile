import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Modal,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { FormInput } from "@/components/FormInput";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { targetsStorage, holdingsStorage } from "@/lib/storage";
import { EGX_STOCKS } from "@/constants/egxStocks";
import type { Target, PortfolioHolding } from "@/types";

export default function TargetsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [targets, setTargets] = useState<Target[]>([]);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [targetPct, setTargetPct] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [showStockPicker, setShowStockPicker] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const totalValue = useMemo(
    () => holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0),
    [holdings]
  );

  const currentAllocMap = useMemo(() => {
    const map: Record<string, number> = {};
    holdings.forEach((h) => {
      const pct = totalValue > 0 ? ((h.shares * h.currentPrice) / totalValue) * 100 : 0;
      map[h.symbol] = pct;
    });
    return map;
  }, [holdings, totalValue]);

  const totalTargetPct = useMemo(
    () => targets.reduce((sum, t) => sum + t.targetPercentage, 0),
    [targets]
  );

  const filteredStocks = useMemo(() => {
    const q = stockSearch.toLowerCase();
    return EGX_STOCKS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [stockSearch]);

  const openAdd = () => {
    setEditingTarget(null);
    setSelectedSymbol("");
    setTargetPct("");
    setStockSearch("");
    setShowStockPicker(false);
    setModalVisible(true);
  };

  const openEdit = (target: Target) => {
    setEditingTarget(target);
    setSelectedSymbol(target.symbol);
    setTargetPct(String(target.targetPercentage));
    setStockSearch("");
    setShowStockPicker(false);
    setModalVisible(true);
  };

  const handleCardPress = (target: Target) => {
    Alert.alert(
      `${target.symbol} Target`,
      `Target: ${target.targetPercentage}%\nCurrent: ${(currentAllocMap[target.symbol] || 0).toFixed(1)}%`,
      [
        { text: "Edit", onPress: () => openEdit(target) },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDelete(target),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const confirmDelete = (target: Target) => {
    Alert.alert("Delete Target", `Remove ${target.symbol} target?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await targetsStorage.delete(target.id);
          if (Platform.OS !== "web")
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          loadData();
        },
      },
    ]);
  };

  const handleSave = async () => {
    const pct = parseFloat(targetPct);
    if (!selectedSymbol || isNaN(pct) || pct <= 0 || pct > 100) {
      Alert.alert("Invalid", "Select a stock and enter a valid target percentage (1-100).");
      return;
    }

    const existingDuplicate = targets.find(
      (t) => t.symbol === selectedSymbol && t.id !== editingTarget?.id
    );
    if (existingDuplicate) {
      Alert.alert("Duplicate", `${selectedSymbol} already has a target.`);
      return;
    }

    setSaving(true);
    try {
      const stockInfo = EGX_STOCKS.find((s) => s.symbol === selectedSymbol);
      if (editingTarget) {
        await targetsStorage.update(editingTarget.id, {
          symbol: selectedSymbol,
          name: stockInfo?.nameEn || selectedSymbol,
          targetPercentage: pct,
          currentPercentage: currentAllocMap[selectedSymbol] || 0,
        });
      } else {
        await targetsStorage.add({
          symbol: selectedSymbol,
          name: stockInfo?.nameEn || selectedSymbol,
          targetPercentage: pct,
          currentPercentage: currentAllocMap[selectedSymbol] || 0,
          category: "custom",
        });
      }

      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error("Failed to save target:", error);
    } finally {
      setSaving(false);
    }
  };

  const getDiffColor = (current: number, target: number) => {
    const diff = current - target;
    if (Math.abs(diff) < 1) return theme.success;
    if (diff < 0) return theme.warning;
    return theme.error;
  };

  const renderTarget = ({ item }: { item: Target }) => {
    const current = currentAllocMap[item.symbol] || 0;
    const diff = current - item.targetPercentage;
    const progressPct = item.targetPercentage > 0
      ? Math.min((current / item.targetPercentage) * 100, 100)
      : 0;

    return (
      <Card style={styles.targetCard} onPress={() => handleCardPress(item)}>
        <View style={styles.targetHeader}>
          <View>
            <ThemedText type="h4">{item.symbol}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={1}>
              {item.name}
            </ThemedText>
          </View>
          <View style={styles.targetBadge}>
            <ThemedText
              style={[
                styles.diffText,
                Typography.mono,
                { color: getDiffColor(current, item.targetPercentage) },
              ]}
            >
              {diff >= 0 ? "+" : ""}
              {diff.toFixed(1)}%
            </ThemedText>
          </View>
        </View>

        <View style={styles.pctRow}>
          <View style={styles.pctItem}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Current
            </ThemedText>
            <ThemedText style={[Typography.mono, styles.pctValue]}>
              {current.toFixed(1)}%
            </ThemedText>
          </View>
          <Feather name="arrow-right" size={14} color={theme.textSecondary} />
          <View style={[styles.pctItem, { alignItems: "flex-end" }]}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Target
            </ThemedText>
            <ThemedText style={[Typography.mono, styles.pctValue, { color: theme.primary }]}>
              {item.targetPercentage.toFixed(1)}%
            </ThemedText>
          </View>
        </View>

        <View style={[styles.progressBar, { backgroundColor: theme.divider }]}>
          <View
            style={[
              styles.progress,
              {
                backgroundColor: getDiffColor(current, item.targetPercentage),
                width: `${progressPct}%`,
              },
            ]}
          />
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Total Target
          </ThemedText>
          <ThemedText
            type="h3"
            style={[
              Typography.mono,
              { color: totalTargetPct > 100 ? theme.error : theme.primary },
            ]}
          >
            {totalTargetPct.toFixed(1)}%
          </ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Stocks
          </ThemedText>
          <ThemedText type="h3">{targets.length}</ThemedText>
        </View>
      </View>
      {totalTargetPct > 100 && (
        <ThemedText
          type="small"
          style={{ color: theme.error, textAlign: "center", marginTop: Spacing.sm }}
        >
          Targets exceed 100% — consider adjusting
        </ThemedText>
      )}
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl + 80,
          },
          targets.length === 0 && styles.emptyListContent,
        ]}
        data={targets}
        keyExtractor={(item) => item.id}
        renderItem={renderTarget}
        ListHeaderComponent={targets.length > 0 ? renderHeader : null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="target" size={48} color={theme.textSecondary} />
            <ThemedText type="h4" style={{ marginTop: Spacing.md }}>
              No Targets Set
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}
            >
              Set target allocations for your stocks to track how your portfolio compares to your goals
            </ThemedText>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      />

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary, bottom: insets.bottom + 70 }]}
        onPress={openAdd}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={20} color="#fff" />
        <ThemedText style={styles.addButtonText}>Add Target</ThemedText>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.divider, paddingTop: insets.top + Spacing.sm }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <ThemedText style={{ color: theme.primary, fontSize: 16 }}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText type="h4">
              {editingTarget ? "Edit Target" : "Add Target"}
            </ThemedText>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <ThemedText
                style={{
                  color: theme.primary,
                  fontSize: 16,
                  fontWeight: "600",
                  opacity: saving ? 0.5 : 1,
                }}
              >
                Save
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={{ padding: Spacing.lg }}>
            {/* Stock Selection */}
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              Stock
            </ThemedText>
            {selectedSymbol && !showStockPicker ? (
              <TouchableOpacity
                style={[styles.selectedStock, { backgroundColor: theme.backgroundSecondary, borderColor: theme.primary }]}
                onPress={() => setShowStockPicker(true)}
              >
                <View>
                  <ThemedText type="h4">{selectedSymbol}</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {EGX_STOCKS.find((s) => s.symbol === selectedSymbol)?.nameEn || ""}
                  </ThemedText>
                </View>
                <Feather name="edit-2" size={16} color={theme.primary} />
              </TouchableOpacity>
            ) : (
              <View>
                <TextInput
                  style={[
                    styles.searchInput,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: theme.divider,
                    },
                  ]}
                  placeholder="Search stock symbol or name..."
                  placeholderTextColor={theme.textSecondary}
                  value={stockSearch}
                  onChangeText={(v) => {
                    setStockSearch(v);
                    setShowStockPicker(true);
                  }}
                  onFocus={() => setShowStockPicker(true)}
                  autoCapitalize="characters"
                />
                {showStockPicker && filteredStocks.length > 0 && (
                  <View style={[styles.stockList, { backgroundColor: theme.backgroundSecondary, borderColor: theme.divider }]}>
                    {filteredStocks.map((s) => (
                      <TouchableOpacity
                        key={s.symbol}
                        style={[styles.stockOption, { borderBottomColor: theme.divider }]}
                        onPress={() => {
                          setSelectedSymbol(s.symbol);
                          setStockSearch("");
                          setShowStockPicker(false);
                        }}
                      >
                        <ThemedText style={{ fontWeight: "600" }}>{s.symbol}</ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1, marginLeft: 8 }} numberOfLines={1}>
                          {s.nameEn}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {(currentAllocMap[s.symbol] || 0).toFixed(1)}%
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={{ marginTop: Spacing.lg }}>
              <FormInput
                label="Target Allocation (%)"
                value={targetPct}
                onChangeText={setTargetPct}
                keyboardType="decimal-pad"
                placeholder="e.g., 15"
              />
            </View>

            {selectedSymbol && targetPct ? (
              <Card style={[styles.previewCard, { backgroundColor: theme.backgroundSecondary }]}>
                <View style={styles.previewRow}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Current Allocation
                  </ThemedText>
                  <ThemedText style={Typography.mono}>
                    {(currentAllocMap[selectedSymbol] || 0).toFixed(1)}%
                  </ThemedText>
                </View>
                <View style={styles.previewRow}>
                  <ThemedText type="small" style={{ color: theme.primary }}>
                    Target Allocation
                  </ThemedText>
                  <ThemedText style={[Typography.mono, { color: theme.primary }]}>
                    {parseFloat(targetPct).toFixed(1)}%
                  </ThemedText>
                </View>
                <View style={[styles.previewRow, { borderTopWidth: 1, borderTopColor: theme.divider, paddingTop: Spacing.sm, marginTop: Spacing.sm }]}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Difference
                  </ThemedText>
                  <ThemedText
                    style={[
                      Typography.mono,
                      {
                        color: getDiffColor(
                          currentAllocMap[selectedSymbol] || 0,
                          parseFloat(targetPct) || 0
                        ),
                      },
                    ]}
                  >
                    {((currentAllocMap[selectedSymbol] || 0) - (parseFloat(targetPct) || 0)).toFixed(1)}%
                  </ThemedText>
                </View>
              </Card>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg },
  emptyListContent: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingHorizontal: Spacing.xl },
  summaryCard: { marginBottom: Spacing.lg },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center" },
  targetCard: { marginBottom: Spacing.md },
  targetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  targetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  diffText: { fontSize: 14, fontWeight: "700" },
  pctRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  pctItem: {},
  pctValue: { fontSize: 16, fontWeight: "600", marginTop: 2 },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progress: { height: "100%", borderRadius: 3 },
  addButton: {
    position: "absolute",
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalBody: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: "500", marginBottom: Spacing.sm },
  selectedStock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  searchInput: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 15,
  },
  stockList: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    maxHeight: 250,
  },
  stockOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  previewCard: { marginTop: Spacing.lg, padding: Spacing.lg },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
});
