import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";

import { useTheme } from "@/hooks/useTheme";
import DividendNotificationsView from "@/components/DividendNotificationsView";
import type { DividendCalendarStackParamList } from "@/navigation/DividendCalendarStackNavigator";

type Tab = "calendar" | "notifications";
type Route = RouteProp<DividendCalendarStackParamList, "DividendCalendar">;

export default function DividendCalendarScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const [tab, setTab] = useState<Tab>(route.params?.initialTab ?? "calendar");

  // Honor route param changes (e.g. when a push notification taps in while screen is mounted)
  useEffect(() => {
    const next = route.params?.initialTab;
    if (next && next !== tab) setTab(next);
  }, [route.params?.initialTab]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={[styles.tabBar, { borderBottomColor: theme.divider, backgroundColor: theme.backgroundDefault }]}>
        <TabButton label="Calendar" active={tab === "calendar"} onPress={() => setTab("calendar")} theme={theme} />
        <TabButton label="Notifications" active={tab === "notifications"} onPress={() => setTab("notifications")} theme={theme} />
      </View>

      {tab === "calendar" ? (
        <WebView
          source={{ uri: "https://claps.therumble.app/events/month/" }}
          style={styles.webview}
          startInLoadingState
          scalesPageToFit
          javaScriptEnabled
          domStorageEnabled
        />
      ) : (
        <DividendNotificationsView />
      )}
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, active && { borderBottomColor: theme.primary }]}>
      <Text
        style={{
          color: active ? theme.primary : theme.textSecondary,
          fontWeight: active ? "700" : "500",
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  webview: {
    flex: 1,
  },
});
