// ===============================================
// PASSENGER APP INTEGRATION EXAMPLE
// Live Bus Tracking for Passengers
// ===============================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Import the new live tracking API
import { busLiveTrackingAPI } from '../services/api';

const PassengerTrackingScreen = () => {
  const [liveBuses, setLiveBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('138');
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyBuses, setNearbyBuses] = useState([]);
  const [mapRegion, setMapRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Load live buses on component mount and every 10 seconds
  useEffect(() => {
    loadLiveBuses();
    getUserLocation();
    
    const interval = setInterval(loadLiveBuses, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [selectedRoute]);

  // Get user's current location
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show nearby buses.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userPos = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(userPos);
      setMapRegion({
        ...mapRegion,
        latitude: userPos.latitude,
        longitude: userPos.longitude,
      });

      // Load nearby buses
      loadNearbyBuses(userPos.latitude, userPos.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Load live buses for selected route
  const loadLiveBuses = async () => {
    try {
      setLoading(true);
      const response = await busLiveTrackingAPI.getBusesOnRoute(selectedRoute);
      
      if (response.success && response.data.buses) {
        // Filter out null buses
        const activeBuses = response.data.buses.filter(bus => bus.bus_id !== null);
        setLiveBuses(activeBuses);
        console.log(`📍 Loaded ${activeBuses.length} live buses on route ${selectedRoute}`);
      }
    } catch (error) {
      console.error('Error loading live buses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load nearby buses
  const loadNearbyBuses = async (latitude, longitude, radius = 5) => {
    try {
      const response = await busLiveTrackingAPI.getNearbyBuses(latitude, longitude, radius);
      
      if (response.success) {
        setNearbyBuses(response.data);
        console.log(`📍 Found ${response.data.length} nearby buses`);
      }
    } catch (error) {
      console.error('Error loading nearby buses:', error);
    }
  };

  // Render bus marker on map
  const renderBusMarker = (bus, index) => (
    <Marker
      key={`bus-${bus.bus_id}-${index}`}
      coordinate={{
        latitude: parseFloat(bus.latitude),
        longitude: parseFloat(bus.longitude),
      }}
      title={`Bus ${bus.registration_number || bus.bus_id}`}
      description={`Route ${selectedRoute} • ${bus.occupancy_level} • ${bus.driver_name}`}
    >
      <View style={styles.busMarker}>
        <Ionicons name="bus" size={24} color="#0056b3" />
        <Text style={styles.busId}>{bus.bus_id}</Text>
      </View>
    </Marker>
  );

  // Render bus list item
  const renderBusItem = ({ item: bus }) => (
    <View style={styles.busCard}>
      <View style={styles.busHeader}>
        <Ionicons name="bus" size={24} color="#0056b3" />
        <Text style={styles.busTitle}>Bus {bus.registration_number || bus.bus_id}</Text>
        <Text style={[styles.occupancyBadge, { backgroundColor: getOccupancyColor(bus.occupancy_level) }]}>
          {bus.occupancy_level || 'unknown'}
        </Text>
      </View>
      
      <Text style={styles.busInfo}>Driver: {bus.driver_name || 'Unknown'}</Text>
      <Text style={styles.busInfo}>
        Last Update: {bus.last_update ? new Date(bus.last_update).toLocaleTimeString() : 'Unknown'}
      </Text>
      <Text style={styles.busInfo}>
        Speed: {bus.speed ? `${Math.round(bus.speed)} km/h` : 'Stationary'}
      </Text>
      
      {userLocation && (
        <Text style={styles.busInfo}>
          Distance: {calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            parseFloat(bus.latitude),
            parseFloat(bus.longitude)
          ).toFixed(1)} km away
        </Text>
      )}
    </View>
  );

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  // Get color for occupancy level
  const getOccupancyColor = (level) => {
    switch (level) {
      case 'low': return '#28a745';
      case 'medium': return '#ffc107';
      case 'high': return '#fd7e14';
      case 'full': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Bus Tracking</Text>
        <Text style={styles.headerSubtitle}>Route {selectedRoute} • {liveBuses.length} buses online</Text>
      </View>

      {/* Route Selector */}
      <View style={styles.routeSelector}>
        {['138', '139', '140'].map(route => (
          <TouchableOpacity
            key={route}
            style={[styles.routeButton, selectedRoute === route && styles.routeButtonActive]}
            onPress={() => setSelectedRoute(route)}
          >
            <Text style={[styles.routeButtonText, selectedRoute === route && styles.routeButtonTextActive]}>
              Route {route}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
        >
          {/* User location marker */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="Your Location"
              pinColor="red"
            />
          )}

          {/* Bus markers */}
          {liveBuses.map((bus, index) => renderBusMarker(bus, index))}
        </MapView>

        {/* Refresh button */}
        <TouchableOpacity style={styles.refreshButton} onPress={loadLiveBuses}>
          <Ionicons name="refresh" size={24} color="#0056b3" />
        </TouchableOpacity>
      </View>

      {/* Bus List */}
      <View style={styles.busListContainer}>
        <Text style={styles.sectionTitle}>Live Buses</Text>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0056b3" />
            <Text style={styles.loadingText}>Loading live buses...</Text>
          </View>
        )}

        {!loading && liveBuses.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="bus-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No live buses on Route {selectedRoute}</Text>
            <Text style={styles.emptySubtext}>Check back in a few minutes</Text>
          </View>
        )}

        <FlatList
          data={liveBuses}
          renderItem={renderBusItem}
          keyExtractor={(item, index) => `${item.bus_id}-${index}`}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#0056b3',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#e3f2fd',
    fontSize: 14,
    marginTop: 5,
  },
  routeSelector: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  routeButton: {
    flex: 1,
    padding: 10,
    margin: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  routeButtonActive: {
    backgroundColor: '#0056b3',
  },
  routeButtonText: {
    color: '#6c757d',
    fontWeight: '600',
  },
  routeButtonTextActive: {
    color: '#ffffff',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  refreshButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  busMarker: {
    backgroundColor: '#ffffff',
    padding: 5,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  busId: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0056b3',
  },
  busListContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#212529',
  },
  busCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0056b3',
  },
  busHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  busTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
    color: '#212529',
  },
  occupancyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  busInfo: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#6c757d',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6c757d',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 5,
  },
});

export default PassengerTrackingScreen;
