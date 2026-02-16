import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Linking, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface ManusTaskStatus {
  taskId: string;
  status: "pending" | "running" | "completed" | "failed";
  taskUrl?: string;
  createdAt: number;
  updatedAt?: number;
}

interface ManusAnalysisResult {
  status: "completed" | "failed";
  taskId: string;
  summary: string;
  detailedReport: string;
  recommendation: string;
  fairValueEstimate: number | null;
}

interface ManusDeepAnalysisProps {
  symbol: string;
}

export function ManusDeepAnalysis({ symbol }: ManusDeepAnalysisProps) {
  const { theme } = useTheme();
  const [taskStatus, setTaskStatus] = useState<ManusTaskStatus | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ManusAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showFullReport, setShowFullReport] = useState(false);

  const fetchTaskStatus = useCallback(async () => {
    try {
      const res = await apiRequest("GET", `/api/manus/status/${symbol}`);
      const statusData = await res.json();

      if (statusData && statusData.taskId) {
        setTaskStatus(statusData);
        if (statusData.status === "completed") {
          const resultRes = await apiRequest("GET", `/api/manus/result/${symbol}`);
          const resultData = await resultRes.json();
          setAnalysisResult(resultData);
          stopPolling();
          setLoading(false);
        } else if (statusData.status === "failed") {
          stopPolling();
          setLoading(false);
          Alert.alert("Deep Analysis Failed", `Manus task ${statusData.taskId} failed.`);
        } else if (statusData.status === "running" || statusData.status === "pending") {
          if (!pollingInterval) {
            // Start polling if not already running
            const interval = setInterval(() => {
              setElapsedTime((prev) => prev + 1);
            }, 1000);
            setPollingInterval(interval);
          }
        }
      } else {
        setTaskStatus(null);
        setAnalysisResult(null);
        stopPolling();
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch Manus task status/result:", error);
      setTaskStatus(null);
      setAnalysisResult(null);
      stopPolling();
      setLoading(false);
    }
  }, [symbol, pollingInterval]);

  const startDeepAnalysis = async () => {
    setLoading(true);
    setTaskStatus(null);
    setAnalysisResult(null);
    setElapsedTime(0);
    stopPolling();

    try {
      const res = await apiRequest("POST", `/api/manus/analyze/${symbol}`);
      const data = await res.json();
      if (data && data.taskId) {
        setTaskStatus({ taskId: data.taskId, status: data.status, taskUrl: data.taskUrl, createdAt: Date.now() });
        const interval = setInterval(() => {
          setElapsedTime((prev) => prev + 1);
          fetchTaskStatus(); // Poll for updates
        }, 10000); // Poll every 10 seconds
        setPollingInterval(interval);
        Alert.alert("Deep Analysis Started", `Manus AI is performing a deep analysis for ${symbol}. This may take a few minutes.`);
      } else if (data && data.error) {
        Alert.alert("Error", `Failed to start Manus analysis: ${data.error}`);
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Failed to start Manus analysis:", error);
      Alert.alert("Error", `Failed to start Manus analysis: ${error.message || "Unknown error"}`);
      setLoading(false);
    }
  };

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  useEffect(() => {
    fetchTaskStatus(); // Initial fetch
    return () => stopPolling(); // Cleanup on unmount
  }, [fetchTaskStatus, stopPolling]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const openTaskInBrowser = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
    }
  };

  const isAnalysisRunning = taskStatus && (taskStatus.status === "pending" || taskStatus.status === "running");
  const isAnalysisCompleted = analysisResult && taskStatus?.status === "completed";
  const isAnalysisFailed = taskStatus?.status === "failed";

  return (
    <Card style={styles.card}>
      <ThemedText type="h4" style={styles.title}>Deep Analysis (by Manus AI)</ThemedText>

      {!isAnalysisRunning && !isAnalysisCompleted && !isAnalysisFailed && (
        <Button onPress={startDeepAnalysis} disabled={loading}>
          {loading ? <ActivityIndicator color={theme.text} /> : "Start Deep Analysis"}
        </Button>
      )}

      {loading && !isAnalysisRunning && (
         <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
          <ThemedText style={[styles.statusText, { color: theme.textSecondary }]}>
            Initiating Manus task...
          </ThemedText>
        </View>
      )}

      {isAnalysisRunning && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
          <ThemedText style={[styles.statusText, { color: theme.textSecondary }]}>
            Manus AI researching {symbol}... (Elapsed: {formatTime(elapsedTime)})
          </ThemedText>
          {taskStatus?.taskUrl && (
            <TouchableOpacity onPress={() => openTaskInBrowser(taskStatus.taskUrl)} style={styles.viewTaskButton}>
              <Feather name="external-link" size={16} color={theme.primary} />
              <ThemedText style={[styles.viewTaskText, { color: theme.primary }]}>View Task</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isAnalysisFailed && (
        <View style={[styles.errorContainer, { backgroundColor: theme.error + "10" }]}>
          <Feather name="alert-circle" size={16} color={theme.error} />
          <ThemedText style={[styles.errorText, { color: theme.error }]}>
            Manus Deep Analysis Failed. Check logs.
          </ThemedText>
          {taskStatus?.taskUrl && (
            <TouchableOpacity onPress={() => openTaskInBrowser(taskStatus.taskUrl)} style={styles.viewTaskButton}>
              <Feather name="external-link" size={16} color={theme.error} />
              <ThemedText style={[styles.viewTaskText, { color: theme.error }]}>View Task</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isAnalysisCompleted && analysisResult && (
        <View>
          <View style={[styles.completionHeader, { backgroundColor: theme.success + "10" }]}>
            <Feather name="check-circle" size={18} color={theme.success} />
            <ThemedText style={[styles.completionText, { color: theme.success, flex: 1 }]}>
              Analysis Complete in {formatTime(elapsedTime)}!
            </ThemedText>
            {taskStatus?.taskUrl && (
              <TouchableOpacity onPress={() => openTaskInBrowser(taskStatus.taskUrl)} style={styles.viewTaskButton}>
                <Feather name="external-link" size={16} color={theme.success} />
                <ThemedText style={[styles.viewTaskText, { color: theme.success }]}>View Task</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.analysisSummary, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="h5">Summary</ThemedText>
            <ThemedText>{analysisResult.summary}</ThemedText>
          </View>

          <View style={styles.summaryMetrics}>
            <View style={styles.metricItem}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Recommendation</ThemedText>
              <ThemedText style={[styles.metricValue, { color: getRecommendationColor(analysisResult.recommendation) }]}>
                {analysisResult.recommendation}
              </ThemedText>
            </View>
            <View style={styles.metricItem}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Fair Value Estimate</ThemedText>
              <ThemedText style={styles.metricValue}>
                {analysisResult.fairValueEstimate ? `${formatCurrency(analysisResult.fairValueEstimate)} EGP` : "N/A"}
              </ThemedText>
            </View>
          </View>

          <Button onPress={() => setShowFullReport(!showFullReport)} style={styles.toggleReportButton}>
            {showFullReport ? "Hide Full Report" : "View Full Report"}
          </Button>

          {showFullReport && analysisResult.detailedReport && (
            <ScrollView style={[styles.fullReportContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.fullReportText}>{analysisResult.detailedReport}</ThemedText>
            </ScrollView>
          )}
        </View>
      )}
    </Card>
  );
}

const getRecommendationColor = (rec: string) => {
  switch (rec) {
    case "Strong Buy": return "#10B981";
    case "Buy": return "#22C55E";
    case "Hold": return "#F59E0B";
    case "Sell": return "#F97316";
    case "Strong Sell": return "#EF4444";
    default: return "#9CA3AF";
  }
};

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
  title: { marginBottom: Spacing.lg },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  statusText: { fontSize: 14 },
  viewTaskButton: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginLeft: Spacing.md },
  viewTaskText: { fontSize: 13, fontWeight: "600" },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  errorText: { flex: 1, fontSize: 13 },
  completionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  completionText: { fontSize: 14, fontWeight: "600" },
  analysisSummary: { padding: Spacing.md, borderRadius: BorderRadius.sm, marginBottom: Spacing.md },
  summaryMetrics: { flexDirection: "row", justifyContent: "space-around", marginBottom: Spacing.md },
  metricItem: { alignItems: "center", flex: 1 },
  metricValue: { fontSize: 16, fontWeight: "600", marginTop: Spacing.xs },
  toggleReportButton: { marginBottom: Spacing.md },
  fullReportContainer: { padding: Spacing.md, borderRadius: BorderRadius.sm, maxHeight: 400 },
  fullReportText: { fontSize: 13, lineHeight: 20 },
});
