import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

import { API_BASE_URL } from '../config/api';
import { storageAPI } from '../services/api';
import { busLiveTrackingAPI } from '../services/busLiveTrackingAPI';

// Enhanced detection constants
const MOVEMENT_HISTORY_SIZE = 5;
const SYNC_CORRELATION_THRESHOLD = 0.7;
const SPEED_TOLERANCE = 5;
const DIRECTION_TOLERANCE = 15;
const HIGH_CONFIDENCE_THRESHOLD = 80;
const MEDIUM_CONFIDENCE_THRESHOLD = 50;
const LOCATION_UPDATE_INTERVAL = 5000;
const BUS_DATA_REFRESH_INTERVAL = 10000; // Refresh bus data every 10 seconds

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
      const mappedBuses = data.map((bus: any) => ({
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
        minutes_since_update: bus.minutes_since_update || 0,
        // Legacy compatibility
        number: bus.route_number,
        route: bus.route_name || `Route ${bus.route_number}`,
        direction: bus.heading ? (bus.heading > 180 ? 'Down' : 'Up') : 'Unknown',
        estimatedSpeed: bus.speed || 0,
        occupancy: bus.occupancy_level || 'unknown',
        updatedAt: new Date(bus.last_update || bus.updated_at).toLocaleTimeString(),
      }));
      console.log(`✅ Successfully mapped ${mappedBuses.length} buses:`, mappedBuses);
      return mappedBuses;
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
    if (!userLocation || movementHistory.length < 3) {
      return { bus: null, confidence: 0, reason: 'Insufficient movement data' };
    }
    
    let bestMatch: Bus | null = null;
    let bestScore = 0;
    let bestReason = '';
    
    buses.forEach(bus => {
      const busHistory = busMovementHistory[bus.id] || [];
      
      if (busHistory.length < 3) return;
      
      const correlation = calculateMovementCorrelation(movementHistory, busHistory);
      
      const currentDistance = calculateDistance(
        userLocation.latitude, userLocation.longitude,
        bus.latitude, bus.longitude
      );
      
      const currentUserSpeed = movementHistory[movementHistory.length - 1]?.speed || 0;
      const currentBusSpeed = bus.speed || bus.estimatedSpeed || 0;
      const speedDiff = Math.abs(currentUserSpeed - currentBusSpeed);
      
      let finalScore = correlation * 100;
      
      // Distance scoring - closer is better
      if (currentDistance < 15) {
        finalScore += 25; // Very close
      } else if (currentDistance < 30) {
        finalScore += 20; // Close
      } else if (currentDistance < 50) {
        finalScore += 15; // Nearby
      } else if (currentDistance < 100) {
        finalScore += 10; // Within range
      } else if (currentDistance < 200) {
        finalScore += 5; // Far but possible
      }
      
      // Speed matching - similar speeds indicate same vehicle
      if (speedDiff < 2) {
        finalScore += 15; // Very similar speed
      } else if (speedDiff < 5) {
        finalScore += 10; // Similar speed
      } else if (speedDiff < 10) {
        finalScore += 5; // Reasonably similar
      }
      
      // Movement bonus - both should be moving for high confidence
      if (currentUserSpeed > 5 && currentBusSpeed > 5) {
        finalScore += 15; // Both moving
      } else if (currentUserSpeed < 2 && currentBusSpeed < 2) {
        finalScore += 10; // Both stationary (e.g., at bus stop)
      }
      
      // Real-time data bonus - fresher data is more reliable
      if (bus.minutes_since_update !== undefined) {
        if (bus.minutes_since_update < 1) {
          finalScore += 15; // Very fresh data
        } else if (bus.minutes_since_update < 3) {
          finalScore += 10; // Fresh data
        } else if (bus.minutes_since_update < 5) {
          finalScore += 5; // Acceptable data
        } else if (bus.minutes_since_update > 10) {
          finalScore -= 20; // Stale data
        }
      }
      
      // Penalties for unlikely scenarios
      if (currentDistance > 200) {
        finalScore -= 30; // Too far
      }
      
      if (speedDiff > 20) {
        finalScore -= 25; // Speed too different
      }
      
      // Bus must be actively tracking
      if (bus.tracking_status && bus.tracking_status !== 'active') {
        finalScore -= 15; // Not actively tracking
      }
      
      if (finalScore > bestScore && finalScore > SYNC_CORRELATION_THRESHOLD * 100) {
        bestMatch = bus;
        bestScore = finalScore;
        bestReason = `Distance: ${currentDistance.toFixed(0)}m, Speed sync: ${speedDiff.toFixed(1)}km/h diff, Movement correlation: ${(correlation * 100).toFixed(0)}%, Data age: ${bus.minutes_since_update?.toFixed(0) || '?'}min`;
      }
    });
    
    return { 
      bus: bestMatch, 
      confidence: Math.min(bestScore, 100), 
      reason: bestReason || 'No suitable bus match found' 
    };
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
      `Occupancy set to ${levelInfo?.label?.toUpperCase() || 'UNKNOWN'} with ${confidence}% confidence`
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

        // Use Balanced accuracy for faster initial fix
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

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

        locationWatchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: LOCATION_UPDATE_INTERVAL,
            distanceInterval: 5,
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

        setLoading(false);
      } catch (error) {
        console.error('Error requesting location permission:', error);
        Alert.alert('Error', 'Failed to get location permission.');
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
    if (detectedBus && confidence > HIGH_CONFIDENCE_THRESHOLD) {
      if (!currentBus || currentBus.id !== detectedBus.id) {
        setCurrentBus(detectedBus);
        Alert.alert(
          'Bus Detected! 🚌', 
          `High confidence (${confidence}%): You are in Bus ${detectedBus.registration_number || detectedBus.number} on route ${detectedBus.route_number || detectedBus.route}\n\n${detectionReason}`
        );
      }
    } else if (detectedBus && confidence > MEDIUM_CONFIDENCE_THRESHOLD) {
      if (!currentBus || currentBus.id !== detectedBus.id) {
        setCurrentBus(detectedBus);
        Alert.alert(
          'Bus Detected ⚠️', 
          `Medium confidence (${confidence}%): You might be in Bus ${detectedBus.registration_number || detectedBus.number} on route ${detectedBus.route_number || detectedBus.route}\n\n${detectionReason}`
        );
      }
    } else if (currentBus && confidence < 40) {
      setCurrentBus(null);
      Alert.alert('Bus Left', 'You have left the bus or detection confidence is low.');
    }
  }, [detectedBus, confidence, currentBus]);

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
        'Low Confidence Warning', 
        `Detection confidence is only ${confidence}%. Are you sure you want to update occupancy?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Update', onPress: () => performOccupancyUpdate(level) }
        ]
      );
      return;
    }
    
    await performOccupancyUpdate(level);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return '#198754';
    if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) return '#ffc107';
    return '#dc3545';
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return 'High Confidence';
    if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) return 'Medium Confidence';
    return 'Low Confidence';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Detecting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <>
      {/* Back Arrow and Title */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity
          onPress={() => {
            // @ts-ignore
            if (navigation.canGoBack && navigation.canGoBack()) {
              navigation.goBack();
            } else if (navigation.navigate) {
              navigation.navigate('Home');
            }
          }}
          style={{ marginRight: 8, padding: 4 }}
        >
          <Icon name="arrow-back" size={28} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.title}>🚍 SLTB Bus Occupancy Monitor</Text>
      </View>

      {/* Nearby Buses Section */}
      <View style={styles.card}>
        <View style={styles.occupancyHeader}>
          <Text style={styles.label}>🗺️ Nearby Buses ({buses.length})</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={async () => {
              if (userLocation) {
                console.log('🔄 Manually refreshing nearby bus data...');
                const updatedBuses = await fetchNearbyBuses(userLocation.latitude, userLocation.longitude, 5);
                setBuses(updatedBuses);
              }
            }}
          >
            <Icon name="refresh" size={20} color="#007bff" />
          </TouchableOpacity>
        </View>
        {buses.length > 0 ? (
          <>
            <Text style={styles.nearbyBusesNote}>
              Buses within 5km radius (tap for details):
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
                      Updated {bus.minutes_since_update !== undefined 
                        ? `${Math.round(bus.minutes_since_update)} min ago` 
                        : 'recently'}
                    </Text>
                  </View>
                  <View style={[
                    styles.nearbyBusStatus,
                    { backgroundColor: bus.tracking_status === 'active' ? '#28a745' : '#6c757d' }
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
              'No buses found nearby. Ensure driver apps are running and tracking location.' : 
              'Getting your location...'}
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>🚌 Bus Detection Status</Text>
        {currentBus ? (
          <View style={styles.currentBusCard}>
            <View style={styles.currentBusHeader}>
              <Icon name="bus" size={20} color="#007bff" />
              <Text style={styles.currentBusTitle}>Bus {currentBus.registration_number || currentBus.number}</Text>
            </View>
            <Text style={styles.currentBusRoute}>
              {currentBus.route_name || currentBus.route} {currentBus.direction ? `(${currentBus.direction})` : ''}
            </Text>
            <Text style={styles.subValue}>
              Route: {currentBus.route_number} | Status: {currentBus.tracking_status || 'Active'}
            </Text>
            <Text style={styles.subValue}>
              Last Update: {currentBus.minutes_since_update !== undefined 
                ? `${Math.round(currentBus.minutes_since_update)} minutes ago` 
                : currentBus.updatedAt || 'Unknown'}
            </Text>
            <View style={styles.confidenceContainer}>
              <Text style={[styles.confidenceText, { color: getConfidenceColor(confidence) }]}>
                {getConfidenceText(confidence)}: {confidence}%
              </Text>
              <Text style={styles.detectionReason}>{detectionReason}</Text>
            </View>
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
                ? 'No active buses found. Driver apps must be running and tracking location for buses to appear.'
                : 'No bus detected. Please wait while we track your location and sync with nearby buses.'
              }
            </Text>
            {buses.length > 0 && (
              <Text style={styles.subValue}>
                📡 Found {buses.length} active buses nearby. Move closer to a bus or ensure you're aboard one.
              </Text>
            )}
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

      <View style={styles.card}>
        <View style={styles.occupancyHeader}>
          <Text style={styles.label}>📊 All Bus Occupancy Updates</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchAllOccupancies}>
            <Icon name="refresh" size={20} color="#007bff" />
          </TouchableOpacity>
        </View>
        {status === 'loading' && (
          <ActivityIndicator size="large" color="#007bff" />
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
            {allOccupancies.map((item, index) => {
              if (!item) return null;
              const bus = buses.find(b => b.id === `bus_${item.bus_id}`);
              
              return (
                <View key={item.occupancy_id} style={styles.statusItem}>
                  <View style={styles.statusHeader}>
                    <Text style={styles.statusRouteNumber}>
                      Route {bus?.route_number || 'Unknown'}
                    </Text>
                    <Text style={styles.statusTime}>
                      {new Date(item.updated_at).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={styles.statusBusNumber}>
                    {item.registration_number}
                  </Text>
                  <Text style={styles.statusRoute}>
                    {bus ? `${bus.route_name || bus.route}` : 'Route details unavailable'}
                  </Text>
                  <View style={styles.statusOccupancy}>
                    <Text style={[
                      styles.statusOccupancyText,
                      { color: OCCUPANCY_LEVELS.find(l => l.value === item.occupancy_level)?.color }
                    ]}>
                      {OCCUPANCY_LEVELS.find(l => l.value === item.occupancy_level)?.label?.toUpperCase() || 'UNKNOWN'}
                    </Text>
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
    <SafeAreaView style={styles.container}>
      {/* Remove <ScrollView> wrapper to avoid nesting VirtualizedLists */}
      {/* Place FlatList or other VirtualizedList-backed components directly here */}
      <FlatList
        data={[]}
        keyExtractor={(item, index) => `empty-${index}`}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={renderHeader}
        renderItem={() => null}
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
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 32,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentBusCard: {
    borderColor: '#007bff',
    borderWidth: 2,
    padding: 12,
    marginBottom: 12,
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
    color: '#007bff',
  },
  currentBusRoute: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 12,
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
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
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
    marginBottom: 4,
  },
  statusBusNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginTop: 2,
    marginBottom: 4,
  },
  statusRouteNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textAlign: 'center',
    minWidth: 80,
  },
  userUpdateIndicator: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: 'bold',
  },
  statusRoute: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  statusOccupancy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusOccupancyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTime: {
    fontSize: 12,
    color: '#6c757d',
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
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedOccupancy: {
    borderWidth: 2,
    borderColor: '#007bff',
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
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  confirmButton: {
    backgroundColor: '#007bff',
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
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  detectedBusItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007bff',
    borderWidth: 2,
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