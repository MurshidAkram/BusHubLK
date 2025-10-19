import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { busLiveTrackingAPI } from '../services/busLiveTrackingAPI';

const ALERT_HISTORY_KEY_PREFIX = 'alertHistoryCleared:';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased from 10s to 15s to handle slow queries
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['authToken', 'userData']);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Passenger registration
  registerPassenger: async (userData: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }) => {
    const response = await api.post('/api/passengers/register', userData);
    return response.data;
  },

  // Passenger login
  loginPassenger: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/api/passengers/login', credentials);
    return response.data;
  },

  // Get passenger profile
  getPassengerProfile: async () => {
    const response = await api.get('/api/passengers/profile');
    return response.data;
  },

  // Update passenger profile
  updatePassengerProfile: async (userData: any) => {
    const response = await api.put('/api/passengers/profile', userData);
    return response.data;
  },

  logout: async () => {
    try {
      await storageAPI.clearStorage();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Failed to logout' };
    }
  },

  // Delete passenger account
  deletePassengerAccount: async () => {
    const response = await api.delete('/api/passengers/account');
    return response.data;
  },
};

// Additional API functions
export const submitLostAndFoundReport = async (reportData: any) => {
  const response = await fetch(`${API_BASE_URL}/api/lost-found`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
  });
  return response.json();
};

export const submitEmergencyReport = async (reportData: any) => {
  const response = await fetch(`${API_BASE_URL}/api/emergency-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
  });
  return response.json();
};

export const submitComplaintReport = async (reportData: any) => {
  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 15000)
  );
  
  const fetchPromise = fetch(`${API_BASE_URL}/api/complaint-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
  });
  
  // Race between fetch and timeout
  const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
  return response.json();
};

export const storageAPI = {
  // Store auth token
  storeAuthToken: async (token: string) => {
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error storing auth token:', error);
    }
  },

  // Get auth token
  getAuthToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      return !!(token && userData);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  // Store user data
  storeUserData: async (userData: any) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  },

  // Get user data
  getUserData: async (): Promise<any | null> => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const parsed = userData ? JSON.parse(userData) : null;
      // Only log when there's actual data or when debugging is needed
      // console.log('[storageAPI.getUserData] userData raw:', userData, 'parsed:', parsed);
      return parsed;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Clear all stored data
  clearStorage: async () => {
    try {
      console.log('Clearing storage...');
      const keys = await AsyncStorage.getAllKeys();
      const historyKeys = keys.filter((key) => key.startsWith(ALERT_HISTORY_KEY_PREFIX));
      const keysToRemove = ['authToken', 'userData', ...historyKeys];
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('Storage cleared successfully');
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },

  setAlertHistoryCleared: async (passengerId: number, cleared: boolean) => {
    try {
      await AsyncStorage.setItem(
        `${ALERT_HISTORY_KEY_PREFIX}${passengerId}`,
        cleared ? 'true' : 'false'
      );
    } catch (error) {
      console.error('Error setting alert history cleared flag:', error);
    }
  },

  getAlertHistoryCleared: async (passengerId: number): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(`${ALERT_HISTORY_KEY_PREFIX}${passengerId}`);
      return value === 'true';
    } catch (error) {
      console.error('Error getting alert history cleared flag:', error);
      return false;
    }
  },

  clearAlertHistoryClearedFlag: async (passengerId: number) => {
    try {
      await AsyncStorage.removeItem(`${ALERT_HISTORY_KEY_PREFIX}${passengerId}`);
    } catch (error) {
      console.error('Error clearing alert history flag:', error);
    }
  },
};

export { busLiveTrackingAPI, API_BASE_URL };

export const complaintAPI = {
  searchBusRoutes: async (query: string, type: 'route' | 'bus' | 'all' = 'all') => {
    const response = await api.get('/api/complaints/bus-routes', {
      params: { query, type },
    });
    return response.data;
  },
  getMyContactInfo: async () => {
    const response = await api.get('/api/complaints/my-contact');
    return response.data;
  },
};

export const notificationAPI = {
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    includeRead?: boolean;
    category?: string;
  }) => {
    const queryParams: Record<string, any> = {};
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.includeRead !== undefined) {
      queryParams.includeRead = params.includeRead ? 'true' : 'false';
    }
    if (params?.category) queryParams.category = params.category;

    const response = await api.get('/api/passenger-notifications', {
      params: queryParams,
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/api/passenger-notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: number) => {
    await api.post(`/api/passenger-notifications/${notificationId}/read`);
  },

  markAllAsRead: async () => {
    await api.post('/api/passenger-notifications/mark-all-read');
  },

  deleteNotification: async (notificationId: number) => {
    await api.delete(`/api/passenger-notifications/${notificationId}`);
  },
};

export default api;