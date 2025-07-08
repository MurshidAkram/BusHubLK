import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  // 1. Add Platform and StatusBar
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 2. Define the Header component
const Header = () => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Settings</Text>
  </View>
);

const SettingsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("driverToken");
            await AsyncStorage.removeItem("driverData");
            // Replace with your actual login screen name if different
            navigation.replace("DriverLogin");
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  const handleChangePassword = () => {
    Alert.alert(
      "Change Password",
      "This feature is not yet available.",
      [{ text: "OK" }]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            Alert.alert("Success", "Cache cleared successfully!");
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent, showArrow = true }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={20} color="#dc2626" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    // 3. Add the Header component here
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#005A9C" />
      <Header />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications-outline"
              title="Push Notifications"
              rightComponent={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: "#f1f5f9", true: "#fecaca" }}
                  thumbColor={notifications ? "#dc2626" : "#9ca3af"}
                />
              }
              showArrow={false}
            />
            <SettingItem
              icon="location-outline"
              title="Location Tracking"
              rightComponent={
                <Switch
                  value={locationTracking}
                  onValueChange={setLocationTracking}
                  trackColor={{ false: "#f1f5f9", true: "#fecaca" }}
                  thumbColor={locationTracking ? "#dc2626" : "#9ca3af"}
                />
              }
              showArrow={false}
            />
            <SettingItem
              icon="moon-outline"
              title="Dark Mode"
              rightComponent={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: "#f1f5f9", true: "#fecaca" }}
                  thumbColor={darkMode ? "#dc2626" : "#9ca3af"}
                />
              }
              showArrow={false}
            />
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="person-outline"
              title="Edit Profile"
              onPress={() => navigation.navigate("Profile")}
            />
            <SettingItem
              icon="lock-closed-outline"
              title="Change Password"
              onPress={handleChangePassword}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Privacy Settings"
              onPress={() => Alert.alert("Info", "Coming soon!")}
            />
          </View>
        </View>

        {/* Data & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="trash-outline"
              title="Clear Cache"
              onPress={handleClearCache}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="help-circle-outline"
              title="Help & FAQ"
              onPress={() => Alert.alert("Help", "Contact your depot manager for help.")}
            />
            <SettingItem
              icon="information-circle-outline"
              title="About"
              onPress={() => Alert.alert("About", "BusHubLK Driver App\nVersion 1.0.0")}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// 4. Updated Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#005A9C", // Set status bar area color
  },
  header: {
    backgroundColor: "#005A9C",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 15,
    paddingBottom: 15,
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollView: {
    backgroundColor: "#f8fafc", // Main screen background
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24, // Added more space between sections
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: 'hidden', // Ensures items inside respect the border radius
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  settingSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
    marginLeft: 8,
  },
});

export default SettingsScreen;