import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { Certificate } from "@/types";

interface CertificateItemProps {
  certificate: Certificate;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CertificateItem({ certificate, onPress }: CertificateItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const maturityDate = new Date(certificate.maturityDate);
  const today = new Date();
  const daysToMaturity = Math.ceil(
    (maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const getStatusColor = () => {
    switch (certificate.status) {
      case "active":
        return theme.success;
      case "matured":
        return theme.accent;
      case "redeemed":
        return theme.textSecondary;
    }
  };

  const getFrequencyLabel = () => {
    switch (certificate.paymentFrequency) {
      case "monthly":
        return "Monthly";
      case "quarterly":
        return "Quarterly";
      case "semi-annual":
        return "Semi-Annual";
      case "annual":
        return "Annual";
      case "maturity":
        return "At Maturity";
    }
  };

  const annualInterest = certificate.principalAmount * (certificate.interestRate / 100);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.bankInfo}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "15" }]}>
            <Feather name="file-text" size={20} color={theme.primary} />
          </View>
          <View>
            <ThemedText type="h4" style={styles.bankName}>
              {certificate.bankName} #{certificate.certificateNumber || "N/A"}
            </ThemedText>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor() + "20" },
              ]}
            >
              <ThemedText
                style={[styles.statusText, { color: getStatusColor() }]}
              >
                {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.rateContainer}>
          <ThemedText style={[styles.rate, { color: theme.primary }]}>
            {certificate.interestRate}%
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {getFrequencyLabel()}
          </ThemedText>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Principal
          </ThemedText>
          <ThemedText style={[styles.detailValue, Typography.mono]}>
            {formatCurrency(certificate.principalAmount)}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Annual Interest
          </ThemedText>
          <ThemedText
            style={[styles.detailValue, Typography.mono, { color: theme.success }]}
          >
            {formatCurrency(annualInterest)}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Maturity
          </ThemedText>
          <ThemedText type="small">
            {maturityDate.toLocaleDateString("en-EG", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            {certificate.status === "active" && daysToMaturity > 0
              ? ` (${daysToMaturity}d)`
              : null}
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  bankInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  bankName: {
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  rateContainer: {
    alignItems: "flex-end",
  },
  rate: {
    fontSize: 20,
    fontWeight: "700",
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  detailValue: {
    fontWeight: "500",
  },
});
