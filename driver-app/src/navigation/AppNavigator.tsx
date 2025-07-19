import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import TabNavigator from "./TabNavigator";

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  return (
    // NO NavigationContainer here - only Stack.Navigator
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      {/* Removed ForgotPassword and ResetPassword screens since they're now in RootNavigator */}
    </Stack.Navigator>
  );
};

export default AppNavigator;
