import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { MenuListItem } from "@/components/MenuListItem";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, NunitoFont, Palette } from "@/constants/theme";
import type { MoreStackParamList } from "@/navigation/MoreStackNavigator";

type NavigationProp = NativeStackNavigationProp<MoreStackParamList>;

function SectionHeader({ color, children }: { color: string; children: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.secHdr}>
      <View style={[styles.secDot, { backgroundColor: color }]} />
      <ThemedText style={[styles.secLabel, { color: theme.textSecondary }]}>
        {children}
      </ThemedText>
      <View style={[styles.secLine, { backgroundColor: theme.divider }]} />
    </View>
  );
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const group = {
    backgroundColor: theme.backgroundDefault,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    overflow: "hidden" as const,
    marginBottom: 12,
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.md,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.titleBar}>
        <ThemedText style={styles.screenTitle}>More</ThemedText>
      </View>

      {/* ── Features ── */}
      <SectionHeader color={Palette.gold}>FEATURES</SectionHeader>
      <View style={group}>
        <MenuListItem
          icon="book-open"
          title="Investment Playbook"
          subtitle="Your trading rules — swipe left edge to access"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          iconColor={Palette.gold}
        />
        <MenuListItem
          icon="eye"
          title="Watchlist"
          subtitle="Track symbols you don't own yet"
          iconColor={Palette.gold900}
          onPress={() => navigation.navigate("Watchlist")}
        />
        <MenuListItem
          icon="target"
          title="Targets"
          subtitle="Portfolio allocation goals"
          iconColor={Palette.gold400}
          onPress={() => navigation.navigate("Targets")}
        />
        <MenuListItem
          icon="trending-up"
          title="Realized Gains"
          subtitle="Booked P/L across closed positions"
          iconColor={Palette.goldDeep}
          onPress={() => navigation.navigate("RealizedGains")}
          isLast
        />
      </View>

      {/* ── Data ── */}
      <SectionHeader color={Palette.gold900}>DATA</SectionHeader>
      <View style={group}>
        <MenuListItem
          icon="mail"
          title="Thndr Imports"
          subtitle="Review trades forwarded from Thndr"
          iconColor={Palette.gold}
          onPress={() => navigation.navigate("ThndrImports")}
        />
        <MenuListItem
          icon="download-cloud"
          title="Backup & Restore"
          subtitle="Export or load portfolio JSON"
          iconColor={Palette.gold400}
          onPress={() => navigation.navigate("BackupRestore")}
        />
        <MenuListItem
          icon="refresh-cw"
          title="Reset Portfolio"
          subtitle="Clear and reload stock holdings"
          iconColor={Palette.black400}
          onPress={() => navigation.navigate("ResetPortfolio")}
          isLast
        />
      </View>

      {/* ── About ── */}
      <SectionHeader color={Palette.black400}>ABOUT</SectionHeader>
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
  titleBar: {
    paddingBottom: 10,
  },
  screenTitle: {
    fontSize: 28,
    fontFamily: NunitoFont.bold,
    fontWeight: "700",
    letterSpacing: -0.3,
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
    fontFamily: NunitoFont.bold,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  secHdr: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: Spacing.sm,
    marginBottom: 10,
    marginHorizontal: 2,
  },
  secDot: {
    width: 7,
    height: 7,
    borderRadius: 9999,
  },
  secLabel: {
    fontSize: 11,
    fontFamily: NunitoFont.bold,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  secLine: {
    flex: 1,
    height: 1,
  },
  aboutCard: {
    marginTop: 0,
  },
  version: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
});
