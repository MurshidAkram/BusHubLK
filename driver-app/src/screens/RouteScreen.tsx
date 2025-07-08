import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions'; // 1. Import the new library
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';


// --- IMPORTANT: Replace with your actual API key ---
const Maps_API_KEY = "AIzaSyAeXR9ct7HrHMCQXSWLrWQl5OlRYjNhbxo"; 

// --- Define a fixed destination ---
const DESTINATION_COORDINATE = { latitude: 6.8919, longitude: 79.9011, title: "Kollupitiya Junction" };

const Header = () => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Live Route Status</Text>
  </View>
);

const RouteScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let subscriber;
    const startLocationTracking = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied.');
          return;
        }

        let initialLocation = await Location.getCurrentPositionAsync({});
        setUserLocation(initialLocation.coords);

        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            setUserLocation(location.coords);
          }
        );
      } catch (error) {
        console.error(error);
        setErrorMsg('Could not fetch location. Please ensure GPS is enabled.');
      }
    };

    startLocationTracking();

    return () => {
      if (subscriber) subscriber.remove();
    };
  }, []);

  if (!userLocation) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#005A9C" />
        <Text style={styles.loadingText}>Fetching your location...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#005A9C" />
      <Header />
      <MapView
        ref={mapRef}
        style={styles.map}
        provider="google"
        customMapStyle={mapStyle}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* 2. Use MapViewDirections to draw the route */}
        <MapViewDirections
            origin={userLocation}
            destination={DESTINATION_COORDINATE}
            apikey={Maps_API_KEY}
            strokeWidth={5}
            strokeColor="#005A9C"
            onReady={result => {
                // Fit map to the route
                mapRef.current.fitToCoordinates(result.coordinates, {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                });
            }}
            onError={(errorMessage) => {
                console.error('MapViewDirections Error: ', errorMessage);
            }}
        />

        {/* Marker for the driver's current location */}
        <Marker coordinate={userLocation} title="Your Location" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.userMarker}>
                <MaterialCommunityIcons name="bus" size={24} color="white" />
            </View>
        </Marker>

        {/* Marker for the final destination */}
        <Marker coordinate={DESTINATION_COORDINATE} title={DESTINATION_COORDINATE.title}>
            <View style={styles.destinationMarker}>
                <Ionicons name="flag" size={24} color="white" />
            </View>
        </Marker>
      </MapView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#005A9C',
  },
  header: {
    backgroundColor: '#005A9C',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 15,
    paddingBottom: 12,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  userMarker: {
    backgroundColor: '#3b82f6', 
    padding: 8,
    borderRadius: 20,
    borderColor: 'white',
    borderWidth: 2,
  },
  destinationMarker: {
    backgroundColor: '#16a34a', 
    padding: 8,
    borderRadius: 20,
    borderColor: 'white',
    borderWidth: 2,
  },
});

const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

export default RouteScreen;