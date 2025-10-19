import React, { useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Keyboard,
  Pressable,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  Image,
  Animated,
} from "react-native";
import { storageAPI, complaintAPI } from "../services/api";
import { API_BASE_URL } from "../config/api";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import DropDownPicker from "react-native-dropdown-picker";
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

// --- Enhanced Color Palette (matching BusOccupancyScreen) ---
const AppColors = {
  background: "#F8FAFF",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryDark: "#003d82",
  primaryLight: "#0076e3",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  secondary: "#64748B",
  accent: "#F59E0B",
  text: "#1F2937",
  textSecondary: "#6B7280",
  textLight: "#94A3B8",
  border: "#E5E7EB",
  borderLight: "rgba(222, 226, 230, 0.4)",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  red: "#EF4444",
  purple: "#8B5CF6",
  indigo: "#6366F1",
  orange: "#F97316",
  shadow: "rgba(0, 0, 0, 0.1)",
};

type ComplaintsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Complaints'>;

interface BusRouteSuggestion {
  bus_route_id: number;
  bus_id: number | null;
  route_id: number | null;
  registration_number: string | null;
  bus_registration?: string | null;
  route_number: string | null;
  route_name?: string | null;
  bus_name?: string | null;
}

interface BusRouteSuggestion {
  bus_route_id?: number;
  route_number?: string;
  route_name?: string;
  registration_number?: string;
  bus_registration?: string;
}

