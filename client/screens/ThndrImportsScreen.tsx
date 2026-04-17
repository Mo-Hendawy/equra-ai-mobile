import React, { useMemo, useState } from "react";
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
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";

import { useTheme } from "@/hooks/useTheme";
import { apiRequest, getQueryFn } from "@/lib/query-client";
import {
  holdingsStorage,
  realizedGainsStorage,
  transactionsStorage,
} from "@/lib/storage";
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

// ──────────────────────────────────────────────
// Main screen
// ──────────────────────────────────────────────

export default function ThndrImportsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [lastUploadPayload, setLastUploadPayload] = useState<{
    base64: string;
    contentType: string;
  } | null>(null);

  const { data, isLoading, refetch, isRefetching, error } =
    useQuery<PendingResponse>({
      queryKey: ["api", "thndr", "pending"],
      queryFn: getQueryFn({ on401: "throw" }),
    });

  async function doUpload(payload: { base64: string; contentType: string }, force: boolean) {
    setUploading(true);
    try {
      const res = await apiRequest("POST", "/api/thndr/upload", {
        ...payload,
        force,
      });
      const json = await res.json();
      await qc.invalidateQueries({ queryKey: ["api", "thndr", "pending"] });

      const savedCount = json.savedCount ?? 0;
      const dupes = json.duplicateCount ?? 0;
      const errs = json.errors ?? [];

      if (savedCount > 0) {
        Alert.alert(
          "Imported",
          `${savedCount} transaction${savedCount === 1 ? "" : "s"} added to your review queue.`
        );
        setLastUploadPayload(null);
      } else if (dupes > 0 && errs.length === 0 && !force) {
        // Fix 4: offer to force-add duplicates
        setLastUploadPayload(payload);
        Alert.alert(
          "Duplicate transactions",
          `${dupes} transaction${dupes === 1 ? " was" : "s were"} already imported. Add again anyway?`,
          [
            { text: "Cancel", style: "cancel", onPress: () => setLastUploadPayload(null) },
            {
              text: "Add anyway",
              onPress: () => doUpload(payload, true),
            },
          ]
        );
      } else if (dupes > 0 && force) {
        Alert.alert("Done", `${dupes} duplicate transaction${dupes === 1 ? "" : "s"} re-added.`);
        setLastUploadPayload(null);
      } else {
        Alert.alert(
          "No transactions found",
          errs.length > 0
            ? errs.join("\n")
            : "The file didn't contain any recognizable Thndr transactions."
        );
      }
    } catch (e: any) {
      Alert.alert("Upload failed", e.message ?? String(e));
    } finally {
      setUploading(false);
    }
  }

  async function handleUpload() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const mimeType =
        asset.mimeType ??
        (asset.name?.toLowerCase().endsWith(".pdf")
          ? "application/pdf"
          : "image/jpeg");
      const base64 = await readAsBase64(asset.uri);
      await doUpload({ base64, contentType: mimeType }, false);
    } catch (e: any) {
      Alert.alert("Upload failed", e.message ?? String(e));
    }
  }

  if (isLoading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight },
        ]}
      >
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight },
        ]}
      >
        <Text style={{ color: theme.error }}>
          Could not load pending imports.
        </Text>
      </View>
    );
  }

  const items = data?.pending ?? [];

  const headerNode = (
    <View style={{ marginBottom: 12 }}>
      <Pressable
        onPress={handleUpload}
        disabled={uploading}
        style={[
          styles.uploadBtn,
          {
            backgroundColor: theme.primary,
            opacity: uploading ? 0.6 : 1,
          },
        ]}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {uploading ? "Parsing…" : "Upload invoice (PDF or screenshot)"}
        </Text>
      </Pressable>
      <Text
        style={{
          color: theme.textSecondary,
          fontSize: 11,
          marginTop: 6,
          textAlign: "center",
        }}
      >
        Forwarded Thndr emails land here automatically. Use this button for
        one-off imports.
      </Text>
    </View>
  );

  if (items.length === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.backgroundRoot,
            paddingTop: headerHeight + 12,
            paddingHorizontal: 12,
          },
        ]}
      >
        {headerNode}
        <View style={[styles.center, { flex: 1 }]}>
          <Text
            style={{
              color: theme.textSecondary,
              textAlign: "center",
              paddingHorizontal: 32,
            }}
          >
            No pending Thndr imports. Forwarded invoices will appear here for
            review.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{
        padding: 12,
        paddingTop: headerHeight + 12,
        backgroundColor: theme.backgroundRoot,
      }}
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      ListHeaderComponent={headerNode}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={theme.primary}
        />
      }
      renderItem={({ item }) => (
        <PendingCard
          item={item}
          onSettled={() =>
            qc.invalidateQueries({ queryKey: ["api", "thndr", "pending"] })
          }
        />
      )}
    />
  );
}

