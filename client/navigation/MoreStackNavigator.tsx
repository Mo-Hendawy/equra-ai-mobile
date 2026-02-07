import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MoreScreen from "@/screens/MoreScreen";
import WatchlistScreen from "@/screens/WatchlistScreen";
import TargetsScreen from "@/screens/TargetsScreen";
import RealizedGainsScreen from "@/screens/RealizedGainsScreen";
import BackupRestoreScreen from "@/screens/BackupRestoreScreen";
import ResetPortfolioScreen from "@/screens/ResetPortfolioScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type MoreStackParamList = {
  More: undefined;
  Watchlist: undefined;
  Targets: undefined;
  RealizedGains: undefined;
  BackupRestore: undefined;
  ResetPortfolio: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

export default function MoreStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="More"
        component={MoreScreen}
        options={{
          headerTitle: "More",
        }}
      />
      <Stack.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{
          headerTitle: "Watchlist",
        }}
      />
      <Stack.Screen
        name="Targets"
        component={TargetsScreen}
        options={{
          headerTitle: "Targets",
        }}
      />
      <Stack.Screen
        name="RealizedGains"
        component={RealizedGainsScreen}
        options={{
          headerTitle: "Realized Gains",
        }}
      />
      <Stack.Screen
        name="BackupRestore"
        component={BackupRestoreScreen}
        options={{
          headerTitle: "Backup & Restore",
        }}
      />
      <Stack.Screen
        name="ResetPortfolio"
        component={ResetPortfolioScreen}
        options={{
          headerTitle: "Reset Portfolio",
        }}
      />
    </Stack.Navigator>
  );
}
