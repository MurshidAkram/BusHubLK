import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

class ApiService {
  private static instance: ApiService;
  private api: AxiosInstance;

  private constructor() {
    this.api = axios.create({
      baseURL: this.getBaseUrl(),
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for logging
    this.api.interceptors.request.use(
      config => {
        console.log('🚀 Request:', {
          url: config.url,
          method: config.method,
          data: config.data,
          params: config.params
        });
        return config;
      },
      error => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.api.interceptors.response.use(
      response => {
        console.log('✅ Response:', {
          url: response.config.url,
          status: response.status,
          data: response.data
        });
        return response;
      },
      error => {
        console.error('❌ Response Error:', {
          url: error.config?.url,
          message: error.message,
          response: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  private getBaseUrl(): string {
    if (__DEV__) {
      // Get the debug host from Expo config
      const debuggerHost = Constants.expoConfig?.hostUri 
        || Constants.manifest?.debuggerHost 
        || Constants.manifest2?.extra?.expoGo?.debuggerHost;

      if (debuggerHost) {
        const host = debuggerHost.split(':')[0];
        if (Platform.OS === 'android') {
          // Android emulator needs special handling
          return 'http://10.0.2.2:5000';
        }
        // iOS and physical devices use the actual IP
        return `http://${host}:5000`;
      }
    }
    
    // Production URL - replace with your actual production URL
    return 'https://your-production-url.com';
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public async getAvailableRoutes(from: string, to: string) {
    try {
      const response = await this.api.get('/api/routes/available', {
        params: { from, to }
      });
      return response.data.success ? response.data.routes : [];
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      throw error;
    }
  }

  public async testConnection() {
    try {
      const response = await this.api.get('/api/test');
      return response.data;
    } catch (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
  }

  public async getPlaceDetails(placeId: string) {
    try {
      const response = await this.api.get(`/api/places/${placeId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get place details:', error);
      throw error;
    }
  }

  public async getRouteInfo(fromPlaceId: string, toPlaceId: string) {
    try {
      const response = await this.api.get('/api/routes/info', {
        params: { from: fromPlaceId, to: toPlaceId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get route info:', error);
      throw error;
    }
  }

  public async searchRoutes(from: string, to: string) {
    try {
      const response = await this.api.get('/api/routes/search', {
        params: { from, to }
      });
      if (response.data.success) {
        return response.data.routes;
      }
      return [];
    } catch (error) {
      console.error('Failed to search routes:', error);
      throw error;
    }
  }
}

export const apiService = ApiService.getInstance();
export default apiService;
