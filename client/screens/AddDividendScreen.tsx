import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
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
type RouteProps = RouteProp<RootStackParamList, "AddDividend">;

const STATUS_OPTIONS = [
  { id: "announced", label: "Announced" },
  { id: "paid", label: "Paid" },
];

function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function AddDividendScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();

  const existingDividend = route.params?.dividend;
  const isEditing = !!existingDividend;

  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [selectedHolding, setSelectedHolding] = useState("");
  const [amount, setAmount] = useState("");
  const [exDate, setExDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [status, setStatus] = useState<string>("announced");
  const [saving, setSaving] = useState(false);

  const [showExDatePicker, setShowExDatePicker] = useState(false);
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadHoldings = async () => {
        const data = await holdingsStorage.getAll();
        setHoldings(data);
        if (existingDividend) {
          const holding = data.find((h) => h.id === existingDividend.holdingId) ?? data.find((h) => h.symbol === existingDividend.symbol);
          if (holding) setSelectedHolding(holding.id);
        }
      };
      loadHoldings();
    }, [existingDividend])
  );

  useEffect(() => {
    if (existingDividend) {
      setAmount(existingDividend.amount.toString());
      setExDate(existingDividend.exDate);
      setPaymentDate(existingDividend.paymentDate);
      setStatus(existingDividend.status);
    }
  }, [existingDividend]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: isEditing ? "Edit Dividend" : "Add Dividend",
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
            Save
          </ThemedText>
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedHolding, amount, exDate, paymentDate, status, saving, isEditing]);

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
      if (isEditing && existingDividend) {
        await dividendsStorage.update(existingDividend.id, {
          holdingId: holding.id,
          symbol: holding.symbol,
          amount: parseFloat(amount),
          exDate,
          paymentDate,
          status: status as any,
        });
      } else {
        await dividendsStorage.add({
          holdingId: holding.id,
          symbol: holding.symbol,
          amount: parseFloat(amount),
          exDate,
          paymentDate,
          status: status as any,
        });
      }

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

  const handleExDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowExDatePicker(false);
    if (date) setExDate(toDateString(date));
  };

  const handlePaymentDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowPaymentDatePicker(false);
    if (date) setPaymentDate(toDateString(date));
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

      <View style={styles.dateField}>
        <ThemedText type="small" style={[styles.dateLabel, { color: theme.textSecondary }]}>
          Ex-Dividend Date
        </ThemedText>
        <TouchableOpacity
          style={[styles.datePickerTouch, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => setShowExDatePicker(true)}
        >
          <Feather name="calendar" size={20} color={theme.primary} />
          <ThemedText style={{ color: exDate ? theme.text : theme.textSecondary }}>
            {exDate || "Select date"}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {showExDatePicker && (
        <>
          {Platform.OS === "ios" && (
            <View style={styles.pickerActions}>
              <TouchableOpacity onPress={() => setShowExDatePicker(false)}>
                <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>Done</ThemedText>
              </TouchableOpacity>
            </View>
          )}
          <DateTimePicker
            value={exDate ? new Date(exDate) : new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleExDateChange}
          />
        </>
      )}

      <View style={styles.dateField}>
        <ThemedText type="small" style={[styles.dateLabel, { color: theme.textSecondary }]}>
          Payment Date
        </ThemedText>
        <TouchableOpacity
          style={[styles.datePickerTouch, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => setShowPaymentDatePicker(true)}
        >
          <Feather name="calendar" size={20} color={theme.primary} />
          <ThemedText style={{ color: paymentDate ? theme.text : theme.textSecondary }}>
            {paymentDate || "Select date"}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {showPaymentDatePicker && (
        <>
          {Platform.OS === "ios" && (
            <View style={styles.pickerActions}>
              <TouchableOpacity onPress={() => setShowPaymentDatePicker(false)}>
                <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>Done</ThemedText>
              </TouchableOpacity>
            </View>
          )}
          <DateTimePicker
            value={paymentDate ? new Date(paymentDate) : new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handlePaymentDateChange}
          />
        </>
      )}

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
  dateField: {
    marginBottom: Spacing.lg,
  },
  dateLabel: {
    marginBottom: Spacing.xs,
  },
  datePickerTouch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  pickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: Spacing.sm,
  },
});
