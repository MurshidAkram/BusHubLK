import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

import { API_BASE_URL } from '../config/api';
import { storageAPI } from '../services/api';
import { busLiveTrackingAPI } from '../services/busLiveTrackingAPI';
import { getMinutesSince } from '../utils/timeUtils';

// Enhanced App Color Palette (consistent with HomeScreen)
const AppColors = {
  background: "#F8FAFF",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryDark: "#003d82",
  primaryLight: "#0076e3",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  red: "#EF4444",
  yellow: "#F59E0B",
  green: "#10B981",
  orange: "#F97316",
  purple: "#8B5CF6",
};

// Enhanced detection constants
const MOVEMENT_HISTORY_SIZE = 3; // Reduced for faster detection
const SYNC_CORRELATION_THRESHOLD = 0.3; // Lowered threshold for easier detection
const SPEED_TOLERANCE = 10; // Increased tolerance
const DIRECTION_TOLERANCE = 30; // Increased tolerance
const HIGH_CONFIDENCE_THRESHOLD = 60; // Lowered for easier detection
const MEDIUM_CONFIDENCE_THRESHOLD = 30; // Lowered for easier detection
const LOCATION_UPDATE_INTERVAL = 3000; // Faster updates
const BUS_DATA_REFRESH_INTERVAL = 5000; // Faster refresh

// Type Definitions
type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

interface Bus {
  id: string;
  bus_id: number;
  registration_number: string;
  route_number: string;
  route_name: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  last_update: string;
  tracking_status: string;
  passenger_count?: number;
  occupancy_level?: string;
  minutes_since_update: number;
  // Legacy properties for compatibility
  number?: string;
  route?: string;
  direction?: string;
  estimatedSpeed?: number;
  occupancy?: string;
  updatedAt?: string;
}

interface BusStatuses {
  [key: string]: Bus;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp?: number;
  speed?: number;
  direction?: number;
}

interface MovementPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number;
  direction: number;
}

interface DetectionResult {
  bus: Bus | null;
  confidence: number;
  reason: string;
}

interface OccupancyRecord {
  occupancy_id: number;
  bus_id: string;
  passenger_id?: string;
  occupancy_level: string;
  latitude: number;
  longitude: number;
  updated_at: string;
  confidence: number;
  registration_number: string;
}

const OCCUPANCY_LEVELS = [
  { label: 'Not Crowded', value: 'not_crowded', color: '#198754', description: 'Plenty of seats available' },
  { label: 'Not Too Crowded', value: 'not_too_crowded', color: '#ffc107', description: 'Some seats occupied' },
  { label: 'Crowded', value: 'crowded', color: '#ff8c00', description: 'Standing room only' },
  { label: 'Very Crowded', value: 'very_crowded', color: '#dc3545', description: 'Bus is full' },
];

