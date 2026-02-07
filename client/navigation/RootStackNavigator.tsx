import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AddHoldingScreen from "@/screens/AddHoldingScreen";
import HoldingDetailScreen from "@/screens/HoldingDetailScreen";
import AddCertificateScreen from "@/screens/AddCertificateScreen";
import AddExpenseScreen from "@/screens/AddExpenseScreen";
import AddDividendScreen from "@/screens/AddDividendScreen";
import AddWatchlistScreen from "@/screens/AddWatchlistScreen";
import BuyStockScreen from "@/screens/BuyStockScreen";
import SellStockScreen from "@/screens/SellStockScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import type { PortfolioHolding, Certificate } from "@/types";

export type RootStackParamList = {
  Main: undefined;
  AddHolding: { holding?: PortfolioHolding } | undefined;
  HoldingDetail: { holdingId: string };
  AddCertificate: { certificate?: Certificate } | undefined;
  AddExpense: undefined;
  AddDividend: undefined;
  AddWatchlist: undefined;
  BuyStock: { holdingId: string };
  SellStock: { holdingId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddHolding"
        component={AddHoldingScreen}
        options={{
          presentation: "modal",
          headerTitle: "Add Holding",
        }}
      />
      <Stack.Screen
        name="HoldingDetail"
        component={HoldingDetailScreen}
        options={{
          headerTitle: "Stock Details",
        }}
      />
      <Stack.Screen
        name="AddCertificate"
        component={AddCertificateScreen}
        options={{
          presentation: "modal",
          headerTitle: "Add Certificate",
        }}
      />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{
          presentation: "modal",
          headerTitle: "Add Expense",
        }}
      />
      <Stack.Screen
        name="AddDividend"
        component={AddDividendScreen}
        options={{
          presentation: "modal",
          headerTitle: "Add Dividend",
        }}
      />
      <Stack.Screen
        name="AddWatchlist"
        component={AddWatchlistScreen}
        options={{
          presentation: "modal",
          headerTitle: "Add to Watchlist",
        }}
      />
      <Stack.Screen
        name="BuyStock"
        component={BuyStockScreen}
        options={{
          presentation: "modal",
          headerTitle: "Buy Shares",
        }}
      />
      <Stack.Screen
        name="SellStock"
        component={SellStockScreen}
        options={{
          presentation: "modal",
          headerTitle: "Sell Shares",
        }}
      />
    </Stack.Navigator>
  );
}
