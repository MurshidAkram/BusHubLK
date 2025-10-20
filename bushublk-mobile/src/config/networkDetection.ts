import Constants from 'expo-constants';

interface NetworkConfig {
  apiBaseUrl: string;
  isReachable: boolean;
}

// Common IP ranges and ports to try
const POTENTIAL_HOSTS = [
  '10.98.151.57', // Current working IP from logs
  '10.22.165.241', // Previous IP that was hardcoded
  '192.168.1.1',   // Common router IP
  '192.168.0.1',   // Another common router IP
  '127.0.0.1',     // Localhost
  '10.0.2.2',      // Android emulator default
];

const API_PORT = 5000;
const TIMEOUT_MS = 3000;

/**
 * Test if a specific API endpoint is reachable
 */
const testEndpoint = async (ip: string, port: number): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const response = await fetch(`http://${ip}:${port}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
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
    const debuggerHost = Constants.expoGoConfig?.debuggerHost;
    
    if (debuggerHost) {
      return debuggerHost.split(':')[0];
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Dynamically discover the correct API base URL
 */
export const discoverApiBaseUrl = async (): Promise<NetworkConfig> => {
  console.log('🔍 Starting API endpoint discovery...');
  
  // First, try the Expo debugger IP
  const expoIP = getExpoDebuggerIP();
  if (expoIP) {
    console.log('🎯 Testing Expo debugger IP:', expoIP);
    if (await testEndpoint(expoIP, API_PORT)) {
      const apiBaseUrl = `http://${expoIP}:${API_PORT}`;
      console.log('✅ Found working API at:', apiBaseUrl);
      return { apiBaseUrl, isReachable: true };
    }
  }
  
  // If Expo IP doesn't work, try other potential hosts
  console.log('🔄 Testing potential hosts...');
  for (const ip of POTENTIAL_HOSTS) {
    console.log(`⏳ Testing ${ip}:${API_PORT}...`);
    if (await testEndpoint(ip, API_PORT)) {
      const apiBaseUrl = `http://${ip}:${API_PORT}`;
      console.log('✅ Found working API at:', apiBaseUrl);
      return { apiBaseUrl, isReachable: true };
    }
  }
  
  // If nothing works, fall back to Expo IP or localhost
  const fallbackIP = expoIP || 'localhost';
  const apiBaseUrl = `http://${fallbackIP}:${API_PORT}`;
  console.log('⚠️  No working API found, using fallback:', apiBaseUrl);
  
  return { apiBaseUrl, isReachable: false };
};

/**
 * Get basic network information (simplified version)
 */
export const getNetworkInfo = async () => {
  try {
    // Simple connectivity check
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });
    
    return {
      isConnected: response.ok,
      type: 'unknown',
      details: null,
    };
  } catch (error) {
    console.error('Error getting network info:', error);
    return {
      isConnected: false,
      type: 'unknown',
      details: null,
    };
  }
};

/**
 * Validate that the API is working with a simple test
 */
export const validateApiConnection = async (baseUrl: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    // Try a simple endpoint that should always work
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('API validation failed:', error);
    return false;
  }
};
