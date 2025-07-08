import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import your existing screens
import HomeScreen from '../screens/HomeScreen';
import RouteScreen from '../screens/RouteScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LostAndFoundScreen from '../screens/LostAndFoundScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import ConditionScreen from '../screens/ConditionScreen';
import TravelLogScreen from '../screens/TravelLogScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingScreen';

// --- 1. Import the new RouteDetailsScreen ---
// Make sure this path is correct for your project structure.
import RouteDetailsScreen from '../screens/RouteDetailsScreen'; 


// Create Stack Navigators for each tab
const HomeStack = createStackNavigator();
const RouteStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const SettingsStack = createStackNavigator();

// This placeholder can be removed if no longer used.
const PlaceholderScreen = ({ title }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
        <Text style={{ marginTop: 10, color: '#666' }}>Coming Soon</Text>
    </View>
);

// --- 2. Update Home Stack Navigator ---
const HomeStackNavigator = () => {
    return (
        <HomeStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <HomeStack.Screen name="HomeMain" component={HomeScreen} />
            {/* Add RouteDetailsScreen to this stack so you can navigate to it from Home */}
            <HomeStack.Screen name="RouteDetails" component={RouteDetailsScreen} />
            <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
            <HomeStack.Screen name="LostAndFound" component={LostAndFoundScreen} />
            <HomeStack.Screen name="Emergency" component={EmergencyScreen} />
            <HomeStack.Screen name="Condition" component={ConditionScreen} />
            <HomeStack.Screen name="TravelLog" component={TravelLogScreen} />
        </HomeStack.Navigator>
    );
};

// --- Other Stack Navigators (No changes here) ---

const RouteStackNavigator = () => {
    return (
        <RouteStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <RouteStack.Screen name="RouteMain" component={RouteScreen} />
        </RouteStack.Navigator>
    );
};

const ProfileStackNavigator = () => {
    return (
        <ProfileStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <ProfileStack.Screen
                name="ProfileMain"
                component={ProfileScreen}
            />
        </ProfileStack.Navigator>
    );
};

const SettingsStackNavigator = () => {
    return (
        <SettingsStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <SettingsStack.Screen
                name="SettingsMain"
                component={SettingsScreen}
            />
        </SettingsStack.Navigator>
    );
};


// --- Main Tab Navigator (No changes here) ---
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Route') {
                        iconName = focused ? 'map' : 'map-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#005A9C',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    height: 60,
                    paddingBottom: 5,
                    paddingTop: 5,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                }
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeStackNavigator}
                options={{ tabBarLabel: 'Home' }}
            />
            <Tab.Screen
                name="Route"
                component={RouteStackNavigator}
                options={{ tabBarLabel: 'Route' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileStackNavigator}
                options={{ tabBarLabel: 'Profile' }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsStackNavigator}
                options={{ tabBarLabel: 'Settings' }}
            />
        </Tab.Navigator>
    );
};
  
export default TabNavigator;