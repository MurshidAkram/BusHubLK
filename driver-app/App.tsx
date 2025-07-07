import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import DriverLoginScreen from "./src/screens/DriverLoginScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#dc2626" />
      <Stack.Navigator
        initialRouteName="DriverLogin"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
