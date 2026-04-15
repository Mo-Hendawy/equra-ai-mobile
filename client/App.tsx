import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Platform } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

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

const APP_VERSION = "2.0.9"; // Increment this to trigger auto-reset

export default function App() {
  const [loading, setLoading] = useState(true);

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

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data ?? {};
      if (data?.route === "DividendCalendar") {
        navigateToCalendarNotifications();
      }
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data ?? {};
      if (data?.route === "DividendCalendar") {
        setTimeout(navigateToCalendarNotifications, 600);
      }
    }).catch(() => { /* not available on all platforms */ });

    return () => sub.remove();
  }, []);

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center", backgroundColor: "#1B5E20" }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <ThemedText style={{ color: "#FFFFFF", marginTop: 16 }}>Loading Equra AI...</ThemedText>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <NavigationContainer ref={navigationRef}>
              <StatusBar style="auto" />
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
