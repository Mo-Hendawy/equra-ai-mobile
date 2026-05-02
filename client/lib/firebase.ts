import { initializeApp, getApps } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyD82lXJWw3MemafgzlNG0JtrRxVfctSwh8",
  authDomain: "equra-ai.firebaseapp.com",
  projectId: "equra-ai",
  storageBucket: "equra-ai.firebasestorage.app",
  messagingSenderId: "506769313227",
  appId: "1:506769313227:android:2bd6df879e98813bd23a4e",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Use AsyncStorage persistence on native, default (indexedDB) on web
let auth: ReturnType<typeof getAuth>;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };
export default app;
