import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface ExtractedDividend {
  symbol: string;
  amount: number;
  exDate: string | null;
  paymentDate: string | null;
  status: "announced" | "paid";
}

interface DividendImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (dividend: ExtractedDividend) => void;
}

export function DividendImportModal({
  visible,
  onClose,
  onImport,
}: DividendImportModalProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedDividend | null>(null);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to your photos to import dividends.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        await analyzeImage(result.assets[0].base64);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const analyzeImage = async (base64: string) => {
    setLoading(true);
    try {
      const response = await apiRequest(
        "POST",
        "/api/extract-dividend",
        { image: `data:image/png;base64,${base64}` }
      );
      const { dividend } = await response.json();
      if (dividend) {
        setExtracted(dividend);
      } else {
        Alert.alert("Not Found", "Could not extract dividend information from the image.");
      }
    } catch (error: any) {
      console.error("Dividend extraction error:", error);
      Alert.alert("Error", `Failed to extract dividend.\n\n${error?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!extracted) return;
    onImport(extracted);
    handleClose();
  };

  const handleClose = () => {
    setExtracted(null);
    onClose();
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.row}>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>{label}</ThemedText>
      <ThemedText style={Typography.mono}>{value}</ThemedText>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.background + "F0" }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.header}>
            <ThemedText type="h3" style={styles.title}>Import Dividend</ThemedText>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Upload a screenshot of your dividend statement
          </ThemedText>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
                Analyzing screenshot...
              </ThemedText>
            </View>
          ) : extracted ? (
            <>
              <Card style={styles.resultCard}>
                <Row label="Symbol" value={extracted.symbol ?? "—"} />
                <Row label="Amount" value={`EGP ${extracted.amount?.toFixed(2) ?? "—"}`} />
                <Row label="Ex-Date" value={extracted.exDate ?? "—"} />
                <Row label="Payment Date" value={extracted.paymentDate ?? "—"} />
                <Row
                  label="Status"
                  value={extracted.status === "paid" ? "Paid" : "Announced"}
                />
              </Card>

              <View style={styles.footer}>
                <Button onPress={pickImage} style={styles.footerButton}>
                  Choose Different Image
                </Button>
                <Button onPress={handleImport} style={styles.footerButton}>
                  Confirm Import
                </Button>
              </View>
            </>
          ) : (
            <View style={styles.centered}>
              <Feather name="image" size={64} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No screenshot uploaded yet
              </ThemedText>
              <Button onPress={pickImage} style={styles.uploadButton}>
                Choose Screenshot
              </Button>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    maxHeight: "90%",
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  emptyText: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    fontSize: 14,
  },
  uploadButton: {
    marginTop: Spacing.md,
  },
  resultCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  footerButton: {
    flex: 1,
  },
});
