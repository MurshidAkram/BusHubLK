import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
      // Token expired or invalid, clear storage
      await AsyncStorage.multiRemove(['authToken', 'userData']);
      // You might want to redirect to login screen here
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
    const response = await api.post('/passengers/register', userData);
    return response.data;
  },

  // Passenger login
  loginPassenger: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/passengers/login', credentials);
    return response.data;
  },

  // Get passenger profile
  getPassengerProfile: async () => {
    const response = await api.get('/passengers/profile');
    return response.data;
  },

  // Update passenger profile
  updatePassengerProfile: async (userData: any) => {
    const response = await api.put('/passengers/profile', userData);
    return response.data;
  },

  // Delete passenger account
  deletePassengerAccount: async () => {
    const response = await api.delete('/passengers/account');
    return response.data;
  },
};

// Additional API functions similar to driver-app pattern
export const submitLostAndFoundReport = async (reportData: any) => {
  const response = await fetch(`${API_BASE_URL}/lost-and-found`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
  });
  return response.json();
};

export const submitEmergencyReport = async (reportData: any) => {
  const response = await fetch(`${API_BASE_URL}/emergency-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
  });
  return response.json();
};

export const submitComplaintReport = async (reportData: any) => {
  const response = await fetch(`${API_BASE_URL}/complaint-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
  });
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
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Clear all stored data
  clearStorage: async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userData']);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

export default api;
