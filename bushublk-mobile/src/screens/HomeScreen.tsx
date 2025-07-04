import React, { useState, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
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
  Keyboard,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";

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

const Maps_API_KEY = "YOUR_Maps_API_KEY"; // Replace with your actual key

// --- Mock Data (Unchanged) ---
const quickActions = [
  { title: "Live Tracking", icon: "navigate-circle-outline" },
  { title: "Bus Occupancy", icon: "people-outline" },
  { title: "Emergency Alert", icon: "alert-circle-outline" },
];

const services = [
  { title: "Lost & Found", icon: "search-outline" },
  { title: "Complaints & Feedback", icon: "chatbox-ellipses-outline" },
];


export default function HomeScreen() {
  const navigation = useNavigation();

  // Plan Your Journey state
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromPlace, setFromPlace] = useState(null);
  const [toPlace, setToPlace] = useState(null);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const debounceTimeout = useRef(null);

  // Google Places Autocomplete logic
  const fetchPlaceSuggestions = async (input, setSuggestions) => {
    if (input.length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&components=country:LK&language=en&key=${Maps_API_KEY}`
      );
      if (response.data.status === "OK") {
        setSuggestions(response.data.predictions);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    }
  };

  const debounceFetchSuggestions = (input, setSuggestions) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      fetchPlaceSuggestions(input, setSuggestions);
    }, 300);
  };

  const handleFromChange = (text) => {
    setFrom(text);
    setFromPlace(null);
    setShowFromSuggestions(text.length > 0);
    debounceFetchSuggestions(text, setFromSuggestions);
  };

  const handleToChange = (text) => {
    setTo(text);
    setToPlace(null);
    setShowToSuggestions(text.length > 0);
    debounceFetchSuggestions(text, setToSuggestions);
  };

  const selectFromSuggestion = (item) => {
    setFrom(item.description);
    setFromPlace(item);
    setShowFromSuggestions(false);
    Keyboard.dismiss();
  };

  const selectToSuggestion = (item) => {
    setTo(item.description);
    setToPlace(item);
    setShowToSuggestions(false);
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Image */}
      <Image
        source={require("../../assets/logoblue.png")}
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
        <Text style={styles.headerTitle}>
          BusHub<Text style={styles.superscript}>LK</Text>
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            style={styles.headerIconContainer}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Icon name="notifications-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconContainer}
            onPress={() =>
              Alert.alert("Logo Pressed", "This button is now clickable.")
            }
          >
            <View style={styles.logoWrapper}>
              <Image
                source={require("../../assets/logoblue.png")}
                style={styles.headerLogo}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {/* --- Welcome Banner --- */}
        <LinearGradient
          colors={["#0056b3", "#0076e3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeBanner}
        >
          <Icon
            name="bus-outline"
            size={36}
            color="#fff"
            style={{ marginRight: 14 }}
          />
          <View>
            <Text style={styles.welcomeTitle}>
              Welcome to BusHub<Text style={styles.superscript}>LK</Text>!
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Plan your journey and explore services
            </Text>
          </View>
        </LinearGradient>

        {/* --- Plan Your Journey Card --- */}
        <LinearGradient
          colors={["#fff", "#e6f0fa"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.journeyCard}
        >
          <Text style={styles.journeyTitle}>Plan Your Journey</Text>
          {/* FROM */}
          <View
            style={[
              styles.inputGroup,
              { position: "relative", zIndex: showFromSuggestions ? 200 : 10 },
            ]}
          >
            <Icon
              name="navigate-circle-outline"
              size={20}
              style={styles.inputIcon}
            />
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="From (e.g., Colombo)"
                style={styles.input}
                placeholderTextColor="#A0A0A0"
                value={from}
                onChangeText={handleFromChange}
                onFocus={() => setShowFromSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowFromSuggestions(false), 200);
                }}
              />
              {from.length > 0 && (
                <TouchableOpacity
                  style={styles.clearIcon}
                  onPress={() => {
                    setFrom("");
                    setFromPlace(null);
                    setFromSuggestions([]);
                    setShowFromSuggestions(false);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close-circle" size={22} color="#bbb" />
                </TouchableOpacity>
              )}
              {showFromSuggestions && fromSuggestions.length > 0 && (
                <View style={styles.suggestionBox}>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    style={{ maxHeight: 120 }}
                    nestedScrollEnabled
                  >
                    {fromSuggestions.map((item) => (
                      <TouchableOpacity
                        key={item.place_id}
                        onPress={() => selectFromSuggestion(item)}
                        style={styles.suggestionItem}
                      >
                        <Text>{item.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
          {/* TO */}
          <View
            style={[
              styles.inputGroup,
              { position: "relative", zIndex: showToSuggestions ? 200 : 10 },
            ]}
          >
            <Icon name="location-outline" size={20} style={styles.inputIcon} />
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="To (e.g., Kandy)"
                style={styles.input}
                placeholderTextColor="#A0A0A0"
                value={to}
                onChangeText={handleToChange}
                onFocus={() => setShowToSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowToSuggestions(false), 200);
                }}
              />
              {to.length > 0 && (
                <TouchableOpacity
                  style={styles.clearIcon}
                  onPress={() => {
                    setTo("");
                    setToPlace(null);
                    setToSuggestions([]);
                    setShowToSuggestions(false);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close-circle" size={22} color="#bbb" />
                </TouchableOpacity>
              )}
              {showToSuggestions && toSuggestions.length > 0 && (
                <View style={styles.suggestionBox}>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    style={{ maxHeight: 120 }}
                    nestedScrollEnabled
                  >
                    {toSuggestions.map((item) => (
                      <TouchableOpacity
                        key={item.place_id}
                        onPress={() => selectToSuggestion(item)}
                        style={styles.suggestionItem}
                      >
                        <Text>{item.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.searchButton,
              (!fromPlace || !toPlace) && { opacity: 0.5 },
            ]}
            onPress={() => {
              navigation.navigate("BusRouteResults", {
                from: fromPlace,
                to: toPlace,
              });
            }}
            disabled={!fromPlace || !toPlace}
          >
            <Text style={styles.searchButtonText}>Find Routes</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* --- Quick Actions Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.title}
                style={styles.quickActionCard}
                onPress={() => {
                  if (action.title === "Live Tracking") {
                    navigation.navigate("BusTracker");
                  } else if (action.title === "Bus Occupancy") {
                    navigation.navigate("BusOccupancy");
                  }
                }}
                activeOpacity={0.8}
              >
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
                  } else if (service.title === "Complaints & Feedback") {
                    navigation.navigate("Complaints");
                  }
                }}
                activeOpacity={0.8}
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
    //paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  backgroundImage: {
    position: "absolute",
    top: 280,
    left: 50,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    opacity: 0.15,
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
    fontSize: 22,
    fontWeight: "900",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  // --- FIXED STYLE ---
  superscript: {
    fontSize: 12,
    fontWeight: 'bold',
    transform: [{ translateY: -6 }], // Correct vertical alignment
  },
  headerIconContainer: {
    padding: 5,
  },
  // --- FIXED STYLE ---
  logoWrapper: {
    width: 36, // Match image size
    height: 36, // Match image size
    borderRadius: 18, // Make it a perfect circle to match the image
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  headerLogo: {
    width: 36,
    height: 36,
    resizeMode: "cover",
  },
  welcomeBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  welcomeSubtitle: {
    color: "#fff",
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  // --- FIXED STYLE ---
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.text,
    textAlign: "left", // Changed from 'center' to 'left'
    marginBottom: 16,  // Added space below the title
  },
  journeyCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.primary,
    marginBottom: 16,
    textAlign: "center",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 86, 179, 0.07)",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    position: "relative",
    zIndex: 101,
  },
  inputIcon: {
    marginRight: 10,
    color: AppColors.primary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
    paddingVertical: 14,
  },
  clearIcon: {
    position: "absolute",
    right: 8,
    top: "50%",
    marginTop: -11,
    zIndex: 1000,
  },
  suggestionBox: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderColor: AppColors.border,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 120,
    zIndex: 300,
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    backgroundColor: "#fff",
  },
  searchButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  quickActionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  quickActionCard: {
    width: "31%",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.card,
    borderRadius: 18,
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 10,
    elevation: 1,
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
  // --- FIXED STYLE ---
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // Keeps items spaced apart
  },
  // --- FIXED STYLE ---
  serviceCard: {
    width: "48%", // Adjusted for a balanced 2-column layout
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginBottom: 12,
    backgroundColor: AppColors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    elevation: 1,
  },
  serviceCardText: {
    fontSize: 12,
    fontWeight: "500",
    color: AppColors.textSecondary,
    textAlign: "center",
    marginTop: 10,
  },
});