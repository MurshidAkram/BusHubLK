import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../navigation/navigationTypes';

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
  routeNumber: string;
  operator: 'SLTB' | 'Private';
  driverName: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number; // km/h
  lastUpdated: Date;
  status: 'active' | 'inactive' | 'breakdown' | 'depot';
  nextStop: string;
  estimatedArrival: string;
  passengerCount: number;
  capacity: number;
  busType: 'Normal' | 'Semi-Luxury' | 'Luxury' | 'Express';
}

interface BusRoute {
  routeNumber: string;
  routeName: string;
  operator: 'SLTB' | 'Private';
  activeBuses: number;
  totalBuses: number;
}

// Sample bus tracking data (in real implementation, this would come from your backend)
const SAMPLE_BUS_LOCATIONS: BusLocation[] = [
  {
    busId: 'SLTB-138-001',
    routeNumber: '138',
    operator: 'SLTB',
    driverName: 'Kamal Perera',
    latitude: 6.8672, // Near Homagama
    longitude: 80.0019,
    heading: 45,
    speed: 35,
    lastUpdated: new Date(),
    status: 'active',
    nextStop: 'Pettah',
    estimatedArrival: '5 mins',
    passengerCount: 45,
    capacity: 60,
    busType: 'Semi-Luxury'
  },
  {
    busId: 'SLTB-138-002',
    routeNumber: '138',
    operator: 'SLTB',
    driverName: 'Sunil Silva',
    latitude: 6.9036, // Near Kottawa
    longitude: 79.9553,
    heading: 180,
    speed: 42,
    lastUpdated: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    status: 'active',
    nextStop: 'Nugegoda',
    estimatedArrival: '12 mins',
    passengerCount: 38,
    capacity: 60,
    busType: 'Semi-Luxury'
  },
  {
    busId: 'PVT-001-E01',
    routeNumber: 'E01',
    operator: 'Private',
    driverName: 'Nimal Fernando',
    latitude: 6.849, // Near Horana
    longitude: 80.063,
    heading: 90,
    speed: 55,
    lastUpdated: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
    status: 'active',
    nextStop: 'Kadawatha',
    estimatedArrival: '8 mins',
    passengerCount: 28,
    capacity: 45,
    busType: 'Luxury'
  },
  {
    busId: 'SLTB-001-001',
    routeNumber: '1',
    operator: 'SLTB',
    driverName: 'Ranjith Kumar',
    latitude: 6.9333, // In Colombo Fort
    longitude: 79.8479,
    heading: 225,
    speed: 28,
    lastUpdated: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    status: 'active',
    nextStop: 'Galle Face',
    estimatedArrival: '3 mins',
    passengerCount: 52,
    capacity: 65,
    busType: 'Normal'
  }
];

const SAMPLE_ROUTES: BusRoute[] = [
  { routeNumber: '138', routeName: 'Homagama - Pettah', operator: 'SLTB', activeBuses: 2, totalBuses: 5 },
  { routeNumber: 'E01', routeName: 'Colombo - Galle Exp', operator: 'Private', activeBuses: 1, totalBuses: 3 },
  { routeNumber: '1', routeName: 'Colombo - Moratuwa', operator: 'SLTB', activeBuses: 1, totalBuses: 4 },
  { routeNumber: '4', routeName: 'Colombo - Battaramulla', operator: 'SLTB', activeBuses: 0, totalBuses: 3 },
];

