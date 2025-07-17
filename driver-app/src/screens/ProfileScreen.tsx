import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// App Color Palette (matching HomeScreen)
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

// Header component
const Header = () => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>My Profile</Text>
  </View>
);

const ProfileInfoRow = ({ label, value, isEditing, onChangeText, editable = true, keyboardType = "default" }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    {isEditing && editable ? (
      <TextInput
        style={styles.infoInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    ) : (
      <Text style={styles.infoValue}>{value || "Not provided"}</Text>
    )}
  </View>
);

const ProfileScreen = ({ route }) => {
  const [driverData, setDriverData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    const loadDriverData = async () => {
      try {
        const driverFromParams = route?.params?.driver;
        if (driverFromParams) {
          setDriverData(driverFromParams);
          setEditedData(driverFromParams);
          return;
        }

        const storedDriverData = await AsyncStorage.getItem("driverData");
        if (storedDriverData) {
          const driver = JSON.parse(storedDriverData);
          setDriverData(driver);
          setEditedData(driver);
          return;
        }

        console.log("No real user data found. Using temporary test data.");
        const fallbackData = {
          first_name: "John",
          last_name: "Doe",
          email: "johndoe@email.com",
          phone: "0771234567",
          username: "johndoe99",
          depot_id: "DPT-01",
          region_id: "RGN-W",
        };
        setDriverData(fallbackData);
        setEditedData(fallbackData);
      } catch (error) {
        console.error("Error loading driver data:", error);
        Alert.alert("Error", "Could not load driver data.");
      }
    };

    loadDriverData();
  }, [route?.params?.driver]);

  const handleInputChange = (key, value) => {
    setEditedData(prevData => ({ ...prevData, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const updatedDriver = { ...driverData, ...editedData };
      await AsyncStorage.setItem("driverData", JSON.stringify(updatedDriver));
      setDriverData(updatedDriver);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  const handleCancel = () => {
    setEditedData(driverData);
    setIsEditing(false);
  };

  if (!driverData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.red} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />
      <Header />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Profile Header Card */}
        <View style={styles.profileHeader}>
          <Ionicons name="person-circle-outline" size={80} color={AppColors.red} />
          <Text style={styles.driverName}>
            {driverData.first_name} {driverData.last_name}
          </Text>
          <Text style={styles.driverRole}>Bus Driver</Text>
        </View>

        {/* Profile Information Section */}
        <View style={styles.infoContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => (isEditing ? handleCancel() : setIsEditing(true))}>
              <Ionicons
                name={isEditing ? "close-circle-outline" : "pencil-outline"}
                size={24}
                color={AppColors.red}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <ProfileInfoRow
              label="First Name"
              value={editedData.first_name}
              isEditing={isEditing}
              onChangeText={text => handleInputChange("first_name", text)}
            />
            <ProfileInfoRow
              label="Last Name"
              value={editedData.last_name}
              isEditing={isEditing}
              onChangeText={text => handleInputChange("last_name", text)}
            />
            <ProfileInfoRow
              label="Email"
              value={editedData.email}
              isEditing={isEditing}
              keyboardType="email-address"
              onChangeText={text => handleInputChange("email", text)}
            />
            <ProfileInfoRow
              label="Phone"
              value={editedData.phone}
              isEditing={isEditing}
              keyboardType="phone-pad"
              onChangeText={text => handleInputChange("phone", text)}
            />
            <ProfileInfoRow label="Driver ID" value={driverData.username} editable={false} />
            <ProfileInfoRow label="Depot ID" value={driverData.depot_id} editable={false} />
            <ProfileInfoRow label="Region ID" value={driverData.region_id} editable={false} />
          </View>

          {isEditing && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primary, // Was #005A9C
  },
  header: {
    backgroundColor: AppColors.primary, // Was #005A9C
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 15,
    paddingBottom: 15,
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF", // Kept white for contrast on primary background
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollView: {
    backgroundColor: AppColors.background, // Was #f8fafc
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: AppColors.background, // Was #f8fafc
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.text, // Was #1f2937
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: AppColors.card, // Was #ffffff
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  driverName: {
    fontSize: 22,
    fontWeight: "bold",
    color: AppColors.text, // Was #1f2937
    marginTop: 12,
  },
  driverRole: {
    fontSize: 16,
    color: AppColors.textSecondary, // Was #6b7280
  },
  infoContainer: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text, // Was #1f2937
  },
  infoCard: {
    backgroundColor: AppColors.card, // Was #ffffff
    borderRadius: 16,
    padding: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border, // Was #f1f5f9
  },
  infoLabel: {
    fontSize: 14,
    color: AppColors.textSecondary, // Was #6b7280
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: AppColors.text, // Was #1f2937
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  infoInput: {
    fontSize: 14,
    color: AppColors.text, // Was #1f2937
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    paddingVertical: 2,
  },
  buttonContainer: {
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: AppColors.primary, // Was #dc2626
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfileScreen;