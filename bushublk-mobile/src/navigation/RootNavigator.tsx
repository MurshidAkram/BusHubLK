import React, { useState, useEffect, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import { storageAPI } from "../services/api";

const Stack = createStackNavigator();

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeApp = useCallback(async () => {
    try {
      console.log("🚀 Initializing app...");

      // Force clear all storage on app start
      await storageAPI.clearStorage();
      console.log("✅ Storage cleared");

      // Verify storage is empty
      const token = await storageAPI.getAuthToken();
      const userData = await storageAPI.getUserData();

      console.log("Token after clear:", token);
      console.log("UserData after clear:", userData);

      setIsAuthenticated(false);
      setIsInitialized(true);

      console.log("🎯 App initialized - showing login screen");
    } catch (error) {
      console.error("Error initializing app:", error);
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
          "🔄 Auth state changed:",
          isAuthenticated,
          "->",
          newAuthState
        );
        setIsAuthenticated(newAuthState);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
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

  // Show nothing until app is initialized
  if (!isInitialized) {
    console.log("⏳ App not initialized yet...");
    return null;
  }

  console.log("🎨 Rendering with isAuthenticated:", isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="App" component={AppNavigator} key="app-screen" />
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            key="auth-screen"
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
