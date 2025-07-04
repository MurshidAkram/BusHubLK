import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';

const GOOGLE_MAPS_API_KEY = "AIzaSyAeXR9ct7HrHMCQXSWLrWQl5OlRYjNhbxo";

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
}

const OCCUPANCY_LEVELS = [
  { label: 'Low', value: 'low', color: '#198754', description: 'Plenty of seats available' },
  { label: 'Medium', value: 'medium', color: '#ffc107', description: 'Some seats occupied' },
  { label: 'High', value: 'high', color: '#dc3545', description: 'Standing room only' },
  { label: 'Full', value: 'full', color: '#6f42c1', description: 'Bus is full' },
];

const BUS_DETECTION_RADIUS = 50; // meters
const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds

// Dummy bus data for Sri Lankan bus numbers
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
    estimatedSpeed: Math.floor(Math.random() * 60) + 20, // 20-80 km/h
  }));
};

// Calculate distance between two coordinates
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth's radius in meters
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

// Simulate bus movement
const simulateBusMovement = (bus: Bus): Bus => {
  const latChange = (Math.random() - 0.5) * 0.0005;
  const lngChange = (Math.random() - 0.5) * 0.0005;
  return {
    ...bus,
    latitude: +(bus.latitude + latChange).toFixed(6),
    longitude: +(bus.longitude + lngChange).toFixed(6),
  };
};

