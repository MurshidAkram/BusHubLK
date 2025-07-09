import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import * as Location from 'expo-location';

const TravelLogScreen = () => {
    // Sample bus stops data with coordinates (replace with actual route data)
    const [busStops] = useState([
        { id: '1', name: 'Stop 1', latitude: 37.7749, longitude: -122.4194, arrival: null, departure: null },
        { id: '2', name: 'Stop 2', latitude: 37.7849, longitude: -122.4294, arrival: null, departure: null },
        { id: '3', name: 'Stop 3', latitude: 37.7949, longitude: -122.4394, arrival: null, departure: null },
    ]);

    // State for current location and map region
    const [currentLocation, setCurrentLocation] = useState(null);
    const [region, setRegion] = useState({
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    // State for travel logs
    const [logs, setLogs] = useState([]);

    // State to track bus stops
    const [busStopsState, setBusStops] = useState(busStops);

    // Request location permissions and start tracking
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to track the bus.');
                return;
            }

            // Start location updates
            Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 10, // Update every 10 meters
                },
                (location) => {
                    const { latitude, longitude } = location.coords;
                    setCurrentLocation({ latitude, longitude });

                    // Update map region to follow the bus
                    setRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    });

                    // Check proximity to bus stops
                    checkBusStopProximity({ latitude, longitude });
                }
            );
        })();
    }, []);

    // Calculate distance between two coordinates
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in meters
    };

    // Check if bus is near a stop and log arrival/departure
    const checkBusStopProximity = ({ latitude, longitude }) => {
        const geofenceRadius = 50; // 50 meters radius for each stop
        const now = new Date().toISOString();

        setBusStops((prevStops) => {
            let updatedStops = [...prevStops];
            let logsUpdated = false;
            let newLogs = [...logs];

            prevStops.forEach((stop, index) => {
                const distance = calculateDistance(latitude, longitude, stop.latitude, stop.longitude);

                if (distance <= geofenceRadius && !stop.arrival) {
                    // Bus has arrived at the stop
                    newLogs = [
                        ...newLogs,
                        { stopId: stop.id, stopName: stop.name, event: 'Arrival', time: now },
                    ];
                    updatedStops[index] = { ...stop, arrival: now };
                    logsUpdated = true;
                } else if (distance > geofenceRadius && stop.arrival && !stop.departure) {
                    // Bus has departed from the stop
                    newLogs = [
                        ...newLogs,
                        { stopId: stop.id, stopName: stop.name, event: 'Departure', time: now },
                    ];
                    updatedStops[index] = { ...stop, departure: now };
                    logsUpdated = true;
                }
            });

            if (logsUpdated) {
                setLogs(newLogs);
            }

            return updatedStops;
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bus Route Tracker</Text>
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                region={region}
                showsUserLocation={true}
            >
                {busStopsState.map((stop) => (
                    <React.Fragment key={stop.id}>
                        <Marker
                            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                            title={stop.name}
                            description={stop.arrival ? `Arrived: ${new Date(stop.arrival).toLocaleString()}` : 'Not yet reached'}
                        />
                        <Circle
                            center={{ latitude: stop.latitude, longitude: stop.longitude }}
                            radius={50} // 50 meters geofence
                            strokeColor="rgba(0, 150, 255, 0.5)"
                            fillColor="rgba(0, 150, 255, 0.2)"
                        />
                    </React.Fragment>
                ))}
            </MapView>
            <View style={styles.logContainer}>
                <Text style={styles.subtitle}>Travel Log</Text>
                <FlatList
                    data={logs}
                    keyExtractor={(item, index) => `${item.stopId}-${item.event}-${index}`}
                    renderItem={({ item }) => (
                        <Text style={styles.logText}>
                            {item.stopName} - {item.event}: {new Date(item.time).toLocaleString()}
                        </Text>
                    )}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        marginVertical: 10,
    },
    map: {
        flex: 2,
        width: '100%',
        marginBottom: 20,
    },
    logContainer: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    logText: {
        fontSize: 14,
        marginVertical: 5,
    },
});

export default TravelLogScreen;