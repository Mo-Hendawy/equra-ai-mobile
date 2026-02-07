import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { FormInput } from "@/components/FormInput";
import { SelectPicker } from "@/components/SelectPicker";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { dividendsStorage, holdingsStorage } from "@/lib/storage";
import type { PortfolioHolding } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "AddDividend">;

const STATUS_OPTIONS = [
  { id: "announced", label: "Announced" },
  { id: "paid", label: "Paid" },
];

export default function AddDividendScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [selectedHolding, setSelectedHolding] = useState("");
  const [amount, setAmount] = useState("");
  const [exDate, setExDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [status, setStatus] = useState<string>("announced");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadHoldings = async () => {
        const data = await holdingsStorage.getAll();
        setHoldings(data);
      };
      loadHoldings();
    }, [])
  );

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
  }, [navigation, selectedHolding, amount, exDate, paymentDate, status, saving]);

  const handleSave = async () => {
    if (!selectedHolding || !amount || !exDate || !paymentDate) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    const holding = holdings.find((h) => h.id === selectedHolding);
    if (!holding) return;

    setSaving(true);

    try {
      await dividendsStorage.add({
        holdingId: holding.id,
        symbol: holding.symbol,
        amount: parseFloat(amount),
        exDate,
        paymentDate,
        status: status as any,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save dividend:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSaving(false);
    }
  };

  const holdingOptions = holdings.map((h) => ({
    id: h.id,
    label: `${h.symbol} - ${h.nameEn}`,
    sublabel: `${h.shares} shares`,
  }));

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <SelectPicker
        label="Stock"
        options={holdingOptions}
        selectedId={selectedHolding}
        onSelect={setSelectedHolding}
        placeholder="Select a holding..."
      />

      <FormInput
        label="Dividend Amount (EGP)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="e.g., 2.50"
      />

      <FormInput
        label="Ex-Dividend Date (YYYY-MM-DD)"
        value={exDate}
        onChangeText={setExDate}
        placeholder="e.g., 2024-03-15"
      />

      <FormInput
        label="Payment Date (YYYY-MM-DD)"
        value={paymentDate}
        onChangeText={setPaymentDate}
        placeholder="e.g., 2024-04-01"
      />

      <SelectPicker
        label="Status"
        options={STATUS_OPTIONS}
        selectedId={status}
        onSelect={setStatus}
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
