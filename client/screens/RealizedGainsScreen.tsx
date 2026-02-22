import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { FormInput } from "@/components/FormInput";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { realizedGainsStorage } from "@/lib/storage";
import type { RealizedGain } from "@/types";

type FormData = {
  symbol: string;
  shares: string;
  buyPrice: string;
  sellPrice: string;
  buyDate: string;
  sellDate: string;
};

const emptyForm: FormData = {
  symbol: "",
  shares: "",
  buyPrice: "",
  sellPrice: "",
  buyDate: "",
  sellDate: new Date().toISOString().split("T")[0],
};

export default function RealizedGainsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [gains, setGains] = useState<RealizedGain[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGain, setEditingGain] = useState<RealizedGain | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadGains = useCallback(async () => {
    try {
      const data = await realizedGainsStorage.getAll();
      setGains(
        data.sort(
          (a, b) =>
            new Date(b.sellDate).getTime() - new Date(a.sellDate).getTime()
        )
      );
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

  const openAdd = () => {
    setEditingGain(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (gain: RealizedGain) => {
    setEditingGain(gain);
    setForm({
      symbol: gain.symbol,
      shares: String(gain.shares),
      buyPrice: String(gain.buyPrice),
      sellPrice: String(gain.sellPrice),
      buyDate: gain.buyDate,
      sellDate: gain.sellDate,
    });
    setModalVisible(true);
  };

  const handleCardPress = (gain: RealizedGain) => {
    Alert.alert(gain.symbol, "What would you like to do?", [
      { text: "Edit", onPress: () => openEdit(gain) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => confirmDelete(gain),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const confirmDelete = (gain: RealizedGain) => {
    Alert.alert(
      "Delete Trade",
      `Delete ${gain.symbol} (${gain.shares} shares) from realized gains?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await realizedGainsStorage.delete(gain.id);
            if (Platform.OS !== "web")
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            loadGains();
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    const shares = parseFloat(form.shares);
    const buyPrice = parseFloat(form.buyPrice);
    const sellPrice = parseFloat(form.sellPrice);

    if (
      !form.symbol.trim() ||
      isNaN(shares) ||
      isNaN(buyPrice) ||
      isNaN(sellPrice) ||
      !form.sellDate
    ) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const profit = (sellPrice - buyPrice) * shares;

      if (editingGain) {
        await realizedGainsStorage.update(editingGain.id, {
          symbol: form.symbol.trim().toUpperCase(),
          shares,
          buyPrice,
          sellPrice,
          buyDate: form.buyDate || form.sellDate,
          sellDate: form.sellDate,
          profit,
        });
      } else {
        await realizedGainsStorage.add({
          symbol: form.symbol.trim().toUpperCase(),
          shares,
          buyPrice,
          sellPrice,
          buyDate: form.buyDate || form.sellDate,
          sellDate: form.sellDate,
          profit,
        });
      }

      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisible(false);
      loadGains();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const totalProfit = gains.reduce((sum, g) => sum + g.profit, 0);
  const profitableCount = gains.filter((g) => g.profit > 0).length;
  const lossCount = gains.filter((g) => g.profit < 0).length;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
    }).format(value);

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
        <View
          style={[styles.statDivider, { backgroundColor: theme.divider }]}
        />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: theme.error }]}>
            {lossCount}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Loss
          </ThemedText>
        </View>
        <View
          style={[styles.statDivider, { backgroundColor: theme.divider }]}
        />
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
      <Card style={styles.gainCard} onPress={() => handleCardPress(item)}>
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
            paddingBottom: insets.bottom + Spacing.xl + 80,
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
              message="Tap + to add a trade, or sell a position from your portfolio"
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

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary, bottom: insets.bottom + 70 }]}
        onPress={openAdd}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={20} color="#fff" />
        <ThemedText style={styles.addButtonText}>Add Trade</ThemedText>
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
          <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <ThemedText style={{ color: theme.primary, fontSize: 16 }}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <ThemedText type="h4">
              {editingGain ? "Edit Trade" : "Add Trade"}
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

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={{ padding: Spacing.lg }}
          >
            <FormInput
              label="Stock Symbol"
              value={form.symbol}
              onChangeText={(v) => setForm((f) => ({ ...f, symbol: v }))}
              placeholder="e.g., COMI"
              autoCapitalize="characters"
            />
            <FormInput
              label="Number of Shares"
              value={form.shares}
              onChangeText={(v) => setForm((f) => ({ ...f, shares: v }))}
              keyboardType="numeric"
              placeholder="e.g., 100"
            />
            <FormInput
              label="Buy Price per Share (EGP)"
              value={form.buyPrice}
              onChangeText={(v) => setForm((f) => ({ ...f, buyPrice: v }))}
              keyboardType="decimal-pad"
              placeholder="e.g., 45.00"
            />
            <FormInput
              label="Sell Price per Share (EGP)"
              value={form.sellPrice}
              onChangeText={(v) => setForm((f) => ({ ...f, sellPrice: v }))}
              keyboardType="decimal-pad"
              placeholder="e.g., 55.00"
            />
            <FormInput
              label="Buy Date"
              value={form.buyDate}
              onChangeText={(v) => setForm((f) => ({ ...f, buyDate: v }))}
              placeholder="YYYY-MM-DD"
            />
            <FormInput
              label="Sell Date"
              value={form.sellDate}
              onChangeText={(v) => setForm((f) => ({ ...f, sellDate: v }))}
              placeholder="YYYY-MM-DD"
            />

            {form.buyPrice && form.sellPrice && form.shares ? (
              <Card
                style={[
                  styles.previewCard,
                  {
                    backgroundColor:
                      (parseFloat(form.sellPrice) - parseFloat(form.buyPrice)) *
                        parseFloat(form.shares) >=
                      0
                        ? theme.success + "15"
                        : theme.error + "15",
                  },
                ]}
              >
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Estimated P/L
                </ThemedText>
                <ThemedText
                  type="h3"
                  style={[
                    Typography.mono,
                    {
                      color:
                        (parseFloat(form.sellPrice) -
                          parseFloat(form.buyPrice)) *
                          parseFloat(form.shares) >=
                        0
                          ? theme.success
                          : theme.error,
                    },
                  ]}
                >
                  {formatCurrency(
                    (parseFloat(form.sellPrice) - parseFloat(form.buyPrice)) *
                      parseFloat(form.shares)
                  )}
                </ThemedText>
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
  emptyListContent: { flexGrow: 1 },
  summaryCard: { marginBottom: Spacing.lg },
  summaryRow: { marginBottom: Spacing.lg },
  summaryItem: { alignItems: "center" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: Spacing.lg,
  },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 32 },
  statValue: { fontSize: 20, fontWeight: "700", marginBottom: Spacing.xs },
  gainCard: { marginBottom: Spacing.md },
  gainHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  profit: { fontSize: 18, fontWeight: "600" },
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
  previewCard: {
    marginTop: Spacing.md,
    alignItems: "center",
    padding: Spacing.lg,
  },
});
