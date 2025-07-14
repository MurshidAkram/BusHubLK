import React from "react";
import { StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";

// Import your screens
import HomeScreen from "../screens/HomeScreen";
import LocationScreen from "../screens/BusTrackerScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import BusTrackingScreen from "../screens/BusTrackerScreen";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // --- This is the main change ---
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          const iconSize = focused ? 30 : 26; // Slightly larger icons

          // Assign icons to routes
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Location") {
            iconName = focused ? "location" : "location-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person-circle" : "person-circle-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return <Icon name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: "#0056b3",
        tabBarInactiveTintColor: "#6C757D",
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Location" component={BusTrackingScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// --- Styles updated for an icon-only bar ---
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#ffffff",
    height: 60, // Reduced height as there are no labels
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
});

export default TabNavigator;
