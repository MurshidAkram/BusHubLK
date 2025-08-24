import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import axios from "axios";
import { API_BASE_URL, initializeApiConnection } from '../config/api';

const GOOGLE_MAPS_API_KEY = "AIzaSyAeXR9ct7HrHMCQXSWLrWQl5OlRYjNhbxo"; // <-- Replace with your key

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

const BASE_STAGE_KM = 3.2;
const FARE_STAGES: number[] = [
  17, 23, 30, 36, 43, 50, 56, 62, 68, 75, 81, 88, 94, 100, 106, 113, 119, 126, 132, 139, 145, 152, 158, 165, 171, 178, 184, 191, 197, 204, 210, 217, 223, 230, 236, 243, 249, 256, 262, 269, 275, 282, 288, 295, 301, 308, 314, 321, 327, 334
];

const BUS_ROUTES = [
  {
    routeNumber: "138",
    operator: "SLTB",
    from: "Colombo",
    to: "Kandy",
    via: ["Kadawatha", "Gampaha", "Kegalle"],
    frequency: "Every 30 mins",
    operatingHours: "5:00 AM - 10:00 PM",
    fare: 600,
    estimatedDuration: "3.5 hours",
  },
  {
    routeNumber: "1",
    operator: "SLTB",
    from: "Colombo",
    to: "Galle",
    via: ["Mount Lavinia", "Kalutara", "Bentota"],
    frequency: "Every 20 mins",
    operatingHours: "4:30 AM - 11:00 PM",
    fare: 600,
    estimatedDuration: "3 hours",
  },
  {
    routeNumber: "4",
    operator: "SLTB",
    from: "Colombo",
    to: "Matara",
    via: ["Mount Lavinia", "Kalutara", "Galle", "Unawatuna"],
    frequency: "Every 45 mins",
    operatingHours: "5:00 AM - 9:30 PM",
    fare: 700,
    estimatedDuration: "4 hours",
  },
  {
    routeNumber: "100",
    operator: "Private",
    from: "Colombo",
    to: "Kandy",
    frequency: "Every hour",
    operatingHours: "6:00 AM - 8:00 PM",
    fare: 620,
    estimatedDuration: "2.5 hours",
    via: ["Mawanella", "Peradeniya"],
  },
];

function decodePolyline(encoded) {
  const poly = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    poly.push([lat / 1e5, lng / 1e5]);
  }
  return poly;
}

