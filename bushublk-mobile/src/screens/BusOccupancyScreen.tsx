import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { API_BASE_URL } from '../config/api'; // Import dynamic API base URL

// Enhanced detection constants
const MOVEMENT_HISTORY_SIZE = 10;
const SYNC_CORRELATION_THRESHOLD = 0.7;
const SPEED_TOLERANCE = 5;
const DIRECTION_TOLERANCE = 15;
const HIGH_CONFIDENCE_THRESHOLD = 80;
const MEDIUM_CONFIDENCE_THRESHOLD = 60;
const LOCATION_UPDATE_INTERVAL = 5000;

// Type Definitions
type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

interface Bus {
  id: string;
  number: string;
  route: string;
  latitude: number;
  longitude: number;
  occupancy?: string;
  updatedAt?: string;
  direction?: string;
  estimatedSpeed?: number;
}

interface BusStatuses {
  [key: string]: Bus;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
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

const generateDummyBuses = (userLat: number, userLng: number): Bus[] => {
  const busNumbers = [
    { number: '100', route: 'Colombo - Kandy', direction: 'Up' },
    { number: '100', route: 'Kandy - Colombo', direction: 'Down' },
    { number: '101', route: 'Colombo - Galle', direction: 'Up' },
    { number: '101', route: 'Galle - Colombo', direction: 'Down' },
    { number: '102', route: 'Colombo - Ratnapura', direction: 'Up' },
    { number: '102', route: 'Ratnapura - Colombo', direction: 'Down' },
    { number: '103', route: 'Colombo - Negombo', direction: 'Up' },
    { number: '103', route: 'Negombo - Colombo', direction: 'Down' },
    { number: '104', route: 'Colombo - Matara', direction: 'Up' },
    { number: '104', route: 'Matara - Colombo', direction: 'Down' },
    { number: '110', route: 'Kaduwela - Colombo', direction: 'Up' },
    { number: '110', route: 'Colombo - Kaduwela', direction: 'Down' },
    { number: '122', route: 'Homagama - Colombo', direction: 'Up' },
    { number: '122', route: 'Colombo - Homagama', direction: 'Down' },
    { number: '138', route: 'Malabe - Colombo', direction: 'Up' },
    { number: '138', route: 'Colombo - Malabe', direction: 'Down' },
  ];

  return busNumbers.map((bus, index) => ({
    id: `bus_${index + 1}`,
    number: bus.number,
    route: bus.route,
    direction: bus.direction,
    latitude: userLat + (Math.random() - 0.5) * 0.01,
    longitude: userLng + (Math.random() - 0.5) * 0.01,
    estimatedSpeed: Math.floor(Math.random() * 40) + 20,
  }));
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

const simulateBusMovement = (bus: Bus, prevHistory: MovementPoint[] = []): Bus => {
  const currentTime = Date.now();
  const prevPoint = prevHistory[prevHistory.length - 1];
  
  let latChange, lngChange;
  
  if (prevPoint && currentTime - prevPoint.timestamp < 30000) {
    const prevDirection = prevPoint.direction * Math.PI / 180;
    const speed = bus.estimatedSpeed || 30;
    const distance = (speed / 3.6) * 10;
    
    const directionVariation = (Math.random() - 0.5) * 0.3;
    const newDirection = prevDirection + directionVariation;
    
    latChange = (distance / 111000) * Math.cos(newDirection);
    lngChange = (distance / 111000) * Math.sin(newDirection);
  } else {
    latChange = (Math.random() - 0.5) * 0.0005;
    lngChange = (Math.random() - 0.5) * 0.0005;
  }
  
  return {
    ...bus,
    latitude: +(bus.latitude + latChange).toFixed(6),
    longitude: +(bus.longitude + lngChange).toFixed(6),
  };
};

const useEnhancedBusDetection = (userLocation: UserLocation | null, buses: Bus[], demoMode: boolean, selectedDemoBus: Bus | null) => {
  const [movementHistory, setMovementHistory] = useState<MovementPoint[]>([]);
  const [busMovementHistory, setBusMovementHistory] = useState<{[key: string]: MovementPoint[]}>({});
  const [detectedBus, setDetectedBus] = useState<Bus | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [detectionReason, setDetectionReason] = useState('');

  useEffect(() => {
    if (demoMode && selectedDemoBus) {
      setDetectedBus(selectedDemoBus);
      setConfidence(100);
      setDetectionReason('Demo mode: Manually selected bus');
      return;
    }

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
  }, [userLocation, demoMode, selectedDemoBus]);

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
          speed: bus.estimatedSpeed || 0,
          direction: calculateDirection(prevPoint, bus)
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
      const currentBusSpeed = bus.estimatedSpeed || 0;
      const speedDiff = Math.abs(currentUserSpeed - currentBusSpeed);
      
      let finalScore = correlation * 100;
      
      if (currentDistance < 25) {
        finalScore += 15;
      } else if (currentDistance < 50) {
        finalScore += 10;
      } else if (currentDistance < 100) {
        finalScore += 5;
      }
      
      if (speedDiff < 3) {
        finalScore += 10;
      } else if (speedDiff < 5) {
        finalScore += 5;
      }
      
      if (currentUserSpeed > 10 && currentBusSpeed > 10) {
        finalScore += 10;
      }
      
      if (currentDistance > 100) {
        finalScore -= 20;
      }
      
      if (speedDiff > 15) {
        finalScore -= 15;
      }
      
      if (finalScore > bestScore && finalScore > SYNC_CORRELATION_THRESHOLD * 100) {
        bestMatch = bus;
        bestScore = finalScore;
        bestReason = `Distance: ${currentDistance.toFixed(0)}m, Speed sync: ${speedDiff.toFixed(1)}km/h diff, Movement correlation: ${(correlation * 100).toFixed(0)}%`;
      }
    });
    
