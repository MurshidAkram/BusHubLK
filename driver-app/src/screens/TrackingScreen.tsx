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
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useFocusEffect } from "@react-navigation/native";
import { storageAPI, driverAPI } from "../services/api";
import { locationService } from "../services/locationService";

import BackgroundLocationService from "../services/backgroundLocationService";

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
  placeName?: string; // Add place name to location data
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

  // Auto-refresh tracking status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkTrackingStatus();
      loadAssignmentDataFromService();
      getCurrentLocation();
    }, [])
  );

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
          
          // Update tracking status with assignment data
          setTrackingStatus(prev => ({
            ...prev,
            busId: response.bus_id?.toString() || null,
            routeId: response.route_id?.toString() || null,
          }));
          
          console.log(`📋 Assignment loaded for display:`, {
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


  // Load assignment from locationService (set by ScheduleScreen)
  const loadAssignmentDataFromService = async () => {
    try {
      // Try to load from locationService first
      const activeAssignment = await locationService.loadAssignmentFromStorage();
      if (activeAssignment) {
        console.log("📋 Active assignment from locationService:", activeAssignment);
        // Update tracking status with data from the service
        setTrackingStatus(prev => ({
          ...prev,
          busId: activeAssignment.bus_id?.toString() || null,
          routeId: activeAssignment.route_id?.toString() || null,
        }));
        
        // If we have assignment data, try to get full details
        if (userData?.driver_id) {
          await loadAssignmentData();
        }
      } else {
        // Fallback: Try BackgroundLocationService
        const backgroundAssignment = await BackgroundLocationService.getActiveAssignment();
        if (backgroundAssignment) {
          console.log("📋 Active assignment from BackgroundLocationService:", backgroundAssignment);
          setTrackingStatus(prev => ({
            ...prev,
            busId: backgroundAssignment.busId?.toString() || null,
            routeId: backgroundAssignment.routeId?.toString() || null,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading assignment from service:", error);
    }
  };

  // Function to get place name from coordinates
  const getPlaceName = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const parts = [];
        
        if (address.name) parts.push(address.name);
        if (address.street) parts.push(address.street);
        if (address.district) parts.push(address.district);
        if (address.city) parts.push(address.city);
        
        return parts.length > 0 ? parts.slice(0, 2).join(', ') : 'Unknown Location';
      }
      return 'Unknown Location';
    } catch (error) {
      console.error("Error getting place name:", error);
      return 'Unknown Location';
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

      // Get place name for the current location
      const placeName = await getPlaceName(location.coords.latitude, location.coords.longitude);

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
        accuracy: location.coords.accuracy || undefined,
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
        placeName: placeName,
      };

      setCurrentLocation(locationData);
      
      // Add to history (keep last 10 locations)
      setLocationHistory(prev => [locationData, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert('Error', 'Failed to get current location.');
    }
  };

  const checkTrackingStatus = async () => {
    // Check if location tracking is active
    const isActive = await locationService.isTrackingActive();
    setTrackingStatus(prev => ({
      ...prev,
      isActive,
      lastUpdate: isActive ? new Date().toISOString() : prev.lastUpdate,
    }));
    console.log("🔍 Tracking status check:", isActive ? "ACTIVE ✅" : "INACTIVE ❌");
    
    // Also load assignment data to display bus and route info
    await loadAssignmentDataFromService();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getCurrentLocation();
    await checkTrackingStatus();
    await loadAssignmentDataFromService();
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
    <LinearGradient
      colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent={false}
        />
        
        {/* Enhanced Header with Gradient */}
        <LinearGradient
          colors={['#0056b3', '#1976d2', '#42a5f5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tracking Data</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={onRefresh}
              >
                <Ionicons name="refresh" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => setShowMap(!showMap)}
              >
                <Ionicons name={showMap ? "list" : "map"} size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

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
                                   assignmentData.status === 'assigned' || assignmentData.status === 'scheduled' ? AppColors.success : AppColors.textSecondary
                  }
                ]}>
                  <Text style={styles.statusText}>
                    {assignmentData.status ? assignmentData.status.toUpperCase() : 'UNKNOWN'}
                  </Text>
                </View>
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
              {assignmentData ? assignmentData.bus_registration : (trackingStatus.busId || 'N/A')}
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

          {!trackingStatus.isActive && (
            <View style={styles.infoMessage}>
              <MaterialCommunityIcons name="information" size={20} color={AppColors.textSecondary} />
              <Text style={styles.infoMessageText}>
                Tracking is controlled from the Schedule screen. Start your schedule to begin tracking.
              </Text>
            </View>
          )}
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

            <View style={styles.locationNameContainer}>
              <Text style={styles.locationName}>
                {currentLocation.placeName || 'Fetching location...'}
              </Text>
            </View>

            {currentLocation.speed && (
              <View style={styles.locationGrid}>
                <View style={styles.locationItem}>
                  <Text style={styles.locationLabel}>Speed</Text>
                  <Text style={styles.locationValue}>
                    {(currentLocation.speed * 3.6).toFixed(1)} km/h
                  </Text>
                </View>
              </View>
            )}

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
                <Text style={styles.historyLocation}>
                  {location.placeName || 'Unknown Location'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 4,
    borderWidth: 0,
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: AppColors.text,
    marginLeft: 10,
    letterSpacing: 0.3,
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
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
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
  infoMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(0, 86, 179, 0.08)',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 86, 179, 0.2)',
  },
  infoMessageText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
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
  locationNameContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 86, 179, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 86, 179, 0.15)',
  },
  locationName: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.primary,
    textAlign: "center",
    lineHeight: 24,
    letterSpacing: 0.2,
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
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0, 86, 179, 0.03)',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  historyTime: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
  },
  historyIndex: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.textSecondary,
    backgroundColor: 'rgba(0, 86, 179, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  historyLocation: {
    fontSize: 15,
    color: AppColors.text,
    fontWeight: "600",
    marginTop: 4,
    lineHeight: 21,
    letterSpacing: 0.2,
  },
  assignmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  assignmentItem: {
    width: "48%",
    backgroundColor: 'rgba(0, 86, 179, 0.04)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 86, 179, 0.1)',
  },
  assignmentLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 6,
    fontWeight: "600",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assignmentValue: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  assignmentSubValue: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  mapContainer: {
    height: 280,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: 'rgba(0, 86, 179, 0.15)',
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});