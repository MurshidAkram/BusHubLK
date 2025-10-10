import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { StackScreenProps } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { HomeStackParamList } from '../navigation/navigationTypes';
import { busLiveTrackingAPI } from '../services/busLiveTrackingAPI';
import { busOccupancyAPI, AverageOccupancyData } from '../services/busOccupancyAPI';
import { API_BASE_URL } from '../config/api';
import { 
  convertToSriLankaTime, 
  getMinutesSince, 
  formatTimeSince, 
  isTimestampStale,
  getCurrentSriLankaTime 
} from '../utils/timeUtils';

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
  // Dynamic occupancy data from passenger reports
  dynamicOccupancy?: {
    level: string;
    reportCount: number;
    avgConfidence: number;
    dataFreshness: string;
    lastReportTime: Date | null;
    minutesSinceLastReport: number | null;
  };
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
  const [occupancyData, setOccupancyData] = useState<{ [busId: string]: AverageOccupancyData }>({});
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isFullScreenMap, setIsFullScreenMap] = useState(false);

  const mapRef = useRef<MapView>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const occupancyPollingRef = useRef<NodeJS.Timeout | null>(null);

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
      
      console.log(`🔄 Fetching bus locations at ${new Date().toLocaleTimeString('en-LK')} (Sri Lanka time)`);
      const data = await busLiveTrackingAPI.getNearbyBuses(userLocation.latitude, userLocation.longitude, 5);
      console.log(`✅ Fetched ${data.length} nearby buses:`, data.map((bus: any) => ({
        id: bus.bus_id,
        route: bus.route_number,
        status: bus.tracking_status,
        lastUpdate: bus.updated_at
      })));
      
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
      
      // Update last refresh time
      setLastRefreshTime(getCurrentSriLankaTime());
    } catch (err: any) {
      console.error('Error fetching nearby buses:', err.message, err.response?.data);
      
      // Don't show timeout errors to users - they're usually due to network issues
      // and the app should continue working without showing error messages
      if (err.message && err.message.includes('timeout')) {
        console.log('🕐 API timeout - continuing silently without showing error to user');
        return; // Don't set error state for timeouts
      }
      
      // Only show errors for actual failures (4xx, 5xx responses)
      if (err.response?.status >= 400) {
        setError(`Unable to fetch bus locations. Please try again.`);
      } else {
        console.log('🌐 Network connectivity issue - continuing silently');
      }
    } finally {
      if (busLocations.length === 0) {
        setLoading(false);
      }
    }
  };

  // Fetch dynamic occupancy data from passenger reports
  const fetchOccupancyData = async () => {
    if (busLocations.length === 0) return;
    
    try {
      const busIds = busLocations.map(bus => parseInt(bus.busId));
      console.log('🔄 Fetching dynamic occupancy data for buses:', busIds);
      
      const response = await busOccupancyAPI.getAverageOccupancyLevels(busIds, 30); // 30-minute window
      setOccupancyData(response.data);
      
      console.log('✅ Updated occupancy data for buses:', Object.keys(response.data).length);
    } catch (err: any) {
      console.error('❌ Error fetching occupancy data:', err.message);
      // Don't show error to user as this is supplementary data
    }
  };

  // Merge dynamic occupancy data with bus locations
  const enhanceBusesWithOccupancyData = useCallback((buses: BusLocation[]) => {
    return buses.map(bus => {
      const dynamicData = occupancyData[bus.busId];
      if (dynamicData && dynamicData.calculated_occupancy_level !== 'unknown') {
        return {
          ...bus,
          dynamicOccupancy: {
            level: dynamicData.calculated_occupancy_level,
            reportCount: dynamicData.report_count,
            avgConfidence: dynamicData.avg_confidence,
            dataFreshness: dynamicData.data_freshness,
            lastReportTime: dynamicData.last_report_time ? new Date(dynamicData.last_report_time) : null,
            minutesSinceLastReport: dynamicData.minutes_since_last_report,
          }
        };
      }
      return bus;
    });
  }, [occupancyData]);

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
      if (occupancyPollingRef.current) {
        clearInterval(occupancyPollingRef.current);
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
    }, 50000); // Poll every 50 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [userLocation]);

  // Separate effect for occupancy data polling
  useEffect(() => {
    if (busLocations.length === 0) return;

    // Initial fetch when buses are available
    fetchOccupancyData();

    // Start polling for occupancy data every 5 minutes
    if (occupancyPollingRef.current) {
      clearInterval(occupancyPollingRef.current);
    }
    
    occupancyPollingRef.current = setInterval(() => {
      fetchOccupancyData();
    }, 100000); // Poll every 5 minutes (300,000 ms)

    return () => {
      if (occupancyPollingRef.current) {
        clearInterval(occupancyPollingRef.current);
      }
    };
  }, [busLocations.length]); // Re-run when number of buses changes

  // Filter buses using useMemo to prevent unnecessary re-renders
  const filteredBuses = useMemo(() => {
    const enhancedBuses = enhanceBusesWithOccupancyData(busLocations);
    console.log(`🔍 Filtering ${enhancedBuses.length} buses with occupancy data...`);
    
    let filtered = enhancedBuses.filter(bus => {
      // Filter out buses with old data (older than 3 minutes) using Sri Lanka time
      const minutesOld = getMinutesSince(bus.lastUpdated);
      if (isTimestampStale(bus.lastUpdated, 3)) {
        console.log(`⏰ Filtering out bus ${bus.busId} (Route ${bus.routeNumber}) - data is stale (${minutesOld} minutes old)`);
        return false;
      }
      
      if (selectedRoute && bus.routeNumber !== selectedRoute) {
        console.log(`🛣️ Filtering out bus ${bus.busId} - route ${bus.routeNumber} doesn't match selected route ${selectedRoute}`);
        return false;
      }
      
      if (searchQuery) {
        const matches = bus.routeNumber && bus.routeNumber.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matches) {
          console.log(`🔍 Filtering out bus ${bus.busId} - route ${bus.routeNumber} doesn't match search "${searchQuery}"`);
          return false;
        }
      }
      
      if (bus.status !== 'active') {
        console.log(`🚌 Filtering out bus ${bus.busId} - status is ${bus.status} (not active)`);
        return false;
      }
      
      console.log(`✅ Keeping bus ${bus.busId} (Route ${bus.routeNumber}) - ${minutesOld}m old, status: ${bus.status}`);
      return true;
    });

    console.log(`📊 Final result: ${filtered.length} buses after filtering from ${enhancedBuses.length} total`);
    return filtered;
  }, [busLocations, selectedRoute, searchQuery, enhanceBusesWithOccupancyData]);

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

  const toggleFullScreenMap = useCallback(() => {
    setIsFullScreenMap(prev => !prev);
  }, []);

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

  const getOccupancyLevelColor = (level: string) => {
    const levelInfo = busOccupancyAPI.getOccupancyLevelInfo(level);
    return levelInfo.color;
  };

  const getOccupancyDisplayText = (bus: BusLocation) => {
    // Use dynamic occupancy data if available and fresh
    if (bus.dynamicOccupancy && bus.dynamicOccupancy.dataFreshness !== 'no_data') {
      const levelInfo = busOccupancyAPI.getOccupancyLevelInfo(bus.dynamicOccupancy.level);
      const freshnessInfo = busOccupancyAPI.getDataFreshnessInfo(bus.dynamicOccupancy.dataFreshness);
      return {
        text: `${levelInfo.label} (${bus.dynamicOccupancy.reportCount} reports)`,
        color: levelInfo.color,
        confidence: bus.dynamicOccupancy.avgConfidence,
        freshness: freshnessInfo.label,
        source: 'passenger_reports'
      };
    }
    
    // Fallback to basic occupancy data
    const occupancy = bus.passengerCount / 60;
    return {
      text: `${bus.passengerCount}/60 (${Math.round(occupancy * 100)}%) ${bus.occupancyLevel}`,
      color: getOccupancyColor(occupancy),
      confidence: bus.confidence,
      freshness: '',
      source: 'system_data'
    };
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
    const timeSinceUpdate = getMinutesSince(item.lastUpdated); // Using Sri Lanka time
    const occupancyDisplay = getOccupancyDisplayText(item);
    const isStaleData = timeSinceUpdate > 2; // Mark as stale if older than 2 minutes

    return (
      <TouchableOpacity
        style={[
          styles.busCard,
          isStaleData && styles.staleBusCard // Add visual indicator for stale data
        ]}
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
            <Ionicons name="people-outline" size={16} color={occupancyDisplay.color} />
            <Text style={[styles.busDetailText, { color: occupancyDisplay.color }]}>
              Occupancy: {occupancyDisplay.text}
            </Text>
          </View>
          {occupancyDisplay.freshness && (
            <View style={styles.busDetailRow}>
              <Ionicons name="time-outline" size={16} color={AppColors.textSecondary} />
              <Text style={styles.busDetailText}>
                Data: {occupancyDisplay.freshness}
              </Text>
            </View>
          )}
          <View style={styles.busDetailRow}>
            <Ionicons name="pin-outline" size={16} color={AppColors.textSecondary} />
            <Text style={styles.busDetailText}>
              Distance: {item.distanceKm.toFixed(2)} km
            </Text>
          </View>
        </View>

        <View style={styles.lastUpdated}>
          <Text style={[
            styles.lastUpdatedText,
            isStaleData && styles.staleDataText
          ]}>
            Updated {formatTimeSince(item.lastUpdated)}
            {isStaleData && ' (May be offline)'}
          </Text>
          {occupancyDisplay.source === 'passenger_reports' && (
            <Text style={[styles.lastUpdatedText, { color: AppColors.success }]}>
              📊 Passenger Reports
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Always fetch user location and nearby buses when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      await requestLocationPermission();
      await getUserLocation();
      fetchBusLocations();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />

      <LinearGradient
        colors={['#0056b3', '#1976d2', '#42a5f5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.titleWhite}>Bus Tracking</Text>
          <TouchableOpacity onPress={toggleFullScreenMap} style={styles.viewAllButton}>
            <Ionicons 
              name={isFullScreenMap ? "contract-outline" : "expand-outline"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {!isFullScreenMap && (
        <>
          <LinearGradient
            colors={['#E3F2FD', '#FFFFFF', '#F8FAFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchGradient}
          >
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color={AppColors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search route number..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={AppColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>

          <LinearGradient
            colors={['#BBDEFB', '#E3F2FD', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.routeFilterGradient}
          >
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
          </LinearGradient>
        </>
      )}

      <View style={[styles.mapContainer, isFullScreenMap && styles.fullScreenMapContainer]}>
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
          {/* Show user's location marker explicitly */}
          {userLocation && (
            <Marker
              coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
              title="You"
              description="Your current location"
            >
              <View style={{ backgroundColor: '#17a2b8', borderRadius: 12, padding: 4 }}>
                <Ionicons name="person" size={18} color="white" />
              </View>
            </Marker>
          )}
          {/* Show nearby buses within radius */}
          {filteredBuses.map((bus) => (
            <Marker
              key={bus.busId}
              coordinate={{
                latitude: bus.latitude,
                longitude: bus.longitude,
              }}
              title={`Bus ${bus.registrationNumber} (${bus.routeNumber || 'N/A'})`}
              description={`Occupancy: ${getOccupancyDisplayText(bus).text.split(' (')[0]}`}
              onPress={() => setSelectedBus(bus)}
            >
              <View style={[
                styles.busMarker,
                { backgroundColor: getBusStatusColor(bus.status) }
              ]}>
                <Ionicons name="bus" size={16} color="white" />
                <Text style={styles.busMarkerText}>{bus.routeNumber || 'N/A'}</Text>
              </View>
            </Marker>
          ))}
          {/* Show radius circle around user location */}
          {userLocation && (
            <Circle
              center={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
              radius={5000} // 5km radius
              strokeColor={AppColors.info}
              fillColor={AppColors.info + '20'}
              strokeWidth={2}
            />
          )}
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

        <View style={[styles.mapControls, isFullScreenMap && styles.fullScreenMapControls]}>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => {
              console.log('🔄 Manual refresh triggered');
              fetchBusLocations();
              fetchOccupancyData();
            }}
          >
            <Ionicons name="refresh" size={20} color={AppColors.primary} />
            <Text style={styles.mapControlText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => {
              setSelectedRoute(null);
              setSearchQuery('');
            }}
          >
            <Ionicons name="filter-outline" size={20} color={AppColors.primary} />
            <Text style={styles.mapControlText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={showAllBuses}
          >
            <Ionicons name="locate" size={20} color={AppColors.primary} />
            <Text style={styles.mapControlText}>Fit All</Text>
          </TouchableOpacity>
          {isFullScreenMap && (
            <TouchableOpacity
              style={styles.mapControlButton}
              onPress={() => getUserLocation()}
            >
              <Ionicons name="navigate" size={20} color={AppColors.primary} />
              <Text style={styles.mapControlText}>My Location</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isFullScreenMap && (
        <LinearGradient
          colors={['#FFFFFF', '#E3F2FD', '#BBDEFB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.busListGradient}
        >
          <View style={styles.busListContainer}>
            <View style={styles.busListHeader}>
            <View>
              <Text style={styles.busListTitle}>
                Nearby Buses ({filteredBuses.length})
              </Text>
              {lastRefreshTime && (
                <Text style={styles.lastRefreshText}>
                  Your location last updated: {formatTimeSince(lastRefreshTime)}
                </Text>
              )}
            </View>
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
                <Ionicons name="bus-outline" size={48} color={AppColors.textSecondary} />
                <Text style={styles.emptyText}>
                  {selectedRoute
                    ? `No nearby buses found for route ${selectedRoute}`
                    : 'No nearby buses found'}
                </Text>
              </View>
            }
          />
          </View>
        </LinearGradient>
      )}

      {/* Full-screen map overlay with bus info */}
      {isFullScreenMap && (
        <View style={styles.fullScreenOverlay}>
          <View style={styles.fullScreenBusInfo}>
            <Text style={styles.fullScreenTitle}>
              Nearby Buses ({filteredBuses.length})
            </Text>
            {selectedRoute && (
              <Text style={styles.fullScreenSubtitle}>
                Filtered by Route {selectedRoute}
              </Text>
            )}
            {selectedBus && (
              <View style={styles.selectedBusInfo}>
                <Text style={styles.selectedBusText}>
                  Selected: {selectedBus.registrationNumber} (Route {selectedBus.routeNumber})
                </Text>
                <Text style={styles.selectedBusOccupancy}>
                  {getOccupancyDisplayText(selectedBus).text}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.fullScreenFilterButton}
            onPress={() => {
              // Quick access to clear filters
              setSelectedRoute(null);
              setSearchQuery('');
              setSelectedBus(null);
            }}
          >
            <Ionicons name="filter-outline" size={20} color="white" />
            <Text style={styles.fullScreenFilterText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

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
                    <Ionicons name="close" size={24} color={AppColors.text} />
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
                    <Text style={[styles.detailValue, { color: getOccupancyDisplayText(selectedBus).color }]}>
                      {getOccupancyDisplayText(selectedBus).text}
                    </Text>
                  </View>
                  {selectedBus.dynamicOccupancy && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Report Quality:</Text>
                        <Text style={styles.detailValue}>
                          {selectedBus.dynamicOccupancy.avgConfidence}% avg confidence
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Data Freshness:</Text>
                        <Text style={styles.detailValue}>
                          {busOccupancyAPI.getDataFreshnessInfo(selectedBus.dynamicOccupancy.dataFreshness).label}
                        </Text>
                      </View>
                    </>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>System Confidence:</Text>
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
                    <Ionicons name="navigate" size={20} color="white" />
                    <Text style={styles.trackButtonText}>Track on Map</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  titleWhite: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  viewAllButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
  searchGradient: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  routeFilterGradient: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  routeFilterContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
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
  busListGradient: {
    maxHeight: Dimensions.get('window').height * 0.35,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  busListContainer: {
    maxHeight: Dimensions.get('window').height * 0.35,
    backgroundColor: 'transparent',
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
  lastRefreshText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
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
  staleBusCard: {
    opacity: 0.6,
    borderColor: AppColors.warning,
    borderStyle: 'dashed',
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
  staleDataText: {
    color: AppColors.warning,
    fontWeight: 'bold',
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
  // Full-screen map styles
  fullScreenMapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  fullScreenMapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'column',
    zIndex: 20,
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 80, // Leave space for controls
    zIndex: 20,
  },
  fullScreenBusInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  fullScreenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  fullScreenSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  selectedBusInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedBusText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  selectedBusOccupancy: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  fullScreenFilterButton: {
    backgroundColor: 'rgba(0, 86, 179, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  fullScreenFilterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
