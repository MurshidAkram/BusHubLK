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

  setCurrentAssignment(assignment: AssignmentData) {
    this.currentAssignment = assignment;
    console.log("📍 Current assignment set:", assignment);
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
        distanceInterval: 5, // meters - trigger update every 5 meters
        timeInterval: 3000, // Keep it simple - 3 seconds for all cases
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
    
    if (Platform.OS === "ios") {
      console.log("📱 iOS platform - requesting foreground permissions...");
      // Request foreground permissions first
      const foregroundStatus = await Location.requestForegroundPermissionsAsync();
      console.log("📱 iOS foreground permission status:", foregroundStatus.status);
      
      if (foregroundStatus.status !== "granted") {
        Alert.alert(
          "Location Permission Denied",
          "App needs location permission to track bus location."
        );
        return false;
      }

      // Request background permissions if needed
      if (requestBackground) {
        console.log("📱 iOS - requesting background permissions...");
        try {
          // Add a timeout for background permission request
          const backgroundPermissionPromise = Location.requestBackgroundPermissionsAsync();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Background permission request timeout")), 10000) // 10 second timeout
          );
          
          const backgroundStatus = await Promise.race([backgroundPermissionPromise, timeoutPromise]) as any;
          console.log("📱 iOS background permission status:", backgroundStatus.status);
          
          if (backgroundStatus.status !== "granted") {
            console.warn("⚠️ Background location permission denied on iOS - continuing with foreground only");
            // Don't show alert here, just continue with foreground
          } else {
            console.log("✅ iOS background location permission granted");
          }
        } catch (error) {
          console.error("❌ iOS background permission request failed or timed out:", error);
          console.log("⚠️ Continuing with foreground-only tracking");
          // Continue with foreground only
        }
      }
      console.log("✅ iOS location permissions check completed");
      return true;
    }

    if (Platform.OS === "android") {
      console.log("📱 Android platform - requesting foreground permissions...");
      // Request foreground permissions first
      const foregroundStatus = await Location.requestForegroundPermissionsAsync();
      console.log("📱 Android foreground permission status:", foregroundStatus.status);
      
      if (foregroundStatus.status !== "granted") {
        Alert.alert(
          "Location Permission Denied",
          "App needs location permission to track bus location."
        );
        return false;
      }

      // Request background permissions if needed
      if (requestBackground) {
        console.log("📱 Android - requesting background permissions...");
        try {
          // Add a timeout for background permission request
          const backgroundPermissionPromise = Location.requestBackgroundPermissionsAsync();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Background permission request timeout")), 10000) // 10 second timeout
          );
          
          const backgroundStatus = await Promise.race([backgroundPermissionPromise, timeoutPromise]) as any;
          console.log("📱 Android background permission status:", backgroundStatus.status);
          
          if (backgroundStatus.status !== "granted") {
            console.warn("⚠️ Background location permission denied on Android - continuing with foreground only");
            // Don't show alert here, just continue with foreground
          } else {
            console.log("✅ Android background location permission granted");
          }
        } catch (error) {
          console.error("❌ Android background permission request failed or timed out:", error);
          console.log("⚠️ Continuing with foreground-only tracking");
          // Continue with foreground only
        }
      }
      console.log("✅ Android location permissions check completed");
      return true;
    }
    
    console.warn("❌ Unknown platform, returning false");
    return false;
  }

  async startLocationTracking(busId: string, routeId: string, busRegistration?: string, enableBackground: boolean = true) {
    console.log(`🚀 Starting ${enableBackground ? 'background' : 'foreground'} live tracking for Bus ${busId} on Route ${routeId}`);
    
    const hasPermission = await this.hasLocationPermission(enableBackground);
    if (!hasPermission) {
      console.log("❌ Location permission check failed");
      return;
    }
    
    console.log("✅ Location permissions confirmed");
    
    // Initialize auth token cache and counter
    console.log("🔄 Initializing auth token cache...");
    await this.refreshAuthToken();
    this.updateCounter = 0;
    this.lastSuccessfulUpdate = new Date();
    console.log(`🔑 Auth token cached: ${!!this.cachedAuthToken}`);

    try {
      console.log("⚙️ Configuring location options...");
      // Configure location tracking options based on background support
      const locationOptions = {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5, // meters - trigger update every 5 meters
        timeInterval: enableBackground ? 5000 : 3000, // Longer interval for background to save battery
        // For background tracking, we need these additional options
        ...(enableBackground && {
          deferredUpdatesInterval: 10000, // 10 seconds - batch updates in background
          showsBackgroundLocationIndicator: true, // iOS only - shows blue bar
          foregroundService: {
            notificationTitle: "BusHub Driver Tracking",
            notificationBody: `Tracking Bus ${busRegistration || busId} on Route ${routeId}`,
            notificationColor: "#2196F3", // Blue color
          }
        })
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

      console.log(`✅ ${enableBackground ? 'Background' : 'Foreground'} location tracking started successfully`);
    } catch (error) {
      console.error("❌ Failed to start location tracking:", error);
      console.error("❌ Error details:", error instanceof Error ? error.message : String(error));
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
        console.log(`✅ Live tracking update sent: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${result.tracking_id || this.updateCounter})`);
      } else {
        const errorText = await response.text();
        console.error('❌ Live tracking update failed:', response.status, errorText);
        
        // If it's a 401 (unauthorized), refresh token and retry once
        if (response.status === 401) {
          console.log("🔄 Token expired, refreshing and retrying...");
          await this.refreshAuthToken();
          await this.retryLiveTrackingUpdate(location);
        } else {
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
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
      console.log(`🛑 Location tracking stopped after ${this.updateCounter} updates`);
      
      // Log final statistics
      if (this.lastSuccessfulUpdate) {
        const totalTime = Date.now() - this.lastSuccessfulUpdate.getTime();
        console.log(`📊 Tracking session: ${this.updateCounter} updates over ${Math.round(totalTime / 1000)}s`);
      }
      
      // Reset counters
      this.updateCounter = 0;
      this.lastSuccessfulUpdate = null;
    } else {
      // Only log if we're not in the initial state (no tracking was active)
      if (this.updateCounter > 0 || this.lastSuccessfulUpdate) {
        console.log("ℹ️ Location tracking stop requested, but no active subscription found");
      }
    }
  }

  // Method to clear cached token (useful for logout or token refresh)
  clearTokenCache() {
    this.cachedAuthToken = null;
    console.log("🔑 Token cache cleared");
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
