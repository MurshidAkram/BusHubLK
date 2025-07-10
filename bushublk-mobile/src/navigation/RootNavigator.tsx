import React, { useState, useEffect, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import { storageAPI } from "../services/api";

const Stack = createStackNavigator();

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await storageAPI.getAuthToken();
      const userData = await storageAPI.getUserData();
      const newAuthState = !!(token && userData);

      

      // Force state update
      setIsAuthenticated((prevState) => {
        if (prevState !== newAuthState) {
          console.log("🔄 Auth state updated:", prevState, "->", newAuthState);
        }
        return newAuthState;
      });
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkAuthStatus();

    const interval = setInterval(checkAuthStatus, 1000); // Even more frequent
    return () => clearInterval(interval);
  }, [checkAuthStatus]);

 

  if (isLoading) {
    return null;
  }

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
