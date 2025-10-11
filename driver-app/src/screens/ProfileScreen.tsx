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
import { LinearGradient } from "expo-linear-gradient";
import { useDriver } from "../context/DriverContext";
import { driverAPI, storageAPI } from "../services/api";
import AppHeader from "../components/AppHeader";

// App Color Palette (matching HomeScreen)
const AppColors = {
  background: "#F8FAFF",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryLight: "#0076e3",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  text: "#212529",
  textSecondary: "#6C757D",
  border: "#DEE2E6",
  red: "#dc3545",
  yellow: "#ffc107",
  green: "#198754",
};

interface ProfileInfoRowProps {
  label: string;
  value: string;
  isEditing: boolean;
  onChangeText?: (text: string) => void;
  editable?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
}

const ProfileInfoRow = ({ 
  label, 
  value, 
  isEditing, 
  onChangeText, 
  editable = true, 
  keyboardType = "default" 
}: ProfileInfoRowProps) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    {isEditing && editable && onChangeText ? (
      <TextInput
        style={styles.infoInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    ) : (
      <Text style={styles.infoValue}>{value || "Not provided"}</Text>
    )}
  </View>
);

const ProfileScreen = () => {
  const { driverData, isLoading, error, refreshDriverData, setDriverData } = useDriver();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editedData, setEditedData] = useState({
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (driverData) {
      setEditedData({
        email: driverData.email || "",
        phone: driverData.phone || "",
      });
    }
  }, [driverData]);

  const handleInputChange = (key: keyof typeof editedData, value: string) => {
    setEditedData(prevData => ({ ...prevData, [key]: value }));
  };

  const validateInput = () => {
    if (!editedData.email.trim()) {
      Alert.alert("Validation Error", "Email is required");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedData.email)) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }
    
    if (!editedData.phone.trim()) {
      Alert.alert("Validation Error", "Phone number is required");
      return false;
    }
    
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(editedData.phone)) {
      Alert.alert("Validation Error", "Please enter a valid phone number");
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateInput()) return;
    
    try {
      setIsSaving(true);
      
      // Update via API
      const response = await driverAPI.updateDriverProfile({
        email: editedData.email,
        phone: editedData.phone,
      });
      
      if (response.success) {
        // Update context with the updated user data from API response
        const updatedDriverData = {
          ...driverData,
          id: response.user.id?.toString() || driverData?.id || "",
          email: response.user.email,
          phone: response.user.phone,
          username: response.user.username || driverData?.username || "",
          first_name: response.user.first_name || driverData?.first_name || "",
          last_name: response.user.last_name || driverData?.last_name || "",
          driver_id: response.user.driver_id?.toString() || driverData?.driver_id || "",
          depot_id: response.user.depot_id || driverData?.depot_id || 0,
          region_id: response.user.region_id || driverData?.region_id || 0,
          license_number: response.user.license_number || driverData?.license_number,
          role: response.user.role || driverData?.role || "",
          role_name: response.user.role_name || driverData?.role_name || "",
          // Additional organizational information
          depot_name: response.user.depot_name || driverData?.depot_name,
          depot_location: response.user.depot_location || driverData?.depot_location,
          region_name: response.user.region_name || driverData?.region_name,
          depot_manager_name: response.user.depot_manager_name || driverData?.depot_manager_name,
          depot_manager_phone: response.user.depot_manager_phone || driverData?.depot_manager_phone,
          depot_manager_email: response.user.depot_manager_email || driverData?.depot_manager_email,
        };
        
        // Update storage
        await storageAPI.storeUserData(updatedDriverData);
        
        // Update context
        setDriverData(updatedDriverData);
        
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        Alert.alert("Error", response.error || "Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (driverData) {
      setEditedData({
        email: driverData.email || "",
        phone: driverData.phone || "",
      });
    }
    setIsEditing(false);
  };

  const handleRefresh = () => {
    refreshDriverData();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader 
          title="My Profile"
          rightIcon={isRefreshing ? "sync" : "refresh"}
          onRightPress={handleRefresh}
          rightIconDisabled={isRefreshing}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !driverData) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader 
          title="My Profile"
          rightIcon={isRefreshing ? "sync" : "refresh"}
          onRightPress={handleRefresh}
          rightIconDisabled={isRefreshing}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={AppColors.red} />
          <Text style={styles.errorTitle}>Profile Error</Text>
          <Text style={styles.errorText}>
            {error || "Unable to load profile data"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />
      <AppHeader 
        title="My Profile"
        rightIcon={isRefreshing ? "sync" : "refresh"}
        onRightPress={handleRefresh}
        rightIconDisabled={isRefreshing}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={[AppColors.primary, AppColors.primaryLight]}
            style={styles.avatarContainer}
          >
            <Ionicons name="person" size={48} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.driverName}>
            {driverData.first_name} {driverData.last_name}
          </Text>
          <Text style={styles.driverRole}>Certified SLTB Bus Driver</Text>
          <View style={styles.driverIdBadge}>
            <Text style={styles.driverIdText}>ID: {driverData.driver_id}</Text>
          </View>
        </View>

        {/* Profile Information Section */}
        <View style={styles.infoContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity 
              onPress={() => (isEditing ? handleCancel() : setIsEditing(true))}
              style={styles.editButton}
            >
              <Ionicons
                name={isEditing ? "close-circle" : "pencil"}
                size={24}
                color={AppColors.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            {/* Read-only fields */}
            <ProfileInfoRow
              label="First Name"
              value={driverData.first_name || ""}
              isEditing={false}
              editable={false}
            />
            <ProfileInfoRow
              label="Last Name"
              value={driverData.last_name || ""}
              isEditing={false}
              editable={false}
            />
            <ProfileInfoRow
              label="Username"
              value={driverData.username || ""}
              isEditing={false}
              editable={false}
            />
            
            {/* Editable fields */}
            <ProfileInfoRow
              label="Email"
              value={isEditing ? editedData.email : driverData.email || ""}
              isEditing={isEditing}
              keyboardType="email-address"
              onChangeText={(text) => handleInputChange("email", text)}
              editable={true}
            />
            <ProfileInfoRow
              label="Phone"
              value={isEditing ? editedData.phone : driverData.phone || ""}
              isEditing={isEditing}
              keyboardType="phone-pad"
              onChangeText={(text) => handleInputChange("phone", text)}
              editable={true}
            />
            
            {/* Organizational Information */}
            <ProfileInfoRow
              label="Depot"
              value={driverData.depot_name || `Depot ID: ${driverData.depot_id}`}
              isEditing={false}
              editable={false}
            />
            {driverData.depot_location && (
              <ProfileInfoRow
                label="Depot Location"
                value={driverData.depot_location}
                isEditing={false}
                editable={false}
              />
            )}
            <ProfileInfoRow
              label="Region"
              value={driverData.region_name || `Region ID: ${driverData.region_id}`}
              isEditing={false}
              editable={false}
            />
            {driverData.depot_manager_name && (
              <ProfileInfoRow
                label="Depot Manager"
                value={driverData.depot_manager_name}
                isEditing={false}
                editable={false}
              />
            )}
            {driverData.depot_manager_phone && (
              <ProfileInfoRow
                label="Manager Phone"
                value={driverData.depot_manager_phone}
                isEditing={false}
                editable={false}
              />
            )}
            {driverData.depot_manager_email && (
              <ProfileInfoRow
                label="Manager Email"
                value={driverData.depot_manager_email}
                isEditing={false}
                editable={false}
              />
            )}
            <ProfileInfoRow
              label="License Number"
              value={driverData.license_number || "Not provided"}
              isEditing={false}
              editable={false}
            />
          </View>

          {isEditing && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={[AppColors.primary, AppColors.primaryLight]}
                  style={styles.saveButtonGradient}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
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
    backgroundColor: AppColors.background,
  },
  scrollView: {
    backgroundColor: AppColors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    backgroundColor: AppColors.background,
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: AppColors.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: AppColors.card,
    borderRadius: 20,
    marginBottom: 24,
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
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  driverName: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  driverRole: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginBottom: 12,
  },
  driverIdBadge: {
    backgroundColor: AppColors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  driverIdText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "600",
  },
  infoContainer: {
    marginBottom: 24,
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
    color: AppColors.text,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  editButton: {
    padding: 4,
  },
  infoCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    paddingVertical: 8,
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: "500",
    width: "35%",
  },
  infoValue: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  infoInput: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  buttonContainer: {
    marginTop: 20,
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
});

export default ProfileScreen;