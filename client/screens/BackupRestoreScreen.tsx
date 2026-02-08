import React, { useState } from "react";
import { View, StyleSheet, Platform, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { FormInput } from "@/components/FormInput";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { backupStorage } from "@/lib/storage";

export default function BackupRestoreScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importData, setImportData] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);

    try {
      const data = await backupStorage.export();
      
      if (Platform.OS === "web") {
        await Clipboard.setStringAsync(data);
        setMessage({ type: "success", text: "Backup data copied to clipboard!" });
      } else {
        await Share.share({
          message: data,
          title: "EGX Portfolio Backup",
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessage({ type: "success", text: "Backup exported successfully!" });
      }
    } catch (error) {
      console.error("Export failed:", error);
      setMessage({ type: "error", text: "Failed to export backup" });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      setMessage({ type: "error", text: "Please paste backup data first" });
      return;
    }

    setImporting(true);
    setMessage(null);

    try {
      await backupStorage.import(importData);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setMessage({ type: "success", text: "Data restored successfully!" });
      setImportData("");
    } catch (error) {
      console.error("Import failed:", error);
      setMessage({ type: "error", text: "Invalid backup format" });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setImporting(false);
    }
  };

  const handleClearAll = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    try {
      await backupStorage.clearAll();
      setMessage({ type: "success", text: "All data cleared" });
    } catch (error) {
      console.error("Clear failed:", error);
      setMessage({ type: "error", text: "Failed to clear data" });
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      setImportData(text);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("Paste failed:", error);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      {message ? (
        <View
          style={[
            styles.messageContainer,
            {
              backgroundColor:
                message.type === "success"
                  ? theme.success + "15"
                  : theme.error + "15",
            },
          ]}
        >
          <Feather
            name={message.type === "success" ? "check-circle" : "alert-circle"}
            size={20}
            color={message.type === "success" ? theme.success : theme.error}
          />
          <ThemedText
            style={[
              styles.messageText,
              { color: message.type === "success" ? theme.success : theme.error },
            ]}
          >
            {message.text}
          </ThemedText>
        </View>
      ) : null}

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.success + "15" }]}>
            <Feather name="upload-cloud" size={24} color={theme.success} />
          </View>
          <View style={styles.sectionInfo}>
            <ThemedText type="h4">Export Backup</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Save all your data as a backup file
            </ThemedText>
          </View>
        </View>
        <Button onPress={handleExport} disabled={exporting}>
          {exporting ? "Exporting..." : "Export Data"}
        </Button>
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "15" }]}>
            <Feather name="download-cloud" size={24} color={theme.primary} />
          </View>
          <View style={styles.sectionInfo}>
            <ThemedText type="h4">Restore Backup</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Paste your backup data to restore
            </ThemedText>
          </View>
        </View>
        <FormInput
          label="Backup Data (JSON)"
          value={importData}
          onChangeText={setImportData}
          placeholder='Paste your backup JSON here...'
          multiline
          numberOfLines={6}
          containerStyle={{ marginBottom: Spacing.md }}
        />
        <View style={styles.buttonRow}>
          <Button
            onPress={handlePasteFromClipboard}
            style={[styles.secondaryButton, { backgroundColor: theme.backgroundSecondary }]}
          >
            <ThemedText>Paste</ThemedText>
          </Button>
          <Button
            onPress={handleImport}
            disabled={importing || !importData.trim()}
            style={styles.primaryButton}
          >
            {importing ? "Restoring..." : "Restore"}
          </Button>
        </View>
      </Card>

      <Card style={[styles.section, { backgroundColor: theme.error + "08" }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.error + "15" }]}>
            <Feather name="trash-2" size={24} color={theme.error} />
          </View>
          <View style={styles.sectionInfo}>
            <ThemedText type="h4">Clear All Data</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Permanently delete all portfolio data
            </ThemedText>
          </View>
        </View>
        <Button
          onPress={handleClearAll}
          style={{ backgroundColor: theme.error }}
        >
          Clear All Data
        </Button>
      </Card>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  messageText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontWeight: "500",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  sectionInfo: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  secondaryButton: {
    flex: 1,
  },
  primaryButton: {
    flex: 2,
  },
});
