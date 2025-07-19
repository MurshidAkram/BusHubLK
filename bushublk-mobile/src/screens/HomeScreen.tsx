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
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { storageAPI } from "../services/api";

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

const GOOGLE_MAPS_API_KEY = "AIzaSyAeXR9ct7HrHMCQXSWLrWQl5OlRYjNhbxo";

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
  const [fromInputY, setFromInputY] = useState<number | null>(null);
  const [toInputY, setToInputY] = useState<number | null>(null);

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
          } catch (error) {
            console.error("Error during logout:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  // Google Places Autocomplete logic
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
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&components=country:LK&language=en&key=${GOOGLE_MAPS_API_KEY}`
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
  const measureInput = (
    ref: React.RefObject<TextInput>,
    setY: (y: number) => void
  ) => {
    if (ref.current) {
      const handle = findNodeHandle(ref.current);
      if (handle) {
        UIManager.measure(handle, (_x, _y, _w, _h, _px, py) => {
          setY(py);
        });
      }
    }
  };

  // When showing suggestions, measure input position
  useEffect(() => {
    if (showFromSuggestions) {
      setTimeout(() => measureInput(fromInputRef, setFromInputY), 50);
    }
  }, [showFromSuggestions]);

  useEffect(() => {
    if (showToSuggestions) {
      setTimeout(() => measureInput(toInputRef, setToInputY), 50);
    }
  }, [showToSuggestions]);

  // Helper to render suggestion list absolutely outside the card
  const renderSuggestionList = (type: "from" | "to") => {
    const show =
      type === "from"
        ? showFromSuggestions && fromSuggestions.length > 0
        : showToSuggestions && toSuggestions.length > 0;
    const suggestions = type === "from" ? fromSuggestions : toSuggestions;
    const selectSuggestion =
      type === "from" ? selectFromSuggestion : selectToSuggestion;
    const y = type === "from" ? fromInputY : toInputY;
    if (!show || y == null) return null;
    // Offset for suggestion box (input height + margin)
    const offset = Platform.OS === "ios" ? 48 : 52;
    return (
      <View
        style={[
          styles.suggestionBoxEnhanced,
          {
            position: "absolute",
            top: y + offset,
            left: 20,
            right: 20,
            zIndex: 99999,
            elevation: 100000,
          },
        ]}
        pointerEvents="box-none"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: 150 }}
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
              <Icon
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
        source={require("../../assets/logowithoutbg_blue.png")}
        style={styles.backgroundImage}
      />

      <StatusBar
        barStyle="light-content"
        backgroundColor={AppColors.primary}
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
                <Icon name="notifications-outline" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconContainer}
              onPress={handleLogout}
            >
              <View style={styles.iconBackgroundEnhanced}>
                <Icon name="log-out-outline" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Render suggestion lists absolutely above ScrollView */}
      {renderSuggestionList("from")}
      {renderSuggestionList("to")}

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
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
              <Icon name="bus-outline" size={32} color="#fff" />
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
            (showFromSuggestions || showToSuggestions) && {
              zIndex: 10000,
              elevation: 10000,
            },
          ]}
        >
          <LinearGradient
            colors={["#a2c2f6ff", "#F8FAFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.journeyCard}
          >
            <View style={styles.journeyHeader}>
              <Icon name="map-outline" size={24} color={AppColors.primary} />
              <Text style={styles.journeyTitle}>Plan Your Journey</Text>
            </View>

            {/* FROM */}
            <View
              style={[
                styles.inputGroup,
                {
                  zIndex: showFromSuggestions ? 1000 : 1,
                  elevation: showFromSuggestions ? 1000 : 1,
                },
              ]}
            >
              <LinearGradient
                colors={[AppColors.primaryMuted, "rgba(0, 86, 179, 0.05)"]}
                style={styles.inputGradient}
              >
                <Icon
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
                      <Icon name="close-circle" size={20} color="#154dadff" />
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
              {/* Suggestion list moved outside the card */}
            </View>

            {/* TO */}
            <View
              style={[
                styles.inputGroup,
                {
                  zIndex: showToSuggestions ? 1000 : 1,
                  elevation: showToSuggestions ? 1000 : 1,
                },
              ]}
            >
              <LinearGradient
                colors={[AppColors.primaryMuted, "rgba(0, 86, 179, 0.05)"]}
                style={styles.inputGradient}
              >
                <Icon
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
                      <Icon name="close-circle" size={20} color="#154dadff" />
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
              {/* Suggestion list moved outside the card */}
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
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[AppColors.primary, AppColors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.searchButtonGradient}
              >
                <Icon
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
                      <Icon
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
    paddingVertical: Platform.OS === "ios" ? 16 : 18,
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
    fontSize: Platform.OS === "ios" ? 21 : 24,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
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
    padding: 20,
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
    fontSize: Platform.OS === "ios" ? 20 : 18,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: Platform.OS === "ios" ? 15 : 14,
    fontWeight: "500",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: Platform.OS === "ios" ? 20 : 19,
    fontWeight: "700",
    color: AppColors.primary,
    textAlign: "center",
    lineHeight: Platform.OS === "ios" ? 26 : 24,
    includeFontPadding: false,
  },
  journeyCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 28,
    overflow: "visible", // Allow suggestion list to overflow
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
    fontSize: Platform.OS === "ios" ? 20 : 18,
    fontWeight: "700",
    color: AppColors.primary,
    marginLeft: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  inputGroup: {
    marginBottom: 16,
    borderRadius: 16,
    // overflow: "hidden", // Removed to allow suggestion list to overflow
  },
  inputGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: Platform.OS === "android" ? 56 : 52,
    borderRadius: 16,
  },
  inputIcon: {
    marginRight: 12,
    color: AppColors.primary,
  },
  input: {
    flex: 1,
    fontSize: Platform.OS === "ios" ? 17 : 16,
    color: AppColors.text,
    fontWeight: "500",
    paddingVertical: Platform.OS === "ios" ? 16 : 14,
    paddingRight: 40,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    
  },
  clearIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -10,
    zIndex: 1000,
  },

  suggestionText: {
    fontSize: Platform.OS === "ios" ? 15 : 14,
    color: AppColors.primary,
    fontWeight: "500",
    flexShrink: 1,
  },
  // Adjusted suggestionBoxEnhanced style for better display
  suggestionBoxEnhanced: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 60,
    left: 12,
    right: 12,
    backgroundColor: "#e6f0fa",
    borderColor: '#b3d1f7',
    borderWidth: 1,
    borderRadius: 14,
    maxHeight: 110,
    minWidth: 0,
    zIndex: 9999,
    paddingVertical: 4,
    paddingHorizontal: 0,
    shadowColor: '#0056b3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {},
    }),
  },

  suggestionItemEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#d6e6fa',
    backgroundColor: "#f7fbff",
    minHeight: 36,
    borderRadius: 10,
    marginHorizontal: 4,
    marginVertical: 1,
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
    paddingVertical: Platform.OS === "ios" ? 18 : 16,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 17 : 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  // UNCHANGED Quick Actions Styles
  quickActionGrid: {
    top: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 4,
    marginHorizontal: -2,
  },
  quickActionCard: {
    width: "31%",
    height: Platform.OS === "ios" ? 100 : 95,
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
    fontSize: Platform.OS === "ios" ? 12 : 11,
    fontWeight: "500",
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: Platform.OS === "ios" ? 16 : 15,
    includeFontPadding: false,
  },
  // Enhanced Bus Card Styles
  busCard: {
    backgroundColor: AppColors.card,
    padding: 20,
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
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  busDetails: {
    flex: 1,
  },
  busDestination: {
    fontSize: Platform.OS === "ios" ? 17 : 16,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  arrivalContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  arrivalTime: {
    fontSize: Platform.OS === "ios" ? 15 : 14,
    fontWeight: "500",
    color: AppColors.text,
    marginLeft: 6,
  },
  busArrival: {
    fontSize: Platform.OS === "ios" ? 14 : 13,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  noBusesText: {
    color: AppColors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    fontSize: Platform.OS === "ios" ? 16 : 15,
    fontStyle: "italic",
  },
  // UNCHANGED Services Styles
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
    paddingVertical: Platform.OS === "ios" ? 20 : 18,
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
    fontSize: Platform.OS === "ios" ? 12 : 11,
    fontWeight: "500",
    color: AppColors.textSecondary,
    textAlign: "center",
    marginTop: 10,
    lineHeight: Platform.OS === "ios" ? 16 : 15,
    includeFontPadding: false,
  },
});
