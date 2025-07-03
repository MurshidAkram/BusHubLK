import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import LostAndFoundScreen from '../screens/LostAndFoundScreen';
import TicketFareCalculator from '../screens/TicketFareCalculatorScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import BusTracker from '../screens/BusTrackerScreen';
import BusRouteResultsScreen from '../screens/BusRouteResultsScreen';



const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="LostAndFound" component={LostAndFoundScreen} />
        <Stack.Screen name="FareCalculator" component={TicketFareCalculator} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="BusTracker" component={BusTracker} />
        <Stack.Screen name="BusRouteResults" component={BusRouteResultsScreen} />
        {/* Add other screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}