import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import TrackingStatusBanner from "../components/TrackingStatusBanner";
import { useDriver } from "../context/DriverContext";
import { useNotifications } from "../context/NotificationContext";
import { useNotificationLogic } from "../hooks/useNotificationLogic";
import { driverAPI, storageAPI } from "../services/api";

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

// TopHeader component with improved visibility
const TopHeader = () => {
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();

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
          BusHubLK
        </Text>
      </View>
      <View style={styles.headerIconContainer}>
        <TouchableOpacity 
          style={styles.headerIcon} 
          onPress={() => (navigation as any).navigate("Notifications")}
        >
          <Ionicons name="notifications-outline" size={28} color="#FFFFFF" />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// WelcomeBanner component with dynamic data
const WelcomeBanner = () => {
  const { driverData, isLoading, error } = useDriver();
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setScheduleLoading(true);
        const userData = await storageAPI.getUserData();

        if (!userData || (!userData.user_id && !userData.driver_id)) {
          console.error('No valid user ID found in storage');
          return;
        }

        const driverId = userData.driver_id || userData.user_id;
        console.log('Fetching schedule for driver:', driverId);

        const response = await driverAPI.getUpcomingAssignments(driverId.toString(), 7);
        console.log('Schedule response:', response);

        if (response && Array.isArray(response)) {
          setScheduleData(response);
        } else {
          setScheduleData([]);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
        setScheduleData([]);
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchScheduleData();
  }, []);

  const getDriverName = () => {
    if (isLoading) return "Loading...";
    if (error) return "Driver";
    return driverData?.first_name || "Driver";
  };

  const getScheduleInfo = () => {
    if (scheduleLoading) return "Loading schedule...";
    if (scheduleData.length === 0) return "No upcoming assignments";

    // Find today's assignment
    const today = new Date().toISOString().split('T')[0];
    const todayAssignment = scheduleData.find(assignment =>
      assignment.assignment_date === today
    );

    if (todayAssignment) {
      const busReg = todayAssignment.bus_registration || `Bus ${todayAssignment.bus_id}`;
      const route = todayAssignment.route_number || `Route ${todayAssignment.route_id}`;
      return `Today: ${busReg} on ${route}`;
    }

    // If no today assignment, show next upcoming
    const nextAssignment = scheduleData[0];
    if (nextAssignment) {
      const date = new Date(nextAssignment.assignment_date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const busReg = nextAssignment.bus_registration || `Bus ${nextAssignment.bus_id}`;
      const route = nextAssignment.route_number || `Route ${nextAssignment.route_id}`;
      return `${dayName}: ${busReg} on ${route}`;
    }

    return "No upcoming assignments";
  };

  return (
    <LinearGradient
      colors={["#0056b3", "#0076e3", "#1e88e5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.welcomeBanner}
    >
      <View style={styles.busIconContainer}>
        <MaterialCommunityIcons
          name="bus"
          size={48}
          color="#fff"
        />
      </View>
      <View style={styles.welcomeTextContainer}>
        <Text style={styles.welcomeTitle}>Ready to Start, {getDriverName()}?</Text>
        <Text style={styles.welcomeSubtitle}>{getScheduleInfo()}</Text>
      </View>
    </LinearGradient>
  );
};

// QuickActionButton component (unchanged)
const QuickActionButton = ({ icon, text, onPress }) => (
  <TouchableOpacity
    style={styles.quickActionCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.quickActionIconContainer}>
      <MaterialCommunityIcons name={icon} size={26} color={AppColors.primary} />
    </View>
    <Text style={styles.cardText}>{text}</Text>
  </TouchableOpacity>
);

// Main HomeScreen Component
export default function HomeScreen() {
  const navigation = useNavigation();
  const { refreshDriverData } = useDriver();
  
  // Initialize notification logic
  useNotificationLogic();

  // Pull to refresh functionality
  const onRefresh = React.useCallback(() => {
    refreshDriverData();
  }, [refreshDriverData]);

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
        <TrackingStatusBanner onPress={() => navigation.navigate("Tracking" as never)} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionGrid}>
            <QuickActionButton
              icon="map-marker-radius"
              text="Tracking Data"
              onPress={() => navigation.navigate("Tracking")}
            />
            <QuickActionButton
              icon="alert-circle"
              text="Emergency"
              onPress={() => navigation.navigate("Emergency")}
            />

            <QuickActionButton
              icon="car-wrench"
              text="Bus Condition"
              onPress={() => navigation.navigate("Condition")}
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
    top: screenHeight * 0.55,
    left: screenWidth * 0.1,
    width: screenWidth * 0.8,
    height: screenHeight * 0.4,
    opacity: 0.15,
    resizeMode: "contain",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 100 : 120, // Increased for new tab bar
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.primary,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 12 : 12,
    minHeight: Platform.OS === "ios" ? 60 : 60,
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
    width: 35,
    height: 35,
    borderRadius: 8, // Square with rounded corners
    backgroundColor: "none",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginRight: 10,
  },
  headerLogo: {
    width: 70,
    height: 40,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    lineHeight: Platform.OS === "ios" ? 22 : 22,
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
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 20,
    minHeight: Platform.OS === "android" ? 75 : 70,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  busIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
      },
    }),
  },
  welcomeTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: Platform.OS === "ios" ? 18 : 17,
    fontWeight: "bold",
    lineHeight: Platform.OS === "ios" ? 24 : 22,
    includeFontPadding: false,
    textAlignVertical: "center",
    marginBottom: 3,
  },
  welcomeSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: Platform.OS === "ios" ? 14 : 13,
    fontWeight: "500",
    lineHeight: Platform.OS === "ios" ? 18 : 16,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: Platform.OS === "ios" ? 19 : 18,
    fontWeight: "600",
    color: AppColors.text,
    textAlign: "center",
    lineHeight: Platform.OS === "ios" ? 24 : 22,
    includeFontPadding: false,
  },
  journeyCard: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 24,
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
    height: Platform.OS === "ios" ? 85 : 80,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.card,
    borderRadius: 18,
    paddingHorizontal: 5,
    paddingVertical: 8,
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
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: AppColors.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    lineHeight: 16,
  },
});
