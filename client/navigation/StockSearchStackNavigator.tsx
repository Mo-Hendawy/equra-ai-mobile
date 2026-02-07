import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StockSearchScreen from "@/screens/StockSearchScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type StockSearchStackParamList = {
  StockSearch: undefined;
};

const Stack = createNativeStackNavigator<StockSearchStackParamList>();

export default function StockSearchStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="StockSearch"
        component={StockSearchScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
