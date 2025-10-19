import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

// Import the Tab Navigator
import TabNavigator from "./TabNavigator";

// Import other screens
import LostAndFoundScreen from "../screens/LostAndFoundScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import BusTracker from "../screens/BusTrackingScreen";
import BusRouteResultsScreen from "../screens/BusRouteResultsScreen";
import BusOccupancyScreen from "../screens/BusOccupancyScreen";
import ComplaintsScreen from "../screens/ComplaintsScreen";
import ComplaintHistoryScreen from "../screens/ComplaintHistoryScreen";
import EmergencyScreen from "../screens/EmergencyAlertScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import TermsOfServiceScreen from "../screens/TermsOfServiceScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";

const Stack = createStackNavigator<any>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{ headerShown: false }}
    >
      {/* The Bottom Tab Navigator */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* Other screens that will be pushed on top of the tabs */}
      <Stack.Screen name="LostAndFound" component={LostAndFoundScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
  <Stack.Screen name="BusTracking" component={BusTracker} />
      <Stack.Screen
        name="Complaints"
        component={ComplaintsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ComplaintHistory"
        component={ComplaintHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="BusRouteResults" component={BusRouteResultsScreen} />
      <Stack.Screen name="BusOccupancy" component={BusOccupancyScreen} />
      <Stack.Screen
        name="Emergency"
        component={EmergencyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
