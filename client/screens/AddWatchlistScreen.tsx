import React, { useState, useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { FormInput } from "@/components/FormInput";
import { SelectPicker } from "@/components/SelectPicker";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { watchlistStorage } from "@/lib/storage";
import { EGX_STOCKS } from "@/constants/egxStocks";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "AddWatchlist">;

export default function AddWatchlistScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [selectedStock, setSelectedStock] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const stockOptions = EGX_STOCKS.map((stock) => ({
    id: stock.symbol,
    label: `${stock.symbol} - ${stock.nameEn}`,
    sublabel: stock.nameAr,
  }));

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderButton onPress={() => navigation.goBack()}>
          <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
        </HeaderButton>
      ),
      headerRight: () => (
        <HeaderButton onPress={handleSave} disabled={saving}>
          <ThemedText
            style={{
              color: theme.primary,
              fontWeight: "600",
              opacity: saving ? 0.5 : 1,
            }}
          >
            Save
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, selectedStock, targetPrice, notes, saving]);

  const handleSave = async () => {
    if (!selectedStock) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    const stock = EGX_STOCKS.find((s) => s.symbol === selectedStock);
    if (!stock) return;

    setSaving(true);

    try {
      await watchlistStorage.add({
        symbol: stock.symbol,
        nameEn: stock.nameEn,
        nameAr: stock.nameAr,
        sector: stock.sector,
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        notes: notes || undefined,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save watchlist item:", error);
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
        label="Target Price (Optional)"
        value={targetPrice}
        onChangeText={setTargetPrice}
        keyboardType="decimal-pad"
        placeholder="e.g., 55.00"
      />

      <FormInput
        label="Notes (Optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Why are you watching this stock?"
        multiline
        numberOfLines={4}
      />
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
});
