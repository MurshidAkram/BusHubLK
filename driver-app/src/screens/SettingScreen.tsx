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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SettingsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("driverToken");
            await AsyncStorage.removeItem("driverData");
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
      "This feature will redirect you to change password screen.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          onPress: () => {
            // Navigate to change password screen
            // navigation.navigate('ChangePassword');
            Alert.alert("Info", "Change password feature coming soon!");
          },
        },
      ]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached data. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
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

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
    showArrow = true,
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications-outline"
              title="Push Notifications"
              subtitle="Receive alerts and updates"
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
              subtitle="Allow location access for route tracking"
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
              icon="sync-outline"
              title="Auto Sync"
              subtitle="Automatically sync data when connected"
              rightComponent={
                <Switch
                  value={autoSync}
                  onValueChange={setAutoSync}
                  trackColor={{ false: "#f1f5f9", true: "#fecaca" }}
                  thumbColor={autoSync ? "#dc2626" : "#9ca3af"}
                />
              }
              showArrow={false}
            />

            <SettingItem
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Switch to dark theme"
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
              subtitle="Update your personal information"
              onPress={() => navigation.navigate("Profile")}
            />

            <SettingItem
              icon="lock-closed-outline"
              title="Change Password"
              subtitle="Update your login password"
              onPress={handleChangePassword}
            />

            <SettingItem
              icon="shield-checkmark-outline"
              title="Privacy Settings"
              subtitle="Manage your privacy preferences"
              onPress={() =>
                Alert.alert("Info", "Privacy settings coming soon!")
              }
            />
          </View>
        </View>

        {/* Data & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="cloud-download-outline"
              title="Sync Data"
              subtitle="Manually sync your data"
              onPress={() => Alert.alert("Info", "Data synced successfully!")}
            />

            <SettingItem
              icon="trash-outline"
              title="Clear Cache"
              subtitle="Free up storage space"
              onPress={handleClearCache}
            />

            <SettingItem
              icon="download-outline"
              title="Backup Data"
              subtitle="Create a backup of your data"
              onPress={() => Alert.alert("Info", "Backup feature coming soon!")}
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
              subtitle="Get help and find answers"
              onPress={() =>
                Alert.alert(
                  "Help",
                  "For support, please contact your depot manager."
                )
              }
            />

            <SettingItem
              icon="chatbubble-outline"
              title="Contact Support"
              subtitle="Get in touch with our team"
              onPress={() => Alert.alert("Contact", "Support: +94 11 123 4567")}
            />

            <SettingItem
              icon="information-circle-outline"
              title="About"
              subtitle="App version and information"
              onPress={() =>
                Alert.alert("About", "BusHubLK Driver App\nVersion 1.0.0")
              }
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
    marginLeft: 8,
  },
});

export default SettingsScreen;
