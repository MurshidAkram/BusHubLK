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
};

// TopHeader component with improved visibility
const TopHeader = () => {
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();

  return (
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
            style={styles.headerIconWrapper} 
            onPress={() => (navigation as any).navigate("Notifications")}
          >
            <View style={styles.iconBackgroundEnhanced}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

// WelcomeBanner component with dynamic data - exported to share scheduleData
const WelcomeBanner = ({ onScheduleDataChange }: { onScheduleDataChange?: (data: any[]) => void }) => {
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
          if (onScheduleDataChange) {
            onScheduleDataChange(response);
          }
        } else {
          setScheduleData([]);
          if (onScheduleDataChange) {
            onScheduleDataChange([]);
          }
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
        setScheduleData([]);
        if (onScheduleDataChange) {
          onScheduleDataChange([]);
        }
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
      colors={[AppColors.primary, AppColors.primaryLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.welcomeBanner}
    >
      <View style={styles.welcomeIconContainer}>
        <MaterialCommunityIcons
          name="bus"
          size={32}
          color="#fff"
        />
      </View>
      <View style={styles.welcomeTextContainer}>
        <Text style={styles.welcomeTitle}>Ready to Start, {getDriverName()}? 👋</Text>
        <Text style={styles.welcomeSubtitle}>{getScheduleInfo()}</Text>
      </View>
    </LinearGradient>
  );
};

// QuickActionButton component
const QuickActionButton = ({ icon, text, onPress }: { icon: any; text: string; onPress: () => void }) => (
  <TouchableOpacity
    style={styles.quickActionCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.quickActionIconContainer}>
      <MaterialCommunityIcons name={icon} size={36} color={AppColors.primary} />
    </View>
    <Text style={styles.cardText}>{text}</Text>
  </TouchableOpacity>
);

// Active Route Tracking Card Component
const ActiveRouteCard = ({ scheduleData }: { scheduleData: any[] }) => {
  const navigation = useNavigation();
  
  // Find today's assignment
  const today = new Date().toISOString().split('T')[0];
  const todayAssignment = scheduleData.find(assignment =>
    assignment.assignment_date === today
  );

  if (!todayAssignment) return null;

  const busReg = todayAssignment.bus_registration || `Bus ${todayAssignment.bus_id}`;
  const route = todayAssignment.route_number || `Route ${todayAssignment.route_id}`;

  return (
    <TouchableOpacity
      style={styles.activeRouteCard}
      onPress={() => (navigation as any).navigate("Tracking")}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#10B981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.activeRouteGradient}
      >
        <View style={styles.activeRouteHeader}>
          <View style={styles.activeRouteBadge}>
            <View style={styles.pulseIndicator} />
            <Text style={styles.activeRouteStatus}>ACTIVE NOW</Text>
          </View>
          <Ionicons name="navigate-circle" size={28} color="#FFFFFF" />
        </View>
        
        <View style={styles.activeRouteContent}>
          <Text style={styles.activeRouteTitle}>Today's Route</Text>
          <View style={styles.activeRouteDetails}>
            <View style={styles.activeRouteDetailItem}>
              <Ionicons name="bus-outline" size={20} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.activeRouteDetailText}>{busReg}</Text>
            </View>
            <View style={styles.activeRouteDetailItem}>
              <Ionicons name="location-outline" size={20} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.activeRouteDetailText}>{route}</Text>
            </View>
          </View>
        </View>

        <View style={styles.activeRouteAction}>
          <Text style={styles.activeRouteActionText}>Tap to view tracking</Text>
          <Ionicons name="chevron-forward" size={22} color="rgba(255, 255, 255, 0.9)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Main HomeScreen Component
export default function HomeScreen() {
  const navigation = useNavigation();
  const { refreshDriverData } = useDriver();
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  
  // Initialize notification logic
  useNotificationLogic();

  // Pull to refresh functionality
  const onRefresh = React.useCallback(() => {
    refreshDriverData();
  }, [refreshDriverData]);

  const handleScheduleDataChange = (data: any[]) => {
    setScheduleData(data);
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
          source={require("../../assets/logoblue.png")}
          style={styles.backgroundImage}
        />
        <StatusBar
          backgroundColor="#0056b3"
          barStyle="light-content"
          translucent={false}
        />
        <TopHeader />
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          <WelcomeBanner onScheduleDataChange={handleScheduleDataChange} />
          
          {/* Active Route Card - Shows when schedule is active */}
          <ActiveRouteCard scheduleData={scheduleData} />
          
          <TrackingStatusBanner onPress={() => navigation.navigate("Tracking" as never)} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionGrid}>
              <QuickActionButton
                icon="map-marker-radius"
                text="Tracking Data"
                onPress={() => navigation.navigate("Tracking" as never)}
              />
              <QuickActionButton
                icon="alert-circle"
                text="Emergency"
                onPress={() => navigation.navigate("Emergency" as never)}
              />

              <QuickActionButton
                icon="car-wrench"
                text="Bus Condition"
                onPress={() => navigation.navigate("Condition" as never)}
              />

              <QuickActionButton
                icon="magnify"
                text="Lost & Found"
                onPress={() => navigation.navigate("LostAndFound" as never)}
              />
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
    left: 0,
    width: screenWidth,
    height: screenHeight * 0.35,
    opacity: 0.3,
    resizeMode: "contain",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 100 : 120,
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
  headerIconWrapper: {
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
    padding: 22,
    marginBottom: 16,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
  welcomeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  welcomeSubtitle: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
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
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.primary,
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 24,
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
    fontSize: 15,
    color: AppColors.text,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    lineHeight: 20,
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
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  quickActionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    width: "48%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 12,
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E7F1FF',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
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
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.text,
    textAlign: "center",
    lineHeight: 19,
    includeFontPadding: false,
  },
  // Active Route Card Styles
  activeRouteCard: {
    borderRadius: 22,
    marginBottom: 18,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 10,
      },
      ios: {
        shadowColor: "#10B981",
        shadowOpacity: 0.35,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
    }),
  },
  activeRouteGradient: {
    padding: 24,
    borderRadius: 22,
  },
  activeRouteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  activeRouteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  pulseIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  activeRouteStatus: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  activeRouteContent: {
    marginBottom: 16,
  },
  activeRouteTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.4,
  },
  activeRouteDetails: {
    gap: 10,
  },
  activeRouteDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  activeRouteDetailText: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
    letterSpacing: 0.2,
  },
  activeRouteAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  activeRouteActionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
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
});
