import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";

// Only import MapViewDirections if it's installed
let MapViewDirections;
try {
  MapViewDirections = require("react-native-maps-directions").default;
} catch (error) {
  console.log("MapViewDirections not installed");
  MapViewDirections = null;
}

// Google Maps API Key - Make sure this is valid
const GOOGLE_MAPS_API_KEY = "AIzaSyAeXR9ct7HrHMCQXSWLrWQl5OlRYjNhbxo";

// Fixed destination coordinate
const DESTINATION_COORDINATE = {
  latitude: 6.8919,
  longitude: 79.9011,
  title: "Kollupitiya Junction",
};

const Header = () => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Live Route Status</Text>
  </View>
);

const RouteScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    let locationSubscription = null;

    const startLocationTracking = async () => {
      try {
        console.log("🗺️ Starting location tracking...");

        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied.");
          setIsLoading(false);
          Alert.alert(
            "Location Permission Required",
            "Please enable location permissions to use the route tracking feature.",
            [{ text: "OK" }]
          );
          return;
        }

        console.log("✅ Location permission granted");

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        console.log("📍 Initial location:", initialLocation.coords);
        setUserLocation(initialLocation.coords);
        setIsLoading(false);

        // Start watching position
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, // Update every 10 seconds
            distanceInterval: 50, // Update every 50 meters
          },
          (location) => {
            console.log("📍 Location updated:", location.coords);
            setUserLocation(location.coords);
          }
        );
      } catch (error) {
        console.error("❌ Location error:", error);
        setErrorMsg("Could not fetch location. Please ensure GPS is enabled.");
        setIsLoading(false);
        Alert.alert(
          "Location Error",
          "Could not fetch your location. Please ensure GPS is enabled and try again.",
          [{ text: "OK" }]
        );
      }
    };

    startLocationTracking();

    // Cleanup function
    return () => {
      if (locationSubscription) {
        console.log("🧹 Cleaning up location subscription");
        locationSubscription.remove();
      }
    };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#005A9C" />
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#005A9C" />
          <Text style={styles.loadingText}>Fetching your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (errorMsg) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#005A9C" />
        <Header />
        <View style={styles.centered}>
          <Ionicons name="location-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Text style={styles.errorSubText}>
            Please check your location settings and try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // No location state
  if (!userLocation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#005A9C" />
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#005A9C" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#005A9C" />
      <Header />
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={mapStyle}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={false} // We'll use custom marker
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
        >
          {/* Directions - only if MapViewDirections is available */}
          {MapViewDirections && GOOGLE_MAPS_API_KEY && (
            <MapViewDirections
              origin={userLocation}
              destination={DESTINATION_COORDINATE}
              apikey={GOOGLE_MAPS_API_KEY}
              strokeWidth={4}
              strokeColor="#005A9C"
              onReady={(result) => {
                console.log("🗺️ Route calculated:", result);
                // Fit map to show the route
                if (mapRef.current) {
                  mapRef.current.fitToCoordinates(result.coordinates, {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                  });
                }
              }}
              onError={(errorMessage) => {
                console.error("❌ MapViewDirections Error:", errorMessage);
              }}
            />
          )}

          {/* Driver's current location marker */}
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="Driver's current position"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userMarker}>
              <MaterialCommunityIcons name="bus" size={24} color="white" />
            </View>
          </Marker>

          {/* Destination marker */}
          <Marker
            coordinate={DESTINATION_COORDINATE}
            title={DESTINATION_COORDINATE.title}
            description="Route destination"
          >
            <View style={styles.destinationMarker}>
              <Ionicons name="flag" size={24} color="white" />
            </View>
          </Marker>
        </MapView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#005A9C",
  },
  header: {
    backgroundColor: "#005A9C",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 15,
    paddingBottom: 12,
    alignItems: "center",
    zIndex: 1,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: "#e74c3c",
    textAlign: "center",
    fontWeight: "600",
  },
  errorSubText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  userMarker: {
    backgroundColor: "#3b82f6",
    padding: 8,
    borderRadius: 20,
    borderColor: "white",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  destinationMarker: {
    backgroundColor: "#16a34a",
    padding: 8,
    borderRadius: 20,
    borderColor: "white",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
];

export default RouteScreen;
