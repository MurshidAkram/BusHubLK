import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getDynamicBaseURL = () => {
  if (__DEV__) {
    // For Expo development
    const debuggerHost = Constants.expoConfig?.hostUri 
      || Constants.manifest?.debuggerHost 
      || Constants.manifest2?.extra?.expoGo?.debuggerHost;

    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      return Platform.select({
        // Android emulator needs special handling
        android: `http://10.0.2.2:5000`,
        // iOS and physical devices use the actual IP
        ios: `http://${host}:5000`,
        default: `http://${host}:5000`,
      });
    }
  }
  
  // Production URL - replace with your actual production URL
  return 'https://your-production-url.com';
};

export const API_CONFIG = {
  baseURL: getDynamicBaseURL(),
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};
