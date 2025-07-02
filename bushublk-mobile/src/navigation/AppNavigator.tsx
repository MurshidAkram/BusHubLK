import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BusFilterScreen from '../screens/BusFilterByRouteScreen';
import HomeScreen from '../screens/HomeScreen';
import LostAndFoundScreen from '../screens/LostAndFoundScreen';
//import TicketFareCalculator from '../screens/TicketFareCalculatorScreen';



const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="LostAndFound" component={LostAndFoundScreen} />
        <Stack.Screen name="BusFilter" component={BusFilterScreen} />
        {/* <Stack.Screen name="FareCalculator" component={TicketFareCalculator} /> */}
        {/* Add other screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}