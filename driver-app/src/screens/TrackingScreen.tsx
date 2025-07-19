import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { storageAPI } from "../services/api";
import { locationService } from "../services/locationService";

// App Color Palette
const AppColors = {
  background: "#F8F9FA",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  text: "#212529",
  textSecondary: "#6C757D",
  border: "#DEE2E6",
  success: "#198754",
  warning: "#ffc107",
  danger: "#dc3545",
};

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface TrackingStatus {
  isActive: boolean;
  busId: string | null;
  routeId: string | null;
  lastUpdate: string | null;
}

export default function TrackingScreen({ navigation }: any) {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>({
    isActive: false,
    busId: null,
    routeId: null,
    lastUpdate: null,
  });
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    loadUserData();
    getCurrentLocation();
    checkTrackingStatus();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await storageAPI.getUserData();
      setUserData(data);
      if (data) {
        setTrackingStatus(prev => ({
          ...prev,
          busId: data.busId || null,
          routeId: data.routeId || null,
        }));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show tracking data.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
        accuracy: location.coords.accuracy || undefined,
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
      };

      setCurrentLocation(locationData);
      
      // Add to history (keep last 10 locations)
      setLocationHistory(prev => [locationData, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert('Error', 'Failed to get current location.');
    }
  };

  const checkTrackingStatus = () => {
    // Check if location service is active
    const isActive = locationService.locationSubscription !== null;
    setTrackingStatus(prev => ({
      ...prev,
      isActive,
      lastUpdate: isActive ? new Date().toISOString() : prev.lastUpdate,
    }));
  };

  const toggleTracking = async () => {
    try {
      if (trackingStatus.isActive) {
        locationService.stopLocationTracking();
        setTrackingStatus(prev => ({ ...prev, isActive: false }));
        Alert.alert('Tracking Stopped', 'Location tracking has been stopped.');
      } else {
        if (userData?.busId && userData?.routeId) {
          await locationService.startLocationTracking(userData.busId, userData.routeId);
          setTrackingStatus(prev => ({ 
            ...prev, 
            isActive: true,
            lastUpdate: new Date().toISOString(),
          }));
          Alert.alert('Tracking Started', 'Location tracking has been started.');
        } else {
          Alert.alert('Error', 'Bus ID or Route ID is missing. Please contact support.');
        }
      }
    } catch (error) {
      console.error("Error toggling tracking:", error);
      Alert.alert('Error', 'Failed to toggle tracking.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getCurrentLocation();
    checkTrackingStatus();
    setRefreshing(false);
  };

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar
        backgroundColor={AppColors.primary}
        barStyle="light-content"
        translucent={false}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tracking Data</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Tracking Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={24}
              color={AppColors.primary}
            />
            <Text style={styles.cardTitle}>Tracking Status</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: trackingStatus.isActive ? AppColors.success : AppColors.danger }
            ]}>
              <Text style={styles.statusText}>
                {trackingStatus.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bus ID:</Text>
            <Text style={styles.infoValue}>{trackingStatus.busId || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Route ID:</Text>
            <Text style={styles.infoValue}>{trackingStatus.routeId || 'N/A'}</Text>
          </View>

          {trackingStatus.lastUpdate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Update:</Text>
              <Text style={styles.infoValue}>
                {formatTime(trackingStatus.lastUpdate)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: trackingStatus.isActive ? AppColors.danger : AppColors.success }
            ]}
            onPress={toggleTracking}
          >
            <Text style={styles.toggleButtonText}>
              {trackingStatus.isActive ? 'Stop Tracking' : 'Start Tracking'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current Location Card */}
        {currentLocation && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={24}
                color={AppColors.primary}
              />
              <Text style={styles.cardTitle}>Current Location</Text>
            </View>

            <View style={styles.locationGrid}>
              <View style={styles.locationItem}>
                <Text style={styles.locationLabel}>Latitude</Text>
                <Text style={styles.locationValue}>
                  {formatCoordinate(currentLocation.latitude)}
                </Text>
              </View>
              
              <View style={styles.locationItem}>
                <Text style={styles.locationLabel}>Longitude</Text>
                <Text style={styles.locationValue}>
                  {formatCoordinate(currentLocation.longitude)}
                </Text>
              </View>

              {currentLocation.accuracy && (
                <View style={styles.locationItem}>
                  <Text style={styles.locationLabel}>Accuracy</Text>
                  <Text style={styles.locationValue}>
                    {currentLocation.accuracy.toFixed(1)}m
                  </Text>
                </View>
              )}

              {currentLocation.speed && (
                <View style={styles.locationItem}>
                  <Text style={styles.locationLabel}>Speed</Text>
                  <Text style={styles.locationValue}>
                    {(currentLocation.speed * 3.6).toFixed(1)} km/h
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.timestampRow}>
              <Text style={styles.timestampLabel}>Updated:</Text>
              <Text style={styles.timestampValue}>
                {formatTime(currentLocation.timestamp)} - {formatDate(currentLocation.timestamp)}
              </Text>
            </View>
          </View>
        )}

        {/* Location History Card */}
        {locationHistory.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="history"
                size={24}
                color={AppColors.primary}
              />
              <Text style={styles.cardTitle}>Recent Locations</Text>
            </View>

            {locationHistory.slice(0, 5).map((location, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTime}>
                    {formatTime(location.timestamp)}
                  </Text>
                  <Text style={styles.historyIndex}>#{index + 1}</Text>
                </View>
                <Text style={styles.historyCoords}>
                  {formatCoordinate(location.latitude)}, {formatCoordinate(location.longitude)}
                </Text>
                {location.accuracy && (
                  <Text style={styles.historyAccuracy}>
                    Accuracy: {location.accuracy.toFixed(1)}m
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Debug Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="bug"
              size={24}
              color={AppColors.warning}
            />
            <Text style={styles.cardTitle}>Debug Information</Text>
          </View>

          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Platform: {Platform.OS} {Platform.Version}
            </Text>
            <Text style={styles.debugText}>
              User ID: {userData?.user_id || 'N/A'}
            </Text>
            <Text style={styles.debugText}>
              Driver ID: {userData?.driver_id || 'N/A'}
            </Text>
            <Text style={styles.debugText}>
              Location History: {locationHistory.length} entries
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.primary,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 15 : 16,
    height: Platform.OS === "ios" ? 70 : 65,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 18 : 16,
    fontWeight: "600",
  },
  refreshButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.text,
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: AppColors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: AppColors.text,
  },
  toggleButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  locationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  locationItem: {
    width: "48%",
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.text,
  },
  timestampRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  timestampLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  timestampValue: {
    fontSize: 14,
    fontWeight: "500",
    color: AppColors.text,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 14,
    fontWeight: "500",
    color: AppColors.text,
  },
  historyIndex: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  historyCoords: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  historyAccuracy: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  debugInfo: {
    backgroundColor: AppColors.primaryMuted,
    padding: 12,
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
