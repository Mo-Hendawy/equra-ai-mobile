import React, { useMemo, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { Certificate } from "@/types";

interface MonthlyCertificateIncomeProps {
  certificates: Certificate[];
}

interface PayoutItem {
  certificate: Certificate;
  amount: number;
  dueDate: Date;
}

export function MonthlyCertificateIncome({ certificates }: MonthlyCertificateIncomeProps) {
  const { theme } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const activeCertificates = useMemo(() => 
    certificates.filter(c => c.status === "active"),
    [certificates]
  );

  const monthPayouts = useMemo(() => {
    const payouts: PayoutItem[] = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    activeCertificates.forEach(cert => {
      const startDate = new Date(cert.startDate);
      const maturityDate = new Date(cert.maturityDate);
      
      const checkDate = new Date(year, month, cert.paymentDay || startDate.getDate());
      
      if (checkDate < startDate || checkDate > maturityDate) return;

      let monthlyAmount = 0;
      const annualInterest = cert.principalAmount * (cert.interestRate / 100);

      switch (cert.paymentFrequency) {
        case "monthly":
          monthlyAmount = annualInterest / 12;
          break;
        case "quarterly":
          const startMonth = startDate.getMonth();
          const quarterMonths = [startMonth, (startMonth + 3) % 12, (startMonth + 6) % 12, (startMonth + 9) % 12];
          if (quarterMonths.includes(month)) {
            monthlyAmount = annualInterest / 4;
          }
          break;
        case "semi-annual":
          const semiMonths = [startDate.getMonth(), (startDate.getMonth() + 6) % 12];
          if (semiMonths.includes(month)) {
            monthlyAmount = annualInterest / 2;
          }
          break;
        case "annual":
          if (month === startDate.getMonth()) {
            monthlyAmount = annualInterest;
          }
          break;
        case "maturity":
          if (month === maturityDate.getMonth() && year === maturityDate.getFullYear()) {
            const years = (maturityDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
            monthlyAmount = annualInterest * years;
          }
          break;
      }

      if (monthlyAmount > 0) {
        payouts.push({
          certificate: cert,
          amount: monthlyAmount,
          dueDate: new Date(year, month, cert.paymentDay || startDate.getDate()),
        });
      }
    });

    return payouts.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [activeCertificates, currentMonth]);

  const totalMonthlyIncome = useMemo(() => 
    monthPayouts.reduce((sum, p) => sum + p.amount, 0),
    [monthPayouts]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const formatDueDate = (date: Date) => {
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate().toString().padStart(2, "0");
    return `Due: ${month} ${day}`;
  };

  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const today = new Date();
  const isPastDate = (date: Date) => {
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  if (activeCertificates.length === 0) {
    return null;
  }

  return (
    <Card style={[styles.card, { backgroundColor: "#3B9ED8" }]}>
      <ThemedText style={styles.title}>
        Monthly Certificate Income
      </ThemedText>

      <View style={[styles.monthCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.monthHeader}>
          <Pressable onPress={goToPrevMonth} style={styles.navButton}>
            <Feather name="chevron-left" size={20} color={theme.text} />
          </Pressable>
          <ThemedText type="h4" style={styles.monthText}>
            {formatMonthYear(currentMonth)}
          </ThemedText>
          <Pressable onPress={goToNextMonth} style={styles.navButton}>
            <Feather name="chevron-right" size={20} color={theme.text} />
          </Pressable>
          <ThemedText style={[styles.totalAmount, { color: theme.success }]}>
            EGP {formatCurrency(totalMonthlyIncome)}
          </ThemedText>
        </View>

        <View style={styles.payoutsList}>
          {monthPayouts.length > 0 ? (
            monthPayouts.map((payout, index) => {
              const isPast = isPastDate(payout.dueDate);
              return (
                <View key={`${payout.certificate.id}-${index}`} style={styles.payoutRow}>
                  <ThemedText style={styles.certLabel}>
                    {payout.certificate.bankName} #{payout.certificate.certificateNumber || "N/A"}
                  </ThemedText>
                  <ThemedText style={[styles.payoutAmount, Typography.mono]}>
                    EGP {formatCurrency(payout.amount)}
                  </ThemedText>
                  <ThemedText 
                    style={[
                      styles.dueDate, 
                      { color: isPast ? theme.success : "#D4A017" }
                    ]}
                  >
                    {formatDueDate(payout.dueDate)}
                  </ThemedText>
                </View>
              );
            })
          ) : (
            <ThemedText style={[styles.noPayouts, { color: theme.textSecondary }]}>
              No payouts scheduled for this month
            </ThemedText>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: Spacing.md,
  },
  monthCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  navButton: {
    padding: Spacing.xs,
  },
  monthText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  payoutsList: {
  },
  payoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    justifyContent: "space-between",
  },
  certLabel: {
    fontSize: 13,
    fontWeight: "500",
    maxWidth: "40%",
  },
  payoutAmount: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    minWidth: 100,
  },
  dueDate: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "right",
    minWidth: 90,
  },
  noPayouts: {
    textAlign: "center",
    paddingVertical: Spacing.xl,
    fontSize: 14,
  },
});
