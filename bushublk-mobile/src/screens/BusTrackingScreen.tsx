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
import MapView, { Marker, PROVIDER_DEFAULT, Circle } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { StackScreenProps } from '@react-navigation/stack';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

type Props = StackScreenProps<any, 'BusTracking'>;

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
  // Enhanced dynamic occupancy data from passenger reports
  dynamicOccupancy?: {
    level: string;
    reportCount: number;
    avgConfidence: number;
    dataFreshness: string;
    lastReportTime: Date | null;
    minutesSinceLastReport: number | null;
    // Simplified fields
    overallCondition: string;
    trendDirection: string;
    reliabilityScore: number;
    timeWeightedLevel: string;
    passengerFeedbackSummary: string;
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

export default function BusTrackingScreen({ navigation, route }: Props) {
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
  
  // Enhanced: Caching and performance tracking
  const [cachedBuses, setCachedBuses] = useState<BusLocation[]>([]);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [fetchMetrics, setFetchMetrics] = useState<{
    locationTime: number;
    busesTime: number;
    occupancyTime: number;
    totalTime: number;
  }>({ locationTime: 0, busesTime: 0, occupancyTime: 0, totalTime: 0 });

  const mapRef = useRef<MapView>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const occupancyPollingRef = useRef<NodeJS.Timeout | null>(null);
  const isUserInteractingRef = useRef(false);
  const autoAdjustTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Enhanced: Load cached buses on startup
  const loadCachedBuses = async () => {
    try {
      const cached = await AsyncStorage.getItem('cached_buses');
      if (cached) {
        const parsedBuses = JSON.parse(cached);
        console.log(`📦 Loaded ${parsedBuses.length} buses from cache`);
        if (isMountedRef.current) {
          setCachedBuses(parsedBuses);
          // Show cached data immediately
          if (busLocations.length === 0) {
            setBusLocations(parsedBuses);
          }
        }
      }
    } catch (error) {
      console.error('Error loading cached buses:', error);
    }
  };

  // Enhanced: Save buses to cache
  const saveBusesToCache = async (buses: BusLocation[]) => {
    try {
      await AsyncStorage.setItem('cached_buses', JSON.stringify(buses));
      console.log(`💾 Saved ${buses.length} buses to cache`);
    } catch (error) {
      console.error('Error saving buses to cache:', error);
    }
  };

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

  // Enhanced: Get user's current location with timeout
  const getUserLocation = async () => {
    const startTime = Date.now();
    try {
      // Create a timeout promise
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Faster than High accuracy
        timeInterval: 5000,
        distanceInterval: 10,
      });
      
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Location timeout')), 10000) // 10 second timeout
      );
      
      const location = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;
      const { latitude, longitude } = location.coords;
      const locationTime = Date.now() - startTime;
      
      console.log(`📍 User location obtained in ${locationTime}ms:`, { latitude, longitude });
      if (isMountedRef.current) {
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
        
        setFetchMetrics(prev => ({ ...prev, locationTime }));
      }
    } catch (err: any) {
      console.warn('Location error:', err.message);
      // Don't block the app if location fails - use default Colombo location
      if (isMountedRef.current) {
        setError('Using default location (Colombo). Enable GPS for accurate tracking.');
        setUserLocation({ latitude: 6.9271, longitude: 79.8612 });
      }
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
    if (isMountedRef.current) {
      setRoutes(data.map((item: any) => ({
        routeNumber: item.route_number,
        routeName: item.route_name,
        startLocation: item.start_location,
        endLocation: item.end_location,
        activeBuses: item.active_buses || 0,
        totalBuses: item.total_buses || 0,
      })));
    }
  } catch (err: any) {
    console.error('Error fetching routes:', err.message);
    if (isMountedRef.current) {
      setError(`Failed to fetch routes: ${err.message}`);
    }
  } finally {
    if (isMountedRef.current) {
      setLoading(false);
    }
  }
};


  // Enhanced: Fetch nearby buses with retry logic and metrics
  const fetchBusLocations = async (retryCount = 0) => {
    if (!userLocation) {
      console.log('⏸️ Skipping bus fetch - no user location yet');
      return;
    }
    
    const startTime = Date.now();
    try {
      setIsFetchingLive(true);
      
      // Only show loading spinner on first fetch, not on background updates
      if (busLocations.length === 0 && cachedBuses.length === 0) {
        setLoading(true);
      }
      
      console.log(`🔄 Fetching bus locations (attempt ${retryCount + 1}) at ${new Date().toLocaleTimeString('en-LK')}`);
      const data = await busLiveTrackingAPI.getNearbyBuses(userLocation.latitude, userLocation.longitude, 5);
      const busesTime = Date.now() - startTime;
      
      console.log(`✅ Fetched ${data.length} nearby buses in ${busesTime}ms:`, data.map((bus: any) => ({
        id: bus.bus_id,
        route: bus.route_number,
        status: bus.tracking_status,
        lastUpdate: bus.updated_at
      })));
      
      const mappedBuses = data.map((item: any) => ({
        busId: item.bus_id,
        registrationNumber: item.registration_number,
        routeNumber: item.route_number || null,
        status: item.tracking_status,
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        lastUpdated: new Date(item.updated_at),
        passengerCount: item.passenger_count,
        occupancyLevel: item.occupancy_level || 'Unknown',
        confidence: item.confidence || 0.0,
        distanceKm: parseFloat(item.distance),
      }));
      
      if (!isMountedRef.current) return;
      
      setBusLocations(mappedBuses);
      
      // Save to cache for next time
      if (mappedBuses.length > 0) {
        saveBusesToCache(mappedBuses);
      }
      
      if (!isMountedRef.current) return;
      
      // Update last refresh time
      setLastRefreshTime(getCurrentSriLankaTime());
      setFetchMetrics(prev => ({ ...prev, busesTime, totalTime: Date.now() - startTime }));
      setError(null); // Clear any previous errors
      
    } catch (err: any) {
      const busesTime = Date.now() - startTime;
      console.error(`❌ Error fetching nearby buses (${busesTime}ms):`, err.message);
      
      // Retry logic for timeouts (up to 2 retries)
      if (err.message && err.message.includes('timeout') && retryCount < 2) {
        console.log(`🔄 Retrying fetch (attempt ${retryCount + 2}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
        return fetchBusLocations(retryCount + 1);
      }
      
      // Show cached data if available
      if (cachedBuses.length > 0 && busLocations.length === 0) {
        console.log('� Using cached buses due to fetch failure');
        if (isMountedRef.current) {
          setBusLocations(cachedBuses);
          setError('⚠️ Showing cached data - connection issue');
        }
      } else if (!err.message.includes('timeout')) {
        // Only show non-timeout errors
        if (err.response?.status >= 400) {
          if (isMountedRef.current) {
            setError(`Unable to fetch bus locations. Please try again.`);
          }
        }
      }
      
      if (isMountedRef.current) {
        setFetchMetrics(prev => ({ ...prev, busesTime }));
      }
      
    } finally {
      if (isMountedRef.current) {
        setIsFetchingLive(false);
        if (busLocations.length === 0 && cachedBuses.length === 0) {
          setLoading(false);
        }
      }
    }
  };

  // Fetch dynamic occupancy data from passenger reports
  const fetchOccupancyData = async () => {
    if (busLocations.length === 0) return;
    
    try {
      const busIds = busLocations.map(bus => parseInt(bus.busId));
      console.log('🔄 Fetching dynamic occupancy data for buses:', busIds);
      
      const response = await busOccupancyAPI.getAverageOccupancyLevels(busIds, 15); // 15-minute window as required
      
      console.log('📊 Raw occupancy API response:', JSON.stringify(response, null, 2));
      console.log('📊 Occupancy data structure:', response.data);
      
      if (isMountedRef.current) {
        setOccupancyData(response.data);
      }
      
      console.log('✅ Updated occupancy data for buses:', Object.keys(response.data).length);
      console.log('✅ Occupancy data keys:', Object.keys(response.data));
      
      // Log sample of occupancy data for debugging
      Object.keys(response.data).forEach(busId => {
        console.log(`Bus ${busId} occupancy:`, response.data[busId]);
      });
    } catch (err: any) {
      console.error('❌ Error fetching occupancy data:', err.message);
      console.error('❌ Full error:', err);
      // Don't show error to user as this is supplementary data
    }
  };



  // Merge dynamic occupancy data
  const enhanceBusesWithOccupancyData = useCallback((buses: BusLocation[]) => {
    console.log('🔀 Merging occupancy data for buses...');
    console.log('🔀 Available occupancy data keys:', Object.keys(occupancyData));
    console.log('🔀 Bus IDs to merge:', buses.map(b => b.busId));
    
    return buses.map(bus => {
      const dynamicData = occupancyData[bus.busId];
      console.log(`🔀 Bus ${bus.busId} (${bus.registrationNumber}):`, {
        hasData: !!dynamicData,
        data: dynamicData,
        level: dynamicData?.calculated_occupancy_level,
        reportCount: dynamicData?.report_count
      });
      
      // Include occupancy data if it exists and has reports (even if level is 'unknown')
      // Show data as long as there's at least one report
      if (dynamicData && dynamicData.report_count > 0) {
        console.log(`✅ Adding occupancy data to bus ${bus.busId}: ${dynamicData.calculated_occupancy_level} (${dynamicData.report_count} reports)`);
        return {
          ...bus,
          dynamicOccupancy: {
            level: dynamicData.calculated_occupancy_level,
            reportCount: dynamicData.report_count,
            avgConfidence: dynamicData.avg_confidence,
            dataFreshness: dynamicData.data_freshness,
            lastReportTime: dynamicData.last_report_time ? new Date(dynamicData.last_report_time) : null,
            minutesSinceLastReport: dynamicData.minutes_since_last_report,
            // Simple fields for basic occupancy tracking
            overallCondition: dynamicData.calculated_occupancy_level,
            trendDirection: 'stable',
            reliabilityScore: Math.min(dynamicData.report_count * 20 + dynamicData.avg_confidence, 100),
            timeWeightedLevel: dynamicData.calculated_occupancy_level,
            passengerFeedbackSummary: `${dynamicData.report_count} passenger report${dynamicData.report_count !== 1 ? 's' : ''} (${dynamicData.avg_confidence}% confidence)`
          }
        };
      } else {
        console.log(`❌ No valid occupancy data for bus ${bus.busId} (no reports)`);
      }
      return bus;
    });
  }, [occupancyData]);

  // Enhanced: Initialize with parallel fetching and cache loading
  useEffect(() => {
    const init = async () => {
      console.log('🚀 Starting parallel initialization...');
      const initStartTime = Date.now();
      
      // Load cached buses immediately (non-blocking)
      loadCachedBuses();
      
      // Request location permission
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;
      
      // Parallel execution: Get location, routes, and cached data
      await Promise.allSettled([
        getUserLocation(),
        fetchRoutes(),
      ]);
      
      const initTime = Date.now() - initStartTime;
      console.log(`✅ Initialization complete in ${initTime}ms`);
    };
    init();

    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (occupancyPollingRef.current) {
        clearInterval(occupancyPollingRef.current);
      }
    };
  }, []); // Remove userLocation dependency to prevent multiple initializations

  // Enhanced: Faster polling for real-time tracking (15 seconds instead of 50)
  useEffect(() => {
    if (!userLocation) return;

    // Initial fetch when location is available
    fetchBusLocations();

    // Start polling for bus locations with faster interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      console.log('⏰ Auto-refresh triggered (15s interval)');
      fetchBusLocations();
    }, 15000); // Poll every 15 seconds for live tracking (reduced from 50s)

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

    // Start polling for occupancy data every 2 minutes (to check for new passenger reports)
    if (occupancyPollingRef.current) {
      clearInterval(occupancyPollingRef.current);
    }
    
    occupancyPollingRef.current = setInterval(() => {
      fetchOccupancyData();
    }, 120000); // Poll every 2 minutes (120,000 ms) - more frequent for real-time updates

    return () => {
      if (occupancyPollingRef.current) {
        clearInterval(occupancyPollingRef.current);
      }
    };
  }, [busLocations.length]); // Re-run when number of buses changes

  // Enhanced: Filter buses with more forgiving criteria
  const filteredBuses = useMemo(() => {
    const enhancedBuses = enhanceBusesWithOccupancyData(busLocations);
    console.log(`🔍 Filtering ${enhancedBuses.length} buses with occupancy data...`);
    
    let filtered = enhancedBuses.filter(bus => {
      // Filter out buses with stale data (older than 1 minute)
      const minutesOld = getMinutesSince(bus.lastUpdated);
      if (isTimestampStale(bus.lastUpdated, 1)) {
        console.log(`⏰ Filtering out bus ${bus.busId} (Route ${bus.routeNumber}) - data is too stale (${minutesOld} minutes old)`);
        return false;
      }
      
      // Route filter (if selected)
      if (selectedRoute && bus.routeNumber !== selectedRoute) {
        console.log(`🛣️ Filtering out bus ${bus.busId} - route ${bus.routeNumber} doesn't match selected route ${selectedRoute}`);
        return false;
      }
      
      // Search filter (if entered)
      if (searchQuery) {
        const matches = bus.routeNumber && bus.routeNumber.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matches) {
          console.log(`🔍 Filtering out bus ${bus.busId} - route ${bus.routeNumber} doesn't match search "${searchQuery}"`);
          return false;
        }
      }
      
      // REMOVED: No longer filter by status - show all buses with visual indicators
      // This allows inactive/break/offline buses to be shown if data is recent
      
      console.log(`✅ Keeping bus ${bus.busId} (Route ${bus.routeNumber}) - ${minutesOld}m old, status: ${bus.status}`);
      return true;
    });

    // Sort by distance (closest first) and limit to 10 buses to prevent performance issues
    filtered = filtered
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 10);

    console.log(`📊 Final result: ${filtered.length} buses after filtering from ${enhancedBuses.length} total (limited to 10 closest buses)`);
    return filtered;
  }, [busLocations, selectedRoute, searchQuery, enhanceBusesWithOccupancyData]);

  // Update map region when filtered buses change (only in normal view)
  // Use a ref to track the last adjusted region to prevent infinite loops
  const lastAdjustedRegionRef = useRef<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  
  useEffect(() => {
    // Don't auto-adjust if user is manually interacting with the map
    if (isUserInteractingRef.current) {
      console.log('⏸️ Skipping auto-adjust - user is interacting with map');
      return;
    }

    if (filteredBuses.length > 0 && userLocation && !isFullScreenMap) {
      // Clear any pending auto-adjust
      if (autoAdjustTimeoutRef.current) {
        clearTimeout(autoAdjustTimeoutRef.current);
      }

      // Debounce the auto-adjust to prevent rapid changes
      autoAdjustTimeoutRef.current = setTimeout(() => {
        // Only adjust region if we have buses and user location, and not in full screen
        const latitudes = [userLocation.latitude, ...filteredBuses.map(bus => bus.latitude)];
        const longitudes = [userLocation.longitude, ...filteredBuses.map(bus => bus.longitude)];
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);

        // Calculate new region
        const newRegion = {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.05),
          longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.05),
        };

        // Only update if the region has actually changed significantly compared to last adjustment
        const lastRegion = lastAdjustedRegionRef.current;
        const regionChanged = !lastRegion || 
                             Math.abs(newRegion.latitude - lastRegion.latitude) > 0.005 ||
                             Math.abs(newRegion.longitude - lastRegion.longitude) > 0.005 ||
                             Math.abs(newRegion.latitudeDelta - lastRegion.latitudeDelta) > 0.02 ||
                             Math.abs(newRegion.longitudeDelta - lastRegion.longitudeDelta) > 0.02;

        if (regionChanged) {
          console.log('🔄 Adjusting map region to fit buses and user location');
          lastAdjustedRegionRef.current = newRegion;
          mapRef.current?.animateToRegion(newRegion, 1000);
        }
      }, 1000); // Wait 1 second before adjusting
    }

    return () => {
      if (autoAdjustTimeoutRef.current) {
        clearTimeout(autoAdjustTimeoutRef.current);
      }
    };
  }, [filteredBuses.length, isFullScreenMap]); // Only depend on length and fullscreen mode

  const selectRoute = useCallback((routeNumber: string) => {
    setSelectedRoute(prev => prev === routeNumber ? null : routeNumber);
  }, []);

  const focusOnBus = useCallback((bus: BusLocation) => {
    if (isMountedRef.current) {
      setSelectedBus(bus);
      const region = {
        latitude: bus.latitude,
        longitude: bus.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setMapRegion(region);
      mapRef.current?.animateToRegion(region, 1000);
    }
  }, []);

  const showAllBuses = useCallback(() => {
    if (filteredBuses.length > 0 && userLocation && isMountedRef.current) {
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
    setIsFullScreenMap(prev => {
      const newValue = !prev;
      // When entering full screen, don't auto-adjust map region
      // When exiting full screen, the useEffect will handle region adjustment
      return newValue;
    });
  }, []);

  // Calculate dynamic distance from passenger to bus
  const calculateDistanceFromUser = (busLatitude: number, busLongitude: number): number => {
    if (!userLocation) return 0;
    
    const R = 6371e3; // Earth's radius in meters
    const φ1 = userLocation.latitude * Math.PI / 180;
    const φ2 = busLatitude * Math.PI / 180;
    const Δφ = (busLatitude - userLocation.latitude) * Math.PI / 180;
    const Δλ = (busLongitude - userLocation.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

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



  const getTrendInfo = (trend: string) => {
    switch (trend) {
      case 'improving': return { icon: '📈', label: 'Getting less crowded', color: '#28a745' };
      case 'worsening': return { icon: '📉', label: 'Getting more crowded', color: '#dc3545' };
      case 'stable': return { icon: '➡️', label: 'Stable condition', color: '#17a2b8' };
      default: return { icon: '❓', label: 'Unknown trend', color: '#6c757d' };
    }
  };

  const getOccupancyDisplayText = (bus: BusLocation) => {
    // Only use passenger report data if available and has at least one report
    if (bus.dynamicOccupancy && bus.dynamicOccupancy.reportCount > 0) {
      // Check if last report is older than 5 minutes - show "No Recent Updates"
      if (bus.dynamicOccupancy.level === 'no_recent_updates' || 
          (bus.dynamicOccupancy.minutesSinceLastReport !== null && bus.dynamicOccupancy.minutesSinceLastReport > 5)) {
        return {
          text: 'No Recent Updates',
          color: '#6c757d',
          confidence: 0,
          freshness: `${bus.dynamicOccupancy.reportCount} report${bus.dynamicOccupancy.reportCount !== 1 ? 's' : ''} (Last ${bus.dynamicOccupancy.minutesSinceLastReport}m ago)`,
          source: 'passenger_reports',
          overallCondition: {
            label: 'No Recent Updates',
            color: '#6c757d',
            icon: '⏱️'
          },
          trendInfo: getTrendInfo('stable'),
          reliabilityScore: 0,
          reportCount: bus.dynamicOccupancy.reportCount
        };
      }
      
      // Simple occupancy level mapping (for reports within last 5 minutes)
      let simpleLevel = '';
      let levelColor = '';
      let icon = '❓';
      
      switch (bus.dynamicOccupancy.level) {
        case 'not_crowded':
          simpleLevel = 'Not Crowded';
          levelColor = '#28a745';
          icon = '🟢';
          break;
        case 'not_too_crowded':
          simpleLevel = 'Moderate';
          levelColor = '#ffc107';
          icon = '🟡';
          break;
        case 'crowded':
          simpleLevel = 'Crowded';
          levelColor = '#fd7e14';
          icon = '🟠';
          break;
        case 'very_crowded':
          simpleLevel = 'Very Crowded';
          levelColor = '#dc3545';
          icon = '🔴';
          break;
        case 'unknown':
          // Even if level is unknown, show that we have reports
          simpleLevel = `${bus.dynamicOccupancy.reportCount} Report${bus.dynamicOccupancy.reportCount !== 1 ? 's' : ''}`;
          levelColor = '#17a2b8'; // Info color
          icon = '📊';
          break;
        default:
          simpleLevel = `${bus.dynamicOccupancy.reportCount} Report${bus.dynamicOccupancy.reportCount !== 1 ? 's' : ''}`;
          levelColor = '#6c757d';
          icon = '📊';
      }
      
      return {
        text: simpleLevel,
        color: levelColor,
        confidence: bus.dynamicOccupancy.avgConfidence,
        freshness: `${bus.dynamicOccupancy.reportCount} report${bus.dynamicOccupancy.reportCount !== 1 ? 's' : ''} (${bus.dynamicOccupancy.avgConfidence}% confidence)`,
        source: 'passenger_reports',
        overallCondition: {
          label: simpleLevel,
          color: levelColor,
          icon: icon
        },
        trendInfo: getTrendInfo(bus.dynamicOccupancy.trendDirection),
        reliabilityScore: bus.dynamicOccupancy.reliabilityScore,
        reportCount: bus.dynamicOccupancy.reportCount
      };
    }
    
    // If no passenger reports available, return null to indicate no data
    return null;
  };

  const renderRouteItem = ({ item }: { item: BusRoute }) => (
    <TouchableOpacity
      style={[
        styles.routeCard,
        selectedRoute === item.routeNumber && styles.routeCardSelected
      ]}
      onPress={() => selectRoute(item.routeNumber)}
    >
      <Text style={[styles.routeNumber, selectedRoute === item.routeNumber && styles.routeNumberSelected]}>
        {item.routeNumber}
      </Text>
      <Text style={[styles.routeName, selectedRoute === item.routeNumber && styles.routeTextSelected]} numberOfLines={1}>
        {item.routeName}
      </Text>
    </TouchableOpacity>
  );

  const renderBusItem = ({ item }: { item: BusLocation }) => {
    const timeSinceUpdate = getMinutesSince(item.lastUpdated); // Using Sri Lanka time
    const occupancyDisplay = getOccupancyDisplayText(item);
    const isStaleData = timeSinceUpdate > 2; // Mark as stale if older than 2 minutes
    
    // Calculate real-time distance from passenger location
    const dynamicDistance = calculateDistanceFromUser(item.latitude, item.longitude);
    const distanceText = dynamicDistance < 1000 
      ? `${Math.round(dynamicDistance)}m` 
      : `${(dynamicDistance / 1000).toFixed(1)}km`;

    return (
      <TouchableOpacity
        style={styles.busCardNew}
        onPress={() => focusOnBus(item)}
        onLongPress={() => {
          setSelectedBus(item);
          setShowBusDetails(true);
        }}
      >
        {/* Header Section - Bus Info and Route */}
        <View style={styles.busCardHeader}>
          <View style={styles.busCardLeft}>
            <Text style={styles.busCardNumber}>{item.registrationNumber}</Text>
            <View style={styles.busCardRouteContainer}>
              <Ionicons name="navigate-circle-outline" size={14} color={AppColors.primary} />
              <Text style={styles.busCardRoute}>Route {item.routeNumber || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.busCardRight}>
            <View style={styles.busCardDistance}>
              <Ionicons name="location-outline" size={16} color={AppColors.primary} />
              <Text style={styles.busCardDistanceText}>{distanceText}</Text>
            </View>
          </View>
        </View>

        {/* Occupancy Section - Prominent Display */}
        <View style={styles.busCardOccupancySection}>
          {occupancyDisplay && item.dynamicOccupancy ? (
            <>
              <View style={[
                styles.busCardOccupancyBadge,
                { backgroundColor: occupancyDisplay.color + '15', borderColor: occupancyDisplay.color }
              ]}>
                <Text style={styles.busCardOccupancyIcon}>
                  {occupancyDisplay.overallCondition?.icon || '📊'}
                </Text>
                <View style={styles.busCardOccupancyTextContainer}>
                  <Text style={[styles.busCardOccupancyLevel, { color: occupancyDisplay.color }]}>
                    {occupancyDisplay.overallCondition?.label || occupancyDisplay.text}
                  </Text>
                  <Text style={styles.busCardOccupancySubtext}>
                    {item.dynamicOccupancy.reportCount} report{item.dynamicOccupancy.reportCount !== 1 ? 's' : ''} • {item.dynamicOccupancy.avgConfidence}% confidence
                  </Text>
                </View>
              </View>
              
              {/* Last Update Time */}
              <Text style={[
                styles.busCardOccupancyTime,
                (item.dynamicOccupancy.minutesSinceLastReport !== null && item.dynamicOccupancy.minutesSinceLastReport > 5) && styles.busCardOccupancyTimeStale
              ]}>
                <Ionicons name="time-outline" size={12} color={AppColors.textSecondary} />
                {' '}Updated {item.dynamicOccupancy.minutesSinceLastReport}m ago
              </Text>
            </>
          ) : (
            <View style={styles.busCardNoOccupancy}>
              <Ionicons name="information-circle-outline" size={16} color={AppColors.textSecondary} />
              <Text style={styles.busCardNoOccupancyText}>No passenger reports yet</Text>
            </View>
          )}
        </View>

        {/* Status Footer */}
        <View style={styles.busCardFooter}>
          <View style={styles.busCardStatusContainer}>
            <View style={[styles.busCardStatusDot, { backgroundColor: getBusStatusColor(item.status) }]} />
            <Text style={styles.busCardStatusText}>{item.status}</Text>
          </View>
          {isStaleData && (
            <Text style={styles.busCardStaleWarning}>
              <Ionicons name="warning-outline" size={12} color={AppColors.warning} />
              {' '}May be offline
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

  // Handle route parameters from navigation (e.g., from BusRouteResultsScreen)
  useEffect(() => {
    if (route?.params) {
      const { selectedRoute: routeFromParams, fromSearch, searchFrom, searchTo } = route.params;
      
      if (routeFromParams) {
        console.log(`🎯 Setting selected route from navigation: ${routeFromParams}`);
        if (isMountedRef.current) {
          setSelectedRoute(routeFromParams);
        }
      }
      
      if (fromSearch) {
        console.log(`🔍 Coming from search: ${searchFrom} → ${searchTo}`);
        // You can use searchFrom and searchTo if needed for additional context
      }
    }
  }, [route?.params]);

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
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          region={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onRegionChangeComplete={(region) => {
            if (isMountedRef.current) {
              setMapRegion(region);
            }
            // Mark that user is interacting, then clear after 3 seconds
            isUserInteractingRef.current = true;
            setTimeout(() => {
              isUserInteractingRef.current = false;
            }, 3000);
          }}
          onPanDrag={() => {
            isUserInteractingRef.current = true;
          }}
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
              description={(() => {
                const display = getOccupancyDisplayText(bus);
                if (display?.overallCondition) {
                  return `${display.overallCondition.icon} ${display.overallCondition.label}`;
                }
                return 'No occupancy data available';
              })()}
              onPress={() => setSelectedBus(bus)}
            >
              <View style={[
                styles.busMarker,
                { 
                  backgroundColor: (() => {
                    const display = getOccupancyDisplayText(bus);
                    // Use occupancy condition color if available, otherwise use bus status color
                    if (display?.overallCondition && display.source === 'passenger_reports') {
                      return display.overallCondition.color;
                    }
                    return getBusStatusColor(bus.status);
                  })()
                }
              ]}>
                <Text style={styles.busMarkerIcon}>
                  {(() => {
                    const display = getOccupancyDisplayText(bus);
                    return display?.overallCondition?.icon || '🚌';
                  })()}
                </Text>
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
          {!isFullScreenMap ? (
            <>
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
            </>
          ) : (
            <>
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
                onPress={() => getUserLocation()}
              >
                <Ionicons name="navigate" size={20} color={AppColors.primary} />
                <Text style={styles.mapControlText}>My Location</Text>
              </TouchableOpacity>
            </>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.lastRefreshText}>
                    {isFetchingLive ? '🔄 Updating...' : `Updated ${formatTimeSince(lastRefreshTime)}`}
                  </Text>
                  {!isFetchingLive && error && error.includes('cached') && (
                    <Text style={[styles.lastRefreshText, { color: AppColors.warning }]}>
                      (Cached)
                    </Text>
                  )}
                </View>
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

      {/* Full-screen map - Shrink button */}
      {isFullScreenMap && (
        <TouchableOpacity 
          style={styles.fullScreenShrinkButton}
          onPress={toggleFullScreenMap}
        >
          <Ionicons name="contract-outline" size={24} color="white" />
        </TouchableOpacity>
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
                    <Text style={styles.detailLabel}>Overall Condition:</Text>
                    {(() => {
                      const occupancyDisplay = getOccupancyDisplayText(selectedBus);
                      if (occupancyDisplay) {
                        return (
                          <Text style={[styles.detailValue, { color: occupancyDisplay.color }]}>
                            {occupancyDisplay.overallCondition?.label || occupancyDisplay.text}
                          </Text>
                        );
                      } else {
                        return (
                          <Text style={[styles.detailValue, { color: AppColors.textSecondary }]}>
                            No data available
                          </Text>
                        );
                      }
                    })()}
                  </View>
                  {selectedBus.dynamicOccupancy && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Data Source:</Text>
                        <Text style={styles.detailValue}>
                          Passenger feedback
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Data Quality:</Text>
                        <Text style={styles.detailValue}>
                          {busOccupancyAPI.getDataFreshnessInfo(selectedBus.dynamicOccupancy.dataFreshness).label}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Trend:</Text>
                        <Text style={[styles.detailValue, { 
                          color: getTrendInfo(selectedBus.dynamicOccupancy.trendDirection).color 
                        }]}>
                          {getTrendInfo(selectedBus.dynamicOccupancy.trendDirection).icon} {getTrendInfo(selectedBus.dynamicOccupancy.trendDirection).label}
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
                      {(() => {
                        const distance = calculateDistanceFromUser(selectedBus.latitude, selectedBus.longitude);
                        return distance < 1000 
                          ? `${Math.round(distance)}m away` 
                          : `${(distance / 1000).toFixed(1)}km away`;
                      })()}
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
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  routeFilterContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 6,
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
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 3,
    minWidth: 90,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 2,
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
    fontSize: 10,
    color: AppColors.textSecondary,
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
  busMarkerIcon: {
    fontSize: 14,
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
  busRightInfo: {
    alignItems: 'flex-end',
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
  occupancyCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  occupancyIconSmall: {
    fontSize: 16,
    marginRight: 4,
  },
  occupancyTextCompact: {
    fontSize: 11,
    fontWeight: '600',
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
  fullScreenShrinkButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 86, 179, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fullScreenShrinkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  // Enhanced Occupancy Styles
  occupancyMainRow: {
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  occupancyIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  occupancyInfo: {
    flex: 1,
  },
  occupancyMainText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  occupancyDescription: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontStyle: 'italic',
  },
  trendIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  trendInfo: {
    flex: 1,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reliabilityText: {
    fontSize: 10,
    color: AppColors.textSecondary,
    marginTop: 1,
  },
  selectedBusReliability: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  occupancySummary: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 86, 179, 0.1)',
    borderRadius: 4,
  },
  occupancySummaryText: {
    fontSize: 11,
    color: AppColors.primary,
    fontWeight: '500',
  },
  // New Bus Card Styles - Clean and Modern
  busCardNew: {
    backgroundColor: AppColors.card,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  busCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border + '40',
  },
  busCardLeft: {
    flex: 1,
  },
  busCardNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 3,
  },
  busCardRouteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  busCardRoute: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: '600',
  },
  busCardRight: {
    alignItems: 'flex-end',
  },
  busCardDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  busCardDistanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primary,
  },
  busCardOccupancySection: {
    marginBottom: 8,
  },
  busCardOccupancyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  busCardOccupancyIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  busCardOccupancyTextContainer: {
    flex: 1,
  },
  busCardOccupancyLevel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  busCardOccupancySubtext: {
    fontSize: 10,
    color: AppColors.textSecondary,
  },
  busCardOccupancyTime: {
    fontSize: 9,
    color: AppColors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  busCardOccupancyTimeStale: {
    color: AppColors.warning,
    fontWeight: '600',
  },
  busCardNoOccupancy: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: AppColors.background,
    borderRadius: 6,
    gap: 5,
  },
  busCardNoOccupancyText: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontStyle: 'italic',
  },
  busCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: AppColors.border + '40',
  },
  busCardStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  busCardStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  busCardStatusText: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  busCardStaleWarning: {
    fontSize: 10,
    color: AppColors.warning,
    fontWeight: '600',
  },
});