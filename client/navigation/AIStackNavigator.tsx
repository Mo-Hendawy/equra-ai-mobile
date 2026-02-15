import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AIScreen from "@/screens/AIScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type AIStackParamList = {
  AI: undefined;
};

const Stack = createNativeStackNavigator<AIStackParamList>();

export default function AIStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="AI"
        component={AIScreen}
        options={{
          headerTitle: "AI Assistant",
        }}
      />
    </Stack.Navigator>
  );
}
