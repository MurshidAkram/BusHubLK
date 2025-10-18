import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { storageAPI, notificationAPI } from "../services/api";
import { API_BASE_URL } from "../config/api";

// Type definitions
interface GooglePlacePrediction {
  place_id: string;
  description: string;
}

interface RouteStopSuggestion {
  place_id: string;
  name: string;
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



export default function HomeScreen() {
  const navigation = useNavigation<any>();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // User state
  const [userData, setUserData] = useState<UserData | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const isFetchingUnreadRef = useRef(false);

  // Plan Your Journey state
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [fromPlace, setFromPlace] = useState<RouteStopSuggestion | null>(
    null
  );
  const [toPlace, setToPlace] = useState<RouteStopSuggestion | null>(null);
  const [fromSuggestions, setFromSuggestions] = useState<
    RouteStopSuggestion[]
  >([]);
  const [toSuggestions, setToSuggestions] = useState<RouteStopSuggestion[]>(
    []
  );
  const [showFromSuggestions, setShowFromSuggestions] =
    useState<boolean>(false);
  const [showToSuggestions, setShowToSuggestions] = useState<boolean>(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);



  // For dynamic suggestion list positioning
  const fromInputRef = useRef<TextInput>(null);
  const toInputRef = useRef<TextInput>(null);


  // Load user data on component mount
  useEffect(() => {
    loadUserData();
    startAnimations();
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (isFetchingUnreadRef.current) {
      return;
    }

    isFetchingUnreadRef.current = true;
    try {
      const response = await notificationAPI.getUnreadCount();
      const rawCount =
        response?.data?.unreadCount ?? response?.unreadCount ?? null;

      if (typeof rawCount === "number" && Number.isFinite(rawCount)) {
        setUnreadCount(rawCount);
      } else {
        setUnreadCount(0);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        console.warn('Unread notification count access denied');
        setUnreadCount(0);
        return;
      }
      if (status === 404) {
        console.warn('Unread notification endpoint not found');
        setUnreadCount(0);
        return;
      }
      console.error("Failed to load unread notifications count", error);
    } finally {
      isFetchingUnreadRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      fetchUnreadCount();
      const interval = setInterval(() => {
        if (isActive) {
          fetchUnreadCount();
        }
      }, 60000);
      return () => {
        isActive = false;
        clearInterval(interval);
      };
    }, [fetchUnreadCount])
  );

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

  // Route stops autocomplete logic - Using Backend Database
  const fetchRouteStopsSuggestions = async (
    input: string,
    setSuggestions: React.Dispatch<
      React.SetStateAction<RouteStopSuggestion[]>
    >
  ) => {
    if (input.length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      console.log(`Fetching route stops suggestions for: "${input}"`);
      
      const response = await axios.get(
        `${API_BASE_URL}/api/routes/stops/autocomplete`,
        {
          params: {
            input: input
          },
          timeout: 5000
        }
      );
      
      console.log("Route stops API Response:", response.data);
      if (response.data.status === "OK") {
        setSuggestions(response.data.suggestions);
        console.log(`Found ${response.data.suggestions.length} route stop suggestions`);
      } else {
        console.warn(`Route stops API returned status: ${response.data.status}`);
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Error fetching route stops suggestions:", err);
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
      React.SetStateAction<RouteStopSuggestion[]>
    >
  ) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      fetchRouteStopsSuggestions(input, setSuggestions);
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

  const selectFromSuggestion = (item: RouteStopSuggestion) => {
    setFrom(item.description);
    setFromPlace(item);
    setShowFromSuggestions(false);
    Keyboard.dismiss();
  };

  const selectToSuggestion = (item: RouteStopSuggestion) => {
    setTo(item.description);
    setToPlace(item);
    setShowToSuggestions(false);
    Keyboard.dismiss();
  };

  // Search for routes between selected stops
  const handleJourneySearch = async () => {
    if (!fromPlace || !toPlace) {
      Alert.alert("Error", "Please select both from and to locations");
      return;
    }

    try {
      console.log('Searching routes between:', fromPlace.name, 'and', toPlace.name);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/routes/find`,
        {
          from: fromPlace.name,
          to: toPlace.name
        }
      );

      if (response.data.success) {
        // Navigate to results screen with route data
        navigation.navigate("BusRouteResults", {
          from: fromPlace,
          to: toPlace,
          routes: response.data.routes,
          routeCount: response.data.count
        });
      } else {
        Alert.alert("No Routes Found", "No bus routes found between selected locations");
      }
    } catch (error) {
      console.error('Error searching routes:', error);
      Alert.alert("Error", "Failed to search for routes. Please try again.");
    }
  };

  // Helper to render suggestion list inline below the input field
  const renderSuggestionList = (type: "from" | "to") => {
    const show =
      type === "from"
        ? showFromSuggestions && fromSuggestions.length > 0
        : showToSuggestions && toSuggestions.length > 0;
    const suggestions = type === "from" ? fromSuggestions : toSuggestions;
    const selectSuggestion =
      type === "from" ? selectFromSuggestion : selectToSuggestion;

    if (!show) return null;

    return (
      <View style={styles.suggestionBoxEnhanced}>
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
    <LinearGradient
      colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBackground}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Image
          source={require("../../assets/logowithoutbg_blue.png")}
          style={styles.backgroundImage}
        />

        <StatusBar
          barStyle="light-content"
          backgroundColor="#0056b3"
          translucent={false}
        />

        {/* --- ENHANCED HEADER --- */}
        <LinearGradient
          colors={['#0056b3', '#1976d2', '#42a5f5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
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
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                  </View>
                )}
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
              <Ionicons name="bus-outline" size={28} color="#fff" />
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
          ]}
        >
          <View style={styles.journeyCardWrapper}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.journeyCard}
            >
            <View style={styles.journeyHeader}>
              <Ionicons name="map-outline" size={22} color={AppColors.primary} />
              <Text style={styles.journeyTitle}>Plan Your Journey</Text>
            </View>

            {/* FROM */}
            <View style={{ marginBottom: 14 }}>
              <LinearGradient
                colors={["rgba(0, 86, 179, 0.03)", "rgba(0, 86, 179, 0.02)"]}
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
                    placeholder="From (Enter start location)"
                    style={styles.input}
                    placeholderTextColor="#154dadff"
                    value={from}
                    onChangeText={handleFromChange}
                    onFocus={() => {
                      setShowFromSuggestions(true);
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
              {renderSuggestionList("from")}
            </View>

            {/* TO */}
            <View style={{ marginBottom: 14 }}>
              <LinearGradient
                colors={["rgba(0, 86, 179, 0.03)", "rgba(0, 86, 179, 0.02)"]}
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
                    placeholder="To (Enter destination)"
                    style={styles.input}
                    placeholderTextColor="#154dadff"
                    value={to}
                    onChangeText={handleToChange}
                    onFocus={() => {
                      setShowToSuggestions(true);
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
              {renderSuggestionList("to")}
            </View>

            <TouchableOpacity
              style={[
                styles.searchButton,
                (!fromPlace || !toPlace) && { opacity: 0.5 },
              ]}
              onPress={handleJourneySearch}
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
          </View>
        </Animated.View>

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
                    navigation.navigate("BusTracking");
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
                    size={24}
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
                <Ionicons name={service.icon} size={26} color={AppColors.primary} />
                <Text style={styles.serviceCardText}>{service.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
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
    minHeight: 40,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: "center",
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
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  notificationBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  welcomeBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  welcomeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 3,
  },
  welcomeSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.primary,
    textAlign: "center",
    lineHeight: 24,
    includeFontPadding: false,
    marginBottom: 10,
  },
  journeyCardWrapper: {
    marginBottom: 14,
    borderRadius: 20,
    overflow: "visible",
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
  journeyCard: {
    padding: 18,
    borderRadius: 20,
    overflow: "visible",
  },
  journeyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  journeyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.primary,
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 14,
    borderRadius: 16,
  },
  inputGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 86, 179, 0.1)',
  },
  inputIcon: {
    marginRight: 12,
    color: AppColors.primary,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: AppColors.text,
    fontWeight: "500",
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    paddingHorizontal: 0,
    paddingRight: 38,
  },
  clearIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -10, // Adjust for icon vertical centering
    zIndex: 1000,
  },
  suggestionBoxEnhanced: {
    backgroundColor: "#FFFFFF",
    borderColor: 'rgba(0, 86, 179, 0.15)',
    borderWidth: 1,
    borderRadius: 16,
    maxHeight: 150,
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 0,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#0056b3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
    }),
  },
  suggestionScrollView: {
    maxHeight: 140, // Adjust this if the parent maxHeight is not enough
  },
  suggestionItemEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 86, 179, 0.08)',
    backgroundColor: "transparent",
  },
  suggestionText: {
    fontSize: 15, // Unified font size for readability
    color: AppColors.primary,
    fontWeight: "500",
    flexShrink: 1,
  },
  searchButton: {
    borderRadius: 16,
    marginTop: 6,
    overflow: "hidden",
  },
  searchButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
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
    gap: 8,
    marginHorizontal: -4,
  },
  quickActionCard: {
    width: "30.5%",
    aspectRatio: 0.95,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 86, 179, 0.1)',
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  quickActionIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E7F1FF',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  cardText: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 15,
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  serviceCard: {
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 86, 179, 0.1)',
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  serviceCardText: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.textSecondary,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 15,
    includeFontPadding: false,
  },
});