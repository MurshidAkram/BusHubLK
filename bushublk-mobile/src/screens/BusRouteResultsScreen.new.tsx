import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  Pressable,
  StatusBar,
  Alert,
  FlatList,
} from "react-native";

interface BusRoute {
  route_id: number;
  bus_route_id: number;
  route_number: string;
  origin: string;
  destination: string;
  via?: string;
  bus_type: string;
  operator: string;
  fare: number;
}
import Icon from "react-native-vector-icons/Ionicons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import apiService from "../services/apiService";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AppColors = {
  background: "#F8F9FA",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryLight: "#E3F2FD",
  text: "#212529",
  textSecondary: "#6C757D",
  border: "#DEE2E6",
  success: "#28a745",
  warning: "#ffc107",
  shadow: "#000000",
  gradient: {
    start: "#0056b3",
    end: "#007bff",
  },
};

interface BusRoute {
  route_id: number;
  route_number: string;
  route_name: string;
  start_location: string;
  end_location: string;
  distance: number;
  registration_number: string;
  bus_type: string;
  bus_route_id: number;
  intermediateStops?: Array<{
    stop_name: string;
    stop_order: number;
    distance_from_start: number;
  }>;
  segment_distance?: number;
  estimated_duration?: string;
  google_maps_distance?: string;
  polyline?: string;
  fare: number;
}

interface RouteParams {
  from: {
    place_id: string;
    description: string;
  };
  to: {
    place_id: string;
    description: string;
  };
}

interface NavigationProps {
  goBack: () => void;
}

interface ScreenProps {
  route: { params: RouteParams };
  navigation: NavigationProps;
}

