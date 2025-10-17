import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { driverAPI, storageAPI } from "../services/api";
import { locationService } from "../services/locationService";

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Enhanced App Color Palette
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
  success: "#059669",
  warning: "#D97706",
  info: "#0284C7",
};

// Define the assignment interface based on the actual database response
interface DailyAssignment {
  assignment_id: number;
  depot_id: number;
  bus_id: number;
  route_id: number;
  driver_id: number;
  conductor_id?: number;
  assignment_date: string;
  shift_start_time?: string;
  shift_end_time?: string;
  status: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  // Joined data from the database query
  bus_registration?: string;
  bus_class?: string;
  bus_manufacturer?: string;
  bus_model?: string;
  route_number?: string;
  route_name?: string;
  start_location?: string;
  end_location?: string;
  depot_name?: string;
  driver_name?: string;
  conductor_name?: string;
  conductor_phone_number?: string;
}

// Enhanced Header component
const Header = ({ onRefresh }: { onRefresh: () => void }) => (
  <LinearGradient
    colors={[AppColors.primary, AppColors.primaryLight]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.header}
  >
    <View style={styles.headerContent}>
      <View style={styles.titleContainer}>
        <Ionicons
          name="calendar-outline"
          size={24}
          color="#FFFFFF"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.headerTitle}>My Schedule</Text>
      </View>
      <TouchableOpacity style={styles.headerActionButton} onPress={onRefresh}>
        <View style={styles.iconBackgroundEnhanced}>
          <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  </LinearGradient>
);

// Weather icon component
const WeatherIcon = ({ weather }: { weather: string }) => {
  const getWeatherIcon = () => {
    switch (weather) {
      case "sunny":
        return "sunny-outline";
      case "cloudy":
        return "cloudy-outline";
      case "rainy":
        return "rainy-outline";
      default:
        return "partly-sunny-outline";
    }
  };

  return (
    <Ionicons
      name={getWeatherIcon()}
      size={20}
      color={AppColors.textSecondary}
      style={styles.weatherIcon}
    />
  );
};

