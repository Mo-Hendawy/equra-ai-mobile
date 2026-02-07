import React, { useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { StockAnalysis } from "@/components/StockAnalysis";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { EGX_STOCKS } from "@/constants/egxStocks";
import { apiRequest } from "@/lib/query-client";

interface StockPrice {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  source?: string;
}

export default function StockSearchScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [stockPrice, setStockPrice] = useState<StockPrice | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const filteredStocks = EGX_STOCKS.filter((stock) => {
    const query = searchQuery.toLowerCase();
    return (
      stock.symbol.toLowerCase().includes(query) ||
      stock.nameEn.toLowerCase().includes(query) ||
      stock.nameAr.includes(query)
    );
  }).slice(0, 20); // Limit to 20 results

  const handleSelectStock = async (symbol: string) => {
    setSelectedStock(symbol);
    setLoadingPrice(true);
    
    try {
      const response = await apiRequest("GET", `/prices/${symbol}`);
      const priceData = await response.json();
      setStockPrice(priceData);
    } catch (error) {
      console.error("Failed to fetch price:", error);
      setStockPrice(null);
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedStock(null);
    setStockPrice(null);
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(2);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
        },
      ]}
    >
      {/* Search Header */}
      <View style={[styles.header, { backgroundColor: theme.background, paddingTop: insets.top + 40 }]}>
        <ThemedText type="h2" style={styles.headerTitle}>Stock Analysis</ThemedText>
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            placeholder="Search stocks by symbol or name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {selectedStock ? (
        <ScrollView style={styles.analysisContainer} contentContainerStyle={styles.analysisContent}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={handleClearSelection}
          >
            <Feather name="arrow-left" size={20} color={theme.primary} />
            <ThemedText style={{ color: theme.primary }}>Back to Search</ThemedText>
          </TouchableOpacity>

          <Card style={styles.stockHeader}>
            <View style={styles.stockHeaderContent}>
              <View>
                <ThemedText type="h3">{selectedStock}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary }}>
                  {EGX_STOCKS.find((s) => s.symbol === selectedStock)?.nameEn}
                </ThemedText>
              </View>
              {loadingPrice ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : stockPrice?.price ? (
                <View style={styles.priceContainer}>
                  <ThemedText type="h3">EGP {formatCurrency(stockPrice.price)}</ThemedText>
                  {stockPrice.changePercent !== null ? (
                    <ThemedText
                      style={{
                        color: stockPrice.changePercent >= 0 ? theme.success : theme.error,
                        fontSize: 14,
                      }}
                    >
                      {stockPrice.changePercent >= 0 ? "+" : ""}
                      {stockPrice.changePercent.toFixed(2)}%
                    </ThemedText>
                  ) : null}
                </View>
              ) : null}
            </View>
          </Card>

          <View style={{ paddingHorizontal: Spacing.md }}>
            <StockAnalysis symbol={selectedStock} />
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredStocks}
          keyExtractor={(item) => item.symbol}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card style={styles.stockCard} onPress={() => handleSelectStock(item.symbol)}>
              <View style={styles.stockCardContent}>
                <View style={styles.stockInfo}>
                  <ThemedText type="subtitle" style={styles.symbol}>
                    {item.symbol}
                  </ThemedText>
                  <ThemedText style={[styles.nameEn, { color: theme.text }]}>
                    {item.nameEn}
                  </ThemedText>
                  <ThemedText style={[styles.nameAr, { color: theme.textSecondary }]}>
                    {item.nameAr}
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="search" size={48} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                {searchQuery
                  ? "No stocks found matching your search"
                  : "Search for any EGX stock to see analysis"}
              </ThemedText>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#00000010",
  },
  headerTitle: {
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 0,
    height: "100%",
  },
  listContent: {
    padding: Spacing.md,
  },
  stockCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  stockCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockInfo: {
    flex: 1,
  },
  symbol: {
    fontWeight: "700",
    marginBottom: 4,
  },
  nameEn: {
    fontSize: 14,
    marginBottom: 2,
  },
  nameAr: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 3,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 14,
    textAlign: "center",
  },
  analysisContainer: {
    flex: 1,
  },
  analysisContent: {
    paddingBottom: Spacing.xl,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    margin: Spacing.md,
    borderRadius: 8,
  },
  stockHeader: {
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.lg,
  },
  stockHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
});
