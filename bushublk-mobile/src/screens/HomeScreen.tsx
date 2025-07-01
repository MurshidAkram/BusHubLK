import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  Platform,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- App Color Palette ---
const AppColors = {
  background: "#F8F9FA",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  text: "#212529",
  textSecondary: "#6C757D",
  border: "#DEE2E6",
  red: "#dc3545",
  yellow: "#ffc107",
  green: "#198754",
};

// --- Mock Data (Unchanged) ---
const quickActions = [
  { title: "Find Routes", icon: "map-outline" },
  { title: "Live Tracking", icon: "navigate-circle-outline" },
  { title: "Fare Calculator", icon: "calculator-outline" },
  { title: "My Tickets", icon: "ticket-outline" },
];

const nearbyBuses = [
  {
    number: "101",
    destination: "Colombo - Kandy",
    arrival: "5 min",
    status: "Crowded",
    statusColor: AppColors.yellow,
  },
  {
    number: "154",
    destination: "Angulana - Kiribathgoda",
    arrival: "12 min",
    status: "Not Crowded",
    statusColor: AppColors.green,
  },
];

const services = [
  { title: "Map View", icon: "map" },
  { title: "Emergency", icon: "alert-circle" },
  { title: "Lost & Found", icon: "search" },
  { title: "Notifications", icon: "notifications" },
  { title: "Bus Occupancy", icon: "people" },
  { title: "Complaints", icon: "chatbox-ellipses" },
];

// Dummy bus data for Sri Lankan context
const busData = [
  { id: '1', number: '101', from: 'Colombo', to: 'Kandy', time: '08:00 AM' },
  { id: '2', number: '112', from: 'Colombo', to: 'Negombo', time: '09:00 AM' },
  { id: '3', number: '154', from: 'Angulana', to: 'Kiribathgoda', time: '07:30 AM' },
  { id: '4', number: '98', from: 'Kandy', to: 'Badulla', time: '10:00 AM' },
  { id: '5', number: '17', from: 'Colombo', to: 'Jaffna', time: '06:00 AM' },
  { id: '6', number: '120', from: 'Horana', to: 'Pettah', time: '08:30 AM' },
  { id: '7', number: '138', from: 'Homagama', to: 'Pettah', time: '09:15 AM' },
];

