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
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { API_BASE_URL } from '../config/api';

const GOOGLE_MAPS_API_KEY = "AIzaSyDdK_SJ8L56-s33UpzL6Gn5UYDav9ZMGdg"; // From backend .env

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



function decodePolyline(encoded: string) {
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

export default function BusRouteResultsScreen({ route, navigation }: any) {
  const { from, to, routes, routeCount } = route.params;
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [fare, setFare] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number, longitude: number}>>([]);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [busStops, setBusStops] = useState<Array<{name?: string, stop_name?: string, place_id?: string, type?: string, order?: number, distanceKm?: number, vicinity?: string, distanceFromPrevious?: number, cumulativeDistance?: number, latitude?: number, longitude?: number, google_name?: string, formatted_address?: string}>>([]);
  const [numberOfStops, setNumberOfStops] = useState<number>(0);
  const [calculationMethod, setCalculationMethod] = useState<string>('');
  const [stopsDetected, setStopsDetected] = useState<number>(0);
  const [realCalculatedDistance, setRealCalculatedDistance] = useState<number | null>(null);

  const mapRef = useRef(null);

  const fromText = from?.description || "";
  const toText = to?.description || "";



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

  // Helper: Get lat/lng from bus stop name using Google Places Text Search
  const getCoordinatesFromStopName = async (stopName: string, country: string = "Sri Lanka") => {
    try {
      // Use Google Places Text Search API to find the bus stop by name
      const searchQuery = `${stopName} bus stop ${country}`;
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (response.data.status === "OK" && response.data.results.length > 0) {
        const place = response.data.results[0];
        return {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          place_id: place.place_id,
          formatted_address: place.formatted_address,
          name: place.name
        };
      }
      
      // If no results found with "bus stop", try with just the location name
      const fallbackQuery = `${stopName} ${country}`;
      const fallbackResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(fallbackQuery)}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (fallbackResponse.data.status === "OK" && fallbackResponse.data.results.length > 0) {
        const place = fallbackResponse.data.results[0];
        return {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          place_id: place.place_id,
          formatted_address: place.formatted_address,
          name: place.name
        };
      }

      return null;
    } catch (error) {
      console.log(`Error finding coordinates for stop: ${stopName}`, error);
      return null;
    }
  };

  // Helper: Get route coordinates from Google Directions API
  const getRouteCoordinates = async (fromPlaceId: string, toPlaceId: string) => {
    const fromLoc = await getLatLng(fromPlaceId);
    const toLoc = await getLatLng(toPlaceId);
    if (!fromLoc || !toLoc)
      return { coordinates: [], distance: null, region: null };

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLoc.lat},${fromLoc.lng}&destination=${toLoc.lat},${toLoc.lng}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const meters = route.legs[0].distance.value;
        const distance = meters / 1000;

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

        return { coordinates, distance, region };
      }
      return { coordinates: [], distance: null, region: null };
    } catch {
      return { coordinates: [], distance: null, region: null };
    }
  };

  // Find available bus routes (removed mock data - can be enhanced later)
  const findAvailableRoutes = (from: any, to: any) => {
    // This would be connected to a real bus routes database in the future
    return [];
  };

  // Calculate distance between user's FROM and TO stops specifically
  const calculateUserJourneyDistance = async (fromStopName: string, toStopName: string) => {
    try {
      console.log('🎯 Calculating distance between user stops:', fromStopName, '→', toStopName);

      // Get coordinates for both stops
      const fromCoordinates = await getCoordinatesFromStopName(fromStopName);
      const toCoordinates = await getCoordinatesFromStopName(toStopName);

      if (!fromCoordinates || !toCoordinates) {
        console.log('❌ Could not find coordinates for user stops');
        return null;
      }

      console.log('✅ Found coordinates:', {
        from: `${fromCoordinates.name} (${fromCoordinates.latitude}, ${fromCoordinates.longitude})`,
        to: `${toCoordinates.name} (${toCoordinates.latitude}, ${toCoordinates.longitude})`
      });

      // Calculate distance using Google Distance Matrix API
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${fromCoordinates.latitude},${fromCoordinates.longitude}&destinations=${toCoordinates.latitude},${toCoordinates.longitude}&units=metric&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (response.data.status === "OK" && response.data.rows[0].elements[0].status === "OK") {
        const distanceInMeters = response.data.rows[0].elements[0].distance.value;
        const distanceInKm = distanceInMeters / 1000;
        
        console.log('🎯 User journey distance:', distanceInKm.toFixed(2), 'km');
        
        return {
          distance: parseFloat(distanceInKm.toFixed(2)),
          fromCoordinates,
          toCoordinates
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error calculating user journey distance:', error);
      return null;
    }
  };

  // Calculate distances between consecutive bus stops using Google Distance Matrix API
  const calculateDistancesBetweenStops = async (stops: Array<any>) => {
    if (stops.length < 2) return stops;

    try {
      const stopsWithDistances = [...stops];
      
      // First, get coordinates for all stops that don't have them
      console.log('🔍 Finding coordinates for bus stops...');
      for (let i = 0; i < stopsWithDistances.length; i++) {
        const stop = stopsWithDistances[i];
        
        // If stop doesn't have coordinates, try to find them using the stop name
        if (!stop.latitude || !stop.longitude) {
          const coordinates = await getCoordinatesFromStopName(stop.name || stop.stop_name);
          if (coordinates) {
            stopsWithDistances[i] = {
              ...stopsWithDistances[i],
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              place_id: coordinates.place_id,
              formatted_address: coordinates.formatted_address,
              google_name: coordinates.name
            };
            console.log(`✅ Found coordinates for ${stop.name}: ${coordinates.latitude}, ${coordinates.longitude}`);
          } else {
            console.log(`❌ Could not find coordinates for stop: ${stop.name}`);
          }
        }
      }
      
      // Now calculate distances between consecutive stops
      console.log('📏 Calculating distances between stops...');
      for (let i = 0; i < stopsWithDistances.length - 1; i++) {
        const currentStop = stopsWithDistances[i];
        const nextStop = stopsWithDistances[i + 1];
        
        if (currentStop.latitude && currentStop.longitude && nextStop.latitude && nextStop.longitude) {
          try {
            const response = await axios.get(
              `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${currentStop.latitude},${currentStop.longitude}&destinations=${nextStop.latitude},${nextStop.longitude}&units=metric&key=${GOOGLE_MAPS_API_KEY}`
            );

            if (response.data.status === "OK" && response.data.rows[0].elements[0].status === "OK") {
              const distanceInMeters = response.data.rows[0].elements[0].distance.value;
              const distanceInKm = distanceInMeters / 1000;
              
              const cumulativeDistance = parseFloat(((stopsWithDistances[i].cumulativeDistance || 0) + distanceInKm).toFixed(2));
              
              stopsWithDistances[i + 1] = {
                ...stopsWithDistances[i + 1],
                distanceFromPrevious: parseFloat(distanceInKm.toFixed(2)),
                cumulativeDistance: cumulativeDistance
              };
              
              console.log(`📍 Distance from ${currentStop.name || currentStop.stop_name} to ${nextStop.name || nextStop.stop_name}: ${distanceInKm.toFixed(2)}km`);
              console.log(`📏 Cumulative distance to ${nextStop.name || nextStop.stop_name}: ${cumulativeDistance}km`);
            }
          } catch (error) {
            console.log(`❌ Could not calculate distance between ${currentStop.name} and ${nextStop.name}:`, error);
          }
        } else {
          console.log(`⚠️ Missing coordinates for stops: ${currentStop.name} or ${nextStop.name}`);
        }
      }

      return stopsWithDistances;
    } catch (error) {
      console.error('❌ Error calculating distances between stops:', error);
      return stops;
    }
  };

  useEffect(() => {
    async function initializeData() {
      setLoading(true);
      setShowMap(false);

      try {
        console.log('🚀 Initializing route results:', { from: fromText, to: toText, routeCount });

        // Set the available routes from the search results
        if (routes && routes.length > 0) {
          console.log('✅ Found routes from database:', routes);
          setAvailableRoutes(routes);
          
          // Calculate average information from all routes
          let totalDistance = 0;
          let totalFare = 0;
          let totalStops = 0;
          
          routes.forEach((route: any) => {
            totalDistance += route.total_distance_km || 0;
            totalFare += route.journey?.fare || 0;
            totalStops += route.journey?.stops_count || 0;
          });
          
          // Set average values (will be updated later if Google Maps calculation is available)
          setDistance(parseFloat((totalDistance / routes.length).toFixed(2)));
          setFare(parseFloat((totalFare / routes.length).toFixed(2)));
          setNumberOfStops(Math.round(totalStops / routes.length));
        } else {
          console.log('⚠️ No routes found from database search');
          setAvailableRoutes([]);
          setDistance(null);
          setFare(null);
        }

        // Optional: Try to get route coordinates for map display if we have place_ids
        if (from?.place_id && to?.place_id) {
          try {
            const { coordinates, region } = await getRouteCoordinates(from.place_id, to.place_id);
            if (coordinates.length > 0) {
              setRouteCoordinates(coordinates);
              setMapRegion(region);
              setShowMap(true);
            }
          } catch (mapError) {
            console.log('⚠️ Could not load map coordinates:', mapError);
          }
        }

        // Calculate distance between user's specific FROM and TO stops
        if (fromText && toText) {
          try {
            console.log('🎯 Calculating distance for user journey:', fromText, '→', toText);
            const userJourneyResult = await calculateUserJourneyDistance(fromText, toText);
            
            if (userJourneyResult) {
              setRealCalculatedDistance(userJourneyResult.distance);
              setDistance(userJourneyResult.distance);
              console.log('✅ User journey distance calculated:', userJourneyResult.distance, 'km');
              console.log('📊 Full route distance (database):', routes[0]?.total_distance_km, 'km');
            } else {
              console.log('⚠️ Could not calculate user journey distance');
            }
          } catch (error) {
            console.log('⚠️ Error calculating user journey distance:', error);
          }
        }

        // Calculate distances between consecutive stops if we have route data (for display purposes)
        if (routes && routes.length > 0 && routes[0].stops) {
          try {
            const stopsWithDistances = await calculateDistancesBetweenStops(routes[0].stops);
            setBusStops(stopsWithDistances);
            console.log('✅ Calculated distances between all stops:', stopsWithDistances);
          } catch (error) {
            console.log('⚠️ Could not calculate distances between stops:', error);
          }
        }

      } catch (error) {
        console.error('❌ Error in initializeData:', error);
      } finally {
        setLoading(false);
      }
    }

    if (from && to) {
      initializeData();
    }
    // eslint-disable-next-line
  }, [from, to, routes]);

  

  const handleRouteCardPress = (routeNumber: string) => {
    navigation.navigate('BusTracking', { 
      selectedRoute: routeNumber,
      fromSearch: true,
      searchFrom: fromText,
      searchTo: toText
    });
  };

  const renderBusRoute = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.enhancedRouteCard}
      onPress={() => handleRouteCardPress(item.route_number)}
      activeOpacity={0.7}
    >
      {/* Header with Route Number and Key Metrics */}
      <LinearGradient
        colors={['#F8FAFF', '#E3F2FD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.enhancedRouteHeader}
      >
        <View style={styles.routeNumberSection}>
          <View style={styles.enhancedRouteNumberBadge}>
            <Text style={styles.enhancedRouteNumber}>{item.route_number}</Text>
          </View>
          <View style={styles.operatorInfo}>
            <Text style={styles.operatorText}>SLTB</Text>
            <Text style={styles.routeNameText}>{item.route_name}</Text>
          </View>
        </View>
        
        <View style={styles.fareSection}>
          <Text style={styles.fareValue}>Rs. {item.journey?.fare || 'N/A'}</Text>
          <Text style={styles.fareLabel}>Fare</Text>
        </View>
      </LinearGradient>

      {/* Key Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Ionicons name="navigate" size={16} color={AppColors.success} />
          <Text style={styles.metricValue}>
            {realCalculatedDistance ? `${realCalculatedDistance.toFixed(1)} km` : `${item.total_distance_km} km`}
          </Text>
          <Text style={styles.metricLabel}>
            {realCalculatedDistance ? 'Journey' : 'Full Route'}
          </Text>
        </View>
        
        <View style={styles.metricDivider} />
        
        <View style={styles.metricItem}>
          <Ionicons name="bus" size={16} color={AppColors.primary} />
          <Text style={styles.metricValue}>{item.journey?.stops_count || 0}</Text>
          <Text style={styles.metricLabel}>Stops</Text>
        </View>
        
        <View style={styles.metricDivider} />
        
        <View style={styles.metricItem}>
          <Ionicons name="time" size={16} color={AppColors.warning} />
          <Text style={styles.metricValue}>
            {item.estimated_duration_minutes ? `${item.estimated_duration_minutes}m` : 'N/A'}
          </Text>
          <Text style={styles.metricLabel}>Est. Time</Text>
        </View>
      </View>

      {/* Track Buses Button */}
      <View style={styles.trackBusesSection}>
        <Ionicons name="location" size={16} color={AppColors.primary} />
        <Text style={styles.trackBusesText}>Tap to track buses on this route</Text>
        <Ionicons name="chevron-forward" size={16} color={AppColors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={true}
        />
        
        {/* Header */}
        <LinearGradient
          colors={[AppColors.primary, '#007bff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={AppColors.card} />
        </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Route Results</Text>
              <Text style={styles.headerSubtitle}>BusHubLK</Text>
            </View>
          </View>
        </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Route Summary Card */}
          <View style={styles.compactSummaryCard}>
            <View style={styles.compactLocationContainer}>
              <View style={styles.compactLocationItem}>
                <View style={[styles.compactLocationDot, { backgroundColor: AppColors.success }]} />
                <Text style={styles.compactLocationText} numberOfLines={1}>{fromText}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={AppColors.textSecondary} style={styles.arrowIcon} />
              <View style={styles.compactLocationItem}>
                <View style={[styles.compactLocationDot, { backgroundColor: AppColors.warning }]} />
                <Text style={styles.compactLocationText} numberOfLines={1}>{toText}</Text>
              </View>
            </View>
          </View>

{loading && (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={AppColors.primary} />
    <Text style={styles.loadingText}>Calculating distance for your journey...</Text>
    <Text style={[styles.loadingText, {fontSize: 12, marginTop: 8, color: AppColors.textSecondary}]}>
      Finding stops "{fromText}" → "{toText}" using Google Maps
    </Text>
  </View>
)}

{/* Map View */}
{showMap && mapRegion && routeCoordinates.length > 0 && (
  <View style={styles.mapContainer}>
    <View style={styles.mapHeader}>
      <Ionicons name="map-outline" size={20} color={AppColors.primary} />
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
            <Ionicons name="location" size={24} color={AppColors.success} />
          </View>
        </Marker>
        <Marker
          coordinate={routeCoordinates[routeCoordinates.length - 1]}
          title="Destination"
          description={toText}
          pinColor="red"
        >
          <View style={styles.customMarker}>
            <Ionicons name="flag" size={24} color={AppColors.warning} />
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

{/* Enhanced route cards will show all this information */}

{/* Bus Stops Along Route */}
{busStops.length > 0 && (
  <View style={styles.stopsContainer}>
    <View style={styles.sectionHeader}>
      <Ionicons name="location-outline" size={24} color={AppColors.primary} />
      <Text style={styles.sectionTitle}>Bus Stops Along Route</Text>
      <View style={styles.routeCount}>
        <Text style={styles.routeCountText}>{busStops.length}</Text>
      </View>
    </View>
    
    {/* Simplified Statistics */}
    {realCalculatedDistance && (
      <View style={styles.simplifiedStatsCard}>
        <View style={styles.statItem}>
          <Ionicons name="map" size={16} color={AppColors.success} />
          <Text style={styles.statLabel}>Google Maps Calculation</Text>
          <Text style={styles.statValue}>{realCalculatedDistance.toFixed(1)}km journey distance</Text>
        </View>
      </View>
    )}
    
    <View style={styles.stopsCard}>
      {busStops.map((stop, index) => (
        <View key={stop.place_id || stop.name || `stop-${index}`} style={[styles.stopItem, index === busStops.length - 1 && styles.stopItemLast]}>
          <View style={styles.stopNumber}>
            <Text style={styles.stopNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.stopContent}>
            <Text style={styles.stopName}>{stop.name || stop.stop_name}</Text>
            {stop.google_name && stop.google_name !== (stop.name || stop.stop_name) && (
              <Text style={styles.stopVicinity}>Google Maps: {stop.google_name}</Text>
            )}
            {stop.formatted_address && (
              <Text style={styles.stopVicinity}>{stop.formatted_address}</Text>
            )}
            {stop.vicinity && (
              <Text style={styles.stopVicinity}>{stop.vicinity}</Text>
            )}
            {stop.type && (
              <Text style={styles.stopType}>
                {stop.type === 'city' ? 'City/Town' : 
                 stop.type === 'transit_stop' ? 'Transit Stop' : 
                 stop.type === 'major_station' ? 'Major Station' : 'Bus Stop'}
              </Text>
            )}
            {stop.latitude && stop.longitude && (
              <Text style={[styles.stopType, {color: AppColors.primary, fontSize: 10}]}>
                📍 {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
              </Text>
            )}
            {stop.distanceFromPrevious && (
              <Text style={styles.stopDistance}>
                {stop.distanceFromPrevious}km from previous stop
              </Text>
            )}
            {stop.cumulativeDistance && (
              <Text style={[styles.stopDistance, {color: AppColors.textSecondary, fontSize: 10}]}>
                Total: {stop.cumulativeDistance.toFixed(1)}km from origin
              </Text>
            )}
          </View>
          <View style={[styles.stopIcon, stop.type === 'city' && styles.cityIcon]}>
            <Ionicons 
              name={stop.type === 'city' ? 'location' : 'bus'} 
              size={16} 
              color={stop.type === 'city' ? AppColors.warning : AppColors.primary} 
            />
          </View>
        </View>
      ))}
    </View>
    {realCalculatedDistance && (
      <Text style={styles.calculationNote}>
        🎯 Journey distance: {realCalculatedDistance.toFixed(1)}km calculated between your selected stops using Google Maps
      </Text>
    )}
    {busStops.some(stop => stop.distanceFromPrevious) && (
      <Text style={styles.calculationNote}>
        📏 Individual stop distances shown for reference
      </Text>
    )}
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
    <View style={styles.enhancedSectionHeader}>
      <View style={styles.sectionHeaderContent}>
        <Ionicons name="bus" size={28} color={AppColors.primary} />
        <View style={styles.sectionHeaderText}>
          <Text style={styles.enhancedSectionTitle}>Available Routes</Text>
          <Text style={styles.sectionSubtitle}>Choose the best route for your journey</Text>
        </View>
      </View>
      <View style={styles.enhancedRouteCount}>
        <Text style={styles.enhancedRouteCountText}>{availableRoutes.length}</Text>
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
      <Ionicons
        name="information-circle-outline"
        size={32}
        color={AppColors.warning}
      />
    </View>
    <Text style={styles.noRoutesTitle}>No Direct Routes Found</Text>
    <Text style={styles.noRoutesText}>
      Based on {numberOfStops} bus stops along this route, the estimated fare would be around Rs. {fare.toFixed(0)}. You may need to take connecting buses or alternative transport.
    </Text>
  </View>
)}

{fare === null && !loading && (
  <View style={styles.errorCard}>
    <View style={styles.errorIcon}>
      <Ionicons name="alert-circle-outline" size={32} color={AppColors.warning} />
    </View>
    <Text style={styles.errorTitle}>Route Not Found</Text>
    <Text style={styles.errorText}>
      No route found between the selected locations. Please try different locations.
    </Text>
  </View>
)}
        </View>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: 'transparent',
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
  enhancedRouteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(222, 226, 230, 0.6)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  enhancedRouteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: AppColors.primaryLight + '30',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  routeNumberSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  enhancedRouteNumberBadge: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  enhancedRouteNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.card,
  },
  operatorInfo: {
    flex: 1,
  },
  operatorText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  routeNameText: {
    fontSize: 15,
    color: AppColors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  fareSection: {
    alignItems: 'flex-end',
  },
  fareValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.success,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: AppColors.background,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text,
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: AppColors.border,
    marginHorizontal: 8,
  },
  journeySection: {
    padding: 20,
    backgroundColor: AppColors.card,
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  journeyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginLeft: 8,
  },
  journeyPath: {
    marginLeft: 8,
  },
  journeyStop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  journeyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  journeyStopText: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: '500',
    flex: 1,
  },
  journeyLine: {
    width: 2,
    height: 20,
    backgroundColor: AppColors.border,
    marginLeft: 4,
    marginVertical: 2,
  },
  googleMapsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  googleMapsText: {
    fontSize: 12,
    color: AppColors.success,
    marginLeft: 6,
    fontWeight: '500',
  },
  fullRouteSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: AppColors.card,
  },
  fullRouteText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
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
  routeStatsCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  simplifiedStatsCard: {
    backgroundColor: AppColors.success + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.success + '40',
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.primary,
    marginLeft: 4,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 12,
    color: AppColors.primary,
    marginLeft: 4,
    fontWeight: "bold",
  },
  stopNumber: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stopNumberText: {
    fontSize: 12,
    color: AppColors.card,
    fontWeight: "bold",
  },
  stopVicinity: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
    fontStyle: "italic",
  },
  stopDistance: {
    fontSize: 11,
    color: AppColors.primary,
    marginTop: 2,
    fontWeight: "500",
  },
  fareDetailContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: AppColors.border + "50",
  },
  fareDetailText: {
    fontSize: 12,
    color: AppColors.success,
    marginLeft: 4,
    fontWeight: "600",
  },

  // Enhanced Section Header
  enhancedSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  enhancedSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  enhancedRouteCount: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
  },
  enhancedRouteCountText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Compact Summary Card
  compactSummaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(222, 226, 230, 0.6)',
    ...Platform.select({
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  compactLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  compactLocationText: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: '500',
    flex: 1,
  },
  arrowIcon: {
    marginHorizontal: 12,
  },

  // Gradient Container
  gradientContainer: {
    flex: 1,
  },
  
  // Header Gradient
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },

  // Track Buses Section
  trackBusesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: AppColors.primaryLight + '20',
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  trackBusesText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: '600',
    marginHorizontal: 8,
    flex: 1,
    textAlign: 'center',
  },
});