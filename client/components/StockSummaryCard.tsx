import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface StockSummary {
  symbol: string;
  companyName: string;
  recommendation: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";
  confidence: "High" | "Medium" | "Low";
  currentPrice: number | null;
  fairValueEstimate: number | null;
  valuationStatus: "Undervalued" | "Fair" | "Overvalued";
  discountPercent: number | null;
  riskLevel: "Low" | "Medium" | "High";
  headline: string;
  currentZone: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell" | null;
  zoneRange: { min: number; max: number } | null;
  inEntryZone: boolean;
  analysisAge: number;
  priceSource: string;
  ragUsed: boolean;
  sentimentUsed: boolean;
  fullAnalysisAvailable: boolean;
}

interface StockSummaryCardProps {
  symbol: string;
  onRefresh?: () => void;
}

const STALE_THRESHOLD_MINUTES = 24 * 60;

function getRecommendationColor(rec: string, theme: { success: string; error: string; warning: string; textSecondary: string }): string {
  switch (rec) {
    case "Strong Buy": return theme.success;
    case "Buy": return "#22C55E";
    case "Hold": return theme.warning;
    case "Sell": return "#F97316";
    case "Strong Sell": return theme.error;
    default: return theme.textSecondary;
  }
}

function getConfidenceColor(c: string, theme: { success: string; warning: string; error: string; textSecondary: string }): string {
  switch (c) {
    case "High": return theme.success;
    case "Medium": return theme.warning;
    case "Low": return theme.error;
    default: return theme.textSecondary;
  }
}

