import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import PlaybookDrawerContent from "@/components/PlaybookDrawerContent";
import { useTheme } from "@/hooks/useTheme";

const Drawer = createDrawerNavigator();

export default function MainDrawerNavigator() {
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: {
          width: "82%",
          backgroundColor: theme.backgroundRoot,
        },
        swipeEdgeWidth: 40,
        swipeMinDistance: 10,
      }}
      drawerContent={() => <PlaybookDrawerContent />}
    >
      <Drawer.Screen name="Tabs" component={MainTabNavigator} />
    </Drawer.Navigator>
  );
}
