import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { FormInput } from "@/components/FormInput";
import { SelectPicker } from "@/components/SelectPicker";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { holdingsStorage } from "@/lib/storage";
import { apiRequest } from "@/lib/query-client";
import { EGX_STOCKS, STOCK_ROLES, STOCK_STATUSES } from "@/constants/egxStocks";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "AddHolding">;
type RouteProps = RouteProp<RootStackParamList, "AddHolding">;

export default function AddHoldingScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();

  const existingHolding = route.params?.holding;
  const isEditing = !!existingHolding;

  const [selectedStock, setSelectedStock] = useState<string>(
    existingHolding?.symbol || ""
  );
  const [shares, setShares] = useState(existingHolding?.shares?.toString() || "");
  const [averageCost, setAverageCost] = useState(
    existingHolding?.averageCost?.toString() || ""
  );
  const [currentPrice, setCurrentPrice] = useState(
    existingHolding?.currentPrice?.toString() || ""
  );
  const [role, setRole] = useState(existingHolding?.role || "core");
  const [status, setStatus] = useState(existingHolding?.status || "hold");
  const [notes, setNotes] = useState(existingHolding?.notes || "");
  const [saving, setSaving] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);

  const stockOptions = EGX_STOCKS.map((stock) => ({
    id: stock.symbol,
    label: `${stock.symbol} - ${stock.nameEn}`,
    sublabel: stock.nameAr,
  }));

  const roleOptions = STOCK_ROLES.map((r) => ({
    id: r.id,
    label: r.label,
  }));

  const statusOptions = STOCK_STATUSES.map((s) => ({
    id: s.id,
    label: s.label,
  }));

  useEffect(() => {
    if (!selectedStock || isEditing) return;
    
    const fetchCurrentPrice = async () => {
      setFetchingPrice(true);
      try {
        const response = await apiRequest("GET", `/api/prices/${selectedStock}`);
        const data = await response.json();
        
        if (data.price !== null) {
          setCurrentPrice(data.price.toString());
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      } catch (error) {
        console.log("Could not fetch price for", selectedStock);
      } finally {
        setFetchingPrice(false);
      }
    };
    
    fetchCurrentPrice();
  }, [selectedStock, isEditing]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginLeft: 8 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ padding: 8, marginRight: 8 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ThemedText
            style={{
              color: theme.primary,
              fontWeight: "600",
              opacity: saving ? 0.5 : 1,
            }}
          >
            {isEditing ? "Update" : "Save"}
          </ThemedText>
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedStock, shares, averageCost, currentPrice, role, status, notes, saving]);

  const handleSave = async () => {
    if (!selectedStock || !shares || !averageCost || !currentPrice) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    const stock = EGX_STOCKS.find((s) => s.symbol === selectedStock);
    if (!stock) return;

    setSaving(true);

    try {
      if (isEditing && existingHolding) {
        await holdingsStorage.update(existingHolding.id, {
          shares: parseFloat(shares),
          averageCost: parseFloat(averageCost),
          currentPrice: parseFloat(currentPrice),
          role,
          status,
          notes: notes || undefined,
        });
      } else {
        await holdingsStorage.add({
          symbol: stock.symbol,
          nameEn: stock.nameEn,
          nameAr: stock.nameAr,
          sector: stock.sector,
          shares: parseFloat(shares),
          averageCost: parseFloat(averageCost),
          currentPrice: parseFloat(currentPrice),
          role,
          status,
          notes: notes || undefined,
        });
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save holding:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSaving(false);
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
      <SelectPicker
        label="Stock"
        options={stockOptions}
        selectedId={selectedStock}
        onSelect={setSelectedStock}
        placeholder="Select a stock..."
      />

      <FormInput
        label="Number of Shares"
        value={shares}
        onChangeText={setShares}
        keyboardType="numeric"
        placeholder="e.g., 100"
      />

      <FormInput
        label="Average Cost per Share (EGP)"
        value={averageCost}
        onChangeText={setAverageCost}
        keyboardType="decimal-pad"
        placeholder="e.g., 45.50"
      />

      <FormInput
        label={fetchingPrice ? "Current Price (fetching...)" : "Current Price per Share (EGP)"}
        value={currentPrice}
        onChangeText={setCurrentPrice}
        keyboardType="decimal-pad"
        placeholder={fetchingPrice ? "Loading..." : "e.g., 52.25"}
        editable={!fetchingPrice}
      />

      <SelectPicker
        label="Role"
        options={roleOptions}
        selectedId={role}
        onSelect={(id) => setRole(id as typeof role)}
      />

      <SelectPicker
        label="Status"
        options={statusOptions}
        selectedId={status}
        onSelect={(id) => setStatus(id as typeof status)}
      />

      <FormInput
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Add notes about this stock..."
        multiline
      />

      {shares && averageCost && currentPrice ? (
        <View style={[styles.preview, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="small" style={[styles.previewLabel, { color: theme.textSecondary }]}>
            Position Summary
          </ThemedText>
          <View style={styles.previewRow}>
            <ThemedText type="small">Total Cost</ThemedText>
            <ThemedText style={styles.previewValue}>
              {new Intl.NumberFormat("en-EG", {
                style: "currency",
                currency: "EGP",
              }).format(parseFloat(shares) * parseFloat(averageCost))}
            </ThemedText>
          </View>
          <View style={styles.previewRow}>
            <ThemedText type="small">Current Value</ThemedText>
            <ThemedText style={styles.previewValue}>
              {new Intl.NumberFormat("en-EG", {
                style: "currency",
                currency: "EGP",
              }).format(parseFloat(shares) * parseFloat(currentPrice))}
            </ThemedText>
          </View>
          <View style={styles.previewRow}>
            <ThemedText type="small">P/L</ThemedText>
            <ThemedText
              style={[
                styles.previewValue,
                {
                  color:
                    parseFloat(currentPrice) >= parseFloat(averageCost)
                      ? theme.success
                      : theme.error,
                },
              ]}
            >
              {new Intl.NumberFormat("en-EG", {
                style: "currency",
                currency: "EGP",
                signDisplay: "always",
              }).format(
                parseFloat(shares) *
                  (parseFloat(currentPrice) - parseFloat(averageCost))
              )}
            </ThemedText>
          </View>
        </View>
      ) : null}
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
  preview: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  previewLabel: {
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  previewValue: {
    fontWeight: "600",
  },
});
