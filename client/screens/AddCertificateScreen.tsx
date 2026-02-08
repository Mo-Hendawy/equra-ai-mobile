import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { FormInput } from "@/components/FormInput";
import { SelectPicker } from "@/components/SelectPicker";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { certificatesStorage } from "@/lib/storage";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "AddCertificate">;
type RouteProps = RouteProp<RootStackParamList, "AddCertificate">;

const FREQUENCY_OPTIONS = [
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "semi-annual", label: "Semi-Annual" },
  { id: "annual", label: "Annual" },
  { id: "maturity", label: "At Maturity" },
];

const STATUS_OPTIONS = [
  { id: "active", label: "Active" },
  { id: "matured", label: "Matured" },
  { id: "redeemed", label: "Redeemed" },
];

export default function AddCertificateScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();

  const existingCert = route.params?.certificate;
  const isEditing = !!existingCert;

  const [bankName, setBankName] = useState(existingCert?.bankName || "");
  const [certificateNumber, setCertificateNumber] = useState(
    existingCert?.certificateNumber || ""
  );
  const [principalAmount, setPrincipalAmount] = useState(
    existingCert?.principalAmount?.toString() || ""
  );
  const [interestRate, setInterestRate] = useState(
    existingCert?.interestRate?.toString() || ""
  );
  const [startDate, setStartDate] = useState(existingCert?.startDate || "");
  const [maturityDate, setMaturityDate] = useState(existingCert?.maturityDate || "");
  const [paymentDay, setPaymentDay] = useState(
    existingCert?.paymentDay?.toString() || ""
  );
  const [paymentFrequency, setPaymentFrequency] = useState<string>(
    existingCert?.paymentFrequency || "monthly"
  );
  const [status, setStatus] = useState<string>(existingCert?.status || "active");
  const [notes, setNotes] = useState(existingCert?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!bankName || !certificateNumber || !principalAmount || !interestRate || !startDate || !maturityDate || !paymentDay) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setSaving(true);

    try {
      if (isEditing && existingCert) {
        await certificatesStorage.update(existingCert.id, {
          bankName,
          certificateNumber,
          principalAmount: parseFloat(principalAmount),
          interestRate: parseFloat(interestRate),
          startDate,
          maturityDate,
          paymentDay: parseInt(paymentDay, 10),
          paymentFrequency: paymentFrequency as any,
          status: status as any,
          notes: notes || undefined,
        });
      } else {
        await certificatesStorage.add({
          bankName,
          certificateNumber,
          principalAmount: parseFloat(principalAmount),
          interestRate: parseFloat(interestRate),
          startDate,
          maturityDate,
          paymentDay: parseInt(paymentDay, 10),
          paymentFrequency: paymentFrequency as any,
          status: status as any,
          notes: notes || undefined,
        });
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save certificate:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSaving(false);
    }
  }, [bankName, certificateNumber, principalAmount, interestRate, startDate, maturityDate, paymentDay, paymentFrequency, status, notes, isEditing, existingCert, navigation]);

  const handleDelete = async () => {
    if (!existingCert) return;

    try {
      await certificatesStorage.delete(existingCert.id);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      navigation.goBack();
    } catch (error) {
      console.error("Failed to delete certificate:", error);
    }
  };

  const annualInterest = principalAmount && interestRate
    ? parseFloat(principalAmount) * (parseFloat(interestRate) / 100)
    : 0;

  useEffect(() => {
    navigation.setOptions({
      headerTitle: isEditing ? "Edit Certificate" : "Add Certificate",
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
            {isEditing ? "Update" : "Save"}
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, theme, isEditing, saving, handleSave]);

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
      <FormInput
        label="Bank Name"
        value={bankName}
        onChangeText={setBankName}
        placeholder="e.g., HSBC, NBE, CIB"
      />

      <FormInput
        label="Certificate Number"
        value={certificateNumber}
        onChangeText={setCertificateNumber}
        placeholder="e.g., 239, 901, 912"
      />

      <FormInput
        label="Principal Amount (EGP)"
        value={principalAmount}
        onChangeText={setPrincipalAmount}
        keyboardType="numeric"
        placeholder="e.g., 100000"
      />

      <FormInput
        label="Interest Rate (%)"
        value={interestRate}
        onChangeText={setInterestRate}
        keyboardType="decimal-pad"
        placeholder="e.g., 17.25"
      />

      <FormInput
        label="Start Date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
        placeholder="e.g., 2024-01-15"
      />

      <FormInput
        label="Maturity Date (YYYY-MM-DD)"
        value={maturityDate}
        onChangeText={setMaturityDate}
        placeholder="e.g., 2027-01-15"
      />

      <FormInput
        label="Payment Day of Month"
        value={paymentDay}
        onChangeText={setPaymentDay}
        keyboardType="numeric"
        placeholder="e.g., 15 (day of month for payment)"
      />

      <SelectPicker
        label="Payment Frequency"
        options={FREQUENCY_OPTIONS}
        selectedId={paymentFrequency}
        onSelect={setPaymentFrequency}
      />

      <SelectPicker
        label="Status"
        options={STATUS_OPTIONS}
        selectedId={status}
        onSelect={setStatus}
      />

      <FormInput
        label="Notes (Optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Any additional notes..."
        multiline
        numberOfLines={3}
      />

      {principalAmount && interestRate ? (
        <View style={[styles.preview, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="small" style={[styles.previewLabel, { color: theme.textSecondary }]}>
            Interest Summary
          </ThemedText>
          <View style={styles.previewRow}>
            <ThemedText type="small">Annual Interest</ThemedText>
            <ThemedText style={[styles.previewValue, { color: theme.success }]}>
              {new Intl.NumberFormat("en-EG", {
                style: "currency",
                currency: "EGP",
              }).format(annualInterest)}
            </ThemedText>
          </View>
          <View style={styles.previewRow}>
            <ThemedText type="small">Monthly Interest</ThemedText>
            <ThemedText style={[styles.previewValue, { color: theme.success }]}>
              {new Intl.NumberFormat("en-EG", {
                style: "currency",
                currency: "EGP",
              }).format(annualInterest / 12)}
            </ThemedText>
          </View>
        </View>
      ) : null}

      {isEditing ? (
        <Button
          onPress={handleDelete}
          style={[styles.deleteButton, { backgroundColor: theme.error }]}
        >
          Delete Certificate
        </Button>
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
  deleteButton: {
    marginTop: Spacing.xl,
  },
});