function decodePolyline(encoded: string): Array<{latitude: number, longitude: number}> {
  const poly: Array<{latitude: number, longitude: number}> = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let shift = 0, result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5
    });
  }

  return poly;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    backgroundColor: AppColors.primary,
    paddingTop: Platform.OS === "ios" ? 50 : 25,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.card,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  locationContainer: {
    flex: 1,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  locationText: {
    fontSize: 16,
    color: AppColors.text,
    flex: 1,
    fontWeight: "500",
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: AppColors.border,
    marginLeft: 5,
    marginVertical: 4,
  },
  loadingContainer: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginTop: 16,
    fontWeight: "500",
  },
  mapContainer: {
    marginBottom: 20,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
    marginLeft: 8,
  },
  mapWrapper: {
    borderRadius: 16,
    overflow: "hidden",
  },
  map: {
    height: screenHeight * 0.45,
    width: "100%",
  },
  customMarker: {
    backgroundColor: AppColors.card,
    borderRadius: 20,
    padding: 8,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  infoCard: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    minWidth: screenWidth * 0.28,
  },
  infoIconContainer: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 20,
    padding: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.text,
  },
  routesContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
    marginLeft: 8,
    flex: 1,
  },
  routeCount: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  routeCountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: AppColors.card,
  },
  routeCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  routeNumberContainer: {
    flex: 1,
  },
  routeNumberBadge: {
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.card,
  },
  busTypeBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  busType: {
    fontSize: 12,
    fontWeight: "600",
  },
  operatorContainer: {
    alignItems: "flex-end",
  },
  operator: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
    fontWeight: "500",
  },
  fareContainer: {
    alignItems: "flex-end",
  },
  fareLabel: {
    fontSize: 10,
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  fare: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.success,
  },
  routeDetails: {
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    alignItems: "center",
  },
  routeText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  viaContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  viaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  viaLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.text,
    marginLeft: 6,
  },
  viaText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  noRoutesCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.warning + "30",
  },
  noRoutesIcon: {
    backgroundColor: AppColors.warning + "20",
    borderRadius: 30,
    padding: 16,
    marginBottom: 16,
  },
  noRoutesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  noRoutesText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default function BusRouteResultsScreen({ route, navigation }: ScreenProps) {
  const { from, to } = route.params;
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [fare, setFare] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number, longitude: number}>>([]);
  const [mapRegion, setMapRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [availableRoutes, setAvailableRoutes] = useState<BusRoute[]>([]);
  const [showMap, setShowMap] = useState(false);

  const mapRef = useRef<MapView>(null);

  const fromText = from?.description || "";
  const toText = to?.description || "";

  useEffect(() => {
    async function fetchData() {
      if (!fromText || !toText) {
        return;
      }

      setLoading(true);
      setShowMap(false);

      try {
        // Fetch routes from backend
        const routes = await apiService.searchRoutes(fromText, toText);
        setAvailableRoutes(routes);

        if (routes.length > 0) {
          const firstRoute = routes[0];
          
          if (firstRoute.polyline) {
            // Decode and set route coordinates
            const coordinates = decodePolyline(firstRoute.polyline);
            setRouteCoordinates(coordinates);

            // Calculate map region
            const latitudes = coordinates.map(c => c.latitude);
            const longitudes = coordinates.map(c => c.longitude);
            
            const region = {
              latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
              longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
              latitudeDelta: (Math.max(...latitudes) - Math.min(...latitudes)) * 1.5,
              longitudeDelta: (Math.max(...longitudes) - Math.min(...longitudes)) * 1.5
            };

            setMapRegion(region);
            setShowMap(true);
          }

          // Set route details
          setDistance(firstRoute.segment_distance || null);
          setDuration(firstRoute.estimated_duration || null);
          setFare(firstRoute.fare || null);
        } else {
          setShowMap(false);
          setDistance(null);
          setDuration(null);
          setFare(null);
        }
      } catch (error) {
        console.error('Error fetching route data:', error);
        Alert.alert(
          'Error',
          'Failed to fetch route information. Please try again.'
        );
        setShowMap(false);
        setDistance(null);
        setDuration(null);
        setFare(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [fromText, toText]);

  const getBusTypeColor = (busType: string): string => {
    switch (busType) {
      case "Luxury":
        return AppColors.success;
      case "Semi-Luxury":
        return AppColors.primary;
      case "Express":
        return AppColors.warning;
      default:
        return AppColors.textSecondary;
    }
  };

  const renderBusRoute = ({ item }: { item: BusRoute }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={styles.routeNumberContainer}>
          <View style={styles.routeNumberBadge}>
            <Text style={styles.routeNumber}>{item.route_number}</Text>
          </View>
          <View style={[styles.busTypeBadge, { backgroundColor: getBusTypeColor(item.bus_type) + '20' }]}>
            <Text style={[styles.busType, { color: getBusTypeColor(item.bus_type) }]}>
              {item.bus_type}
            </Text>
          </View>
        </View>
        <View style={styles.operatorContainer}>
          <Text style={styles.operator}>Bus: {item.registration_number}</Text>
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Fare</Text>
            <Text style={styles.fare}>Rs. {item.fare || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.routeDetails}>
        <View style={styles.routeInfo}>
          <View style={styles.iconContainer}>
            <Icon name="map-outline" size={18} color={AppColors.primary} />
          </View>
          <Text style={styles.routeText}>{item.route_name}</Text>
        </View>
        <View style={styles.routeInfo}>
          <View style={styles.iconContainer}>
            <Icon name="navigate-outline" size={18} color={AppColors.primary} />
          </View>
          <Text style={styles.routeText}>{item.google_maps_distance || `${item.segment_distance?.toFixed(1)} km`}</Text>
        </View>
        <View style={styles.routeInfo}>
          <View style={styles.iconContainer}>
            <Icon name="time-outline" size={18} color={AppColors.primary} />
          </View>
          <Text style={styles.routeText}>{item.estimated_duration || 'Duration N/A'}</Text>
        </View>
      </View>

      {item.intermediateStops && item.intermediateStops.length > 0 && (
        <View style={styles.viaContainer}>
          <View style={styles.viaHeader}>
            <Icon name="trail-sign-outline" size={16} color={AppColors.primary} />
            <Text style={styles.viaLabel}>Stops</Text>
          </View>
          <Text style={styles.viaText}>
            {item.intermediateStops.map(stop => stop.stop_name).join(" → ")}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} 
        backgroundColor={AppColors.primary} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={AppColors.card} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Route Results</Text>
          <Text style={styles.headerSubtitle}>BusHubLK</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Route Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.locationContainer}>
              <View style={styles.locationItem}>
                <View style={[styles.locationDot, { backgroundColor: AppColors.success }]} />
                <Text style={styles.locationText} numberOfLines={2}>{fromText}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.locationItem}>
                <View style={[styles.locationDot, { backgroundColor: AppColors.warning }]} />
                <Text style={styles.locationText} numberOfLines={2}>{toText}</Text>
              </View>
            </View>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={AppColors.primary} />
              <Text style={styles.loadingText}>Finding best routes...</Text>
            </View>
          )}

          {/* Map View */}
          {showMap && mapRegion && routeCoordinates.length > 0 && (
            <View style={styles.mapContainer}>
              <View style={styles.mapHeader}>
                <Icon name="map-outline" size={20} color={AppColors.primary} />
                <Text style={styles.mapTitle}>Route Map</Text>
              </View>
              <View style={styles.mapWrapper}>
                <MapView
                  ref={mapRef}
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  style={styles.map}
                  initialRegion={mapRegion}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                  showsCompass={true}
                  showsScale={true}
                  mapType="standard"
                  loadingEnabled={true}
                  loadingIndicatorColor={AppColors.primary}
                  loadingBackgroundColor={AppColors.background}
                >
                  {routeCoordinates.length > 0 && (
                    <>
                      <Marker
                        coordinate={routeCoordinates[0]}
                        title="Start Location"
                        description={fromText}
                      >
                        <View style={styles.customMarker}>
                          <Icon name="location" size={24} color={AppColors.success} />
                        </View>
                      </Marker>
                      <Marker
                        coordinate={routeCoordinates[routeCoordinates.length - 1]}
                        title="Destination"
                        description={toText}
                      >
                        <View style={styles.customMarker}>
                          <Icon name="flag" size={24} color={AppColors.warning} />
                        </View>
                      </Marker>
                      <Polyline
                        coordinates={routeCoordinates}
                        strokeColor={AppColors.primary}
                        strokeWidth={4}
                        lineDashPattern={[1]}
                      />
                    </>
                  )}
                </MapView>
              </View>
            </View>
          )}

          {/* Route Information */}
          {distance !== null && !loading && (
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
                  <Icon name="navigate-outline" size={24} color={AppColors.primary} />
                </View>
                <Text style={styles.infoLabel}>Distance</Text>
                <Text style={styles.infoValue}>{distance.toFixed(1)} km</Text>
              </View>
              
              {fare !== null && (
                <View style={styles.infoCard}>
                  <View style={styles.infoIconContainer}>
                    <Icon name="cash-outline" size={24} color={AppColors.success} />
                  </View>
                  <Text style={styles.infoLabel}>Est. Fare</Text>
                  <Text style={styles.infoValue}>Rs. {fare}</Text>
                </View>
              )}
              
              {duration && (
                <View style={styles.infoCard}>
                  <View style={styles.infoIconContainer}>
                    <Icon name="time-outline" size={24} color={AppColors.warning} />
                  </View>
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>{duration}</Text>
                </View>
              )}
            </View>
          )}

          {/* Available Bus Routes */}
          {availableRoutes.length > 0 && (
            <View style={styles.routesContainer}>
              <View style={styles.sectionHeader}>
                <Icon name="bus-outline" size={24} color={AppColors.primary} />
                <Text style={styles.sectionTitle}>Available Bus Routes</Text>
                <View style={styles.routeCount}>
                  <Text style={styles.routeCountText}>{availableRoutes.length}</Text>
                </View>
              </View>
              <FlatList<BusRoute>
                data={availableRoutes}
                keyExtractor={(item: BusRoute) => `${item.route_id}-${item.bus_route_id}`}
                renderItem={({ item }: { item: BusRoute }) => renderBusRoute({ item })}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {/* No Routes Found */}
          {availableRoutes.length === 0 && !loading && (
            <View style={styles.noRoutesCard}>
              <View style={styles.noRoutesIcon}>
                <Icon
                  name="information-circle-outline"
                  size={32}
                  color={AppColors.warning}
                />
              </View>
              <Text style={styles.noRoutesTitle}>No Routes Found</Text>
              <Text style={styles.noRoutesText}>
                No direct bus routes found between these locations. You may need to consider connecting buses or alternative transport.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
