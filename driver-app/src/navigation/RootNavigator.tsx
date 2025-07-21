import React, { useState, useEffect, useCallback, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import DriverLoginScreen from "../screens/DriverLoginScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import TabNavigator from "./TabNavigator";
import { storageAPI } from "../services/api";
import { deepLinkService } from "../services/deepLinkHandler";
import { locationService } from "../services/locationService";

const Stack = createStackNavigator();

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigationRef = useRef(null);

  const initializeApp = useCallback(async () => {
    try {
      console.log("🚀 Initializing driver app...");

      // Removed clearing storage to enable persistent login
      // await storageAPI.clearStorage();
      // console.log("✅ Driver storage cleared");

      // Verify stored token and user data
      const token = await storageAPI.getAuthToken();
      const userData = await storageAPI.getUserData();

      const authState = !!(token && userData);
      setIsAuthenticated(authState);
      setIsInitialized(true);
      
      console.log(`✅ Driver app initialized - authenticated: ${authState}`);
    } catch (error) {
      console.error("Error initializing driver app:", error);
      setIsAuthenticated(false);
      setIsInitialized(true);
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    if (!isInitialized) return;

    try {
      const token = await storageAPI.getAuthToken();
      const userData = await storageAPI.getUserData();
      const newAuthState = !!(token && userData);

      if (newAuthState !== isAuthenticated) {
        console.log(
          "🔄 Driver auth state changed:",
          isAuthenticated,
          "->",
          newAuthState
        );
        setIsAuthenticated(newAuthState);
      }
    } catch (error) {
      console.error("Error checking driver auth status:", error);
      setIsAuthenticated(false);
    }
  }, [isAuthenticated, isInitialized]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(checkAuthStatus, 1000);
    return () => clearInterval(interval);
  }, [checkAuthStatus, isInitialized]);

  // Start/stop location tracking based on auth state
  useEffect(() => {
    async function manageLocationTracking() {
      // Don't manage location tracking until app is properly initialized
      if (!isInitialized) {
        return;
      }

      if (isAuthenticated) {
        const userData = await storageAPI.getUserData();
        if (userData && userData.busId && userData.routeId) {
          console.log("🚍 Starting background location tracking for bus:", userData.busId, "route:", userData.routeId);
          
          // Set assignment data in location service if available
          if (userData.assignmentId) {
            locationService.setCurrentAssignment({
              bus_id: parseInt(userData.busId),
              route_id: parseInt(userData.routeId),
              driver_id: userData.driver_id,
              assignment_id: userData.assignmentId
            });
          }
          
          locationService.startSmartLocationTracking(userData.busId, userData.routeId, userData.busRegistration);
        } else {
          console.warn("Bus ID or Route ID missing in user data - no active daily assignment");
        }
      } else {
        // Only log and stop tracking if we were previously authenticated (not during initial load)
        if (isInitialized) {
          console.log("🛑 Stopping location tracking due to logout");
          locationService.stopLocationTracking();
        }
      }
    }
    manageLocationTracking();
  }, [isAuthenticated, isInitialized]);

  // Setup deep link handling
  useEffect(() => {
    if (navigationRef.current) {
      deepLinkService.setNavigation(navigationRef.current);
      const cleanup = deepLinkService.setupDeepLinkListener();
      return cleanup;
    }
  }, [navigationRef.current]);

  // Show nothing until app is initialized
  if (!isInitialized) {
    console.log("⏳ Driver app not initialized yet...");
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            key="main-screen"
          />
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={DriverLoginScreen}
              key="login-screen"
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              key="forgot-password-screen"
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              key="reset-password-screen"
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
