import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { StackScreenProps } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { HomeStackParamList } from '../navigation/navigationTypes';
import { busLiveTrackingAPI } from '../services/busLiveTrackingAPI';
import { API_BASE_URL } from '../config/api';

type Props = StackScreenProps<HomeStackParamList, 'BusTracking'>;

const AppColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#0056b3',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  info: '#17a2b8',
};

interface BusLocation {
  busId: string;
  registrationNumber: string;
  routeNumber: string | null;
  status: 'active' | 'inactive' | 'break' | 'offline';
  latitude: number;
  longitude: number;
  lastUpdated: Date;
  passengerCount: number;
  occupancyLevel: string;
  confidence: number;
  distanceKm: number;
}

interface BusRoute {
  routeNumber: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  activeBuses: number;
  totalBuses: number;
}

export default function BusTrackingScreen({ navigation }: Props) {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [busLocations, setBusLocations] = useState<BusLocation[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  const [showBusDetails, setShowBusDetails] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 6.9271, // Default: Colombo
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const mapRef = useRef<MapView>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return false;
      }
      return true;
    } catch (err) {
      console.warn(err);
      setError('Failed to request location permission');
      return false;
    }
  };

  // Get user's current location
  const getUserLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      });
      const { latitude, longitude } = location.coords;
      console.log('User location:', { latitude, longitude });
      setUserLocation({ latitude, longitude });
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 },
        1000
      );
    } catch (err) {
      console.warn(err);
      setError('Unable to fetch your location');
    }
  };

  