// Fetch nearby buses using the same logic as BusTrackingScreen
const fetchNearbyBuses = async (latitude: number, longitude: number, radiusKm: number = 5): Promise<Bus[]> => {
  try {
    console.log(`🔍 Fetching nearby buses for location: ${latitude}, ${longitude} within ${radiusKm}km`);
    const data = await busLiveTrackingAPI.getNearbyBuses(latitude, longitude, radiusKm);
    console.log('📡 Raw API response:', data);
    
    // BusTrackingScreen shows this works, so let's use the same approach
    if (data && Array.isArray(data)) {
      console.log(`✅ API returned ${data.length} buses`);
      const mappedBuses = data.map((bus: any) => {
        // Calculate actual minutes since update using time utils (like BusTrackingScreen)
        const actualMinutesSinceUpdate = getMinutesSince(bus.updated_at || bus.last_update);
        
        return {
          id: `bus_${bus.bus_id}`,
          bus_id: bus.bus_id,
          registration_number: bus.registration_number,
          route_number: bus.route_number,
          route_name: bus.route_name || `Route ${bus.route_number}`, // Fallback if route_name is missing
          latitude: parseFloat(bus.latitude),
          longitude: parseFloat(bus.longitude),
          speed: bus.speed || 0,
          heading: bus.heading,
          last_update: bus.last_update || bus.updated_at,
          tracking_status: bus.tracking_status,
          passenger_count: bus.passenger_count || 0,
          occupancy_level: bus.occupancy_level || 'unknown',
          minutes_since_update: actualMinutesSinceUpdate, // Use calculated value instead of API field
          // Legacy compatibility
          number: bus.route_number,
          route: bus.route_name || `Route ${bus.route_number}`,
          direction: bus.heading ? (bus.heading > 180 ? 'Down' : 'Up') : 'Unknown',
          estimatedSpeed: bus.speed || 0,
          occupancy: bus.occupancy_level || 'unknown',
          updatedAt: new Date(bus.last_update || bus.updated_at).toLocaleTimeString(),
        };
      });
      
      // Filter out buses that haven't updated in more than 2 minutes
      const activeBuses = mappedBuses.filter(bus => {
        const isActive = bus.tracking_status === 'active' && bus.minutes_since_update <= 2;
        if (!isActive) {
          console.log(`🚫 Filtering out bus ${bus.registration_number}: status=${bus.tracking_status}, minutes_since_update=${bus.minutes_since_update}`);
        }
        return isActive;
      });
      
      console.log(`✅ Successfully mapped ${mappedBuses.length} buses, ${activeBuses.length} are active (≤2 min):`, activeBuses);
      return activeBuses;
    } else {
      console.log('⚠️ No nearby buses found in response or response is not an array');
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching nearby buses:', error);
    Alert.alert(
      'Connection Error',
      'Unable to fetch nearby bus data. Please ensure:\n• You have internet connection\n• Backend server is running\n• Driver apps are actively tracking buses',
      [{ text: 'OK' }]
    );
    return [];
  }
};

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

const calculateSpeed = (point1: MovementPoint | UserLocation, point2: MovementPoint | UserLocation): number => {
  if (!point1 || !point2 || !point1.timestamp || !point2.timestamp) return 0;
  
  const distance = calculateDistance(
    point1.latitude, point1.longitude,
    point2.latitude, point2.longitude
  );
  const timeDiff = (point2.timestamp - point1.timestamp) / 1000;
  if (timeDiff === 0) return 0;
  return (distance / timeDiff) * 3.6;
};

const calculateDirection = (point1: MovementPoint | UserLocation | null, point2: MovementPoint | UserLocation): number => {
  if (!point1 || !point2) return 0;
  
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const deltaLng = (point2.longitude - point1.longitude) * Math.PI / 180;
  
  const x = Math.sin(deltaLng) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  
  const bearing = Math.atan2(x, y);
  return (bearing * 180 / Math.PI + 360) % 360;
};


const useEnhancedBusDetection = (userLocation: UserLocation | null, buses: Bus[]) => {
  const [movementHistory, setMovementHistory] = useState<MovementPoint[]>([]);
  const [busMovementHistory, setBusMovementHistory] = useState<{[key: string]: MovementPoint[]}>({});
  const [detectedBus, setDetectedBus] = useState<Bus | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [detectionReason, setDetectionReason] = useState('');

  useEffect(() => {
    if (userLocation) {
      const currentTime = Date.now();
      const prevPoint = movementHistory[movementHistory.length - 1];
      
      const newPoint: MovementPoint = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        timestamp: currentTime,
        speed: calculateSpeed(prevPoint, { ...userLocation, timestamp: currentTime }),
        direction: calculateDirection(prevPoint, userLocation)
      };
      
      setMovementHistory(prev => {
        const newHistory = [...prev, newPoint];
        return newHistory.slice(-MOVEMENT_HISTORY_SIZE);
      });
    }
  }, [userLocation]);

  useEffect(() => {
    buses.forEach(bus => {
      setBusMovementHistory(prev => {
        const currentTime = Date.now();
        const prevPoints = prev[bus.id] || [];
        const prevPoint = prevPoints[prevPoints.length - 1];
        
        const newPoint: MovementPoint = {
          latitude: bus.latitude,
          longitude: bus.longitude,
          timestamp: currentTime,
          speed: bus.speed || bus.estimatedSpeed || 0,
          direction: bus.heading || calculateDirection(prevPoint, { 
            latitude: bus.latitude, 
            longitude: bus.longitude, 
            timestamp: currentTime 
          })
        };
        
        return {
          ...prev,
          [bus.id]: [...prevPoints, newPoint].slice(-MOVEMENT_HISTORY_SIZE)
        };
      });
    });
  }, [buses]);

  const calculateMovementCorrelation = (userHistory: MovementPoint[], busHistory: MovementPoint[]): number => {
    if (userHistory.length < 3 || busHistory.length < 3) return 0;
    
    let correlationScore = 0;
    let totalChecks = 0;
    
    const minLength = Math.min(userHistory.length, busHistory.length);
    const recentPoints = Math.min(5, minLength - 1);
    
    for (let i = minLength - recentPoints; i < minLength - 1; i++) {
      const userPoint = userHistory[i];
      const busPoint = busHistory[i];
      
      if (userPoint && busPoint) {
        const distance = calculateDistance(
          userPoint.latitude, userPoint.longitude,
          busPoint.latitude, busPoint.longitude
        );
        
        const speedDiff = Math.abs(userPoint.speed - busPoint.speed);
        const directionDiff = Math.min(
          Math.abs(userPoint.direction - busPoint.direction),
          360 - Math.abs(userPoint.direction - busPoint.direction)
        );
        
        let pointCorrelation = 0;
        
        if (distance < 30) pointCorrelation += 0.4;
        else if (distance < 50) pointCorrelation += 0.2;
        else if (distance < 100) pointCorrelation += 0.1;
        
        if (speedDiff < SPEED_TOLERANCE) pointCorrelation += 0.3;
        else if (speedDiff < SPEED_TOLERANCE * 2) pointCorrelation += 0.15;
        
        if (directionDiff < DIRECTION_TOLERANCE) pointCorrelation += 0.3;
        else if (directionDiff < DIRECTION_TOLERANCE * 2) pointCorrelation += 0.15;
        
        correlationScore += pointCorrelation;
        totalChecks++;
      }
    }
    
    return totalChecks > 0 ? correlationScore / totalChecks : 0;
  };

  const detectBusFromSync = (): DetectionResult => {
    if (!userLocation) {
      return { bus: null, confidence: 0, reason: 'No user location available' };
    }
    
    let bestMatch: Bus | null = null;
    let bestScore = 0;
    let bestReason = '';
    
    buses.forEach(bus => {
      // Skip buses that are not active or haven't updated in more than 2 minutes
      if (bus.tracking_status !== 'active' || bus.minutes_since_update > 2) {
        console.log(`🚫 Skipping bus ${bus.registration_number} for detection: status=${bus.tracking_status}, minutes_since_update=${bus.minutes_since_update}`);
        return;
      }
      
      const currentDistance = calculateDistance(
        userLocation.latitude, userLocation.longitude,
        bus.latitude, bus.longitude
      );
      
      console.log(`🔍 Checking bus ${bus.registration_number}: distance=${currentDistance.toFixed(0)}m, status=${bus.tracking_status}`);
      
      let finalScore = 0;
      
      // Primary detection: proximity-based (this works even without movement data)
      if (currentDistance < 50) {
        finalScore += 70; // Very close - high confidence
        console.log(`✅ Bus ${bus.registration_number} is very close (${currentDistance.toFixed(0)}m) - adding 70 points`);
      } else if (currentDistance < 100) {
        finalScore += 50; // Close - medium confidence
        console.log(`✅ Bus ${bus.registration_number} is close (${currentDistance.toFixed(0)}m) - adding 50 points`);
      } else if (currentDistance < 200) {
        finalScore += 30; // Nearby - lower confidence
        console.log(`✅ Bus ${bus.registration_number} is nearby (${currentDistance.toFixed(0)}m) - adding 30 points`);
      }
      
      // Bonus for fresh data
      if (bus.minutes_since_update < 1) {
        finalScore += 20; // Very fresh data
        console.log(`✅ Bus ${bus.registration_number} has very fresh data - adding 20 points`);
      } else if (bus.minutes_since_update < 2) {
        finalScore += 10; // Fresh data
        console.log(`✅ Bus ${bus.registration_number} has fresh data - adding 10 points`);
      }
      
      // Movement correlation (only if we have enough movement data)
      const busHistory = busMovementHistory[bus.id] || [];
      if (movementHistory.length >= 3 && busHistory.length >= 3) {
        const correlation = calculateMovementCorrelation(movementHistory, busHistory);
        const correlationBonus = correlation * 30; // Up to 30 bonus points
        finalScore += correlationBonus;
        console.log(`✅ Bus ${bus.registration_number} movement correlation: ${(correlation * 100).toFixed(0)}% - adding ${correlationBonus.toFixed(0)} points`);
      }
      
      console.log(`📊 Bus ${bus.registration_number} final score: ${finalScore.toFixed(0)} (threshold: ${SYNC_CORRELATION_THRESHOLD * 100})`);
      
      if (finalScore > bestScore && finalScore > SYNC_CORRELATION_THRESHOLD * 100) {
        bestMatch = bus;
        bestScore = finalScore;
        bestReason = `Bus detection successful`;
        console.log(`🎯 New best match: ${bus.registration_number} with score ${finalScore.toFixed(0)}`);
      }
    });
    
    const result = { 
      bus: bestMatch, 
      confidence: Math.min(bestScore, 100), 
      reason: bestReason || 'No suitable bus match found' 
    };
    
    console.log(`🔍 Detection result:`, result);
    return result;
  };

  useEffect(() => {
    const detection = detectBusFromSync();
    
    if (detection.bus && detection.confidence > SYNC_CORRELATION_THRESHOLD * 100) {
      setDetectedBus(detection.bus);
      setConfidence(detection.confidence);
      setDetectionReason(detection.reason);
    } else {
      setDetectedBus(null);
      setConfidence(0);
      setDetectionReason('No reliable bus detection');
    }
  }, [movementHistory, busMovementHistory]);

  return {
    detectedBus,
    confidence: Math.round(confidence),
    detectionReason,
    movementHistory,
    busMovementHistory
  };
};

