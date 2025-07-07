import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// Main HomeScreen Component
export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* --- Header --- */}
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* --- Welcome/Action Card --- */}
        <WelcomeCard />

        {/* --- Main Content Card: "Plan Your Journey" adapted for the driver --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Current Trip</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#555" />
            <Text style={styles.infoText}>From: Kaduwela Bus Terminal</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="flag-outline" size={20} color="#555" />
            <Text style={styles.infoText}>To: Kollupitiya Junction</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>View Route Details</Text>
          </TouchableOpacity>
        </View>

        {/* --- Quick Actions Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionContainer}>
            <QuickActionButton
              icon="bus-clock"
              text="Travel Log"
              onPress={() => navigation.navigate('TravelLog')}
            />
            <QuickActionButton
              icon="car-wrench"
              text="Bus Condition"
              onPress={() => navigation.navigate('Condition')}
            />
            <QuickActionButton
              icon="alert-circle"
              text="Emergency"
              onPress={() => navigation.navigate('Emergency')}
            />
          </View>
        </View>
        
         {/* --- More Services Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Services</Text>
           <TouchableOpacity style={styles.serviceItem}>
                <Ionicons name="archive-outline" size={24} color="#005A9C" />
                <Text style={styles.serviceItemText}>Lost & Found Reports</Text>
                <Ionicons name="chevron-forward-outline" size={22} color="#ccc" />
           </TouchableOpacity>
           <TouchableOpacity style={styles.serviceItem}>
                <Ionicons name="person-circle-outline" size={24} color="#005A9C" />
                <Text style={styles.serviceItemText}>My Profile</Text>
                <Ionicons name="chevron-forward-outline" size={22} color="#ccc" />
           </TouchableOpacity>
        </View>

      </ScrollView>
       {/* --- Bottom Navigation Bar (Visual Only) --- */}
       <BottomNavBar />
    </SafeAreaView>
  );
}

// --- Reusable Sub-components ---

const Header = () => (
  <View style={styles.header}>
    <TouchableOpacity>
      <Ionicons name="menu" size={32} color="white" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>BusHubLK</Text>
    <View style={styles.headerIcons}>
        <TouchableOpacity>
            <Ionicons name="notifications-outline" size={26} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={{marginLeft: 15}}>
             <FontAwesome5 name="user-circle" size={26} color="white" />
        </TouchableOpacity>
    </View>
  </View>
);

const WelcomeCard = () => (
  <View style={styles.welcomeCard}>
    <MaterialCommunityIcons name="bus" size={30} color="white" />
    <View style={styles.welcomeTextContainer}>
      <Text style={styles.welcomeTitle}>Ready to Start, Michael?</Text>
      <Text style={styles.welcomeSubtitle}>Your bus is: WP-NA-8752</Text>
    </View>
    <TouchableOpacity style={styles.startButton}>
        <Text style={styles.startButtonText}>Start Trip</Text>
    </TouchableOpacity>
  </View>
);

const QuickActionButton = ({ icon, text, onPress }) => (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
        <MaterialCommunityIcons name={icon} size={28} color="#005A9C" />
        <Text style={styles.quickActionText}>{text}</Text>
    </TouchableOpacity>
);

// Visual replica of a bottom tab navigator
const BottomNavBar = () => (
    <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
            <Ionicons name="home" size={28} color="#005A9C" />
            <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
            <Ionicons name="map-outline" size={28} color="#888" />
            <Text style={styles.navText}>Route</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
            <Ionicons name="person-outline" size={28} color="#888" />
            <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
            <Ionicons name="settings-outline" size={28} color="#888" />
            <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
    </View>
);


// --- Stylesheet ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4F8', // Light gray background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#005A9C', // Main blue color from image
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerIcons: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  scrollContainer: {
    padding: 15,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007BFF', // A slightly brighter blue
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  welcomeTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  welcomeTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: 'white',
    fontSize: 13,
    opacity: 0.9,
  },
  startButton: {
      backgroundColor: 'white',
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 15,
  },
  startButtonText: {
      color: '#007BFF',
      fontWeight: 'bold',
      fontSize: 14,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    marginLeft: 10,
  },
  primaryButton: {
    backgroundColor: '#005A9C',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  quickActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '31%',
    aspectRatio: 1, // Makes the button a square
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  serviceItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 15,
    color: '#333',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    alignItems: 'center',
  },
  navText: {
      fontSize: 12,
      color: '#888',
      marginTop: 2,
  },
  navTextActive: {
      fontSize: 12,
      color: '#005A9C',
      fontWeight: 'bold',
      marginTop: 2,
  }
});