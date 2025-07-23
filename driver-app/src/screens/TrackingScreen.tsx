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
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { storageAPI, driverAPI } from "../services/api";
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

interface AssignmentData {
  assignment_id: number;
  depot_id: number;
  bus_id: number;
  route_id: number;
  driver_id: number;
  conductor_id: number | null;
  assignment_date: string;
  shift_start_time: string;
  shift_end_time: string;
  status: string;
  bus_registration: string;
  bus_class: string;
  bus_manufacturer: string;
  bus_model: string;
  route_number: string;
  route_name: string;
  start_location: string;
  end_location: string;
  depot_name: string;
  driver_name: string;
  conductor_name: string | null;
}

const { width, height } = Dimensions.get('window');

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
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    loadUserData();
    getCurrentLocation();
    checkTrackingStatus();
  }, []);

  useEffect(() => {
    if (userData?.driver_id) {
      loadAssignmentData();
    }
  }, [userData]);

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

  const loadAssignmentData = async () => {
    try {
      if (userData?.driver_id) {
        console.log('🔍 TrackingScreen: Loading assignment for driver:', userData.driver_id);
        
        let response;
        let usedUpcomingEndpoint = false;
        
        try {
          // Try the upcoming assignments endpoint first (same as ScheduleScreen)
          console.log('🔍 TrackingScreen: Trying upcoming assignments endpoint');
          const upcomingResponse = await driverAPI.getUpcomingAssignments(userData.driver_id.toString(), 7);
          console.log('🔍 TrackingScreen: getUpcomingAssignments response:', JSON.stringify(upcomingResponse, null, 2));
          
          if (upcomingResponse && Array.isArray(upcomingResponse) && upcomingResponse.length > 0) {
            // Find today's assignment from the upcoming assignments
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const todayAssignment = upcomingResponse.find(assignment => 
              assignment.assignment_date && assignment.assignment_date.startsWith(today)
            );
            
            if (todayAssignment) {
              console.log('✅ TrackingScreen: Found today\'s assignment from upcoming assignments');
              response = todayAssignment;
              usedUpcomingEndpoint = true;
            } else {
              console.log('⚠️ TrackingScreen: No today\'s assignment found in upcoming assignments, using first available');
              response = upcomingResponse[0];
              usedUpcomingEndpoint = true;
            }
          } else if (upcomingResponse && upcomingResponse.error) {
            throw new Error(upcomingResponse.error);
          } else {
            throw new Error('No upcoming assignments found');
          }
        } catch (upcomingError) {
          console.log('⚠️ TrackingScreen: Upcoming assignments failed, falling back to single assignment:', upcomingError);
          
          // Fallback to single assignment endpoint
          response = await driverAPI.getDailyAssignment(userData.driver_id.toString());
          console.log('🔍 TrackingScreen: getDailyAssignment fallback response:', JSON.stringify(response, null, 2));
        }
        
        if (response && !response.error) {
          console.log('🔍 TrackingScreen: Assignment field values:', {
            assignment_id: response.assignment_id,
            bus_id: response.bus_id,
            route_id: response.route_id,
            driver_id: response.driver_id,
          });
          
          setAssignmentData(response);
          
          // Validate assignment data before setting in location service
          if (response.assignment_id && response.bus_id && response.route_id) {
            console.log('✅ TrackingScreen: Setting valid assignment data in location service');
            // Set assignment data in location service for live tracking
            locationService.setCurrentAssignment({
              bus_id: response.bus_id,
              route_id: response.route_id,
              driver_id: userData.driver_id,
              assignment_id: response.assignment_id,
            });
          } else {
            console.error('❌ TrackingScreen: Invalid assignment data, not setting in location service:', {
              assignment_id: response.assignment_id,
              bus_id: response.bus_id,
              route_id: response.route_id,
              driver_id: userData.driver_id,
            });
          }
          
          // Update tracking status with assignment data
          setTrackingStatus(prev => ({
            ...prev,
            busId: response.bus_id?.toString() || null,
            routeId: response.route_id?.toString() || null,
          }));
          
          console.log(`📋 Assignment loaded for live tracking:`, {
            bus_id: response.bus_id,
            route_id: response.route_id,
            driver_id: userData.driver_id,
            assignment_id: response.assignment_id,
            bus_registration: response.bus_registration,
            route_number: response.route_number
          });
        } else {
          console.log("No assignment found or error:", response.error);
        }
      }
    } catch (error) {
      console.error("Error loading assignment data:", error);
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
        // Use assignment data if available, otherwise fall back to userData
        const busId = assignmentData?.bus_id?.toString() || userData?.busId;
        const routeId = assignmentData?.route_id?.toString() || userData?.routeId;
        
        if (busId && routeId) {
          const success = await locationService.startSmartLocationTracking(
            busId, 
            routeId, 
            assignmentData?.bus_registration
          );
          if (success) {
            setTrackingStatus(prev => ({ 
              ...prev, 
              isActive: true,
              busId: busId,
              routeId: routeId,
              lastUpdate: new Date().toISOString(),
            }));
            Alert.alert('Tracking Started', `Background location tracking started for Bus ${assignmentData?.bus_registration || busId} on Route ${assignmentData?.route_number || routeId}.`);
          }
        } else {
          Alert.alert('Error', 'Bus ID or Route ID is missing. Please ensure you have an active assignment.');
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
    if (userData?.driver_id) {
      await loadAssignmentData();
    }
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
        <TouchableOpacity
          style={styles.mapToggleButton}
          onPress={() => setShowMap(!showMap)}
        >
          <Ionicons name={showMap ? "list" : "map"} size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Daily Assignment Card */}
        {assignmentData && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="clipboard-text"
                size={24}
                color={AppColors.primary}
              />
              <Text style={styles.cardTitle}>Today's Assignment</Text>
            </View>

            <View style={styles.assignmentGrid}>
              <View style={styles.assignmentItem}>
                <Text style={styles.assignmentLabel}>Bus</Text>
                <Text style={styles.assignmentValue}>
                  {assignmentData.bus_registration}
                </Text>
                <Text style={styles.assignmentSubValue}>
                  {assignmentData.bus_manufacturer} {assignmentData.bus_model} (Class {assignmentData.bus_class})
                </Text>
              </View>

              <View style={styles.assignmentItem}>
                <Text style={styles.assignmentLabel}>Route</Text>
                <Text style={styles.assignmentValue}>
                  {assignmentData.route_number}
                </Text>
                <Text style={styles.assignmentSubValue}>
                  {assignmentData.route_name}
                </Text>
              </View>

              <View style={styles.assignmentItem}>
                <Text style={styles.assignmentLabel}>Shift Time</Text>
                <Text style={styles.assignmentValue}>
                  {assignmentData.shift_start_time} - {assignmentData.shift_end_time}
                </Text>
                <Text style={styles.assignmentSubValue}>
                  {new Date(assignmentData.assignment_date).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.assignmentItem}>
                <Text style={styles.assignmentLabel}>Status</Text>
                <View style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: assignmentData.status === 'active' ? AppColors.success : 
                                   assignmentData.status === 'assigned' ? AppColors.warning : AppColors.textSecondary
                  }
                ]}>
                  <Text style={styles.statusText}>
                    {assignmentData.status ? assignmentData.status.toUpperCase() : 'UNKNOWN'}
                  </Text>
                </View>
              </View>

              <View style={styles.assignmentItem}>
                <Text style={styles.assignmentLabel}>Route Details</Text>
                <Text style={styles.assignmentSubValue}>
                  {assignmentData.start_location} → {assignmentData.end_location}
                </Text>
              </View>

              <View style={styles.assignmentItem}>
                <Text style={styles.assignmentLabel}>Depot</Text>
                <Text style={styles.assignmentValue}>
                  {assignmentData.depot_name}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Map View */}
        {showMap && currentLocation && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="map"
                size={24}
                color={AppColors.primary}
              />
              <Text style={styles.cardTitle}>Current Location Map</Text>
            </View>
            
            <View style={styles.mapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                <Marker
                  coordinate={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }}
                  title={assignmentData ? `Bus ${assignmentData.bus_registration}` : "Current Location"}
                  description={assignmentData ? `Route ${assignmentData.route_number}` : "Driver Location"}
                >
                  <MaterialCommunityIcons
                    name="bus"
                    size={30}
                    color={AppColors.primary}
                  />
                </Marker>
              </MapView>
            </View>
          </View>
        )}
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
            <Text style={styles.infoValue}>
              {assignmentData ? `${assignmentData.bus_registration} (ID: ${assignmentData.bus_id})` : (trackingStatus.busId || 'N/A')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Route:</Text>
            <Text style={styles.infoValue}>
              {assignmentData ? `${assignmentData.route_number} - ${assignmentData.route_name}` : (trackingStatus.routeId || 'N/A')}
            </Text>
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
              Assignment ID: {assignmentData?.assignment_id || 'N/A'}
            </Text>
            <Text style={styles.debugText}>
              Assignment Status: {assignmentData?.status || 'N/A'}
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
  mapToggleButton: {
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
  assignmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  assignmentItem: {
    width: "48%",
    marginBottom: 16,
  },
  assignmentLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
    fontWeight: "500",
  },
  assignmentValue: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 2,
  },
  assignmentSubValue: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  mapContainer: {
    height: 250,
    borderRadius: 8,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
