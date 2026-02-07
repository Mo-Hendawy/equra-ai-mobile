import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TrackingScreen from "@/screens/TrackingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type TrackingStackParamList = {
  Tracking: undefined;
};

const Stack = createNativeStackNavigator<TrackingStackParamList>();

export default function TrackingStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Tracking"
        component={TrackingScreen}
        options={{
          headerTitle: "Tracking",
        }}
      />
    </Stack.Navigator>
  );
}
