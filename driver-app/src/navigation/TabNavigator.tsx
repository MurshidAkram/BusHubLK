import React from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- Import all your screens ---
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
import ChatScreen from "../screens/ChatScreen";
import NotificationTestScreen from "../screens/NotificationTestScreen";

// Create Stack Navigators for each tab
const HomeStack = createStackNavigator();
const ScheduleStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const SettingsStack = createStackNavigator();

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
      <HomeStack.Screen name="ChatScreen" component={ChatScreen} />
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
      <SettingsStack.Screen name="NotificationTest" component={NotificationTestScreen} />
    </SettingsStack.Navigator>
  );
};

const Tab = createBottomTabNavigator();

// Main Tab Navigator
const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  
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

          return <Ionicons name={iconName} size={focused ? 26 : 24} color={color} />;
        },
        tabBarActiveTintColor: "#005A9C",
        tabBarInactiveTintColor: "#8e8e93",
        tabBarStyle: {
          ...styles.tabBar,
          height: Platform.OS === 'android' ? 70 + insets.bottom : 85 + insets.bottom,
          paddingBottom: Platform.OS === 'android' ? 
            Math.max(insets.bottom, 10) : 
            Math.max(insets.bottom, 20),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: Platform.OS === 'android' ? 0 : 2,
        },
        tabBarItemStyle: {
          paddingTop: Platform.OS === 'android' ? 8 : 5,
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

// Styles for better Android compatibility
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e1e1e1",
    paddingHorizontal: 0,
    ...Platform.select({
      android: {
        elevation: 8,
        shadowColor: "#000",
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
  },
});

export default TabNavigator;