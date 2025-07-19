import { Platform, Alert } from "react-native";
import * as Location from "expo-location";
import { driverAPI } from "./api";

class LocationService {
  locationSubscription: Location.LocationSubscription | null = null;

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

  async startLocationTracking(busId: string, routeId: string) {
    const hasPermission = await this.hasLocationPermission();
    if (!hasPermission) return;

    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10, // meters
        timeInterval: 30000, // 30 seconds
      },
      async (location) => {
        const { latitude, longitude } = location.coords;
        const timestamp = new Date(location.timestamp).toISOString();

        try {
          // @ts-ignore
          await driverAPI.sendLocationUpdate({
            latitude,
            longitude,
            busId,
            routeId,
            timestamp,
          });
          console.log("Location update sent:", latitude, longitude);
        } catch (error) {
          console.error("Failed to send location update:", error);
        }
      }
    );
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
