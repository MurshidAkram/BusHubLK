import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';
import polyline from '@mapbox/polyline';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAeXR9ct7HrHMCQXSWLrWQl5OlRYjNhbxo';

export default function BusFilterScreen() {
  const navigation = useNavigation();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromCoord, setFromCoord] = useState(null);
  const [toCoord, setToCoord] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const geocode = async (address) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await axios.get(url);
    if (res.data.status === 'OK') {
      return res.data.results[0].geometry.location;
    } else {
      throw new Error('Location not found');
    }
  };

  const getDirections = async (fromLoc, toLoc) => {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLoc.lat},${fromLoc.lng}&destination=${toLoc.lat},${toLoc.lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await axios.get(url);
    if (res.data.status === 'OK') {
      const points = res.data.routes[0].overview_polyline.points;
      const steps = polyline.decode(points).map(([latitude, longitude]) => ({ latitude, longitude }));
      setRouteCoords(steps);
      setDistance(res.data.routes[0].legs[0].distance.text);
      setDuration(res.data.routes[0].legs[0].duration.text);
    } else {
      throw new Error('Route not found');
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setRouteCoords([]);
    setFromCoord(null);
    setToCoord(null);
    setDistance('');
    setDuration('');
    try {
      const fromLoc = await geocode(from);
      const toLoc = await geocode(to);
      setFromCoord({ latitude: fromLoc.lat, longitude: fromLoc.lng });
      setToCoord({ latitude: toLoc.lat, longitude: toLoc.lng });
      await getDirections(fromLoc, toLoc);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  // Default region for the map (Sri Lanka center)
  const defaultRegion = {
    latitude: 7.8731,
    longitude: 80.7718,
    latitudeDelta: 2,
    longitudeDelta: 2,
  };

  // Calculate region to fit both markers
  const getMapRegion = () => {
    if (fromCoord && toCoord) {
      return {
        latitude: (fromCoord.latitude + toCoord.latitude) / 2,
        longitude: (fromCoord.longitude + toCoord.longitude) / 2,
        latitudeDelta: Math.abs(fromCoord.latitude - toCoord.latitude) + 0.5,
        longitudeDelta: Math.abs(fromCoord.longitude - toCoord.longitude) + 0.5,
      };
    }
    return defaultRegion;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Floating Back Arrow */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.floatingBackButton}
      >
        <Icon name="arrow-back" size={28} color="#212529" />
      </TouchableOpacity>

      <MapView
        style={styles.map}
        region={getMapRegion()}
        showsUserLocation
        showsMyLocationButton
      >
        {fromCoord && <Marker coordinate={fromCoord} title="Start" />}
        {toCoord && <Marker coordinate={toCoord} title="Destination" />}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#0056b3"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Overlay Card for Search */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlayContainer}
      >
        <View style={styles.searchCard}>
          <TextInput
            style={styles.input}
            placeholder="Current Location"
            value={from}
            onChangeText={setFrom}
            placeholderTextColor="#888"
          />
          <TextInput
            style={styles.input}
            placeholder="Destination"
            value={to}
            onChangeText={setTo}
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.button} onPress={handleSearch} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Show Route'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Info Card at Bottom */}
      {(routeCoords.length > 0 && fromCoord && toCoord) && (
        <View style={styles.infoCard}>
          <Text style={styles.busRoute}>{from} → {to}</Text>
          <Text style={styles.busDistance}>Distance: {distance}</Text>
          <Text style={styles.busTime}>Estimated Time: {duration}</Text>
        </View>
      )}

      {loading && <ActivityIndicator size="large" color="#0056b3" style={styles.loading} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  floatingBackButton: {
    position: 'absolute',
    top: 18,
    left: 18,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  overlayContainer: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  searchCard: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    marginTop: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    color: '#222',
  },
  button: {
    backgroundColor: '#0056b3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 2,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  infoCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    alignItems: 'center',
    zIndex: 2,
  },
  busRoute: { color: '#0056b3', fontWeight: 'bold', fontSize: 16 },
  busTime: { color: '#6C757D', marginTop: 2, fontSize: 15 },
  busDistance: { color: '#198754', marginTop: 2, fontWeight: 'bold', fontSize: 15 },
  loading: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    zIndex: 10,
  },
});