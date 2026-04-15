// Push notification setup for the dividend calendar feature.
// Request permission, get an Expo push token, register it with the backend.
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/lib/query-client";

const REGISTERED_TOKEN_KEY = "@push_token_registered_v1";

// Foreground display behavior — show the notification even when app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("dividend-calendar", {
    name: "Dividend Calendar",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#1B5E20",
  });
}

/**
 * Registers this device for push notifications.
 * Safe to call on every app launch — it will short-circuit if already registered.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log("[push] skipped — not a physical device");
      return null;
    }

    await ensureAndroidChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("[push] permission denied");
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
    if (!projectId || projectId === "REPLACE_ME_RUN_eas_init") {
      console.log("[push] EAS projectId not configured — run `eas init` to enable production push");
      return null;
    }

    const tokenResp = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResp.data;

    // Avoid re-POST if same token was already registered
    const lastRegistered = await AsyncStorage.getItem(REGISTERED_TOKEN_KEY);
    if (lastRegistered === token) {
      console.log("[push] token unchanged — skipping backend register");
      return token;
    }

    await apiRequest("POST", "/api/push-tokens", {
      token,
      platform: Platform.OS,
    });
    await AsyncStorage.setItem(REGISTERED_TOKEN_KEY, token);
    console.log("[push] registered token with backend");
    return token;
  } catch (err) {
    console.warn("[push] registration failed:", err);
    return null;
  }
}
