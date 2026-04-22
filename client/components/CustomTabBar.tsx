import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  LayoutChangeEvent,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { useTheme } from "@/hooks/useTheme";
import { Palette, Shadows } from "@/constants/theme";

// Icon mapped per tab route key.
const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  PortfolioTab: "briefcase",
  AnalyticsTab: "pie-chart",
  TrackingTab: "layers",
  StockSearchTab: "search",
  DividendCalendarTab: "calendar",
  AITab: "cpu",
  MoreTab: "menu",
};

// Floating glass-dock bottom tab bar with an acid-lime ink-blob under the
// active tab. Labels are suppressed — icons carry everything.
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { theme, isDark } = useTheme();

  const tabCount = state.routes.length;
  const [barWidth, setBarWidth] = React.useState(0);
  const padding = 6;
  const tabSize = barWidth > 0 ? (barWidth - padding * 2) / tabCount : 0;
  const inkOffset = useSharedValue(0);

  React.useEffect(() => {
    inkOffset.value = withSpring(state.index * tabSize, {
      damping: 18,
      stiffness: 160,
      mass: 0.5,
    });
  }, [state.index, tabSize, inkOffset]);

  const inkStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: inkOffset.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width);

  const barBg = isDark ? "#0F0F0E" : "#0A0A09";

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, 14) },
      ]}
    >
      <View
        onLayout={onLayout}
        style={[
          styles.bar,
          { backgroundColor: barBg, width: Math.min(screenWidth - 32, 380) },
          Shadows.large,
        ]}
      >
        {barWidth > 0 && (
          <Animated.View
            style={[
              styles.ink,
              {
                width: tabSize,
                backgroundColor: theme.primary,
                top: padding,
                left: padding,
              },
              inkStyle,
            ]}
          />
        )}

        {state.routes.map((route, idx) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === idx;
          const iconName = TAB_ICONS[route.name] ?? "circle";

          const onPress = () => {
            Haptics.selectionAsync();
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params as never);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? (options.title as string)}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tab, { width: tabSize }]}
            >
              <Feather
                name={iconName}
                size={20}
                color={isFocused ? Palette.inkBlack : "rgba(255,255,255,0.55)"}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  bar: {
    position: "relative",
    height: 56,
    borderRadius: 9999,
    padding: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ink: {
    position: "absolute",
    height: 44,
    borderRadius: 9999,
    zIndex: 0,
  },
  tab: {
    height: 44,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
