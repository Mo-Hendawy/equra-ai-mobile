import React, { useState } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { resetPortfolio } from "@/lib/reset-portfolio";

export default function ResetPortfolioScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    Alert.alert(
      "⚠️ Reset Portfolio",
      "This will DELETE all your current holdings and transactions, and import the new portfolio data. Certificates, dividends, and expenses will NOT be affected.\n\nAre you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, Reset",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await resetPortfolio();
              Alert.alert(
                "✅ Success!",
                "Portfolio has been reset with 12 new stocks. Please restart the app to see the changes.",
                [
                  {
                    text: "OK",
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error) {
              console.error("Reset error:", error);
              Alert.alert("Error", "Failed to reset portfolio. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
        },
      ]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing.md,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <Card style={styles.card}>
        <ThemedText type="h2" style={styles.title}>
          🔄 Reset Portfolio
        </ThemedText>
        <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
          This will clear your current holdings and import the following 12 stocks:
        </ThemedText>

        <View style={styles.stocksList}>
          <ThemedText style={styles.stockItem}>• ADCI - 222 shares @ EGP 160.11</ThemedText>
          <ThemedText style={styles.stockItem}>• BONY - 5,592 shares @ EGP 4.25</ThemedText>
          <ThemedText style={styles.stockItem}>• COMI - 10 shares @ EGP 125.46</ThemedText>
          <ThemedText style={styles.stockItem}>• EGAL - 1,254 shares @ EGP 222.54</ThemedText>
          <ThemedText style={styles.stockItem}>• ETEL - 1,757 shares @ EGP 78.50</ThemedText>
          <ThemedText style={styles.stockItem}>• JUFO - 4,513 shares @ EGP 23.17</ThemedText>
          <ThemedText style={styles.stockItem}>• MFPC - 4,433 shares @ EGP 29.33</ThemedText>
          <ThemedText style={styles.stockItem}>• MICH - 11,697 shares @ EGP 32.52</ThemedText>
          <ThemedText style={styles.stockItem}>• POUL - 1,205 shares @ EGP 25.14</ThemedText>
          <ThemedText style={styles.stockItem}>• SWDY - 1,252 shares @ EGP 77.57</ThemedText>
          <ThemedText style={styles.stockItem}>• UBEE - 3,504 shares @ EGP 14.62</ThemedText>
          <ThemedText style={styles.stockItem}>• VALU - 214 shares @ EGP 8.97</ThemedText>
        </View>

        <ThemedText style={[styles.warning, { color: theme.error }]}>
          ⚠️ Warning: This will delete all existing holdings and transactions!
        </ThemedText>

        <ThemedText style={[styles.safe, { color: theme.success }]}>
          ✅ Safe: Certificates, dividends, and expenses will NOT be affected.
        </ThemedText>

        <Button
          title={loading ? "Resetting..." : "Reset Portfolio Now"}
          onPress={handleReset}
          variant="primary"
          disabled={loading}
          style={styles.button}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  card: {
    padding: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  description: {
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  stocksList: {
    marginBottom: Spacing.lg,
    paddingLeft: Spacing.sm,
  },
  stockItem: {
    marginBottom: Spacing.xs,
    fontSize: 14,
  },
  warning: {
    marginBottom: Spacing.md,
    fontWeight: "600",
    textAlign: "center",
  },
  safe: {
    marginBottom: Spacing.xl,
    fontWeight: "600",
    textAlign: "center",
  },
  button: {
    marginTop: Spacing.md,
  },
});
