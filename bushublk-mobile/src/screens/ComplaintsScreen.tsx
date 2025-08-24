import React,{ useState } from "react";
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
  ActivityIndicator, // Import ActivityIndicator
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

// --- App Color Palette ---
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
  lightGrey: '#F1F3F5',
};

type ComplaintsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Complaints'>;

export default function ComplaintsScreen() {
  const navigation = useNavigation<ComplaintsScreenNavigationProp>();

  // --- NEW: Loading state for submission ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Dropdown State ---
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

  // --- Form State ---
  const [routeNumber, setRouteNumber] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [image, setImage] = useState<string | null>(null);

  // --- Date & Time Picker State ---
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

    setIsSubmitting(true); // --- NEW: Activate loading state

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
      setIsSubmitting(false); // --- NEW: Deactivate loading state
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconContainer}>
          <Ionicons name="arrow-back-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>File a Complaint</Text>
        <TouchableOpacity onPress={() => navigation.navigate("ComplaintHistory")} style={styles.headerIconContainer}>
          <Ionicons name="time-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* --- CARD 1: INCIDENT DETAILS --- */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Incident Details</Text>
          <Text style={styles.label}>Type of Complaint</Text>
          <DropDownPicker
            open={complaintTypeOpen}
            value={complaintTypeValue}
            items={complaintTypeItems}
            setOpen={setComplaintTypeOpen}
            setValue={setComplaintTypeValue}
            setItems={setComplaintTypeItems}
            style={styles.dropdownPicker}
            placeholder="Select a complaint type"
            placeholderStyle={styles.placeholderText}
            dropDownContainerStyle={styles.dropdownContainer}
            listMode="SCROLLVIEW"
            zIndex={3000}
            zIndexInverse={1000}
          />

          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Route No.</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="bus-outline" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputText}
                  placeholder="e.g., 177"
                  value={routeNumber}
                  onChangeText={setRouteNumber}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bus No. (Optional)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="information-circle-outline" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputText}
                  placeholder="e.g., ND-1234"
                  value={busNumber}
                  onChangeText={setBusNumber}
                />
              </View>
            </View>
          </View>
        </View>

        {/* --- CARD 2: TIME & PLACE --- */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Time & Place</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputContainer}>
                <Ionicons name="calendar-outline" style={styles.inputIcon} />
                <Text style={styles.inputText}>{date.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.inputContainer}>
                <Ionicons name="time-outline" style={styles.inputIcon} />
                <Text style={styles.inputText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.label}>Location / Bus Stop</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" style={styles.inputIcon} />
            <TextInput
              style={styles.inputText}
              placeholder="e.g., Kottawa"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* --- CARD 3: COMPLAINT DETAILS --- */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Complaint Details</Text>
          <Text style={styles.label}>Priority Level</Text>
          <View style={styles.priorityContainer}>
            {["Low", "Medium", "High"].map((level) => (
              <TouchableOpacity key={level} style={[styles.priorityButton, priority === level && styles.priorityButtonSelected, { borderColor: level === 'Low' ? AppColors.green : level === 'Medium' ? AppColors.yellow : AppColors.red }]} onPress={() => setPriority(level)}>
                <Text style={[styles.priorityButtonText, priority === level && styles.priorityButtonTextSelected]}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Please describe the incident in detail..."
            multiline
            value={description}
            onChangeText={setDescription}
          />
          
          <Text style={styles.label}>Attach Photo (Optional)</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={32} color={AppColors.textSecondary} />
                <Text style={styles.uploadText}>Tap to upload an image</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {/* --- CARD 4: CONTACT INFO --- */}
        <View style={styles.card}>
            <Text style={styles.cardHeader}>Your Contact Information</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="person-circle-outline" style={styles.inputIcon} />
                <TextInput
                    style={styles.inputText}
                    placeholder="Email or Phone Number"
                    value={contactInfo}
                    onChangeText={setContactInfo}
                    keyboardType="email-address"
                />
            </View>
            <Text style={styles.helperText}>We'll use this to send you updates about your complaint.</Text>
        </View>


        {/* --- SUBMIT BUTTON --- */}
        <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Complaint</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />}
      {showTimePicker && <DateTimePicker value={time} mode="time" display="default" onChange={onTimeChange} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  contentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: 60,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  headerIconContainer: {
    padding: 5,
  },
  card: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: AppColors.textSecondary,
    marginBottom: 8,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.lightGrey,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  inputIcon: {
    fontSize: 20,
    color: AppColors.textSecondary,
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputGroup: {
    width: "48%",
  },
  dropdownPicker: {
    backgroundColor: AppColors.lightGrey,
    borderColor: AppColors.border,
    borderRadius: 10,
  },
  dropdownContainer: {
    backgroundColor: AppColors.card,
    borderColor: AppColors.border,
    borderRadius: 10,
  },
  placeholderText: {
    color: AppColors.textSecondary,
  },
  priorityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: AppColors.lightGrey,
    borderWidth: 1.5,
    marginHorizontal: 4,
  },
  priorityButtonSelected: {
    backgroundColor: AppColors.primaryMuted,
    borderColor: AppColors.primary,
  },
  priorityButtonText: {
    color: AppColors.textSecondary,
    fontWeight: "600",
  },
  priorityButtonTextSelected: {
    color: AppColors.primary,
  },
  descriptionInput: {
    backgroundColor: AppColors.lightGrey,
    borderRadius: 10,
    padding: 15,
    height: 120,
    fontSize: 16,
    color: AppColors.text,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  uploadBox: {
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.lightGrey,
    marginTop: 8,
  },
  uploadText: {
    marginTop: 8,
    color: AppColors.textSecondary,
    fontSize: 14,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  helperText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 8,
    marginLeft: 5,
  },
  submitButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    elevation: 2,
  },
  submitButtonDisabled: {
    backgroundColor: AppColors.textSecondary,
    opacity: 0.8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});