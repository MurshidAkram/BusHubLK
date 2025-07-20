import { Platform, Alert } from "react-native";
import * as Location from "expo-location";
import { driverAPI } from "./api";
import { storageAPI } from "./api";

interface AssignmentData {
  bus_id: number;
  route_id: number;
  driver_id: number;
  assignment_id?: number;
}

class LocationService {
  locationSubscription: Location.LocationSubscription | null = null;
  currentAssignment: AssignmentData | null = null;

  setCurrentAssignment(assignment: AssignmentData) {
    this.currentAssignment = assignment;
    console.log("📍 Current assignment set:", assignment);
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

    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5, // meters - trigger update every 5 meters
        timeInterval: 3000, // 3 seconds - trigger update every 3 seconds
      },
      async (location) => {
        const { latitude, longitude, speed, heading, accuracy } = location.coords;
        const timestamp = new Date(location.timestamp).toISOString();

        // Use the current assignment data if available
        if (this.currentAssignment) {
          await this.sendLiveTrackingUpdate(location);
        } else {
          // Fallback to legacy API
          await this.sendLegacyLocationUpdate(location, busId, routeId, busRegistration);
        }
      }
    );
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
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.4:5000'}/api/live-tracking/position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await storageAPI.getAuthToken()}`
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
        console.log(`✅ Live tracking update sent: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${result.tracking_id})`);
      } else {
        const errorText = await response.text();
        console.error('❌ Live tracking update failed:', response.status, errorText);
        // Fallback to legacy API
        await this.sendLegacyLocationUpdate(location, this.currentAssignment.bus_id.toString(), this.currentAssignment.route_id.toString());
      }
    } catch (error) {
      console.error("❌ Failed to send live tracking update:", error);
      // Fallback to legacy API
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
      console.log("Location tracking stopped");
    }
  }
}

export const locationService = new LocationService();
