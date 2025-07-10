import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { storageAPI } from "../services/api"; // Use our centralized API

export default function ProfileScreen() {
  const [driverData, setDriverData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      // Use storageAPI instead of direct AsyncStorage
      const userData = await storageAPI.getUserData();
      if (userData) {
        setDriverData(userData);
      }
    } catch (error) {
      console.error("Error loading driver data:", error);
    }
  };

  const saveDriverData = async (updatedDriver) => {
    try {
      // Use storageAPI instead of direct AsyncStorage
      await storageAPI.storeUserData(updatedDriver);
      setDriverData(updatedDriver);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error saving driver data:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  // Rest of your ProfileScreen component...
  return (
    <View style={styles.container}>
      <Text>Profile Screen</Text>
      {driverData && (
        <View>
          <Text>
            Name: {driverData.first_name} {driverData.last_name}
          </Text>
          <Text>Email: {driverData.email}</Text>
          {/* Add your profile UI here */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});
