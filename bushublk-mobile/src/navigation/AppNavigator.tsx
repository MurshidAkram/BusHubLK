import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MainStackNavigator from './MainStackNavigator';
import LostAndFoundScreen from '../screens/LostAndFoundScreen';
import BusOccupancyScreen from '../screens/BusOccupancyScreen';
// ...import other screens as needed

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator screenOptions={{ headerShown: false }}>
        <Drawer.Screen name="HomeStack" component={MainStackNavigator} options={{ title: 'Home' }} />
        <Drawer.Screen name="Lost & Found" component={LostAndFoundScreen} />
        <Drawer.Screen name="Bus Occupancy" component={BusOccupancyScreen} />
        {/* Add other drawer screens as needed */}
      </Drawer.Navigator>
    </NavigationContainer>
  );
}