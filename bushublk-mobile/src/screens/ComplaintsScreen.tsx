import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { storageAPI } from "../services/api";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import DropDownPicker from "react-native-dropdown-picker";
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Enhanced Color Palette
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

export default function ComplaintsScreen() {
  const navigation = useNavigation<ComplaintsScreenNavigationProp>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

  // Dropdown State
  const [complaintTypeOpen, setComplaintTypeOpen] = useState(false);
  const [complaintTypeValue, setComplaintTypeValue] = useState(null);
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

  // Form State
  const [routeNumber, setRouteNumber] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [image, setImage] = useState<string | null>(null);

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!complaintTypeValue || !routeNumber || !location || !description || !contactInfo) {
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
      formData.append('location', location);
      formData.append('priority', priority);
      formData.append('description', description);
      formData.append('contactInfo', contactInfo);

      if (image) {
        const uriParts = image.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('image', {
          uri: image,
          name: `complaint_image.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      const baseURL = 'http://192.168.43.114:5000';
      const response = await fetch(`${baseURL}/api/complaints/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Your complaint has been submitted successfully!");
        navigation.navigate("ComplaintHistory");
      } else {
        Alert.alert("Submission Failed", result.message || "Could not submit your complaint.");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      Alert.alert("An Error Occurred", "Please check your connection and try again.");
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
            <View style={styles.notificationBadge}>
              <Ionicons name="time-outline" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <ScrollView 
          contentContainerStyle={styles.contentContainer} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
          scrollEnabled={isScrollEnabled}
        >
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.progressText}>Step 1 of 1</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderContainer}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="alert-circle" size={24} color={AppColors.primary} />
              </View>
              <View>
                <Text style={styles.cardHeader}>Incident Details</Text>
                <Text style={styles.cardSubheader}>What happened?</Text>
              </View>
            </View>
            
            <View style={styles.inputSection}>
              <Text style={styles.label}>
                Type of Complaint <Text style={styles.required}>*</Text>
              </Text>
              <DropDownPicker
                open={complaintTypeOpen}
                value={complaintTypeValue}
                items={complaintTypeItems}
                setOpen={(open) => {
                  setComplaintTypeOpen(open);
                  setIsScrollEnabled(!open);
                }}
                setValue={setComplaintTypeValue}
                setItems={setComplaintTypeItems}
                style={styles.dropdownPicker}
                dropDownContainerStyle={styles.dropdownContainer}
                placeholder="Select a complaint type"
                placeholderStyle={styles.placeholderText}
                listMode="MODAL"
                dropDownDirection="BOTTOM"
              />
            </View>

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Route No. <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.enhancedInputContainer}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="bus-outline" size={20} color={AppColors.primary} />
                  </View>
                  <TextInput
                    style={styles.inputText}
                    placeholder="e.g., 177"
                    value={routeNumber}
                    onChangeText={setRouteNumber}
                    placeholderTextColor={AppColors.textLight}
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bus No. (Optional)</Text>
                <View style={styles.enhancedInputContainer}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="information-circle-outline" size={20} color={AppColors.secondary} />
                  </View>
                  <TextInput
                    style={styles.inputText}
                    placeholder="e.g., ND-1234"
                    value={busNumber}
                    onChangeText={setBusNumber}
                    placeholderTextColor={AppColors.textLight}
                  />
                </View>
              </View>
            </View>
          </View>

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
            
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Date <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.enhancedInputContainer}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="calendar-outline" size={20} color={AppColors.indigo} />
                  </View>
                  <Text style={styles.inputText}>{date.toLocaleDateString()}</Text>
                  <Ionicons name="chevron-down" size={16} color={AppColors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Time <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.enhancedInputContainer}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="time-outline" size={20} color={AppColors.indigo} />
                  </View>
                  <Text style={styles.inputText}>
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={AppColors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputSection}>
              <Text style={styles.label}>
                Location / Bus Stop <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.enhancedInputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="location-outline" size={20} color={AppColors.indigo} />
                </View>
                <TextInput
                  style={styles.inputText}
                  placeholder="e.g., Kottawa Bus Stand"
                  value={location}
                  onChangeText={setLocation}
                  placeholderTextColor={AppColors.textLight}
                />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderContainer}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="document-text" size={24} color={AppColors.purple} />
              </View>
              <View>
                <Text style={styles.cardHeader}>Complaint Details</Text>
                <Text style={styles.cardSubheader}>Tell us more about the incident</Text>
              </View>
            </View>
            
            <View style={styles.inputSection}>
              <Text style={styles.label}>Priority Level</Text>
              <View style={styles.priorityContainer}>
                {["Low", "Medium", "High"].map((level) => (
                  <TouchableOpacity 
                    key={level} 
                    style={[
                      styles.priorityButton, 
                      priority === level && styles.priorityButtonSelected,
                      { 
                        borderColor: getPriorityColor(level),
                        backgroundColor: priority === level ? getPriorityColor(level) : AppColors.card
                      }
                    ]} 
                    onPress={() => setPriority(level)}
                  >
                    <View style={styles.priorityContent}>
                      <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(level) }]} />
                      <Text style={[
                        styles.priorityButtonText, 
                        priority === level && styles.priorityButtonTextSelected
                      ]}>
                        {level}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Please describe the incident in detail. Include what happened, who was involved, and any other relevant information..."
                multiline
                value={description}
                onChangeText={setDescription}
                placeholderTextColor={AppColors.textLight}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.inputSection}>
              <Text style={styles.label}>Attach Photo (Optional)</Text>
              <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                {image ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: image }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setImage(null)}>
                      <Ionicons name="close-circle" size={24} color={AppColors.danger} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadContent}>
                    <View style={styles.uploadIconContainer}>
                      <Ionicons name="camera-outline" size={32} color={AppColors.primary} />
                    </View>
                    <Text style={styles.uploadText}>Tap to upload an image</Text>
                    <Text style={styles.uploadSubtext}>Photos help us understand the issue better</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.card}>
            <View style={styles.cardHeaderContainer}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="person-circle" size={24} color={AppColors.accent} />
              </View>
              <View>
                <Text style={styles.cardHeader}>Contact Information</Text>
                <Text style={styles.cardSubheader}>How can we reach you?</Text>
              </View>
            </View>
            
            <View style={styles.inputSection}>
              <Text style={styles.label}>
                Email or Phone Number <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.enhancedInputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="mail-outline" size={20} color={AppColors.accent} />
                </View>
                <TextInput
                  style={styles.inputText}
                  placeholder="your.email@example.com or +94 77 123 4567"
                  value={contactInfo}
                  onChangeText={setContactInfo}
                  keyboardType="email-address"
                  placeholderTextColor={AppColors.textLight}
                />
              </View>
              <View style={styles.helperContainer}>
                <Ionicons name="information-circle-outline" size={16} color={AppColors.textSecondary} />
                <Text style={styles.helperText}>
                  We'll use this to send you updates about your complaint status.
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
            onPress={handleSubmit} 
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={isSubmitting ? [AppColors.textSecondary, AppColors.textSecondary] : [AppColors.primary, AppColors.primaryDark]}
              style={styles.submitButtonGradient}
            >
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                </View>
              ) : (
                <View style={styles.submitContainer}>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Submit Complaint</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <View style={styles.footerIconContainer}>
              <Ionicons name="shield-checkmark" size={20} color={AppColors.success} />
            </View>
            <Text style={styles.footerText}>
              Your complaint will be reviewed within 24-48 hours. We take all reports seriously and will investigate accordingly.
            </Text>
          </View>
        </ScrollView>
      </Animated.View>

      {showDatePicker && (
        <DateTimePicker 
          value={date} 
          mode="date" 
          display="default" 
          onChange={onDateChange} 
        />
      )}
      {showTimePicker && (
        <DateTimePicker 
          value={time} 
          mode="time" 
          display="default" 
          onChange={onTimeChange} 
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  animatedContainer: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    height: 70,
  },
  headerIconContainer: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginTop: 2,
  },
  notificationBadge: {
    position: "relative",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: AppColors.borderLight,
    borderRadius: 2,
    marginRight: 15,
  },
  progressFill: {
    width: "100%",
    height: "100%",
    backgroundColor: AppColors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  card: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
    elevation: 0,
    zIndex: 1,
  },
  cardHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: AppColors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  cardHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.text,
  },
  cardSubheader: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 10,
  },
  required: {
    color: AppColors.danger,
  },
  enhancedInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  inputIconContainer: {
    width: 32,
    alignItems: "center",
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  inputGroup: {
    flex: 1,
  },
  dropdownPicker: {
    backgroundColor: AppColors.background,
    borderColor: AppColors.border,
    borderRadius: 12,
    borderWidth: 2,
    height: 56,
    paddingHorizontal: 16,
  },
  dropdownContainer: {
    backgroundColor: AppColors.card,
    borderColor: AppColors.border,
    borderRadius: 12,
    borderWidth: 2,
    elevation: 10,
  },
  placeholderText: {
    color: AppColors.textLight,
    fontSize: 16,
  },
  priorityContainer: {
    flexDirection: "row",
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
  },
  priorityButtonSelected: {
  },
  priorityContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityButtonText: {
    color: AppColors.text,
    fontWeight: "600",
    fontSize: 14,
  },
  priorityButtonTextSelected: {
    color: "#FFFFFF",
  },
  descriptionInput: {
    backgroundColor: AppColors.background,
    borderRadius: 12,
    padding: 16,
    height: 120,
    fontSize: 16,
    color: AppColors.text,
    textAlignVertical: "top",
    borderWidth: 2,
    borderColor: AppColors.border,
    fontWeight: "500",
  },
  uploadBox: {
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: AppColors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.background,
  },
  uploadContent: {
    alignItems: "center",
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  uploadText: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  uploadSubtext: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 4,
  },
  helperContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    gap: 6,
  },
  helperText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  submitButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  submitContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: AppColors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.success,
  },
  footerIconContainer: {
    marginTop: 2,
  },
  footerText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
});