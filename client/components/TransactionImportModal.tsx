import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormInput } from "@/components/FormInput";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface ExtractedTransaction {
  type: "buy" | "sell";
  shares: number;
  price: number;
  date: string;
  time: string;
  status: "Fulfilled" | "Cancelled";
  selected?: boolean;
}

interface TransactionImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (transactions: ExtractedTransaction[]) => void;
  stockSymbol: string;
}

export function TransactionImportModal({
  visible,
  onClose,
  onImport,
  stockSymbol,
}: TransactionImportModalProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<ExtractedTransaction[]>([]);
  const [editing, setEditing] = useState<number | null>(null);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to your photos to import transactions.");
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
      const response = await apiRequest("/extract-transactions", {
        method: "POST",
        body: JSON.stringify({ image: `data:image/png;base64,${base64}` }),
      });

      const { transactions: extractedTx } = response;
      
      if (extractedTx && extractedTx.length > 0) {
        // Auto-select all fulfilled transactions
        const withSelection = extractedTx.map((tx: ExtractedTransaction) => ({
          ...tx,
          selected: tx.status === "Fulfilled",
        }));
        setTransactions(withSelection);
      } else {
        Alert.alert("No Transactions Found", "Could not extract any fulfilled transactions from the image.");
      }
    } catch (error) {
      console.error("Transaction extraction error:", error);
      Alert.alert("Error", "Failed to extract transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTransaction = (index: number) => {
    setTransactions((prev) =>
      prev.map((tx, i) => (i === index ? { ...tx, selected: !tx.selected } : tx))
    );
  };

  const updateTransaction = (index: number, field: keyof ExtractedTransaction, value: any) => {
    setTransactions((prev) =>
      prev.map((tx, i) => (i === index ? { ...tx, [field]: value } : tx))
    );
  };

  const handleImport = () => {
    const selectedTx = transactions.filter((tx) => tx.selected);
    if (selectedTx.length === 0) {
      Alert.alert("No Transactions Selected", "Please select at least one transaction to import.");
      return;
    }
    onImport(selectedTx);
    handleClose();
  };

  const handleClose = () => {
    setTransactions([]);
    setEditing(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.background + "F0" }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="h3" style={styles.title}>
              Import Transactions
            </ThemedText>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {stockSymbol} - Upload screenshot of your orders
          </ThemedText>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
                Analyzing screenshot...
              </ThemedText>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="image" size={64} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No screenshot uploaded yet
              </ThemedText>
              <Button title="Choose Screenshot" onPress={pickImage} style={styles.uploadButton} />
            </View>
          ) : (
            <>
              <ScrollView style={styles.transactionsList}>
                {transactions.map((tx, index) => (
                  <Card key={index} style={styles.transactionCard}>
                    <View style={styles.transactionHeader}>
                      <TouchableOpacity
                        onPress={() => toggleTransaction(index)}
                        style={styles.checkbox}
                      >
                        <Feather
                          name={tx.selected ? "check-square" : "square"}
                          size={24}
                          color={tx.selected ? theme.primary : theme.textSecondary}
                        />
                      </TouchableOpacity>
                      <View style={styles.transactionInfo}>
                        <ThemedText style={[
                          styles.transactionType,
                          { color: tx.type === "buy" ? "#10B981" : "#EF4444" }
                        ]}>
                          {tx.type.toUpperCase()}
                        </ThemedText>
                        <ThemedText style={[styles.transactionDate, { color: theme.textSecondary }]}>
                          {tx.date} {tx.time}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        onPress={() => setEditing(editing === index ? null : index)}
                        style={styles.editButton}
                      >
                        <Feather
                          name={editing === index ? "check" : "edit-2"}
                          size={20}
                          color={theme.primary}
                        />
                      </TouchableOpacity>
                    </View>

                    {editing === index ? (
                      <View style={styles.editForm}>
                        <FormInput
                          label="Shares"
                          value={tx.shares.toString()}
                          onChangeText={(val) =>
                            updateTransaction(index, "shares", parseFloat(val) || 0)
                          }
                          keyboardType="numeric"
                        />
                        <FormInput
                          label="Price (EGP)"
                          value={tx.price.toString()}
                          onChangeText={(val) =>
                            updateTransaction(index, "price", parseFloat(val) || 0)
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    ) : (
                      <View style={styles.transactionDetails}>
                        <ThemedText>
                          <ThemedText style={Typography.mono}>{tx.shares}</ThemedText> shares @{" "}
                          <ThemedText style={Typography.mono}>
                            EGP {tx.price.toFixed(2)}
                          </ThemedText>
                        </ThemedText>
                        <ThemedText style={[styles.total, { color: theme.textSecondary }]}>
                          Total: EGP {(tx.shares * tx.price).toFixed(2)}
                        </ThemedText>
                      </View>
                    )}
                  </Card>
                ))}
              </ScrollView>

              <View style={styles.footer}>
                <Button
                  title="Choose Different Image"
                  onPress={pickImage}
                  variant="secondary"
                  style={styles.footerButton}
                />
                <Button
                  title={`Import ${transactions.filter((tx) => tx.selected).length} Transactions`}
                  onPress={handleImport}
                  style={styles.footerButton}
                />
              </View>
            </>
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    fontSize: 14,
  },
  uploadButton: {
    marginTop: Spacing.md,
  },
  transactionsList: {
    maxHeight: 400,
  },
  transactionCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  checkbox: {
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  editButton: {
    padding: Spacing.xs,
  },
  transactionDetails: {
    paddingLeft: 48,
  },
  total: {
    fontSize: 12,
    marginTop: 4,
  },
  editForm: {
    paddingLeft: 48,
    gap: Spacing.sm,
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
