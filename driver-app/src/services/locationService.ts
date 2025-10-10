import { Platform, Alert } from "react-native";
import * as Location from "expo-location";
import { driverAPI } from "./api";
import { storageAPI } from "./api";
import { API_BASE_URL } from "../config/api";

interface AssignmentData {
  bus_id: number;
  route_id: number;
  driver_id: number;
  assignment_id?: number;
}

class LocationService {
  locationSubscription: Location.LocationSubscription | null = null;
  currentAssignment: AssignmentData | null = null;
  cachedAuthToken: string | null = null;
  updateCounter: number = 0;
  lastSuccessfulUpdate: Date | null = null;

  setCurrentAssignment(assignment: AssignmentData | null) {
    this.currentAssignment = assignment;
    if (assignment) {
      console.log("📍 Current assignment set:", assignment);
    } else {
      console.log("🧹 Assignment data cleared");
    }
    // Refresh token when assignment changes
    this.cachedAuthToken = null;
  }

  async refreshAuthToken() {
    try {
      this.cachedAuthToken = await storageAPI.getAuthToken();
      if (!this.cachedAuthToken) {
        console.warn("⚠️ No auth token available");
      }
    } catch (error) {
      console.error("❌ Failed to refresh auth token:", error);
      this.cachedAuthToken = null;
    }
  }

  // Method to check if background location is available
  async checkBackgroundLocationStatus() {
    try {
      const foregroundStatus = await Location.getForegroundPermissionsAsync();
      const backgroundStatus = await Location.getBackgroundPermissionsAsync();
      
      return {
        foregroundGranted: foregroundStatus.status === 'granted',
        backgroundGranted: backgroundStatus.status === 'granted',
        canRequestBackground: backgroundStatus.canAskAgain,
        message: this.getLocationStatusMessage(foregroundStatus.status, backgroundStatus.status)
      };
    } catch (error) {
      console.error("❌ Error checking location permissions:", error);
      return {
        foregroundGranted: false,
        backgroundGranted: false,
        canRequestBackground: false,
        message: "Unable to check location permissions"
      };
    }
  }

  // Helper method to get user-friendly status message
  private getLocationStatusMessage(foregroundStatus: string, backgroundStatus: string): string {
    if (foregroundStatus !== 'granted') {
      return "Location permission is required for bus tracking";
    }
    if (backgroundStatus !== 'granted') {
      return "Background location access will ensure continuous tracking when you switch apps";
    }
    return "All location permissions granted - continuous tracking enabled";
  }

  // Method to start tracking with automatic background detection
  async startSmartLocationTracking(busId: string, routeId: string, busRegistration?: string) {
    console.log("📱 Starting smart location tracking...");
    
    // For now, skip background permission check and just start foreground tracking
    // This avoids the Info.plist error until the app is rebuilt
    console.log("🎯 Starting foreground tracking (skipping background permissions for now)");
    await this.startLocationTrackingDirect(busId, routeId, busRegistration, false);
    return true;
    
    /* Commented out until app is rebuilt with proper Info.plist
    const locationStatus = await this.checkBackgroundLocationStatus();
    
    console.log("📱 Location permissions status:", locationStatus);
    
    if (!locationStatus.foregroundGranted) {
      Alert.alert(
        "Permission Required",
        "Location access is required for bus tracking. Please enable location permissions in Settings.",
        [{ text: "OK" }]
      );
      return false;
    }

    // Try to start with background if available, otherwise foreground only
    const enableBackground = locationStatus.backgroundGranted;
    
    if (!enableBackground && locationStatus.canRequestBackground) {
      console.log("🔔 Prompting user for background location permission...");
      return new Promise<boolean>((resolve) => {
        Alert.alert(
          "Enable Background Tracking?",
          "For the best passenger experience, enable 'Always' location access. This allows continuous tracking even when you switch apps.",
          [
            { 
              text: "Later", 
              onPress: async () => {
                console.log("👤 User chose to skip background permissions");
                await this.startLocationTrackingDirect(busId, routeId, busRegistration, false);
                resolve(true);
              }
            },
            { 
              text: "Enable", 
              onPress: async () => {
                console.log("👤 User chose to enable background permissions");
                // Try background first, but fall back to foreground if it fails
                try {
                  await this.startLocationTracking(busId, routeId, busRegistration, true);
                } catch (error) {
                  console.error("❌ Background tracking failed, falling back to foreground:", error);
                  await this.startLocationTrackingDirect(busId, routeId, busRegistration, false);
                }
                resolve(true);
              }
            }
          ],
          { 
            cancelable: false // Prevent dismissing without choice
          }
        );
      });
    }

    console.log(`🎯 Starting tracking with background: ${enableBackground}`);
    await this.startLocationTrackingDirect(busId, routeId, busRegistration, enableBackground);
    return true;
    */
  }