export default function BusOccupancyScreen() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [typedBusNumber, setTypedBusNumber] = useState('');
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [occupancy, setOccupancy] = useState('low');
  const [busStatuses, setBusStatuses] = useState<BusStatuses>({});
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [nearbyBuses, setNearbyBuses] = useState<Bus[]>([]);
  const [currentBus, setCurrentBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);
  const [showOccupancyModal, setShowOccupancyModal] = useState(false);
  const [lastOccupancyUpdate, setLastOccupancyUpdate] = useState<string | null>(null);
  
  const movementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  // Filter buses by number and proximity to user
  const filteredSuggestions = buses.filter(bus => {
    const matchesNumber = bus.number.toLowerCase().includes(typedBusNumber.toLowerCase()) && typedBusNumber !== '';
    if (!userLocation) return matchesNumber;
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      bus.latitude,
      bus.longitude
    );
    
    return matchesNumber && distance <= 1000; // Within 1km
  }).sort((a, b) => {
    if (!userLocation) return 0;
    
    const distanceA = calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
    const distanceB = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
    
    return distanceA - distanceB;
  });

  // Request location permission and get current location
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to detect nearby buses.');
          setLoading(false);
          return;
        }
        
        setLocationPermission(true);
        
        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const userPos = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        };
        
        setUserLocation(userPos);
        
        // Generate dummy buses around user location
        const dummyBuses = generateDummyBuses(userPos.latitude, userPos.longitude);
        setBuses(dummyBuses);
        
        // Start location watching
        locationWatchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: LOCATION_UPDATE_INTERVAL,
            distanceInterval: 10,
          },
          (location) => {
            const newUserPos = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
            };
            setUserLocation(newUserPos);
          }
        );
        
        setLoading(false);
      } catch (error) {
        console.error('Error requesting location permission:', error);
        Alert.alert('Error', 'Failed to get location permission.');
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

  // Detect nearby buses and current bus
  useEffect(() => {
    if (!userLocation || buses.length === 0) return;
    
    const nearby = buses.filter(bus => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        bus.latitude,
        bus.longitude
      );
      return distance <= 200; // Within 200m
    });
    
    setNearbyBuses(nearby);
    
    // Detect if user is in a bus
    const inBus = nearby.find(bus => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        bus.latitude,
        bus.longitude
      );
      return distance <= BUS_DETECTION_RADIUS;
    });
    
    if (inBus && (!currentBus || currentBus.id !== inBus.id)) {
      setCurrentBus(inBus);
      setSelectedBus(inBus);
      Alert.alert('Bus Detected', `You are now in Bus ${inBus.number} (${inBus.route})`);
    } else if (!inBus && currentBus) {
      setCurrentBus(null);
      Alert.alert('Bus Left', 'You have left the bus.');
    }
  }, [userLocation, buses, currentBus]);

  // Simulate bus movement
  useEffect(() => {
    if (buses.length === 0) return;
    
    movementIntervalRef.current = setInterval(() => {
      setBuses(prevBuses => 
        prevBuses.map(bus => {
          const movedBus = simulateBusMovement(bus);
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

  // Reset bus statuses at midnight
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
    
    // Prevent frequent updates (minimum 2 minutes between updates)
    if (lastOccupancyUpdate) {
      const timeSinceLastUpdate = Date.now() - new Date(lastOccupancyUpdate).getTime();
      if (timeSinceLastUpdate < 120000) { // 2 minutes
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
    Alert.alert('Updated', `Occupancy set to ${levelInfo?.label.toUpperCase()}`);
  };

  const handleBusSelect = (bus: Bus) => {
    setTypedBusNumber(bus.number);
    setSelectedBus(bus);
    setOccupancy(busStatuses[bus.id]?.occupancy || 'low');
  };

  const getDistanceText = (bus: Bus): string => {
    if (!userLocation) return '';
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      bus.latitude,
      bus.longitude
    );
    return distance < 1000 ? `${Math.round(distance)}m away` : `${(distance / 1000).toFixed(1)}km away`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!locationPermission) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Icon name="location-outline" size={50} color="#dc3545" />
          <Text style={styles.errorText}>Location permission is required</Text>
          <Text style={styles.errorSubtext}>Please enable location access to detect nearby buses</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>🚍 SLTB Bus Occupancy Monitor</Text>

        {/* Current Bus Status */}
        {currentBus && (
          <View style={[styles.card, styles.currentBusCard]}>
            <View style={styles.currentBusHeader}>
              <Icon name="bus" size={20} color="#007bff" />
              <Text style={styles.currentBusTitle}>You are in Bus {currentBus.number}</Text>
            </View>
            <Text style={styles.currentBusRoute}>{currentBus.route} ({currentBus.direction})</Text>
            <TouchableOpacity 
              style={styles.updateButton}
              onPress={() => setShowOccupancyModal(true)}
            >
              <Text style={styles.updateButtonText}>Update Occupancy</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Location Status */}
        {userLocation && (
          <View style={styles.card}>
            <Text style={styles.label}>📍 Your Location</Text>
            <Text style={styles.locationText}>
              Lat: {userLocation.latitude.toFixed(6)}, Lng: {userLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.accuracyText}>
              Accuracy: {userLocation.accuracy ? `±${Math.round(userLocation.accuracy)}m` : 'Unknown'}
            </Text>
          </View>
        )}

        {/* Bus Search */}
        <View style={styles.card}>
          <Text style={styles.label}>🔍 Search Bus Number</Text>
          <TextInput
            style={styles.input}
            value={typedBusNumber}
            onChangeText={setTypedBusNumber}
            placeholder="Type bus number (e.g., 100, 101)..."
            keyboardType="numeric"
          />
          {filteredSuggestions.length > 0 && (
            <FlatList
              data={filteredSuggestions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleBusSelect(item)}
                >
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionNumber}>{item.number}</Text>
                    <Text style={styles.suggestionRoute}>{item.route} ({item.direction})</Text>
                    <Text style={styles.suggestionDistance}>{getDistanceText(item)}</Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Selected Bus Map */}
        {selectedBus && userLocation && (
          <View style={styles.card}>
            <Text style={styles.label}>🗺️ Bus Location: {selectedBus.number}</Text>
            <MapView
              style={styles.map}
              region={{
                latitude: (selectedBus.latitude + userLocation.latitude) / 2,
                longitude: (selectedBus.longitude + userLocation.longitude) / 2,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              provider="google"
            >
              <Marker
                coordinate={{ latitude: selectedBus.latitude, longitude: selectedBus.longitude }}
                title={`Bus ${selectedBus.number}`}
                description={selectedBus.route}
                pinColor="blue"
              />
              <Marker
                coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                title="Your Location"
                description="You are here"
                pinColor="red"
              />
              <Circle
                center={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                radius={BUS_DETECTION_RADIUS}
                fillColor="rgba(0, 123, 255, 0.1)"
                strokeColor="rgba(0, 123, 255, 0.3)"
              />
            </MapView>
          </View>
        )}

        {/* Nearby Buses */}
        {nearbyBuses.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.label}>🚌 Nearby Buses</Text>
            <FlatList
              data={nearbyBuses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.nearbyBusItem}>
                  <View style={styles.nearbyBusInfo}>
                    <Text style={styles.nearbyBusNumber}>{item.number}</Text>
                    <Text style={styles.nearbyBusRoute}>{item.route}</Text>
                    <Text style={styles.nearbyBusDistance}>{getDistanceText(item)}</Text>
                  </View>
                  {item.estimatedSpeed && (
                    <Text style={styles.speedText}>{item.estimatedSpeed} km/h</Text>
                  )}
                </View>
              )}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Live Updates */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📊 Live Bus Updates</Text>
          <FlatList
            data={Object.values(busStatuses)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.statusCard}>
                <Text style={styles.busInfo}>
                  <Icon name="bus" size={16} /> {item.number} - {item.route}
                </Text>
                <Text style={styles.statusText}>
                  Occupancy:{' '}
                  <Text style={{ color: OCCUPANCY_LEVELS.find(l => l.value === item.occupancy)?.color || '#000' }}>
                    {item.occupancy?.toUpperCase()}
                  </Text>
                </Text>
                <Text style={styles.updateTime}>Updated: {item.updatedAt}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No updates yet today.</Text>}
            scrollEnabled={false}
          />
        </View>

        {/* Occupancy Modal */}
        <Modal
          visible={showOccupancyModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowOccupancyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Bus Occupancy</Text>
              <Text style={styles.modalSubtitle}>
                Bus {currentBus?.number} - {currentBus?.route}
              </Text>
              
              {OCCUPANCY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[styles.modalButton, { backgroundColor: level.color }]}
                  onPress={() => updateOccupancy(level.value)}
                >
                  <Text style={styles.modalButtonText}>{level.label}</Text>
                  <Text style={styles.modalButtonDesc}>{level.description}</Text>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowOccupancyModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
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
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#343a40',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentBusCard: {
    backgroundColor: '#e7f3ff',
    borderColor: '#007bff',
    borderWidth: 1,
  },
  currentBusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentBusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginLeft: 8,
  },
  currentBusRoute: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
  },
  updateButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#495057',
    fontSize: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 12,
    color: '#6c757d',
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 8,
    fontSize: 16,
  },
  suggestionsList: {
    maxHeight: 300,
    marginBottom: 8,
  },
  suggestionItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  suggestionContent: {
    flexDirection: 'column',
  },
  suggestionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  suggestionRoute: {
    fontSize: 14,
    color: '#495057',
    marginTop: 2,
  },
  suggestionDistance: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  map: {
    height: 250,
    width: '100%',
    borderRadius: 10,
    marginTop: 10,
  },
  nearbyBusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  nearbyBusInfo: {
    flex: 1,
  },
  nearbyBusNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  nearbyBusRoute: {
    fontSize: 14,
    color: '#495057',
  },
  nearbyBusDistance: {
    fontSize: 12,
    color: '#6c757d',
  },
  speedText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#343a40',
  },
  statusCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  busInfo: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#212529',
    fontSize: 16,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 2,
  },
  updateTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#343a40',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#6c757d',
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalButtonDesc: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
  modalCancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#6c757d',
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});