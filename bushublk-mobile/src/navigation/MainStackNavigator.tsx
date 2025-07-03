import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import BusRouteResultsScreen from '../screens/BusRouteResultsScreen';
import BusTrackerScreen from '../screens/BusTrackerScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import BusOccupancyScreen from '../screens/BusOccupancyScreen';
// ...import other screens as needed

const Stack = createStackNavigator();

export default function MainStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="BusRouteResults" component={BusRouteResultsScreen} />
      <Stack.Screen name="BusTracker" component={BusTrackerScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="BusOccupancy" component={BusOccupancyScreen} />
      {/* Add more stack screens as needed */}
    </Stack.Navigator>
  );
}