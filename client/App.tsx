import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Platform } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";
import { Palette } from "@/constants/theme"; // used below for splash BG

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { resetPortfolio } from "@/lib/reset-portfolio";
import { migrateOBEYtoOLFI } from "@/lib/storage";
import { ThemedText } from "@/components/ThemedText";
import { registerForPushNotifications } from "@/lib/push-notifications";

const navigationRef = createNavigationContainerRef<any>();

function navigateToCalendarNotifications() {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate("Main", {
    screen: "DividendCalendarTab",
    params: {
      screen: "DividendCalendar",
      params: { initialTab: "notifications" },
    },
  });
}

function navigateToThndrImports() {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate("Main", {
    screen: "MoreTab",
    params: { screen: "ThndrImports" },
  });
}

const APP_VERSION = "2.0.9"; // Increment this to trigger auto-reset

export default function App() {
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    const checkAndResetIfNeeded = async () => {
      try {
        await migrateOBEYtoOLFI();
        const lastVersion = await AsyncStorage.getItem("@app_version");
        
        if (lastVersion !== APP_VERSION) {
          console.log("🔄 New version detected, resetting portfolio...");
          await resetPortfolio();
          await AsyncStorage.setItem("@app_version", APP_VERSION);
          console.log("✅ Portfolio reset complete!");
        }
      } catch (error) {
        console.error("Auto-reset error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAndResetIfNeeded();
  }, []);

  // Push notifications: register on app launch + handle taps (native only — web doesn't implement these APIs)
  useEffect(() => {
    if (Platform.OS === "web") return;

    registerForPushNotifications().catch((e) => console.warn("[App] push register failed:", e));

    const routeFromData = (data: Record<string, unknown>, defer: number) => {
      if (data?.route === "DividendCalendar") {
        defer > 0 ? setTimeout(navigateToCalendarNotifications, defer) : navigateToCalendarNotifications();
      } else if (data?.route === "ThndrImports") {
        defer > 0 ? setTimeout(navigateToThndrImports, defer) : navigateToThndrImports();
      }
    };

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      routeFromData(response.notification.request.content.data ?? {}, 0);
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      routeFromData(response.notification.request.content.data ?? {}, 600);
    }).catch(() => { /* not available on all platforms */ });

    return () => sub.remove();
  }, []);

  if (loading || !fontsLoaded) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center", backgroundColor: Palette.black }]}>
        <ActivityIndicator size="large" color={Palette.gold} />
        <ThemedText style={{ color: Palette.gold, marginTop: 16, letterSpacing: -0.3 }}>Loading Equra AI…</ThemedText>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <NavigationContainer ref={navigationRef}>
              <StatusBar style="light" />
              <RootStackNavigator />
            </NavigationContainer>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
