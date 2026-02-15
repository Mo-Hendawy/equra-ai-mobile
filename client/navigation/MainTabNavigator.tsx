import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import PortfolioStackNavigator from "@/navigation/PortfolioStackNavigator";
import AnalyticsStackNavigator from "@/navigation/AnalyticsStackNavigator";
import TrackingStackNavigator from "@/navigation/TrackingStackNavigator";
import StockSearchStackNavigator from "@/navigation/StockSearchStackNavigator";
import DividendCalendarStackNavigator from "@/navigation/DividendCalendarStackNavigator";
import AIStackNavigator from "@/navigation/AIStackNavigator";
import MoreStackNavigator from "@/navigation/MoreStackNavigator";
import { useTheme } from "@/hooks/useTheme";

export type MainTabParamList = {
  PortfolioTab: undefined;
  AnalyticsTab: undefined;
  TrackingTab: undefined;
  StockSearchTab: undefined;
  DividendCalendarTab: undefined;
  AITab: undefined;
  MoreTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="PortfolioTab"
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="PortfolioTab"
        component={PortfolioStackNavigator}
        options={{
          title: "Portfolio",
          tabBarIcon: ({ color, size }) => (
            <Feather name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsStackNavigator}
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, size }) => (
            <Feather name="pie-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TrackingTab"
        component={TrackingStackNavigator}
        options={{
          title: "Tracking",
          tabBarIcon: ({ color, size }) => (
            <Feather name="layers" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="StockSearchTab"
        component={StockSearchStackNavigator}
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DividendCalendarTab"
        component={DividendCalendarStackNavigator}
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AITab"
        component={AIStackNavigator}
        options={{
          title: "AI",
          tabBarIcon: ({ color, size }) => (
            <Feather name="cpu" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreStackNavigator}
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <Feather name="menu" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
