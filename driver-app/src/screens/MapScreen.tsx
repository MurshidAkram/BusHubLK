import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";

// App color palette
const AppColors = {
  background: "#F8F9FA",
  primary: "#0056b3",
  text: "#212529",
  border: "#DEE2E6",
};

const GOOGLE_MAPS_API_KEY = "AIzaSyAeXR9ct7HrHMCQXSWLrWQl5OlRYjNhbxo";

export default function MapScreen({ route }) {
  const { fromPlace, toPlace } = route.params;
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to show your current location.");
        setLoading(false);
        return;
      }

      // Get current location
      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Fetch route from Google Maps Directions API
      if (fromPlace && toPlace) {
        try {
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/directions/json?origin=place_id:${fromPlace.place_id}&destination=place_id:${toPlace.place_id}&key=${GOOGLE_MAPS_API_KEY}`
          );
          if (response.data.status === "OK") {
            const points = response.data.routes[0].overview_polyline.points;
            const decodedPoints = decodePolyline(points);
            setRouteCoordinates(decodedPoints);
          } else {
            Alert.alert("Error", "Unable to fetch route. Please try again.");
          }
        } catch (error) {
          Alert.alert("Error", "Failed to fetch route: " + error.message);
        }
      }
      setLoading(false);
    })();
  }, [fromPlace, toPlace]);

  // Function to decode Google Maps polyline
  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return points;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </SafeAreaView>
    );
  }

  if (!currentLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Unable to retrieve current location.</Text>
      </SafeAreaView>
    );
  }

  // Calculate region to fit both current location and route
  const coordinates = [
    currentLocation,
    ...(routeCoordinates.length > 0
      ? [
          routeCoordinates[0],
          routeCoordinates[routeCoordinates.length - 1],
        ]
      : []),
  ];
  const latitudes = coordinates.map((coord) => coord.latitude);
  const longitudes = coordinates.map((coord) => coord.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const region = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: (maxLat - minLat) * 1.5 || 0.01,
    longitudeDelta: (maxLng - minLng) * 1.5 || 0.01,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        provider={Platform.OS === "android" ? "google" : undefined}
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            pinColor={AppColors.primary}
          />
        )}
        {routeCoordinates.length > 0 && (
          <>
            <Marker
              coordinate={routeCoordinates[0]}
              title={fromPlace.description}
              pinColor={AppColors.green}
            />
            <Marker
              coordinate={routeCoordinates[routeCoordinates.length - 1]}
              title={toPlace.description}
              pinColor={AppColors.red}
            />
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={AppColors.primary}
              strokeWidth={4}
            />
          </>
        )}
      </MapView>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          From: {fromPlace ? fromPlace.description : "N/A"}
        </Text>
        <Text style={styles.infoText}>
          To: {toPlace ? toPlace.description : "N/A"}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  map: {
    flex: 1,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: AppColors.card,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: -2 },
      },
    }),
  },
  infoText: {
    fontSize: Platform.OS === "ios" ? 16 : 15,
    color: AppColors.text,
    marginBottom: 8,
    lineHeight: Platform.OS === "ios" ? 20 : 19,
    includeFontPadding: false,
  },
  errorText: {
    fontSize: Platform.OS === "ios" ? 16 : 15,
    color: AppColors.red,
    textAlign: "center",
    marginTop: 20,
  },
});