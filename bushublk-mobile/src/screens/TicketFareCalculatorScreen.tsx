import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  TextInput,
  FlatList,
  Keyboard,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../navigation/navigationTypes';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAeXR9ct7HrHMCQXSWLrWQl5OlRYjNhbxo';

type Props = StackScreenProps<HomeStackParamList, 'FareCalculator'>;

const AppColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#0056b3',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  success: '#28a745',
  warning: '#ffc107',
};

// Official Sri Lanka bus fare stages (2024, normal service)
const BASE_STAGE_KM = 3.2;
const FARE_STAGES: number[] = [
  17, 23, 30, 36, 43, 50, 56, 62, 68, 75, 81, 88, 94, 100, 106, 113, 119, 126, 132, 139, 145, 152, 158, 165, 171, 178, 184, 191, 197, 204, 210, 217, 223, 230, 236, 243, 249, 256, 262, 269, 275, 282, 288, 295, 301, 308, 314, 321, 327, 334
];

// Enhanced bus route data with frequencies and operators
interface BusRoute {
  routeNumber: string;
  operator: 'SLTB' | 'Private';
  from: string;
  to: string;
  via?: string[];
  frequency: string; // e.g., "Every 15 mins", "Hourly"
  operatingHours: string;
  fare: number;
  estimatedDuration: string;
  busType: 'Normal' | 'Semi-Luxury' | 'Luxury' | 'Express';
}

const BUS_ROUTES: BusRoute[] = [
  {
    routeNumber: '138',
    operator: 'SLTB',
    from: 'Colombo',
    to: 'Kandy',
    via: ['Kadawatha', 'Gampaha', 'Kegalle'],
    frequency: 'Every 30 mins',
    operatingHours: '5:00 AM - 10:00 PM',
    fare: 600,
    estimatedDuration: '3.5 hours',
    busType: 'Semi-Luxury'
  },
  {
    routeNumber: '1',
    operator: 'SLTB',
    from: 'Colombo',
    to: 'Galle',
    via: ['Mount Lavinia', 'Kalutara', 'Bentota'],
    frequency: 'Every 20 mins',
    operatingHours: '4:30 AM - 11:00 PM',
    fare: 600,
    estimatedDuration: '3 hours',
    busType: 'Normal'
  },
  {
    routeNumber: '4',
    operator: 'SLTB',
    from: 'Colombo',
    to: 'Matara',
    via: ['Mount Lavinia', 'Kalutara', 'Galle', 'Unawatuna'],
    frequency: 'Every 45 mins',
    operatingHours: '5:00 AM - 9:30 PM',
    fare: 700,
    estimatedDuration: '4 hours',
    busType: 'Normal'
  },
  {
    routeName: 'Express',
    routeNumber: 'E01',
    operator: 'Private',
    from: 'Colombo',
    to: 'Kandy',
    frequency: 'Every hour',
    operatingHours: '6:00 AM - 8:00 PM',
    fare: 800,
    estimatedDuration: '2.5 hours',
    busType: 'Luxury'
  },
];

