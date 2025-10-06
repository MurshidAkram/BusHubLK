import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/api";

// Driver-specific API functions
export const driverAPI = {
  // Driver login
  loginDriver: async (credentials: { email: string; password: string }) => {
    console.log("🔍 API_BASE_URL:", API_BASE_URL);
    console.log("🔍 Full login URL:", `${API_BASE_URL}/driver/login`);
    console.log("🔍 Login credentials:", { email: credentials.email, password: "***" });
    
    try {
      const response = await fetch(`${API_BASE_URL}/driver/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      
      console.log("✅ Response status:", response.status);
      console.log("✅ Response OK:", response.ok);
      
      const data = await response.json();
      console.log("✅ Response data:", data);
      
      return data;
    } catch (error) {
      console.error("❌ Fetch error:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
      throw error;
    }
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

  // Get driver's daily assignment
  getDailyAssignment: async (driverId: string) => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/dailyassignment/driver/${driverId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Get driver's upcoming assignments for schedule view
  getUpcomingAssignments: async (driverId: string, days: number = 7) => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/dailyassignment/driver/${driverId}/upcoming?days=${days}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Send location update to live tracking system
  sendLocationUpdate: async (locationData: {
    latitude: number;
    longitude: number;
    busId: string;
    routeId: string;
    timestamp: string;
    busRegistration?: string;
    speed?: number;
    heading?: number;
    accuracy?: number;
  }) => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/live-tracking/position`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bus_id: parseInt(locationData.busId),
        route_id: parseInt(locationData.routeId),
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        speed: locationData.speed || null,
        heading: locationData.heading || null,
        accuracy: locationData.accuracy || null,
        passenger_count: 0, // Default value, can be updated later
        occupancy_level: "unknown", // Default value
      }),
    });
    return response.json();
  },

  // Get driver's current tracking status
  getTrackingStatus: async () => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/live-tracking/driver/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Update tracking status (active, inactive, break, etc.)
  updateTrackingStatus: async (busId: string, status: string) => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/live-tracking/bus/${busId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return response.json();
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

// Update the fetchBuses function to use driver-specific endpoint
export const fetchBuses = async () => {
  const token = await storageAPI.getAuthToken();
  const response = await fetch(`${API_BASE_URL}/driver/buses`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  // Return the data array from the response
  return result.data || [];
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

// ===============================================
// LIVE BUS TRACKING API (Public endpoints for passengers)
// ===============================================

export const busLiveTrackingAPI = {
  // Get current position of a specific bus
  getBusCurrentPosition: async (busId: string) => {
    const response = await fetch(`${API_BASE_URL}/live-tracking/bus/${busId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  },

  // Get all buses on a specific route
  getBusesOnRoute: async (routeNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/live-tracking/route/${routeNumber}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  },

  // Get all currently active buses
  getAllActiveBuses: async () => {
    const response = await fetch(`${API_BASE_URL}/live-tracking/buses/active`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  },

  // Get nearby buses within specified radius
  getNearbyBuses: async (latitude: number, longitude: number, radiusKm: number = 5) => {
    const response = await fetch(
      `${API_BASE_URL}/live-tracking/buses/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radiusKm}`, 
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.json();
  },
};

// ===============================================
// BUS CONDITION REPORTS API
// ===============================================

export const conditionReportAPI = {
  // Submit a new condition report
  submitReport: async (reportData: any) => {
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

    const result = await response.json();
    return result.data || result;
  },

  // Get all condition reports for a specific bus
  getReportsByBusId: async (busId: string) => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/bus-condition-reports/bus/${busId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  },

  // Get all condition reports by current driver
  getMyReports: async (driverId: string) => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/bus-condition-reports/driver/${driverId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  },

  // Get a specific condition report by ID
  getReportById: async (reportId: string) => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/bus-condition-reports/${reportId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  },

  // Update an existing condition report
  updateReport: async (reportId: string, updateData: any) => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/bus-condition-reports/${reportId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  },

  // Delete a condition report
  deleteReport: async (reportId: string) => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/bus-condition-reports/${reportId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  },
};