// Simplified schedule card component
const ScheduleCard = ({ schedule, index, isTodayAssignment, navigation }: { 
  schedule: DailyAssignment; 
  index: number; 
  isTodayAssignment: boolean;
  navigation: any;
}) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isTracking, setIsTracking] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Check if tracking is active for this assignment
    checkTrackingStatus();
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  const checkTrackingStatus = async () => {
    try {
      // Check location service status using the async method
      const isActive = await locationService.isTrackingActive();
      if (isActive) {
        setIsTracking(true);
      } else {
        setIsTracking(false);
      }
    } catch (error) {
      console.error('Error checking tracking status:', error);
      setIsTracking(false);

    }
  };

  const handleStartRoute = async () => {
    try {
      // Check if cooldown is active
      if (cooldownRemaining > 0) {
        Alert.alert(
          "⏳ Please Wait",
          `The tracking system needs a moment to reset after stopping.\n\nPlease wait ${cooldownRemaining} more second${cooldownRemaining !== 1 ? 's' : ''} before starting again.\n\nThis ensures a clean restart and prevents conflicts.`,
          [{ text: "OK" }]
        );
        return;
      }

      setIsStarting(true);

      // Validate that required fields are present
      if (!schedule.assignment_id || !schedule.bus_id || !schedule.route_id || !schedule.driver_id) {
        console.error('❌ Missing required assignment fields:', {
          assignment_id: schedule.assignment_id,
          bus_id: schedule.bus_id,
          route_id: schedule.route_id,
          driver_id: schedule.driver_id,
        });
        Alert.alert(
          "Invalid Assignment Data",
          "This assignment is missing required information. Please contact support or try refreshing the schedule.",
          [{ text: "OK" }]
        );
        setIsStarting(false);
        return;
      }

      // Set the current assignment in location service first

      await locationService.setCurrentAssignment({

        bus_id: schedule.bus_id,
        route_id: schedule.route_id,
        driver_id: schedule.driver_id,
        assignment_id: schedule.assignment_id,
      });


      // Use the location service for EAS build with smart tracking
      console.log("🚀 Starting location service for EAS build...");

      await locationService.startSmartLocationTracking(
        schedule.bus_id.toString(),
        schedule.route_id.toString(),
        schedule.bus_registration
      );
      console.log("✅ Location service started successfully");

      // Update local state

      setIsTracking(true);
      setIsStarting(false);

      Alert.alert(
        "🚌 Route Started",
        `Continuous tracking started for Bus ${schedule.bus_registration || schedule.bus_id} on Route ${schedule.route_number || schedule.route_id}.\n\nYour location will be tracked even when the app is closed or in the background.`,
        [
          { 
            text: "View Tracking",
            onPress: () => {
              // Navigate to Tracking screen to show active tracking
              if (navigation) {
                navigation.navigate('Tracking');
              }
            }
          },
          { text: "OK" }

        ]
      );
    } catch (error) {
      console.error("Error starting route:", error);
      Alert.alert("Error", "Failed to start route tracking. Please try again.");

      setIsStarting(false);
    }
  };

  const handleEndRoute = async () => {
    // Check if ending schedule before scheduled end time
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes since midnight
    
    let isEndingEarly = false;
    if (schedule.shift_end_time) {
      const [endHours, endMinutes] = schedule.shift_end_time.split(':').map(Number);
      const scheduledEndTime = endHours * 60 + endMinutes;
      isEndingEarly = currentTime < scheduledEndTime;
    }

    const title = isEndingEarly ? "End Schedule Early?" : "End Schedule?";
    const message = isEndingEarly 
      ? `Your scheduled end time is ${schedule.shift_end_time ? schedule.shift_end_time.slice(0, 5) : 'not set'}. Are you sure you want to end this schedule early? Location tracking will stop.`
      : "Are you sure you want to end this schedule? Location tracking will stop.";

    Alert.alert(
      title,
      message,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "End Schedule",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🛑 Ending schedule - stopping main location service...");
              
              // Stop main location service
              locationService.stopLocationTracking();
              
              setIsTracking(false);
              console.log("✅ Main location service stopped successfully");

              // Start cooldown timer (3 seconds)
              const cooldownSeconds = 3;
              setCooldownRemaining(cooldownSeconds);
              
              // Clear any existing timer
              if (cooldownTimerRef.current) {
                clearInterval(cooldownTimerRef.current);
              }
              
              // Countdown timer
              let remaining = cooldownSeconds;
              cooldownTimerRef.current = setInterval(() => {
                remaining -= 1;
                setCooldownRemaining(remaining);
                
                if (remaining <= 0) {
                  if (cooldownTimerRef.current) {
                    clearInterval(cooldownTimerRef.current);
                    cooldownTimerRef.current = null;
                  }
                }
              }, 1000);

              Alert.alert(
                "✅ Schedule Ended",
                "Location tracking has been stopped and schedule completed successfully.",
                [{ text: "OK" }]
              );
            } catch (error) {
              console.error("Error ending route:", error);
              Alert.alert("Error", "Failed to stop route tracking completely.");
            }
          }
        }
      ]
    );
  };

  // Helper function to format date display
  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Simple weather assignment based on day (for demo purposes)
  const getWeatherForDay = (dateString: string) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    const weatherOptions = ['sunny', 'cloudy', 'rainy'];
    return weatherOptions[dayOfWeek % 3];
  };

  return (
    <Animated.View
      style={[
        styles.scheduleCard,
        isTodayAssignment && styles.todayCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={
          isTodayAssignment
            ? [AppColors.primary, AppColors.primaryLight]
            : ["#FFFFFF", "#F8FAFF"]
        }
        style={styles.cardGradient}
      >
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <View style={styles.dateContainer}>
            <Text style={[styles.dayName, isTodayAssignment && styles.todayText]}>
              {formatDateDisplay(schedule.assignment_date)}
            </Text>
            <Text style={[styles.dateText, isTodayAssignment && styles.todayText]}>
              {new Date(schedule.assignment_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
          <WeatherIcon weather={getWeatherForDay(schedule.assignment_date)} />
        </View>

        {/* Bus Assignment */}
        <View style={styles.assignmentContainer}>
          <View style={styles.busInfo}>
            <LinearGradient
              colors={
                isTodayAssignment
                  ? ["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.1)"]
                  : [AppColors.primaryMuted, "rgba(0, 86, 179, 0.05)"]
              }
              style={styles.busNumberBadge}
            >
              <Ionicons
                name="bus-outline"
                size={24}
                color={isTodayAssignment ? "#FFFFFF" : AppColors.primary}
              />
              <Text style={[styles.busNumber, isTodayAssignment && styles.todayText]}>
                {schedule.bus_registration || `Bus ${schedule.bus_id}`}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.routeInfo}>
            <View style={styles.routeHeader}>
              <Text
                style={[styles.routeNumber, isTodayAssignment && styles.todayRouteNumber]}
              >
                Route {schedule.route_number || schedule.route_id}
              </Text>
            </View>
            <Text style={[styles.routeName, isTodayAssignment && styles.todayText]}>
              {schedule.route_name 
                ? (schedule.start_location && schedule.end_location 
                    ? `${schedule.start_location} - ${schedule.end_location}`
                    : schedule.route_name)
                : `Route ${schedule.route_id}`}
            </Text>
          </View>
        </View>

        {/* Assignment Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons
                name="person-outline"
                size={18}
                color={isTodayAssignment ? "rgba(255, 255, 255, 0.8)" : AppColors.primary}
              />
              <View style={styles.detailTextContainer}>
                <Text
                  style={[
                    styles.detailLabel,
                    isTodayAssignment && styles.todayDetailLabel,
                  ]}
                >
                  Conductor
                </Text>
                <Text style={[styles.detailValue, isTodayAssignment && styles.todayText]}>
                  {schedule.conductor_name || (schedule.conductor_id ? `Conductor ${schedule.conductor_id}` : 'Not Assigned')}
                </Text>
                {schedule.conductor_phone_number && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Ionicons
                        name="call-outline"
                        size={18}
                        color={isTodayAssignment ? "rgba(255, 255, 255, 0.8)" : AppColors.primary}
                      />
                      <View style={styles.detailTextContainer}>
                        <Text style={[styles.detailValue, isTodayAssignment && styles.todayText]}>
                          {schedule.conductor_phone_number}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>


          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons
                name="location-outline"
                size={18}
                color={isTodayAssignment ? "rgba(255, 255, 255, 0.8)" : AppColors.primary}
              />
              <View style={styles.detailTextContainer}>
                <Text
                  style={[
                    styles.detailLabel,
                    isTodayAssignment && styles.todayDetailLabel,
                  ]}
                >
                  Depot
                </Text>
                <Text style={[styles.detailValue, isTodayAssignment && styles.todayText]}>
                  {schedule.depot_name || `Depot ${schedule.depot_id}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Shift Time */}
          {(schedule.shift_start_time || schedule.shift_end_time) && (
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={isTodayAssignment ? "rgba(255, 255, 255, 0.8)" : AppColors.primary}
                />
                <View style={styles.detailTextContainer}>
                  <Text
                    style={[
                      styles.detailLabel,
                      isTodayAssignment && styles.todayDetailLabel,
                    ]}
                  >
                    Shift Time
                  </Text>
                  <Text style={[styles.detailValue, isTodayAssignment && styles.todayText]}>
                    {schedule.shift_start_time ? schedule.shift_start_time.slice(0, 5) : '--:--'} - {schedule.shift_end_time ? schedule.shift_end_time.slice(0, 5) : '--:--'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons - Only for today */}
        {isTodayAssignment && (
          <View style={styles.actionButtonsContainer}>
            {!isTracking ? (
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  cooldownRemaining > 0 && styles.actionButtonDisabled
                ]} 
                onPress={handleStartRoute}
                disabled={isStarting || cooldownRemaining > 0}
              >
                <LinearGradient
                  colors={
                    cooldownRemaining > 0
                      ? ["rgba(156, 163, 175, 0.5)", "rgba(107, 114, 128, 0.5)"]
                      : ["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.1)"]
                  }
                  style={styles.actionButtonGradient}
                >
                  {isStarting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : cooldownRemaining > 0 ? (
                    <>
                      <Ionicons name="time-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>
                        Wait {cooldownRemaining}s...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="play-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Start Schedule</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.trackingIndicator}>
                  <View style={styles.trackingDot} />
                  <Text style={styles.trackingText}>Tracking Active</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.endButton]} 
                  onPress={handleEndRoute}
                >
                  <LinearGradient
                    colors={["rgba(239, 68, 68, 0.9)", "rgba(220, 38, 38, 0.9)"]}
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons name="stop-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>End Schedule</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const ScheduleScreen = ({ navigation }: any) => {
  const [schedules, setSchedules] = useState<DailyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    startAnimations();
    loadSchedules();
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
    ]).start();
  };

  const loadSchedules = async () => {
    try {
      setError(null);
      const userData = await storageAPI.getUserData();
      
      console.log('User data retrieved:', userData);
      
      if (!userData || (!userData.user_id && !userData.driver_id)) {
        console.error('No valid user ID found in storage');
        throw new Error('User data not found. Please login again.');
      }

      // Use driver_id for driver app, user_id for passenger app
      const driverId = userData.driver_id || userData.user_id;
      console.log('Loading schedules for driver:', driverId);
      
      let response;
      let usedUpcomingEndpoint = false;
      
      try {
        // Try the new upcoming assignments endpoint first
        console.log('Attempting to fetch upcoming assignments for driver:', driverId);
        response = await driverAPI.getUpcomingAssignments(driverId.toString(), 7);
        console.log('Successfully fetched upcoming assignments:', response);
        usedUpcomingEndpoint = true;
        
        // Check if we got an error response from the server
        if (response && response.error) {
          throw new Error(response.error);
        }
      } catch (upcomingError) {
        console.log('Upcoming assignments endpoint failed:', upcomingError);
        
        // Only fallback to single assignment endpoint if upcoming endpoint truly failed
        // Not if it returned an empty array or valid response
        if (!usedUpcomingEndpoint) {
          console.log('Falling back to single assignment endpoint');
          try {
            response = await driverAPI.getDailyAssignment(driverId.toString());
            console.log('Fallback to single assignment successful:', response);
          } catch (fallbackError) {
            console.error('Both endpoints failed. Upcoming error:', upcomingError, 'Fallback error:', fallbackError);
            throw new Error('Failed to load any assignments. Please check your connection and try again.');
          }
        } else {
          // If we successfully called upcoming endpoint but got an error, don't fallback
          throw upcomingError;
        }
      }
      
      console.log('Final API Response:', response);
      
      if (response && Array.isArray(response)) {
        // Sort assignments: today's assignment first, then by date
        const sortedSchedules = [...response].sort((a, b) => {
          const dateA = new Date(a.assignment_date);
          const dateB = new Date(b.assignment_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const isATodayAssignment = dateA.toDateString() === today.toDateString();
          const isBTodayAssignment = dateB.toDateString() === today.toDateString();
          
          // Today's assignment comes first
          if (isATodayAssignment && !isBTodayAssignment) return -1;
          if (!isATodayAssignment && isBTodayAssignment) return 1;
          
          // If both are today or both are future/past, sort by date (ascending)
          return dateA.getTime() - dateB.getTime();
        });
        
        setSchedules(sortedSchedules);
        console.log('Loaded and sorted schedules array:', sortedSchedules.length, 'assignments');
        // Debug: Log first assignment structure
        if (sortedSchedules.length > 0) {
          console.log('First assignment structure:', {
            assignment_id: sortedSchedules[0].assignment_id,
            bus_id: sortedSchedules[0].bus_id,
            route_id: sortedSchedules[0].route_id,
            driver_id: sortedSchedules[0].driver_id,
            assignment_date: sortedSchedules[0].assignment_date,
          });
          console.log('First assignment full object:', JSON.stringify(sortedSchedules[0], null, 2));
        }
      } else if (response && !response.error && !Array.isArray(response)) {
        // If we get a single assignment, put it in an array
        setSchedules([response]);
        console.log('Loaded single schedule (wrapped in array)');
        // Debug: Log assignment structure
        console.log('Single assignment structure:', {
          assignment_id: response.assignment_id,
          bus_id: response.bus_id,
          route_id: response.route_id,
          driver_id: response.driver_id,
          assignment_date: response.assignment_date,
        });
        console.log('Single assignment full object:', JSON.stringify(response, null, 2));
      } else if (response && response.success === false) {
        // Handle explicit error response
        throw new Error(response.error || response.message || 'Failed to load schedules');
      } else {
        // No data found or empty response
        setSchedules([]);
        console.log('No schedules found or empty response');
      }
    } catch (error: any) {
      console.error('Error loading schedules:', error);
      
      // Check if the error is related to invalid or expired token
      const errorMessage = error.message || 'Failed to load schedules';
      const isTokenError = errorMessage.toLowerCase().includes('token') || 
                          errorMessage.toLowerCase().includes('expired') ||
                          errorMessage.toLowerCase().includes('invalid') ||
                          errorMessage.toLowerCase().includes('unauthorized');
      
      if (isTokenError) {
        const userFriendlyMessage = 'Your session has expired. Please log in again.';
        setError(userFriendlyMessage);
        Alert.alert(
          'Session Expired',
          userFriendlyMessage,
          [
            {
              text: 'OK',
              onPress: () => {
                // Optionally navigate to login screen
                // navigation?.navigate('Login');
              }
            }
          ]
        );
      } else {
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedules();
    setRefreshing(false);
  };

  // Helper function to format date display
  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Helper function to determine if assignment is for today
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Background */}
      <LinearGradient
        colors={["rgba(0, 86, 179, 0.05)", "rgba(0, 118, 227, 0.05)"]}
        style={styles.backgroundGradient}
      />

      <StatusBar
        barStyle="light-content"
        backgroundColor={AppColors.primary}
        translucent={false}
      />

      <Header onRefresh={onRefresh} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AppColors.primary]}
            tintColor={AppColors.primary}
          />
        }
      >
        {/* Welcome Message */}
        <Animated.View
          style={[
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <LinearGradient
            colors={[AppColors.primary, AppColors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeContainer}
          >
            <View style={styles.welcomeContent}>
              <Ionicons
                name="checkmark-circle-outline"
                size={28}
                color="#FFFFFF"
              />
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeTitle}>Ready to Drive!</Text>
                <Text style={styles.welcomeSubtitle}>
                  Your upcoming bus assignments
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Schedule Cards */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={styles.loadingText}>Loading your schedule...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={AppColors.red} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadSchedules}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : schedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={AppColors.textSecondary} />
            <Text style={styles.emptyTitle}>No Schedules Found</Text>
            <Text style={styles.emptyMessage}>You don't have any assignments at the moment.</Text>
          </View>
        ) : (
          <View style={styles.schedulesContainer}>
            {schedules.map((schedule, index) => (
              <ScheduleCard
                key={schedule.assignment_id}
                schedule={schedule}
                index={index}
                isTodayAssignment={isToday(schedule.assignment_date)}
                navigation={navigation}
              />
            ))}
          </View>
        )}

       
      </ScrollView>
    </SafeAreaView>
  );
};

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
  header: {
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === "ios" ? 20 : 22,
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
    minHeight: 52,
    marginTop: 8,
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
    marginTop: 4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 21 : 20,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    letterSpacing: 0.6,
    includeFontPadding: false,
    textAlignVertical: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerActionButton: {
    padding: 4,
    marginTop: 4,
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
  },
  welcomeContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
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
  welcomeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  welcomeTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 18 : 17,
    fontWeight: "700",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  welcomeSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: Platform.OS === "ios" ? 14 : 13,
    fontWeight: "500",
  },
  schedulesContainer: {
    marginBottom: 24,
  },
  scheduleCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  todayCard: {
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
  cardGradient: {
    padding: 20,
  },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dateContainer: {
    flex: 1,
  },
  dayName: {
    fontSize: Platform.OS === "ios" ? 20 : 18,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  dateText: {
    fontSize: Platform.OS === "ios" ? 14 : 13,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  todayText: {
    color: "#FFFFFF",
  },
  weatherIcon: {
    marginLeft: 8,
  },
  assignmentContainer: {
    marginBottom: 20,
  },
  busInfo: {
    marginBottom: 16,
  },
  busNumberBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  busNumber: {
    fontSize: Platform.OS === "ios" ? 18 : 17,
    fontWeight: "700",
    color: AppColors.primary,
    marginLeft: 12,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  routeInfo: {
    paddingLeft: 4,
  },
  routeHeader: {
    marginBottom: 6,
  },
  routeNumber: {
    fontSize: Platform.OS === "ios" ? 14 : 13,
    fontWeight: "600",
    color: AppColors.primary,
    backgroundColor: AppColors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  todayRouteNumber: {
    color: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  routeName: {
    fontSize: Platform.OS === "ios" ? 22 : 20,
    fontWeight: "700",
    color: AppColors.text,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: Platform.OS === "ios" ? 13 : 12,
    color: AppColors.textSecondary,
    fontWeight: "500",
    marginBottom: 2,
  },
  todayDetailLabel: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  detailValue: {
    fontSize: Platform.OS === "ios" ? 16 : 15,
    color: AppColors.text,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  actionButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 4,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonsContainer: {
    marginTop: 4,
  },
  endButton: {
    marginTop: 8,
  },
  trackingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  trackingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    marginRight: 8,
  },
  trackingText: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 14 : 13,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 16 : 15,
    fontWeight: "600",
    marginLeft: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  quickActionsContainer: {
    marginTop: 8,
  },
  quickActionsTitle: {
    fontSize: Platform.OS === "ios" ? 20 : 18,
    fontWeight: "700",
    color: AppColors.primary,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  quickActionCard: {
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Platform.OS === "ios" ? 20 : 18,
    backgroundColor: AppColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
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
  quickActionText: {
    fontSize: Platform.OS === "ios" ? 13 : 12,
    fontWeight: "500",
    color: AppColors.textSecondary,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: Platform.OS === "ios" ? 16 : 15,
    color: AppColors.textSecondary,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: Platform.OS === "ios" ? 16 : 15,
    color: AppColors.red,
    textAlign: 'center',
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === "ios" ? 16 : 15,
    fontWeight: '600',
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: Platform.OS === "ios" ? 20 : 18,
    fontWeight: '700',
    color: AppColors.text,
    textAlign: 'center',
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  emptyMessage: {
    marginTop: 8,
    fontSize: Platform.OS === "ios" ? 16 : 15,
    color: AppColors.textSecondary,
    textAlign: 'center',
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
});

export default ScheduleScreen;
