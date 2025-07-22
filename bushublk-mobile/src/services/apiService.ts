import axios from 'axios';
import { busLiveTrackingAPI } from '../services/busLiveTrackingAPI';
import { API_BASE_URL } from '../config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log('🚀 Request:', {
      method: config.method,
      url: config.url,
      params: config.params,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

// Define API endpoints as constants
const API_ENDPOINTS = {
  ROUTES_SEARCH: '/api/routes/search',
  PLACE_DETAILS: '/api/routes/place-details',
};

interface BusRoute {
  bus_route_id: number;
  bus_id: number;
  route_id: number;
  registration_number: string;
  bus_type: string;
  operator: string;
  route_number: string;
  route_name: string;
  start_location: string;
  end_location: string;
  distance: number;
}

interface RouteSearchResponse {
  routes: Array<{
    distance: number;
    estimated_duration: string;
    polyline: string;
    fare: number;
    segment_distance: number;
  }>;
  available_bus_routes: BusRoute[];
  from_coordinates: { lat: number; lng: number };
  to_coordinates: { lat: number; lng: number };
}

const apiService = {
  // Search for routes between two locations
  searchRoutes: async (from: string, to: string): Promise<RouteSearchResponse> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ROUTES_SEARCH, {
        params: { from, to }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search routes:', error);
      throw error;
    }
  },

  // Get place details by place ID
  getPlaceDetails: async (placeId: string) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.PLACE_DETAILS}/${placeId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get place details:', error);
      throw error;
    }
  },

  // Get route info (for backward compatibility)
  getRouteInfo: async (fromPlaceId: string, toPlaceId: string) => {
    try {
      const fromPlace = await apiService.getPlaceDetails(fromPlaceId);
      const toPlace = await apiService.getPlaceDetails(toPlaceId);
      
      if (!fromPlace || !toPlace) {
        throw new Error('Could not get place details');
      }
      
      const fromLocation = fromPlace.formatted_address || fromPlace.name;
      const toLocation = toPlace.formatted_address || toPlace.name;
      
      return await apiService.searchRoutes(fromLocation, toLocation);
    } catch (error) {
      console.error('Failed to get route info:', error);
      throw error;
    }
  },

  // Fetch nearby buses
  getNearbyBuses: async (latitude: number, longitude: number, radiusKm: number = 5) => {
    return await busLiveTrackingAPI.getNearbyBuses(latitude, longitude, radiusKm);
  },
};

export default apiService;