// ──────────────────────────────────────────────
// Symbol picker with dropdown
// ──────────────────────────────────────────────

function SymbolPicker({
  initialSymbol,
  matchSource,
  onSelect,
  theme,
}: {
  initialSymbol: string;
  matchSource: string | null;
  onSelect: (stock: (typeof EGX_STOCKS)[number] | null) => void;
  theme: any;
}) {
  const [query, setQuery] = useState(initialSymbol);
  const [editing, setEditing] = useState(!initialSymbol);
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = useMemo(() => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    return EGX_STOCKS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.nameAr.includes(query)
    ).slice(0, 8);
  }, [query]);

  const selectedStock = EGX_STOCKS.find(
    (s) => s.symbol === query.toUpperCase()
  );

  if (!editing && initialSymbol) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 11, flex: 1 }}>
          Matched via {matchSource}
        </Text>
        <Pressable
          onPress={() => {
            setEditing(true);
            setShowDropdown(true);
          }}
          style={[styles.changeBtn, { borderColor: theme.divider }]}
        >
          <Text style={{ color: theme.primary, fontSize: 11, fontWeight: "600" }}>
            Change
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 8 }}>
      {!initialSymbol && (
        <Text style={{ color: theme.warning, fontSize: 12, marginBottom: 4 }}>
          Symbol not auto-matched. Pick from the list:
        </Text>
      )}
      <TextInput
        placeholder="Search by ticker or name…"
        placeholderTextColor={theme.textSecondary}
        value={query}
        onChangeText={(t) => {
          setQuery(t.toUpperCase());
          setShowDropdown(true);
          const exact = EGX_STOCKS.find((s) => s.symbol === t.toUpperCase());
          onSelect(exact ?? null);
        }}
        autoCapitalize="characters"
        style={[
          styles.input,
          {
            borderColor: theme.divider,
            color: theme.text,
            backgroundColor: theme.backgroundSecondary,
          },
        ]}
      />
      {showDropdown && filtered.length > 0 && (
        <ScrollView
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.cardBorder,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {filtered.map((s) => (
            <Pressable
              key={s.symbol}
              onPress={() => {
                setQuery(s.symbol);
                setShowDropdown(false);
                setEditing(false);
                onSelect(s);
              }}
              style={[styles.dropdownRow, { borderBottomColor: theme.divider }]}
            >
              <Text style={{ color: theme.text, fontWeight: "700", fontSize: 13 }}>
                {s.symbol}
              </Text>
              <Text
                style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 8, flex: 1 }}
                numberOfLines={1}
              >
                {s.nameEn}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      {query && !selectedStock && filtered.length === 0 && (
        <Text style={{ color: theme.error, fontSize: 11, marginTop: 4 }}>
          &quot;{query}&quot; not found in EGX list
        </Text>
      )}
    </View>
  );
}

// ──────────────────────────────────────────────
// Pending transaction card
// ──────────────────────────────────────────────

function PendingCard({
  item,
  onSettled,
}: {
  item: ThndrPending;
  onSettled: () => void;
}) {
  const { theme } = useTheme();
  const [selectedStock, setSelectedStock] = useState<
    (typeof EGX_STOCKS)[number] | null
  >(EGX_STOCKS.find((s) => s.symbol === item.resolvedSymbol) ?? null);
  const [busy, setBusy] = useState(false);

  async function approve() {
    if (!selectedStock) {
      Alert.alert(
        "Pick a symbol",
        "Select a stock from the dropdown before adding."
      );
      return;
    }
    setBusy(true);
    try {
      const holdingId = await applyToHoldings(item, selectedStock);
      // Fix 2: also write to transactionsStorage
      await transactionsStorage.add({
        holdingId,
        symbol: selectedStock.symbol,
        type: item.transactionType,
        shares: item.quantity,
        pricePerShare: item.price,
        fees: item.fees,
        date: convertDate(item.invoiceDate),
        notes: `Thndr import: ${item.transactionNo}`,
      });
      await apiRequest("POST", `/api/thndr/pending/${item.id}/import`);
      onSettled();
    } catch (e: any) {
      Alert.alert("Import failed", e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function dismiss() {
    Alert.alert(
      "Dismiss?",
      `Remove this ${item.transactionType} transaction from the queue?`,
      [
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
      ]
    );
  }

  const isBuy = item.transactionType === "buy";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.badge,
            { backgroundColor: isBuy ? theme.success : theme.error },
          ]}
        >
          <Text style={styles.badgeText}>{isBuy ? "BUY" : "SELL"}</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {selectedStock?.symbol ?? item.resolvedSymbol ?? "?"} ·{" "}
          {item.securityName}
        </Text>
      </View>

      <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
        {item.invoiceDate} · txn{" "}
        {item.transactionNo.slice(0, 18)}
        {item.transactionNo.length > 18 ? "…" : ""}
      </Text>

      <View style={[styles.detailRow, { borderTopColor: theme.divider }]}>
        <Detail
          label="Qty"
          value={item.quantity.toLocaleString()}
          theme={theme}
        />
        <Detail
          label="Price"
          value={`${item.price.toFixed(2)} EGP`}
          theme={theme}
        />
        <Detail
          label="Value"
          value={item.value.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}
          theme={theme}
        />
        <Detail label="Fees" value={item.fees.toFixed(2)} theme={theme} />
      </View>
      <Text
        style={{
          color: theme.text,
          marginTop: 6,
          fontSize: 14,
          fontWeight: "700",
        }}
      >
        Grand Total: EGP{" "}
        {item.grandTotal.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}
      </Text>

      {/* Fix 1 + Fix 3: always show picker with Change for matched, search for unmatched */}
      <SymbolPicker
        initialSymbol={item.resolvedSymbol ?? ""}
        matchSource={item.resolutionSource}
        onSelect={setSelectedStock}
        theme={theme}
      />

      <View style={styles.actionRow}>
        <Pressable
          onPress={dismiss}
          disabled={busy}
          style={[styles.btn, styles.btnGhost, { borderColor: theme.divider }]}
        >
          <Text style={{ color: theme.textSecondary, fontWeight: "600" }}>
            Dismiss
          </Text>
        </Pressable>
        <Pressable
          onPress={approve}
          disabled={busy || !selectedStock}
          style={[
            styles.btn,
            styles.btnPrimary,
            {
              backgroundColor: !selectedStock ? theme.divider : theme.primary,
              opacity: busy ? 0.6 : 1,
            },
          ]}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {busy
              ? "Working…"
              : isBuy
                ? "Add to portfolio"
                : "Record sell"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Detail({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: theme.textSecondary,
          fontSize: 10,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <Text
        style={{ color: theme.text, fontSize: 13, fontWeight: "600" }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// ──────────────────────────────────────────────
// Apply to holdings + record transaction
// ──────────────────────────────────────────────

/** Convert "DD/MM/YYYY" to ISO date string. */
function convertDate(ddmmyyyy: string): string {
  const parts = ddmmyyyy.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Apply a pending Thndr transaction to the user's local AsyncStorage holdings.
 * Returns the holdingId (existing or newly created) for transactionsStorage.
 */
async function applyToHoldings(
  txn: ThndrPending,
  stock: (typeof EGX_STOCKS)[number]
): Promise<string> {
  const symbol = stock.symbol;
  const holdings = await holdingsStorage.getAll();
  const existing = holdings.find((h) => h.symbol === symbol);

  if (txn.transactionType === "buy") {
    if (existing) {
      const newShares = existing.shares + txn.quantity;
      const newAvg =
        newShares === 0
          ? 0
          : (existing.shares * existing.averageCost +
              txn.quantity * txn.price) /
            newShares;
      await holdingsStorage.update(existing.id, {
        shares: newShares,
        averageCost: Number(newAvg.toFixed(4)),
      });
      return existing.id;
    } else {
      const newHolding = await holdingsStorage.add({
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
      return newHolding.id;
    }
  }

  // SELL
  if (!existing) {
    throw new Error(`Cannot sell ${symbol} — no existing holding found`);
  }
  const newShares = existing.shares - txn.quantity;
  if (newShares < 0) {
    throw new Error(
      `Cannot sell ${txn.quantity} ${symbol} — only ${existing.shares} held`
    );
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
  return existing.id;
}

// ──────────────────────────────────────────────
// Read file as base64 (native + web)
// ──────────────────────────────────────────────

async function readAsBase64(uri: string): Promise<string> {
  if (
    uri.startsWith("blob:") ||
    uri.startsWith("data:") ||
    uri.startsWith("http")
  ) {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
  const file = new File(uri);
  return await file.base64();
}

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  uploadBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
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
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
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
  changeBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dropdown: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
});
