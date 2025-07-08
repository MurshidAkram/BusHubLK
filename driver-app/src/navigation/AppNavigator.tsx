import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import DriverLoginScreen from "../screens/DriverLoginScreen";
import HomeScreen from "../screens/HomeScreen";
import TravelLogScreen from "../screens/TravelLogScreen";
import DashboardScreen from "../screens/DashboardScreen";
import LostAndFoundScreen from "../screens/LostAndFoundScreen";
import EmergencyScreen from "../screens/EmergencyScreen";
import ConditionScreen from "../screens/ConditionScreen";

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
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: "#1976D2",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen
          name="Login"
          component={DriverLoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: "BusHubLK Driver",
            headerLeft: () => null, // Disable back button on home screen
          }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: "Dashboard" }}
        />
        <Stack.Screen
          name="TravelLog"
          component={TravelLogScreen}
          options={{ title: "Travel Log" }}
        />
        <Stack.Screen
          name="LostAndFound"
          component={LostAndFoundScreen}
          options={{ title: "Lost & Found" }}
        />
        <Stack.Screen
          name="Emergency"
          component={EmergencyScreen}
          options={{ title: "Emergency Report" }}
        />
        <Stack.Screen
          name="Condition"
          component={ConditionScreen}
          options={{ title: "Bus Condition" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
