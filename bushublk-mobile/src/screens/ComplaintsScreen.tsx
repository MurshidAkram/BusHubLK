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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
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
};

export default function ComplaintsScreen() {
  const navigation = useNavigation();

  // --- Dropdown State ---
  const [complaintTypeOpen, setComplaintTypeOpen] = useState(false);
  const [complaintTypeValue, setComplaintTypeValue] = useState(null);
  const [complaintTypeItems, setComplaintTypeItems] = useState([
    { label: "Staff Conduct (Driver/Conductor)", value: "staff_conduct" },
    { label: "Reckless Driving", value: "reckless_driving" },
    { label: "Bus Not Stopping at Designated Stops", value: "not_stopping" },
    { label: "Ticketing Issue (e.g., Overcharge)", value: "ticketing_issue" },
    { label: "Bus Condition (e.g., Unclean)", value: "bus_condition" },
    { label: "Harassment", value: "harassment" },
    { label: "Route Deviation", value: "route_deviation" },
    { label: "Other", value: "other" },
  ]);

  // --- Other Form State ---
  const [routeNumber, setRouteNumber] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("Low");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [contactInfo, setContactInfo] = useState("");

  // --- Date & Time Picker State ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // --- Handler for Date Change ---
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  // --- Handler for Time Change ---
  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === "ios");
    setTime(currentTime);
  };

  // --- Handler for Image Picker ---
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Sorry, we need camera roll permissions to make this work!"
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // --- Form Submission Handler ---
  const handleSubmit = () => {
    if (
      !complaintTypeValue ||
      !routeNumber ||
      !location ||
      !description ||
      !contactInfo
    ) {
      Alert.alert("Missing Information", "Please fill all required fields.");
      return;
    }

    const complaintData = {
      complaintType: complaintTypeValue,
      routeNumber,
      busNumber,
      date: date.toLocaleDateString(),
      time: time.toLocaleTimeString(),
      location,
      priority,
      description,
      image,
      contactInfo,
    };

    Alert.alert("Complaint Submitted", JSON.stringify(complaintData, null, 2));
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconContainer}
        >
          <Icon name="arrow-back-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Complaint</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* --- Complaint Type Dropdown --- */}
          <Text style={styles.label}>Complaint Type</Text>
       <DropDownPicker
    open={complaintTypeOpen}
    value={complaintTypeValue}
    items={complaintTypeItems}
    setOpen={setComplaintTypeOpen}
    setValue={setComplaintTypeValue}
    setItems={setComplaintTypeItems}
    style={styles.dropdownPicker}
    textStyle={styles.inputText}
    placeholder="Select a complaint type"
    placeholderStyle={styles.placeholderText}
    dropDownContainerStyle={styles.dropdownContainer}
    
    listMode="SCROLLVIEW" // <-- THIS IS THE CORRECT FIX for your requirement

    zIndex={3000}
    zIndexInverse={1000}
  />

          {/* --- Route & Bus Number --- */}
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Route Number</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.inputText}
                  placeholder="e.g., 177"
                  placeholderTextColor={AppColors.textSecondary}
                  value={routeNumber}
                  onChangeText={setRouteNumber}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bus Number (Optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.inputText}
                  placeholder="e.g., ND-1234"
                  placeholderTextColor={AppColors.textSecondary}
                  value={busNumber}
                  onChangeText={setBusNumber}
                />
              </View>
            </View>
          </View>

          {/* --- Date & Time Pickers --- */}
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.inputContainer}
              >
                <Icon name="calendar-outline" style={styles.inputIcon} />
                <Text style={styles.inputText}>{date.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={styles.inputContainer}
              >
                <Icon name="time-outline" style={styles.inputIcon} />
                <Text style={styles.inputText}>
                  {time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- Location --- */}
          <Text style={styles.label}>Location/Stop</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputText}
              placeholder="Bus stop or location"
              placeholderTextColor={AppColors.textSecondary}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* --- Priority Level --- */}
          <Text style={styles.label}>Priority Level</Text>
          <View style={styles.priorityContainer}>
            {["Low", "Medium", "High"].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.priorityButton,
                  priority === level && styles.priorityButtonSelected,
                  level === "Low" && priority === "Low" && styles.priorityLow,
                  level === "Medium" &&
                    priority === "Medium" &&
                    styles.priorityMedium,
                  level === "High" && priority === "High" && styles.priorityHigh,
                ]}
                onPress={() => setPriority(level)}
              >
                <Text
                  style={[
                    styles.priorityButtonText,
                    priority === level && styles.priorityButtonTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* --- Description --- */}
          <Text style={styles.label}>Description</Text>
          <View style={[styles.inputContainer, { height: 120 }]}>
            <TextInput
              style={[styles.inputText, { textAlignVertical: "top", paddingTop: 15 }]}
              placeholder="Please describe your complaint in detail..."
              placeholderTextColor={AppColors.textSecondary}
              multiline
              numberOfLines={5}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* --- File Attachment --- */}
          <Text style={styles.label}>Attach Photo/Video (Optional)</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <>
                <Icon
                  name="camera-outline"
                  size={40}
                  color={AppColors.textSecondary}
                />
                <Text style={styles.uploadText}>
                  Upload a file (PNG, JPG, up to 10 MB)
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* --- Contact Info --- */}
          <Text style={styles.label}>Contact Information</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputText}
              placeholder="Your email/phone for updates"
              placeholderTextColor={AppColors.textSecondary}
              value={contactInfo}
              onChangeText={setContactInfo}
              keyboardType="email-address"
            />
          </View>

          {/* --- Submit Button --- */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Complaint</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- Date & Time Picker Modals --- */}
      {showDatePicker && (
        <DateTimePicker
          testID="datePicker"
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          testID="timePicker"
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
  contentContainer: {
    paddingHorizontal: 20,
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
  form: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: AppColors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.card,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  dropdownPicker: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    height: 50,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  dropdownContainer: {
    backgroundColor: AppColors.card,
    borderColor: AppColors.border,
    borderRadius: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
  },
  placeholderText: {
    color: AppColors.textSecondary,
    fontSize: 16,
  },
  inputIcon: {
    fontSize: 20,
    color: AppColors.primary,
    marginRight: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputGroup: {
    width: "48%",
  },
  priorityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginHorizontal: 4,
  },
  priorityButtonSelected: {
    borderWidth: 1.5,
  },
  priorityLow: { borderColor: AppColors.green },
  priorityMedium: { borderColor: AppColors.yellow },
  priorityHigh: { borderColor: AppColors.red },
  priorityButtonText: {
    color: AppColors.textSecondary,
    fontWeight: "600",
  },
  priorityButtonTextSelected: {
    color: AppColors.primary,
  },
  uploadBox: {
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.card,
    padding: 10,
  },
  uploadText: {
    marginTop: 8,
    color: AppColors.textSecondary,
    textAlign: "center",
    fontSize: 12,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    resizeMode: "cover",
  },
  submitButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 30,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});