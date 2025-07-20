import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import apiService from '../services/apiService';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AppColors = {
  primary: '#007AFF',
  primaryLight: '#E6F2FF',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
  shadow: '#000000',
  success: '#34C759',
  warning: '#FF9500',
};

interface BusRoute {
  bus_route_id: number;
  bus_id: number;
  route_id: number;
  registration_number: string;
  bus_type: string;
  operator: string;
  route_number: string;
  route_name: string;
  start_location: string;
  end_location: string;
  distance: number;
}

interface RouteCoordinates {
  latitude: number;
  longitude: number;
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface Place {
  place_id: string;
  description: string;
}

interface RouteProps {
  params: {
    from: Place;
    to: Place;
  };
}

interface ScreenProps {
  route: RouteProps;
  navigation: {
    goBack: () => void;
  };
}

// Function to decode Google Maps polyline
function decodePolyline(encoded: string): [number, number][] {
  const poly: [number, number][] = [];
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

    poly.push([lat / 1e5, lng / 1e5]);
  }

  return poly;
}

function BusRouteResultsScreen({ route, navigation }: ScreenProps) {
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState<BusRoute[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinates[]>([]);
  const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);
  const [distance, setDistance] = useState<number | null>(0);
  const [duration, setDuration] = useState<string | null>(null);
  const [fare, setFare] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);

  // Safely extract route params with fallbacks
  const fromPlace = route?.params?.from;
  const toPlace = route?.params?.to;
  const fromText = fromPlace?.description || "Unknown Location";
  const toText = toPlace?.description || "Unknown Location";

  console.log('BusRouteResultsScreen - Route params:', { fromPlace, toPlace });

  useEffect(() => {
    async function fetchData() {
      console.log('BusRouteResultsScreen - Starting data fetch');
      setLoading(true);
      setError(null);
      setShowMap(false);

      // Check if we have valid route params
      if (!fromPlace || !toPlace) {
        console.error('Missing route parameters:', { fromPlace, toPlace });
        setError('Invalid route parameters. Please go back and try again.');
        setLoading(false);
        return;
      }

      if (!fromText || !toText) {
        console.error('Missing location descriptions');
        setError('Invalid location data. Please go back and try again.');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching routes for:', fromText, 'to:', toText);
        
        // Fetch route data from backend
        const routeData = await apiService.searchRoutes(fromText, toText);
        console.log('Route data received:', routeData);
        
        if (routeData.routes && routeData.routes.length > 0) {
          const route = routeData.routes[0];
          
          // Set route information
          setDistance(route.distance);
          setDuration(route.estimated_duration);
          setFare(route.fare);
          
          // Set available bus routes
          setAvailableRoutes(routeData.available_bus_routes || []);
          
          // Decode and set polyline coordinates
          if (route.polyline) {
            try {
              const points = decodePolyline(route.polyline);
              const coordinates = points.map(point => ({
                latitude: point[0],
                longitude: point[1]
              }));

              setRouteCoordinates(coordinates);
              
              // Calculate map region from coordinates
              if (coordinates.length > 0) {
                const latitudes = coordinates.map(c => c.latitude);
                const longitudes = coordinates.map(c => c.longitude);
                
                const region = {
                  latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
                  longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
                  latitudeDelta: Math.max((Math.max(...latitudes) - Math.min(...latitudes)) * 1.5, 0.01),
                  longitudeDelta: Math.max((Math.max(...longitudes) - Math.min(...longitudes)) * 1.5, 0.01)
                };

                setMapRegion(region);
                setShowMap(true);
              }
            } catch (polylineError) {
              console.error('Error decoding polyline:', polylineError);
            }
          }
        } else {
          console.log('No routes found');
          setError('No routes found between the selected locations.');
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        setError('Failed to fetch route data. Please check your internet connection and try again.');
      }

      setLoading(false);
    }

    fetchData();
  }, [fromText, toText]);

  const getBusTypeColor = (busType: string): string => {
    switch (busType?.toLowerCase()) {
      case "luxury":
        return AppColors.success;
      case "semi-luxury":
        return AppColors.primary;
      case "express":
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
            <Text style={styles.fare}>Rs. {fare || 'N/A'}</Text>
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
          <Text style={styles.routeText}>{item.distance} km</Text>
        </View>
        <View style={styles.routeInfo}>
          <View style={styles.iconContainer}>
            <Icon name="time-outline" size={18} color={AppColors.primary} />
          </View>
          <Text style={styles.routeText}>{duration || 'Duration N/A'}</Text>
        </View>
        <View style={styles.routeInfo}>
          <View style={styles.iconContainer}>
            <Icon name="business-outline" size={18} color={AppColors.primary} />
          </View>
          <Text style={styles.routeText}>Operator: {item.operator}</Text>
        </View>
      </View>
    </View>
  );

  const handleRetry = () => {
    // Trigger a re-fetch by updating a state that causes useEffect to run
    setError(null);
    setLoading(true);
    // The useEffect will handle the retry
  };

  if (error) {
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

        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Icon name="alert-circle-outline" size={48} color={AppColors.warning} />
          </View>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          {showMap && mapRegion && routeCoordinates.length > 0 && !loading && (
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
                <Text style={styles.infoValue}>{distance?.toFixed(1)} km</Text>
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
          {availableRoutes.length > 0 && !loading && (
            <View style={styles.routesContainer}>
              <View style={styles.sectionHeader}>
                <Icon name="bus-outline" size={24} color={AppColors.primary} />
                <Text style={styles.sectionTitle}>Available Bus Routes</Text>
                <View style={styles.routeCount}>
                  <Text style={styles.routeCountText}>{availableRoutes.length}</Text>
                </View>
              </View>
              <FlatList
                data={availableRoutes}
                keyExtractor={(item) => `${item.bus_route_id}-${item.route_id}`}
                renderItem={renderBusRoute}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {availableRoutes.length === 0 && !loading && distance !== null && (
            <View style={styles.noRoutesCard}>
              <View style={styles.noRoutesIcon}>
                <Icon
                  name="information-circle-outline"
                  size={32}
                  color={AppColors.warning}
                />
              </View>
              <Text style={styles.noRoutesTitle}>No Direct Bus Routes Found</Text>
              <Text style={styles.noRoutesText}>
                No direct bus routes available between these locations. The fare shown is calculated based on distance. You may need to take connecting buses.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
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
    ...Platform.select({
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
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
    ...Platform.select({
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
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
    ...Platform.select({
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginTop: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    backgroundColor: AppColors.warning + "20",
    borderRadius: 40,
    padding: 20,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: AppColors.card,
    fontSize: 16,
    fontWeight: "600",
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
    ...Platform.select({
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  map: {
    height: screenHeight * 0.45,
    width: "100%",
  },
  customMarker: {
    backgroundColor: AppColors.card,
    borderRadius: 20,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
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
    ...Platform.select({
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
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
    ...Platform.select({
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
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
  noRoutesCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.warning + "30",
    ...Platform.select({
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
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

export default BusRouteResultsScreen;