export default function BusRouteResultsScreen({ route, navigation }) {
  const { from, to } = route.params;
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [fare, setFare] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number, longitude: number}>>([]);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [busStops, setBusStops] = useState<Array<{name: string, place_id?: string, type?: string}>>([]);
  const [numberOfStops, setNumberOfStops] = useState<number>(0);
  const [calculationMethod, setCalculationMethod] = useState<string>('');

  const mapRef = useRef(null);

  const fromText = from?.description || "";
  const toText = to?.description || "";

  // Calculate fare using backend API
  const calculateFareFromAPI = async (originPlaceId: string, destinationPlaceId: string) => {
    try {
      console.log('🔄 Calculating fare from API...', { originPlaceId, destinationPlaceId });
      
      // Initialize API connection to ensure we have the correct URL
      const apiUrl = await initializeApiConnection();
      console.log('🌐 Using API URL:', apiUrl);
      
      const response = await axios.post(`${apiUrl}/api/fares/calculate`, {
        origin: originPlaceId,
        destination: destinationPlaceId
      });
      
      console.log('✅ Fare API response:', response.data);
      
      if (response.data) {
        return {
          fare: response.data.fare,
          numberOfStops: response.data.numberOfCities || response.data.numberOfStops, // Support both for backward compatibility
          distance: response.data.distance,
          duration: response.data.duration,
          busStops: response.data.cities || response.data.busStops || [], // Support both cities and busStops
          calculationMethod: response.data.calculation?.method || 'unknown'
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error calculating fare from API:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      return null;
    }
  };

  // Helper: Get lat/lng from place_id
  const getLatLng = async (place_id: string) => {
    try {
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${GOOGLE_MAPS_API_KEY}`
      );
      if (res.data.status === "OK") {
        return res.data.result.geometry.location;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Helper: Get route coordinates and duration from Google Directions API
  const getRouteCoordinates = async (fromPlaceId, toPlaceId) => {
    const fromLoc = await getLatLng(fromPlaceId);
    const toLoc = await getLatLng(toPlaceId);
    if (!fromLoc || !toLoc)
      return { coordinates: [], distance: null, region: null, duration: null };

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLoc.lat},${fromLoc.lng}&destination=${toLoc.lat},${toLoc.lng}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const meters = route.legs[0].distance.value;
        const distance = meters / 1000;
        const duration = route.legs[0].duration.text;

        // Decode polyline
        const points = decodePolyline(route.overview_polyline.points);
        const coordinates = points.map((point) => ({
          latitude: point[0],
          longitude: point[1],
        }));

        // Calculate map region
        const region = {
          latitude: (fromLoc.lat + toLoc.lat) / 2,
          longitude: (fromLoc.lng + toLoc.lng) / 2,
          latitudeDelta: Math.abs(fromLoc.lat - toLoc.lat) * 1.5 || 0.2,
          longitudeDelta: Math.abs(fromLoc.lng - toLoc.lng) * 1.5 || 0.2,
        };

        return { coordinates, distance, region, duration };
      }
      return { coordinates: [], distance: null, region: null, duration: null };
    } catch {
      return { coordinates: [], distance: null, region: null, duration: null };
    }
  };

  // Find available bus routes
  const findAvailableRoutes = (from, to) => {
    const clean = (str) =>
      str.toLowerCase().replace(/,? sri lanka/i, "").trim();
    const fromClean = clean(from);
    const toClean = clean(to);

    return BUS_ROUTES.filter((route) => {
      const routeFromClean = clean(route.from);
      const routeToClean = clean(route.to);

      return (
        (fromClean.includes(routeFromClean) && toClean.includes(routeToClean)) ||
        (fromClean.includes(routeToClean) && toClean.includes(routeFromClean)) ||
        (route.via &&
          route.via.some(
            (via) =>
              fromClean.includes(clean(via)) || toClean.includes(clean(via))
          ))
      );
    });
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setShowMap(false);

      try {
        console.log('🚀 Starting fare calculation for:', { from: fromText, to: toText });

        // Find available routes
        const routes = findAvailableRoutes(fromText, toText);
        setAvailableRoutes(routes);

        // Calculate fare using backend API
        const fareData = await calculateFareFromAPI(from.place_id, to.place_id);
        
        if (fareData) {
          console.log('✅ Fare calculation successful:', fareData);
          setFare(fareData.fare);
          setDistance(fareData.distance);
          setDuration(fareData.duration);
          setNumberOfStops(fareData.numberOfStops);
          setBusStops(fareData.busStops);
          setCalculationMethod(fareData.calculationMethod);
          
          // Get route coordinates for map display
          const { coordinates, region } = await getRouteCoordinates(from.place_id, to.place_id);
          if (coordinates.length > 0) {
            setRouteCoordinates(coordinates);
            setMapRegion(region);
            setShowMap(true);
          }
        } else {
          console.log('⚠️ API failed, falling back to local calculation');
          // Fallback to local calculation if API fails
          const { coordinates, distance: dist, region, duration: estDuration } =
            await getRouteCoordinates(from.place_id, to.place_id);

          if (dist !== null) {
            setDistance(dist);
            setRouteCoordinates(coordinates);
            setMapRegion(region);
            setShowMap(true);
            setDuration(estDuration || null);

            // Calculate fare based on distance if no specific route found
            if (routes.length === 0) {
              const stageCount = Math.ceil(dist / BASE_STAGE_KM);
              const cappedStage = Math.min(stageCount, FARE_STAGES.length);
              let calculatedFare = Math.round(FARE_STAGES[cappedStage - 1] * 1.6);
              setFare(calculatedFare);
            } else {
              // Use the fare from the first available route
              setFare(routes[0].fare);
            }
          } else {
            console.log('❌ Could not calculate route');
            setDistance(null);
            setFare(null);
            setShowMap(false);
            setDuration(null);
          }
        }
      } catch (error) {
        console.error('❌ Error in fetchData:', error);
        setDistance(null);
        setFare(null);
        setShowMap(false);
        setDuration(null);
      } finally {
        setLoading(false);
      }
    }

    if (from && to && from.place_id && to.place_id) {
      fetchData();
    }
    // eslint-disable-next-line
  }, [from, to]);

  

  const renderBusRoute = ({ item }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={styles.routeNumberContainer}>
          <View style={styles.routeNumberBadge}>
            <Text style={styles.routeNumber}>{item.routeNumber}</Text>
          </View>
          
        </View>
        <View style={styles.operatorContainer}>
          <Text style={styles.operator}>{item.operator}</Text>
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Fare</Text>
            <Text style={styles.fare}>Rs. {item.fare}</Text>
          </View>
        </View>
      </View>

      <View style={styles.routeDetails}>
        <View style={styles.routeInfo}>
          <View style={styles.iconContainer}>
            <Icon name="time-outline" size={18} color={AppColors.primary} />
          </View>
          <Text style={styles.routeText}>{item.frequency}</Text>
        </View>
        <View style={styles.routeInfo}>
          <View style={styles.iconContainer}>
            <Icon name="time-outline" size={18} color={AppColors.primary} />
          </View>
          <Text style={styles.routeText}>{item.operatingHours}</Text>
        </View>
        <View style={styles.routeInfo}>
          <View style={styles.iconContainer}>
            <Icon name="speedometer-outline" size={18} color={AppColors.primary} />
          </View>
          <Text style={styles.routeText}>{item.estimatedDuration}</Text>
        </View>
      </View>

      {item.via && item.via.length > 0 && (
        <View style={styles.viaContainer}>
          <View style={styles.viaHeader}>
            <Icon name="trail-sign-outline" size={16} color={AppColors.primary} />
            <Text style={styles.viaLabel}>Route Via</Text>
          </View>
          <Text style={styles.viaText}>{item.via.join(" → ")}</Text>
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
    <Text style={styles.loadingText}>Calculating fare based on cities along route...</Text>
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
        <Marker
          coordinate={routeCoordinates[0]}
          title="Start Location"
          description={fromText}
          pinColor="green"
        >
          <View style={styles.customMarker}>
            <Icon name="location" size={24} color={AppColors.success} />
          </View>
        </Marker>
        <Marker
          coordinate={routeCoordinates[routeCoordinates.length - 1]}
          title="Destination"
          description={toText}
          pinColor="red"
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
    
    <View style={styles.infoCard}>
      <View style={styles.infoIconContainer}>
        <Icon name="bus-outline" size={24} color={AppColors.primary} />
      </View>
      <Text style={styles.infoLabel}>Cities</Text>
      <Text style={styles.infoValue}>{numberOfStops}</Text>
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

{/* Bus Stops Along Route */}
{busStops.length > 0 && (
  <View style={styles.stopsContainer}>
    <View style={styles.sectionHeader}>
      <Icon name="location-outline" size={24} color={AppColors.primary} />
      <Text style={styles.sectionTitle}>Cities Along Route</Text>
      <View style={styles.routeCount}>
        <Text style={styles.routeCountText}>{busStops.length}</Text>
      </View>
    </View>
    <View style={styles.stopsCard}>
      {busStops.map((stop, index) => (
        <View key={stop.place_id || stop.name || `city-${index}`} style={[styles.stopItem, index === busStops.length - 1 && styles.stopItemLast]}>
          <View style={[styles.stopIcon, stop.type === 'city' && styles.cityIcon]}>
            <Icon 
              name={stop.type === 'city' ? 'location' : 'bus'} 
              size={16} 
              color={stop.type === 'city' ? AppColors.warning : AppColors.primary} 
            />
          </View>
          <View style={styles.stopContent}>
            <Text style={styles.stopName}>{stop.name}</Text>
            {stop.type && (
              <Text style={styles.stopType}>
                {stop.type === 'city' ? 'City/Town' : 
                 stop.type === 'transit_stop' ? 'Transit Stop' : 
                 stop.type === 'major_station' ? 'Major Station' : 'Bus Stop'}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
    {calculationMethod && (
      <Text style={styles.calculationNote}>
        Fare calculated using {calculationMethod === 'city_based' ? 'city data' : calculationMethod === 'transit_based' ? 'transit data' : 'distance estimation'}
      </Text>
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
    <FlatList
      data={availableRoutes}
      keyExtractor={(item, index) => `${item.routeNumber}-${index}`}
      renderItem={renderBusRoute}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    />
  </View>
)}

{availableRoutes.length === 0 && fare !== null && !loading && (
  <View style={styles.noRoutesCard}>
    <View style={styles.noRoutesIcon}>
      <Icon
        name="information-circle-outline"
        size={32}
        color={AppColors.warning}
      />
    </View>
    <Text style={styles.noRoutesTitle}>No Direct Routes Found</Text>
    <Text style={styles.noRoutesText}>
      Fare calculated based on {numberOfStops} cities found along the route. You may need to take connecting buses or alternative transport.
    </Text>
  </View>
)}

{fare === null && !loading && (
  <View style={styles.errorCard}>
    <View style={styles.errorIcon}>
      <Icon name="alert-circle-outline" size={32} color={AppColors.warning} />
    </View>
    <Text style={styles.errorTitle}>Route Not Found</Text>
    <Text style={styles.errorText}>
      No route found between the selected locations. Please try different locations.
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
    height: screenHeight * 0.45, // Increased map size to 45% of screen height
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
  infoSubtext: {
    fontSize: 10,
    color: AppColors.textSecondary,
    marginTop: 2,
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
  errorCard: {
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
  errorIcon: {
    backgroundColor: AppColors.warning + "20",
    borderRadius: 30,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  stopsContainer: {
    marginBottom: 20,
  },
  stopsCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 16,
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
  stopItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  stopItemLast: {
    borderBottomWidth: 0,
  },
  stopIcon: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 12,
    padding: 6,
    marginRight: 12,
  },
  transitStopIcon: {
    backgroundColor: AppColors.success + "20",
  },
  cityIcon: {
    backgroundColor: AppColors.warning + "20",
  },
  stopContent: {
    flex: 1,
  },
  stopName: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: "500",
  },
  stopType: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  stopsSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 12,
    fontStyle: "italic",
  },
  calculationNote: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
});