export default function BusTrackingScreen({ navigation }: Props) {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [busLocations, setBusLocations] = useState<BusLocation[]>(SAMPLE_BUS_LOCATIONS);
  const [filteredBuses, setFilteredBuses] = useState<BusLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  const [showBusDetails, setShowBusDetails] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 6.9271, // Centered on Colombo
    longitude: 79.8612,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  const mapRef = useRef<MapView>(null);
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startBusTracking();
    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    filterBuses();
  }, [selectedRoute, searchQuery, busLocations]);

  const startBusTracking = () => {
    trackingInterval.current = setInterval(() => {
      setBusLocations(prevLocations =>
        prevLocations.map(bus => ({
          ...bus,
          latitude: bus.latitude + (Math.random() - 0.5) * 0.001,
          longitude: bus.longitude + (Math.random() - 0.5) * 0.001,
          speed: Math.max(0, bus.speed + (Math.random() - 0.5) * 10),
          lastUpdated: new Date(),
          passengerCount: Math.min(bus.capacity, Math.max(0, bus.passengerCount + Math.floor((Math.random() - 0.5) * 5)))
        }))
      );
    }, 5000);
  };

  const filterBuses = () => {
    let filtered = busLocations;
    if (selectedRoute) {
      filtered = filtered.filter(bus => bus.routeNumber === selectedRoute);
    }
    if (searchQuery) {
      filtered = filtered.filter(bus =>
        bus.routeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bus.nextStop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bus.driverName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredBuses(filtered);
  };

  const selectRoute = (routeNumber: string) => {
    setSelectedRoute(selectedRoute === routeNumber ? null : routeNumber);
  };

  const focusOnBus = (bus: BusLocation) => {
    setSelectedBus(bus);
    setMapRegion({
      latitude: bus.latitude,
      longitude: bus.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
    mapRef.current?.animateToRegion({
      latitude: bus.latitude,
      longitude: bus.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    }, 1000);
  };

  const showAllBuses = () => {
    if (filteredBuses.length > 0) {
      const latitudes = filteredBuses.map(bus => bus.latitude);
      const longitudes = filteredBuses.map(bus => bus.longitude);
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      const region = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) * 1.5,
        longitudeDelta: (maxLng - minLng) * 1.5,
      };
      setMapRegion(region);
      mapRef.current?.animateToRegion(region, 1000);
    }
  };

  const getBusStatusColor = (status: string) => {
    switch (status) {
      case 'active': return AppColors.success;
      case 'inactive': return AppColors.textSecondary;
      case 'breakdown': return AppColors.danger;
      case 'depot': return AppColors.warning;
      default: return AppColors.textSecondary;
    }
  };

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy < 0.5) return AppColors.success;
    if (occupancy < 0.8) return AppColors.warning;
    return AppColors.danger;
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
      <Text style={[styles.operator, selectedRoute === item.routeNumber && styles.routeTextSelected]}>
        {item.operator}
      </Text>
    </TouchableOpacity>
  );

  const renderBusItem = ({ item }: { item: BusLocation }) => {
    const occupancy = item.passengerCount / item.capacity;
    const timeSinceUpdate = Math.floor((Date.now() - item.lastUpdated.getTime()) / 60000);

    return (
      <TouchableOpacity
        style={styles.busCard}
        onPress={() => focusOnBus(item)}
        onLongPress={() => {
          setSelectedBus(item);
          setShowBusDetails(true);
        }}
      >
        <View style={styles.busHeader}>
          <View style={styles.busInfo}>
            <Text style={styles.busId}>{item.busId}</Text>
            <Text style={styles.busRoute}>Route {item.routeNumber}</Text>
          </View>
          <View style={styles.busStatus}>
            <View style={[styles.statusDot, { backgroundColor: getBusStatusColor(item.status) }]} />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.busDetails}>
          <View style={styles.busDetailRow}>
            <Icon name="location-outline" size={16} color={AppColors.textSecondary} />
            <Text style={styles.busDetailText}>Next: {item.nextStop} ({item.estimatedArrival})</Text>
          </View>
          <View style={styles.busDetailRow}>
            <Icon name="speedometer-outline" size={16} color={AppColors.textSecondary} />
            <Text style={styles.busDetailText}>{item.speed.toFixed(0)} km/h</Text>
          </View>
          <View style={styles.busDetailRow}>
            <Icon name="people-outline" size={16} color={getOccupancyColor(occupancy)} />
            <Text style={[styles.busDetailText, { color: getOccupancyColor(occupancy) }]}>
              {item.passengerCount}/{item.capacity} ({Math.round(occupancy * 100)}%)
            </Text>
          </View>
        </View>

        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Updated {timeSinceUpdate === 0 ? 'now' : `${timeSinceUpdate}m ago`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back-outline" size={24} color={AppColors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Bus Tracking</Text>
        <TouchableOpacity onPress={showAllBuses} style={styles.viewAllButton}>
            <Icon name="expand-outline" size={24} color={AppColors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color={AppColors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search routes, stops, or drivers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={AppColors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.routeFilterContainer}>
        <Text style={styles.filterTitle}>Routes:</Text>
        <FlatList
          data={SAMPLE_ROUTES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.routeNumber}
          renderItem={renderRouteItem}
          contentContainerStyle={styles.routeList}
        />
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onRegionChangeComplete={setMapRegion}
        >
          {filteredBuses.map((bus) => (
            <Marker
              key={bus.busId}
              coordinate={{
                latitude: bus.latitude,
                longitude: bus.longitude,
              }}
              title={`Bus ${bus.routeNumber}`}
              description={`${bus.nextStop} - ${bus.estimatedArrival}`}
              onPress={() => setSelectedBus(bus)}
            >
              <View style={[
                styles.busMarker,
                { backgroundColor: getBusStatusColor(bus.status) }
              ]}>
                <Icon name="bus" size={16} color="white" />
                <Text style={styles.busMarkerText}>{bus.routeNumber}</Text>
              </View>
            </Marker>
          ))}

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

        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => setSelectedRoute(null)}
          >
            <Icon name="refresh" size={20} color={AppColors.primary} />
            <Text style={styles.mapControlText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={showAllBuses}
          >
            <Icon name="locate" size={20} color={AppColors.primary} />
            <Text style={styles.mapControlText}>Fit All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.busListContainer}>
        <View style={styles.busListHeader}>
          <Text style={styles.busListTitle}>
            Active Buses ({filteredBuses.length})
          </Text>
          {selectedRoute && (
            <TouchableOpacity
              onPress={() => setSelectedRoute(null)}
              style={styles.clearFilterButton}
            >
              <Text style={styles.clearFilterText}>Clear Filter</Text>
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
              <Icon name="bus-outline" size={48} color={AppColors.textSecondary} />
              <Text style={styles.emptyText}>
                {selectedRoute
                  ? `No active buses found for route ${selectedRoute}`
                  : 'No buses found matching your search'
                }
              </Text>
            </View>
          }
        />
      </View>

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
                    <Icon name="close" size={24} color={AppColors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bus ID:</Text>
                    <Text style={styles.detailValue}>{selectedBus.busId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Route:</Text>
                    <Text style={styles.detailValue}>{selectedBus.routeNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Driver:</Text>
                    <Text style={styles.detailValue}>{selectedBus.driverName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bus Type:</Text>
                    <Text style={styles.detailValue}>{selectedBus.busType}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[
                      styles.detailValue,
                      { color: getBusStatusColor(selectedBus.status) }
                    ]}>
                      {selectedBus.status.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Speed:</Text>
                    <Text style={styles.detailValue}>{selectedBus.speed.toFixed(0)} km/h</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Next Stop:</Text>
                    <Text style={styles.detailValue}>{selectedBus.nextStop}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ETA:</Text>
                    <Text style={styles.detailValue}>{selectedBus.estimatedArrival}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Occupancy:</Text>
                    <Text style={[
                      styles.detailValue,
                      { color: getOccupancyColor(selectedBus.passengerCount / selectedBus.capacity) }
                    ]}>
                      {selectedBus.passengerCount}/{selectedBus.capacity}
                      ({Math.round((selectedBus.passengerCount / selectedBus.capacity) * 100)}%)
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
                    <Icon name="navigate" size={20} color="white" />
                    <Text style={styles.trackButtonText}>Track on Map</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 12,
        backgroundColor: AppColors.card,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.border,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppColors.text,
    },
    viewAllButton: {
        padding: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppColors.card,
        marginHorizontal: 16,
        marginVertical: 8,
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
    routeFilterContainer: {
        backgroundColor: AppColors.card,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.border,
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
    operator: {
        fontSize: 10,
        color: AppColors.textSecondary,
        fontWeight: '500',
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
    busListContainer: {
        maxHeight: Dimensions.get('window').height * 0.35,
        backgroundColor: AppColors.card,
        borderTopWidth: 1,
        borderTopColor: AppColors.border,
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
});