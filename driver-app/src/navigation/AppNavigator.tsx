import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import DriverLoginScreen from "../screens/DriverLoginScreen";
import HomeScreen from "../screens/HomeScreen";

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Dashboard: undefined;
  LostAndFound: undefined;
  Emergency: undefined;
  Condition: undefined;
  TravelLog: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  console.log("AppNavigator rendering...");

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={DriverLoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
