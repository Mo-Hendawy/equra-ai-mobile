import React, { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { MenuListItem } from "@/components/MenuListItem";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import {
  holdingsStorage,
  certificatesStorage,
  realizedGainsStorage,
  watchlistStorage,
} from "@/lib/storage";
import type { MoreStackParamList } from "@/navigation/MoreStackNavigator";

type NavigationProp = NativeStackNavigationProp<MoreStackParamList>;

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [stats, setStats] = useState({
    holdings: 0,
    certificates: 0,
    watchlist: 0,
    realizedGains: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const [holdings, certificates, watchlist, realizedGains] = await Promise.all([
        holdingsStorage.getAll(),
        certificatesStorage.getAll(),
        watchlistStorage.getAll(),
        realizedGainsStorage.getAll(),
      ]);
      setStats({
        holdings: holdings.length,
        certificates: certificates.length,
        watchlist: watchlist.length,
        realizedGains: realizedGains.length,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <Card style={styles.profileCard}>
        <View style={styles.profileContent}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.avatar}
            resizeMode="contain"
          />
          <View style={styles.profileInfo}>
            <ThemedText type="h4">EGX Portfolio</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Investment Tracker
            </ThemedText>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {stats.holdings}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Holdings
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {stats.certificates}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Certificates
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {stats.watchlist}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Watching
            </ThemedText>
          </View>
        </View>
      </Card>

      <ThemedText type="small" style={styles.sectionTitle}>
        FEATURES
      </ThemedText>

      <MenuListItem
        icon="eye"
        title="Watchlist"
        subtitle="Stocks you're monitoring"
        onPress={() => navigation.navigate("Watchlist")}
      />

      <MenuListItem
        icon="target"
        title="Targets"
        subtitle="Portfolio allocation goals"
        onPress={() => navigation.navigate("Targets")}
        iconColor="#7B1FA2"
      />

      <MenuListItem
        icon="trending-up"
        title="Realized Gains"
        subtitle="Profits from sold positions"
        onPress={() => navigation.navigate("RealizedGains")}
        iconColor="#2E7D32"
      />

      <ThemedText type="small" style={styles.sectionTitle}>
        DATA
      </ThemedText>

      <MenuListItem
        icon="download-cloud"
        title="Backup & Restore"
        subtitle="Export or import your data"
        onPress={() => navigation.navigate("BackupRestore")}
        iconColor="#1565C0"
      />

      <MenuListItem
        icon="refresh-cw"
        title="Reset Portfolio"
        subtitle="Clear and reload stock holdings"
        onPress={() => navigation.navigate("ResetPortfolio")}
        iconColor="#C62828"
      />

      <ThemedText type="small" style={styles.sectionTitle}>
        ABOUT
      </ThemedText>

      <Card style={styles.aboutCard}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          EGX Portfolio Tracker helps you manage and analyze your Egyptian Stock
          Exchange investments. Track holdings, certificates, expenses, and
          dividends all in one place.
        </ThemedText>
        <ThemedText
          type="small"
          style={[styles.version, { color: theme.textSecondary }]}
        >
          Version 1.0.0
        </ThemedText>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    marginBottom: Spacing.xl,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: Spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
    fontWeight: "600",
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  aboutCard: {
    marginTop: Spacing.sm,
  },
  version: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
});
