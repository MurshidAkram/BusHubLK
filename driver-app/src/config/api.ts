import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface NetworkInfo {
  ip: string;
  port: number;
}

// Get API_URL from app.json extra config or environment variables
const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;

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
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    console.log(`⏳ Driver App: Testing API endpoint: http://${ip}:${port}/api/health`);

    const response = await fetch(`http://${ip}:${port}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const isOk = response.ok;
    console.log(`✅ Driver App: API endpoint test result for ${ip}:${port}: ${isOk ? 'SUCCESS' : 'FAILED'}`);
    return isOk;
  } catch (error: any) {
    console.log(`❌ Driver App: API endpoint test failed for ${ip}:${port}:`, error?.message || 'Unknown error');
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
      console.log('🎯 Driver App: Found Expo debugger IP:', ip);
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
    console.log('📋 Driver App: Using cached API URL:', cachedApiBaseUrl);
    return cachedApiBaseUrl;
  }

  console.log('🔍 Driver App: Starting API endpoint discovery...');

  // First try the Expo debugger IP
  const expoIP = getExpoDebuggerIP();
  if (expoIP) {
    console.log('⏳ Driver App: Testing Expo IP:', expoIP);
    if (await testApiEndpoint(expoIP, API_PORT)) {
      const apiUrl = `http://${expoIP}:${API_PORT}`;
      console.log('✅ Driver App: Found working API via Expo:', apiUrl);
      cachedApiBaseUrl = apiUrl;
      return apiUrl;
    }
  }

  // Try other potential IPs
  const ipsToTest = [expoIP, ...POTENTIAL_IPS].filter(Boolean) as string[];

  for (const ip of ipsToTest) {
    if (ip === expoIP) continue; // Already tested

    console.log(`⏳ Driver App: Testing ${ip}:${API_PORT}...`);
    if (await testApiEndpoint(ip, API_PORT)) {
      const apiUrl = `http://${ip}:${API_PORT}`;
      console.log('✅ Driver App: Found working API at:', apiUrl);
      cachedApiBaseUrl = apiUrl;
      return apiUrl;
    }
  }

  // Try production URL as fallback
  console.log('🌐 Driver App: Testing production URL as fallback...');
  const productionUrl = 'http://43.205.127.30:5000';
  if (await testApiEndpoint('43.205.127.30', API_PORT)) {
    console.log('✅ Driver App: Production API is reachable:', productionUrl);
    cachedApiBaseUrl = productionUrl;
    return productionUrl;
  }

  // Final fallback to Expo IP or localhost
  const fallbackIP = expoIP || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  const fallbackUrl = `http://${fallbackIP}:${API_PORT}`;
  console.log('⚠️  Driver App: No working API found, using final fallback:', fallbackUrl);

  cachedApiBaseUrl = fallbackUrl;
  return fallbackUrl;
};

const getNetworkInfo = (): NetworkInfo => {
  const expoIP = getExpoDebuggerIP();
  const ip = expoIP || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  return { ip, port: API_PORT };
};

const getApiBaseUrl = (): string => {
  // First priority: Configured API URL from app.json or environment
  if (API_URL) {
    console.log('📱 Driver App: Using configured API URL:', API_URL);
    cachedApiBaseUrl = API_URL;
    return API_URL;
  }

  if (__DEV__) {
    // In development, we'll use the discovery mechanism
    // But for initial load, use the network info as fallback
    const { ip, port } = getNetworkInfo();
    const baseUrl = `http://${ip}:${port}`;
    console.log('🌐 Driver App: Initial Development API Base URL:', baseUrl);
    return baseUrl;
  }

  // Production URL fallback
  const productionUrl = 'http://43.205.127.30:5000';
  console.log('🚀 Driver App: Production API Base URL:', productionUrl);
  return productionUrl;
};

// Initial API base URL
export let API_BASE_URL = getApiBaseUrl();

// Function to dynamically update the API base URL
export const initializeApiConnection = async (): Promise<string> => {
  if (API_URL) {
    API_BASE_URL = API_URL;
    cachedApiBaseUrl = API_URL;
    console.log('🔒 Driver App: Using explicitly configured API URL. Skipping discovery.');
    return API_BASE_URL;
  }

  if (__DEV__) {
    console.log('🔄 Driver App: Initializing dynamic API connection...');
    const discoveredUrl = await discoverApiEndpoint();
    API_BASE_URL = discoveredUrl;
    return discoveredUrl;
  }
  return API_BASE_URL;
};

// Health check function
export const checkApiHealth = async (customUrl?: string): Promise<boolean> => {
  const urlToCheck = customUrl || API_BASE_URL;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${urlToCheck}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('❌ Driver App: API Health check failed for', urlToCheck, ':', error);

    // If the health check fails, clear the cache to force rediscovery
    if (!customUrl) {
      console.log('🔄 Driver App: Clearing API cache due to health check failure');
      cachedApiBaseUrl = null;
    }

    return false;
  }
};

// Utility to refresh API configuration
export const refreshApiConfiguration = async (): Promise<void> => {
  cachedApiBaseUrl = null;
  await initializeApiConnection();
  console.log('🔄 Driver App: API configuration refreshed. New URL:', API_BASE_URL);
};

console.log('📡 Driver App: API Configuration loaded:', {
  initialBaseUrl: API_BASE_URL,
  isDev: __DEV__,
  platform: Platform.OS,
});
