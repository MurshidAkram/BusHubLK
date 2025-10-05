import React, { useState, useRef, useEffect } from "react";
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
  Dimensions,
  Animated,
  findNodeHandle,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { storageAPI } from "../services/api";
import { API_BASE_URL } from "../config/api";

// Type definitions
interface GooglePlacePrediction {
  place_id: string;
  description: string;
}

interface BusData {
  id: string;
  number: string;
  from: string;
  to: string;
  time: string;
  frequency: string;
}

interface UserData {
  first_name?: string;
  [key: string]: any;
}

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// --- Enhanced App Color Palette ---
const AppColors = {
  background: "#F8FAFF",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryDark: "#003d82",
  primaryLight: "#0076e3",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  red: "#EF4444",
  yellow: "#F59E0B",
  green: "#10B981",
  orange: "#F97316",
  purple: "#8B5CF6",
};

const Maps_API_KEY = "AIzaSyAeXR9ct7HrHMCQXSWLrWQl5OlRYjNhbxo"; // Ensure this is valid

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

// Dummy bus data for Sri Lankan context
const busData = [
  {
    id: "1",
    number: "101",
    from: "Colombo",
    to: "Kandy",
    time: "08:00 AM",
    frequency: "Every 15 min",
  },
  {
    id: "2",
    number: "112",
    from: "Colombo",
    to: "Negombo",
    time: "09:00 AM",
    frequency: "Every 20 min",
  },
  {
    id: "3",
    number: "154",
    from: "Angulana",
    to: "Kiribathgoda",
    time: "07:30 AM",
    frequency: "Every 10 min",
  },
  {
    id: "4",
    number: "98",
    from: "Kandy",
    to: "Badulla",
    time: "10:00 AM",
    frequency: "Every 30 min",
  },
  {
    id: "5",
    number: "17",
    from: "Colombo",
    to: "Jaffna",
    time: "06:00 AM",
    frequency: "Every 1 hour",
  },
  {
    id: "6",
    number: "120",
    from: "Horana",
    to: "Pettah",
    time: "08:30 AM",
    frequency: "Every 12 min",
  },
  {
    id: "7",
    number: "138",
    from: "Homagama",
    to: "Pettah",
    time: "09:15 AM",
    frequency: "Every 8 min",
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // User state
  const [userData, setUserData] = useState<UserData | null>(null);

  // Plan Your Journey state
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [fromPlace, setFromPlace] = useState<GooglePlacePrediction | null>(
    null
  );
  const [toPlace, setToPlace] = useState<GooglePlacePrediction | null>(null);
  const [fromSuggestions, setFromSuggestions] = useState<
    GooglePlacePrediction[]
  >([]);
  const [toSuggestions, setToSuggestions] = useState<GooglePlacePrediction[]>(
    []
  );
  const [showFromSuggestions, setShowFromSuggestions] =
    useState<boolean>(false);
  const [showToSuggestions, setShowToSuggestions] = useState<boolean>(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // For local bus search (not Google)
  const [filteredBuses, setFilteredBuses] = useState<BusData[]>([]);

  // For dynamic suggestion list positioning
  const fromInputRef = useRef<TextInput>(null);
  const toInputRef = useRef<TextInput>(null);
  const [fromInputLayout, setFromInputLayout] = useState<{ y: number, height: number } | null>(null);
  const [toInputLayout, setToInputLayout] = useState<{ y: number, height: number } | null>(null);


  // Load user data on component mount
  useEffect(() => {
    loadUserData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadUserData = async () => {
    try {
      const user = await storageAPI.getUserData();
      setUserData(user);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("Starting logout process...");
            // Clear storage using storageAPI
            await storageAPI.clearStorage();
            // Verify storage is cleared
            const token = await storageAPI.getAuthToken();
            const userData = await storageAPI.getUserData();
            console.log("After logout - Token:", token);
            console.log("After logout - UserData:", userData);
            console.log("User logged out successfully");
            // Navigate to login or splash screen
            navigation.replace("Login"); // Assuming 'Login' is your login screen route name
          } catch (error) {
            console.error("Error during logout:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  // Google Places Autocomplete logic - Using Backend Proxy
  const fetchPlaceSuggestions = async (
    input: string,
    setSuggestions: React.Dispatch<
      React.SetStateAction<GooglePlacePrediction[]>
    >
  ) => {
    if (input.length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      console.log(`Fetching suggestions for: "${input}"`);
      
      // Call backend proxy instead of Google API directly
      const response = await axios.get(
        `${API_BASE_URL}/api/places/autocomplete`,
        {
          params: {
            input: input
          },
          timeout: 5000
        }
      );
      
      console.log("Google Places API Response:", response.data);
      if (response.data.status === "OK") {
        setSuggestions(response.data.predictions);
        console.log(`Found ${response.data.predictions.length} suggestions`);
      } else {
        console.warn(`Google Places API returned status: ${response.data.status}`);
        if (response.data.error_message) {
          console.error("API Error Message:", response.data.error_message);
        }
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Error fetching place suggestions:", err);
      if (axios.isAxiosError(err)) {
        console.error("Response data:", err.response?.data);
        console.error("Response status:", err.response?.status);
      }
      setSuggestions([]);
    }
  };

  const debounceFetchSuggestions = (
    input: string,
    setSuggestions: React.Dispatch<
      React.SetStateAction<GooglePlacePrediction[]>
    >
  ) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      fetchPlaceSuggestions(input, setSuggestions);
    }, 300);
  };

  const handleFromChange = (text: string) => {
    setFrom(text);
    setFromPlace(null);
    setShowFromSuggestions(text.length > 0);
    debounceFetchSuggestions(text, setFromSuggestions);
  };

  const handleToChange = (text: string) => {
    setTo(text);
    setToPlace(null);
    setShowToSuggestions(text.length > 0);
    debounceFetchSuggestions(text, setToSuggestions);
  };

  const selectFromSuggestion = (item: GooglePlacePrediction) => {
    setFrom(item.description);
    setFromPlace(item);
    setShowFromSuggestions(false);
    Keyboard.dismiss();
  };

  const selectToSuggestion = (item: GooglePlacePrediction) => {
    setTo(item.description);
    setToPlace(item);
    setShowToSuggestions(false);
    Keyboard.dismiss();
  };

  // For local bus search (not Google)
  const handleJourneySearch = () => {
    const fromLower = from.trim().toLowerCase();
    const toLower = to.trim().toLowerCase();
    const results = busData.filter(
      (bus) =>
        bus.from.toLowerCase().includes(fromLower) &&
        bus.to.toLowerCase().includes(toLower)
    );
    setFilteredBuses(results);
  };

  // --- Dynamic suggestion list positioning ---
  const onInputLayout = (event, type: 'from' | 'to') => {
    const { y, height } = event.nativeEvent.layout;
    if (type === 'from') {
      setFromInputLayout({ y, height });
    } else {
      setToInputLayout({ y, height });
    }
  };

  // Helper to render suggestion list absolutely outside the card
  const renderSuggestionList = (type: "from" | "to") => {
    const show =
      type === "from"
        ? showFromSuggestions && fromSuggestions.length > 0
        : showToSuggestions && toSuggestions.length > 0;
    const suggestions = type === "from" ? fromSuggestions : toSuggestions;
    const selectSuggestion =
      type === "from" ? selectFromSuggestion : selectToSuggestion;
    
    const layout = type === 'from' ? fromInputLayout : toInputLayout;

    if (!show || !layout) return null;

    // Calculate `top` position more reliably using layout info
    // `layout.y` is the y-coordinate of the input relative to its parent (ScrollView)
    // We add the height of the input + a small margin for spacing.
    const topPosition = layout.y + layout.height + 8; // 8 is just a small visual offset

    return (
      <View
        style={[
          styles.suggestionBoxEnhanced,
          {
            position: "absolute",
            top: topPosition,
            left: 20, // Align with the contentContainer padding
            right: 20, // Align with the contentContainer padding
          },
        ]}
        // This is crucial to allow taps to pass through to suggestions
        // and to ensure the box itself doesn't block underlying taps when not visible
        pointerEvents={show ? "auto" : "none"} // 'auto' when visible, 'none' when hidden
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.suggestionScrollView}
          nestedScrollEnabled
          showsVerticalScrollIndicator={true}
        >
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.place_id}
              onPress={() => selectSuggestion(item)}
              style={styles.suggestionItemEnhanced}
              activeOpacity={0.7}
            >
              <Ionicons
                name="location-outline"
                size={16}
                color={AppColors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.suggestionText}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Enhanced Background */}
      <LinearGradient
        colors={["rgba(0, 86, 179, 0.05)", "rgba(0, 118, 227, 0.05)"]}
        style={styles.backgroundGradient}
      />

      <Image
        source={require("../../assets/logowithoutbg_blue.png")} // Ensure this path is correct
        style={styles.backgroundImage}
      />

      <StatusBar
        barStyle="light-content"
        backgroundColor={AppColors.primary} // Explicitly set for Android
        translucent={false}
      />

      {/* --- ENHANCED HEADER --- */}
      <LinearGradient
        colors={[AppColors.primary, AppColors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>BusHubLK</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIconContainer}
              onPress={() => navigation.navigate("Notifications")}
            >
              <View style={styles.iconBackgroundEnhanced}>
                <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconContainer}
              onPress={handleLogout}
            >
              <View style={styles.iconBackgroundEnhanced}>
                <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Render suggestion lists absolutely above ScrollView, but outside of its flow */}
      {renderSuggestionList("from")}
      {renderSuggestionList("to")}

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always" // Essential for interacting with suggestions
      >
        {/* --- Enhanced Welcome Banner --- */}
        <Animated.View
          style={[
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <LinearGradient
            colors={[AppColors.primary, AppColors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeBanner}
          >
            <View style={styles.welcomeIconContainer}>
              <Ionicons name="bus-outline" size={32} color="#fff" />
            </View>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeTitle}>
                Hello {userData?.first_name || "User"}! 👋
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Welcome back to BusHub LK
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* --- Enhanced Plan Your Journey Card --- */}
        <Animated.View
          style={[
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            // Removed zIndex/elevation from this Animated.View, let the suggestion box manage its own layering.
          ]}
        >
          <LinearGradient
            colors={["#a2c2f6ff", "#F8FAFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.journeyCard}
          >
            <View style={styles.journeyHeader}>
              <Ionicons name="map-outline" size={24} color={AppColors.primary} />
              <Text style={styles.journeyTitle}>Plan Your Journey</Text>
            </View>

            {/* FROM */}
            <View
              style={styles.inputGroup} // Removed zIndex/elevation from inputGroup, not needed here
            >
              <LinearGradient
                colors={[AppColors.primaryMuted, "rgba(0, 86, 179, 0.05)"]}
                style={styles.inputGradient}
              >
                <Ionicons
                  name="navigate-circle-outline"
                  size={20}
                  style={styles.inputIcon}
                />
                <View style={{ flex: 1 }}>
                  <TextInput
                    ref={fromInputRef}
                    placeholder="From (e.g., Colombo)"
                    style={styles.input}
                    placeholderTextColor="#154dadff"
                    value={from}
                    onChangeText={handleFromChange}
                    onFocus={() => {
                        setShowFromSuggestions(true);
                        // Measure layout on focus, ensuring it's recent
                        fromInputRef.current?.measureInWindow((x, y, width, height) => {
                            setFromInputLayout({ y: y - StatusBar.currentHeight, height: height }); // Adjust for StatusBar if translucent is false
                        });
                    }}
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
                      <Ionicons name="close-circle" size={20} color="#154dadff" />
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </View>

            {/* TO */}
            <View
              style={styles.inputGroup} // Removed zIndex/elevation from inputGroup
            >
              <LinearGradient
                colors={[AppColors.primaryMuted, "rgba(0, 86, 179, 0.05)"]}
                style={styles.inputGradient}
              >
                <Ionicons
                  name="location-outline"
                  size={20}
                  style={styles.inputIcon}
                />
                <View style={{ flex: 1 }}>
                  <TextInput
                    ref={toInputRef}
                    placeholder="To (e.g., Kandy)"
                    style={styles.input}
                    placeholderTextColor="#154dadff"
                    value={to}
                    onChangeText={handleToChange}
                    onFocus={() => {
                        setShowToSuggestions(true);
                        // Measure layout on focus, ensuring it's recent
                        toInputRef.current?.measureInWindow((x, y, width, height) => {
                            setToInputLayout({ y: y - StatusBar.currentHeight, height: height }); // Adjust for StatusBar if translucent is false
                        });
                    }}
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
                      <Ionicons name="close-circle" size={20} color="#154dadff" />
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </View>

            <TouchableOpacity
              style={[
                styles.searchButton,
                (!fromPlace || !toPlace) && { opacity: 0.5 },
              ]}
              onPress={() => {
                handleJourneySearch(); // Trigger local bus search
                navigation.navigate("BusRouteResults", {
                  from: fromPlace,
                  to: toPlace,
                  filteredBuses: filteredBuses, // Pass filtered buses to the results screen
                });
              }}
              disabled={!fromPlace || !toPlace}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[AppColors.primary, AppColors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.searchButtonGradient}
              >
                <Ionicons
                  name="search-outline"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.searchButtonText}>Find Routes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Show filtered buses below the card */}
        {filteredBuses.length > 0 ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>Available Buses</Text>
            {filteredBuses.map((bus) => (
              <Animated.View
                key={bus.id}
                style={[
                  styles.busCard,
                  { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
              >
                <View style={styles.busInfo}>
                  <LinearGradient
                    colors={[AppColors.primaryMuted, "rgba(0, 86, 179, 0.05)"]}
                    style={styles.busNumberContainer}
                  >
                    <Text style={styles.busNumber}>{bus.number}</Text>
                  </LinearGradient>
                  <View style={styles.busDetails}>
                    <Text style={styles.busDestination}>
                      {bus.from} → {bus.to}
                    </Text>
                    <View style={styles.arrivalContainer}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={AppColors.textSecondary}
                      />
                      <Text style={styles.arrivalTime}>{bus.time}</Text>
                    </View>
                    <Text style={styles.busArrival}>{bus.frequency}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        ) : from || to ? (
          <Text style={styles.noBusesText}>No buses found for this route.</Text>
        ) : null}

        {/* --- Quick Actions Section (UNCHANGED) --- */}
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
                  } else if (action.title === "Emergency Alert") {
                    navigation.navigate("Emergency");
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.quickActionIconContainer}>
                  <Ionicons
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

        {/* --- Services Section (UNCHANGED) --- */}
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
                <Ionicons name={service.icon} size={28} color={AppColors.primary} />
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
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    position: "absolute",
    top: screenHeight * 0.6,
    left: screenWidth * 0.1,
    width: screenWidth * 0.8,
    height: screenHeight * 0.3,
    opacity: 0.3,
    resizeMode: "contain",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16, // Slightly increased padding for better Android look
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 23, // Adjusted font size slightly
    fontWeight: "600",
    letterSpacing: 0.6,
    includeFontPadding: false,
    textAlignVertical: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconContainer: {
    padding: 4,
  },
  iconBackgroundEnhanced: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  welcomeBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 20, // Reverted to 20, was 18. Seems better for both.
    marginBottom: 24,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  welcomeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: 19, // Slightly larger
    fontWeight: "700",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15, // Slightly larger
    fontWeight: "500",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20, // Slightly larger
    fontWeight: "700",
    color: AppColors.primary,
    textAlign: "center",
    lineHeight: 26, // Adjusted line height
    includeFontPadding: false,
  },
  journeyCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 28,
    overflow: "visible", // Crucial for suggestions
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
  journeyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  journeyTitle: {
    fontSize: 19, // Slightly larger
    fontWeight: "700",
    color: AppColors.primary,
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
    borderRadius: 16,
  },
  inputGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 52, // Ensures consistent height
    borderRadius: 16,
  },
  inputIcon: {
    marginRight: 12,
    color: AppColors.primary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
    fontWeight: "500",
    paddingVertical: Platform.OS === 'ios' ? 16 : 14, // Retain small platform difference if needed
    paddingHorizontal: 0, // Ensure no extra horizontal padding from RN default
    paddingRight: 40, // Space for clear icon
  },
  clearIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -10, // Adjust for icon vertical centering
    zIndex: 1000,
  },
  suggestionBoxEnhanced: {
    backgroundColor: "#fff",
    borderColor: AppColors.border,
    borderWidth: 1,
    borderRadius: 14,
    maxHeight: 150, // Keep max height for scrollability
    zIndex: 1000, // High zIndex for iOS
    elevation: 1000, // High elevation for Android
    paddingVertical: 4,
    paddingHorizontal: 0,
    shadowColor: '#0056b3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
  },
  suggestionScrollView: {
    maxHeight: 140, // Adjust this if the parent maxHeight is not enough
  },
  suggestionItemEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10, // Increased padding
    paddingHorizontal: 16, // Increased padding
    borderBottomWidth: 1,
    borderBottomColor: '#d6e6fa',
    backgroundColor: "#f7fbff",
  },
  suggestionText: {
    fontSize: 15, // Unified font size for readability
    color: AppColors.primary,
    fontWeight: "500",
    flexShrink: 1,
  },
  searchButton: {
    borderRadius: 16,
    marginTop: 8,
    overflow: "hidden",
  },
  searchButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 17, // Slightly larger
    fontWeight: "600",
  },
  quickActionGrid: {
    top: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8, // Increased gap for better spacing
    marginHorizontal: -4, // Counteract gap
  },
  quickActionCard: {
    width: "30%", // Adjusted width to accommodate gap
    aspectRatio: 1, // Keep it square
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.card,
    borderRadius: 18,
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 10,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
    }),
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
    fontSize: 12, // Standardized
    fontWeight: "500",
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 16, // Adjusted line height
    includeFontPadding: false,
  },
  busCard: {
    backgroundColor: AppColors.card,
    padding: 18, // Adjusted padding
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  busInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  busNumberContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  busNumber: {
    color: AppColors.primary,
    fontWeight: "700",
    fontSize: 18,
  },
  busDetails: {
    flex: 1,
  },
  busDestination: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 4,
  },
  arrivalContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  arrivalTime: {
    fontSize: 14,
    fontWeight: "500",
    color: AppColors.text,
    marginLeft: 6,
  },
  busArrival: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  noBusesText: {
    color: AppColors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    fontSize: 15,
    fontStyle: "italic",
  },
  serviceGrid: {
    top: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  serviceCard: {
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20, // Slightly more padding
    marginBottom: 12,
    backgroundColor: AppColors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
    }),
  },
  serviceCardText: {
    fontSize: 12, // Standardized
    fontWeight: "500",
    color: AppColors.textSecondary,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 16, // Adjusted line height
    includeFontPadding: false,
  },
});