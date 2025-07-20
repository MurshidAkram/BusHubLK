import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  if (__DEV__) {
    // For Expo Go development
    const debuggerHost = Constants.expoConfig?.hostUri || 
                        Constants.manifest?.debuggerHost;
    
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      return `http://${ip}:5000`;
    }
    
    // Fallback to localhost if running on simulator
    return 'http://localhost:5000';
  }
  
  // Production URL
  return 'https://your-production-api.com';
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to check network connection
api.interceptors.request.use(async (config) => {
  const netInfo = await NetInfo.fetch();
  
  if (!netInfo.isConnected) {
    throw new Error('No internet connection');
  }
  
  console.log(`🌐 Making request to: ${config.baseURL}${config.url}`);
  return config;
});

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error(`❌ Error from ${error.config?.url}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
);

export const testConnection = async () => {
  try {
    const response = await api.get('/api/test');
    console.log('API Connection test successful:', response.data);
    return true;
  } catch (error) {
    console.error('API Connection test failed:', error);
    return false;
  }
};

export default api;
