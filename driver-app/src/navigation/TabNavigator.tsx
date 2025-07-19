import React from "react";
import { View, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

// Import screens
import HomeScreen from "../screens/HomeScreen";
import DashboardScreen from "../screens/DashboardScreen";
import LostAndFoundScreen from "../screens/LostAndFoundScreen";
import EmergencyScreen from "../screens/EmergencyScreen";
import ConditionScreen from "../screens/ConditionScreen";
import TravelLogScreen from "../screens/TravelLogScreen";
import TrackingScreen from "../screens/TrackingScreen";

import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingScreen";
import MapScreen from "../screens/MapScreen";
import ScheduleScreen from "../screens/ScheduleScreen";

// Create Stack Navigators for each tab
const HomeStack = createStackNavigator();
const ScheduleStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const SettingsStack = createStackNavigator();

// Placeholder screen (kept for future use)
const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text style={{ fontSize: 18, fontWeight: "bold" }}>{title}</Text>
    <Text style={{ marginTop: 10, color: "#666" }}>Coming Soon</Text>
  </View>
);


// Home Stack Navigator
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="LostAndFound" component={LostAndFoundScreen} />
      <HomeStack.Screen name="Emergency" component={EmergencyScreen} />
      <HomeStack.Screen name="Condition" component={ConditionScreen} />
      <HomeStack.Screen name="TravelLog" component={TravelLogScreen} />
      <HomeStack.Screen name="Tracking" component={TrackingScreen} />
      <HomeStack.Screen name="ProfileModal" component={ProfileScreen} />
      <HomeStack.Screen name="MapScreen" component={MapScreen} />

    </HomeStack.Navigator>
  );
};


// Schedule Stack Navigator
const ScheduleStackNavigator = () => {

  return (
    <ScheduleStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ScheduleStack.Screen name="ScheduleMain" component={ScheduleScreen} />
    </ScheduleStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
};

// Settings Stack Navigator
const SettingsStackNavigator = () => {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >

      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />

    </SettingsStack.Navigator>
  );
};

const Tab = createBottomTabNavigator();

// Main Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Schedule") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          } else {
            iconName = "help-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#005A9C",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleStackNavigator}
        options={{ tabBarLabel: "Schedule" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: "Profile" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{ tabBarLabel: "Settings" }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;