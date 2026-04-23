import React, { useState, useCallback, useMemo, useEffect } from "react";
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

import { LinearGradient } from "expo-linear-gradient";
import * as KeepAwake from "expo-keep-awake";
import { Card } from "@/components/Card";
import { SelectPicker } from "@/components/SelectPicker";
import { ThemedText } from "@/components/ThemedText";
import {
  saveSession,
  listSessions,
  getLatestSession,
  formatRunAt,
  type AnalysisSession,
  type AnalysisType,
} from "@/lib/analysis-history";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography, Palette } from "@/constants/theme";
import {
  holdingsStorage,
  transactionsStorage,
  dividendsStorage,
  realizedGainsStorage,
  watchlistStorage,
  targetsStorage,
} from "@/lib/storage";
import { apiRequest } from "@/lib/query-client";
import { EGX_STOCKS } from "@/constants/egxStocks";
import type { PortfolioHolding, StockTransaction, Dividend, RealizedGain, WatchlistItem, Target } from "@/types";

type AITab = "portfolio" | "compare" | "deploy" | "behavior" | "swing";

interface SwingAnalysisResult {
  symbol: string;
  finalVerdict: "BUY_NOW" | "CAN_WAIT" | "AVOID";
  adjustedConfidence: "High" | "Medium" | "Low";
  recommendation: {
    verdict: string;
    confidence: string;
    entryRange: { low: number; high: number } | null;
    stopLoss: number | null;
    targetPrice: number | null;
    timeframeWeeks: number;
    technicalSignals: string[];
    fundamentalCatalysts: string[];
    risks: string[];
    citations: { source: string; snippet: string }[];
    reasoning: string;
  };
  criticFeedback: {
    counterVerdict: string;
    weakness: string;
    severity: string;
    counterScenario: string;
    blockingIssues: string[];
  } | null;
  technicals: {
    currentPrice: number;
    asOf: string;
    sma20: number | null;
    sma50: number | null;
    distanceFromSma50Pct: number | null;
    momentum20dPct: number | null;
    realizedVol20dPct: number | null;
    range52w: { high: number; low: number } | null;
    rangePositionPct: number | null;
    recentVolumeMultiple: number | null;
  };
  ragUsed: boolean;
  model: string;
  decisionId: number | null;
  elapsedMs: number;
}

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
  gemini: "#D4A85A",       // gold
  deepseek: "#B08830",     // gold-900
  kimi: "#E5C277",         // gold-400
  groq: "#8B6A1F",         // gold-deep
  cerebras: "#6A6A66",     // muted black
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
  const [behaviorResults, setBehaviorResults] = useState<ProviderResult[]>([]);

  // Swing-trade state
  const [swingSymbol, setSwingSymbol] = useState<string>("");
  const [swingResult, setSwingResult] = useState<SwingAnalysisResult | null>(null);
  const [swingLoading, setSwingLoading] = useState(false);
  const [swingError, setSwingError] = useState<string | null>(null);

  // Behavior data (loaded when Behavior tab is active)
  const [behaviorData, setBehaviorData] = useState<{
    transactions: StockTransaction[];
    dividends: Dividend[];
    realizedGains: RealizedGain[];
    watchlist: WatchlistItem[];
    targets: Target[];
  }>({ transactions: [], dividends: [], realizedGains: [], watchlist: [], targets: [] });

  // Compare state
  const [compareSymbols, setCompareSymbols] = useState<string[]>([]);
  const [compareAmount, setCompareAmount] = useState("");
  const [stockPickerVisible, setStockPickerVisible] = useState(false);
  const [stockSearch, setStockSearch] = useState("");

  // Deploy state
  const [deployAmount, setDeployAmount] = useState("");

  // Expanded cards
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [expandedReasoningSteps, setExpandedReasoningSteps] = useState<Set<string>>(new Set());

  const toggleCard = (key: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleReasoningSteps = (key: string) => {
    setExpandedReasoningSteps((prev) => {
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

  // Hydrate the latest persisted analysis for each tab on mount so users
  // don't lose results when they close and reopen the app.
  useEffect(() => {
    (async () => {
      try {
        const [p, c, d, b, s] = await Promise.all([
          getLatestSession("portfolio"),
          getLatestSession("compare"),
          getLatestSession("deploy"),
          getLatestSession("behavior"),
          getLatestSession("swing"),
        ]);
        if (p?.result && Array.isArray(p.result)) setPortfolioResults(p.result as any);
        if (c?.result && Array.isArray(c.result)) setCompareResults(c.result as any);
        if (d?.result && Array.isArray(d.result)) setDeployResults(d.result as any);
        if (b?.result && Array.isArray(b.result)) setBehaviorResults(b.result as any);
        if (s?.result) setSwingResult(s.result as any);
      } catch (e) {
        // ignore — hydration is best-effort
      }
    })();
  }, []);

  const loadBehaviorData = useCallback(async () => {
    try {
      const [transactions, dividends, realizedGains, watchlist, targets] = await Promise.all([
        transactionsStorage.getAll().catch(() => []),
        dividendsStorage.getAll().catch(() => []),
        realizedGainsStorage.getAll().catch(() => []),
        watchlistStorage.getAll().catch(() => []),
        targetsStorage.getAll().catch(() => []),
      ]);
      const txSorted = transactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setBehaviorData({
        transactions: txSorted.slice(0, 100),
        dividends,
        realizedGains,
        watchlist,
        targets,
      });
    } catch (error) {
      console.error("Failed to load behavior data:", error);
      setBehaviorData({ transactions: [], dividends: [], realizedGains: [], watchlist: [], targets: [] });
    }
  }, []);

  useEffect(() => {
    if (activeTab === "behavior") {
      loadBehaviorData();
    }
  }, [activeTab, loadBehaviorData]);

  const getBehaviorPayload = useCallback(() => {
    const holdingsPayload = holdings.map((h) => ({
      symbol: h.symbol,
      nameEn: h.nameEn,
      shares: h.shares,
      averageCost: h.averageCost,
      currentPrice: h.currentPrice,
      weight:
        holdings.reduce((s, x) => s + x.shares * x.currentPrice, 0) > 0
          ? (h.shares * h.currentPrice) / holdings.reduce((s, x) => s + x.shares * x.currentPrice, 0)
          : 0,
      sector: h.sector,
      role: h.role,
    }));
    return {
      holdings: holdingsPayload,
      totalValue: holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0),
      totalCost: holdings.reduce((s, h) => s + h.shares * h.averageCost, 0),
      transactions: behaviorData.transactions.map((t) => ({
        symbol: t.symbol,
        type: t.type,
        shares: t.shares,
        pricePerShare: t.pricePerShare,
        fees: t.fees,
        date: t.date,
      })),
      dividends: behaviorData.dividends.map((d) => ({
        symbol: d.symbol,
        amount: d.amount,
        exDate: d.exDate,
        paymentDate: d.paymentDate,
        status: d.status,
      })),
      realizedGains: behaviorData.realizedGains.map((g) => ({
        symbol: g.symbol,
        shares: g.shares,
        buyPrice: g.buyPrice,
        sellPrice: g.sellPrice,
        buyDate: g.buyDate,
        sellDate: g.sellDate,
        profit: g.profit,
      })),
      watchlist: behaviorData.watchlist.map((w) => ({
        symbol: w.symbol,
        nameEn: w.nameEn,
        sector: w.sector,
      })),
      targets: behaviorData.targets,
    };
  }, [holdings, behaviorData]);

  const runBehaviorAnalysis = useCallback(async () => {
    const payload = getBehaviorPayload();
    const hasHoldings = payload.holdings.length > 0;
    const hasTransactions = payload.transactions.length > 0;
    const hasDividends = payload.dividends.length > 0;
    const hasRealizedGains = payload.realizedGains.length > 0;
    if (!hasHoldings && !hasTransactions && !hasDividends && !hasRealizedGains) {
      Alert.alert(
        "No Data",
        "Add holdings, trades, dividends, or realized gains to get behavior insights."
      );
      return;
    }
    setLoading(true);
    setBehaviorResults([]);
    setExpandedCards(new Set());
    setExpandedReasoningSteps(new Set());

    const keepAwakeTag = `behavior-${Date.now()}`;
    try {
      await KeepAwake.activateKeepAwakeAsync(keepAwakeTag);
    } catch {}
    const startedAt = Date.now();
    try {
      const provRes = await apiRequest("GET", "/api/ai/providers");
      const { providers } = await provRes.json();
      if (!providers || providers.length === 0) {
        Alert.alert("No Providers", "No AI providers are configured on the backend.");
        setLoading(false);
        return;
      }
      const initial: ProviderResult[] = providers.map((p: any) => ({
        provider: p.id,
        providerName: p.name,
        model: p.model,
        result: null,
        error: undefined,
        durationMs: 0,
        loading: true,
      }));
      setBehaviorResults(initial);
      if (providers.length > 0) {
        setExpandedCards(new Set([providers[0].id]));
      }
      const promises = providers.map(async (p: any) => {
        try {
          const response = await apiRequest("POST", `/api/ai/${p.id}/behavior-analysis`, payload);
          const data = await response.json();
          return { ...data, loading: false };
        } catch (error: any) {
          return {
            provider: p.id,
            providerName: p.name,
            model: p.model,
            result: null,
            error: error.message || "Failed",
            durationMs: 0,
            loading: false,
          };
        }
      });
      const finalBehaviorResults: ProviderResult[] = [];
      for (const promise of promises) {
        const result = await promise;
        finalBehaviorResults.push(result);
        setBehaviorResults((prev) =>
          prev.map((r) => (r.provider === result.provider ? result : r))
        );
      }
      saveSession({
        type: "behavior",
        subject: "",
        provider: "multi",
        elapsedMs: Date.now() - startedAt,
        result: finalBehaviorResults,
      }).catch((e) => console.warn("[history] save failed:", e));
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to fetch providers");
    } finally {
      setLoading(false);
      KeepAwake.deactivateKeepAwake(keepAwakeTag);
    }
  }, [getBehaviorPayload]);

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
    setExpandedReasoningSteps(new Set());

    // Keep the screen awake during multi-provider analysis (can take 60+s).
    const keepAwakeTag = `ai-${type}-${Date.now()}`;
    try {
      await KeepAwake.activateKeepAwakeAsync(keepAwakeTag);
    } catch {
      // expo-keep-awake may be unavailable on web / old clients — tolerate.
    }

    const startedAt = Date.now();

    try {
      // Get available providers
      const provRes = await apiRequest("GET", "/api/ai/providers");
      const { providers } = await provRes.json();

      if (!providers || providers.length === 0) {
        Alert.alert("No Providers", "No AI providers are configured on the backend.");
        setLoading(false);
        KeepAwake.deactivateKeepAwake(keepAwakeTag);
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
      const finalResults: ProviderResult[] = [];
      for (const promise of promises) {
        const result = await promise;
        finalResults.push(result);
        setResults((prev) =>
          prev.map((r) => (r.provider === result.provider ? result : r))
        );
      }

      // Persist the full multi-provider session so it survives app close.
      const subject = type === "compare"
        ? compareSymbols.join(",")
        : "";
      saveSession({
        type,
        subject,
        provider: "multi",
        elapsedMs: Date.now() - startedAt,
        result: finalResults,
      }).catch((e) => console.warn("[history] save failed:", e));
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to fetch providers");
    } finally {
      setLoading(false);
      KeepAwake.deactivateKeepAwake(keepAwakeTag);
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
  const renderPortfolioResult = (pr: ProviderResult, cardKey: string) => {
    const r = pr.result;
    if (!r) return pr.error ? <ThemedText style={{ color: theme.error, padding: Spacing.md }}>{pr.error}</ThemedText> : null;
    const color = PROVIDER_COLORS[pr.provider] || theme.primary;
    const showSteps = expandedReasoningSteps.has(cardKey);
    return (
      <View style={styles.resultBody}>
        {r.reasoningSteps?.length > 0 && (
          <View style={{ marginBottom: Spacing.md }}>
            <TouchableOpacity
              style={[styles.reasoningStepsHeader, { backgroundColor: color + "15" }]}
              onPress={() => toggleReasoningSteps(cardKey)}
            >
              <Feather name="list" size={16} color={color} />
              <ThemedText style={[styles.reasoningStepsTitle, { color }]}>How we got here</ThemedText>
              <Feather name={showSteps ? "chevron-up" : "chevron-down"} size={18} color={color} />
            </TouchableOpacity>
            {showSteps && (
              <View style={styles.reasoningStepsList}>
                {r.reasoningSteps.map((step: string, i: number) => (
                  <View key={i} style={[styles.reasoningStepItem, { backgroundColor: theme.backgroundSecondary }]}>
                    <View style={[styles.reasoningStepNumber, { backgroundColor: color }]}>
                      <ThemedText style={styles.reasoningStepNumberText}>{i + 1}</ThemedText>
                    </View>
                    <ThemedText style={[styles.reasoningStepText, { color: theme.text }]}>{step}</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
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
  const renderCompareResult = (pr: ProviderResult, cardKey: string) => {
    const r = pr.result;
    if (!r) return pr.error ? <ThemedText style={{ color: theme.error, padding: Spacing.md }}>{pr.error}</ThemedText> : null;
    const color = PROVIDER_COLORS[pr.provider] || theme.primary;
    const showSteps = expandedReasoningSteps.has(cardKey);
    return (
      <View style={styles.resultBody}>
        {r.reasoningSteps?.length > 0 && (
          <View style={{ marginBottom: Spacing.md }}>
            <TouchableOpacity
              style={[styles.reasoningStepsHeader, { backgroundColor: color + "15" }]}
              onPress={() => toggleReasoningSteps(cardKey)}
            >
              <Feather name="list" size={16} color={color} />
              <ThemedText style={[styles.reasoningStepsTitle, { color }]}>How we got here</ThemedText>
              <Feather name={showSteps ? "chevron-up" : "chevron-down"} size={18} color={color} />
            </TouchableOpacity>
            {showSteps && (
              <View style={styles.reasoningStepsList}>
                {r.reasoningSteps.map((step: string, i: number) => (
                  <View key={i} style={[styles.reasoningStepItem, { backgroundColor: theme.backgroundSecondary }]}>
                    <View style={[styles.reasoningStepNumber, { backgroundColor: color }]}>
                      <ThemedText style={styles.reasoningStepNumberText}>{i + 1}</ThemedText>
                    </View>
                    <ThemedText style={[styles.reasoningStepText, { color: theme.text }]}>{step}</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
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
  const renderDeployResult = (pr: ProviderResult, cardKey: string) => {
    const r = pr.result;
    if (!r) return pr.error ? <ThemedText style={{ color: theme.error, padding: Spacing.md }}>{pr.error}</ThemedText> : null;
    const color = PROVIDER_COLORS[pr.provider] || theme.primary;
    const showSteps = expandedReasoningSteps.has(cardKey);
    return (
      <View style={styles.resultBody}>
        {r.reasoningSteps?.length > 0 && (
          <View style={{ marginBottom: Spacing.md }}>
            <TouchableOpacity
              style={[styles.reasoningStepsHeader, { backgroundColor: color + "15" }]}
              onPress={() => toggleReasoningSteps(cardKey)}
            >
              <Feather name="list" size={16} color={color} />
              <ThemedText style={[styles.reasoningStepsTitle, { color }]}>How we got here</ThemedText>
              <Feather name={showSteps ? "chevron-up" : "chevron-down"} size={18} color={color} />
            </TouchableOpacity>
            {showSteps && (
              <View style={styles.reasoningStepsList}>
                {r.reasoningSteps.map((step: string, i: number) => (
                  <View key={i} style={[styles.reasoningStepItem, { backgroundColor: theme.backgroundSecondary }]}>
                    <View style={[styles.reasoningStepNumber, { backgroundColor: color }]}>
                      <ThemedText style={styles.reasoningStepNumberText}>{i + 1}</ThemedText>
                    </View>
                    <ThemedText style={[styles.reasoningStepText, { color: theme.text }]}>{step}</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
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

  // ─── Render behavior result ───
  const renderBehaviorResult = (pr: ProviderResult, cardKey: string) => {
    const r = pr.result;
    if (!r) return pr.error ? <ThemedText style={{ color: theme.error, padding: Spacing.md }}>{pr.error}</ThemedText> : null;
    const color = PROVIDER_COLORS[pr.provider] || theme.primary;
    const showSteps = expandedReasoningSteps.has(cardKey);
    return (
      <View style={styles.resultBody}>
        {r.reasoningSteps?.length > 0 && (
          <View style={{ marginBottom: Spacing.md }}>
            <TouchableOpacity
              style={[styles.reasoningStepsHeader, { backgroundColor: color + "15" }]}
              onPress={() => toggleReasoningSteps(cardKey)}
            >
              <Feather name="list" size={16} color={color} />
              <ThemedText style={[styles.reasoningStepsTitle, { color }]}>How we got here</ThemedText>
              <Feather name={showSteps ? "chevron-up" : "chevron-down"} size={18} color={color} />
            </TouchableOpacity>
            {showSteps && (
              <View style={styles.reasoningStepsList}>
                {r.reasoningSteps.map((step: string, i: number) => (
                  <View key={i} style={[styles.reasoningStepItem, { backgroundColor: theme.backgroundSecondary }]}>
                    <View style={[styles.reasoningStepNumber, { backgroundColor: color }]}>
                      <ThemedText style={styles.reasoningStepNumberText}>{i + 1}</ThemedText>
                    </View>
                    <ThemedText style={[styles.reasoningStepText, { color: theme.text }]}>{step}</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        {r.oneThingToChange && (
          <View style={[styles.buyZone, { backgroundColor: theme.primary + "20", marginBottom: Spacing.md }]}>
            <ThemedText style={{ fontWeight: "700", marginBottom: Spacing.xs, color: theme.primary }}>One thing to change</ThemedText>
            <ThemedText style={{ lineHeight: 20 }}>{r.oneThingToChange}</ThemedText>
          </View>
        )}
        <ThemedText style={{ color: theme.textSecondary, lineHeight: 20, marginBottom: Spacing.md }}>{r.feedback}</ThemedText>
        {r.patterns?.length > 0 && (
          <View style={{ marginBottom: Spacing.md }}>
            <ThemedText style={{ fontWeight: "600", marginBottom: Spacing.xs }}>Patterns</ThemedText>
            {r.patterns.map((s: string, i: number) => (
              <View key={i} style={styles.bulletRow}>
                <ThemedText style={{ color: theme.primary }}>●</ThemedText>
                <ThemedText style={styles.bulletText}>{s}</ThemedText>
              </View>
            ))}
          </View>
        )}
        {r.improvementAreas?.length > 0 && (
          <View>
            <ThemedText style={{ fontWeight: "600", marginBottom: Spacing.xs }}>Improvement areas</ThemedText>
            {r.improvementAreas.map((s: string, i: number) => (
              <View key={i} style={styles.bulletRow}>
                <ThemedText style={{ color: theme.warning }}>▸</ThemedText>
                <ThemedText style={styles.bulletText}>{s}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // ─── Render provider results list ───
  const renderResults = (results: ProviderResult[], type: "portfolio" | "compare" | "deploy" | "behavior") => {
    if (results.length === 0) return null;
    const renderers = {
      portfolio: renderPortfolioResult,
      compare: renderCompareResult,
      deploy: renderDeployResult,
      behavior: renderBehaviorResult,
    };
    const renderer = renderers[type];
    return results.map((pr) => {
      const cardKey = `${type}-${pr.provider}`;
      const isExpanded = expandedCards.has(cardKey);
      return (
        <View key={cardKey} style={[styles.providerCard, { borderColor: theme.divider }]}>
          {renderProviderHeader(pr, cardKey)}
          {isExpanded && !pr.loading && (pr.result || pr.error) && renderer(pr, cardKey)}
        </View>
      );
    });
  };

  // ─── Sub-tab bar ─── filled-segment pattern from handoff
  const renderTabs = () => (
    <View style={[styles.tabBar, { backgroundColor: theme.backgroundSecondary, borderColor: theme.divider }]}>
      {([
        { id: "portfolio" as AITab, label: "Portfolio", icon: "activity" },
        { id: "swing" as AITab, label: "Swing", icon: "zap" },
        { id: "compare" as AITab, label: "Compare", icon: "git-pull-request" },
        { id: "deploy" as AITab, label: "Deploy", icon: "dollar-sign" },
        { id: "behavior" as AITab, label: "Behavior", icon: "trending-up" },
      ] as const).map((tab) => {
        const active = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabItem,
              active && { backgroundColor: theme.backgroundDefault },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Feather name={tab.icon as any} size={13} color={active ? theme.primary : theme.textSecondary} />
            <ThemedText style={[styles.tabLabel, { color: active ? theme.primary : theme.textSecondary }]}>
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ─── Portfolio Tab ───  Matches handoff: green gradient hero rendered at
  // screen level (above seg tabs); here we render only CTA + verdicts + results.
  const renderPortfolio = () => (
    <View>
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginBottom: Spacing.lg }]} onPress={runPortfolioAnalysis} disabled={loading}>
        <Feather name="zap" size={18} color={Palette.black} />
        <ThemedText style={styles.buttonText}>
          {portfolioResults.length > 0 ? "Re-analyze with All AI Models" : "Analyze with All AI Models"}
        </ThemedText>
      </TouchableOpacity>
      {portfolioResults.length > 0 && (
        <View style={styles.secHdr}>
          <View style={[styles.secDot, { backgroundColor: "#1565C0" }]} />
          <ThemedText style={[styles.secLabel, { color: theme.textSecondary }]}>
            MODEL VERDICTS · {portfolioResults.length}
          </ThemedText>
          <View style={[styles.secLine, { backgroundColor: theme.divider }]} />
        </View>
      )}
      {renderResults(portfolioResults, "portfolio")}
    </View>
  );

  // Per-tab hero text — handoff renders this above seg tabs on every tab.
  const renderActiveHero = () => {
    const HERO: Record<AITab, { title: string; sub: string }> = {
      portfolio: {
        title: "Portfolio Analysis",
        sub: "Get analysis from multiple AI models side by side. Each model provides its own independent assessment.",
      },
      compare: {
        title: "Compare Stocks",
        sub: "Select 2-3 stocks. All AI models will analyze and compare them.",
      },
      deploy: {
        title: "Deploy Capital",
        sub: "Enter the amount and get recommendations from all AI models.",
      },
      behavior: {
        title: "Your Investing Behavior",
        sub: "Get insights on your patterns, improvement areas, and one thing to change.",
      },
      swing: {
        title: "Swing Trade Ideas",
        sub: "Analyst + critic pipeline over 2-8 week horizons. Entry, stop, target grounded in price + RAG.",
      },
    };
    const h = HERO[activeTab];
    return (
      <LinearGradient
        colors={["#111112", "#1A1A1C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.aiHero}
      >
        <View style={styles.aiHeroGoldGlow} />
        <ThemedText style={styles.aiHeroTitle}>{h.title}</ThemedText>
        <ThemedText style={styles.aiHeroSub}>{h.sub}</ThemedText>
      </LinearGradient>
    );
  };

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
          <Feather name="zap" size={18} color={Palette.black} />
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
          <Feather name="zap" size={18} color={Palette.black} />
          <ThemedText style={styles.buttonText}>Get All Recommendations</ThemedText>
        </TouchableOpacity>
      </Card>
      {renderResults(deployResults, "deploy")}
      {deployResults.length > 0 && !loading && (
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.md }]} onPress={runDeploy}>
          <Feather name="refresh-cw" size={18} color={Palette.black} />
          <ThemedText style={styles.buttonText}>Re-analyze</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Behavior Tab ───
  const renderBehavior = () => (
    <View>
      {behaviorResults.length === 0 && (
        <Card style={styles.card}>
          <Feather name="trending-up" size={48} color={theme.primary} style={{ alignSelf: "center", marginBottom: Spacing.lg }} />
          <ThemedText type="h4" style={{ textAlign: "center", marginBottom: Spacing.sm }}>Your Investing Behavior</ThemedText>
          <ThemedText style={{ color: theme.textSecondary, textAlign: "center", marginBottom: Spacing.xl }}>
            Get insights on your patterns, improvement areas, and one thing to change. Uses your holdings, transactions, dividends, and realized gains.
          </ThemedText>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={runBehaviorAnalysis} disabled={loading}>
            <Feather name="zap" size={18} color={Palette.black} />
            <ThemedText style={styles.buttonText}>Analyze with All AI Models</ThemedText>
          </TouchableOpacity>
        </Card>
      )}
      {renderResults(behaviorResults, "behavior")}
      {behaviorResults.length > 0 && !loading && (
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.md }]} onPress={runBehaviorAnalysis}>
          <Feather name="refresh-cw" size={18} color={Palette.black} />
          <ThemedText style={styles.buttonText}>Re-analyze</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Swing Tab ─── analyst + critic pipeline per symbol
  const runSwingAnalysis = async (symbolOverride?: string) => {
    const sym = (symbolOverride ?? swingSymbol).trim().toUpperCase();
    if (!sym) {
      setSwingError("Enter a symbol first");
      return;
    }
    setSwingError(null);
    setSwingLoading(true);
    setSwingResult(null);

    // Keep screen awake — swing pipeline can take 30–60s.
    const keepAwakeTag = `swing-${sym}-${Date.now()}`;
    try {
      await KeepAwake.activateKeepAwakeAsync(keepAwakeTag);
    } catch {}

    const startedAt = Date.now();
    try {
      const resp = await apiRequest("GET", `/api/swing/${sym}`);
      const data = (await resp.json()) as SwingAnalysisResult;
      if ((data as any).error) {
        setSwingError((data as any).error);
      } else {
        setSwingResult(data);
        setSwingSymbol(sym);
        // Persist so closing the screen doesn't lose the result.
        saveSession({
          type: "swing",
          subject: sym,
          provider: data.model ?? "unknown",
          elapsedMs: Date.now() - startedAt,
          result: data,
        }).catch((e) => console.warn("[history] save failed:", e));
      }
    } catch (e: any) {
      setSwingError(e?.message || "Request failed");
    } finally {
      setSwingLoading(false);
      KeepAwake.deactivateKeepAwake(keepAwakeTag);
    }
  };

  const verdictColor = (v: string) => {
    if (v === "BUY_NOW") return Palette.gold;
    if (v === "AVOID") return Palette.whisperRed ?? "#FF6B6B";
    return Palette.black400;
  };

  const fmt = (n: number | null | undefined, d = 2) =>
    n == null || !isFinite(n) ? "—" : n.toFixed(d);

  const renderSwing = () => (
    <View>
      {/* Ticker picker: searchable dropdown of all EGX stocks */}
      <Card style={styles.card}>
        <SelectPicker
          label="Stock"
          placeholder="Select a stock to analyse"
          options={(() => {
            // Holdings first (prefixed • so they appear at top when sorted),
            // then all EGX stocks alphabetically.
            const heldSet = new Set(holdings.map((h) => h.symbol));
            const held = holdings.map((h) => ({
              id: h.symbol,
              label: `• ${h.symbol}`,
              sublabel: h.nameEn ?? "",
            }));
            const others = EGX_STOCKS
              .filter((s) => !heldSet.has(s.symbol))
              .map((s) => ({
                id: s.symbol,
                label: s.symbol,
                sublabel: s.nameEn,
              }));
            return [...held, ...others];
          })()}
          selectedId={swingSymbol || undefined}
          onSelect={(id) => setSwingSymbol(id)}
        />
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: swingSymbol ? theme.primary : theme.backgroundSecondary,
              marginTop: Spacing.lg,
              opacity: swingSymbol ? 1 : 0.6,
            },
          ]}
          onPress={() => runSwingAnalysis()}
          disabled={swingLoading || !swingSymbol}
        >
          <Feather name="zap" size={18} color={Palette.black} />
          <ThemedText style={styles.buttonText}>
            {swingLoading
              ? "Analysing…"
              : swingSymbol
                ? `Run Swing Analysis on ${swingSymbol}`
                : "Pick a stock first"}
          </ThemedText>
        </TouchableOpacity>
        {swingError && (
          <View style={[styles.errorBox, { borderColor: Palette.whisperRed, backgroundColor: "rgba(255,107,107,0.08)" }]}>
            <Feather name="alert-triangle" size={14} color={Palette.whisperRed} />
            <ThemedText style={{ color: Palette.whisperRed, fontSize: 13, flex: 1, marginLeft: 8 }}>
              {swingError}
            </ThemedText>
          </View>
        )}
      </Card>

      {swingLoading && (
        <Card style={styles.card}>
          <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: Spacing.lg }} />
          <ThemedText style={{ textAlign: "center", color: theme.textSecondary }}>
            Running analyst + critic pipeline. Usually 25–40s.
          </ThemedText>
        </Card>
      )}

      {swingResult && !swingLoading && (
        <>
          {/* Verdict header card */}
          <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: verdictColor(swingResult.finalVerdict) }]}>
            <View style={styles.row}>
              <View>
                <ThemedText style={{ fontSize: 11, color: theme.textSecondary, letterSpacing: 1 }}>
                  {swingResult.symbol} · {swingResult.recommendation.timeframeWeeks}w horizon
                </ThemedText>
                <ThemedText type="h3" style={{ color: verdictColor(swingResult.finalVerdict), marginTop: 2 }}>
                  {swingResult.finalVerdict.replace("_", " ")}
                </ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: verdictColor(swingResult.finalVerdict) + "22" }]}>
                <ThemedText style={[styles.badgeText, { color: verdictColor(swingResult.finalVerdict) }]}>
                  {swingResult.adjustedConfidence}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={{ marginTop: Spacing.md, lineHeight: 20, color: theme.textSecondary }}>
              {swingResult.recommendation.reasoning}
            </ThemedText>
          </Card>

          {/* Entry / Stop / Target grid */}
          {swingResult.recommendation.entryRange && (
            <Card style={styles.card}>
              <ThemedText style={styles.resultHeader}>TRADE PLAN</ThemedText>
              <View style={{ flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>ENTRY</ThemedText>
                  <ThemedText type="h4" style={{ fontFamily: "monospace" }}>
                    {fmt(swingResult.recommendation.entryRange.low)}–{fmt(swingResult.recommendation.entryRange.high)}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>STOP</ThemedText>
                  <ThemedText type="h4" style={{ fontFamily: "monospace", color: Palette.whisperRed ?? "#FF6B6B" }}>
                    {fmt(swingResult.recommendation.stopLoss)}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>TARGET</ThemedText>
                  <ThemedText type="h4" style={{ fontFamily: "monospace", color: Palette.gold }}>
                    {fmt(swingResult.recommendation.targetPrice)}
                  </ThemedText>
                </View>
              </View>
            </Card>
          )}

          {/* Technicals card */}
          <Card style={styles.card}>
            <ThemedText style={styles.resultHeader}>TECHNICALS (as of {swingResult.technicals.asOf})</ThemedText>
            <View style={{ marginTop: Spacing.sm, gap: 6 }}>
              <View style={styles.row}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Price</ThemedText>
                <ThemedText style={{ fontFamily: "monospace" }}>EGP {fmt(swingResult.technicals.currentPrice)}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>20d / 50d SMA</ThemedText>
                <ThemedText style={{ fontFamily: "monospace" }}>
                  {fmt(swingResult.technicals.sma20)} / {fmt(swingResult.technicals.sma50)}
                </ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Dist from 50d SMA</ThemedText>
                <ThemedText style={{ fontFamily: "monospace" }}>{fmt(swingResult.technicals.distanceFromSma50Pct)}%</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>20d momentum</ThemedText>
                <ThemedText style={{ fontFamily: "monospace" }}>{fmt(swingResult.technicals.momentum20dPct)}%</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>52w range position</ThemedText>
                <ThemedText style={{ fontFamily: "monospace" }}>{fmt(swingResult.technicals.rangePositionPct, 1)}%</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Realized vol (ann.)</ThemedText>
                <ThemedText style={{ fontFamily: "monospace" }}>{fmt(swingResult.technicals.realizedVol20dPct)}%</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Volume vs 20d avg</ThemedText>
                <ThemedText style={{ fontFamily: "monospace" }}>{fmt(swingResult.technicals.recentVolumeMultiple, 2)}×</ThemedText>
              </View>
            </View>
          </Card>

          {/* Technical signals */}
          {swingResult.recommendation.technicalSignals.length > 0 && (
            <Card style={styles.card}>
              <ThemedText style={styles.resultHeader}>TECHNICAL SIGNALS</ThemedText>
              {swingResult.recommendation.technicalSignals.map((s, i) => (
                <View key={i} style={styles.bulletRow}>
                  <ThemedText style={{ color: theme.primary, fontSize: 14 }}>●</ThemedText>
                  <ThemedText type="small" style={styles.bulletText}>{s}</ThemedText>
                </View>
              ))}
            </Card>
          )}

          {/* Fundamental catalysts */}
          {swingResult.recommendation.fundamentalCatalysts.length > 0 && (
            <Card style={styles.card}>
              <ThemedText style={styles.resultHeader}>FUNDAMENTAL CATALYSTS</ThemedText>
              {swingResult.recommendation.fundamentalCatalysts.map((c, i) => (
                <View key={i} style={styles.bulletRow}>
                  <ThemedText style={{ color: Palette.gold, fontSize: 14 }}>▸</ThemedText>
                  <ThemedText type="small" style={styles.bulletText}>{c}</ThemedText>
                </View>
              ))}
            </Card>
          )}

          {/* Risks */}
          {swingResult.recommendation.risks.length > 0 && (
            <Card style={styles.card}>
              <ThemedText style={styles.resultHeader}>RISKS</ThemedText>
              {swingResult.recommendation.risks.map((r, i) => (
                <View key={i} style={styles.bulletRow}>
                  <ThemedText style={{ color: Palette.whisperRed ?? "#FF6B6B", fontSize: 14 }}>●</ThemedText>
                  <ThemedText type="small" style={styles.bulletText}>{r}</ThemedText>
                </View>
              ))}
            </Card>
          )}

          {/* Critic feedback (if present) */}
          {swingResult.criticFeedback && (
            <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: Palette.gold400 ?? Palette.gold }]}>
              <ThemedText style={styles.resultHeader}>
                CRITIC · {swingResult.criticFeedback.severity.toUpperCase()} SEVERITY
              </ThemedText>
              <ThemedText style={{ fontWeight: "700", marginTop: Spacing.sm }}>
                Counter: {swingResult.criticFeedback.counterVerdict.replace("_", " ")}
              </ThemedText>
              <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.sm, lineHeight: 20 }}>
                {swingResult.criticFeedback.weakness}
              </ThemedText>
              <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.sm, lineHeight: 20, fontStyle: "italic" }}>
                {swingResult.criticFeedback.counterScenario}
              </ThemedText>
              {swingResult.criticFeedback.blockingIssues.length > 0 && (
                <View style={{ marginTop: Spacing.md }}>
                  {swingResult.criticFeedback.blockingIssues.map((b, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Feather name="alert-triangle" size={12} color={Palette.gold} />
                      <ThemedText type="small" style={styles.bulletText}>{b}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          )}

          {/* Citations */}
          {swingResult.recommendation.citations.length > 0 && (
            <Card style={styles.card}>
              <ThemedText style={styles.resultHeader}>CITATIONS</ThemedText>
              {swingResult.recommendation.citations.map((c, i) => (
                <View key={i} style={{ marginTop: Spacing.sm }}>
                  <ThemedText style={{ fontSize: 11, fontWeight: "700", color: Palette.gold, letterSpacing: 0.5 }}>
                    {c.source}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary, lineHeight: 18, marginTop: 2 }}>
                    "{c.snippet}"
                  </ThemedText>
                </View>
              ))}
            </Card>
          )}

          <ThemedText
            style={{ fontSize: 11, color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}
          >
            {swingResult.model} · {swingResult.ragUsed ? "RAG-grounded" : "no RAG"} · {swingResult.elapsedMs}ms
          </ThemedText>
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: 100 + insets.bottom + Spacing["4xl"], paddingHorizontal: Spacing.lg }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.titleBar}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.screenTitle}>AI Analysis</ThemedText>
            <ThemedText style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              5 models · side-by-side
            </ThemedText>
          </View>
          <Feather name="settings" size={20} color={theme.textSecondary} />
        </View>
        {renderActiveHero()}
        {renderTabs()}
        {activeTab === "portfolio" && renderPortfolio()}
        {activeTab === "swing" && renderSwing()}
        {activeTab === "compare" && renderCompare()}
        {activeTab === "deploy" && renderDeploy()}
        {activeTab === "behavior" && renderBehavior()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  titleBar: {
    flexDirection: "row",
    alignItems: "center",
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
  aiHero: {
    backgroundColor: "#111112",
    borderRadius: 20,
    padding: 18,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(212,168,90,0.20)",
    overflow: "hidden",
  },
  aiHeroGoldGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#D4A85A",
    opacity: 0.08,
  },
  aiHeroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  aiHeroSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 17,
  },
  secHdr: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  secDot: {
    width: 7,
    height: 7,
    borderRadius: 9999,
  },
  secLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  secLine: {
    flex: 1,
    height: 1,
  },
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
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 48, borderRadius: 9999, gap: Spacing.sm },
  buttonText: { color: Palette.black, fontWeight: "700", fontSize: 14 },
  resultHeader: { fontSize: 10, fontWeight: "700", letterSpacing: 1.4, opacity: 0.75, textTransform: "uppercase" },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderRadius: 10,
  },
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
  reasoningStepsHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.sm },
  reasoningStepsTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  reasoningStepsList: { marginTop: Spacing.sm, gap: Spacing.sm },
  reasoningStepItem: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.sm },
  reasoningStepNumber: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  reasoningStepNumberText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  reasoningStepText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
