import React, { useState, useEffect, useCallback, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import DriverLoginScreen from "../screens/DriverLoginScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import NotificationScreen from "../screens/NotificationScreen";
import TabNavigator from "./TabNavigator";
import { storageAPI, setSessionExpiredHandler } from "../services/api";
import { deepLinkService } from "../services/deepLinkHandler";
import { locationService } from "../services/locationService";
import { DriverProvider } from "../context/DriverContext";
import { NotificationProvider } from "../context/NotificationContext";
import { SessionProvider } from "../context/SessionContext";

const Stack = createStackNavigator();

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [trackingManagementInitialized, setTrackingManagementInitialized] = useState(false);
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

  // Start/stop location tracking based on auth state (only run once on initial load)
  useEffect(() => {
    async function manageLocationTracking() {
      // Don't manage location tracking until app is properly initialized
      if (!isInitialized || trackingManagementInitialized) {
        return;
      }

      console.log("🔧 Initializing location tracking management...");
      
      if (isAuthenticated) {
        const userData = await storageAPI.getUserData();
        if (userData && userData.busId && userData.routeId) {
          // Check if there's an active assignment that should be tracking
          const hasActiveTracking = await checkShouldStartTracking(userData);
          
          if (hasActiveTracking) {
            console.log("🚍 Resuming location tracking for bus:", userData.busId, "route:", userData.routeId);
            
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
            console.log("🛑 No active schedule or tracking manually stopped - not auto-starting tracking");
          }
        } else {
          console.warn("Bus ID or Route ID missing in user data - no active daily assignment");
        }
      }
      
      setTrackingManagementInitialized(true);
    }
    manageLocationTracking();
  }, [isAuthenticated, isInitialized, trackingManagementInitialized]);

  // Handle logout cleanup
  useEffect(() => {
    if (!isAuthenticated && trackingManagementInitialized) {
      console.log("🛑 User logged out - stopping all location tracking");
      locationService.stopLocationTracking();
    }
  }, [isAuthenticated, trackingManagementInitialized]);

  // Function to check if tracking should auto-start
  const checkShouldStartTracking = async (userData: any): Promise<boolean> => {
    try {
      // Check if user has manually started tracking from ScheduleScreen
      const backgroundService = await import('../services/backgroundLocationService');
      const isCurrentlyTracking = await backgroundService.default.isTrackingActive();
      
      if (isCurrentlyTracking) {
        console.log("📍 Tracking already active - keeping it running");
        return true;
      }

      // Only auto-start if there was a previous active session and the schedule is today
      if (userData.assignmentId) {
        // Check if assignment is for today
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // For now, don't auto-start tracking on app open
        // Tracking should only be started manually from ScheduleScreen
        console.log("🔒 Tracking must be manually started from Schedule screen");
        return false;
      }

      return false;
    } catch (error) {
      console.error("Error checking tracking status:", error);
      return false;
    }
  };

  // Setup deep link handling
  useEffect(() => {
    if (navigationRef.current) {
      deepLinkService.setNavigation(navigationRef.current);
      const cleanup = deepLinkService.setupDeepLinkListener();
      return cleanup;
    }
  }, [navigationRef.current]);

  // Handle session expiration
  const handleSessionExpired = useCallback(async () => {
    console.log("🔒 Session expired - logging out user");
    await storageAPI.clearStorage();
    locationService.stopLocationTracking();
    setIsAuthenticated(false);
  }, []);

  // Set up session expiration handler
  useEffect(() => {
    setSessionExpiredHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  // Show nothing until app is initialized
  if (!isInitialized) {
    console.log("⏳ Driver app not initialized yet...");
    return null;
  }

  return (
    <SessionProvider onSessionExpired={handleSessionExpired}>
      <DriverProvider>
        <NotificationProvider>
          <NavigationContainer ref={navigationRef}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {isAuthenticated ? (
                <>
                  <Stack.Screen
                    name="Main"
                    component={TabNavigator}
                    key="main-screen"
                  />
                  <Stack.Screen
                    name="Notifications"
                    component={NotificationScreen}
                    key="notifications-screen"
                  />
                  <Stack.Screen
                    name="ForgotPassword"
                    component={ForgotPasswordScreen}
                    key="forgot-password-screen"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="ResetPassword"
                    component={ResetPasswordScreen}
                    key="reset-password-screen"
                  />
                </>
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
        </NotificationProvider>
      </DriverProvider>
    </SessionProvider>
  );
}
