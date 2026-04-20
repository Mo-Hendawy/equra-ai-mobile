// Push notification setup for the dividend calendar feature.
// Uses raw FCM (Android) / APNs (iOS) device tokens — no Expo cloud.
// Works with release APKs built via the native Android toolchain.
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/lib/query-client";

const REGISTERED_TOKEN_KEY = "@push_token_registered_v2";

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
 * Registers this device for push notifications using the raw platform
 * token (FCM on Android, APNs on iOS). Safe to call on every app launch —
 * short-circuits if the same token is already registered on the backend.
 * Pass `{ force: true }` to bypass the AsyncStorage cache (e.g. from a
 * manual "Re-register" button when the backend forgot the token).
 */
export async function registerForPushNotifications(opts?: {
  force?: boolean;
}): Promise<string | null> {
  const force = opts?.force === true;
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

    // Raw FCM/APNs token — requires google-services.json on Android,
    // GoogleService-Info.plist on iOS to be present at build time.
    const tokenResp = await Notifications.getDevicePushTokenAsync();
    const token = tokenResp.data;
    if (!token || typeof token !== "string") {
      console.warn("[push] no device token returned");
      return null;
    }

    // Idempotency: avoid re-POSTing the same token on every launch.
    // Bypass when caller passes force:true (e.g. manual re-register).
    if (!force) {
      const lastRegistered = await AsyncStorage.getItem(REGISTERED_TOKEN_KEY);
      if (lastRegistered === token) {
        console.log("[push] token unchanged — skipping backend register");
        return token;
      }
    }

    await apiRequest("POST", "/api/push-tokens", {
      token,
      platform: Platform.OS,
    });
    await AsyncStorage.setItem(REGISTERED_TOKEN_KEY, token);
    console.log("[push] registered FCM token with backend");
    return token;
  } catch (err) {
    console.warn("[push] registration failed:", err);
    return null;
  }
}
