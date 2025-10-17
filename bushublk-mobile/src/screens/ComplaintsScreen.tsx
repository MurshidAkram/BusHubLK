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

// --- The Modern App Color Palette You Liked ---
const AppColors = {
  background: "#F8FAFC",
  card: "#FFFFFF",
  primary: "#3B82F6",
  primaryDark: "#1E40AF",
  primaryLight: "#DBEAFE",
  secondary: "#64748B",
  accent: "#F59E0B",
  text: "#0F172A",
  textSecondary: "#64748B",
  textLight: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  purple: "#8B5CF6",
  indigo: "#6366F1",
  shadow: "rgba(15, 23, 42, 0.08)",
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
    { label: "Staff Conduct (Driver/Conductor)", value: "staff_conduct" },
    { label: "Reckless Driving", value: "reckless_driving" },
    { label: "Bus Not Stopping", value: "not_stopping" },
    { label: "Ticketing Issue", value: "ticketing_issue" },
    { label: "Bus Condition", value: "bus_condition" },
    { label: "Harassment", value: "harassment" },
    { label: "Route Deviation", value: "route_deviation" },
    { label: "Other", value: "other" },
  ]);

  const [routeNumber, setRouteNumber] = useState("");
  const [busNumber, setBusNumber] = useState("");
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

  const handleSelectSuggestion = useCallback((suggestion: BusRouteSuggestion, mode: "route" | "bus") => {
    const derivedRoute = suggestion.route_number ?? "";
    const derivedBus = suggestion.registration_number ?? suggestion.bus_registration ?? "";

    if (mode === "route") {
      // Only set route number when selecting from route suggestions
      if (derivedRoute) {
        setRouteNumber(derivedRoute);
      }
    } else {
      // Set both route and bus when selecting from bus suggestions
      if (derivedRoute) {
        setRouteNumber(derivedRoute);
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
    if (!complaintTypeValue || !routeNumber || !description) {
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
    <SafeAreaView style={styles.container}>

      {/* --- The New Header UI --- */}
      <LinearGradient
        colors={[AppColors.primary, AppColors.primaryDark]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconContainer}>
            <Ionicons name="arrow-back-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>File a Complaint</Text>
            <Text style={styles.headerSubtitle}>Help us improve our service</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("ComplaintHistory")} style={styles.headerIconContainer}>
            <Ionicons name="time-outline" size={24} color="#FFFFFF" />
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
                        const suggestionKey = `route-sugg-${suggestion.bus_route_id ?? index}-${index}`;
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
            <View style={styles.cardHeaderContainer}><View style={styles.cardIconContainer}><Ionicons name="location" size={24} color={AppColors.indigo} /></View><View><Text style={styles.cardHeader}>Time & Place</Text><Text style={styles.cardSubheader}>When and where did this happen?</Text></View></View>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.enhancedInputContainer}><Ionicons name="calendar-outline" size={20} color={AppColors.indigo} style={styles.inputIcon} /><Text style={styles.inputText}>{date.toLocaleDateString()}</Text></TouchableOpacity>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.enhancedInputContainer}><Ionicons name="time-outline" size={20} color={AppColors.indigo} style={styles.inputIcon} /><Text style={styles.inputText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></TouchableOpacity>
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
  );
}

// --- The New StyleSheet for the Modern UI ---
const styles = StyleSheet.create({

    container:{flex:1,backgroundColor:AppColors.background},
    animatedContainer:{flex:1},
    headerGradient:{paddingBottom:10,},
    header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:20,paddingVertical:15,height:70},
    headerIconContainer:{padding:8,borderRadius:12,backgroundColor:"rgba(255, 255, 255, 0.1)"},
    headerTitleContainer:{flex:1,alignItems:"center"},
    headerTitle:{color:"#FFFFFF",fontSize:22,fontWeight:"700"},
    headerSubtitle:{color:"rgba(255, 255, 255, 0.8)",fontSize:14,marginTop:2},
    contentContainer:{paddingHorizontal:20,paddingTop:10,paddingBottom:40},
    card:{backgroundColor:AppColors.card,borderRadius:16,padding:20,marginBottom:20,shadowColor:AppColors.shadow,shadowOffset:{width:0,height:2},shadowOpacity:1,shadowRadius:8,borderWidth:1,borderColor:AppColors.borderLight},
    cardHeaderContainer:{flexDirection:"row",alignItems:"center",marginBottom:20},
    cardIconContainer:{width:48,height:48,borderRadius:12,backgroundColor:AppColors.primaryLight,alignItems:"center",justifyContent:"center",marginRight:15},
    cardHeader:{fontSize:20,fontWeight:"700",color:AppColors.text},
    cardSubheader:{fontSize:14,color:AppColors.textSecondary,marginTop:2},
    label:{fontSize:16,fontWeight:"600",color:AppColors.text,marginBottom:10, marginTop: 15},
    enhancedInputContainer:{flexDirection:"row",alignItems:"center",backgroundColor:AppColors.background,borderRadius:12,paddingHorizontal:16,height:56,borderWidth:2,borderColor:AppColors.border},
    inputIcon:{marginRight:12},
    inputText:{flex:1,fontSize:16,color:AppColors.text,fontWeight:"500"},
    row:{flexDirection:"row",justifyContent:"space-between",gap:15},
    inputGroup:{flex:1},
    dropdownPicker: {
      backgroundColor: AppColors.background,
      borderColor: AppColors.border,
      borderRadius: 12,
      borderWidth: 2,
      height: 56,
      paddingHorizontal: 16,
      marginBottom: 15,
      minHeight: 56,
      zIndex: 999,
    },
    dropdownContainer: {
      backgroundColor: AppColors.card,
      borderColor: AppColors.border,
      borderRadius: 12,
      borderWidth: 2,
      marginTop: 4,
      elevation: 5,
      shadowColor: AppColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      zIndex: 999,
    },
    placeholderText:{color:AppColors.textLight,fontSize:16},
    priorityContainer:{flexDirection:"row",justifyContent:"space-between", marginBottom: 15},
    priorityButton:{flex:1,paddingVertical:12,borderRadius:10,alignItems:"center",backgroundColor:AppColors.background,borderWidth:2,borderColor: AppColors.border, marginHorizontal: 4},
    priorityButtonText:{color:AppColors.textSecondary,fontWeight:"600"},
    descriptionInput:{backgroundColor:AppColors.background,borderRadius:12,padding:16,height:120,fontSize:16,color:AppColors.text,textAlignVertical:"top",borderWidth:2,borderColor:AppColors.border,fontWeight:"500", marginBottom: 15},
    uploadBox:{height:120,borderRadius:16,borderWidth:2,borderColor:AppColors.border,borderStyle:"dashed",justifyContent:"center",alignItems:"center",backgroundColor:AppColors.background,marginTop:8},
    uploadContent:{alignItems: "center"},
    uploadText:{marginTop:8,color:AppColors.textSecondary,fontSize:14},
    previewImage:{width:"100%",height:"100%",borderRadius:14},
    submitButton:{backgroundColor:AppColors.primary,paddingVertical:18,borderRadius:16,alignItems:"center",marginTop:10,elevation:4,shadowColor:AppColors.primary,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:8},
    submitButtonDisabled:{backgroundColor:AppColors.textSecondary},
  submitButtonText:{color:"#FFFFFF",fontSize:18,fontWeight:"700"},
  autocompleteWrapper:{zIndex:40},
  suggestionsWrapper:{marginTop:8,backgroundColor:AppColors.card,borderRadius:12,borderWidth:1,borderColor:AppColors.borderLight,shadowColor:AppColors.shadow,shadowOffset:{width:0,height:4},shadowOpacity:0.15,shadowRadius:10,elevation:4,maxHeight:200,overflow:"hidden"},
  suggestionLoading:{paddingVertical:16,alignItems:"center",justifyContent:"center"},
  suggestionItem:{paddingVertical:12,paddingHorizontal:14,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:AppColors.borderLight},
  suggestionItemLast:{borderBottomWidth:0},
  suggestionPrimary:{fontSize:16,fontWeight:"600",color:AppColors.text},
  suggestionSecondary:{fontSize:13,color:AppColors.textSecondary,marginTop:2},
  suggestionBadge:{fontSize:12,fontWeight:"700",color:AppColors.primaryDark,backgroundColor:AppColors.primaryLight,paddingHorizontal:10,paddingVertical:4,borderRadius:999},

});