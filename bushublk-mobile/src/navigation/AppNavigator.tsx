import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
// Remove any NavigationContainer import if present

import TabNavigator from "./TabNavigator";
// ... other imports

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    // No NavigationContainer here - only the Stack.Navigator
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      {/* ... other screens */}
    </Stack.Navigator>
  );
}
