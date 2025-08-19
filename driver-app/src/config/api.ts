import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  if (__DEV__) {
    // Use the WiFi IP that mobile devices can reach
    return 'http://10.22.166.184:5000/api';
  }
  
  return 'https://your-production-api.com/api';
};

export const API_BASE_URL = getApiBaseUrl();
console.log('🌐 API Base URL:', API_BASE_URL);
