// navigators/TabNavigator.js
import React from 'react';
// Import 'View' from react-native
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MainStackNavigator from './MainStackNavigator';
import RouteScreen from '../screens/RouteScreen';

// You can create these placeholder screens for now
// This component now has access to the 'View' component
const PlaceholderScreen = () => <View />;

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeStack') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'RouteTab') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#005A9C',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
            height: 60,
            paddingBottom: 5,
        }
      })}
    >
      <Tab.Screen
        name="HomeStack"
        component={MainStackNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="RouteTab"
        component={RouteScreen}
        options={{ tabBarLabel: 'Route' }}
      />
      <Tab.Screen
        name="Profile"
        component={PlaceholderScreen} // This will now work correctly
      />
      <Tab.Screen
        name="Settings"
        component={PlaceholderScreen} // This will now work correctly
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;