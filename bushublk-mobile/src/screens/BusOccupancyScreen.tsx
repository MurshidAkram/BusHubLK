import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';

// Enhanced detection constants
const MOVEMENT_HISTORY_SIZE = 10;
const SYNC_CORRELATION_THRESHOLD = 0.7;
const SPEED_TOLERANCE = 5;
const DIRECTION_TOLERANCE = 15;
const HIGH_CONFIDENCE_THRESHOLD = 80;
const MEDIUM_CONFIDENCE_THRESHOLD = 60;
const LOCATION_UPDATE_INTERVAL = 5000;

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
    id: `bus_${index}`,
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
  const [buses, setBuses] = useState<Bus[]>([]);
  const [occupancy, setOccupancy] = useState('not_crowded');
  const [busStatuses, setBusStatuses] = useState<BusStatuses>({});
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [currentBus, setCurrentBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);
  const [showOccupancyModal, setShowOccupancyModal] = useState(false);
  const [lastOccupancyUpdate, setLastOccupancyUpdate] = useState<string | null>(null);
  
  const movementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);
  const busHistoryRef = useRef<{[key: string]: MovementPoint[]}>({});

  const { detectedBus, confidence, detectionReason, movementHistory } = useEnhancedBusDetection(userLocation, buses);

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
    } else if (currentBus && confidence < 40) {
      setCurrentBus(null);
      Alert.alert('Bus Left', 'You have left the bus or detection confidence is low.');
    }
  }, [detectedBus, confidence, currentBus]);

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

  const updateOccupancy = (level: string) => {
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
    
    performOccupancyUpdate(level);
  };

  const performOccupancyUpdate = (level: string) => {
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

  if (!locationPermission) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Icon name="location-outline" size={50} color="#dc3545" />
          <Text style={styles.errorText}>Location Permission Required</Text>
          <Text style={styles.errorSubtext}>Please enable location access to detect if you're on a bus</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
                style={[styles.updateButton, !currentBus && styles.disabledButton]}
                onPress={() => {
                  if (!currentBus) {
                    Alert.alert('Error', 'You can only update occupancy when you are inside a bus.');
                    return;
                  }
                  setShowOccupancyModal(true);
                }}
              >
                <Text style={styles.updateButtonText}>Update Occupancy</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.noBusText}>No bus detected. Please wait while we track your location.</Text>
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
          <Text style={styles.label}>📍 Your Location & Movement</Text>
          {userLocation ? (
            <>
              <Text style={styles.value}>
                Lat: {userLocation.latitude.toFixed(6)}, Lng: {userLocation.longitude.toFixed(6)}
              </Text>
              {userLocation.accuracy && (
                <Text style={styles.subValue}>Accuracy: ±{Math.round(userLocation.accuracy)}m</Text>
              )}
              {movementHistory.length > 0 && (
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

        {Object.keys(busStatuses).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.label}>📊 Today's Bus Status Updates</Text>
            <FlatList
              data={Object.values(busStatuses)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.statusItem}>
                  <Text style={styles.statusBusNumber}>Bus {item.number}</Text>
                  <Text style={styles.statusRoute}>{item.route} ({item.direction})</Text>
                  <View style={styles.statusOccupancy}>
                    <Text style={[
                      styles.statusOccupancyText,
                      { color: OCCUPANCY_LEVELS.find(l => l.value === item.occupancy)?.color }
                    ]}>
                      {OCCUPANCY_LEVELS.find(l => l.value === item.occupancy)?.label.toUpperCase()}
                    </Text>
                    <Text style={styles.statusTime}>Updated at {item.updatedAt}</Text>
                  </View>
                </View>
              )}
            />
          </View>
        )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 36,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  currentBusCard: {
    borderColor: '#007bff',
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#eaf4ff',
  },
  currentBusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  currentBusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#007bff',
  },
  currentBusRoute: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 14,
    fontWeight: '500',
  },
  confidenceContainer: {
    marginBottom: 14,
  },
  confidenceText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  detectionReason: {
    fontSize: 13,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  updateButton: {
    backgroundColor: '#007bff',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#b0b8c1',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  occupancyButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  occupancyButton: {
    flex: 1,
    minWidth: '46%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    margin: 4,
    elevation: 1,
  },
  occupancyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  currentOccupancy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  currentOccupancyText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentOccupancyTime: {
    fontSize: 13,
    color: '#6c757d',
  },
  noBusText: {
    fontSize: 17,
    color: '#6c757d',
    textAlign: 'center',
    paddingVertical: 16,
    fontWeight: '500',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#495057',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: '#6c757d',
    marginBottom: 6,
  },
  subValue: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 3,
  },
  movementInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  statusItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statusBusNumber: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statusRoute: {
    fontSize: 15,
    color: '#495057',
    marginTop: 3,
  },
  statusOccupancy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  statusOccupancyText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  statusTime: {
    fontSize: 13,
    color: '#6c757d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    width: '92%',
    maxWidth: 420,
    alignItems: 'center',
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#007bff',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 18,
  },
  occupancyOptions: {
    marginBottom: 24,
    width: '100%',
  },
  occupancyOption: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    width: '100%',
    elevation: 1,
  },
  selectedOccupancy: {
    borderWidth: 2,
    borderColor: '#007bff',
  },
  occupancyLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  occupancyDescription: {
    fontSize: 13,
    color: '#fff',
    marginTop: 3,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    gap: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  confirmButton: {
    backgroundColor: '#007bff',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});