import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

export interface SentimentResult {
  score: "Bullish" | "Bearish" | "Neutral";
  bullishScore: number;
  bearishScore: number;
  neutralScore: number;
  headlines: { title: string; sentiment: string; score: number; source: string }[];
  status?: string;
}

interface SentimentGaugeProps {
  symbol: string;
}

export function SentimentGauge({ symbol }: SentimentGaugeProps) {
  const { theme } = useTheme();
  
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSentiment() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiRequest("GET", `/api/stocks/${symbol}/sentiment`);
        const data = await res.json();
        setSentiment(data);
      } catch (err) {
        setError("Failed to load sentiment");
      } finally {
        setLoading(false);
      }
    }
    
    if (symbol) {
      fetchSentiment();
    }
  }, [symbol]);

  if (loading) {
    return (
      <Card style={styles.card}>
        <ThemedText style={styles.title}>Market Sentiment (FinBERT)</ThemedText>
        <ThemedText style={{ color: theme.textSecondary }}>Analyzing recent news...</ThemedText>
      </Card>
    );
  }

  if (error || !sentiment || sentiment.status === "No News Available") {
    return (
      <Card style={styles.card}>
        <ThemedText style={styles.title}>Market Sentiment (FinBERT)</ThemedText>
        <ThemedText style={{ color: theme.textSecondary }}>
          {error || "Sentiment Data Unavailable (No recent news)"}
        </ThemedText>
      </Card>
    );
  }

  const getScoreColor = (score: string) => {
    switch (score) {
      case "Bullish": return theme.success;
      case "Bearish": return theme.error;
      default: return theme.warning;
    }
  };

  const mainColor = getScoreColor(sentiment.score);
  
  // Calculate a 0-100 position for the gauge marker
  // Bullish = 100, Neutral = 50, Bearish = 0
  let markerPosition = 50;
  if (sentiment.score === "Bullish") markerPosition = 50 + (sentiment.bullishScore * 50);
  else if (sentiment.score === "Bearish") markerPosition = 50 - (sentiment.bearishScore * 50);

  return (
    <Card style={styles.card}>
      <ThemedText style={styles.title}>Market Sentiment (FinBERT)</ThemedText>
      
      <View style={styles.gaugeContainer}>
        <View style={styles.gaugeBar}>
          <View style={[styles.gaugeSegment, { backgroundColor: theme.error }]} />
          <View style={[styles.gaugeSegment, { backgroundColor: theme.warning }]} />
          <View style={[styles.gaugeSegment, { backgroundColor: theme.success }]} />
        </View>
        <View style={[styles.marker, { left: `${Math.max(5, Math.min(95, markerPosition))}%` }]}>
          <View style={[styles.markerTriangle, { borderTopColor: mainColor }]} />
        </View>
        <View style={styles.labelsRow}>
          <ThemedText style={[styles.label, { color: theme.error }]}>Bearish</ThemedText>
          <ThemedText style={[styles.label, { color: theme.warning }]}>Neutral</ThemedText>
          <ThemedText style={[styles.label, { color: theme.success }]}>Bullish</ThemedText>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <ThemedText style={[styles.mainScore, { color: mainColor }]}>
          {sentiment.score}
        </ThemedText>
        <ThemedText style={styles.subScores}>
          ({(sentiment.bullishScore * 100).toFixed(0)}% Bull | {(sentiment.bearishScore * 100).toFixed(0)}% Bear)
        </ThemedText>
      </View>

      <View style={styles.headlinesContainer}>
        <ThemedText style={styles.headlinesTitle}>Key Drivers (Macro + Micro)</ThemedText>
        {sentiment.headlines.map((headline, index) => (
          <View key={index} style={styles.headlineItem}>
            <View style={[styles.headlineDot, { backgroundColor: getScoreColor(headline.sentiment) }]} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.headlineText} numberOfLines={0}>
                {headline.title}
              </ThemedText>
              <ThemedText style={styles.headlineSource}>
                {headline.source} • {(headline.score * 100).toFixed(0)}% {headline.sentiment}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  gaugeContainer: {
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  gaugeBar: {
    height: 12,
    flexDirection: "row",
    borderRadius: 6,
    overflow: "hidden",
  },
  gaugeSegment: {
    flex: 1,
    height: "100%",
  },
  marker: {
    position: "absolute",
    top: -8,
    marginLeft: -8,
    alignItems: "center",
  },
  markerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  mainScore: {
    fontSize: 24,
    fontWeight: "700",
    marginRight: Spacing.sm,
  },
  subScores: {
    fontSize: 14,
    color: "#888",
  },
  headlinesContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: Spacing.md,
  },
  headlinesTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    color: "#666",
  },
  headlineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  headlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  headlineText: {
    fontSize: 13,
    lineHeight: 18,
  },
  headlineSource: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
});
