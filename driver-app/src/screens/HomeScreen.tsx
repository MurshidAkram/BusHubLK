import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView, // 2. Added missing ScrollView import here
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#005A9C" />
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <WelcomeCard />
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Current Trip</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={22} color="#4b5563" />
            <Text style={styles.infoText}>From: Kaduwela Bus Terminal</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="flag-outline" size={22} color="#4b5563" />
            <Text style={styles.infoText}>To: Kollupitiya Junction</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>View Route Details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionContainer}>
            <QuickActionButton
              icon="timeline-clock-outline"
              text="Travel Log"
              onPress={() => navigation.navigate('TravelLog')}
            />
            <QuickActionButton
              icon="car-wrench" // 1. Fixed icon name from "bus-wrench"
              text="Bus Condition"
              onPress={() => navigation.navigate('Condition')}
            />
            <QuickActionButton
              icon="alert-decagram-outline"
              text="Emergency"
              onPress={() => navigation.navigate('Emergency')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Services</Text>
            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => navigation.navigate('LostAndFound')}
            >
              <View style={styles.serviceIcon}>
                <Ionicons name="archive-outline" size={22} color="#005A9C" />
              </View>
              <Text style={styles.serviceItemText}>Lost & Found Reports</Text>
              <Ionicons name="chevron-forward-outline" size={22} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={styles.serviceIcon}>
                <Ionicons name="person-circle-outline" size={22} color="#005A9C" />
              </View>
              <Text style={styles.serviceItemText}>My Profile</Text>
              <Ionicons name="chevron-forward-outline" size={22} color="#9ca3af" />
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Reusable Components (no changes needed here) ---

const Header = () => (
  <View style={styles.header}>
    <TouchableOpacity>
      <Ionicons name="menu" size={30} color="white" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>BusHubLK</Text>
    <View style={styles.headerIcons}>
        <TouchableOpacity>
            <Ionicons name="notifications-outline" size={26} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={{marginLeft: 16}}>
             <FontAwesome5 name="user-circle" size={24} color="white" />
        </TouchableOpacity>
    </View>
  </View>
);

const WelcomeCard = () => (
  <View style={styles.welcomeCard}>
    <View style={styles.welcomeIcon}>
      <MaterialCommunityIcons name="bus" size={28} color="#FFFFFF" />
    </View>
    <View style={styles.welcomeTextContainer}>
      <Text style={styles.welcomeTitle}>Ready to Start, Michael?</Text>
      <Text style={styles.welcomeSubtitle}>Your bus is: WP-NA-8752</Text>
    </View>
    <TouchableOpacity style={styles.startButton}>
        <Text style={styles.startButtonText}>Start</Text>
    </TouchableOpacity>
  </View>
);

const QuickActionButton = ({ icon, text, onPress }) => (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
        <View style={styles.quickActionIcon}>
          <MaterialCommunityIcons name={icon} size={30} color="#005A9C" />
        </View>
        <Text style={styles.quickActionText}>{text}</Text>
    </TouchableOpacity>
);

// --- Styles (no changes needed here) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fA', 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#005A9C',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 20,
    backgroundColor: '#f4f7fA',
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#005A9C', 
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#003a63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  welcomeIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 2,
  },
  startButton: {
      backgroundColor: 'white',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 20,
  },
  startButtonText: {
      color: '#005A9C',
      fontWeight: 'bold',
      fontSize: 14,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b', 
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 15,
    color: '#334155',
    marginLeft: 12,
  },
  primaryButton: {
    backgroundColor: '#005A9C',
    borderRadius: 12,
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 16,
  },
  quickActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '31%',
    elevation: 2,
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  quickActionIcon: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  serviceIcon: {
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    padding: 8,
  },
  serviceItemText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
});