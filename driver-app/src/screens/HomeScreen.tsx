import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
  TextInput,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";

// Get device dimensions
import { Dimensions } from "react-native";
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// App Color Palette
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

const GOOGLE_MAPS_API_KEY = "AIzaSyAeXR9ct7HrHMCQXSWLrWQl5OlRYjNhbxo";

// TopHeader component with logo in square box
const TopHeader = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <View style={styles.headerLeftContainer}>
        <View style={styles.logoWrapper}>
          <Image
            source={require("../../assets/logowithoutbg_white.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.headerTitle}>
          BusHub<Text style={styles.superscript}>LK</Text> Driver
        </Text>
      </View>
      <View style={styles.headerIconContainer}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate("Notifications")}>
          <Ionicons name="notifications-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// WelcomeBanner component
const WelcomeBanner = () => (
  <LinearGradient
    colors={["#0056b3", "#0076e3"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.welcomeBanner}
  >
    <MaterialCommunityIcons
      name="bus"
      size={36}
      color="#fff"
      style={{ marginRight: 14 }}
    />
    <View>
      <Text style={styles.welcomeTitle}>Ready to Start, Michael?</Text>
      <Text style={styles.welcomeSubtitle}>Your bus is: WP-NA-8752</Text>
    </View>
  </LinearGradient>
);

// QuickActionButton component
const QuickActionButton = ({ icon, text, onPress }) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.quickActionIconContainer}>
      <MaterialCommunityIcons name={icon} size={26} color={AppColors.primary} />
    </View>
    <Text style={styles.cardText}>{text}</Text>
  </TouchableOpacity>
);

// Main HomeScreen Component
export default function HomeScreen() {
  const navigation = useNavigation();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromPlace, setFromPlace] = useState(null);
  const [toPlace, setToPlace] = useState(null);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const debounceTimeout = useRef(null);

  const fetchPlaceSuggestions = async (input, setSuggestions) => {
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Image
        source={require("../../assets/logoblue.png")}
        style={styles.backgroundImage}
        pointerEvents="none"
      />
      <StatusBar
        backgroundColor={AppColors.primary}
        barStyle="light-content"
        translucent={false}
      />
      <TopHeader />
      <WelcomeBanner />
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        <LinearGradient
          colors={["#fff", "#e6f0fa"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.journeyCard}
        >
          <Text style={styles.journeyTitle}>Your Current Trip</Text>
          <View style={[styles.inputGroup, { position: "relative", zIndex: showFromSuggestions ? 200 : 10 }]}>
            <Ionicons name="location-outline" size={20} color={AppColors.primary} style={styles.inputIcon} />
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="From (e.g., Kaduwela)"
                style={styles.input}
                placeholderTextColor="#A0A0A0"
                value={from}
                onChangeText={handleFromChange}
                onFocus={() => setShowFromSuggestions(true)}
                onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
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
                  <Ionicons name="close-circle" size={22} color="#bbb" />
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
          <View style={[styles.inputGroup, { position: "relative", zIndex: showToSuggestions ? 200 : 10 }]}>
            <Ionicons name="flag-outline" size={20} color={AppColors.primary} style={styles.inputIcon} />
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="To (e.g., Kollupitiya)"
                style={styles.input}
                placeholderTextColor="#A0A0A0"
                value={to}
                onChangeText={handleToChange}
                onFocus={() => setShowToSuggestions(true)}
                onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
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
                  <Ionicons name="close-circle" size={22} color="#bbb" />
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
            style={[styles.searchButton, (!fromPlace || !toPlace) && { opacity: 0.5 }]}
            onPress={() => navigation.navigate("MapScreen", { fromPlace, toPlace })}
            disabled={!fromPlace || !toPlace}
          >
            <Text style={styles.searchButtonText}>View Route Details</Text>
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionGrid}>
            <QuickActionButton
              icon="bus-clock"
              text="Travel Log"
              onPress={() => navigation.navigate("TravelLog")}
            />
            <QuickActionButton
              icon="car-wrench"
              text="Bus Condition"
              onPress={() => navigation.navigate("Condition")}
            />
            <QuickActionButton
              icon="alert-circle"
              text="Emergency"
              onPress={() => navigation.navigate("Emergency")}
            />
            <QuickActionButton
              icon="magnify"
              text="Lost & Found"
              onPress={() => navigation.navigate("LostAndFound")}
            />
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
  backgroundImage: {
    position: "absolute",
    top: screenHeight * 0.35,
    left: screenWidth * 0.1,
    width: screenWidth * 0.8,
    height: screenHeight * 0.4,
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
    paddingVertical: Platform.OS === "ios" ? 15 : 16,
    height: Platform.OS === "ios" ? 70 : 65,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoWrapper: {
    width: 45,
    height: 45,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginRight: 10,
  },
  headerLogo: {
    width: 50,
    height: 50,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 20 : 18,
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    lineHeight: Platform.OS === "ios" ? 26 : 24,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  superscript: {
    fontSize: Platform.OS === "ios" ? 10 : 9,
    lineHeight: Platform.OS === "ios" ? 12 : 11,
    textAlignVertical: "top",
    includeFontPadding: false,
    ...Platform.select({
      ios: {
        transform: [{ translateY: -16 }],
        position: "relative",
        top: -6,
      },
      android: {
        transform: [{ translateY: -12 }],
        position: "relative",
        top: -4,
      },
    }),
  },
  headerIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    padding: 5,
    marginLeft: 10,
  },
  welcomeBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 18,
    marginTop: 30,
    minHeight: Platform.OS === "android" ? 80 : 75,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: Platform.OS === "ios" ? 18 : 17,
    fontWeight: "bold",
    lineHeight: Platform.OS === "ios" ? 24 : 22,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  welcomeSubtitle: {
    color: "#fff",
    fontSize: Platform.OS === "ios" ? 14 : 13,
    marginTop: 2,
    lineHeight: Platform.OS === "ios" ? 18 : 17,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: Platform.OS === "ios" ? 20 : 19,
    fontWeight: "600",
    color: AppColors.text,
    textAlign: "center",
    lineHeight: Platform.OS === "ios" ? 26 : 24,
    includeFontPadding: false,
  },
  journeyCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  journeyTitle: {
    fontSize: Platform.OS === "ios" ? 18 : 17,
    fontWeight: "600",
    color: AppColors.primary,
    marginBottom: 16,
    textAlign: "center",
    lineHeight: Platform.OS === "ios" ? 24 : 22,
    includeFontPadding: false,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 86, 179, 0.07)",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    minHeight: Platform.OS === "android" ? 52 : 48,
  },
  inputIcon: {
    marginRight: 10,
    color: AppColors.primary,
  },
  input: {
    flex: 1,
    fontSize: Platform.OS === "ios" ? 16 : 15,
    color: AppColors.text,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    lineHeight: Platform.OS === "ios" ? 20 : 19,
    includeFontPadding: false,
    textAlignVertical: "center",
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
    top: Platform.OS === "ios" ? 48 : 52,
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
    ...Platform.select({
      android: {
        elevation: 15,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    backgroundColor: "#fff",
  },
  searchButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: Platform.OS === "ios" ? 16 : 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 16 : 15,
    fontWeight: "600",
    lineHeight: Platform.OS === "ios" ? 20 : 19,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  quickActionGrid: {
    top: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 4,
    marginHorizontal: -2,
  },
  quickActionCard: {
    width: "48%",
    height: Platform.OS === "ios" ? 100 : 95,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.card,
    borderRadius: 18,
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 12,
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
});