import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PortfolioScreen from "@/screens/PortfolioScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type PortfolioStackParamList = {
  Portfolio: undefined;
};

const Stack = createNativeStackNavigator<PortfolioStackParamList>();

export default function PortfolioStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          headerTitle: () => <HeaderTitle title="EGX Portfolio" />,
        }}
      />
    </Stack.Navigator>
  );
}
