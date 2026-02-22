import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface ManusTaskStatus {
  taskId: string;
  status: "pending" | "running" | "completed" | "failed";
  taskUrl?: string;
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
  const { width } = useWindowDimensions();
  const [taskStatus, setTaskStatus] = useState<ManusTaskStatus | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ManusAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showFullReport, setShowFullReport] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiRequest("GET", `/api/manus/status/${symbol}`);

      if (!res.ok) {
        if (res.status === 404) {
          if (isMountedRef.current) {
            setTaskStatus(null);
            setAnalysisResult(null);
            setLoading(false);
            stopPolling();
          }
          return;
        }
        throw new Error(`Status check failed: ${res.status}`);
      }

      const statusData = await res.json();
      if (!isMountedRef.current) return;

      if (statusData && statusData.taskId) {
        setTaskStatus(statusData);

        if (statusData.status === "completed") {
          stopPolling();
          setLoading(false);
          try {
            const resultRes = await apiRequest("GET", `/api/manus/result/${symbol}`);
            if (resultRes.ok) {
              const resultData = await resultRes.json();
              if (isMountedRef.current) setAnalysisResult(resultData);
            }
          } catch (e) {
            console.error("Failed to fetch Manus result:", e);
          }
        } else if (statusData.status === "failed") {
          stopPolling();
          setLoading(false);
        }
      } else {
        setTaskStatus(null);
        setAnalysisResult(null);
        setLoading(false);
        stopPolling();
      }
    } catch (error) {
      console.error("Failed to fetch Manus task status:", error);
      if (isMountedRef.current) setLoading(false);
    }
  }, [symbol, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    timerIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) setElapsedTime((prev) => prev + 1);
    }, 1000);
    pollIntervalRef.current = setInterval(() => {
      fetchStatus();
    }, 10000);
  }, [fetchStatus, stopPolling]);

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
        setTaskStatus({ taskId: data.taskId, status: "pending", taskUrl: data.taskUrl });
        startPolling();
        Alert.alert("Deep Analysis Started", `Manus AI is researching ${symbol}. This may take a few minutes.`);
      } else if (data && data.error) {
        Alert.alert("Error", data.error);
        setLoading(false);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to start analysis");
      setLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const checkExisting = async () => {
      try {
        const res = await apiRequest("GET", `/api/manus/status/${symbol}`);
        if (!res.ok) { setInitialCheckDone(true); return; }
        const statusData = await res.json();
        if (!isMountedRef.current) return;

        if (statusData && statusData.taskId) {
          setTaskStatus(statusData);
          if (statusData.status === "completed") {
            try {
              const resultRes = await apiRequest("GET", `/api/manus/result/${symbol}`);
              if (resultRes.ok) {
                const resultData = await resultRes.json();
                if (isMountedRef.current) setAnalysisResult(resultData);
              }
            } catch (e) { /* ignore */ }
          } else if (statusData.status === "pending" || statusData.status === "running") {
            setLoading(true);
            startPolling();
          }
        }
      } catch (error) {
        console.error("Failed to check existing Manus task:", error);
      } finally {
        if (isMountedRef.current) setInitialCheckDone(true);
      }
    };

    checkExisting();
    return () => { isMountedRef.current = false; stopPolling(); };
  }, [symbol]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const openUrl = (url?: string) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  const isRunning = taskStatus && (taskStatus.status === "pending" || taskStatus.status === "running");
  const isCompleted = analysisResult && taskStatus?.status === "completed";
  const isFailed = taskStatus?.status === "failed";

  // Markdown styles matching the app theme
  const mdStyles = StyleSheet.create({
    body: { color: theme.text, fontSize: 14, lineHeight: 22 },
    heading1: { color: theme.text, fontSize: 22, fontWeight: "700", marginTop: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 6 },
    heading2: { color: theme.text, fontSize: 18, fontWeight: "700", marginTop: 14, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 4 },
    heading3: { color: theme.text, fontSize: 16, fontWeight: "600", marginTop: 12, marginBottom: 4 },
    heading4: { color: theme.text, fontSize: 15, fontWeight: "600", marginTop: 10, marginBottom: 4 },
    paragraph: { marginTop: 4, marginBottom: 8 },
    strong: { fontWeight: "700", color: theme.text },
    em: { fontStyle: "italic" },
    bullet_list: { marginLeft: 4 },
    ordered_list: { marginLeft: 4 },
    list_item: { marginBottom: 4 },
    blockquote: { backgroundColor: theme.backgroundSecondary, borderLeftWidth: 3, borderLeftColor: theme.primary, paddingHorizontal: 12, paddingVertical: 8, marginVertical: 8 },
    code_inline: { backgroundColor: theme.backgroundSecondary, color: theme.primary, fontFamily: "monospace", fontSize: 13, paddingHorizontal: 4, borderRadius: 3 },
    code_block: { backgroundColor: theme.backgroundSecondary, padding: 12, borderRadius: 6, fontFamily: "monospace", fontSize: 12 },
    fence: { backgroundColor: theme.backgroundSecondary, padding: 12, borderRadius: 6, fontFamily: "monospace", fontSize: 12 },
    table: { borderWidth: 1, borderColor: theme.border, borderRadius: 4, marginVertical: 8 },
    thead: { backgroundColor: theme.backgroundSecondary },
    th: { padding: 8, borderWidth: 0.5, borderColor: theme.border, fontWeight: "600" },
    td: { padding: 8, borderWidth: 0.5, borderColor: theme.border },
    hr: { backgroundColor: theme.border, height: 1, marginVertical: 12 },
    link: { color: theme.primary, textDecorationLine: "underline" },
  });

  if (!initialCheckDone) {
    return (
      <Card style={styles.card}>
        <ThemedText type="h4" style={styles.title}>Deep Analysis (Manus AI)</ThemedText>
        <ActivityIndicator size="small" color={theme.primary} />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Feather name="cpu" size={20} color={theme.primary} />
          <ThemedText type="h4">Deep Analysis</ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: theme.primary + "20" }]}>
          <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>Manus AI</ThemedText>
        </View>
      </View>

      {/* Start button */}
      {!isRunning && !isCompleted && !isFailed && (
        <View style={{ marginTop: Spacing.md }}>
          <Button onPress={startDeepAnalysis} disabled={loading}>
            {loading ? <ActivityIndicator color={theme.text} /> : "Start Deep Analysis"}
          </Button>
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
            Comprehensive research-grade analysis (takes 2-5 min)
          </ThemedText>
        </View>
      )}

      {/* Initiating */}
      {loading && !isRunning && (
        <View style={[styles.statusBox, { backgroundColor: theme.backgroundSecondary }]}>
          <ActivityIndicator size="small" color={theme.primary} />
          <ThemedText style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
            Initiating Manus task...
          </ThemedText>
        </View>
      )}

      {/* Running */}
      {isRunning && (
        <View style={[styles.statusBox, { backgroundColor: theme.primary + "10" }]}>
          <ActivityIndicator size="small" color={theme.primary} />
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <ThemedText style={{ color: theme.text, fontWeight: "500" }}>
              Researching {symbol}...
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
              Elapsed: {formatTime(elapsedTime)} — Manus AI is browsing the web and analyzing data
            </ThemedText>
          </View>
          {taskStatus?.taskUrl && (
            <TouchableOpacity onPress={() => openUrl(taskStatus.taskUrl)} style={styles.linkButton}>
              <Feather name="external-link" size={16} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Failed */}
      {isFailed && (
        <View style={{ marginTop: Spacing.md }}>
          <View style={[styles.statusBox, { backgroundColor: theme.error + "10" }]}>
            <Feather name="alert-circle" size={18} color={theme.error} />
            <ThemedText style={{ color: theme.error, marginLeft: Spacing.sm, flex: 1 }}>
              Analysis failed. Please try again.
            </ThemedText>
          </View>
          <Button onPress={startDeepAnalysis} style={{ marginTop: Spacing.sm }}>
            Retry Deep Analysis
          </Button>
        </View>
      )}

      {/* Completed */}
      {isCompleted && analysisResult && (
        <View style={{ marginTop: Spacing.md }}>
          {/* Success header */}
          <View style={[styles.statusBox, { backgroundColor: theme.success + "10" }]}>
            <Feather name="check-circle" size={18} color={theme.success} />
            <ThemedText style={{ color: theme.success, fontWeight: "600", marginLeft: Spacing.sm, flex: 1 }}>
              Analysis Complete
            </ThemedText>
            {taskStatus?.taskUrl && (
              <TouchableOpacity onPress={() => openUrl(taskStatus.taskUrl)} style={styles.linkButton}>
                <Feather name="external-link" size={16} color={theme.success} />
                <ThemedText type="small" style={{ color: theme.success, marginLeft: 4 }}>View</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Key metrics row */}
          <View style={[styles.metricsRow, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.metricBox}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Recommendation</ThemedText>
              <ThemedText style={[styles.metricValue, { color: getRecColor(analysisResult.recommendation) }]}>
                {analysisResult.recommendation || "N/A"}
              </ThemedText>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
            <View style={styles.metricBox}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Fair Value</ThemedText>
              <ThemedText style={[styles.metricValue, { color: theme.text }]}>
                {analysisResult.fairValueEstimate ? `${fmtCurrency(analysisResult.fairValueEstimate)} EGP` : "N/A"}
              </ThemedText>
            </View>
          </View>

          {/* Summary */}
          {analysisResult.summary && (
            <View style={[styles.summaryBox, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600", marginBottom: 4 }}>SUMMARY</ThemedText>
              <ThemedText style={{ color: theme.text, lineHeight: 20 }}>{analysisResult.summary}</ThemedText>
            </View>
          )}

          {/* Full report toggle */}
          <Button onPress={() => setShowFullReport(!showFullReport)} style={styles.toggleBtn}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Feather name={showFullReport ? "chevron-up" : "book-open"} size={16} color={theme.text} />
              <ThemedText style={{ color: theme.text, fontWeight: "500" }}>
                {showFullReport ? "Hide Full Report" : "Read Full Report"}
              </ThemedText>
            </View>
          </Button>

          {/* Full markdown report - rendered inline (parent ScrollView handles scrolling) */}
          {showFullReport && analysisResult.detailedReport && (
            <View style={[styles.reportContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Markdown style={mdStyles}>
                {analysisResult.detailedReport}
              </Markdown>
            </View>
          )}

          <Button onPress={startDeepAnalysis} style={{ marginTop: Spacing.md }}>
            Re-run Deep Analysis
          </Button>
        </View>
      )}
    </Card>
  );
}

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const getRecColor = (rec: string) => {
  const l = (rec || "").toLowerCase();
  if (l.includes("strong buy") || l.includes("accumulate")) return "#10B981";
  if (l.includes("buy") || l.includes("overweight")) return "#22C55E";
  if (l.includes("hold") || l.includes("neutral")) return "#F59E0B";
  if (l.includes("strong sell")) return "#EF4444";
  if (l.includes("sell") || l.includes("underweight")) return "#F97316";
  return "#9CA3AF";
};

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  metricsRow: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    overflow: "hidden",
  },
  metricBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  metricDivider: {
    width: 1,
    marginVertical: 8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  summaryBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  toggleBtn: {
    marginTop: Spacing.md,
  },
  reportContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
});
