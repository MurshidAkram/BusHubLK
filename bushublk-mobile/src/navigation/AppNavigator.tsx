import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BusFilterScreen from '../screens/BusFilterByRouteScreen';
import HomeScreen from '../screens/HomeScreen';
import LostAndFoundScreen from '../screens/LostAndFoundScreen';
// Import other screens as needed

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="LostAndFound" component={LostAndFoundScreen} />
        <Stack.Screen name="BusFilter" component={BusFilterScreen} />
        {/* Add other screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}