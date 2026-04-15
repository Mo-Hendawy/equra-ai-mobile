import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useTheme } from "@/hooks/useTheme";
import { apiRequest, getQueryFn } from "@/lib/query-client";
import { holdingsStorage, realizedGainsStorage } from "@/lib/storage";
import { EGX_STOCKS } from "@/constants/egxStocks";

interface ThndrPending {
  id: number;
  receivedAt: number;
  invoiceDate: string;
  transactionNo: string;
  securityName: string;
  isin?: string | null;
  resolvedSymbol: string | null;
  resolutionSource: "isin" | "name-match" | "gemini" | null;
  transactionType: "buy" | "sell";
  quantity: number;
  price: number;
  value: number;
  fees: number;
  grandTotal: number;
}

interface PendingResponse {
  pending: ThndrPending[];
}

export default function ThndrImportsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data, isLoading, refetch, isRefetching, error } = useQuery<PendingResponse>({
    queryKey: ["api", "thndr", "pending"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top }]}>
        <Text style={{ color: theme.error }}>Could not load pending imports.</Text>
      </View>
    );
  }

  const items = data?.pending ?? [];
  if (items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top }]}>
        <Text style={{ color: theme.textSecondary, textAlign: "center", paddingHorizontal: 32 }}>
          No pending Thndr imports. Forwarded invoices will appear here for review.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 12, paddingTop: insets.top + 12, backgroundColor: theme.backgroundRoot }}
      style={{ backgroundColor: theme.backgroundRoot }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />}
      renderItem={({ item }) => (
        <PendingCard
          item={item}
          onSettled={() => qc.invalidateQueries({ queryKey: ["api", "thndr", "pending"] })}
        />
      )}
    />
  );
}