export function StockSummaryCard({ symbol, onRefresh }: StockSummaryCardProps) {
  const { theme } = useTheme();
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSummary = useCallback(async (refresh = false) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setError(null);
      const url = refresh ? `/api/stock/${symbol}/summary?refresh=true` : `/api/stock/${symbol}/summary`;
      const res = await apiRequest("GET", url, undefined, { signal: controller.signal });
      const data = await res.json();
      setSummary(data);
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setError((err as Error)?.message || "Failed to load summary");
      setSummary(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
      abortControllerRef.current = null;
    }
  }, [symbol]);

  useEffect(() => {
    setLoading(true);
    fetchSummary(false);
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchSummary]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSummary(true);
    onRefresh?.();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  if (loading && !summary) {
    return (
      <Card style={styles.card}>
        <View style={styles.skeletonRow}>
          <View style={[styles.skeletonBadge, { backgroundColor: theme.backgroundSecondary }]} />
          <View style={[styles.skeletonBar, { backgroundColor: theme.backgroundSecondary }]} />
        </View>
        <View style={[styles.skeletonLine, { backgroundColor: theme.backgroundSecondary, marginTop: Spacing.lg }]} />
        <View style={[styles.skeletonLine, { backgroundColor: theme.backgroundSecondary, marginTop: Spacing.sm, width: "80%" }]} />
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      </Card>
    );
  }

  if (error && !summary) {
    return (
      <Card style={styles.card}>
        <ThemedText type="h4" style={styles.title}>Summary</ThemedText>
        <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText>
        <TouchableOpacity
          onPress={() => { setLoading(true); fetchSummary(true); }}
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
        >
          <Feather name="refresh-cw" size={16} color="#fff" />
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </Card>
    );
  }

  if (!summary) return null;

  const isStale = summary.analysisAge > STALE_THRESHOLD_MINUTES;
  const recColor = getRecommendationColor(summary.recommendation, theme);
  const confColor = getConfidenceColor(summary.confidence, theme);
  const riskColor = getConfidenceColor(summary.riskLevel, theme);

  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <ThemedText type="h4" style={styles.title}>Summary</ThemedText>
        {isStale && (
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Feather name="refresh-cw" size={18} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Recommendation Badge */}
      <View style={[styles.recommendationBadge, { backgroundColor: recColor + "20" }]}>
        <ThemedText style={[styles.recommendationText, { color: recColor }]}>
          {summary.recommendation}
        </ThemedText>
      </View>

      {/* Valuation Bar */}
      {summary.fairValueEstimate != null && summary.currentPrice != null ? (
        <View style={styles.valuationSection}>
          <View style={styles.valuationRow}>
            <ThemedText style={[styles.valuationLabel, { color: theme.textSecondary }]}>Current</ThemedText>
            <ThemedText type="subtitle">EGP {formatCurrency(summary.currentPrice)}</ThemedText>
          </View>
          <View style={[styles.valuationBar, { backgroundColor: theme.backgroundSecondary }]}>
            <View
              style={[
                styles.valuationFill,
                {
                  backgroundColor: theme.primary,
                  width: `${Math.min(100, Math.max(0, (summary.currentPrice / summary.fairValueEstimate) * 100))}%`,
                },
              ]}
            />
          </View>
          <View style={styles.valuationRow}>
            <ThemedText style={[styles.valuationLabel, { color: theme.textSecondary }]}>Fair value</ThemedText>
            <ThemedText type="small">EGP {formatCurrency(summary.fairValueEstimate)}</ThemedText>
          </View>
          {summary.discountPercent != null && (
            <ThemedText style={[styles.discountText, { color: summary.discountPercent > 0 ? theme.success : theme.error }]}>
              {summary.discountPercent > 0 ? `${summary.discountPercent.toFixed(1)}% below` : `${Math.abs(summary.discountPercent).toFixed(1)}% above`} fair value
            </ThemedText>
          )}
        </View>
      ) : (
        <ThemedText style={[styles.unavailableText, { color: theme.textSecondary }]}>
          Fair value unavailable
        </ThemedText>
      )}

      {/* Confidence + Risk Pills */}
      <View style={styles.pillRow}>
        <View style={[styles.pill, { backgroundColor: confColor + "20" }]}>
          <ThemedText style={[styles.pillText, { color: confColor }]}>
            {summary.confidence} confidence
          </ThemedText>
        </View>
        <View style={[styles.pill, { backgroundColor: riskColor + "20" }]}>
          <ThemedText style={[styles.pillText, { color: riskColor }]}>
            {summary.riskLevel} risk
          </ThemedText>
        </View>
      </View>

      {/* Headline */}
      <ThemedText style={[styles.headline, { color: theme.text }]}>
        {summary.headline}
      </ThemedText>

      {/* Entry Zone Indicator */}
      {summary.currentZone && (
        <View style={styles.entryZoneRow}>
          {summary.inEntryZone ? (
            <>
              <Feather name="check-circle" size={18} color={theme.success} />
              <ThemedText style={[styles.entryZoneText, { color: theme.success }]}>
                In entry zone ({summary.currentZone})
              </ThemedText>
            </>
          ) : (
            <>
              <Feather name="trending-up" size={18} color={theme.textSecondary} />
              <ThemedText style={[styles.entryZoneText, { color: theme.textSecondary }]}>
                {summary.currentZone} zone
              </ThemedText>
            </>
          )}
        </View>
      )}

      {/* Stale warning */}
      {isStale && (
        <View style={[styles.staleWarning, { backgroundColor: theme.warning + "20" }]}>
          <Feather name="clock" size={14} color={theme.warning} />
          <ThemedText style={[styles.staleText, { color: theme.warning }]}>
            Last updated {Math.round(summary.analysisAge / 60)} hours ago. Refresh recommended.
          </ThemedText>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  refreshButton: {
    padding: Spacing.xs,
  },
  recommendationBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  recommendationText: {
    fontSize: 18,
    fontWeight: "700",
  },
  valuationSection: {
    marginBottom: Spacing.lg,
  },
  valuationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  valuationLabel: {
    fontSize: 12,
  },
  valuationBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: Spacing.sm,
  },
  valuationFill: {
    height: "100%",
    borderRadius: 3,
  },
  discountText: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  unavailableText: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: Spacing.lg,
  },
  pillRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  headline: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  entryZoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  entryZoneText: {
    fontSize: 14,
    fontWeight: "500",
  },
  staleWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  staleText: {
    fontSize: 12,
    flex: 1,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  skeletonBadge: {
    width: 100,
    height: 32,
    borderRadius: BorderRadius.md,
  },
  skeletonBar: {
    flex: 1,
    height: 24,
    borderRadius: BorderRadius.sm,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 4,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginBottom: Spacing.md,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
