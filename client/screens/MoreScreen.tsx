import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { MenuListItem } from "@/components/MenuListItem";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, NunitoFont, Palette } from "@/constants/theme";
import { registerForPushNotifications } from "@/lib/push-notifications";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/query-client";
import { backupStorage } from "@/lib/storage";
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
  const { user, signOut } = useAuth();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const json = await backupStorage.export();
      const payload = JSON.parse(json);
      await apiRequest("POST", "/api/sync/import", payload);
      Alert.alert("Synced", "Your portfolio has been saved to the cloud.");
    } catch (e: any) {
      Alert.alert("Sync failed", e?.message ?? "Could not sync to cloud.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  };

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
        paddingBottom: 100 + insets.bottom + Spacing["4xl"],
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.titleBar}>
        <ThemedText style={styles.screenTitle}>More</ThemedText>
      </View>

      {/* ── Account ── */}
      <SectionHeader color={Palette.gold}>ACCOUNT</SectionHeader>
      <View style={group}>
        <MenuListItem
          icon="user"
          title={user?.displayName ?? user?.email ?? "Signed in"}
          subtitle={user?.displayName ? user.email ?? "Your Equra AI account" : "Your Equra AI account"}
          iconColor={Palette.gold}
        />
        <MenuListItem
          icon="upload-cloud"
          title={syncing ? "Syncing…" : "Sync to Cloud"}
          subtitle="Save your portfolio to your account"
          iconColor={Palette.gold400}
          onPress={handleSync}
        />
        <MenuListItem
          icon="log-out"
          title="Sign Out"
          subtitle="Sign out of your account"
          iconColor="#f87171"
          onPress={handleSignOut}
          isLast
        />
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
          icon="bell"
          title="Re-register notifications"
          subtitle="Re-send push token if you stopped getting alerts"
          iconColor={Palette.gold400}
          onPress={async () => {
            const token = await registerForPushNotifications({ force: true });
            if (token) {
              Alert.alert("Registered", `Token sent to backend:\n${token.slice(0, 40)}…`);
            } else {
              Alert.alert(
                "Not registered",
                "Could not get a push token. Check permissions in device settings."
              );
            }
          }}
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
