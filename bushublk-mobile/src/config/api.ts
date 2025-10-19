import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface NetworkInfo {
  ip: string;
  port: number;
}

// Keep a cached API base URL to avoid repeated discovery
let cachedApiBaseUrl: string | null = null;

// Common IP ranges to try for dynamic discovery
const POTENTIAL_IPS = [
  // Dynamic IP from Expo debugger (will be detected automatically)
  null, // Placeholder for Expo IP
  // Common local network IPs
  '192.168.1.1', '192.168.1.100', '192.168.1.101', '192.168.1.102',
  '192.168.0.1', '192.168.0.100', '192.168.0.101', '192.168.0.102',
  // Corporate network IPs (based on your logs)
  '10.98.151.57', '10.22.165.241',
  // Development fallbacks
  '127.0.0.1', '10.0.2.2', 'localhost',
];

const API_PORT = 5000;

/**
 * Test if a specific API endpoint is reachable
 */
const testApiEndpoint = async (ip: string, port: number): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const response = await fetch(`http://${ip}:${port}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Get the current network IP from Expo debugger
 */
const getExpoDebuggerIP = (): string | null => {
  try {
    const debuggerHost = Constants.expoGoConfig?.debuggerHost || 
                        Constants.manifest?.debuggerHost;
    
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      console.log('🎯 Found Expo debugger IP:', ip);
      return ip;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Dynamically discover the correct API endpoint
 */
const discoverApiEndpoint = async (): Promise<string> => {
  if (cachedApiBaseUrl) {
    console.log('📋 Using cached API URL:', cachedApiBaseUrl);
    return cachedApiBaseUrl;
  }

  console.log('🔍 Starting API endpoint discovery...');
  
  // First try the Expo debugger IP
  const expoIP = getExpoDebuggerIP();
  if (expoIP) {
    console.log('⏳ Testing Expo IP:', expoIP);
    if (await testApiEndpoint(expoIP, API_PORT)) {
      const apiUrl = `http://${expoIP}:${API_PORT}`;
      console.log('✅ Found working API via Expo:', apiUrl);
      cachedApiBaseUrl = apiUrl;
      return apiUrl;
    }
  }

  // Try other potential IPs
  const ipsToTest = [expoIP, ...POTENTIAL_IPS].filter(Boolean) as string[];
  
  for (const ip of ipsToTest) {
    if (ip === expoIP) continue; // Already tested
    
    console.log(`⏳ Testing ${ip}:${API_PORT}...`);
    if (await testApiEndpoint(ip, API_PORT)) {
      const apiUrl = `http://${ip}:${API_PORT}`;
      console.log('✅ Found working API at:', apiUrl);
      cachedApiBaseUrl = apiUrl;
      return apiUrl;
    }
  }

  // Fallback to Expo IP or localhost
  const fallbackIP = expoIP || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  const fallbackUrl = `http://${fallbackIP}:${API_PORT}`;
  console.log('⚠️  No working API found, using fallback:', fallbackUrl);
  
  cachedApiBaseUrl = fallbackUrl;
  return fallbackUrl;
};

const getNetworkInfo = (): NetworkInfo => {
  const expoIP = getExpoDebuggerIP();
  const ip = expoIP || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  return { ip, port: API_PORT };
};

const getApiBaseUrl = (): string => {
  // First priority: Environment variable from .env file
  if (API_URL) {
    console.log('📱 Using API URL from environment variable:', API_URL);
    return API_URL;
  }

  // Fallback to AWS hosted backend
  const awsUrl = 'http://43.205.127.30:5000';
  console.log('🚀 Using AWS Backend URL:', awsUrl);
  return awsUrl;
};

// Initial API base URL
export let API_BASE_URL = getApiBaseUrl();

// Function to dynamically update the API base URL
export const initializeApiConnection = async (): Promise<string> => {
  // Always use the configured API URL from environment variable or fallback
  console.log('🔄 API connection initialized with:', API_BASE_URL);
  return API_BASE_URL;
};

// Export individual endpoints for better organization
export const getApiEndpoints = () => ({
  AUTH: `${API_BASE_URL}/api/auth`,
  PASSENGERS: `${API_BASE_URL}/api/passengers`,
  LOST_FOUND: `${API_BASE_URL}/api/lost-found`,
  ROUTES: `${API_BASE_URL}/api/routes`,
  REGIONS: `${API_BASE_URL}/api/regions`,
});

// Health check function
export const checkApiHealth = async (customUrl?: string): Promise<boolean> => {
  const urlToCheck = customUrl || API_BASE_URL;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${urlToCheck}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('❌ API Health check failed for', urlToCheck, ':', error);
    return false;
  }
};

// Utility to refresh API configuration
export const refreshApiConfiguration = async (): Promise<void> => {
  cachedApiBaseUrl = null;
  await initializeApiConnection();
  console.log('� API configuration refreshed. New URL:', API_BASE_URL);
};

console.log('�📡 API Configuration loaded:', {
  initialBaseUrl: API_BASE_URL,
  isDev: __DEV__,
  platform: Platform.OS,
});
