import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image, // Use Image instead of ImageBackground
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

// --- App Color Palette ---
const AppColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#0056b3',
  primaryMuted: 'rgba(0, 86, 179, 0.1)',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  red: '#dc3545',
  yellow: '#ffc107',
  green: '#198754',
};

// --- Mock Data (Unchanged) ---
const quickActions = [
  { title: 'Find Routes', icon: 'map-outline' },
  { title: 'Live Tracking', icon: 'navigate-circle-outline' },
  { title: 'Fare Calculator', icon: 'calculator-outline' },
  { title: 'My Tickets', icon: 'ticket-outline' },
];

const nearbyBuses = [
  {
    number: '101',
    destination: 'Colombo - Kandy',
    arrival: '5 min',
    status: 'Crowded',
    statusColor: AppColors.yellow,
  },
  {
    number: '154',
    destination: 'Angulana - Kiribathgoda',
    arrival: '12 min',
    status: 'Not Crowded',
    statusColor: AppColors.green,
  },
];

const services = [
  { title: 'Map View', icon: 'map' },
  { title: 'Emergency', icon: 'alert-circle' },
  { title: 'Lost & Found', icon: 'search' },
  { title: 'Notifications', icon: 'notifications' },
  { title: 'Bus Occupancy', icon: 'people' },
  { title: 'Complaints', icon: 'chatbox-ellipses' },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* 1. The background image is now an absolutely positioned element */}
      <Image
        source={require('../../assets/logo.png')}
        style={styles.backgroundImage}
        // This makes the image non-interactive, ensuring touches pass through it
        pointerEvents="none"
      />

      {/* The rest of the content renders on top of the background image */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent" // Set to transparent
        translucent={true} // Allow content to draw behind status bar
      />

      {/* --- HEADER (Renders below the status bar) --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconContainer}>
          <Icon name="menu-outline" size={30} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BusHubLK</Text>
        <TouchableOpacity
          style={styles.headerIconContainer}
          onPress={() => Alert.alert('Logo Pressed', 'This button is now clickable.')}
        >
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.headerLogo}
            />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>

        {/* --- Plan Your Journey Card --- */}
        <LinearGradient
          colors={[AppColors.primary, '#006cde']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.journeyCard}>
          <Text style={styles.journeyTitle}>Plan Your Journey</Text>
          <View style={styles.inputGroup}>
            <Icon
              name="navigate-circle-outline"
              size={20}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="From (e.g., Colombo Fort)"
              style={styles.input}
              placeholderTextColor="#E0E0E0"
            />
          </View>
          <View style={styles.inputGroup}>
            <Icon
              name="location-outline"
              size={20}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="To (e.g., Kandy)"
              style={styles.input}
              placeholderTextColor="#E0E0E0"
            />
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Find My Bus</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* --- Quick Actions Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionGrid}>
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.title}
                style={styles.quickActionCard}>
                <View style={styles.quickActionIconContainer}>
                  <Icon
                    name={action.icon}
                    size={26}
                    color={AppColors.primary}
                  />
                </View>
                <Text style={styles.cardText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- Nearby Buses Section --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listContainer}>
            {nearbyBuses.map(bus => (
              <TouchableOpacity key={bus.number} style={styles.busCard}>
                <View style={styles.busInfo}>
                  <View style={styles.busNumberContainer}>
                    <Icon name="bus-outline" size={24} color={AppColors.primary} />
                  </View>
                  <View>
                    <Text style={styles.busDestination}>
                      {bus.number} to {bus.destination.split(' - ')[1]}
                    </Text>
                    <Text style={styles.busArrival}>
                      <Text style={{ color: bus.statusColor, fontWeight: '600' }}>
                        {bus.status}
                      </Text>
                    </Text>
                  </View>
                </View>
                <View style={styles.arrivalContainer}>
                  <Text style={styles.arrivalTime}>{bus.arrival}</Text>
                  <Icon
                    name="chevron-forward-outline"
                    size={20}
                    color={AppColors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- Services Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Services</Text>
          <View style={styles.serviceGrid}>
            {services.map(service => (
              <TouchableOpacity key={service.title} style={styles.serviceCard}>
                <Icon name={service.icon} size={28} color={AppColors.primary} />
                <Text style={styles.serviceCardText}>{service.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    // The paddingTop is now applied directly to the container
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  // NEW style for the absolutely positioned background image
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.05,
    resizeMode: 'contain',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: 60,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerIconContainer: {
    padding: 5,
  },
  logoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: '500',
  },
  journeyCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
    color: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 14,
  },
  searchButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    color: AppColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '23%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.card,
    borderRadius: 18,
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    gap: 12,
  },
  busCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: AppColors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  busNumberContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: AppColors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  busDestination: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
  },
  busArrival: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  arrivalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrivalTime: {
    fontSize: 15,
    fontWeight: '500',
    color: AppColors.text,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 12,
    backgroundColor: AppColors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  serviceCardText: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
});