    return { 
      bus: bestMatch, 
      confidence: Math.min(bestScore, 100), 
      reason: bestReason || 'No suitable bus match found' 
    };
  };

  useEffect(() => {
    if (demoMode && selectedDemoBus) {
      setDetectedBus(selectedDemoBus);
      setConfidence(100);
      setDetectionReason('Demo mode: Manually selected bus');
      return;
    }

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
  }, [movementHistory, busMovementHistory, demoMode, selectedDemoBus]);

  return {
    detectedBus,
    confidence: Math.round(confidence),
    detectionReason,
    movementHistory,
    busMovementHistory
  };
};

export default function BusOccupancyScreen() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [occupancy, setOccupancy] = useState('not_crowded');
  const [busStatuses, setBusStatuses] = useState<BusStatuses>({});
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [currentBus, setCurrentBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);
  const [showOccupancyModal, setShowOccupancyModal] = useState(false);
  const [lastOccupancyUpdate, setLastOccupancyUpdate] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [selectedDemoBus, setSelectedDemoBus] = useState<Bus | null>(null);
  const [showBusSelector, setShowBusSelector] = useState(false);
  const [allOccupancies, setAllOccupancies] = useState<OccupancyRecord[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const movementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);
  const busHistoryRef = useRef<{[key: string]: MovementPoint[]}>({});

  const { detectedBus, confidence, detectionReason, movementHistory } = useEnhancedBusDetection(userLocation, buses, demoMode, selectedDemoBus);

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
      `Occupancy set to ${levelInfo?.label.toUpperCase()} with ${confidence}% confidence`
    );

    setStatus('loading');
    setError(null);
    
    // Extract numeric ID from bus_X format
    const numericBusId = currentBus.id.replace('bus_', '');
    
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
      
      console.log('Request URL:', `${API_BASE_URL}/bus-occupancy/${numericBusId}`);
      console.log('Request payload:', {
        busId: parseInt(numericBusId, 10),
        passengerId: passengerId,
        occupancyLevel: level,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        confidence: demoMode ? 100 : confidence,
      });
      
      const response = await fetch(`${API_BASE_URL}/bus-occupancy/${numericBusId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Mode': demoMode ? 'true' : 'false'
        },
        body: JSON.stringify({
          busId: parseInt(numericBusId, 10),
          passengerId: passengerId,
          occupancyLevel: level,
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
          confidence: demoMode ? 100 : confidence,
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
  }, [currentBus, userLocation, confidence, demoMode]);

  const fetchAllOccupancies = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      console.log('Fetching occupancies from:', `${API_BASE_URL}/bus-occupancy`);
      const response = await fetch(`${API_BASE_URL}/bus-occupancy`, {
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
        
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const userPos = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: Date.now(),
        };
        
        setUserLocation(userPos);
        
        const dummyBuses = generateDummyBuses(userPos.latitude, userPos.longitude);
        setBuses(dummyBuses);
        
        locationWatchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
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
    
    if (!demoMode) {
      requestLocationPermission();
    } else {
      const defaultLocation = {
        latitude: 6.9271,
        longitude: 79.8612,
        accuracy: 10,
        timestamp: Date.now(),
      };
      setUserLocation(defaultLocation);
      setBuses(generateDummyBuses(defaultLocation.latitude, defaultLocation.longitude));
      setLoading(false);
    }
    
    return () => {
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
      }
    };
  }, [demoMode]);

  useEffect(() => {
    if (demoMode && selectedDemoBus) {
      setCurrentBus(selectedDemoBus);
      Alert.alert(
        'Demo Mode',
        `Selected Bus ${selectedDemoBus.number} (${selectedDemoBus.route}) for demonstration`
      );
    } else if (detectedBus && confidence > HIGH_CONFIDENCE_THRESHOLD) {
      if (!currentBus || currentBus.id !== detectedBus.id) {
        setCurrentBus(detectedBus);
        Alert.alert(
          'Bus Detected! 🚌', 
          `High confidence (${confidence}%): You are in Bus ${detectedBus.number} (${detectedBus.route})\n\n${detectionReason}`
        );
      }
    } else if (detectedBus && confidence > MEDIUM_CONFIDENCE_THRESHOLD) {
      if (!currentBus || currentBus.id !== detectedBus.id) {
        setCurrentBus(detectedBus);
        Alert.alert(
          'Bus Detected ⚠️', 
          `Medium confidence (${confidence}%): You might be in Bus ${detectedBus.number} (${detectedBus.route})\n\n${detectionReason}`
        );
      }
    } else if (currentBus && confidence < 40 && !demoMode) {
      setCurrentBus(null);
      Alert.alert('Bus Left', 'You have left the bus or detection confidence is low.');
    }
  }, [detectedBus, confidence, demoMode, selectedDemoBus, currentBus]);

  useEffect(() => {
    if (buses.length === 0) return;
    
    movementIntervalRef.current = setInterval(() => {
      setBuses(prevBuses => 
        prevBuses.map(bus => {
          const currentHistory = busHistoryRef.current[bus.id] || [];
          const movedBus = simulateBusMovement(bus, currentHistory);
          
          const newPoint: MovementPoint = {
            latitude: movedBus.latitude,
            longitude: movedBus.longitude,
            timestamp: Date.now(),
            speed: movedBus.estimatedSpeed || 0,
            direction: calculateDirection(currentHistory[currentHistory.length - 1], movedBus)
          };
          
          busHistoryRef.current[bus.id] = [...currentHistory, newPoint].slice(-MOVEMENT_HISTORY_SIZE);
          
          setBusStatuses(prevStatuses => {
            if (prevStatuses[bus.id]) {
              return {
                ...prevStatuses,
                [bus.id]: {
                  ...prevStatuses[bus.id],
                  latitude: movedBus.latitude,
                  longitude: movedBus.longitude,
                },
              };
            }
            return prevStatuses;
          });
          
          return movedBus;
        })
      );
    }, 10000);

    return () => {
      if (movementIntervalRef.current) {
        clearInterval(movementIntervalRef.current);
      }
    };
  }, [buses]);

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
    
    if (confidence < MEDIUM_CONFIDENCE_THRESHOLD && !demoMode) {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.demoToggleContainer}>
          <Text style={styles.demoToggleLabel}>Demo Mode</Text>
          <Switch
            value={demoMode}
            onValueChange={(value) => {
              setDemoMode(value);
              if (!value) {
                setSelectedDemoBus(null);
                setCurrentBus(null);
                setShowBusSelector(false);
              } else {
                setShowBusSelector(true);
              }
            }}
          />
        </View>

        <Text style={styles.title}>🚍 SLTB Bus Occupancy Monitor</Text>

        <View style={styles.card}>
          <Text style={styles.label}>🚌 Bus Detection Status</Text>
          {currentBus ? (
            <View style={styles.currentBusCard}>
              <View style={styles.currentBusHeader}>
                <Icon name="bus" size={20} color="#007bff" />
                <Text style={styles.currentBusTitle}>Bus {currentBus.number}</Text>
              </View>
              <Text style={styles.currentBusRoute}>{currentBus.route} ({currentBus.direction})</Text>
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
                    Current: {OCCUPANCY_LEVELS.find(l => l.value === busStatuses[currentBus.id].occupancy)?.label.toUpperCase()}
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
              <Text style={styles.noBusText}>No bus detected. {demoMode ? 'Please select a bus for demo.' : 'Please wait while we track your location.'}</Text>
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
                <Text style={styles.updateButtonText}>Update Occupancy (Modal)</Text>
              </TouchableOpacity>
            </>
          )}
          {demoMode && (
            <TouchableOpacity
              style={styles.selectBusButton}
              onPress={() => setShowBusSelector(true)}
            >
              <Text style={styles.selectBusButtonText}>Select Bus for Demo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>📍 Your Location & Movement</Text>
          {userLocation ? (
            <>
              <Text style={styles.value}>
                Lat: {userLocation.latitude.toFixed(6)}, Lng: {userLocation.longitude.toFixed(6)}
              </Text>
              {userLocation.accuracy && (
                <Text style={styles.subValue}>Accuracy: ±{Math.round(userLocation.accuracy)}m</Text>
              )}
              {movementHistory.length > 0 && !demoMode && (
                <View style={styles.movementInfo}>
                  <Text style={styles.subValue}>
                    Speed: {movementHistory[movementHistory.length - 1]?.speed?.toFixed(1) || 0} km/h
                  </Text>
                  <Text style={styles.subValue}>
                    Direction: {movementHistory[movementHistory.length - 1]?.direction?.toFixed(0) || 0}°
                  </Text>
                  <Text style={styles.subValue}>
                    Movement Points: {movementHistory.length}/{MOVEMENT_HISTORY_SIZE}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.noBusText}>Waiting for location data...</Text>
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
          {status === 'succeeded' && allOccupancies.length > 0 && (
            <FlatList
              data={allOccupancies}
              keyExtractor={(item) => item.occupancy_id.toString()}
              renderItem={({ item }) => {
                const bus = buses.find(b => b.id === `bus_${item.bus_id}`);
                return (
                  <View style={styles.statusItem}>
                    <Text style={styles.statusBusNumber}>Bus {item.registration_number}</Text>
                    <Text style={styles.statusRoute}>{bus ? `${bus.route} (${bus.direction})` : `Bus ID: ${item.bus_id}`}</Text>
                    <View style={styles.statusOccupancy}>
                      <Text style={[
                        styles.statusOccupancyText,
                        { color: OCCUPANCY_LEVELS.find(l => l.value === item.occupancy_level)?.color }
                      ]}>
                        {OCCUPANCY_LEVELS.find(l => l.value === item.occupancy_level)?.label.toUpperCase()}
                      </Text>
                      <Text style={styles.statusTime}>Updated at {new Date(item.updated_at).toLocaleTimeString()}</Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
          {status === 'succeeded' && allOccupancies.length === 0 && (
            <Text style={styles.noBusText}>No occupancy updates available.</Text>
          )}
        </View>
      </ScrollView>

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
                Bus {currentBus.number} - {currentBus.route}
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={showBusSelector}
        onRequestClose={() => setShowBusSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Bus for Demo</Text>
            <FlatList
              data={buses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.busOption}
                  onPress={() => {
                    setSelectedDemoBus(item);
                    setShowBusSelector(false);
                  }}
                >
                  <Text style={styles.busOptionText}>
                    Bus {item.number} - {item.route} ({item.direction})
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowBusSelector(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
  },
  scrollContent: {
    padding: 16,
    paddingTop: 32,
    paddingBottom: 20,
  },
  demoToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  demoToggleLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
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
  selectBusButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  selectBusButtonText: {
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
  statusBusNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statusRoute: {
    fontSize: 14,
    color: '#495057',
    marginTop: 2,
  },
  statusOccupancy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusOccupancyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTime: {
    fontSize: 12,
    color: '#6c757d',
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
  busOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  busOptionText: {
    fontSize: 16,
    color: '#007bff',
  },
});