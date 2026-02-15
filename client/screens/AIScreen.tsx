import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { holdingsStorage } from "@/lib/storage";
import { apiRequest } from "@/lib/query-client";
import { EGX_STOCKS } from "@/constants/egxStocks";
import type { PortfolioHolding } from "@/types";

type AITab = "portfolio" | "compare" | "deploy";

interface ProviderResult {
  provider: string;
  providerName: string;
  model: string;
  result: any;
  error?: string;
  durationMs: number;
  loading: boolean;
}

const PROVIDER_COLORS: Record<string, string> = {
  gemini: "#4285F4",
  deepseek: "#0066FF",
  kimi: "#FF6B35",
  groq: "#F55036",
  cerebras: "#7C3AED",
};

const PROVIDER_ICONS: Record<string, string> = {
  gemini: "zap",
  deepseek: "cpu",
  kimi: "moon",
  groq: "wind",
  cerebras: "aperture",
};

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<AITab>("portfolio");
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(false);

  // Multi-provider results
  const [portfolioResults, setPortfolioResults] = useState<ProviderResult[]>([]);
  const [compareResults, setCompareResults] = useState<ProviderResult[]>([]);
  const [deployResults, setDeployResults] = useState<ProviderResult[]>([]);

  // Compare state
  const [compareSymbols, setCompareSymbols] = useState<string[]>([]);
  const [compareAmount, setCompareAmount] = useState("");
  const [stockPickerVisible, setStockPickerVisible] = useState(false);
  const [stockSearch, setStockSearch] = useState("");

  // Deploy state
  const [deployAmount, setDeployAmount] = useState("");

  // Expanded cards
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (key: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const loadHoldings = useCallback(async () => {
    try {
      const data = await holdingsStorage.getAll();
      setHoldings(data);
    } catch (error) {
      console.error("Failed to load holdings:", error);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadHoldings(); }, [loadHoldings]));

  const getPortfolioPayload = () => ({
    holdings: holdings.map((h) => ({
      symbol: h.symbol, nameEn: h.nameEn, shares: h.shares,
      averageCost: h.averageCost, currentPrice: h.currentPrice,
      weight: holdings.reduce((s, x) => s + x.shares * x.currentPrice, 0) > 0
        ? (h.shares * h.currentPrice) / holdings.reduce((s, x) => s + x.shares * x.currentPrice, 0) : 0,
      sector: h.sector, role: h.role,
    })),
    totalValue: holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0),
    totalCost: holdings.reduce((s, h) => s + h.shares * h.averageCost, 0),
  });

  // ─── Fetch available providers then call all ───
  const callAllProviders = async (
    type: "portfolio" | "compare" | "deploy",
    body: any,
    setResults: React.Dispatch<React.SetStateAction<ProviderResult[]>>
  ) => {
    if (holdings.length === 0) {
      Alert.alert("No Holdings", "Add stocks to your portfolio first.");
      return;
    }
    setLoading(true);
    setResults([]);
    setExpandedCards(new Set());

    try {
      // Get available providers
      const provRes = await apiRequest("GET", "/api/ai/providers");
      const { providers } = await provRes.json();

      if (!providers || providers.length === 0) {
        Alert.alert("No Providers", "No AI providers are configured on the backend.");
        setLoading(false);
        return;
      }

      // Initialize all as loading
      const initial: ProviderResult[] = providers.map((p: any) => ({
        provider: p.id, providerName: p.name, model: p.model,
        result: null, error: undefined, durationMs: 0, loading: true,
      }));
      setResults(initial);

      // Auto-expand first card
      if (providers.length > 0) {
        setExpandedCards(new Set([providers[0].id]));
      }

      // Determine endpoint per type
      const endpoints: Record<string, string> = {
        portfolio: "portfolio-analysis",
        deploy: "deploy-capital",
        compare: "compare-stocks",
      };

      // Call all in parallel
      const promises = providers.map(async (p: any) => {
        try {
          const response = await apiRequest("POST", `/api/ai/${p.id}/${endpoints[type]}`, body);
          const data = await response.json();
          return { ...data, loading: false };
        } catch (error: any) {
          return {
            provider: p.id, providerName: p.name, model: p.model,
            result: null, error: error.message || "Failed", durationMs: 0, loading: false,
          };
        }
      });

      // Update results as they come in
      for (const promise of promises) {
        const result = await promise;
        setResults((prev) =>
          prev.map((r) => (r.provider === result.provider ? result : r))
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to fetch providers");
    } finally {
      setLoading(false);
    }
  };

  // ─── Actions ───
  const runPortfolioAnalysis = () => callAllProviders("portfolio", getPortfolioPayload(), setPortfolioResults);

  const runCompare = () => {
    if (compareSymbols.length < 2) {
      Alert.alert("Need 2-3 Stocks", "Add at least 2 stock symbols to compare.");
      return;
    }
    callAllProviders("compare", {
      symbols: compareSymbols,
      portfolio: getPortfolioPayload(),
      amountEGP: compareAmount ? parseFloat(compareAmount) : undefined,
    }, setCompareResults);
  };

  const runDeploy = () => {
    const amount = parseFloat(deployAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid Amount", "Enter the amount you want to deploy.");
      return;
    }
    callAllProviders("deploy", {
      portfolio: getPortfolioPayload(),
      amountToDeployEGP: amount,
    }, setDeployResults);
  };

  // ─── Stock picker ───
  const filteredStocks = useMemo(() => {
    const q = stockSearch.trim().toLowerCase();
    if (!q) return EGX_STOCKS.filter((s) => !compareSymbols.includes(s.symbol)).slice(0, 30);
    return EGX_STOCKS.filter(
      (s) => !compareSymbols.includes(s.symbol) &&
        (s.symbol.toLowerCase().includes(q) || s.nameEn.toLowerCase().includes(q) || s.nameAr.includes(stockSearch.trim()))
    ).slice(0, 30);
  }, [stockSearch, compareSymbols]);

  const addCompareSymbol = (sym: string) => {
    if (compareSymbols.length >= 3) { Alert.alert("Max 3"); return; }
    setCompareSymbols([...compareSymbols, sym]);
    setStockSearch("");
    if (compareSymbols.length >= 2) setStockPickerVisible(false);
  };

  const removeCompareSymbol = (sym: string) => setCompareSymbols(compareSymbols.filter((s) => s !== sym));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  // ─── Colors ───
  const getHealthColor = (h: string) => ({ Strong: "#1B5E20", Good: "#2E7D32", Fair: "#F57C00", Weak: "#C62828" }[h] || theme.textSecondary);
  const getUrgencyColor = (u: string) => ({ "Buy Now": theme.success, "Can Wait": theme.warning, Avoid: theme.error }[u] || theme.textSecondary);

  // ─── Render provider header ───
  const renderProviderHeader = (pr: ProviderResult, cardKey: string) => {
    const color = PROVIDER_COLORS[pr.provider] || theme.primary;
    const icon = PROVIDER_ICONS[pr.provider] || "cpu";
    const isExpanded = expandedCards.has(cardKey);

    return (
      <TouchableOpacity
        style={[styles.providerHeader, { borderLeftColor: color, backgroundColor: theme.backgroundDefault }]}
        onPress={() => toggleCard(cardKey)}
        activeOpacity={0.7}
      >
        <View style={styles.providerHeaderLeft}>
          <Feather name={icon as any} size={18} color={color} />
          <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
            <ThemedText style={{ fontWeight: "700", fontSize: 15 }}>{pr.providerName}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>{pr.model}</ThemedText>
          </View>
        </View>
        <View style={styles.providerHeaderRight}>
          {pr.loading && <ActivityIndicator size="small" color={color} />}
          {!pr.loading && pr.error && (
            <View style={[styles.statusBadge, { backgroundColor: theme.error }]}>
              <ThemedText style={styles.statusText}>Error</ThemedText>
            </View>
          )}
          {!pr.loading && pr.result && (
            <>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginRight: Spacing.sm }}>
                {(pr.durationMs / 1000).toFixed(1)}s
              </ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: theme.success }]}>
                <ThemedText style={styles.statusText}>Done</ThemedText>
              </View>
            </>
          )}
          <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} style={{ marginLeft: Spacing.sm }} />
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Render portfolio result ───
  const renderPortfolioResult = (pr: ProviderResult) => {
    const r = pr.result;
    if (!r) return pr.error ? <ThemedText style={{ color: theme.error, padding: Spacing.md }}>{pr.error}</ThemedText> : null;
    return (
      <View style={styles.resultBody}>
        <View style={styles.row}>
          <ThemedText style={{ fontWeight: "600" }}>Health:</ThemedText>
          <View style={[styles.badge, { backgroundColor: getHealthColor(r.overallHealth) }]}>
            <ThemedText style={styles.badgeText}>{r.overallHealth}</ThemedText>
          </View>
          <View style={[styles.chip, { borderColor: theme.divider, marginLeft: Spacing.sm }]}>
            <ThemedText type="small">{r.riskLevel} Risk</ThemedText>
          </View>
        </View>
        <ThemedText style={{ color: theme.textSecondary, lineHeight: 20, marginTop: Spacing.sm }}>{r.summary}</ThemedText>
        {r.strengths?.length > 0 && (
          <View style={{ marginTop: Spacing.md }}>
            <ThemedText style={{ fontWeight: "600", marginBottom: Spacing.xs }}>Strengths</ThemedText>
            {r.strengths.map((s: string, i: number) => (
              <View key={i} style={styles.bulletRow}>
                <ThemedText style={{ color: theme.success }}>●</ThemedText>
                <ThemedText style={styles.bulletText}>{s}</ThemedText>
              </View>
            ))}
          </View>
        )}
        {r.weaknesses?.length > 0 && (
          <View style={{ marginTop: Spacing.md }}>
            <ThemedText style={{ fontWeight: "600", marginBottom: Spacing.xs }}>Weaknesses</ThemedText>
            {r.weaknesses.map((s: string, i: number) => (
              <View key={i} style={styles.bulletRow}>
                <ThemedText style={{ color: theme.error }}>●</ThemedText>
                <ThemedText style={styles.bulletText}>{s}</ThemedText>
              </View>
            ))}
          </View>
        )}
        {r.recommendations?.length > 0 && (
          <View style={{ marginTop: Spacing.md }}>
            <ThemedText style={{ fontWeight: "600", marginBottom: Spacing.xs }}>Recommendations</ThemedText>
            {r.recommendations.map((s: string, i: number) => (
              <View key={i} style={styles.bulletRow}>
                <ThemedText style={{ color: theme.primary }}>▸</ThemedText>
                <ThemedText style={styles.bulletText}>{s}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // ─── Render compare result ───
  const renderCompareResult = (pr: ProviderResult) => {
    const r = pr.result;
    if (!r) return pr.error ? <ThemedText style={{ color: theme.error, padding: Spacing.md }}>{pr.error}</ThemedText> : null;
    return (
      <View style={styles.resultBody}>
        <ThemedText style={{ fontWeight: "700", fontSize: 15, marginBottom: Spacing.sm }}>Verdict</ThemedText>
        <ThemedText style={{ lineHeight: 22 }}>{r.verdict}</ThemedText>
        {r.rankings?.map((rk: any, i: number) => (
          <View key={i} style={[styles.rankRow, { borderTopColor: theme.divider }]}>
            <View style={styles.row}>
              <ThemedText style={{ fontWeight: "700" }}>{rk.symbol}</ThemedText>
              <View style={[styles.badge, { backgroundColor: getUrgencyColor(rk.buyUrgency) }]}>
                <ThemedText style={styles.badgeText}>{rk.buyUrgency}</ThemedText>
              </View>
            </View>
            <View style={[styles.row, { marginTop: 2 }]}>
              <ThemedText type="small">Growth: {rk.growthScore}/10</ThemedText>
              <ThemedText type="small">Long-term: {rk.longTermScore}/10</ThemedText>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4, lineHeight: 18 }}>{rk.summary}</ThemedText>
          </View>
        ))}
        {r.allocation?.length > 0 && (
          <View style={{ marginTop: Spacing.md }}>
            <ThemedText style={{ fontWeight: "600", marginBottom: Spacing.sm }}>Allocation</ThemedText>
            {r.allocation.map((a: any, i: number) => (
              <View key={i} style={styles.allocRow}>
                <ThemedText style={{ flex: 1, fontWeight: "600" }}>{a.symbol}</ThemedText>
                <ThemedText style={Typography.mono}>{a.percentage}%</ThemedText>
                {a.amountEGP > 0 && <ThemedText type="small" style={[Typography.mono, { marginLeft: Spacing.sm, color: theme.textSecondary }]}>{formatCurrency(a.amountEGP)}</ThemedText>}
              </View>
            ))}
          </View>
        )}
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md, lineHeight: 20 }}>{r.reasoning}</ThemedText>
      </View>
    );
  };

  // ─── Render deploy result ───
  const renderDeployResult = (pr: ProviderResult) => {
    const r = pr.result;
    if (!r) return pr.error ? <ThemedText style={{ color: theme.error, padding: Spacing.md }}>{pr.error}</ThemedText> : null;
    return (
      <View style={styles.resultBody}>
        <ThemedText style={{ fontWeight: "700", fontSize: 15, marginBottom: Spacing.sm }}>Strategy</ThemedText>
        <ThemedText style={{ lineHeight: 22 }}>{r.strategy}</ThemedText>
        {r.allocations?.map((a: any, i: number) => (
          <View key={i} style={[styles.rankRow, { borderTopColor: theme.divider }]}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontWeight: "700" }}>{a.symbol}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>{a.nameEn}</ThemedText>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <ThemedText style={[Typography.mono, { fontWeight: "700", color: theme.primary }]}>{formatCurrency(a.amountEGP)}</ThemedText>
                <ThemedText type="small" style={Typography.mono}>{a.percentage}%</ThemedText>
              </View>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4, lineHeight: 18 }}>{a.reason}</ThemedText>
            {a.buyZone && (
              <View style={[styles.buyZone, { backgroundColor: theme.backgroundSecondary }]}>
                <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                  Buy Zone: {a.buyZone.low?.toFixed(2)} - {a.buyZone.high?.toFixed(2)} EGP
                </ThemedText>
              </View>
            )}
            {a.isNewPosition && (
              <View style={[styles.newBadge, { backgroundColor: theme.accent }]}>
                <ThemedText style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>NEW</ThemedText>
              </View>
            )}
          </View>
        ))}
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md, lineHeight: 20 }}>{r.reasoning}</ThemedText>
        {r.riskNote && (
          <View style={[styles.riskNote, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="alert-circle" size={14} color={theme.warning} />
            <ThemedText type="small" style={{ color: theme.warning, flex: 1, marginLeft: Spacing.sm }}>{r.riskNote}</ThemedText>
          </View>
        )}
      </View>
    );
  };

  // ─── Render provider results list ───
  const renderResults = (results: ProviderResult[], type: "portfolio" | "compare" | "deploy") => {
    if (results.length === 0) return null;
    const renderers = { portfolio: renderPortfolioResult, compare: renderCompareResult, deploy: renderDeployResult };
    const renderer = renderers[type];
    return results.map((pr) => {
      const cardKey = `${type}-${pr.provider}`;
      const isExpanded = expandedCards.has(cardKey);
      return (
        <View key={cardKey} style={[styles.providerCard, { borderColor: theme.divider }]}>
          {renderProviderHeader(pr, cardKey)}
          {isExpanded && !pr.loading && (pr.result || pr.error) && renderer(pr)}
        </View>
      );
    });
  };

  // ─── Sub-tab bar ───
  const renderTabs = () => (
    <View style={[styles.tabBar, { backgroundColor: theme.backgroundSecondary, borderColor: theme.divider }]}>
      {([
        { id: "portfolio" as AITab, label: "Portfolio", icon: "activity" },
        { id: "compare" as AITab, label: "Compare", icon: "git-pull-request" },
        { id: "deploy" as AITab, label: "Deploy", icon: "dollar-sign" },
      ] as const).map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tabItem, activeTab === tab.id && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab(tab.id)}
        >
          <Feather name={tab.icon as any} size={16} color={activeTab === tab.id ? "#FFFFFF" : theme.textSecondary} />
          <ThemedText style={[styles.tabLabel, { color: activeTab === tab.id ? "#FFFFFF" : theme.textSecondary }]}>
            {tab.label}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ─── Portfolio Tab ───
  const renderPortfolio = () => (
    <View>
      {portfolioResults.length === 0 && (
        <Card style={styles.card}>
          <Feather name="activity" size={48} color={theme.primary} style={{ alignSelf: "center", marginBottom: Spacing.lg }} />
          <ThemedText type="h4" style={{ textAlign: "center", marginBottom: Spacing.sm }}>AI Portfolio Analysis</ThemedText>
          <ThemedText style={{ color: theme.textSecondary, textAlign: "center", marginBottom: Spacing.xl }}>
            Get analysis from multiple AI models side by side. Each model provides its own independent assessment.
          </ThemedText>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={runPortfolioAnalysis}>
            <Feather name="zap" size={18} color="#FFF" />
            <ThemedText style={styles.buttonText}>Analyze with All AI Models</ThemedText>
          </TouchableOpacity>
        </Card>
      )}
      {renderResults(portfolioResults, "portfolio")}
      {portfolioResults.length > 0 && !loading && (
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.md }]} onPress={runPortfolioAnalysis}>
          <Feather name="refresh-cw" size={18} color="#FFF" />
          <ThemedText style={styles.buttonText}>Re-analyze</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Compare Tab ───
  const renderCompare = () => (
    <View>
      <Card style={styles.card}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Compare Stocks</ThemedText>
        <ThemedText style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
          Select 2-3 stocks. All AI models will analyze and compare them.
        </ThemedText>
        {compareSymbols.length > 0 && (
          <View style={styles.chipRow}>
            {compareSymbols.map((sym) => (
              <TouchableOpacity key={sym} style={[styles.symbolChip, { backgroundColor: theme.primary }]} onPress={() => removeCompareSymbol(sym)}>
                <ThemedText style={{ color: "#FFF", fontWeight: "600", marginRight: 4 }}>{sym}</ThemedText>
                <Feather name="x" size={14} color="#FFF" />
              </TouchableOpacity>
            ))}
          </View>
        )}
        {compareSymbols.length < 3 && (
          <TouchableOpacity style={[styles.pickerButton, { borderColor: theme.divider, backgroundColor: theme.backgroundSecondary }]} onPress={() => setStockPickerVisible(true)}>
            <Feather name="plus-circle" size={20} color={theme.primary} />
            <ThemedText style={{ color: theme.primary, fontWeight: "600", marginLeft: Spacing.sm }}>Add Stock ({compareSymbols.length}/3)</ThemedText>
          </TouchableOpacity>
        )}
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.divider, marginTop: Spacing.md }]}
          placeholder="Amount to invest (EGP) - optional" placeholderTextColor={theme.textSecondary}
          value={compareAmount} onChangeText={setCompareAmount} keyboardType="numeric"
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.lg }]} onPress={runCompare} disabled={loading}>
          <Feather name="zap" size={18} color="#FFF" />
          <ThemedText style={styles.buttonText}>Compare with All AI Models</ThemedText>
        </TouchableOpacity>
      </Card>

      <Modal visible={stockPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Select Stock</ThemedText>
              <TouchableOpacity onPress={() => { setStockPickerVisible(false); setStockSearch(""); }}>
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.divider, marginBottom: Spacing.md }]}
              placeholder="Search by symbol or name..." placeholderTextColor={theme.textSecondary}
              value={stockSearch} onChangeText={setStockSearch} autoFocus
            />
            <FlatList
              data={filteredStocks} keyExtractor={(item) => item.symbol}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.stockRow, { borderBottomColor: theme.divider }]} onPress={() => addCompareSymbol(item.symbol)}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontWeight: "700" }}>{item.symbol}</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.nameEn}</ThemedText>
                  </View>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.sector}</ThemedText>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<ThemedText style={{ color: theme.textSecondary, textAlign: "center", padding: Spacing.xl }}>No stocks found</ThemedText>}
            />
          </View>
        </View>
      </Modal>

      {renderResults(compareResults, "compare")}
    </View>
  );

  // ─── Deploy Tab ───
  const renderDeploy = () => (
    <View>
      <Card style={styles.card}>
        <Feather name="dollar-sign" size={48} color={theme.primary} style={{ alignSelf: "center", marginBottom: Spacing.lg }} />
        <ThemedText type="h4" style={{ textAlign: "center", marginBottom: Spacing.sm }}>Deploy Capital</ThemedText>
        <ThemedText style={{ color: theme.textSecondary, textAlign: "center", marginBottom: Spacing.xl }}>
          Enter the amount and get recommendations from all AI models.
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.divider }]}
          placeholder="Amount to deploy (EGP)" placeholderTextColor={theme.textSecondary}
          value={deployAmount} onChangeText={setDeployAmount} keyboardType="numeric"
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.lg }]} onPress={runDeploy} disabled={loading}>
          <Feather name="zap" size={18} color="#FFF" />
          <ThemedText style={styles.buttonText}>Get All Recommendations</ThemedText>
        </TouchableOpacity>
      </Card>
      {renderResults(deployResults, "deploy")}
      {deployResults.length > 0 && !loading && (
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.md }]} onPress={runDeploy}>
          <Feather name="refresh-cw" size={18} color="#FFF" />
          <ThemedText style={styles.buttonText}>Re-analyze</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: tabBarHeight + Spacing.xl, paddingHorizontal: Spacing.lg }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        {renderTabs()}
        {activeTab === "portfolio" && renderPortfolio()}
        {activeTab === "compare" && renderCompare()}
        {activeTab === "deploy" && renderDeploy()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  tabBar: { flexDirection: "row", borderRadius: BorderRadius.lg, padding: 3, marginBottom: Spacing.lg, borderWidth: 1 },
  tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, gap: 4 },
  tabLabel: { fontSize: 12, fontWeight: "600" },
  card: { marginBottom: Spacing.md },
  providerCard: { marginBottom: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, overflow: "hidden" },
  providerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: Spacing.md, borderLeftWidth: 4 },
  providerHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  providerHeaderRight: { flexDirection: "row", alignItems: "center" },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  statusText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
  resultBody: { padding: Spacing.md, paddingTop: 0 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  badgeText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  chip: { borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: Spacing.xs, gap: Spacing.sm },
  bulletText: { flex: 1, lineHeight: 20 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, gap: Spacing.sm },
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  input: { height: Spacing.inputHeight, borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, fontSize: 15 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.sm },
  symbolChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  pickerButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: Spacing.inputHeight, borderWidth: 1, borderStyle: "dashed", borderRadius: BorderRadius.md, marginTop: Spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { maxHeight: "80%", borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, padding: Spacing.lg },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.lg },
  stockRow: { flexDirection: "row", alignItems: "center", paddingVertical: Spacing.md, borderBottomWidth: 1 },
  rankRow: { paddingVertical: Spacing.md, borderTopWidth: 1, marginTop: Spacing.sm },
  allocRow: { flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm },
  buyZone: { padding: Spacing.sm, borderRadius: BorderRadius.sm, marginTop: Spacing.sm, alignSelf: "flex-start" },
  newBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, marginTop: Spacing.sm, alignSelf: "flex-start" },
  riskNote: { flexDirection: "row", alignItems: "flex-start", padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.lg },
});
