import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const liveTrackingApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
liveTrackingApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('Requesting:', config.url, 'with params:', config.params);
    } catch (error) {
      console.error('Error getting auth token for live tracking:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
liveTrackingApi.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.config.url, response.data);
    return response;
  },
  async (error) => {
    console.error('Response error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['authToken', 'userData']);
    }
    return Promise.reject(error);
  }
);

// Define API endpoints as constants for easy management
const API_ENDPOINTS = {
  NEARBY_BUSES: '/api/bus-tracking/nearby',
  BUSES_BY_ROUTE: '/api/bus-tracking/route',
};

export const busLiveTrackingAPI = {
  // Fetch nearby buses within a radius (default 5 km)
  getNearbyBuses: async (latitude: number, longitude: number, radiusKm: number = 5) => {
    try {
      const response = await liveTrackingApi.get(API_ENDPOINTS.NEARBY_BUSES, {
        params: { latitude, longitude, radius_km: radiusKm },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch nearby buses:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      throw error;
    }
  },

  // Fetch buses by route number
  getBusesByRouteNumber: async (routeNumber: string) => {
    try {
      const response = await liveTrackingApi.get(`${API_ENDPOINTS.BUSES_BY_ROUTE}/${routeNumber}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch buses by route number:', error.message);
      throw error;
    }
  },
};
