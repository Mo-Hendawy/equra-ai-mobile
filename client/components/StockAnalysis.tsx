import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface ProviderInfo {
  id: string;
  name: string;
  model: string;
}

interface ProviderResult {
  provider: string;
  providerName: string;
  model: string;
  result: StockAnalysisResult | null;
  error?: string;
  durationMs: number;
  loading: boolean;
  ragUsed?: boolean;
}

interface StockAnalysisResult {
  fairValueEstimate: number | null;
  fairValueRange: { min: number; max: number } | null;
  strongBuyZone: { min: number; max: number } | null;
  buyZone: { min: number; max: number } | null;
  holdZone: { min: number; max: number } | null;
  sellZone: { min: number; max: number } | null;
  strongSellZone: { min: number; max: number } | null;
  firstTarget: number | null;
  secondTarget: number | null;
  thirdTarget: number | null;
  recommendation: string;
  confidence: "High" | "Medium" | "Low";
  reasoning: string;
  riskLevel: "Low" | "Medium" | "High";
  keyPoints: string[];
  analysisMethod: string;
  valuationStatus: "Undervalued" | "Fair" | "Overvalued";
  simpleExplanation: string[];
  riskSignals: string[];
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

interface StockAnalysisProps {
  symbol: string;
}

export function StockAnalysis({ symbol }: StockAnalysisProps) {
  const { theme } = useTheme();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [results, setResults] = useState<Record<string, ProviderResult>>({});
  const [activeProvider, setActiveProvider] = useState<string>("");
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  useEffect(() => {
    fetchAllProviders();
  }, [symbol]);

  const fetchAllProviders = async () => {
    try {
      const res = await apiRequest("GET", "/api/ai/trusted-providers");
      const data = await res.json();
      const providerList: ProviderInfo[] = data.providers || [];
      setProviders(providerList);

      if (providerList.length > 0) {
        setActiveProvider(providerList[0].id);

        const initialResults: Record<string, ProviderResult> = {};
        providerList.forEach((p) => {
          initialResults[p.id] = {
            provider: p.id,
            providerName: p.name,
            model: p.model,
            result: null,
            loading: true,
            durationMs: 0,
          };
        });
        setResults(initialResults);

        providerList.forEach((p) => {
          fetchProviderAnalysis(p.id, p.name, p.model);
        });
      }
    } catch (error) {
      console.log("Failed to fetch trusted providers:", error);
    }
  };

  const fetchProviderAnalysis = async (providerId: string, providerName: string, model: string) => {
    try {
      const res = await apiRequest("GET", `/api/ai/${providerId}/stock-analysis/${symbol}`);
      const data = await res.json();

      setResults((prev) => ({
        ...prev,
        [providerId]: {
          provider: providerId,
          providerName,
          model,
          result: data.result || null,
          error: data.error,
          durationMs: data.durationMs || 0,
          loading: false,
          ragUsed: data.ragUsed,
        },
      }));
    } catch (error: any) {
      setResults((prev) => ({
        ...prev,
        [providerId]: {
          provider: providerId,
          providerName,
          model,
          result: null,
          error: error.message || "Failed",
          durationMs: 0,
          loading: false,
        },
      }));
    }
  };

  const handleRefresh = () => {
    setShowDetailedAnalysis(false);
    const resetResults: Record<string, ProviderResult> = {};
    providers.forEach((p) => {
      resetResults[p.id] = {
        provider: p.id,
        providerName: p.name,
        model: p.model,
        result: null,
        loading: true,
        durationMs: 0,
      };
    });
    setResults(resetResults);
    providers.forEach((p) => {
      fetchProviderAnalysis(p.id, p.name, p.model);
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "Strong Buy": return "#10B981";
      case "Buy": return "#22C55E";
      case "Hold": return "#F59E0B";
      case "Sell": return "#F97316";
      case "Strong Sell": return "#EF4444";
      default: return theme.textSecondary;
    }
  };

  const getConfidenceColor = (c: string): string => {
    switch (c) {
      case "High": return "#10B981";
      case "Medium": return "#F59E0B";
      case "Low": return "#EF4444";
      default: return theme.textSecondary;
    }
  };

  const allLoading = Object.values(results).every((r) => r.loading);
  const anyLoading = Object.values(results).some((r) => r.loading);
  const activeResult = results[activeProvider];
  const analysis = activeResult?.result;

  if (providers.length === 0 && allLoading) {
    return (
      <Card style={styles.card}>
        <ThemedText type="h4" style={styles.title}>AI Stock Analysis</ThemedText>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading providers...
          </ThemedText>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      {/* Title + Source Badge + Refresh */}
      <View style={styles.titleRow}>
        <ThemedText type="h4" style={styles.title}>AI Stock Analysis</ThemedText>
        <View style={styles.titleActions}>
          {activeResult && !activeResult.loading && (
            <>
              <View style={[styles.sourceBadge, { backgroundColor: (activeResult.result ? "#10B981" : "#F59E0B") + "20" }]}>
                <ThemedText style={[styles.sourceBadgeText, { color: activeResult.result ? "#10B981" : "#F59E0B" }]}>
                  {activeResult.result ? activeResult.providerName : "Failed"}
                </ThemedText>
              </View>
              {activeResult.result && activeResult.ragUsed && (
                <View style={[styles.sourceBadge, { backgroundColor: "#3B82F620", marginLeft: 6 }]}>
                  <ThemedText style={[styles.sourceBadgeText, { color: "#3B82F6" }]}>
                    Based on financial reports
                  </ThemedText>
                </View>
              )}
            </>
          )}
          <TouchableOpacity onPress={handleRefresh} disabled={anyLoading} style={styles.refreshButton}>
            {anyLoading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Feather name="refresh-cw" size={18} color={theme.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Consensus Bar */}
      {!allLoading && (
        <View style={styles.consensusBar}>
          {providers.map((p) => {
            const r = results[p.id];
            const color = PROVIDER_COLORS[p.id] || theme.primary;
            if (!r || r.loading) {
              return (
                <View key={p.id} style={[styles.consensusItem, { borderColor: color + "30" }]}>
                  <ActivityIndicator size="small" color={color} />
                </View>
              );
            }
            if (r.error || !r.result) {
              return (
                <View key={p.id} style={[styles.consensusItem, { borderColor: "#EF4444" + "30" }]}>
                  <Feather name="x-circle" size={14} color="#EF4444" />
                  <ThemedText style={[styles.consensusName, { color: "#EF4444" }]} numberOfLines={1}>
                    {p.name.split(" ")[0]}
                  </ThemedText>
                </View>
              );
            }
            const recColor = getRecommendationColor(r.result.recommendation);
            return (
              <View key={p.id} style={[styles.consensusItem, { borderColor: recColor + "40", backgroundColor: recColor + "10" }]}>
                <ThemedText style={[styles.consensusName, { color }]} numberOfLines={1}>
                  {p.name.split(" ")[0]}
                </ThemedText>
                <ThemedText style={[styles.consensusRec, { color: recColor }]} numberOfLines={1}>
                  {r.result.recommendation}
                </ThemedText>
              </View>
            );
          })}
        </View>
      )}

      {/* Provider Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabRow}>
          {providers.map((p) => {
            const isActive = p.id === activeProvider;
            const color = PROVIDER_COLORS[p.id] || theme.primary;
            const r = results[p.id];
            const hasError = r && !r.loading && (r.error || !r.result);
            const iconName = (PROVIDER_ICONS[p.id] || "cpu") as any;

            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setActiveProvider(p.id)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive ? color + "20" : "transparent",
                    borderColor: isActive ? color : theme.textSecondary + "30",
                    borderWidth: isActive ? 2 : 1,
                  },
                ]}
              >
                <Feather name={iconName} size={14} color={isActive ? color : theme.textSecondary} />
                <ThemedText
                  style={[styles.tabText, { color: isActive ? color : theme.textSecondary }]}
                  numberOfLines={1}
                >
                  {p.name.split("(")[0].trim()}
                </ThemedText>
                {r?.loading && <ActivityIndicator size="small" color={color} />}
                {hasError && <Feather name="alert-circle" size={12} color="#EF4444" />}
                {r && !r.loading && r.result && (
                  <ThemedText style={[styles.tabDuration, { color: theme.textSecondary }]}>
                    {(r.durationMs / 1000).toFixed(1)}s
                  </ThemedText>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Active Provider Result */}
      {activeResult?.loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={PROVIDER_COLORS[activeProvider] || theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            {activeResult.providerName} analyzing {symbol}...
          </ThemedText>
        </View>
      )}

      {activeResult && !activeResult.loading && activeResult.error && (
        <View style={[styles.errorBox, { backgroundColor: "#EF4444" + "10" }]}>
          <Feather name="alert-circle" size={16} color="#EF4444" />
          <ThemedText style={[styles.errorText, { color: "#EF4444" }]}>
            {activeResult.providerName}: {activeResult.error}
          </ThemedText>
        </View>
      )}

      {analysis && (
        <View>
          {/* Simplified Analysis */}
          <View style={styles.simplifiedSection}>
            {/* Valuation Meter */}
            <View style={styles.fairValueMeterSection}>
              <View style={styles.meterBar}>
                {(["Undervalued", "Fair", "Overvalued"] as const).map((status) => {
                  const colors: Record<string, string> = { Undervalued: "#10B981", Fair: "#F59E0B", Overvalued: "#EF4444" };
                  const isActive = analysis.valuationStatus === status;
                  return (
                    <View
                      key={status}
                      style={[
                        styles.meterSegment,
                        {
                          backgroundColor: colors[status] + (isActive ? "40" : "15"),
                          borderWidth: isActive ? 2 : 0,
                          borderColor: colors[status],
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.meterLabel,
                          {
                            color: isActive ? colors[status] : theme.textSecondary,
                            fontWeight: isActive ? "700" : "400",
                          },
                        ]}
                      >
                        {status}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
              <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(analysis.confidence) + "20" }]}>
                <ThemedText style={[styles.confidenceText, { color: getConfidenceColor(analysis.confidence) }]}>
                  Confidence: {analysis.confidence}
                </ThemedText>
              </View>
            </View>

            {/* Simple Explanation */}
            {analysis.simpleExplanation?.length > 0 && (
              <View style={styles.whySection}>
                <View style={styles.bulletList}>
                  {analysis.simpleExplanation.map((point: string, index: number) => (
                    <View key={index} style={[styles.bulletItem, { backgroundColor: theme.backgroundSecondary }]}>
                      <View style={[styles.bulletDot, { backgroundColor: PROVIDER_COLORS[activeProvider] || theme.primary }]} />
                      <ThemedText style={[styles.bulletText, { color: theme.text }]}>{point}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Risk Signals */}
            {analysis.riskSignals?.length > 0 && (
              <View style={styles.riskSection}>
                <ThemedText style={[styles.riskTitle, { color: theme.text }]}>Red Flags & Risk Signals</ThemedText>
                <View style={styles.riskList}>
                  {analysis.riskSignals.map((signal: string, index: number) => (
                    <View key={index} style={[styles.riskItem, { backgroundColor: "#EF4444" + "10" }]}>
                      <Feather name="alert-circle" size={16} color="#EF4444" />
                      <ThemedText style={[styles.riskText, { color: theme.text }]}>{signal}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* See More Button */}
            <TouchableOpacity
              style={[styles.seeMoreButton, { backgroundColor: (PROVIDER_COLORS[activeProvider] || theme.primary) + "15" }]}
              onPress={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
            >
              <ThemedText style={[styles.seeMoreText, { color: PROVIDER_COLORS[activeProvider] || theme.primary }]}>
                {showDetailedAnalysis ? "Show Less" : "See Detailed Analysis"}
              </ThemedText>
              <Feather
                name={showDetailedAnalysis ? "chevron-up" : "chevron-down"}
                size={20}
                color={PROVIDER_COLORS[activeProvider] || theme.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Detailed Analysis */}
          {showDetailedAnalysis && (
            <View>
              <View style={[styles.recommendationBox, { backgroundColor: getRecommendationColor(analysis.recommendation) + "20" }]}>
                <ThemedText style={[styles.recommendationLabel, { color: theme.textSecondary }]}>Recommendation</ThemedText>
                <ThemedText style={[styles.recommendationValue, { color: getRecommendationColor(analysis.recommendation) }]}>
                  {analysis.recommendation}
                </ThemedText>
              </View>

              {/* Fair Value */}
              {analysis.fairValueEstimate && (
                <View style={styles.section}>
                  <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Fair Value</ThemedText>
                  <View style={[styles.fairValueItem, { backgroundColor: (PROVIDER_COLORS[activeProvider] || theme.primary) + "15" }]}>
                    <ThemedText style={[styles.fairValueLabel, { color: PROVIDER_COLORS[activeProvider] || theme.primary }]}>
                      Estimated Fair Value
                    </ThemedText>
                    <ThemedText style={[styles.fairValueValue, Typography.mono, { color: PROVIDER_COLORS[activeProvider] || theme.primary }]}>
                      EGP {formatCurrency(analysis.fairValueEstimate)}
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* Price Zones */}
              {analysis.strongBuyZone && (
                <View style={styles.section}>
                  <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Price Zones</ThemedText>
                  <View style={styles.zonesContainer}>
                    <View style={[styles.zoneRow, { backgroundColor: "#10B981" + "20" }]}>
                      <ThemedText style={[styles.zoneLabel, { color: "#10B981" }]}>Strong Buy</ThemedText>
                      <ThemedText style={[styles.zoneValue, Typography.mono, { color: "#10B981" }]}>
                        EGP 0 - {formatCurrency(analysis.strongBuyZone.max)}
                      </ThemedText>
                    </View>
                    {analysis.buyZone && (
                      <View style={[styles.zoneRow, { backgroundColor: "#22C55E" + "15" }]}>
                        <ThemedText style={[styles.zoneLabel, { color: "#22C55E" }]}>Buy</ThemedText>
                        <ThemedText style={[styles.zoneValue, Typography.mono, { color: "#22C55E" }]}>
                          EGP {formatCurrency(analysis.buyZone.min)} - {formatCurrency(analysis.buyZone.max)}
                        </ThemedText>
                      </View>
                    )}
                    {analysis.holdZone && (
                      <View style={[styles.zoneRow, { backgroundColor: "#F59E0B" + "15" }]}>
                        <ThemedText style={[styles.zoneLabel, { color: "#F59E0B" }]}>Hold</ThemedText>
                        <ThemedText style={[styles.zoneValue, Typography.mono, { color: "#F59E0B" }]}>
                          EGP {formatCurrency(analysis.holdZone.min)} - {formatCurrency(analysis.holdZone.max)}
                        </ThemedText>
                      </View>
                    )}
                    {analysis.sellZone && (
                      <View style={[styles.zoneRow, { backgroundColor: "#F97316" + "15" }]}>
                        <ThemedText style={[styles.zoneLabel, { color: "#F97316" }]}>Sell</ThemedText>
                        <ThemedText style={[styles.zoneValue, Typography.mono, { color: "#F97316" }]}>
                          EGP {formatCurrency(analysis.sellZone.min)} - {formatCurrency(analysis.sellZone.max)}
                        </ThemedText>
                      </View>
                    )}
                    {analysis.strongSellZone && (
                      <View style={[styles.zoneRow, { backgroundColor: "#EF4444" + "15" }]}>
                        <ThemedText style={[styles.zoneLabel, { color: "#EF4444" }]}>Strong Sell</ThemedText>
                        <ThemedText style={[styles.zoneValue, Typography.mono, { color: "#EF4444" }]}>
                          EGP {formatCurrency(analysis.strongSellZone.min)}+
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Price Targets */}
              {analysis.firstTarget && (
                <View style={styles.section}>
                  <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Price Targets</ThemedText>
                  <View style={styles.targetsGrid}>
                    <View style={[styles.targetItem, { backgroundColor: theme.success + "15" }]}>
                      <ThemedText style={[styles.targetLabel, { color: theme.success }]}>1st</ThemedText>
                      <ThemedText style={[styles.targetValue, Typography.mono, { color: theme.success }]}>
                        EGP {formatCurrency(analysis.firstTarget)}
                      </ThemedText>
                    </View>
                    {analysis.secondTarget && (
                      <View style={[styles.targetItem, { backgroundColor: theme.primary + "15" }]}>
                        <ThemedText style={[styles.targetLabel, { color: theme.primary }]}>2nd</ThemedText>
                        <ThemedText style={[styles.targetValue, Typography.mono, { color: theme.primary }]}>
                          EGP {formatCurrency(analysis.secondTarget)}
                        </ThemedText>
                      </View>
                    )}
                    {analysis.thirdTarget && (
                      <View style={[styles.targetItem, { backgroundColor: "#8B5CF6" + "15" }]}>
                        <ThemedText style={[styles.targetLabel, { color: "#8B5CF6" }]}>3rd</ThemedText>
                        <ThemedText style={[styles.targetValue, Typography.mono, { color: "#8B5CF6" }]}>
                          EGP {formatCurrency(analysis.thirdTarget)}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* AI Reasoning */}
              {analysis.reasoning && (
                <View style={styles.section}>
                  <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Detailed Analysis</ThemedText>
                  <View style={[styles.aiReasoningContainer, { backgroundColor: theme.backgroundSecondary }]}>
                    <ThemedText style={[styles.aiReasoning, { color: theme.text }]}>{analysis.reasoning}</ThemedText>
                  </View>

                  {analysis.keyPoints?.length > 0 && (
                    <View style={styles.keyPointsContainer}>
                      <ThemedText style={[styles.keyPointsTitle, { color: theme.textSecondary }]}>Key Takeaways:</ThemedText>
                      {analysis.keyPoints.map((point: string, index: number) => (
                        <View key={index} style={[styles.keyPointItem, { backgroundColor: theme.backgroundSecondary }]}>
                          <ThemedText style={[styles.keyPointNumber, { color: PROVIDER_COLORS[activeProvider] || theme.primary }]}>
                            {index + 1}
                          </ThemedText>
                          <ThemedText style={[styles.keyPointText, { color: theme.text }]}>{point}</ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <ThemedText style={[styles.disclaimer, { color: theme.textSecondary }]}>
                Analysis by {activeResult?.providerName} ({activeResult?.model}). Not financial advice.
              </ThemedText>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.md },
  title: { marginBottom: 0 },
  titleActions: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flexWrap: "wrap", justifyContent: "flex-end", flex: 1, marginLeft: Spacing.sm },
  sourceBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.xs },
  sourceBadgeText: { fontSize: 10, fontWeight: "700" },
  refreshButton: { padding: Spacing.xs },
  consensusBar: { flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.md },
  consensusItem: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: 2,
  },
  consensusName: { fontSize: 10, fontWeight: "700" },
  consensusRec: { fontSize: 10, fontWeight: "600" },
  tabScroll: { marginBottom: Spacing.md },
  tabRow: { flexDirection: "row", gap: Spacing.sm },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  tabText: { fontSize: 13, fontWeight: "600" },
  tabDuration: { fontSize: 10 },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: { fontSize: 14 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  errorText: { flex: 1, fontSize: 13 },
  simplifiedSection: { marginBottom: Spacing.md },
  fairValueMeterSection: { marginBottom: Spacing.lg },
  meterBar: { flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.sm },
  meterSegment: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, alignItems: "center" },
  meterLabel: { fontSize: 13, textAlign: "center" },
  confidenceBadge: { alignSelf: "flex-start", paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.xs },
  confidenceText: { fontSize: 12, fontWeight: "600" },
  whySection: { marginBottom: Spacing.lg },
  bulletList: { gap: Spacing.sm },
  bulletItem: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.sm },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
  riskSection: { marginBottom: Spacing.lg },
  riskTitle: { fontSize: 14, fontWeight: "700", marginBottom: Spacing.sm },
  riskList: { gap: Spacing.sm },
  riskItem: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.sm },
  riskText: { flex: 1, fontSize: 13, lineHeight: 20 },
  seeMoreButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.sm },
  seeMoreText: { fontSize: 15, fontWeight: "600" },
  recommendationBox: { padding: Spacing.lg, borderRadius: BorderRadius.md, alignItems: "center", marginBottom: Spacing.lg },
  recommendationLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: Spacing.xs },
  recommendationValue: { fontSize: 24, fontWeight: "700" },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: Spacing.md },
  fairValueItem: { padding: Spacing.md, borderRadius: BorderRadius.sm },
  fairValueLabel: { fontSize: 12, marginBottom: 4 },
  fairValueValue: { fontSize: 16, fontWeight: "600" },
  zonesContainer: { gap: Spacing.xs },
  zoneRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: Spacing.md, borderRadius: BorderRadius.sm },
  zoneLabel: { fontSize: 13, fontWeight: "600" },
  zoneValue: { fontSize: 13 },
  targetsGrid: { flexDirection: "row", gap: Spacing.sm },
  targetItem: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, alignItems: "center" },
  targetLabel: { fontSize: 11, marginBottom: 4 },
  targetValue: { fontSize: 14, fontWeight: "600" },
  aiReasoningContainer: { padding: Spacing.md, borderRadius: BorderRadius.sm, marginBottom: Spacing.md },
  aiReasoning: { fontSize: 14, lineHeight: 22 },
  keyPointsContainer: { gap: Spacing.sm },
  keyPointsTitle: { fontSize: 14, fontWeight: "600", marginBottom: Spacing.xs },
  keyPointItem: { flexDirection: "row", gap: Spacing.sm, alignItems: "flex-start", padding: Spacing.md, borderRadius: BorderRadius.sm },
  keyPointNumber: { fontSize: 16, fontWeight: "700", minWidth: 24, textAlign: "center" },
  keyPointText: { flex: 1, fontSize: 13, lineHeight: 20 },
  disclaimer: { fontSize: 10, fontStyle: "italic", textAlign: "center", marginTop: Spacing.md },
});
