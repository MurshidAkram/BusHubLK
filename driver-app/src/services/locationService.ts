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

  async hasLocationPermission() {
    if (Platform.OS === "ios") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Denied",
          "App needs location permission to track bus location."
        );
        return false;
      }
      return true;
    }

    if (Platform.OS === "android") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Denied",
          "App needs location permission to track bus location."
        );
        return false;
      }
      return true;
    }
    return false;
  }

  async startLocationTracking(busId: string, routeId: string, busRegistration?: string) {
    const hasPermission = await this.hasLocationPermission();
    if (!hasPermission) return;

    console.log(`🚀 Starting live tracking for Bus ${busId} on Route ${routeId}`);
    
    // Initialize auth token cache and counter
    await this.refreshAuthToken();
    this.updateCounter = 0;
    this.lastSuccessfulUpdate = new Date();

    try {
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5, // meters - trigger update every 5 meters
          timeInterval: 3000, // 3 seconds - trigger update every 3 seconds
        },
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
              // Fallback to legacy API
              await this.sendLegacyLocationUpdate(location, busId, routeId, busRegistration);
            }
          } catch (error) {
            console.error(`❌ Error in location callback #${this.updateCounter}:`, error);
            // Don't let individual update errors stop the tracking
          }
        }
      );
    } catch (error) {
      console.error("❌ Failed to start location tracking:", error);
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
}

export const locationService = new LocationService();
