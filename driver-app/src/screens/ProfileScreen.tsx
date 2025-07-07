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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProfileScreen = ({ navigation, route }) => {
  const [driverData, setDriverData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      let driver = route?.params?.driver;

      if (!driver) {
        const storedDriverData = await AsyncStorage.getItem("driverData");
        if (storedDriverData) {
          driver = JSON.parse(storedDriverData);
        }
      }

      if (driver) {
        setDriverData(driver);
        setEditedData({
          first_name: driver.first_name,
          last_name: driver.last_name,
          phone: driver.phone,
          email: driver.email,
        });
      }
    } catch (error) {
      console.error("Error loading driver data:", error);
    }
  };

  const handleSave = async () => {
    try {
      // Here you would typically make an API call to update the profile
      // For now, we'll just update the local storage
      const updatedDriver = { ...driverData, ...editedData };
      await AsyncStorage.setItem("driverData", JSON.stringify(updatedDriver));
      setDriverData(updatedDriver);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setEditedData({
      first_name: driverData.first_name,
      last_name: driverData.last_name,
      phone: driverData.phone,
      email: driverData.email,
    });
    setIsEditing(false);
  };

  if (!driverData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={80} color="#dc2626" />
          </View>
          <Text style={styles.driverName}>
            {driverData.first_name} {driverData.last_name}
          </Text>
          <Text style={styles.driverRole}>Bus Driver</Text>
        </View>

        {/* Profile Information */}
        <View style={styles.infoContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons
                name={isEditing ? "close-outline" : "pencil-outline"}
                size={20}
                color="#dc2626"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>First Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editedData.first_name}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, first_name: text })
                  }
                />
              ) : (
                <Text style={styles.infoValue}>{driverData.first_name}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editedData.last_name}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, last_name: text })
                  }
                />
              ) : (
                <Text style={styles.infoValue}>{driverData.last_name}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editedData.email}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, email: text })
                  }
                  keyboardType="email-address"
                />
              ) : (
                <Text style={styles.infoValue}>{driverData.email}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editedData.phone}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, phone: text })
                  }
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {driverData.phone || "Not provided"}
                </Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Driver ID</Text>
              <Text style={styles.infoValue}>{driverData.username}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Depot ID</Text>
              <Text style={styles.infoValue}>{driverData.depot_id}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Region ID</Text>
              <Text style={styles.infoValue}>{driverData.region_id}</Text>
            </View>
          </View>

          {isEditing && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
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
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#ffffff",
    marginTop: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  driverName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  driverRole: {
    fontSize: 16,
    color: "#6b7280",
  },
  infoContainer: {
    marginTop: 20,
    marginBottom: 30,
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
    color: "#1f2937",
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  infoInput: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    borderBottomWidth: 1,
    borderBottomColor: "#dc2626",
    paddingVertical: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfileScreen;