  // Direct tracking method that bypasses permission requests
  async startLocationTrackingDirect(busId: string, routeId: string, busRegistration?: string, enableBackground: boolean = false) {
    console.log(`🚀 Starting ${enableBackground ? 'background' : 'foreground'} live tracking for Bus ${busId} on Route ${routeId} (direct)`);
    
    // Initialize auth token cache and counter
    console.log("🔄 Initializing auth token cache...");
    await this.refreshAuthToken();
    this.updateCounter = 0;
    this.lastSuccessfulUpdate = new Date();
    console.log(`🔑 Auth token cached: ${!!this.cachedAuthToken}`);

    try {
      console.log("⚙️ Configuring location options...");
      // Configure location tracking options - use simpler options for iOS to avoid issues
      const locationOptions = {
        accuracy: Location.Accuracy.High,
        distanceInterval: 0, // meters - disable distance-based updates (use 0 to ignore distance)
        timeInterval: 4000, // 4 seconds - insert location every 4 seconds regardless of distance
      };

      console.log("📍 Starting location subscription...", locationOptions);
      this.locationSubscription = await Location.watchPositionAsync(
        locationOptions,
        async (location) => {
          try {
            this.updateCounter++;
            console.log(`📍 Location update #${this.updateCounter}: ${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`);
            
            // Check if token needs refresh (every 50 updates or if it's been more than 30 minutes since last update)
            const now = new Date();
            const timeSinceLastUpdate = this.lastSuccessfulUpdate ? now.getTime() - this.lastSuccessfulUpdate.getTime() : 0;
            
            if (this.updateCounter % 50 === 0 || timeSinceLastUpdate > 30 * 60 * 1000) {
              console.log("🔄 Refreshing auth token...");
              await this.refreshAuthToken();
            }

            // Use the current assignment data if available
            if (this.currentAssignment) {
              await this.sendLiveTrackingUpdate(location);
            } else {
              console.log("⚠️ No assignment data, using legacy API");
              // Fallback to legacy API
              await this.sendLegacyLocationUpdate(location, busId, routeId, busRegistration);
            }
          } catch (error) {
            console.error(`❌ Error in location callback #${this.updateCounter}:`, error);
            // Don't let individual update errors stop the tracking
          }
        }
      );

      console.log(`✅ ${enableBackground ? 'Background' : 'Foreground'} location tracking started successfully (direct)`);
    } catch (error) {
      console.error("❌ Failed to start location tracking:", error);
      console.error("❌ Error details:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async hasLocationPermission(requestBackground: boolean = false) {
    console.log(`🔍 Checking location permissions... (requestBackground: ${requestBackground})`);
    
    try {
      // Always request foreground permissions first
      console.log("📱 Requesting foreground permissions...");
      const foregroundStatus = await Location.requestForegroundPermissionsAsync();
      console.log("📱 Foreground permission status:", foregroundStatus.status);
      
      if (foregroundStatus.status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "This app needs location permission to track the bus position for passengers.",
          [{ text: "OK" }]
        );
        return false;
      }

      console.log("✅ Foreground location permission granted");

      // Only request background permission if explicitly requested
      if (requestBackground) {
        console.log("📱 Requesting background permissions...");
        try {
          const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
          console.log("📱 Background permission status:", backgroundStatus.status);
          
          if (backgroundStatus.status !== "granted") {
            console.warn("⚠️ Background location permission denied - will use foreground only");
            Alert.alert(
              "Background Permission",
              "For continuous tracking when you switch apps, please enable 'Allow all the time' in location settings.\n\nFor now, the app will track location when open.",
              [{ text: "Continue" }]
            );
          } else {
            console.log("✅ Background location permission granted");
          }
        } catch (error) {
          console.error("❌ Background permission request failed:", error);
          console.log("⚠️ Continuing with foreground-only tracking");
        }
      }

      console.log("✅ Location permission check completed");
      return true;
    } catch (error) {
      console.error("❌ Location permission request failed:", error);
      Alert.alert(
        "Permission Error",
        "Failed to request location permissions. Please enable location manually in settings.",
        [{ text: "OK" }]
      );
      return false;
    }
  }

  async startLocationTracking(busId: string, routeId: string, busRegistration?: string, enableBackground: boolean = true) {
    console.log(`🚀 Starting ${enableBackground ? 'background' : 'foreground'} live tracking for Bus ${busId} on Route ${routeId}`);
    
    try {
      // IMPORTANT: Always stop any existing tracking first and reset state
      console.log("🧹 Cleaning up any existing tracking state...");
      this.stopLocationTracking();
      
      // Check permissions first
      const hasPermission = await this.hasLocationPermission(enableBackground);
      if (!hasPermission) {
        console.log("❌ Location permission check failed");
        throw new Error("Location permissions not granted");
      }
      
      console.log("✅ Location permissions confirmed");
      
      // Initialize auth token cache and counter
      console.log("🔄 Initializing auth token cache...");
      await this.refreshAuthToken();
      this.updateCounter = 0;
      this.lastSuccessfulUpdate = new Date();
      console.log(`🔑 Auth token cached: ${!!this.cachedAuthToken}`);

      console.log("⚙️ Configuring location options for Android...");
      
      // Simple, reliable location options that work well on Android
      const locationOptions: Location.LocationOptions = {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 5, // Update every 5 meters
      };

      // Add Android-specific foreground service for background tracking
      if (enableBackground && Platform.OS === 'android') {
        (locationOptions as any).foregroundService = {
          notificationTitle: "BusHub Driver Tracking",
          notificationBody: `Tracking Bus ${busRegistration || busId} on Route ${routeId}`,
          notificationColor: "#2196F3",
        };
      }

      console.log("📍 Starting location subscription with options:", locationOptions);
      
      // Start location tracking with error handling
      this.locationSubscription = await Location.watchPositionAsync(
        locationOptions,
        async (location) => {
          try {
            this.updateCounter++;
            const lat = location.coords.latitude.toFixed(6);
            const lng = location.coords.longitude.toFixed(6);
            const speed = location.coords.speed ? (location.coords.speed * 3.6).toFixed(1) : '0'; // Convert m/s to km/h
            
            console.log(`📍 Location #${this.updateCounter}: ${lat}, ${lng} (${speed} km/h)`);
            
            // Refresh auth token periodically
            const now = new Date();
            const timeSinceLastUpdate = this.lastSuccessfulUpdate ? now.getTime() - this.lastSuccessfulUpdate.getTime() : 0;
            
            if (this.updateCounter % 50 === 0 || timeSinceLastUpdate > 30 * 60 * 1000) {
              console.log("🔄 Refreshing auth token...");
              await this.refreshAuthToken();
            }

            // Send location update
            if (this.currentAssignment) {
              await this.sendLiveTrackingUpdate(location);
            } else {
              console.log("⚠️ No assignment data, using legacy API");
              await this.sendLegacyLocationUpdate(location, busId, routeId, busRegistration);
            }
          } catch (error) {
            console.error(`❌ Error in location callback #${this.updateCounter}:`, error);
            // Don't let individual update errors stop the tracking
          }
        }
      );

      console.log(`✅ ${enableBackground ? 'Background' : 'Foreground'} location tracking started successfully`);
      
      // Test location immediately
      try {
        console.log("🧪 Testing initial location fetch...");
        const testLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        console.log(`🧪 Test location: ${testLocation.coords.latitude.toFixed(6)}, ${testLocation.coords.longitude.toFixed(6)}`);
      } catch (error) {
        console.error("⚠️ Initial location test failed:", error);
      }
      
    } catch (error) {
      console.error("❌ Failed to start location tracking:", error);
      console.error("❌ Error details:", error instanceof Error ? error.message : String(error));
      
      Alert.alert(
        "Location Tracking Error",
        "Failed to start location tracking. Please check your location settings and try again.",
        [{ text: "OK" }]
      );
      
      throw error;
    }
  }

  // New method for live tracking API
  async sendLiveTrackingUpdate(location: Location.LocationObject) {
    if (!this.currentAssignment) {
      console.warn("⚠️ No assignment data available for live tracking");
      return;
    }

    // Validate assignment data has required fields
    if (!this.currentAssignment.bus_id || !this.currentAssignment.route_id || !this.currentAssignment.driver_id) {
      console.error('❌ Invalid assignment data for live tracking:', this.currentAssignment);
      return;
    }

    const { latitude, longitude, speed, heading, accuracy } = location.coords;
    
    try {
      // Use cached token or refresh if needed
      if (!this.cachedAuthToken) {
        await this.refreshAuthToken();
      }

      const response = await fetch(`${API_BASE_URL}/live-tracking/position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.cachedAuthToken}`
        },
        body: JSON.stringify({
          bus_id: this.currentAssignment.bus_id,
          route_id: this.currentAssignment.route_id,
          driver_id: this.currentAssignment.driver_id,
          assignment_id: this.currentAssignment.assignment_id,
          latitude: latitude,
          longitude: longitude,
          speed: speed ? Math.max(0, speed * 3.6) : 0, // Convert m/s to km/h
          heading: heading || 0,
          accuracy: accuracy || 0,
          passenger_count: 0, // Could be updated from UI
          occupancy_level: 'unknown' // Could be updated from UI
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.lastSuccessfulUpdate = new Date();
        console.log(`✅ Live tracking update sent: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (Speed: ${speed ? (speed * 3.6).toFixed(1) : '0'} km/h)`);
      } else {
        const errorText = await response.text();
        console.error('❌ Live tracking update failed:', response.status, errorText);
        
        // If it's a 401 (unauthorized), refresh token and retry once
        if (response.status === 401) {
          console.log("🔄 Token expired, refreshing and retrying...");
          await this.refreshAuthToken();
          await this.retryLiveTrackingUpdate(location);
        } else {
          console.log("⚠️ Live tracking failed, falling back to legacy API");
          // For other errors, fallback to legacy API
          await this.sendLegacyLocationUpdate(location, this.currentAssignment.bus_id.toString(), this.currentAssignment.route_id.toString());
        }
      }
    } catch (error) {
      console.error("❌ Failed to send live tracking update:", error);
      console.error("❌ Error details:", error instanceof Error ? error.message : String(error));
      // Fallback to legacy API
      await this.sendLegacyLocationUpdate(location, this.currentAssignment.bus_id.toString(), this.currentAssignment.route_id.toString());
    }
  }

  // Retry method for token refresh scenarios
  async retryLiveTrackingUpdate(location: Location.LocationObject) {
    if (!this.currentAssignment || !this.cachedAuthToken) return;

    const { latitude, longitude, speed, heading, accuracy } = location.coords;
    
    try {
      const response = await fetch(`${API_BASE_URL}/live-tracking/position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.cachedAuthToken}`
        },
        body: JSON.stringify({
          bus_id: this.currentAssignment.bus_id,
          route_id: this.currentAssignment.route_id,
          driver_id: this.currentAssignment.driver_id,
          assignment_id: this.currentAssignment.assignment_id,
          latitude: latitude,
          longitude: longitude,
          speed: speed ? Math.max(0, speed * 3.6) : 0,
          heading: heading || 0,
          accuracy: accuracy || 0,
          passenger_count: 0,
          occupancy_level: 'unknown'
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.lastSuccessfulUpdate = new Date();
        console.log(`✅ Live tracking update retry successful: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${result.tracking_id || this.updateCounter})`);
      } else {
        console.error('❌ Live tracking retry failed:', response.status, await response.text());
        // Final fallback to legacy API
        await this.sendLegacyLocationUpdate(location, this.currentAssignment.bus_id.toString(), this.currentAssignment.route_id.toString());
      }
    } catch (error) {
      console.error("❌ Retry failed:", error);
      await this.sendLegacyLocationUpdate(location, this.currentAssignment.bus_id.toString(), this.currentAssignment.route_id.toString());
    }
  }

  // Legacy method for backward compatibility
  async sendLegacyLocationUpdate(location: Location.LocationObject, busId: string, routeId: string, busRegistration?: string) {
    const { latitude, longitude } = location.coords;
    const timestamp = new Date(location.timestamp).toISOString();

    try {
      await driverAPI.sendLocationUpdate({
        latitude,
        longitude,
        busId,
        routeId,
        timestamp,
        busRegistration: busRegistration || `BUS-${busId}`,
      });
      console.log("✅ Legacy location update sent:", latitude, longitude);
    } catch (error) {
      console.error("❌ Failed to send legacy location update:", error);
    }
  }

  stopLocationTracking() {
    console.log("🛑 Stopping location tracking...");
    
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
      console.log(`🛑 Location subscription removed after ${this.updateCounter} updates`);
      
      // Log final statistics
      if (this.lastSuccessfulUpdate) {
        const totalTime = Date.now() - this.lastSuccessfulUpdate.getTime();
        console.log(`📊 Tracking session: ${this.updateCounter} updates over ${Math.round(totalTime / 1000)}s`);
      }
    } else {
      // Only log if we're not in the initial state (no tracking was active)
      if (this.updateCounter > 0 || this.lastSuccessfulUpdate) {
        console.log("ℹ️ Location tracking stop requested, but no active subscription found");
      }
    }
    
    // IMPORTANT: Reset all state to allow fresh restart
    console.log("🧹 Resetting location service state...");
    this.updateCounter = 0;
    this.lastSuccessfulUpdate = null;
    this.currentAssignment = null;
    this.cachedAuthToken = null;
    
    console.log("✅ Location tracking completely stopped and state reset");
  }

  // Method to clear cached token (useful for logout or token refresh)
  clearTokenCache() {
    this.cachedAuthToken = null;
    console.log("🔑 Token cache cleared");
  }

  // Method to completely reset the location service state
  resetLocationService() {
    console.log("🔄 Resetting location service to initial state...");
    
    // Stop tracking if active
    this.stopLocationTracking();
    
    // Clear all cached data
    this.clearTokenCache();
    
    console.log("✅ Location service reset complete");
  }

  // Method to get tracking statistics
  getTrackingStats() {
    return {
      updateCounter: this.updateCounter,
      lastSuccessfulUpdate: this.lastSuccessfulUpdate,
      hasActiveSubscription: !!this.locationSubscription,
      hasAssignment: !!this.currentAssignment,
      hasToken: !!this.cachedAuthToken
    };
  }

  // Method to monitor tracking health
  async getTrackingHealth() {
    const stats = this.getTrackingStats();
    const locationStatus = await this.checkBackgroundLocationStatus();
    
    return {
      ...stats,
      ...locationStatus,
      isHealthy: stats.hasActiveSubscription && stats.hasToken && locationStatus.foregroundGranted,
      backgroundEnabled: locationStatus.backgroundGranted,
      lastUpdateAge: stats.lastSuccessfulUpdate ? 
        Date.now() - stats.lastSuccessfulUpdate.getTime() : null
    };
  }

  // Method to force a location update (useful for testing)
  async forceLocationUpdate() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      console.log("🎯 Forced location update");
      
      if (this.currentAssignment) {
        await this.sendLiveTrackingUpdate(location);
      }
      
      return location;
    } catch (error) {
      console.error("❌ Failed to get forced location update:", error);
      throw error;
    }
  }
}

export const locationService = new LocationService();
