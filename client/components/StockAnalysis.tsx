import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface StockAnalysisData {
  symbol: string;
  currentPrice: number | null;
  eps: number | null;
  peRatio: number | null;
  bookValue: number | null;
  priceToBook: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyDayAvg: number | null;
  twoHundredDayAvg: number | null;
  dividendYield: number | null;
  fairValuePE: number | null;
  fairValueGraham: number | null;
  fairValueAvg: number | null;
  strongBuyZone: { min: number; max: number } | null;
  buyZone: { min: number; max: number } | null;
  holdZone: { min: number; max: number } | null;
  sellZone: { min: number; max: number } | null;
  strongSellZone: { min: number; max: number } | null;
  firstTarget: number | null;
  secondTarget: number | null;
  thirdTarget: number | null;
  recommendation: string;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  dataAvailable: boolean;
  geminiReasoning?: string;
  geminiConfidence?: "High" | "Medium" | "Low";
  geminiRiskLevel?: "Low" | "Medium" | "High";
  geminiKeyPoints?: string[];
  analysisMethod?: string;
  error?: string;
}

interface StockAnalysisProps {
  symbol: string;
}

export function StockAnalysis({ symbol }: StockAnalysisProps) {
  const { theme } = useTheme();
  const [analysis, setAnalysis] = useState<StockAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const response = await apiRequest("GET", `/api/analysis/${symbol}`);
        const data = await response.json();
        setAnalysis(data);
      } catch (error) {
        console.log("Failed to fetch analysis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [symbol]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "Strong Buy":
        return "#10B981";
      case "Buy":
        return "#22C55E";
      case "Hold":
        return "#F59E0B";
      case "Sell":
        return "#F97316";
      case "Strong Sell":
        return "#EF4444";
      default:
        return theme.textSecondary;
    }
  };

  const getConfidenceColor = (confidence: "High" | "Medium" | "Low"): string => {
    switch (confidence) {
      case "High":
        return "#10B981";
      case "Medium":
        return "#F59E0B";
      case "Low":
        return "#EF4444";
      default:
        return theme.textSecondary;
    }
  };

  const getRiskColor = (risk: "Low" | "Medium" | "High"): string => {
    switch (risk) {
      case "Low":
        return "#10B981";
      case "Medium":
        return "#F59E0B";
      case "High":
        return "#EF4444";
      default:
        return theme.textSecondary;
    }
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <ThemedText type="h4" style={styles.title}>Stock Analysis</ThemedText>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Fetching analysis data...
          </ThemedText>
        </View>
      </Card>
    );
  }

  if (!analysis || !analysis.dataAvailable) {
    return (
      <Card style={styles.card}>
        <ThemedText type="h4" style={styles.title}>Stock Analysis</ThemedText>
        <ThemedText style={[styles.noDataText, { color: theme.textSecondary }]}>
          ⚠️ Unable to load AI analysis. Please ensure the backend server is running and try refreshing.
        </ThemedText>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <ThemedText type="h4" style={styles.title}>Stock Analysis</ThemedText>

      <View style={[styles.recommendationBox, { backgroundColor: getRecommendationColor(analysis.recommendation) + "20" }]}>
        <ThemedText style={[styles.recommendationLabel, { color: theme.textSecondary }]}>
          Recommendation
        </ThemedText>
        <ThemedText style={[styles.recommendationValue, { color: getRecommendationColor(analysis.recommendation) }]}>
          {analysis.recommendation}
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Key Metrics
        </ThemedText>
        <View style={styles.metricsGrid}>
          {analysis.currentPrice ? (
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>Current Price</ThemedText>
              <ThemedText style={[styles.metricValue, Typography.mono]}>EGP {formatCurrency(analysis.currentPrice)}</ThemedText>
            </View>
          ) : null}
          {analysis.eps ? (
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>EPS</ThemedText>
              <ThemedText style={[styles.metricValue, Typography.mono]}>{formatCurrency(analysis.eps)}</ThemedText>
            </View>
          ) : null}
          {analysis.peRatio ? (
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>P/E Ratio</ThemedText>
              <ThemedText style={[styles.metricValue, Typography.mono]}>{analysis.peRatio.toFixed(2)}</ThemedText>
            </View>
          ) : null}
          {analysis.bookValue ? (
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>Book Value</ThemedText>
              <ThemedText style={[styles.metricValue, Typography.mono]}>{formatCurrency(analysis.bookValue)}</ThemedText>
            </View>
          ) : null}
          {analysis.dividendYield ? (
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>Dividend Yield</ThemedText>
              <ThemedText style={[styles.metricValue, Typography.mono]}>{analysis.dividendYield.toFixed(2)}%</ThemedText>
            </View>
          ) : null}
          {analysis.sharpeRatio !== null ? (
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>Sharpe Ratio</ThemedText>
              <ThemedText style={[styles.metricValue, Typography.mono]}>
                {analysis.sharpeRatio > 999 ? "N/A" : analysis.sharpeRatio.toFixed(2)}
              </ThemedText>
            </View>
          ) : null}
          {analysis.sortinoRatio !== null ? (
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>Sortino Ratio</ThemedText>
              <ThemedText style={[styles.metricValue, Typography.mono]}>
                {analysis.sortinoRatio > 999 ? "N/A" : analysis.sortinoRatio.toFixed(2)}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      {analysis.fairValueAvg ? (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Fair Value Estimates
          </ThemedText>
          <View style={styles.fairValueGrid}>
            {analysis.fairValuePE ? (
              <View style={[styles.fairValueItem, { backgroundColor: theme.backgroundSecondary }]}>
                <ThemedText style={[styles.fairValueLabel, { color: theme.textSecondary }]}>P/E Method</ThemedText>
                <ThemedText style={[styles.fairValueValue, Typography.mono]}>EGP {formatCurrency(analysis.fairValuePE)}</ThemedText>
              </View>
            ) : null}
            {analysis.fairValueGraham ? (
              <View style={[styles.fairValueItem, { backgroundColor: theme.backgroundSecondary }]}>
                <ThemedText style={[styles.fairValueLabel, { color: theme.textSecondary }]}>Graham Formula</ThemedText>
                <ThemedText style={[styles.fairValueValue, Typography.mono]}>EGP {formatCurrency(analysis.fairValueGraham)}</ThemedText>
              </View>
            ) : null}
            <View style={[styles.fairValueItem, { backgroundColor: theme.primary + "15" }]}>
              <ThemedText style={[styles.fairValueLabel, { color: theme.primary }]}>Average Fair Value</ThemedText>
              <ThemedText style={[styles.fairValueValue, Typography.mono, { color: theme.primary }]}>EGP {formatCurrency(analysis.fairValueAvg)}</ThemedText>
            </View>
          </View>
        </View>
      ) : null}

      {analysis.strongBuyZone ? (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Price Zones
          </ThemedText>
          <View style={styles.zonesContainer}>
            <View style={[styles.zoneRow, { backgroundColor: "#10B981" + "20" }]}>
              <ThemedText style={[styles.zoneLabel, { color: "#10B981" }]}>Strong Buy Zone</ThemedText>
              <ThemedText style={[styles.zoneValue, Typography.mono, { color: "#10B981" }]}>
                EGP 0 - {formatCurrency(analysis.strongBuyZone.max)}
              </ThemedText>
            </View>
            {analysis.buyZone ? (
              <View style={[styles.zoneRow, { backgroundColor: "#22C55E" + "15" }]}>
                <ThemedText style={[styles.zoneLabel, { color: "#22C55E" }]}>Buy Zone</ThemedText>
                <ThemedText style={[styles.zoneValue, Typography.mono, { color: "#22C55E" }]}>
                  EGP {formatCurrency(analysis.buyZone.min)} - {formatCurrency(analysis.buyZone.max)}
                </ThemedText>
              </View>
            ) : null}
            {analysis.holdZone ? (
              <View style={[styles.zoneRow, { backgroundColor: "#F59E0B" + "15" }]}>
                <ThemedText style={[styles.zoneLabel, { color: "#F59E0B" }]}>Hold Zone</ThemedText>
                <ThemedText style={[styles.zoneValue, Typography.mono, { color: "#F59E0B" }]}>
                  EGP {formatCurrency(analysis.holdZone.min)} - {formatCurrency(analysis.holdZone.max)}
                </ThemedText>
              </View>
            ) : null}
            {analysis.sellZone ? (
              <View style={[styles.zoneRow, { backgroundColor: "#F97316" + "15" }]}>
                <ThemedText style={[styles.zoneLabel, { color: "#F97316" }]}>Sell Zone</ThemedText>
                <ThemedText style={[styles.zoneValue, Typography.mono, { color: "#F97316" }]}>
                  EGP {formatCurrency(analysis.sellZone.min)} - {formatCurrency(analysis.sellZone.max)}
                </ThemedText>
              </View>
            ) : null}
            {analysis.strongSellZone ? (
              <View style={[styles.zoneRow, { backgroundColor: "#EF4444" + "15" }]}>
                <ThemedText style={[styles.zoneLabel, { color: "#EF4444" }]}>Strong Sell Zone</ThemedText>
                <ThemedText style={[styles.zoneValue, Typography.mono, { color: "#EF4444" }]}>
                  EGP {formatCurrency(analysis.strongSellZone.min)}+
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {analysis.firstTarget ? (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Price Targets
          </ThemedText>
          <View style={styles.targetsGrid}>
            <View style={[styles.targetItem, { backgroundColor: theme.success + "15" }]}>
              <ThemedText style={[styles.targetLabel, { color: theme.success }]}>1st Target</ThemedText>
              <ThemedText style={[styles.targetValue, Typography.mono, { color: theme.success }]}>
                EGP {formatCurrency(analysis.firstTarget)}
              </ThemedText>
            </View>
            {analysis.secondTarget ? (
              <View style={[styles.targetItem, { backgroundColor: theme.primary + "15" }]}>
                <ThemedText style={[styles.targetLabel, { color: theme.primary }]}>2nd Target</ThemedText>
                <ThemedText style={[styles.targetValue, Typography.mono, { color: theme.primary }]}>
                  EGP {formatCurrency(analysis.secondTarget)}
                </ThemedText>
              </View>
            ) : null}
            {analysis.thirdTarget ? (
              <View style={[styles.targetItem, { backgroundColor: "#8B5CF6" + "15" }]}>
                <ThemedText style={[styles.targetLabel, { color: "#8B5CF6" }]}>3rd Target</ThemedText>
                <ThemedText style={[styles.targetValue, Typography.mono, { color: "#8B5CF6" }]}>
                  EGP {formatCurrency(analysis.thirdTarget)}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {analysis.fiftyTwoWeekLow && analysis.fiftyTwoWeekHigh ? (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            52-Week Range
          </ThemedText>
          <View style={styles.rangeContainer}>
            <View style={styles.rangeLabels}>
              <ThemedText style={[styles.rangeValue, Typography.mono]}>
                EGP {formatCurrency(analysis.fiftyTwoWeekLow)}
              </ThemedText>
              <ThemedText style={[styles.rangeValue, Typography.mono]}>
                EGP {formatCurrency(analysis.fiftyTwoWeekHigh)}
              </ThemedText>
            </View>
            <View style={[styles.rangeBar, { backgroundColor: theme.textSecondary + "30" }]}>
              {analysis.currentPrice ? (
                <View
                  style={[
                    styles.rangeIndicator,
                    {
                      backgroundColor: theme.primary,
                      left: `${((analysis.currentPrice - analysis.fiftyTwoWeekLow) / (analysis.fiftyTwoWeekHigh - analysis.fiftyTwoWeekLow)) * 100}%`,
                    },
                  ]}
                />
              ) : null}
            </View>
            <View style={styles.rangeLabels}>
              <ThemedText style={[styles.rangeLabel, { color: theme.textSecondary }]}>Low</ThemedText>
              <ThemedText style={[styles.rangeLabel, { color: theme.textSecondary }]}>High</ThemedText>
            </View>
          </View>
        </View>
      ) : null}

      {analysis.geminiReasoning ? (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            📊 Detailed AI Analysis
          </ThemedText>
          <View style={styles.aiMetaTags}>
            {analysis.geminiConfidence ? (
              <View style={[styles.aiTag, { backgroundColor: getConfidenceColor(analysis.geminiConfidence) + "20" }]}>
                <ThemedText style={[styles.aiTagText, { color: getConfidenceColor(analysis.geminiConfidence) }]}>
                  {analysis.geminiConfidence} Confidence
                </ThemedText>
              </View>
            ) : null}
            {analysis.geminiRiskLevel ? (
              <View style={[styles.aiTag, { backgroundColor: getRiskColor(analysis.geminiRiskLevel) + "20" }]}>
                <ThemedText style={[styles.aiTagText, { color: getRiskColor(analysis.geminiRiskLevel) }]}>
                  {analysis.geminiRiskLevel} Risk
                </ThemedText>
              </View>
            ) : null}
          </View>

          {analysis.analysisMethod ? (
            <ThemedText style={[styles.analysisMethod, { color: theme.textSecondary }]}>
              Method: {analysis.analysisMethod}
            </ThemedText>
          ) : null}
          
          <View style={[styles.aiReasoningContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText style={[styles.aiReasoning, { color: theme.text }]}>
              {analysis.geminiReasoning}
            </ThemedText>
          </View>

          {analysis.geminiKeyPoints && analysis.geminiKeyPoints.length > 0 ? (
            <View style={styles.keyPointsContainer}>
              <ThemedText style={[styles.keyPointsTitle, { color: theme.textSecondary }]}>
                📌 Key Takeaways:
              </ThemedText>
              {analysis.geminiKeyPoints.map((point, index) => (
                <View key={index} style={[styles.keyPointItem, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText style={[styles.keyPointNumber, { color: theme.primary }]}>
                    {index + 1}
                  </ThemedText>
                  <ThemedText style={[styles.keyPointText, { color: theme.text }]}>{point}</ThemedText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <ThemedText style={[styles.disclaimer, { color: theme.textSecondary }]}>
        Analysis is based on publicly available data and should not be considered financial advice. Always do your own research.
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  noDataText: {
    textAlign: "center",
    paddingVertical: Spacing.lg,
    fontSize: 14,
  },
  recommendationBox: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  recommendationLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  recommendationValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  metricItem: {
    minWidth: "45%",
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  fairValueGrid: {
    gap: Spacing.sm,
  },
  fairValueItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  fairValueLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  fairValueValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  zonesContainer: {
    gap: Spacing.xs,
  },
  zoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  zoneLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  zoneValue: {
    fontSize: 13,
  },
  targetsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  targetItem: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  targetLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  targetValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  rangeContainer: {
    gap: Spacing.xs,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rangeBar: {
    height: 8,
    borderRadius: 4,
    position: "relative",
  },
  rangeIndicator: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    top: -2,
    marginLeft: -6,
  },
  rangeValue: {
    fontSize: 13,
  },
  rangeLabel: {
    fontSize: 11,
  },
  disclaimer: {
    fontSize: 10,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: Spacing.md,
  },
  aiMetaTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  aiTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  analysisMethod: {
    fontSize: 11,
    fontStyle: "italic",
    marginBottom: Spacing.sm,
  },
  aiReasoningContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  aiReasoning: {
    fontSize: 14,
    lineHeight: 22,
  },
  keyPointsContainer: {
    gap: Spacing.sm,
  },
  keyPointsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  keyPointItem: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  keyPointNumber: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
  keyPointText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
