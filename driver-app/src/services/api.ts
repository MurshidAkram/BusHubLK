import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// Driver-specific API functions
export const driverAPI = {
  // Driver login
  loginDriver: async (credentials: { email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/driver/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  // Get driver profile
  getDriverProfile: async () => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/driver/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Update driver profile
  updateDriverProfile: async (profileData: any) => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/driver/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    return response.json();
  },

  // Logout
  logout: async () => {
    try {
      await storageAPI.clearStorage();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Failed to logout' };
    }
  },
};

// Storage API functions
export const storageAPI = {
  // Store auth token
  storeAuthToken: async (token: string) => {
    try {
      await AsyncStorage.setItem('driverToken', token);
    } catch (error) {
      console.error('Error storing auth token:', error);
    }
  },

  // Get auth token
  getAuthToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('driverToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  // Check if authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('driverToken');
      const userData = await AsyncStorage.getItem('driverUser');
      return !!(token && userData);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  // Store user data
  storeUserData: async (userData: any) => {
    try {
      await AsyncStorage.setItem('driverUser', JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  },

  // Get user data
  getUserData: async (): Promise<any | null> => {
    try {
      const userData = await AsyncStorage.getItem('driverUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Store settings
  saveSettings: async (settings: any) => {
    try {
      await AsyncStorage.setItem('driverSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  // Get settings
  getSettings: async (): Promise<any | null> => {
    try {
      const settings = await AsyncStorage.getItem('driverSettings');
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  },

  // Clear cache (keep auth data)
  clearCache: async () => {
    try {
      const keysToRemove = ['driverCache', 'tempData', 'routeCache'];
      await AsyncStorage.multiRemove(keysToRemove);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  // Clear all stored data
  clearStorage: async () => {
    try {
      await AsyncStorage.multiRemove([
        'driverToken', 
        'driverUser', 
        'driverSettings',
        'driverCache',
        'tempData',
        'routeCache'
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

// Keep your existing report functions
export const submitLostAndFoundReport = async (reportData: any) => {
  const token = await storageAPI.getAuthToken();
  const response = await fetch(`${API_BASE_URL}/lost-and-found`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(reportData),
  });
  return response.json();
};

export const submitEmergencyReport = async (reportData: any) => {
  const token = await storageAPI.getAuthToken();
  const response = await fetch(`${API_BASE_URL}/emergency-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(reportData),
  });
  return response.json();
};

export const submitConditionReport = async (reportData: any) => {
  const token = await storageAPI.getAuthToken();
  const response = await fetch(`${API_BASE_URL}/condition-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(reportData),
  });
  return response.json();
};

export const submitTravelLog = async (logData: any) => {
  const token = await storageAPI.getAuthToken();
  const response = await fetch(`${API_BASE_URL}/travel-log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(logData),
  });
  return response.json();
};