const fetchRoutes = async () => {
  try {
    setLoading(true);
    const response = await fetch(`${API_BASE_URL}/api/bus-tracking/routes`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Fetched routes:', data);
    setRoutes(data.map((item: any) => ({
      routeNumber: item.route_number,
      routeName: item.route_name,
      startLocation: item.start_location,
      endLocation: item.end_location,
      activeBuses: item.active_buses || 0,
      totalBuses: item.total_buses || 0,
    })));
  } catch (err: any) {
    console.error('Error fetching routes:', err.message);
    setError(`Failed to fetch routes: ${err.message}`);
  } finally {
    setLoading(false);
  }
};


  // Fetch nearby buses from bus_live_tracking
  const fetchBusLocations = async () => {
    if (!userLocation) return;
    try {
      // Only show loading on first fetch, not on polling updates
      if (busLocations.length === 0) {
        setLoading(true);
      }
      const data = await busLiveTrackingAPI.getNearbyBuses(userLocation.latitude, userLocation.longitude, 5);
      console.log('Fetched nearby buses:', data);
      setBusLocations(data.map((item: any) => ({
        busId: item.bus_id,
        registrationNumber: item.registration_number,
        routeNumber: item.route_number || null,
        status: item.tracking_status,
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        lastUpdated: new Date(item.updated_at), // Fixed: use updated_at instead of last_update
        passengerCount: item.passenger_count,
        occupancyLevel: item.occupancy_level || 'Unknown',
        confidence: item.confidence || 0.0,
        distanceKm: parseFloat(item.distance), // Fixed: use distance instead of distance_km
      })));
    } catch (err: any) {
      console.error('Error fetching nearby buses:', err.message, err.response?.data);
      setError(`Failed to fetch bus locations: ${err.message}`);
    } finally {
      if (busLocations.length === 0) {
        setLoading(false);
      }
    }
  };

  // Initialize and set up polling
  useEffect(() => {
    const init = async () => {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        await getUserLocation();
      }
      await fetchRoutes();
    };
    init();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []); // Remove userLocation dependency to prevent multiple initializations

  // Separate effect for handling location-dependent bus fetching
  useEffect(() => {
    if (!userLocation) return;

    // Initial fetch when location is available
    fetchBusLocations();

    // Start polling for bus locations
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      fetchBusLocations();
    }, 30000); // Poll every 30 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [userLocation]);

  // Filter buses using useMemo to prevent unnecessary re-renders
  const filteredBuses = useMemo(() => {
    let filtered = busLocations.filter(bus => {
      if (selectedRoute && bus.routeNumber !== selectedRoute) {
        return false;
      }
      if (searchQuery) {
        return bus.routeNumber && bus.routeNumber.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return bus.status === 'active';
    });

    console.log('Filtered buses:', filtered);
    return filtered;
  }, [busLocations, selectedRoute, searchQuery]);

  // Update map region when filtered buses change
  useEffect(() => {
    if (filteredBuses.length > 0 && userLocation) {
      const latitudes = [userLocation.latitude, ...filteredBuses.map(bus => bus.latitude)];
      const longitudes = [userLocation.longitude, ...filteredBuses.map(bus => bus.longitude)];
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      const region = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.05),
        longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.05),
      };
      setMapRegion(region);
      mapRef.current?.animateToRegion(region, 1000);
    }
  }, [filteredBuses, userLocation]);

  const selectRoute = useCallback((routeNumber: string) => {
    setSelectedRoute(prev => prev === routeNumber ? null : routeNumber);
  }, []);

  const focusOnBus = useCallback((bus: BusLocation) => {
    setSelectedBus(bus);
    const region = {
      latitude: bus.latitude,
      longitude: bus.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setMapRegion(region);
    mapRef.current?.animateToRegion(region, 1000);
  }, []);

  const showAllBuses = useCallback(() => {
    if (filteredBuses.length > 0 && userLocation) {
      const latitudes = [userLocation.latitude, ...filteredBuses.map(bus => bus.latitude)];
      const longitudes = [userLocation.longitude, ...filteredBuses.map(bus => bus.longitude)];
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      const region = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.05),
        longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.05),
      };
      setMapRegion(region);
      mapRef.current?.animateToRegion(region, 1000);
    }
  }, [filteredBuses, userLocation]);

  const getBusStatusColor = (status: string) => {
    switch (status) {
      case 'active': return AppColors.success;
      case 'inactive': return AppColors.textSecondary;
      case 'break': return AppColors.warning;
      case 'offline': return AppColors.danger;
      default: return AppColors.textSecondary;
    }
  };

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy < 0.5) return AppColors.success;
    if (occupancy < 0.8) return AppColors.warning;
    return AppColors.danger;
  };

  const renderRouteItem = ({ item }: { item: BusRoute }) => (
    <TouchableOpacity
      style={[
        styles.routeCard,
        selectedRoute === item.routeNumber && styles.routeCardSelected
      ]}
      onPress={() => selectRoute(item.routeNumber)}
    >
      <View style={styles.routeHeader}>
        <Text style={[styles.routeNumber, selectedRoute === item.routeNumber && styles.routeNumberSelected]}>
          {item.routeNumber}
        </Text>
        <View style={styles.busCount}>
          <Text style={[styles.busCountText, selectedRoute === item.routeNumber && styles.routeTextSelected]}>
            {item.activeBuses}/{item.totalBuses} buses
          </Text>
          <View style={[
            styles.statusDot,
            { backgroundColor: item.activeBuses > 0 ? (selectedRoute === item.routeNumber ? 'white' : AppColors.success) : AppColors.textSecondary }
          ]} />
        </View>
      </View>
      <Text style={[styles.routeName, selectedRoute === item.routeNumber && styles.routeTextSelected]}>
        {item.routeName}
      </Text>
    </TouchableOpacity>
  );

  const renderBusItem = ({ item }: { item: BusLocation }) => {
    const occupancy = item.passengerCount / 60; // Assume capacity is 60
    const timeSinceUpdate = Math.floor((Date.now() - item.lastUpdated.getTime()) / 60000);

    return (
      <TouchableOpacity
        style={styles.busCard}
        onPress={() => focusOnBus(item)}
        onLongPress={() => {
          setSelectedBus(item);
          setShowBusDetails(true);
        }}
      >
        <View style={styles.busHeader}>
          <View style={styles.busInfo}>
            <Text style={styles.busId}>{item.registrationNumber}</Text>
            <Text style={styles.busRoute}>Route {item.routeNumber || 'N/A'}</Text>
          </View>
          <View style={styles.busStatus}>
            <View style={[styles.statusDot, { backgroundColor: getBusStatusColor(item.status) }]} />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.busDetails}>
          <View style={styles.busDetailRow}>
            <Icon name="people-outline" size={16} color={getOccupancyColor(occupancy)} />
            <Text style={[styles.busDetailText, { color: getOccupancyColor(occupancy) }]}>
              Occupancy: {item.passengerCount}/60 ({Math.round(occupancy * 100)}%) {item.occupancyLevel}
            </Text>
          </View>
          <View style={styles.busDetailRow}>
            <Icon name="pin-outline" size={16} color={AppColors.textSecondary} />
            <Text style={styles.busDetailText}>
              Distance: {item.distanceKm.toFixed(2)} km
            </Text>
          </View>
        </View>

        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Updated {timeSinceUpdate === 0 ? 'now' : `${timeSinceUpdate}m ago`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back-outline" size={24} color={AppColors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Bus Tracking</Text>
        <TouchableOpacity onPress={showAllBuses} style={styles.viewAllButton}>
          <Icon name="expand-outline" size={24} color={AppColors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color={AppColors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search route number..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={AppColors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.routeFilterContainer}>
        <Text style={styles.filterTitle}>Routes:</Text>
        <FlatList
          data={routes}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.routeNumber}
          renderItem={renderRouteItem}
          contentContainerStyle={styles.routeList}
        />
      </View>

      <View style={styles.mapContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={AppColors.primary} />
          </View>
        )}
        {error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onRegionChangeComplete={setMapRegion}
        >
          {filteredBuses.map((bus) => (
            <Marker
              key={bus.busId}
              coordinate={{
                latitude: bus.latitude,
                longitude: bus.longitude,
              }}
              title={`Bus ${bus.registrationNumber} (${bus.routeNumber || 'N/A'})`}
              description={`Occupancy: ${bus.occupancyLevel}`}
              onPress={() => setSelectedBus(bus)}
            >
              <View style={[
                styles.busMarker,
                { backgroundColor: getBusStatusColor(bus.status) }
              ]}>
                <Icon name="bus" size={16} color="white" />
                <Text style={styles.busMarkerText}>{bus.routeNumber || 'N/A'}</Text>
              </View>
            </Marker>
          ))}
          {selectedBus && (
            <Circle
              center={{
                latitude: selectedBus.latitude,
                longitude: selectedBus.longitude,
              }}
              radius={500}
              strokeColor={AppColors.primary}
              fillColor={`${AppColors.primary}20`}
              strokeWidth={2}
            />
          )}
        </MapView>

        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => {
              setSelectedRoute(null);
              setSearchQuery('');
            }}
          >
            <Icon name="refresh" size={20} color={AppColors.primary} />
            <Text style={styles.mapControlText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={showAllBuses}
          >
            <Icon name="locate" size={20} color={AppColors.primary} />
            <Text style={styles.mapControlText}>Fit All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.busListContainer}>
        <View style={styles.busListHeader}>
          <Text style={styles.busListTitle}>
            Nearby Buses ({filteredBuses.length})
          </Text>
          {selectedRoute && (
            <TouchableOpacity
              onPress={() => setSelectedRoute(null)}
              style={styles.clearFilterButton}
            >
              <Text style={styles.clearFilterText}>Clear Route Filter</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredBuses}
          keyExtractor={(item) => item.busId}
          renderItem={renderBusItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="bus-outline" size={48} color={AppColors.textSecondary} />
              <Text style={styles.emptyText}>
                {selectedRoute
                  ? `No nearby buses found for route ${selectedRoute}`
                  : 'No nearby buses found'}
              </Text>
            </View>
          }
        />
      </View>

      <Modal
        visible={showBusDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBusDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedBus && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Bus Details</Text>
                  <TouchableOpacity
                    onPress={() => setShowBusDetails(false)}
                    style={styles.modalCloseButton}
                  >
                    <Icon name="close" size={24} color={AppColors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Registration:</Text>
                    <Text style={styles.detailValue}>{selectedBus.registrationNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Route:</Text>
                    <Text style={styles.detailValue}>{selectedBus.routeNumber || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, { color: getBusStatusColor(selectedBus.status) }]}>
                      {selectedBus.status}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Occupancy:</Text>
                    <Text style={[styles.detailValue, { color: getOccupancyColor(selectedBus.passengerCount / 60) }]}>
                      {selectedBus.passengerCount}/60
                      ({Math.round((selectedBus.passengerCount / 60) * 100)}%) {selectedBus.occupancyLevel}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Confidence:</Text>
                    <Text style={styles.detailValue}>{(selectedBus.confidence * 100).toFixed(0)}%</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Distance:</Text>
                    <Text style={styles.detailValue}>
                      {selectedBus.distanceKm.toFixed(2)} km
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.trackButton}
                    onPress={() => {
                      setShowBusDetails(false);
                      focusOnBus(selectedBus);
                    }}
                  >
                    <Icon name="navigate" size={20} color="white" />
                    <Text style={styles.trackButtonText}>Track on Map</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: AppColors.card,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  viewAllButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.card,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: AppColors.text,
  },
  routeFilterContainer: {
    backgroundColor: AppColors.card,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
    marginLeft: 16,
    marginBottom: 8,
  },
  routeList: {
    paddingHorizontal: 12,
  },
  routeCard: {
    backgroundColor: AppColors.background,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    minWidth: 120,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  routeCardSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  routeNumberSelected: {
    color: 'white',
  },
  routeTextSelected: {
    color: '#E0E0E0',
  },
  busCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busCountText: {
    fontSize: 10,
    color: AppColors.textSecondary,
    marginRight: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeName: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  busMarker: {
    backgroundColor: AppColors.primary,
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  busMarkerText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'column',
  },
  mapControlButton: {
    backgroundColor: AppColors.card,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mapControlText: {
    fontSize: 10,
    color: AppColors.primary,
    marginTop: 2,
  },
  busListContainer: {
    maxHeight: Dimensions.get('window').height * 0.35,
    backgroundColor: AppColors.card,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  busListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  busListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: AppColors.background,
    borderRadius: 4,
  },
  clearFilterText: {
    fontSize: 12,
    color: AppColors.primary,
  },
  busCard: {
    backgroundColor: AppColors.card,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  busInfo: {
    flex: 1,
  },
  busId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  busRoute: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  busStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  busDetails: {
    marginBottom: 8,
  },
  busDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  busDetailText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginLeft: 6,
  },
  lastUpdated: {
    alignItems: 'flex-end',
  },
  lastUpdatedText: {
    fontSize: 10,
    color: AppColors.textSecondary,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: AppColors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: '600',
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  trackButton: {
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  trackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: AppColors.danger,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});