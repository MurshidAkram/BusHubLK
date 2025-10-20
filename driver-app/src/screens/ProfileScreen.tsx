import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDriver } from "../context/DriverContext";
import { driverAPI, storageAPI } from "../services/api";

// App Color Palette (matching TrackingScreen)
const AppColors = {
  background: "#F8F9FA",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryLight: "#1976d2",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  text: "#212529",
  textSecondary: "#6C757D",
  border: "#DEE2E6",
  red: "#dc3545",
  yellow: "#ffc107",
  green: "#198754",
  success: "#198754",
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
        placeholderTextColor={AppColors.textSecondary}
      />
    ) : (
      <Text style={styles.infoValue}>{value || "Not provided"}</Text>
    )}
  </View>
);

const ProfileScreen = ({ navigation }: any) => {
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshDriverData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.container} edges={["top"]}>
          <StatusBar
            backgroundColor="transparent"
            barStyle="light-content"
            translucent={false}
          />
          {/* Enhanced Header with Gradient */}
          <LinearGradient
            colors={['#0056b3', '#1976d2', '#42a5f5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>My Profile</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerActionButton}
                  onPress={handleRefresh}
                  disabled={isRefreshing}
                >
                  <Ionicons name="refresh" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={styles.loadingText}>Loading Profile...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error || !driverData) {
    return (
      <LinearGradient
        colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.container} edges={["top"]}>
          <StatusBar
            backgroundColor="transparent"
            barStyle="light-content"
            translucent={false}
          />
          {/* Enhanced Header with Gradient */}
          <LinearGradient
            colors={['#0056b3', '#1976d2', '#42a5f5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>My Profile</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerActionButton}
                  onPress={handleRefresh}
                  disabled={isRefreshing}
                >
                  <Ionicons name="refresh" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
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
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent={false}
        />
        
        {/* Enhanced Header with Gradient */}
        <LinearGradient
          colors={['#0056b3', '#1976d2', '#42a5f5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
            <View style={styles.headerActions}>
              {/* Refresh button removed */}
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              tintColor={AppColors.primary}
              colors={[AppColors.primary]}
            />
          }
        >
          {/* Profile Header Card */}
          <View style={styles.card}>
            <LinearGradient
              colors={[AppColors.primary, AppColors.primaryLight]}
              style={styles.profileHeaderGradient}
            >
              <Text style={styles.driverName}>
                {driverData.first_name} {driverData.last_name}
              </Text>
              <Text style={styles.driverRole}>Certified SLTB Bus Driver</Text>
              <View style={styles.driverIdBadge}>
                <MaterialCommunityIcons name="badge-account" size={16} color="#FFFFFF" />
                <Text style={styles.driverIdText}>ID: DRV-{driverData.driver_id}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Personal Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderCentered}>
              <MaterialCommunityIcons
                name="account-details"
                size={24}
                color={AppColors.primary}
              />
              <Text style={styles.cardTitleCentered}>Personal Information</Text>
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
                        <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Organizational Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderCentered}>
              <MaterialCommunityIcons
                name="office-building"
                size={24}
                color={AppColors.primary}
              />
              <Text style={styles.cardTitleCentered}>Organizational Details</Text>
            </View>

            <View style={styles.organizationGrid}>
              {/* First Row - Depot and Region */}
              <View style={styles.organizationRow}>
                <View style={styles.organizationItemHalf}>
                  <MaterialCommunityIcons name="garage" size={18} color={AppColors.primary} />
                  <Text style={styles.organizationLabel}>Depot</Text>
                  <Text style={styles.organizationValue}>
                    {driverData.depot_name || `ID: ${driverData.depot_id}`}
                  </Text>
                  {driverData.depot_location && (
                    <Text style={styles.organizationSubValue}>📍 {driverData.depot_location}</Text>
                  )}
                </View>

                <View style={styles.organizationItemHalf}>
                  <MaterialCommunityIcons name="map-marker-radius" size={18} color={AppColors.primary} />
                  <Text style={styles.organizationLabel}>Region</Text>
                  <Text style={styles.organizationValue}>
                    {driverData.region_name || `ID: ${driverData.region_id}`}
                  </Text>
                </View>
              </View>

              {/* Second Row - Depot Manager (if exists) */}
              {driverData.depot_manager_name && (
                <View style={styles.organizationItemFull}>
                  <MaterialCommunityIcons name="account-tie" size={18} color={AppColors.primary} />
                  <Text style={styles.organizationLabel}>Depot Manager</Text>
                  <Text style={styles.organizationValue}>{driverData.depot_manager_name}</Text>
                  <View style={styles.managerContactRow}>
                    {driverData.depot_manager_phone && (
                      <Text style={styles.organizationSubValue}>📞 {driverData.depot_manager_phone}</Text>
                    )}
                    {driverData.depot_manager_email && (
                      <Text style={styles.organizationSubValue}>✉️ {driverData.depot_manager_email}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
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
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 2,
    borderWidth: 0,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  profileHeaderGradient: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 16,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  driverName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  driverRole: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 12,
    fontWeight: '500',
  },
  driverIdBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  driverIdText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardHeaderCentered: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.text,
    marginLeft: 10,
    flex: 1,
    letterSpacing: 0.3,
  },
  cardTitleCentered: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.text,
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  editButton: {
    padding: 4,
  },
  infoCard: {
    paddingVertical: 0,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  infoLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: "600",
    width: "35%",
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    letterSpacing: 0.2,
  },
  infoInput: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 86, 179, 0.05)',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  saveButton: {
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  organizationGrid: {
    padding: 14,
    paddingTop: 10,
    gap: 10,
  },
  organizationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  organizationItemHalf: {
    flex: 1,
    backgroundColor: 'rgba(0, 86, 179, 0.04)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 86, 179, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
  },
  organizationItemFull: {
    backgroundColor: 'rgba(0, 86, 179, 0.04)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 86, 179, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
  },
  organizationLabel: {
    fontSize: 10,
    color: AppColors.textSecondary,
    fontWeight: "700",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 4,
  },
  organizationValue: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  organizationSubValue: {
    fontSize: 12,
    color: AppColors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 2,
  },
  managerContactRow: {
    flexDirection: 'column',
    gap: 4,
    marginTop: 4,
  },
});

export default ProfileScreen;