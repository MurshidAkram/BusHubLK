import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { storageAPI, driverAPI } from "../services/api";

interface DriverData {
  user_id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  username: string;
  license_number?: string;
  experience_years?: number;
  assigned_bus?: string;
  depot_name?: string;
  profile_image?: string;
}

export default function ProfileScreen() {
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<DriverData | null>(null);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      setIsLoading(true);
      console.log("📱 Loading driver profile data...");
      
      // First try to get from local storage
      const userData = await storageAPI.getUserData();
      if (userData) {
        setDriverData(userData);
        setEditedData(userData);
        console.log("✅ Driver data loaded from storage");
      }

      // Then try to fetch fresh data from API
      try {
        const response = await driverAPI.getDriverProfile();
        if (response.success && response.data) {
          setDriverData(response.data);
          setEditedData(response.data);
          // Update local storage with fresh data
          await storageAPI.storeUserData(response.data);
          console.log("✅ Driver data refreshed from API");
        }
      } catch (apiError) {
        console.log("⚠️ API fetch failed, using cached data");
      }

    } catch (error) {
      console.error("❌ Error loading driver data:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof DriverData, value: string) => {
    if (editedData) {
      setEditedData({
        ...editedData,
        [field]: value,
      });
    }
  };

  const handleSave = async () => {
    if (!editedData) return;

    try {
      setIsSaving(true);
      console.log("💾 Saving driver profile...");

      // Save to local storage first
      await storageAPI.storeUserData(editedData);
      setDriverData(editedData);
      
      // Try to sync with API
      try {
        const response = await driverAPI.updateDriverProfile(editedData);
        if (response.success) {
          console.log("✅ Profile synced with server");
        }
      } catch (apiError) {
        console.log("⚠️ API sync failed, saved locally");
      }

      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
      
    } catch (error) {
      console.error("❌ Error saving driver data:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(driverData);
    setIsEditing(false);
  };

  const handleRefresh = () => {
    loadDriverData();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#005A9C" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#005A9C" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!driverData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#005A9C" />
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#ccc" />
          <Text style={styles.errorText}>No profile data found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#005A9C" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Profile</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {driverData.profile_image ? (
              <Image source={{ uri: driverData.profile_image }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={60} color="#005A9C" />
              </View>
            )}
          </View>
          <Text style={styles.driverName}>
            {driverData.first_name} {driverData.last_name}
          </Text>
          <Text style={styles.driverRole}>Bus Driver</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isEditing ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={20} color="white" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Profile Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedData?.first_name || ''}
                onChangeText={(text) => handleInputChange('first_name', text)}
                placeholder="Enter first name"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.inputValue}>{driverData.first_name}</Text>
            )}
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedData?.last_name || ''}
                onChangeText={(text) => handleInputChange('last_name', text)}
                placeholder="Enter last name"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.inputValue}>{driverData.last_name}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedData?.email || ''}
                onChangeText={(text) => handleInputChange('email', text)}
                placeholder="Enter email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.inputValue}>{driverData.email}</Text>
            )}
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedData?.phone || ''}
                onChangeText={(text) => handleInputChange('phone', text)}
                placeholder="Enter phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.inputValue}>{driverData.phone || 'Not provided'}</Text>
            )}
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <Text style={styles.inputValue}>{driverData.username}</Text>
            {isEditing && (
              <Text style={styles.inputNote}>Username cannot be changed</Text>
            )}
          </View>
        </View>

        {/* Professional Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Professional Information</Text>
          
          {/* License Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>License Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedData?.license_number || ''}
                onChangeText={(text) => handleInputChange('license_number', text)}
                placeholder="Enter license number"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.inputValue}>{driverData.license_number || 'Not provided'}</Text>
            )}
          </View>

          {/* Experience Years */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Years of Experience</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedData?.experience_years?.toString() || ''}
                onChangeText={(text) => handleInputChange('experience_years', text)}
                placeholder="Enter years of experience"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.inputValue}>
                {driverData.experience_years ? `${driverData.experience_years} years` : 'Not provided'}
              </Text>
            )}
          </View>

          {/* Assigned Bus */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Assigned Bus</Text>
            <Text style={styles.inputValue}>{driverData.assigned_bus || 'Not assigned'}</Text>
          </View>

          {/* Depot */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Depot</Text>
            <Text style={styles.inputValue}>{driverData.depot_name || 'Not assigned'}</Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#005A9C",
  },
  header: {
    backgroundColor: "#005A9C",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  refreshButton: {
    padding: 5,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#005A9C",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  profileSection: {
    backgroundColor: "white",
    alignItems: "center",
    paddingVertical: 30,
    marginBottom: 20,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#005A9C",
  },
  driverName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  driverRole: {
    fontSize: 16,
    color: "#666",
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: "#005A9C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#28a745",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#94d3a2",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  infoSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  inputValue: {
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  inputNote: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  bottomSpacing: {
    height: 20,
  },
});
