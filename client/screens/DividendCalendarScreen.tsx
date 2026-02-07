import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";

export default function DividendCalendarScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

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
      <WebView
        source={{ uri: "https://claps.therumble.app/events/month/" }}
        style={styles.webview}
        startInLoadingState
        scalesPageToFit
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
