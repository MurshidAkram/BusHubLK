import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import { storageAPI } from "../services/api";

const Stack = createStackNavigator();

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();

    // Check auth status periodically to detect login/logout
    const interval = setInterval(checkAuthStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Fix: Use getAuthToken instead of getToken
      const token = await storageAPI.getAuthToken();
      const newAuthState = !!token;

      if (newAuthState !== isAuthenticated) {
        setIsAuthenticated(newAuthState);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
    } finally {
      if (isLoading) {
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return null; // You can return a loading screen component here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="App" component={AppNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
