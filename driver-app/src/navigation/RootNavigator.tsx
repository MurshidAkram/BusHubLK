import React, { useState, useEffect, useCallback, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Linking } from "react-native";
import DriverLoginScreen from "../screens/DriverLoginScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import TabNavigator from "./TabNavigator";
import { storageAPI } from "../services/api";
import { deepLinkService } from "../services/deepLinkHandler";

const Stack = createStackNavigator();

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigationRef = useRef<any>();

  const initializeApp = useCallback(async () => {
    try {
      console.log("🚀 Initializing driver app...");

      // Force clear all storage on app start to always show login screen
      await storageAPI.clearStorage();
      console.log("✅ Driver storage cleared");

      // Verify storage is empty
      const token = await storageAPI.getAuthToken();
      const userData = await storageAPI.getUserData();

      console.log("Driver token after clear:", token);
      console.log("Driver userData after clear:", userData);

      setIsAuthenticated(false);
      setIsInitialized(true);

      console.log("🎯 Driver app initialized - showing login screen");
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

  // Handle deep links
  const handleDeepLink = useCallback((url: string) => {
    console.log("🔗 Handling deep link:", url);

    if (url.includes("reset-password")) {
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get("token");

      if (token && navigationRef.current) {
        // Navigate to password reset screen with token
        navigationRef.current.navigate("ResetPassword", { token });
      }
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(checkAuthStatus, 1000);
    return () => clearInterval(interval);
  }, [checkAuthStatus, isInitialized]);

  // Setup deep link handling
  useEffect(() => {
    // Handle app launch from deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("🚀 App launched with deep link:", url);
        handleDeepLink(url);
      }
    });

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener("url", ({ url }) => {
      console.log("📱 Deep link received while app running:", url);
      handleDeepLink(url);
    });

    return () => subscription?.remove();
  }, [handleDeepLink]);

  // Show nothing until app is initialized
  if (!isInitialized) {
    console.log("⏳ Driver app not initialized yet...");
    return null;
  }

  console.log("🎨 Driver app rendering with isAuthenticated:", isAuthenticated);

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