function PendingCard({ item, onSettled }: { item: ThndrPending; onSettled: () => void }) {
  const { theme } = useTheme();
  const [manualSymbol, setManualSymbol] = useState(item.resolvedSymbol ?? "");
  const [busy, setBusy] = useState(false);

  const finalSymbol = (manualSymbol || item.resolvedSymbol || "").toUpperCase().trim();
  const knownStock = EGX_STOCKS.find((s) => s.symbol === finalSymbol);

  async function approve() {
    if (!finalSymbol) {
      Alert.alert("Pick a symbol", "This transaction couldn't be auto-matched. Type the EGX ticker to continue.");
      return;
    }
    if (!knownStock) {
      Alert.alert("Unknown ticker", `"${finalSymbol}" is not in the EGX list. Double-check spelling.`);
      return;
    }
    setBusy(true);
    try {
      await applyToHoldings(item, knownStock);
      await apiRequest("POST", `/api/thndr/pending/${item.id}/import`);
      onSettled();
    } catch (e: any) {
      Alert.alert("Import failed", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function dismiss() {
    Alert.alert("Dismiss?", `Remove this ${item.transactionType} transaction from the queue?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Dismiss",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await apiRequest("DELETE", `/api/thndr/pending/${item.id}`);
            onSettled();
          } catch (e: any) {
            Alert.alert("Dismiss failed", e.message ?? String(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  const isBuy = item.transactionType === "buy";

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder }]}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: isBuy ? theme.success : theme.error }]}>
          <Text style={styles.badgeText}>{isBuy ? "BUY" : "SELL"}</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {item.resolvedSymbol ?? "?"} · {item.securityName}
        </Text>
      </View>

      <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
        {item.invoiceDate} · txn {item.transactionNo.slice(0, 18)}{item.transactionNo.length > 18 ? "…" : ""}
      </Text>

      <View style={[styles.detailRow, { borderTopColor: theme.divider }]}>
        <Detail label="Qty" value={item.quantity.toLocaleString()} theme={theme} />
        <Detail label="Price" value={`${item.price.toFixed(2)} EGP`} theme={theme} />
        <Detail label="Value" value={`${item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} theme={theme} />
        <Detail label="Fees" value={item.fees.toFixed(2)} theme={theme} />
      </View>
      <Text style={{ color: theme.text, marginTop: 6, fontSize: 14, fontWeight: "700" }}>
        Grand Total: EGP {item.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </Text>

      {item.resolvedSymbol ? (
        <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 6 }}>
          Matched via {item.resolutionSource}
        </Text>
      ) : (
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: theme.warning, fontSize: 12, marginBottom: 4 }}>
            Symbol not auto-matched. Enter EGX ticker:
          </Text>
          <TextInput
            placeholder="e.g. ISPH"
            placeholderTextColor={theme.textSecondary}
            value={manualSymbol}
            onChangeText={(t) => setManualSymbol(t.toUpperCase())}
            autoCapitalize="characters"
            style={[
              styles.input,
              { borderColor: theme.divider, color: theme.text, backgroundColor: theme.backgroundSecondary },
            ]}
          />
          {manualSymbol && !knownStock && (
            <Text style={{ color: theme.error, fontSize: 11, marginTop: 4 }}>
              "{finalSymbol}" not found in EGX list
            </Text>
          )}
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable
          onPress={dismiss}
          disabled={busy}
          style={[styles.btn, styles.btnGhost, { borderColor: theme.divider }]}
        >
          <Text style={{ color: theme.textSecondary, fontWeight: "600" }}>Dismiss</Text>
        </Pressable>
        <Pressable
          onPress={approve}
          disabled={busy || !finalSymbol || !knownStock}
          style={[
            styles.btn,
            styles.btnPrimary,
            {
              backgroundColor: (!finalSymbol || !knownStock) ? theme.divider : theme.primary,
              opacity: busy ? 0.6 : 1,
            },
          ]}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {busy ? "Working…" : isBuy ? "Add to portfolio" : "Record sell"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Detail({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: theme.textSecondary, fontSize: 10, textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 13, fontWeight: "600" }} numberOfLines={1}>{value}</Text>
    </View>
  );
}

/**
 * Apply a pending Thndr transaction to the user's local AsyncStorage holdings.
 * Buy: upsert — if the symbol already exists, update shares + weighted-average cost.
 * Sell: reduce existing holding shares; record realized gain; delete holding if zero.
 */
async function applyToHoldings(
  txn: ThndrPending,
  stock: (typeof EGX_STOCKS)[number]
): Promise<void> {
  const symbol = stock.symbol;
  const holdings = await holdingsStorage.getAll();
  const existing = holdings.find((h) => h.symbol === symbol);

  if (txn.transactionType === "buy") {
    if (existing) {
      const newShares = existing.shares + txn.quantity;
      const newAvg =
        newShares === 0
          ? 0
          : (existing.shares * existing.averageCost + txn.quantity * txn.price) / newShares;
      await holdingsStorage.update(existing.id, { shares: newShares, averageCost: Number(newAvg.toFixed(4)) });
    } else {
      await holdingsStorage.add({
        symbol,
        nameEn: stock.nameEn,
        nameAr: stock.nameAr,
        sector: stock.sector,
        shares: txn.quantity,
        averageCost: txn.price,
        currentPrice: txn.price,
        role: "growth",
        status: "hold",
      });
    }
    return;
  }

  // SELL
  if (!existing) {
    throw new Error(`Cannot sell ${symbol} — no existing holding found`);
  }
  const newShares = existing.shares - txn.quantity;
  if (newShares < 0) {
    throw new Error(`Cannot sell ${txn.quantity} ${symbol} — only ${existing.shares} held`);
  }
  const profit = (txn.price - existing.averageCost) * txn.quantity;
  await realizedGainsStorage.add({
    symbol,
    shares: txn.quantity,
    buyPrice: existing.averageCost,
    sellPrice: txn.price,
    buyDate: existing.createdAt ?? new Date().toISOString(),
    sellDate: new Date().toISOString(),
    profit,
  });
  if (newShares === 0) {
    await holdingsStorage.delete(existing.id);
  } else {
    await holdingsStorage.update(existing.id, { shares: newShares });
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontWeight: "700", fontSize: 15, flex: 1 },
  detailRow: {
    flexDirection: "row",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    minWidth: 44,
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnGhost: { borderWidth: 1 },
  btnPrimary: {},
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