export default function BusOccupancyScreen() {
  const navigation = useNavigation();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [occupancy, setOccupancy] = useState('not_crowded');
  const [busStatuses, setBusStatuses] = useState<BusStatuses>({});
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [currentBus, setCurrentBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);
  const [showOccupancyModal, setShowOccupancyModal] = useState(false);
  const [lastOccupancyUpdate, setLastOccupancyUpdate] = useState<string | null>(null);
  const [allOccupancies, setAllOccupancies] = useState<OccupancyRecord[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Cache for bus route information to persist even when buses go offline
  const [busRouteCache, setBusRouteCache] = useState<{[busId: string]: {route_number: string, route_name: string}}>({});

  const movementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);
  const busHistoryRef = useRef<{[key: string]: MovementPoint[]}>({});

  const { detectedBus, confidence, detectionReason, movementHistory } = useEnhancedBusDetection(userLocation, buses);

  const performOccupancyUpdate = useCallback(async (level: string) => {
    if (!currentBus) return;
    
    if (lastOccupancyUpdate) {
      const timeSinceLastUpdate = Date.now() - new Date(lastOccupancyUpdate).getTime();
      if (timeSinceLastUpdate < 120000) {
        const remainingTime = Math.ceil((120000 - timeSinceLastUpdate) / 1000);
        Alert.alert('Too Soon', `Please wait ${remainingTime} seconds before updating again.`);
        return;
      }
    }
    
    setOccupancy(level);
    const updateTime = new Date().toLocaleTimeString();
    setBusStatuses(prev => ({
      ...prev,
      [currentBus.id]: {
        ...currentBus,
        occupancy: level,
        updatedAt: updateTime,
      },
    }));
    
    setLastOccupancyUpdate(new Date().toISOString());
    setShowOccupancyModal(false);
    
    const levelInfo = OCCUPANCY_LEVELS.find(l => l.value === level);
    Alert.alert(
      'Updated! ✅', 
      `Occupancy set to ${levelInfo?.label?.toUpperCase() || 'UNKNOWN'}`
    );

    setStatus('loading');
    setError(null);
    
    // Use the actual bus_id from the current bus data
    const numericBusId = currentBus.bus_id || parseInt(currentBus.id.replace('bus_', ''), 10);
    
    try {
      // Try to get user data for passenger ID
      let passengerId;
      try {
        const userData = await storageAPI.getUserData();
        passengerId = userData?.user_id || userData?.passenger_id;
        console.log('Found user data:', userData);
      } catch (userDataError) {
        console.log('Could not get user data:', userDataError);
      }
      
      // If no passenger ID found, we'll use a default value in the backend
      console.log(`Updating occupancy for bus ID: ${numericBusId}, passenger ID: ${passengerId || 'default'}`);
      
      console.log('Request URL:', `${API_BASE_URL}/api/bus-occupancy/${numericBusId}`);
      console.log('Request payload:', {
        busId: numericBusId,
        passengerId: passengerId,
        occupancyLevel: level,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        confidence: confidence,
      });
      
      const response = await fetch(`${API_BASE_URL}/api/bus-occupancy/${numericBusId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          busId: numericBusId,
          passengerId: passengerId,
          occupancyLevel: level,
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
          confidence: confidence,
        }),
      });
      
      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (!response.ok) {
        // Try to parse the error response
        let errorMessage = `Failed with status ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the JSON, use the raw text
          errorMessage = responseText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      setStatus('succeeded');
      await fetchAllOccupancies();
    } catch (err: any) {
      console.error('Error updating occupancy:', err);
      setError(err.message || 'Failed to update occupancy. Please check your network.');
      setStatus('failed');
      Alert.alert('Error', `Failed to update occupancy: ${err.message}`);
    }
  }, [currentBus, userLocation, confidence]);

  const fetchAllOccupancies = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      console.log('Fetching occupancies from:', `${API_BASE_URL}/api/bus-occupancy`);
      const response = await fetch(`${API_BASE_URL}/api/bus-occupancy`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Get the raw response text first
      const text = await response.text();
      console.log('Raw occupancies response:', text);
      
      if (!response.ok) {
        let errorMessage = `Failed with status ${response.status}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      // Parse the response as JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${text}`);
      }
      
      setAllOccupancies(data);
      
      // Update route cache with route information from occupancy data
      const routeUpdates: {[busId: string]: {route_number: string, route_name: string}} = {};
      if (Array.isArray(data)) {
        data.forEach((occupancy: any) => {
          if (occupancy.bus_id && occupancy.route_number) {
            routeUpdates[occupancy.bus_id.toString()] = {
              route_number: occupancy.route_number,
              route_name: occupancy.route_name || `Route ${occupancy.route_number}`
            };
          }
        });
        setBusRouteCache(prev => ({ ...prev, ...routeUpdates }));
        if (Object.keys(routeUpdates).length > 0) {
          console.log(`📝 Updated route cache with ${Object.keys(routeUpdates).length} routes from occupancy data`);
        }
      }
      
      setStatus('succeeded');
    } catch (err: any) {
      console.error('Error fetching occupancies:', err);
      setError(err.message || 'Failed to connect to the server. Please check your network.');
      setStatus('failed');
    }
  }, []);

  const isJson = (str: string) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    fetchAllOccupancies();
    const interval = setInterval(fetchAllOccupancies, 30000);
    return () => clearInterval(interval);
  }, [fetchAllOccupancies]);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationPermission(false);
          setLoading(false);
          Alert.alert('Permission Denied', 'Location permission is required to detect bus.');
          return;
        }

        setLocationPermission(true);

        // Get location with improved timeout and fallback
        let location;
        try {
          // First try with low accuracy (fastest)
          const locationPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
            timeInterval: 5000,
          });
          
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Location timeout after 15 seconds')), 15000)
          );
          
          location = await Promise.race([locationPromise, timeoutPromise]);
        } catch (locationError) {
          console.log('First location attempt failed, trying with balanced accuracy...');
          
          // Fallback: try with balanced accuracy
          try {
            const fallbackPromise = Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 10000,
            });
            
            const fallbackTimeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Fallback location timeout after 20 seconds')), 20000)
            );
            
            location = await Promise.race([fallbackPromise, fallbackTimeoutPromise]);
          } catch (fallbackError) {
            // If both fail, use last known location or show error
            console.error('All location attempts failed:', fallbackError);
            Alert.alert(
              'Location Error',
              'Unable to get your location. Please:\n• Enable GPS/Location Services\n• Allow location permission\n• Try moving to an open area\n• Restart the app',
              [{ text: 'OK' }]
            );
            setLoading(false);
            return;
          }
        }

        const userPos = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: Date.now(),
        };

        setUserLocation(userPos);

        // Fetch real nearby buses using passenger's GPS location
        const nearbyBuses = await fetchNearbyBuses(userPos.latitude, userPos.longitude, 5);
        setBuses(nearbyBuses);
        
        // Update route cache with current bus information
        const routeUpdates: {[busId: string]: {route_number: string, route_name: string}} = {};
        nearbyBuses.forEach(bus => {
          if (bus.route_number && (bus.route_name || bus.route)) {
            routeUpdates[bus.bus_id.toString()] = {
              route_number: bus.route_number,
              route_name: bus.route_name || bus.route || `Route ${bus.route_number}`
            };
          }
        });
        setBusRouteCache(prev => ({ ...prev, ...routeUpdates }));

        try {
          locationWatchRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Low, // Use low accuracy for continuous updates (faster)
              timeInterval: 3000, // Update every 3 seconds (more reliable than 2 seconds)
              distanceInterval: 5, // Trigger on 5 meter movement (less sensitive, more reliable)
            },
            (location) => {
              const newUserPos = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                timestamp: Date.now(),
              };
              setUserLocation(newUserPos);
            }
          );
        } catch (watchError) {
          console.error('Error setting up location watch:', watchError);
          // Continue without location watch if it fails
        }

        setLoading(false);
      } catch (error) {
        console.error('Error in location setup:', error);
        
        // Provide specific error messages based on the error type
        let errorMessage = 'Failed to get location.';
        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            errorMessage = 'Location request timed out. Please ensure GPS is enabled and you\'re in an open area.';
          } else if (error.message.includes('permission')) {
            errorMessage = 'Location permission denied. Please enable location services in your device settings.';
          } else {
            errorMessage = `Location error: ${error.message}`;
          }
        }
        
        Alert.alert('Location Error', errorMessage, [{ text: 'OK' }]);
        setLocationPermission(false);
        setLoading(false);
      }
    };

    requestLocationPermission();

    return () => {
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    console.log(`🎯 Detection effect triggered - detectedBus: ${detectedBus?.registration_number || 'none'}, confidence: ${confidence}, currentBus: ${currentBus?.registration_number || 'none'}`);
    
    if (detectedBus && confidence > HIGH_CONFIDENCE_THRESHOLD) {
      if (!currentBus || currentBus.id !== detectedBus.id) {
        console.log(`🚌 HIGH CONFIDENCE detection: Setting ${detectedBus.registration_number} as current bus`);
        setCurrentBus(detectedBus);
        Alert.alert(
          'Bus Detected! 🚌', 
          `You are in Bus ${detectedBus.registration_number || detectedBus.number} on route ${detectedBus.route_number || detectedBus.route}`
        );
      }
    } else if (detectedBus && confidence > MEDIUM_CONFIDENCE_THRESHOLD) {
      if (!currentBus || currentBus.id !== detectedBus.id) {
        console.log(`⚠️ MEDIUM CONFIDENCE detection: Setting ${detectedBus.registration_number} as current bus`);
        setCurrentBus(detectedBus);
        Alert.alert(
          'Bus Detected ⚠️', 
          `You might be in Bus ${detectedBus.registration_number || detectedBus.number} on route ${detectedBus.route_number || detectedBus.route}`
        );
      }
    } else if (currentBus && confidence < 20) {  // Lowered threshold to avoid false negatives
      console.log(`🚪 Low confidence (${confidence}%) - removing current bus`);
      setCurrentBus(null);
      Alert.alert('Bus Left', 'You have left the bus or detection confidence is low.');
    } else {
      console.log(`⏸️ No action taken - confidence: ${confidence}, thresholds: high=${HIGH_CONFIDENCE_THRESHOLD}, medium=${MEDIUM_CONFIDENCE_THRESHOLD}`);
    }
  }, [detectedBus, confidence, currentBus, detectionReason]);

  // Periodic bus data refresh using passenger's current location
  useEffect(() => {
    if (!userLocation) return;
    
    // Initial fetch when location becomes available
    const initialFetch = async () => {
      console.log('🎯 Initial bus fetch for new location...');
      const initialBuses = await fetchNearbyBuses(userLocation.latitude, userLocation.longitude, 5);
      setBuses(initialBuses);
    };
    
    initialFetch();
    
    const busRefreshInterval = setInterval(async () => {
      console.log('🔄 Refreshing nearby bus data...');
      const updatedBuses = await fetchNearbyBuses(userLocation.latitude, userLocation.longitude, 5);
      setBuses(updatedBuses);
      
      // Update route cache
      const routeUpdates: {[busId: string]: {route_number: string, route_name: string}} = {};
      updatedBuses.forEach(bus => {
        if (bus.route_number && (bus.route_name || bus.route)) {
          routeUpdates[bus.bus_id.toString()] = {
            route_number: bus.route_number,
            route_name: bus.route_name || bus.route || `Route ${bus.route_number}`
          };
        }
      });
      setBusRouteCache(prev => ({ ...prev, ...routeUpdates }));
    }, BUS_DATA_REFRESH_INTERVAL);

    return () => {
      if (busRefreshInterval) {
        clearInterval(busRefreshInterval);
      }
    };
  }, [userLocation]);

  useEffect(() => {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const timer = setTimeout(() => {
      setBusStatuses({});
      setLastOccupancyUpdate(null);
    }, msUntilMidnight);
    return () => clearTimeout(timer);
  }, []);

  const updateOccupancy = async (level: string) => {
    if (!currentBus) {
      Alert.alert('Error', 'You can only update occupancy when you are inside a bus.');
      return;
    }
    
    if (confidence < MEDIUM_CONFIDENCE_THRESHOLD) {
      Alert.alert(
        'Detection Warning', 
        `Bus detection may not be fully accurate. Are you sure you want to update occupancy?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Update', onPress: () => performOccupancyUpdate(level) }
        ]
      );
      return;
    }
    
    await performOccupancyUpdate(level);
  };



  if (loading) {
    return (
      <LinearGradient
        colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={styles.loadingText}>Getting your location...</Text>
            <Text style={styles.loadingSubText}>
              💡 Tip: Make sure GPS is enabled and you're not indoors for faster detection
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const renderContent = () => (
    <>
      {/* Nearby Buses Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>🚍 Nearby Buses ({buses.length})</Text>
            <Text style={styles.sectionSubtitle}>Active buses within 5km radius</Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={async () => {
              if (userLocation) {
                console.log('🔄 Manually refreshing nearby bus data...');
                const updatedBuses = await fetchNearbyBuses(userLocation.latitude, userLocation.longitude, 5);
                setBuses(updatedBuses);
                
                // Update route cache
                const routeUpdates: {[busId: string]: {route_number: string, route_name: string}} = {};
                updatedBuses.forEach(bus => {
                  if (bus.route_number && (bus.route_name || bus.route)) {
                    routeUpdates[bus.bus_id.toString()] = {
                      route_number: bus.route_number,
                      route_name: bus.route_name || `Route ${bus.route_number}`
                    };
                  }
                });
                setBusRouteCache(prev => ({ ...prev, ...routeUpdates }));
              }
            }}
          >
            <Text style={{ fontSize: 20, color: AppColors.primary }}>⟳</Text>
          </TouchableOpacity>
        </View>
        {buses.length > 0 ? (
          <>
            <Text style={styles.nearbyBusesNote}>
              Active buses within 5km radius (updated ≤2 min ago):
            </Text>
            <View style={styles.nearbyBusesContainer}>
              {buses.slice(0, 3).map((bus, index) => {
              const distance = calculateDistance(
                userLocation?.latitude || 6.9271,
                userLocation?.longitude || 79.8612,
                bus.latitude,
                bus.longitude
              );
              const isDetectedBus = currentBus && currentBus.id === bus.id;
              return (
                <TouchableOpacity 
                  key={bus.id} 
                  style={[
                    styles.nearbyBusItem,
                    isDetectedBus && styles.detectedBusItem
                  ]}
                  onPress={() => {
                    Alert.alert(
                      `Bus ${bus.registration_number}`,
                      `Route: ${bus.route_number} - ${bus.route_name}\n` +
                      `Distance: ${distance < 1000 ? `${distance.toFixed(0)}m` : `${(distance/1000).toFixed(1)}km`}\n` +
                      `Status: ${bus.tracking_status}\n` +
                      `Occupancy: ${bus.occupancy_level || 'Unknown'}\n` +
                      `Speed: ${bus.speed || 0} km/h\n` +
                      `Last Update: ${bus.minutes_since_update !== undefined 
                        ? `${Math.round(bus.minutes_since_update)} minutes ago` 
                        : 'Recently'}`,
                      [
                        { text: 'OK' }
                      ]
                    );
                  }}
                >
                  <View style={styles.nearbyBusInfo}>
                    <Text style={[
                      styles.nearbyBusNumber,
                      isDetectedBus && styles.detectedBusText
                    ]}>
                      {bus.registration_number} 
                      <Text style={[
                        styles.nearbyBusRoute,
                        isDetectedBus && styles.detectedBusText
                      ]}> • Route {bus.route_number}</Text>
                      {isDetectedBus && <Text style={styles.detectedBusIndicator}> ✅</Text>}
                    </Text>
                    <Text style={[
                      styles.nearbyBusDetails,
                      isDetectedBus && styles.detectedBusText
                    ]}>
                      📍 {distance < 1000 ? `${distance.toFixed(0)}m` : `${(distance/1000).toFixed(1)}km`} away • {bus.occupancy_level || 'Unknown occupancy'}
                    </Text>
                    <Text style={styles.nearbyBusTime}>
                      Recently updated
                    </Text>
                  </View>
                  <View style={[
                    styles.nearbyBusStatus,
                    { backgroundColor: bus.tracking_status === 'active' ? AppColors.green : AppColors.textSecondary }
                  ]}>
                    <Text style={styles.nearbyBusStatusText}>
                      {bus.tracking_status === 'active' ? 'Live' : 'Offline'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {buses.length > 3 && (
              <Text style={styles.moreNearbyBuses}>
                +{buses.length - 3} more buses in area
              </Text>
            )}
            </View>
          </>
        ) : (
          <Text style={styles.noBusText}>
            {userLocation ? 
              'Sorry, seems like you are not travelling on any buses right now. ' : 
              'Getting your location...'}
          </Text>
        )}
      </View>

      {/* Only show Bus Detection Status card when there are active buses */}
      {buses.length > 0 && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>🚌 Bus Detection Status</Text>
              <Text style={styles.sectionSubtitle}>Current bus occupancy reporting</Text>
            </View>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => {
                console.log('🔄 Manual detection debug info:');
                console.log('- User location:', userLocation);
                console.log('- Available buses:', buses.length);
                console.log('- Buses data:', buses.map(b => ({
                  id: b.registration_number,
                  distance: userLocation ? calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude).toFixed(0) + 'm' : 'unknown',
                  status: b.tracking_status,
                  minutes_old: b.minutes_since_update
                })));
                console.log('- Current detection:', { detectedBus: detectedBus?.registration_number, confidence });
                
                Alert.alert(
                  'Detection Info', 
                  `Buses nearby: ${buses.length}\nLocation: ${userLocation ? 'Available' : 'Getting location...'}\nCurrent bus: ${detectedBus ? detectedBus.registration_number  : 'None detected'}`
                );
              }}
            >
              <Text style={{ fontSize: 16, color: AppColors.primary }}>ℹ️</Text>
            </TouchableOpacity>
          </View>
        {currentBus ? (
          <View style={styles.currentBusCard}>
            <View style={styles.currentBusHeader}>
              <Text style={{ fontSize: 20, color: AppColors.primary }}>🚌</Text>
              <Text style={styles.currentBusTitle}>Bus {currentBus.registration_number || currentBus.number}</Text>
            </View>
            <Text style={styles.currentBusRoute}>
              {/* Only show route name if available, remove (unknown) */}
              {currentBus.route_name ? currentBus.route_name : ''}
            </Text>
            <Text style={styles.subValue}>
              Route: {currentBus.route_number} | Status: {currentBus.tracking_status || 'Active'}
            </Text>
            <Text style={styles.subValue}>
              Status: Currently tracking
            </Text>
            {/* Hide confidence, distance, speed, movement correlation, data age from UI */}
            {busStatuses[currentBus.id]?.occupancy && (
              <View style={styles.currentOccupancy}>
                <Text style={[
                  styles.currentOccupancyText,
                  { color: OCCUPANCY_LEVELS.find(l => l.value === busStatuses[currentBus.id].occupancy)?.color }
                ]}>
                  Current: {OCCUPANCY_LEVELS.find(l => l.value === busStatuses[currentBus.id].occupancy)?.label?.toUpperCase() || 'UNKNOWN'}
                </Text>
                <Text style={styles.currentOccupancyTime}>Updated at {busStatuses[currentBus.id].updatedAt}</Text>
              </View>
            )}
            <View style={styles.occupancyButtonsContainer}>
              {OCCUPANCY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[styles.occupancyButton, { backgroundColor: level.color }]}
                  onPress={() => updateOccupancy(level.value)}
                >
                  <Text style={styles.occupancyButtonText}>{level.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.updateButton]}
              onPress={() => setShowOccupancyModal(true)}
            >
              <Text style={styles.updateButtonText}>Update Occupancy</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.noBusText}>
              {buses.length === 0 
                ? 'No active buses found (within 2 minutes update time).'
                : 'No bus detected. Please wait while we track your location and sync with nearby active buses.'
              }
            </Text>
            <View style={styles.occupancyButtonsContainer}>
              {OCCUPANCY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[styles.occupancyButton, styles.disabledButton]}
                  onPress={() => Alert.alert('Error', 'You can only update occupancy when you are inside a bus.')}
                >
                  <Text style={styles.occupancyButtonText}>{level.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.updateButton, styles.disabledButton]}
              onPress={() => Alert.alert('Error', 'You can only update occupancy when you are inside a bus.')}
            >
              <Text style={styles.updateButtonText}>Update Occupancy</Text>
            </TouchableOpacity>
          </>
        )}
        </View>
      )}

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>📊 Recent Updates</Text>
            <Text style={styles.sectionSubtitle}>Last 5 occupancy reports</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchAllOccupancies}>
            <Text style={{ fontSize: 20, color: AppColors.primary }}>⟳</Text>
          </TouchableOpacity>
        </View>
        {status === 'loading' && (
          <ActivityIndicator size="large" color={AppColors.primary} />
        )}
        {status === 'failed' && (
          <Text style={styles.errorText}>Error: {error}</Text>
        )}
        {status === 'succeeded' && allOccupancies.length === 0 && (
          <Text style={styles.noBusText}>
            No occupancy updates available yet. Update a bus occupancy to see your report here.
          </Text>
        )}
        {status === 'succeeded' && allOccupancies.length > 0 && (
          <View style={styles.occupancyUpdatesContainer}>
            {allOccupancies.slice(0, 5).map((item, index) => {
              if (!item) return null;
              
              // Try to get bus info from current buses list first, then from occupancy data, then from cached route info
              const bus = buses.find(b => b.id === `bus_${item.bus_id}`);
              const cachedRoute = busRouteCache[item.bus_id.toString()];
              
              // Use route info from multiple sources with proper fallback priority:
              // 1. Current live bus data (most recent)
              // 2. Occupancy data route info (from backend route lookup)  
              // 3. Cached route info (from previous queries)
              // 4. Default to 'Unknown'
              const routeNumber = bus?.route_number || (item as any)?.route_number || cachedRoute?.route_number || 'Unknown';
              const routeName = bus?.route_name || bus?.route || (item as any)?.route_name || cachedRoute?.route_name || '';
              
              return (
                <View key={item.occupancy_id} style={styles.statusItem}>
                  <View style={styles.statusItemContent}>
                    <View style={styles.statusLeftContent}>
                      <View style={styles.statusHeader}>
                        <Text style={styles.statusRouteNumber}>
                          {routeNumber}
                        </Text>
                      </View>
                      <Text style={styles.statusBusNumber}>
                        {item.registration_number}
                      </Text>
                      {routeName && (
                        <Text style={styles.statusRoute}>
                          {routeName}
                        </Text>
                      )}
                    </View>
                    <View style={styles.statusRightContent}>
                      <Text style={styles.statusTime}>
                        {(() => {
                          // Convert to Sri Lankan time (UTC+5:30)
                          const date = new Date(item.updated_at);
                          // Get UTC time in ms, add 5.5 hours in ms
                          const offsetMs = 5.5 * 60 * 60 * 1000;
                          const slDate = new Date(date.getTime() + offsetMs);
                          return slDate.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          });
                        })()}
                      </Text>
                      <Text style={[
                        styles.statusOccupancyText,
                        { backgroundColor: OCCUPANCY_LEVELS.find(l => l.value === item.occupancy_level)?.color || AppColors.textSecondary }
                      ]}>
                        {OCCUPANCY_LEVELS.find(l => l.value === item.occupancy_level)?.label?.toUpperCase() || 'UNKNOWN'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </>
  );

  return (
    <LinearGradient
      colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />

        {/* Header outside of ScrollView - fixed positioning */}
        <LinearGradient
          colors={[AppColors.primary, AppColors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => {
                // @ts-ignore - Navigation type handling
                if (navigation.canGoBack && navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  // @ts-ignore - Navigate to home screen
                  navigation.navigate('Home');
                }
              }}
              style={styles.backButton}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Bus Occupancy</Text>
              <Text style={styles.headerSubtitle}>Report and track bus capacity</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content in ScrollView */}
        <FlatList
          data={[]}
          keyExtractor={(item, index) => `empty-${index}`}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={renderContent}
          renderItem={() => null}
          showsVerticalScrollIndicator={false}
        />

      <Modal
        animationType="slide"
        transparent={true}
        visible={showOccupancyModal}
        onRequestClose={() => setShowOccupancyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Bus Occupancy</Text>
            {currentBus ? (
              <Text style={styles.modalSubtitle}>
                Bus {currentBus.registration_number || currentBus.number} - Route {currentBus.route_number || currentBus.route}
              </Text>
            ) : (
              <Text style={styles.modalSubtitle}>No bus detected</Text>
            )}
            
            <View style={styles.occupancyOptions}>
              {OCCUPANCY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.occupancyOption,
                    { backgroundColor: level.color },
                    occupancy === level.value && styles.selectedOccupancy
                  ]}
                  onPress={() => setOccupancy(level.value)}
                >
                  <Text style={styles.occupancyLabel}>{level.label}</Text>
                  <Text style={styles.occupancyDescription}>{level.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowOccupancyModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, !currentBus && styles.disabledButton]}
                onPress={() => {
                  if (!currentBus) {
                    Alert.alert('Error', 'You can only update occupancy when you are inside a bus.');
                    return;
                  }
                  updateOccupancy(occupancy);
                }}
              >
                <Text style={styles.confirmButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
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
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  
  // Loading screen styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingSubText: {
    marginTop: 12,
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 16,
    color: AppColors.red,
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: '500',
  },

  // Header styles (matching BusTrackingScreen structure)
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  headerContent: {
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
  backArrow: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Section styles (enhanced to match BusTrackingScreen)
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(222, 226, 230, 0.4)',
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },

  // Legacy card styles (keeping for compatibility)
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(222, 226, 230, 0.6)',
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  currentBusCard: {
    borderColor: AppColors.primary,
    borderWidth: 2,
    backgroundColor: AppColors.primaryMuted,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  currentBusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentBusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: AppColors.primary,
  },
  currentBusRoute: {
    fontSize: 16,
    color: AppColors.text,
    marginBottom: 12,
    fontWeight: '500',
  },
  confidenceContainer: {
    marginBottom: 12,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detectionReason: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  updateButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  disabledButton: {
    backgroundColor: AppColors.textSecondary,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.1,
      },
    }),
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  occupancyButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  occupancyButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    margin: 4,
  },
  occupancyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentOccupancy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentOccupancyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentOccupancyTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  noBusText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#495057',
  },
  value: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  subValue: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  movementInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  occupancyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refreshButton: {
    padding: 8,
  },
  statusItem: {
    padding: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(222, 226, 230, 0.3)',
  },
  statusItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusLeftContent: {
    flex: 1,
    marginRight: 12,
  },
  statusRightContent: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minWidth: 80,
    minHeight: 60,
    paddingVertical: 4,
  },
  userStatusItem: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  statusBusNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text,
    marginTop: 6,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  statusRouteNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.primary,
    backgroundColor: 'rgba(227, 242, 253, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textAlign: 'center',
    minWidth: 60,
  },
  userUpdateIndicator: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: 'bold',
  },
  statusRoute: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  statusOccupancy: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 2,
  },
  statusOccupancyText: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
    alignSelf: 'flex-end',
  },
  statusTime: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'right',
    marginBottom: 8,
  },
  statusConfidence: {
    fontSize: 11,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(222, 226, 230, 0.6)',
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
  },
  occupancyOptions: {
    marginBottom: 20,
  },
  occupancyOption: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  selectedOccupancy: {
    borderWidth: 3,
    borderColor: AppColors.primary,
    transform: [{ scale: 1.02 }],
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
  },
  occupancyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  occupancyDescription: {
    fontSize: 12,
    color: '#fff',
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  cancelButton: {
    backgroundColor: AppColors.textSecondary,
  },
  confirmButton: {
    backgroundColor: AppColors.primary,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Nearby Buses Styles
  nearbyBusesContainer: {
    marginTop: 8,
  },
  nearbyBusesNote: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  nearbyBusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(233, 236, 239, 0.6)',
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  detectedBusItem: {
    backgroundColor: 'rgba(227, 242, 253, 0.9)',
    borderColor: AppColors.primary,
    borderWidth: 2,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  nearbyBusInfo: {
    flex: 1,
    marginRight: 8,
  },
  nearbyBusNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  nearbyBusRoute: {
    fontSize: 12,
    color: '#6c757d',
  },
  detectedBusText: {
    color: '#007bff',
  },
  detectedBusIndicator: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: 'bold',
  },
  nearbyBusDetails: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  nearbyBusTime: {
    fontSize: 10,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  nearbyBusStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  nearbyBusStatusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  moreNearbyBuses: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  refreshButtonText: {
    fontSize: 12,
    color: '#007bff',
  },
  occupancyUpdatesContainer: {
    marginTop: 8,
  },
});