export default function ComplaintsScreen() {
  const navigation = useNavigation<ComplaintsScreenNavigationProp>();


  // --- All of your state and logic is preserved below ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);


  // Dropdown State
  const [complaintTypeOpen, setComplaintTypeOpen] = useState(false);
  const [complaintTypeValue, setComplaintTypeValue] = useState<string | null>(null);
  const [complaintTypeItems, setComplaintTypeItems] = useState([
    { label: "Staff Behavior/Act (Driver/Conductor)", value: "staff_conduct" },
    { label: "Reckless Driving", value: "reckless_driving" },
    { label: "Bus Not Stopping on a halt", value: "not_stopping" },
    { label: "Ticketing Issue", value: "ticketing_issue" },
    { label: "Bus Condition", value: "bus_condition" },
    { label: "Harassment", value: "harassment" },
    { label: "Route Deviation", value: "route_deviation" },
    { label: "Other", value: "other" },
  ]);

  const [routeNumber, setRouteNumber] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [location, setLocation] = useState("");
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [routeSuggestions, setRouteSuggestions] = useState<BusRouteSuggestion[]>([]);
  const [busSuggestions, setBusSuggestions] = useState<BusRouteSuggestion[]>([]);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isBusLoading, setIsBusLoading] = useState(false);
  const routeSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (routeSearchTimeout.current) {
        clearTimeout(routeSearchTimeout.current);
      }
      if (busSearchTimeout.current) {
        clearTimeout(busSearchTimeout.current);
      }
    };
  }, []);

  // Date & Time Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);


  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      setIsLocationLoading(true);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to fetch your current location.'
        );
        return;
      }

      // Get current position
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;

      // Reverse geocode to get address
      const addressResults = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResults && addressResults.length > 0) {
        const address = addressResults[0];
        
        // Build a readable address string
        const addressParts = [
          address.name,
          address.street,
          address.district,
          address.city,
          address.region,
        ].filter(Boolean);

        const formattedAddress = addressParts.length > 0 
          ? addressParts.join(', ')
          : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        setLocation(formattedAddress);
        
        Alert.alert(
          'Location Fetched',
          'Your current location has been added. You can edit it if needed.',
          [{ text: 'OK' }]
        );
      } else {
        // Fallback to coordinates if geocoding fails
        setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert(
        'Location Error',
        'Unable to fetch your current location. Please enter it manually.'
      );
    } finally {
      setIsLocationLoading(false);
    }
  };

  const fetchBusRouteSuggestions = useCallback(async (query: string, mode: "route" | "bus") => {
    const trimmed = query.trim();
    if (!trimmed) {
      if (mode === "route") {
        setRouteSuggestions([]);
      } else {
        setBusSuggestions([]);
      }
      return;
    }

    try {
      if (mode === "route") {
        setIsRouteLoading(true);
      } else {
        setIsBusLoading(true);
      }

      const response = await complaintAPI.searchBusRoutes(trimmed);
      const matches: BusRouteSuggestion[] = Array.isArray(response?.data) ? response.data : [];

      if (mode === "route") {
        setRouteSuggestions(matches.slice(0, 8));
      } else {
        setBusSuggestions(matches.slice(0, 8));
      }
    } catch (error) {
      console.error("Error searching bus routes:", error);
    } finally {
      if (mode === "route") {
        setIsRouteLoading(false);
      } else {
        setIsBusLoading(false);
      }
    }
  }, []);

  const scheduleRouteSearch = useCallback((value: string) => {
    if (routeSearchTimeout.current) {
      clearTimeout(routeSearchTimeout.current);
    }
    routeSearchTimeout.current = setTimeout(() => {
      fetchBusRouteSuggestions(value, "route");
    }, 350);
  }, [fetchBusRouteSuggestions]);

  const scheduleBusSearch = useCallback((value: string) => {
    if (busSearchTimeout.current) {
      clearTimeout(busSearchTimeout.current);
    }
    busSearchTimeout.current = setTimeout(() => {
      fetchBusRouteSuggestions(value, "bus");
    }, 350);
  }, [fetchBusRouteSuggestions]);

  const handleRouteInputChange = useCallback((value: string) => {
    setRouteNumber(value);
    scheduleRouteSearch(value);
  }, [scheduleRouteSearch]);

  const handleBusInputChange = useCallback((value: string) => {
    setBusNumber(value);
    scheduleBusSearch(value);
  }, [scheduleBusSearch]);

  const handleRouteFocus = useCallback(() => {
    if (routeNumber.trim()) {
      fetchBusRouteSuggestions(routeNumber, "route");
    }
  }, [fetchBusRouteSuggestions, routeNumber]);

  const handleBusFocus = useCallback(() => {
    if (busNumber.trim()) {
      fetchBusRouteSuggestions(busNumber, "bus");
    }
  }, [fetchBusRouteSuggestions, busNumber]);

  const handleRouteBlur = useCallback(() => {
    if (routeSearchTimeout.current) {
      clearTimeout(routeSearchTimeout.current);
      routeSearchTimeout.current = null;
    }
    setTimeout(() => setRouteSuggestions([]), 150);
  }, []);


  const handleBusBlur = useCallback(() => {
    if (busSearchTimeout.current) {
      clearTimeout(busSearchTimeout.current);
      busSearchTimeout.current = null;
    }
    setTimeout(() => setBusSuggestions([]), 150);
  }, []);

  const handleSelectSuggestion = useCallback((suggestion: RouteSuggestion | BusRouteSuggestion, mode: "route" | "bus") => {
    const derivedRoute = suggestion.route_number ?? "";
    const derivedBus = (suggestion as BusRouteSuggestion).registration_number ?? (suggestion as BusRouteSuggestion).bus_registration ?? "";

    if (mode === "route") {
      // Only set route number when selecting from route suggestions
      if (derivedRoute) {
        setRouteNumber(derivedRoute);
        setIsValidRoute(true);
      }
    } else {
      // Set both route and bus when selecting from bus suggestions
      if (derivedRoute) {
        setRouteNumber(derivedRoute);
        setIsValidRoute(true);
      }
      if (derivedBus) {
        setBusNumber(derivedBus);
      }
    }

    setRouteSuggestions([]);
    setBusSuggestions([]);
    Keyboard.dismiss();
  }, []);

  const handleSubmit = async () => {
    if (!complaintTypeValue || !routeNumber || !location || !description) {
      Alert.alert("Missing Information", "Please fill all required fields before submitting.");
      return;
    }


    setIsSubmitting(true);



    try {
      const token = await storageAPI.getAuthToken();
      if (!token) {
        Alert.alert("Authentication Error", "You must be logged in to submit a complaint.");
        return;
      }

      const formData = new FormData();
      formData.append('complaintType', complaintTypeValue);
      formData.append('routeNumber', routeNumber);
      if (busNumber) formData.append('busNumber', busNumber);
      formData.append('location', location);
      // contactInfo will be auto-filled from user profile in backend
      formData.append('date', date.toISOString().split('T')[0]);
      formData.append('time', time.toTimeString().split(' ')[0]);
      formData.append('priority', priority);
      formData.append('description', description);

      if (image) {
        const uriParts = image.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('image', {
          uri: image,
          name: `complaint_image.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      // Use the configured API base URL instead of hardcoded IP
      const submitUrl = `${API_BASE_URL}/api/complaints/submit`;
      
      console.log('🚀 Starting complaint submission to:', submitUrl);
      console.log('📦 FormData contents:', {
        complaintType: complaintTypeValue,
        routeNumber,
        busNumber,
        priority,
        hasImage: !!image
      });
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 25000) // Increased to 25s
      );
      
      const fetchPromise = fetch(submitUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      
      // Race between fetch and timeout
      console.log('⏱️ Starting fetch with 25s timeout...');
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      console.log('✅ Response received:', response.status, response.statusText);

      const result = await response.json();


      if (response.ok) {
        Alert.alert("Success", "Your complaint has been submitted successfully!");
        navigation.navigate("ComplaintHistory");
      } else {
        Alert.alert("Submission Failed", result.message || "Could not submit your complaint.");
      }
    } catch (error: any) {
      console.error("Error submitting complaint:", error);
      
      // Handle different types of errors with specific messages
      if (error.message && error.message.includes('timeout')) {
        console.log('🕐 Complaint submission timed out after 25 seconds');
        Alert.alert(
          "Connection Timeout", 
          "Your complaint submission is taking longer than expected. This might be due to:\n\n• Slow internet connection\n• Server overload\n• Large image file\n\nPlease try again or contact support."
        );
      } else if (error.message && error.message.includes('Network request failed')) {
        Alert.alert(
          "Network Error", 
          "Unable to connect to the server. Please check:\n\n• Your internet connection\n• Server availability\n• Try again in a moment"
        );
      } else {
        Alert.alert("An Error Occurred", `Please check your connection and try again.\n\nError: ${error.message}`);
      }
    } finally {

      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'Low': return AppColors.success;
      case 'Medium': return AppColors.warning;
      case 'High': return AppColors.danger;
      default: return AppColors.secondary;

    }
  };

  return (
    <LinearGradient
      colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea}>

        {/* --- Enhanced Header (matching Lost&Found style) --- */}
        <LinearGradient
          colors={['#0056b3', '#1976d2', '#42a5f5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back-outline" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>File a Complaint</Text>
            <TouchableOpacity onPress={() => navigation.navigate("ComplaintHistory")} style={styles.headerRightAction}>
              <Ionicons name="time-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* --- CARD 1: INCIDENT DETAILS --- */}
          <View style={[styles.card, { zIndex: 1000 }]}>
            <View style={styles.cardHeaderContainer}>
              <View style={styles.cardIconContainer}><Ionicons name="alert-circle" size={24} color={AppColors.primary} /></View>
              <View><Text style={styles.cardHeader}>Incident Details</Text><Text style={styles.cardSubheader}>What happened?</Text></View>
            </View>
            
            <Text style={styles.label}>Type of Complaint</Text>
            <DropDownPicker
              open={complaintTypeOpen}
              value={complaintTypeValue}
              items={complaintTypeItems}
              setOpen={setComplaintTypeOpen}
              setValue={setComplaintTypeValue}
              setItems={setComplaintTypeItems}
              style={styles.dropdownPicker}
              dropDownContainerStyle={styles.dropdownContainer}
              placeholder="Select a complaint type"
              placeholderStyle={styles.placeholderText}
              textStyle={{ fontSize: 16, color: AppColors.text }}
              listMode="SCROLLVIEW"
              scrollViewProps={{
                nestedScrollEnabled: true,
              }}
              maxHeight={300}
              autoScroll={true}
              showArrowIcon={true}
              showTickIcon={true}
              ArrowDownIconComponent={({style}) => <Ionicons name="chevron-down" size={24} color={AppColors.text} />}
              ArrowUpIconComponent={({style}) => <Ionicons name="chevron-up" size={24} color={AppColors.text} />}
              TickIconComponent={({style}) => <Ionicons name="checkmark" size={20} color={AppColors.primary} />}
              listItemContainerStyle={{
                height: 48,
                borderBottomWidth: 1,
                borderBottomColor: AppColors.borderLight,
              }}
              listItemLabelStyle={{
                color: AppColors.text,
                fontSize: 16,
              }}
              selectedItemContainerStyle={{
                backgroundColor: AppColors.primaryLight,
              }}
              selectedItemLabelStyle={{
                color: AppColors.primary,
                fontWeight: "600",
              }}
            />

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.autocompleteWrapper]}>
                <Text style={styles.label}>Route No.</Text>
                <View style={styles.enhancedInputContainer}>
                  <Ionicons name="bus-outline" size={20} color={AppColors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputText}
                    placeholder="e.g., 177"
                    value={routeNumber}
                    onChangeText={handleRouteInputChange}
                    onFocus={handleRouteFocus}
                    onBlur={handleRouteBlur}
                    autoCapitalize="characters"
                  />
                </View>
                {(isRouteLoading || (routeSuggestions.length > 0 && routeNumber.trim().length > 0)) && (
                  <View style={styles.suggestionsWrapper}>
                    {isRouteLoading ? (
                      <View style={styles.suggestionLoading}>
                        <ActivityIndicator size="small" color={AppColors.primary} />
                      </View>
                    ) : (
                      routeSuggestions.map((suggestion, index) => {
                        const suggestionKey = `route-sugg-${suggestion.route_id ?? index}-${index}`;
                        const isLast = index === routeSuggestions.length - 1;
                        return (
                          <TouchableOpacity
                            key={suggestionKey}
                            style={[styles.suggestionItem, isLast && styles.suggestionItemLast]}
                            onPress={() => handleSelectSuggestion(suggestion, "route")}
                          >
                            <View style={{flex: 1}}>
                              <Text style={styles.suggestionPrimary}>{suggestion.route_number || "Route not assigned"}</Text>
                              {suggestion.route_name ? (
                                <Text style={styles.suggestionSecondary}>{suggestion.route_name}</Text>
                              ) : null}
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
              <View style={[styles.inputGroup, styles.autocompleteWrapper]}>
                <Text style={styles.label}>Bus No. (Optional)</Text>
                <View style={styles.enhancedInputContainer}>
                  <Ionicons name="information-circle-outline" size={20} color={AppColors.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputText}
                    placeholder="e.g., ND-1234"
                    value={busNumber}
                    onChangeText={handleBusInputChange}
                    onFocus={handleBusFocus}
                    onBlur={handleBusBlur}
                    autoCapitalize="characters"
                  />
                </View>
                {(isBusLoading || (busSuggestions.length > 0 && busNumber.trim().length > 0)) && (
                  <View style={styles.suggestionsWrapper}>
                    {isBusLoading ? (
                      <View style={styles.suggestionLoading}>
                        <ActivityIndicator size="small" color={AppColors.primary} />
                      </View>
                    ) : (
                      busSuggestions.map((suggestion, index) => {
                        const suggestionKey = `bus-sugg-${suggestion.bus_route_id ?? index}-${index}`;
                        const isLast = index === busSuggestions.length - 1;
                        const busLabel = suggestion.registration_number || suggestion.bus_registration || "Bus not assigned";
                        const routeLabel = suggestion.route_number
                          ? `Route ${suggestion.route_number}${suggestion.route_name ? ` · ${suggestion.route_name}` : ""}`
                          : suggestion.route_name || "";
                        return (
                          <TouchableOpacity
                            key={suggestionKey}
                            style={[styles.suggestionItem, isLast && styles.suggestionItemLast]}
                            onPress={() => handleSelectSuggestion(suggestion, "bus")}
                          >
                            <View>
                              <Text style={styles.suggestionPrimary}>{busLabel}</Text>
                              {routeLabel ? (
                                <Text style={styles.suggestionSecondary}>{routeLabel}</Text>
                              ) : null}
                            </View>
                            {suggestion.route_number ? (
                              <Text style={styles.suggestionBadge}>{suggestion.route_number}</Text>
                            ) : null}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* --- CARD 2: TIME & PLACE --- */}
          <View style={styles.card}>
            <View style={styles.cardHeaderContainer}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="location" size={24} color={AppColors.indigo} />
              </View>
              <View>
                <Text style={styles.cardHeader}>Time & Place</Text>
                <Text style={styles.cardSubheader}>When and where did this happen?</Text>
              </View>
            </View>
            
            <View style={styles.locationHeaderRow}>
              <Text style={styles.label}>Location</Text>
              <TouchableOpacity 
                style={styles.fetchLocationButton} 
                onPress={fetchCurrentLocation}
                disabled={isLocationLoading}
              >
                {isLocationLoading ? (
                  <ActivityIndicator size="small" color={AppColors.primary} />
                ) : (
                  <>
                    <Ionicons name="navigate" size={16} color={AppColors.primary} />
                    <Text style={styles.fetchLocationText}>Use Current</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.enhancedInputContainer}>
              <Ionicons name="location-outline" size={20} color={AppColors.indigo} style={styles.inputIcon} />
              <TextInput
                style={styles.inputText}
                placeholder="e.g., Colombo Fort Bus Stand"
                value={location}
                onChangeText={setLocation}
                editable={!isLocationLoading}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.enhancedInputContainer}>
                  <Ionicons name="calendar-outline" size={20} color={AppColors.indigo} style={styles.inputIcon} />
                  <Text style={styles.inputText}>{date.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.enhancedInputContainer}>
                  <Ionicons name="time-outline" size={20} color={AppColors.indigo} style={styles.inputIcon} />
                  <Text style={styles.inputText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>


          {/* --- CARD 3: COMPLAINT DETAILS --- */}
          <View style={styles.card}>
            <View style={styles.cardHeaderContainer}><View style={styles.cardIconContainer}><Ionicons name="document-text" size={24} color={AppColors.purple} /></View><View><Text style={styles.cardHeader}>Complaint Details</Text><Text style={styles.cardSubheader}>Tell us more about the incident</Text></View></View>
            <Text style={styles.label}>Priority Level</Text>
            <View style={styles.priorityContainer}>
              {["Low", "Medium", "High"].map((level) => (
                <TouchableOpacity key={level} style={[styles.priorityButton, priority === level && { backgroundColor: getPriorityColor(level), borderColor: getPriorityColor(level) }]} onPress={() => setPriority(level)}>
                  <Text style={[styles.priorityButtonText, priority === level && { color: "#FFFFFF" }]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Description</Text>
            <TextInput style={styles.descriptionInput} placeholder="Please describe the incident in detail..." multiline value={description} onChangeText={setDescription} />
            <Text style={styles.label}>Attach Photo (Optional)</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              {image ? (<Image source={{ uri: image }} style={styles.previewImage} />) : (<View style={styles.uploadContent}><Ionicons name="camera-outline" size={32} color={AppColors.secondary} /><Text style={styles.uploadText}>Tap to upload an image</Text></View>)}
            </TouchableOpacity>
          </View>

          {/* --- SUBMIT BUTTON --- */}
          <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (<ActivityIndicator color="#FFFFFF" />) : (<Text style={styles.submitButtonText}>Submit Complaint</Text>)}
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />}
      {showTimePicker && <DateTimePicker value={time} mode="time" display="default" onChange={onTimeChange} />}
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- Enhanced StyleSheet (matching BusOccupancyScreen) ---
const styles = StyleSheet.create({
    gradientContainer: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    container:{flex:1,backgroundColor:AppColors.background},
    animatedContainer:{flex:1},
    headerGradient:{
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      padding: 8,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle:{
      fontSize: 22,
      fontWeight: 'bold',
      color: 'white',
      flex: 1,
      textAlign: 'center',
    },
    headerRightAction: {
      padding: 8,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentContainer:{paddingHorizontal:16,paddingTop:16,paddingBottom:40},
    card:{
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(0, 86, 179, 0.08)',
      ...Platform.select({
        android: {
          elevation: 8,
        },
        ios: {
          shadowColor: 'rgba(0, 86, 179, 0.15)',
          shadowOpacity: 1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        },
      }),
    },
    cardHeaderContainer:{flexDirection:"row",alignItems:"center",marginBottom:24,paddingBottom:16,borderBottomWidth:1,borderBottomColor:'rgba(0, 86, 179, 0.08)'},
    cardIconContainer:{
      width:52,
      height:52,
      borderRadius:16,
      backgroundColor:'rgba(0, 86, 179, 0.12)',
      alignItems:"center",
      justifyContent:"center",
      marginRight:16
    },
    cardHeader:{fontSize:20,fontWeight:"700",color:AppColors.text,letterSpacing:0.3},
    cardSubheader:{fontSize:13,color:AppColors.textSecondary,marginTop:4,fontWeight:'500'},
    label:{fontSize:15,fontWeight:"600",color:AppColors.text,marginBottom:12, marginTop: 16,letterSpacing:0.2},
    enhancedInputContainer:{
      flexDirection:"row",
      alignItems:"center",
      backgroundColor:'#FFFFFF',
      borderRadius:14,
      paddingHorizontal:18,
      height:58,
      borderWidth:1.5,
      borderColor:'rgba(0, 86, 179, 0.15)',
      ...Platform.select({
        android: {
          elevation: 2,
        },
        ios: {
          shadowColor: 'rgba(0, 86, 179, 0.08)',
          shadowOpacity: 1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        },
      }),
    },
    inputIcon:{marginRight:14},
    inputText:{flex:1,fontSize:16,color:AppColors.text,fontWeight:"500"},
    row:{flexDirection:"row",justifyContent:"space-between",gap:12},
    inputGroup:{flex:1},
    dropdownPicker: {
      backgroundColor: '#FFFFFF',
      borderColor: 'rgba(0, 86, 179, 0.15)',
      borderRadius: 14,
      borderWidth: 1.5,
      height: 58,
      paddingHorizontal: 18,
      marginBottom: 15,
      minHeight: 58,
      zIndex: 999,
      ...Platform.select({
        android: {
          elevation: 2,
        },
        ios: {
          shadowColor: 'rgba(0, 86, 179, 0.08)',
          shadowOpacity: 1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        },
      }),
    },
    dropdownContainer: {
      backgroundColor: '#FFFFFF',
      borderColor: 'rgba(0, 86, 179, 0.15)',
      borderRadius: 14,
      borderWidth: 1.5,
      marginTop: 4,
      ...Platform.select({
        android: {
          elevation: 8,
        },
        ios: {
          shadowColor: 'rgba(0, 86, 179, 0.15)',
          shadowOpacity: 1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        },
      }),
      zIndex: 999,
    },
    placeholderText:{color:AppColors.textSecondary,fontSize:16,fontWeight:'500'},
    priorityContainer:{flexDirection:"row",justifyContent:"space-between", marginBottom: 18,gap:10},
    priorityButton:{
      flex:1,
      paddingVertical:14,
      borderRadius:12,
      alignItems:"center",
      backgroundColor:'#FFFFFF',
      borderWidth:1.5,
      borderColor: 'rgba(0, 86, 179, 0.15)',
      ...Platform.select({
        android: {
          elevation: 2,
        },
        ios: {
          shadowColor: 'rgba(0, 86, 179, 0.08)',
          shadowOpacity: 1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        },
      }),
    },
    priorityButtonText:{color:AppColors.textSecondary,fontWeight:"600",fontSize:15},
    descriptionInput:{
      backgroundColor:'#FFFFFF',
      borderRadius:14,
      padding:18,
      height:130,
      fontSize:16,
      color:AppColors.text,
      textAlignVertical:"top",
      borderWidth:1.5,
      borderColor:'rgba(0, 86, 179, 0.15)',
      fontWeight:"500", 
      marginBottom: 18,
      ...Platform.select({
        android: {
          elevation: 2,
        },
        ios: {
          shadowColor: 'rgba(0, 86, 179, 0.08)',
          shadowOpacity: 1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        },
      }),
    },
    uploadBox:{
      height:140,
      borderRadius:16,
      borderWidth:2,
      borderColor:'rgba(0, 86, 179, 0.2)',
      borderStyle:"dashed",
      justifyContent:"center",
      alignItems:"center",
      backgroundColor:'rgba(0, 86, 179, 0.03)',
      marginTop:8
    },
    uploadContent:{alignItems: "center"},
    uploadText:{marginTop:10,color:AppColors.textSecondary,fontSize:15,fontWeight:'500'},
    previewImage:{width:"100%",height:"100%",borderRadius:14},
    submitButton:{
      backgroundColor:'#0056b3',
      paddingVertical:20,
      borderRadius:16,
      alignItems:"center",
      marginTop:16,
      ...Platform.select({
        android: {
          elevation: 8,
        },
        ios: {
          shadowColor: '#0056b3',
          shadowOffset:{width:0,height:6},
          shadowOpacity:0.35,
          shadowRadius:10,
        },
      }),
    },
    submitButtonDisabled:{backgroundColor:AppColors.textSecondary},
  submitButtonText:{color:"#FFFFFF",fontSize:18,fontWeight:"700",letterSpacing:0.5},
  autocompleteWrapper:{zIndex:40},
  suggestionsWrapper:{
    marginTop:8,
    backgroundColor:'#FFFFFF',
    borderRadius:14,
    borderWidth:1.5,
    borderColor:'rgba(0, 86, 179, 0.15)',
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: 'rgba(0, 86, 179, 0.15)',
        shadowOpacity: 1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
    maxHeight:200,
    overflow:"hidden"
  },
  suggestionLoading:{paddingVertical:18,alignItems:"center",justifyContent:"center"},
  suggestionItem:{
    paddingVertical:14,
    paddingHorizontal:16,
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between",
    borderBottomWidth:1,
    borderBottomColor:'rgba(0, 86, 179, 0.06)'
  },
  suggestionItemLast:{borderBottomWidth:0},
  suggestionPrimary:{fontSize:16,fontWeight:"600",color:AppColors.text,letterSpacing:0.2},
  suggestionSecondary:{fontSize:13,color:AppColors.textSecondary,marginTop:3,fontWeight:'500'},
  suggestionBadge:{
    fontSize:11,
    fontWeight:"700",
    color:'#FFFFFF',
    backgroundColor:'#0056b3',
    paddingHorizontal:12,
    paddingVertical:6,
    borderRadius:12,
    overflow:'hidden'
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  fetchLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 86, 179, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 86, 179, 0.2)',
  },
  fetchLocationText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.primary,
  },

});