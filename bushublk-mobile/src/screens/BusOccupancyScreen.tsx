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
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';

interface Bus {
  number: string;
  route: string;
  latitude: number;
  longitude: number;
  occupancy?: string;
  updatedAt?: string;
}

interface BusStatuses {
  [key: string]: Bus;
}

const INITIAL_BUSES: Bus[] = [
  { number: '138', route: 'Colombo - Kandy', latitude: 6.9271, longitude: 79.8612 },
  { number: '120', route: 'Horana - Pettah', latitude: 6.8441, longitude: 79.9671 },
  { number: '101', route: 'Colombo - Kandy', latitude: 7.2906, longitude: 80.6337 },
];

const OCCUPANCY_LEVELS = [
  { label: 'Low', value: 'low', color: '#198754' },
  { label: 'Medium', value: 'medium', color: '#ffc107' },
  { label: 'High', value: 'high', color: '#dc3545' },
];

const simulateBusMovement = (bus: Bus): Bus => {
  const latChange = (Math.random() - 0.5) * 0.001;
  const lngChange = (Math.random() - 0.5) * 0.001;
  return {
    ...bus,
    latitude: +(bus.latitude + latChange).toFixed(6),
    longitude: +(bus.longitude + lngChange).toFixed(6),
  };
};

export default function BusOccupancyScreen() {
  const [buses, setBuses] = useState<Bus[]>(INITIAL_BUSES);
  const [typedBusNumber, setTypedBusNumber] = useState('');
  const [selectedBus, setSelectedBus] = useState<Bus>(INITIAL_BUSES[0]);
  const [occupancy, setOccupancy] = useState('low');
  const [busStatuses, setBusStatuses] = useState<BusStatuses>({});
  const [selectedMapBus, setSelectedMapBus] = useState<Bus | null>(null);

  const movementIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const filteredSuggestions = buses.filter((bus) =>
    bus.number.toLowerCase().startsWith(typedBusNumber.toLowerCase()) && typedBusNumber !== ''
  );

  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const timer = setTimeout(() => setBusStatuses({}), msUntilMidnight);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    movementIntervalRef.current = setInterval(() => {
      setBuses((prevBuses) =>
        prevBuses.map((bus) => {
          const movedBus = simulateBusMovement(bus);
          setBusStatuses((prevStatuses) => {
            if (prevStatuses[bus.number]) {
              return {
                ...prevStatuses,
                [bus.number]: {
                  ...prevStatuses[bus.number],
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
  }, []);

  const updateOccupancy = (level: string) => {
    setOccupancy(level);
    setBusStatuses((prev) => ({
      ...prev,
      [selectedBus.number]: {
        ...selectedBus,
        occupancy: level,
        updatedAt: new Date().toLocaleTimeString(),
      },
    }));
    Alert.alert('Updated!', `Occupancy set to ${level.toUpperCase()}`);
  };

  const handleBusSelect = (bus: Bus) => {
    setTypedBusNumber(bus.number);
    setSelectedBus(bus);
    setOccupancy(busStatuses[bus.number]?.occupancy || 'low');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>🚍 SLTB Bus Occupancy Monitor</Text>

        {/* Bus Search + Suggestions */}
        <View style={styles.card}>
          <Text style={styles.label}>Search Bus Number</Text>
          <TextInput
            style={styles.input}
            value={typedBusNumber}
            onChangeText={setTypedBusNumber}
            placeholder="Type bus number..."
          />
          {filteredSuggestions.length > 0 && (
            <FlatList
              data={filteredSuggestions}
              keyExtractor={(item) => item.number}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleBusSelect(item)}
                >
                  <Text>{item.number} - {item.route}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
            />
          )}

          <Text style={styles.label}>Current Coordinates</Text>
          <Text style={styles.locationText}>
            Latitude: {selectedBus.latitude}{"\n"}
            Longitude: {selectedBus.longitude}
          </Text>

          <MapView
            style={styles.map}
            region={{
              latitude: selectedBus.latitude,
              longitude: selectedBus.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{ latitude: selectedBus.latitude, longitude: selectedBus.longitude }}
              title={`Bus ${selectedBus.number}`}
              description={selectedBus.route}
            />
          </MapView>
        </View>

        {/* Occupancy */}
        <View style={styles.card}>
          <Text style={styles.label}>Set Occupancy</Text>
          <View style={styles.occupancyRow}>
            {OCCUPANCY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.occupancyButton,
                  occupancy === level.value && { backgroundColor: level.color },
                ]}
                onPress={() => updateOccupancy(level.value)}
              >
                <Text style={styles.occupancyText}>{level.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Live Updates */}
        <Text style={styles.sectionTitle}>Live Bus Updates</Text>
        <FlatList
          data={Object.values(busStatuses)}
          keyExtractor={(item) => item.number}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.statusCard}
              onPress={() => setSelectedMapBus(item)}
            >
              <Text style={styles.busInfo}><Icon name="bus" size={16} /> {item.number} ({item.route})</Text>
              <Text>
                Occupancy:{' '}
                <Text style={{ color: OCCUPANCY_LEVELS.find(l => l.value === item.occupancy)?.color || '#000' }}>
                  {item.occupancy?.toUpperCase()}
                </Text>
              </Text>
              <Text>Last updated: {item.updatedAt}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ marginTop: 8 }}>No updates yet today.</Text>}
        />

        {/* Live Map */}
        {selectedMapBus && (
          <View style={styles.card}>
            <Text style={styles.label}>Live Map: Bus {selectedMapBus.number}</Text>
            <MapView
              style={styles.map}
              region={{
                latitude: selectedMapBus.latitude,
                longitude: selectedMapBus.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: selectedMapBus.latitude,
                  longitude: selectedMapBus.longitude,
                }}
                title={`Bus ${selectedMapBus.number}`}
                description={selectedMapBus.route}
              />
            </MapView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f1f3f5',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#343a40',
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#495057',
    fontSize: 15,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    marginBottom: 8,
  },
  suggestionsList: {
    backgroundColor: '#fff',
    maxHeight: 150,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  locationText: {
    marginBottom: 8,
    color: '#6c757d',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
  },
  map: {
    height: 200,
    width: '100%',
    borderRadius: 10,
    marginTop: 10,
  },
  occupancyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  occupancyButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: '#dee2e6',
    borderRadius: 8,
    alignItems: 'center',
  },
  occupancyText: {
    fontWeight: 'bold',
    color: '#212529',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
    color: '#343a40',
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  busInfo: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#212529',
  },
});
