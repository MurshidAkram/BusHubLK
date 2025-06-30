import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from 'react-native-maps';
import { getDistance } from 'geolib';

// Dummy bus data with coordinates for Sri Lankan context
const busData = [
  {
    id: '1',
    number: '101',
    from: 'Colombo',
    to: 'Kandy',
    time: '08:00 AM',
    fromCoord: { latitude: 6.9271, longitude: 79.8612 }, // Colombo
    toCoord: { latitude: 7.2906, longitude: 80.6337 },   // Kandy
  },
  {
    id: '2',
    number: '112',
    from: 'Colombo',
    to: 'Negombo',
    time: '09:00 AM',
    fromCoord: { latitude: 6.9271, longitude: 79.8612 },
    toCoord: { latitude: 7.2083, longitude: 79.8358 },
  },
  {
    id: '3',
    number: '154',
    from: 'Angulana',
    to: 'Kiribathgoda',
    time: '07:30 AM',
    fromCoord: { latitude: 6.8298, longitude: 79.8816 },
    toCoord: { latitude: 6.9778, longitude: 79.9227 },
  },
  // ...add more as needed
];

export default function BusFilterScreen() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);
  const [distance, setDistance] = useState(null);

  const handleSearch = () => {
    const fromLower = from.trim().toLowerCase();
    const toLower = to.trim().toLowerCase();
    const foundBus = busData.find(
      bus =>
        bus.from.toLowerCase().includes(fromLower) &&
        bus.to.toLowerCase().includes(toLower)
    );
    setSelectedBus(foundBus || null);

    if (foundBus) {
      const dist = getDistance(foundBus.fromCoord, foundBus.toCoord) / 1000; // in km
      setDistance(dist.toFixed(2));
    } else {
      setDistance(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Find Buses by Route</Text>
      <TextInput
        style={styles.input}
        placeholder="Current Location"
        value={from}
        onChangeText={setFrom}
      />
      <TextInput
        style={styles.input}
        placeholder="Destination"
        value={to}
        onChangeText={setTo}
      />
      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Show Route</Text>
      </TouchableOpacity>

      {selectedBus ? (
        <View style={{ flex: 1 }}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: (selectedBus.fromCoord.latitude + selectedBus.toCoord.latitude) / 2,
              longitude: (selectedBus.fromCoord.longitude + selectedBus.toCoord.longitude) / 2,
              latitudeDelta: Math.abs(selectedBus.fromCoord.latitude - selectedBus.toCoord.latitude) + 0.5,
              longitudeDelta: Math.abs(selectedBus.fromCoord.longitude - selectedBus.toCoord.longitude) + 0.5,
            }}
          >
            <Marker coordinate={selectedBus.fromCoord} title={selectedBus.from} />
            <Marker coordinate={selectedBus.toCoord} title={selectedBus.to} />
            <Polyline
              coordinates={[selectedBus.fromCoord, selectedBus.toCoord]}
              strokeColor="#0056b3"
              strokeWidth={4}
            />
          </MapView>
          <View style={styles.infoCard}>
            <Text style={styles.busNumber}>Bus {selectedBus.number}</Text>
            <Text style={styles.busRoute}>{selectedBus.from} → {selectedBus.to}</Text>
            <Text style={styles.busTime}>Departure: {selectedBus.time}</Text>
            <Text style={styles.busDistance}>Distance: {distance} km</Text>
          </View>
        </View>
      ) : (from || to) ? (
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 16 }}>
          No buses found for this route.
        </Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#0056b3', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  map: {
    width: Dimensions.get('window').width - 24,
    height: 250,
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: 'center',
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  busNumber: { fontWeight: 'bold', fontSize: 16 },
  busRoute: { color: '#0056b3', marginTop: 4 },
  busTime: { color: '#6C757D', marginTop: 2 },
  busDistance: { color: '#198754', marginTop: 2, fontWeight: 'bold' },
});