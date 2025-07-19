import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/api";

// Driver-specific API functions
export const driverAPI = {
  // Driver login
  loginDriver: async (credentials: { email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/driver/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  // Get driver profile
  getDriverProfile: async () => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/driver/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Verify token validity
  verifyToken: async () => {
    const token = await storageAPI.getAuthToken();
    if (!token) return { success: false, error: "No token found" };

    try {
      const response = await fetch(`${API_BASE_URL}/driver/verify-token`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.json();
    } catch (error) {
      console.error("Token verification error:", error);
      return { success: false, error: "Token verification failed" };
    }
  },

  // Update driver profile
  updateDriverProfile: async (profileData: any) => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/driver/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    return response.json();
  },

  requestPasswordReset: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/password-reset/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/password-reset/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, newPassword }),
    });
    return response.json();
  },

  // Validate reset token
  validateResetToken: async (token: string) => {
    const response = await fetch(
      `${API_BASE_URL}/password-reset/validate/${token}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.json();
  },

  // Logout
  logout: async () => {
    try {
      await storageAPI.clearStorage();
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: "Failed to logout" };
    }
  },
};

// Storage API functions
export const storageAPI = {
  // Store auth token
  storeAuthToken: async (token: string) => {
    try {
      await AsyncStorage.setItem("driverToken", token);
      console.log("✅ Auth token stored successfully");
    } catch (error) {
      console.error("❌ Error storing auth token:", error);
    }
  },

  // Get auth token
  getAuthToken: async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem("driverToken");
      console.log(
        "🔑 Retrieved token:",
        token ? "Token exists" : "No token found"
      );
      return token;
    } catch (error) {
      console.error("❌ Error getting auth token:", error);
      return null;
    }
  },

  // Check if authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem("driverToken");
      const userData = await AsyncStorage.getItem("driverUser");
      const isAuth = !!(token && userData);
      console.log(
        "🔐 Authentication check:",
        isAuth ? "Authenticated" : "Not authenticated"
      );
      return isAuth;
    } catch (error) {
      console.error("❌ Error checking authentication:", error);
      return false;
    }
  },

  // Store user data
  storeUserData: async (userData: any) => {
    try {
      await AsyncStorage.setItem("driverUser", JSON.stringify(userData));
      console.log("✅ User data stored successfully");
    } catch (error) {
      console.error("❌ Error storing user data:", error);
    }
  },

  // Get user data
  getUserData: async (): Promise<any | null> => {
    try {
      const userData = await AsyncStorage.getItem("driverUser");
      const parsedData = userData ? JSON.parse(userData) : null;
      console.log(
        "👤 Retrieved user data:",
        parsedData ? "User data exists" : "No user data"
      );
      return parsedData;
    } catch (error) {
      console.error("❌ Error getting user data:", error);
      return null;
    }
  },

  // Store login timestamp for session management
  storeLoginTimestamp: async () => {
    try {
      const timestamp = new Date().toISOString();
      await AsyncStorage.setItem("driverLoginTimestamp", timestamp);
      console.log("⏰ Login timestamp stored:", timestamp);
    } catch (error) {
      console.error("❌ Error storing login timestamp:", error);
    }
  },

  // Get login timestamp
  getLoginTimestamp: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem("driverLoginTimestamp");
    } catch (error) {
      console.error("❌ Error getting login timestamp:", error);
      return null;
    }
  },

  // Store settings
  saveSettings: async (settings: any) => {
    try {
      await AsyncStorage.setItem("driverSettings", JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  },

  // Get settings
  getSettings: async (): Promise<any | null> => {
    try {
      const settings = await AsyncStorage.getItem("driverSettings");
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error("Error getting settings:", error);
      return null;
    }
  },

  // Clear cache (keep auth data)
  clearCache: async () => {
    try {
      const keysToRemove = ["driverCache", "tempData", "routeCache"];
      await AsyncStorage.multiRemove(keysToRemove);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  },

  // Clear all stored data
  clearStorage: async () => {
    try {
      await AsyncStorage.multiRemove([
        "driverToken",
        "driverUser",
        "driverLoginTimestamp",
        "driverSettings",
        "driverCache",
        "tempData",
        "routeCache",
      ]);
      console.log("🗑️ All storage cleared");
    } catch (error) {
      console.error("❌ Error clearing storage:", error);
    }
  },
};

// Keep your existing report functions
export const submitLostAndFoundReport = async (reportData: any) => {
  const token = await storageAPI.getAuthToken();
  const response = await fetch(`${API_BASE_URL}/lost-and-found`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reportData),
  });
  return response.json();
};

export const submitEmergencyReport = async (reportData: any) => {
  const token = await storageAPI.getAuthToken();
  const response = await fetch(`${API_BASE_URL}/emergency-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reportData),
  });
  return response.json();
};

// Update the fetchBuses function
export const fetchBuses = async () => {
  const token = await storageAPI.getAuthToken();
  const response = await fetch(`${API_BASE_URL}/buses`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Update the submitConditionReport function
export const submitConditionReport = async (reportData: any) => {
  const token = await storageAPI.getAuthToken();
  const response = await fetch(`${API_BASE_URL}/bus-condition-reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reportData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
