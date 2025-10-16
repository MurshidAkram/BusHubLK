import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  // In development mode (Expo Go), dynamically detect IP
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri || 
                        Constants.manifest?.debuggerHost;
    
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      return `http://${ip}:5000/api`;
    }
    
    // Fallback to localhost if running on simulator
    return 'http://localhost:5000/api';
  }
  
  // For production builds, try to get from app.json extra config
  const configuredApiUrl = Constants.expoConfig?.extra?.apiUrl;
  
  if (configuredApiUrl) {
    console.log('📱 Using configured API URL from app.json');
    return configuredApiUrl;
  }
  
  // Final fallback - try to use the last known development IP
  // This helps if user forgets to configure app.json
  const manifestExtra = Constants.manifest2?.extra?.expoClient?.extra;
  if (manifestExtra?.apiUrl) {
    console.log('📱 Using API URL from manifest');
    return manifestExtra.apiUrl;
  }
  
  // Ultimate fallback - warn user
  console.warn('⚠️ No API URL configured! Please set "extra.apiUrl" in app.json');
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();
console.log('🌐 API Base URL:', API_BASE_URL);
