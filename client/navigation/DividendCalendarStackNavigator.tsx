import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DividendCalendarScreen from "@/screens/DividendCalendarScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type DividendCalendarStackParamList = {
  DividendCalendar: undefined;
};

const Stack = createNativeStackNavigator<DividendCalendarStackParamList>();

export default function DividendCalendarStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="DividendCalendar"
        component={DividendCalendarScreen}
        options={{ headerTitle: "Dividend Calendar" }}
      />
    </Stack.Navigator>
  );
}