interface PlaceSuggestion {
  description: string;
  place_id: string;
}

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export default function TicketFareCalculatorScreen({ navigation }: Props) {
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [fromPlace, setFromPlace] = useState<PlaceSuggestion | null>(null);
  const [toPlace, setToPlace] = useState<PlaceSuggestion | null>(null);
  const [fare, setFare] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<string | null>(null); // <-- Added
  const [loading, setLoading] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState<BusRoute[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const [mapRegion, setMapRegion] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const [fromSuggestions, setFromSuggestions] = useState<PlaceSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<MapView>(null);

  const fetchPlaceSuggestions = async (input: string, setSuggestions: (suggestions: PlaceSuggestion[]) => void) => {
    if (input.length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:LK&language=en&key=${GOOGLE_MAPS_API_KEY}`
      );
      if (response.data.status === 'OK') {
        setSuggestions(response.data.predictions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      setSuggestions([]);
    }
  };

  const debounceFetchSuggestions = (input: string, setSuggestions: (suggestions: PlaceSuggestion[]) => void) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      fetchPlaceSuggestions(input, setSuggestions);
    }, 300);
  };

  const handleFromChange = (text: string) => {
    setFromStation(text);
    setFromPlace(null);
    setShowFromSuggestions(text.length > 0);
    debounceFetchSuggestions(text, setFromSuggestions);
  };

  const handleToChange = (text: string) => {
    setToStation(text);
    setToPlace(null);
    setShowToSuggestions(text.length > 0);
    debounceFetchSuggestions(text, setToSuggestions);
  };

  const selectFromSuggestion = (item: PlaceSuggestion) => {
    setFromStation(item.description);
    setFromPlace(item);
    setShowFromSuggestions(false);
    Keyboard.dismiss();
  };

  const selectToSuggestion = (item: PlaceSuggestion) => {
    setToStation(item.description);
    setToPlace(item);
    setShowToSuggestions(false);
    Keyboard.dismiss();
  };

  // Get lat/lng from place_id
  const getLatLng = async (place_id: string) => {
    try {
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${GOOGLE_MAPS_API_KEY}`
      );
      if (res.data.status === 'OK') {
        return res.data.result.geometry.location;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Get route coordinates and duration from Google Directions API
  const getRouteCoordinates = async (fromPlaceId: string, toPlaceId: string) => {
    const fromLoc = await getLatLng(fromPlaceId);
    const toLoc = await getLatLng(toPlaceId);
    if (!fromLoc || !toLoc) return { coordinates: [], distance: null, region: null, duration: null };
    
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLoc.lat},${fromLoc.lng}&destination=${toLoc.lat},${toLoc.lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      if (response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const meters = route.legs[0].distance.value;
        const distance = meters / 1000;
        const duration = route.legs[0].duration.text; // <-- Get duration
        
        // Decode polyline
        const points = decodePolyline(route.overview_polyline.points);
        const coordinates = points.map(point => ({
          latitude: point[0],
          longitude: point[1]
        }));
        
        // Calculate map region
        const region = {
          latitude: (fromLoc.lat + toLoc.lat) / 2,
          longitude: (fromLoc.lng + toLoc.lng) / 2,
          latitudeDelta: Math.abs(fromLoc.lat - toLoc.lat) * 1.5,
          longitudeDelta: Math.abs(fromLoc.lng - toLoc.lng) * 1.5,
        };
        
        return { coordinates, distance, region, duration };
      }
      return { coordinates: [], distance: null, region: null, duration: null };
    } catch {
      return { coordinates: [], distance: null, region: null, duration: null };
    }
  };

  // Polyline decoder
  const decodePolyline = (encoded: string) => {
    const poly = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      
      poly.push([lat / 1E5, lng / 1E5]);
    }
    return poly;
  };

  // Find available bus routes
  const findAvailableRoutes = (from: string, to: string) => {
    const clean = (str: string) => str.toLowerCase().replace(/,? sri lanka/i, '').trim();
    const fromClean = clean(from);
    const toClean = clean(to);
    
    return BUS_ROUTES.filter(route => {
      const routeFromClean = clean(route.from);
      const routeToClean = clean(route.to);
      
      return (
        (fromClean.includes(routeFromClean) && toClean.includes(routeToClean)) ||
        (fromClean.includes(routeToClean) && toClean.includes(routeFromClean)) ||
        (route.via && route.via.some(via => 
          fromClean.includes(clean(via)) || toClean.includes(clean(via))
        ))
      );
    });
  };

  const calculateFare = async () => {
    if (fromStation === toStation) {
      setFare(0);
      setDistance(0);
      setAvailableRoutes([]);
      setShowMap(false);
      setDuration(null);
      return;
    }

    if (!fromPlace || !toPlace) {
      setFare(null);
      setDistance(null);
      setAvailableRoutes([]);
      setShowMap(false);
      setDuration(null);
      return;
    }

    setLoading(true);
    
    // Find available routes
    const routes = findAvailableRoutes(fromStation, toStation);
    setAvailableRoutes(routes);
    
    // Get route coordinates, distance, and duration
    const { coordinates, distance: dist, region, duration: estDuration } = await getRouteCoordinates(fromPlace.place_id, toPlace.place_id);
    
    setLoading(false);

    if (dist !== null) {
      setDistance(dist);
      setRouteCoordinates(coordinates);
      setMapRegion(region);
      setShowMap(true);
      setDuration(estDuration || null); // <-- Set duration
      
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
      setDistance(null);
      setFare(null);
      setShowMap(false);
      setDuration(null); // <-- Reset duration
    }
  };

  const getBusTypeColor = (busType: string) => {
    switch (busType) {
      case 'Luxury': return AppColors.success;
      case 'Semi-Luxury': return AppColors.primary;
      case 'Express': return AppColors.warning;
      default: return AppColors.textSecondary;
    }
  };

  const renderBusRoute = ({ item }: { item: BusRoute }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={styles.routeNumberContainer}>
          <Text style={styles.routeNumber}>{item.routeNumber}</Text>
          <Text style={[styles.busType, { color: getBusTypeColor(item.busType) }]}>
            {item.busType}
          </Text>
        </View>
        <View style={styles.operatorContainer}>
          <Text style={styles.operator}>{item.operator}</Text>
          <Text style={styles.fare}>Rs. {item.fare}</Text>
        </View>
      </View>
      
      <View style={styles.routeDetails}>
        <View style={styles.routeInfo}>
          <Icon name="time-outline" size={16} color={AppColors.textSecondary} />
          <Text style={styles.routeText}>{item.frequency}</Text>
        </View>
        <View style={styles.routeInfo}>
          <Icon name="clock-outline" size={16} color={AppColors.textSecondary} />
          <Text style={styles.routeText}>{item.operatingHours}</Text>
        </View>
        <View style={styles.routeInfo}>
          <Icon name="speedometer-outline" size={16} color={AppColors.textSecondary} />
          <Text style={styles.routeText}>{item.estimatedDuration}</Text>
        </View>
      </View>
      
      {item.via && item.via.length > 0 && (
        <View style={styles.viaContainer}>
          <Text style={styles.viaLabel}>Via: </Text>
          <Text style={styles.viaText}>{item.via.join(' → ')}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonFloating}>
        <Icon name="arrow-back" size={28} color={AppColors.text} />
      </TouchableOpacity>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Sri Lanka Bus Route Finder</Text>

          <Text style={styles.label}>From</Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              style={styles.input}
              value={fromStation}
              onChangeText={handleFromChange}
              placeholder="Enter start location"
              autoCorrect={false}
              onFocus={() => setShowFromSuggestions(true)}
            />
            {showFromSuggestions && fromSuggestions.length > 0 && (
              <View style={styles.suggestionBox}>
                <FlatList
                  data={fromSuggestions}
                  keyExtractor={item => item.place_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => selectFromSuggestion(item)} style={styles.suggestionItem}>
                      <Text>{item.description}</Text>
                    </TouchableOpacity>
                  )}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            )}
          </View>

          <Text style={styles.label}>To</Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              style={styles.input}
              value={toStation}
              onChangeText={handleToChange}
              placeholder="Enter destination"
              autoCorrect={false}
              onFocus={() => setShowToSuggestions(true)}
            />
            {showToSuggestions && toSuggestions.length > 0 && (
              <View style={styles.suggestionBox}>
                <FlatList
                  data={toSuggestions}
                  keyExtractor={item => item.place_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => selectToSuggestion(item)} style={styles.suggestionItem}>
                      <Text>{item.description}</Text>
                    </TouchableOpacity>
                  )}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.button, (!fromPlace || !toPlace) && styles.buttonDisabled]} 
            onPress={calculateFare} 
            disabled={loading || !fromPlace || !toPlace}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Finding Routes...' : 'Find Bus Routes'}
            </Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 10 }} />}

          {/* Map View */}
          {showMap && mapRegion && routeCoordinates.length > 0 && (
            <View style={styles.mapContainer}>
              <Text style={styles.sectionTitle}>Route Map</Text>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={mapRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                {fromPlace && (
                  <Marker
                    coordinate={{
                      latitude: mapRegion.latitude - mapRegion.latitudeDelta / 4,
                      longitude: mapRegion.longitude - mapRegion.longitudeDelta / 4
                    }}
                    title="Start"
                    description={fromStation}
                    pinColor="green"
                  />
                )}
                {toPlace && (
                  <Marker
                    coordinate={{
                      latitude: mapRegion.latitude + mapRegion.latitudeDelta / 4,
                      longitude: mapRegion.longitude + mapRegion.longitudeDelta / 4
                    }}
                    title="Destination"
                    description={toStation}
                    pinColor="red"
                  />
                )}
                {routeCoordinates.length > 0 && (
                  <Polyline
                    coordinates={routeCoordinates}
                    strokeColor={AppColors.primary}
                    strokeWidth={4}
                  />
                )}
              </MapView>
            </View>
          )}

          {/* Route Information */}
          {distance !== null && !loading && (
            <View style={styles.resultCard}>
              <Text style={styles.resultText}>Distance: {distance?.toFixed(1)} km</Text>
              {fare !== null && (
                <Text style={styles.resultText}>Estimated Fare: Rs. {fare}.00</Text>
              )}
              {duration && (
                <Text style={styles.resultText}>Estimated Time: {duration}</Text>
              )}
            </View>
          )}

          {/* Available Bus Routes */}
          {availableRoutes.length > 0 && (
            <View style={styles.routesContainer}>
              <Text style={styles.sectionTitle}>Available Bus Routes</Text>
              <FlatList
                data={availableRoutes}
                keyExtractor={(item, index) => `${item.routeNumber}-${index}`}
                renderItem={renderBusRoute}
                scrollEnabled={false}
              />
            </View>
          )}

          {availableRoutes.length === 0 && fare !== null && !loading && (
            <View style={styles.noRoutesCard}>
              <Icon name="information-circle-outline" size={24} color={AppColors.warning} />
              <Text style={styles.noRoutesText}>
                No direct bus routes found. Fare calculated based on distance.
              </Text>
            </View>
          )}

          {fare === null && !loading && fromPlace && toPlace && (
            <Text style={styles.resultTextSecondary}>
              No route found between the selected locations.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: AppColors.background 
  },
  scrollContainer: {
    flex: 1
  },
  backButtonFloating: { 
    position: 'absolute', 
    top: 18, 
    left: 18, 
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 8
  },
  contentContainer: { 
    padding: 20, 
    marginTop: 40 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: AppColors.primary, 
    marginBottom: 24, 
    textAlign: 'center' 
  },
  label: { 
    fontSize: 16, 
    color: AppColors.text, 
    marginTop: 10, 
    marginBottom: 4 
  },
  input: { 
    borderWidth: 1, 
    borderColor: AppColors.border, 
    borderRadius: 8, 
    padding: 12, 
    backgroundColor: '#fff',
    fontSize: 16
  },
  suggestionBox: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderColor: AppColors.border,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 120,
    zIndex: 2,
    elevation: 6,
  },
  suggestionItem: { 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: AppColors.border 
  },
  button: { 
    backgroundColor: AppColors.primary, 
    padding: 14, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 12 
  },
  buttonDisabled: {
    backgroundColor: AppColors.textSecondary,
    opacity: 0.6
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  mapContainer: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    height: 250,
    width: '100%'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 12,
    marginTop: 20
  },
  resultCard: { 
    backgroundColor: AppColors.card, 
    padding: 16, 
    marginTop: 20, 
    borderRadius: 8, 
    borderColor: AppColors.border, 
    borderWidth: 1 
  },
  resultText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: AppColors.primary,
    marginBottom: 4
  },
  resultTextSecondary: { 
    fontSize: 15, 
    color: AppColors.textSecondary, 
    marginTop: 10, 
    textAlign: 'center' 
  },
  routesContainer: {
    marginTop: 20
  },
  routeCard: {
    backgroundColor: AppColors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderColor: AppColors.border,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  routeNumberContainer: {
    flex: 1
  },
  routeNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.primary
  },
  busType: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  operatorContainer: {
    alignItems: 'flex-end'
  },
  operator: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 2
  },
  fare: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.success
  },
  routeDetails: {
    marginBottom: 8
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  routeText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginLeft: 6
  },
  viaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.border
  },
  viaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary
  },
  viaText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    flex: 1
  },
  noRoutesCard: {
    backgroundColor: AppColors.card,
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    borderColor: AppColors.warning,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  noRoutesText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginLeft: 12,
    flex: 1
  }
});