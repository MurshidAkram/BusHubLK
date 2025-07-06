import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import the Tab Navigator
import TabNavigator from './TabNavigator'; 

// Import other screens
import LostAndFoundScreen from '../screens/LostAndFoundScreen';
//import TicketFareCalculator from '../screens/TicketFareCalculatorScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import BusTracker from '../screens/BusTrackerScreen';
import BusRouteResultsScreen from '../screens/BusRouteResultsScreen';
import BusOccupancyScreen from '../screens/BusOccupancyScreen';
import ComplaintsScreen from "../screens/ComplaintsScreen"; 
import EmergencyScreen from '../screens/EmergencyAlertScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Main" 
        screenOptions={{ headerShown: false }}
      >
        {/* The Bottom Tab Navigator is now a screen in the stack */}
        <Stack.Screen name="Main" component={TabNavigator} />
        
        {/* Other screens that will be pushed on top of the tabs */}
        <Stack.Screen name="LostAndFound" component={LostAndFoundScreen} />
        {/* <Stack.Screen name="FareCalculator" component={TicketFareCalculator} /> */}
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="BusTracker" component={BusTracker} />
        <Stack.Screen                  // <-- ADD THIS BLOCK
          name="Complaints"
          component={ComplaintsScreen}
          options={{ headerShown: false }} // Our screen has its own header
        />
        <Stack.Screen name="BusRouteResults" component={BusRouteResultsScreen} />
        <Stack.Screen name="BusOccupancy" component={BusOccupancyScreen} />
         <Stack.Screen 
          name="Emergency" 
          component={EmergencyScreen} 
          options={{ headerShown: false }} // The screen has its own header
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}