export default function HomeScreen() {
  const navigation = useNavigation();

  // State for journey card
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [filteredBuses, setFilteredBuses] = useState([]);

  const handleJourneySearch = () => {
    const fromLower = from.trim().toLowerCase();
    const toLower = to.trim().toLowerCase();
    const results = busData.filter(
      bus =>
        bus.from.toLowerCase().includes(fromLower) &&
        bus.to.toLowerCase().includes(toLower)
    );
    setFilteredBuses(results);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Image */}
      <Image
        source={require("../../assets/logo.png")}
        style={styles.backgroundImage}
        pointerEvents="none"
      />

      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconContainer}>
          <Icon name="menu-outline" size={30} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BusHubLK</Text>
        <TouchableOpacity
          style={styles.headerIconContainer}
          onPress={() =>
            Alert.alert("Logo Pressed", "This button is now clickable.")
          }
        >
          <View style={styles.logoWrapper}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.headerLogo}
            />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Plan Your Journey Card --- */}
        <LinearGradient
          colors={[AppColors.primary, "#006cde"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.journeyCard}
        >
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
              value={from}
              onChangeText={setFrom}
            />
          </View>
          <View style={styles.inputGroup}>
            <Icon name="location-outline" size={20} style={styles.inputIcon} />
            <TextInput
              placeholder="To (e.g., Kandy)"
              style={styles.input}
              placeholderTextColor="#E0E0E0"
              value={to}
              onChangeText={setTo}
            />
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleJourneySearch}>
            <Text style={styles.searchButtonText}>Find My Bus</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Show filtered buses below the card */}
        {filteredBuses.length > 0 ? (
          <View style={{ marginBottom: 20 }}>
            {filteredBuses.map(bus => (
              <View key={bus.id} style={styles.busCard}>
                <Text style={styles.busNumber}>Bus {bus.number}</Text>
                <Text style={styles.busRoute}>{bus.from} → {bus.to}</Text>
                <Text style={styles.busTime}>Departure: {bus.time}</Text>
              </View>
            ))}
          </View>
        ) : (from || to) ? (
          <Text style={{ color: '#888', textAlign: 'center', marginBottom: 20 }}>
            No buses found for this route.
          </Text>
        ) : null}

        {/* --- Quick Actions Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionGrid}>
            {quickActions.map((action) => (
  <TouchableOpacity
    key={action.title}
    style={styles.quickActionCard}
    onPress={() => {
      if (action.title === "Find Routes") {
        navigation.navigate("BusFilter");
      } else if (action.title === "Live Tracking") {
        navigation.navigate("LiveTracking");
      } else if (action.title === "Fare Calculator") {
        navigation.navigate("FareCalculator"); // <-- This line connects your screen
      } else if (action.title === "My Tickets") {
        navigation.navigate("MyTickets");
      }
    }}
  >
    <View style={styles.quickActionIconContainer}>
      <Icon name={action.icon} size={26} color={AppColors.primary} />
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
            {nearbyBuses.map((bus) => (
              <TouchableOpacity key={bus.number} style={styles.busCard}>
                <View style={styles.busInfo}>
                  <View style={styles.busNumberContainer}>
                    <Icon
                      name="bus-outline"
                      size={24}
                      color={AppColors.primary}
                    />
                  </View>
                  <View>
                    <Text style={styles.busDestination}>
                      {bus.number} to {bus.destination.split(" - ")[1]}
                    </Text>
                    <Text style={styles.busArrival}>
                      <Text
                        style={{ color: bus.statusColor, fontWeight: "600" }}
                      >
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
            {services.map((service) => (
              <TouchableOpacity
                key={service.title}
                style={styles.serviceCard}
                onPress={() => {
                  if (service.title === "Lost & Found") {
                    navigation.navigate("LostAndFound");
                  } else if (service.title === "Map View") {
                    navigation.navigate("MapView");
                  } else if (service.title === "Emergency") {
                    navigation.navigate("Emergency");
                  } else if (service.title === "Notifications") {
                    navigation.navigate("Notifications");
                  } else if (service.title === "Bus Occupancy") {
                    navigation.navigate("BusOccupancy");
                  } else if (service.title === "Complaints") {
                    navigation.navigate("Complaints");
                  }
                }}
              >
                <Icon name={service.icon} size={28} color={AppColors.primary} />
                <Text style={styles.serviceCardText}>{service.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    opacity: 0.05,
    resizeMode: "contain",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: 60,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerIconContainer: {
    padding: 5,
  },
  logoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerLogo: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "500",
  },
  journeyCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
    color: "#FFFFFF",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    paddingVertical: 14,
  },
  searchButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  searchButtonText: {
    color: AppColors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  quickActionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: "23%",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 12,
    fontWeight: "500",
    color: AppColors.textSecondary,
    textAlign: "center",
  },
  listContainer: {
    gap: 12,
  },
  busCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  busNumber: { fontWeight: "bold", fontSize: 16 },
  busRoute: { color: "#0056b3", marginTop: 4 },
  busTime: { color: "#6C757D", marginTop: 2 },
  busInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  busNumberContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: AppColors.primaryMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  busDestination: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.text,
  },
  busArrival: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  arrivalContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  arrivalTime: {
    fontSize: 15,
    fontWeight: "500",
    color: AppColors.text,
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  serviceCard: {
    width: "31%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginBottom: 12,
    backgroundColor: AppColors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  serviceCardText: {
    fontSize: 12,
    fontWeight: "500",
    color: AppColors.textSecondary,
    textAlign: "center",
    marginTop: 10,
  },
});