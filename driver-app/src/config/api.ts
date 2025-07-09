import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  if (__DEV__) {
    const debuggerHost = Constants.expoGoConfig?.debuggerHost || 
                        Constants.manifest?.debuggerHost;
    
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      return `http://${ip}:5000/api`;
    }
  }
  
  return 'https://your-production-api.com/api';
};

export const API_BASE_URL = getApiBaseUrl();
console.log('🌐 API Base URL:', API_BASE_URL);
