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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../navigation/navigationTypes';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAeXR9ct7HrHMCQXSWLrWQl5OlRYjNhbxo';

type Props = StackScreenProps<HomeStackParamList, 'FareCalculator'>;

const AppColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#0056b3',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
};

// Official Sri Lanka bus fare stages (2024, normal service)
const BASE_STAGE_KM = 3.2;
const FARE_STAGES: number[] = [
  17, 23, 30, 36, 43, 50, 56, 62, 68, 75, 81, 88, 94, 100, 106, 113, 119, 126, 132, 139, 145, 152, 158, 165, 171, 178, 184, 191, 197, 204, 210, 217, 223, 230, 236, 243, 249, 256, 262, 269, 275, 282, 288, 295, 301, 308, 314, 321, 327, 334
];

// Example SLTB long distance fares (add more from eseat.lk as needed)
const SLTB_LONG_DISTANCE_FARES = [
  { from: "Colombo", to: "Kandy", fare: 600 },
  { from: "Colombo", to: "Jaffna", fare: 1800 },
  { from: "Colombo", to: "Matara", fare: 700 },
  { from: "Colombo", to: "Galle", fare: 600 },
  { from: "Colombo", to: "Kurunegala", fare: 500 },
  { from: "Colombo", to: "Anuradhapura", fare: 1200 },
  { from: "Colombo", to: "Badulla", fare: 1500 },
  { from: "Colombo", to: "Trincomalee", fare: 1600 },
  { from: "Colombo", to: "Batticaloa", fare: 1700 },
  // ...add more as needed
];

// Helper to match route (case-insensitive, ignores "Sri Lanka" etc.)
function matchLongDistanceFare(from: string, to: string) {
  const clean = (str: string) => str.toLowerCase().replace(/,? sri lanka/i, '').trim();
  for (const route of SLTB_LONG_DISTANCE_FARES) {
    if (
      (clean(from).includes(clean(route.from)) && clean(to).includes(clean(route.to))) ||
      (clean(from).includes(clean(route.to)) && clean(to).includes(clean(route.from)))
    ) {
      return route.fare;
    }
  }
  return null;
}

interface PlaceSuggestion {
  description: string;
  place_id: string;
}

export default function TicketFareCalculatorScreen({ navigation }: Props) {
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [fromPlace, setFromPlace] = useState<PlaceSuggestion | null>(null);
  const [toPlace, setToPlace] = useState<PlaceSuggestion | null>(null);
  const [fare, setFare] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [fromSuggestions, setFromSuggestions] = useState<PlaceSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

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
    }, 300); // 300ms debounce
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

  // Get distance using Directions API
  const getDistanceFromGoogleMaps = async (fromPlaceId: string, toPlaceId: string): Promise<number | null> => {
    const fromLoc = await getLatLng(fromPlaceId);
    const toLoc = await getLatLng(toPlaceId);
    if (!fromLoc || !toLoc) return null;
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLoc.lat},${fromLoc.lng}&destination=${toLoc.lat},${toLoc.lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      if (response.data.routes.length > 0) {
        const meters = response.data.routes[0].legs[0].distance.value;
        return meters / 1000; // convert to kilometers
      }
      return null;
    } catch {
      return null;
    }
  };

  const calculateFare = async () => {
    if (fromStation === toStation) {
      setFare(0);
      setDistance(0);
      return;
    }

    // 1. Try to match a long-distance fare
    const longDistanceFare = matchLongDistanceFare(fromStation, toStation);
    if (longDistanceFare !== null) {
      setFare(longDistanceFare);
      setDistance(null);
      return;
    }

    // 2. Fallback to distance-based calculation
    if (!fromPlace || !toPlace) {
      setFare(null);
      setDistance(null);
      return;
    }
    setLoading(true);
    const dist = await getDistanceFromGoogleMaps(fromPlace.place_id, toPlace.place_id);
    setLoading(false);

    if (dist !== null) {
      setDistance(dist);
      const stageCount = Math.ceil(dist / BASE_STAGE_KM);
      const cappedStage = Math.min(stageCount, FARE_STAGES.length);
      let calculatedFare = Math.round(FARE_STAGES[cappedStage - 1] * 1.6); // Always use luxury fare
      setFare(calculatedFare);
    } else {
      setDistance(null);
      setFare(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonFloating}>
        <Icon name="arrow-back" size={28} color={AppColors.text} />
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Sri Lanka Bus Ticket Fare Calculator</Text>

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

        <TouchableOpacity style={styles.button} onPress={calculateFare} disabled={loading || !fromPlace || !toPlace}>
          <Text style={styles.buttonText}>{loading ? 'Calculating...' : 'Calculate Fare'}</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 10 }} />}

        {fare !== null && !loading && (
          <View style={styles.resultCard}>
            {distance !== null && (
              <Text style={styles.resultText}>Distance: {distance?.toFixed(1)} km</Text>
            )}
            <Text style={styles.resultText}>Estimated Fare: Rs. {fare}.00</Text>
          </View>
        )}

        {fare === null && !loading && (
          <Text style={styles.resultTextSecondary}>No route found between the selected locations.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  backButtonFloating: { position: 'absolute', top: 18, left: 18, zIndex: 10 },
  contentContainer: { padding: 20, marginTop: 40 },
  title: { fontSize: 20, fontWeight: 'bold', color: AppColors.primary, marginBottom: 24, textAlign: 'center' },
  label: { fontSize: 16, color: AppColors.text, marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: AppColors.border, borderRadius: 8, padding: 12, backgroundColor: '#fff' },
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
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  button: { backgroundColor: AppColors.primary, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resultCard: { backgroundColor: AppColors.card, padding: 16, marginTop: 20, borderRadius: 8, borderColor: AppColors.border, borderWidth: 1 },
  resultText: { fontSize: 16, fontWeight: 'bold', color: AppColors.primary },
  resultTextSecondary: { fontSize: 15, color: AppColors.textSecondary, marginTop: 10, textAlign: 'center' }
});