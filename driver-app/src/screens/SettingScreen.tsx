import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { driverAPI, storageAPI } from "../services/api";

interface SettingsData {
  notifications: boolean;
  locationTracking: boolean;
  autoSync: boolean;
  darkMode: boolean;
  soundAlerts: boolean;
}

interface DriverInfo {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
}

export default function SettingScreen() {
  const navigation = useNavigation();
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [settings, setSettings] = useState<SettingsData>({
    notifications: true,
    locationTracking: true,
    autoSync: true,
    darkMode: false,
    soundAlerts: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadDriverInfo();
    loadSettings();
  }, []);

  const loadDriverInfo = async () => {
    try {
      const userData = await storageAPI.getUserData();
      if (userData) {
        setDriverInfo({
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          username: userData.username,
        });
      }
    } catch (error) {
      console.error("Error loading driver info:", error);
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // Load settings from storage (you can implement this in storageAPI)
      const savedSettings = await storageAPI.getSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof SettingsData, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      // Save to storage
      await storageAPI.saveSettings(newSettings);
      console.log(`✅ ${key} updated to ${value}`);
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      Alert.alert("Error", "Failed to update setting");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout Confirmation",
      "Are you sure you want to logout? You will need to login again to access the app.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log("🚪 Starting logout process...");

      // Call API logout
      const result = await driverAPI.logout();

      if (result.success) {
        console.log("✅ Logout successful");
        // Navigation will be handled automatically by RootNavigator
      } else {
        throw new Error(result.error || "Logout failed");
      }
    } catch (error) {
      console.error("❌ Logout error:", error);
      Alert.alert(
        "Logout Error",
        "Failed to logout properly. Please try again.",
        [
          {
            text: "Force Logout",
            style: "destructive",
            onPress: async () => {
              await storageAPI.clearStorage();
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached data except login information. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear cache but keep auth data
              await storageAPI.clearCache();
              Alert.alert("Success", "Cache cleared successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to clear cache");
            }
          },
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      "Reset Settings",
      "This will reset all settings to default values. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            const defaultSettings: SettingsData = {
              notifications: true,
              locationTracking: true,
              autoSync: true,
              darkMode: false,
              soundAlerts: true,
            };
            setSettings(defaultSettings);
            storageAPI.saveSettings(defaultSettings);
            Alert.alert("Success", "Settings reset to default");
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
    type = "switch",
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    type?: "switch" | "button";
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon as any} size={24} color="#005A9C" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {type === "switch" && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: "#767577", true: "#005A9C" }}
          thumbColor={value ? "#ffffff" : "#f4f3f4"}
        />
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#005A9C" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#005A9C" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#005A9C" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Driver Info Section */}
        {driverInfo && (
          <View style={styles.driverInfoSection}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={40} color="#005A9C" />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>
                {driverInfo.first_name} {driverInfo.last_name}
              </Text>
              <Text style={styles.driverEmail}>{driverInfo.email}</Text>
              <Text style={styles.driverUsername}>@{driverInfo.username}</Text>
            </View>
          </View>
        )}

        {/* App Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive important updates and alerts"
            value={settings.notifications}
            onValueChange={(value) => updateSetting("notifications", value)}
          />

          <SettingItem
            icon="location-outline"
            title="Location Tracking"
            subtitle="Allow app to track your location for routes"
            value={settings.locationTracking}
            onValueChange={(value) => updateSetting("locationTracking", value)}
          />

          <SettingItem
            icon="sync-outline"
            title="Auto Sync"
            subtitle="Automatically sync data when connected"
            value={settings.autoSync}
            onValueChange={(value) => updateSetting("autoSync", value)}
          />

          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Use dark theme for better night visibility"
            value={settings.darkMode}
            onValueChange={(value) => updateSetting("darkMode", value)}
          />

          <SettingItem
            icon="volume-high-outline"
            title="Sound Alerts"
            subtitle="Play sounds for notifications and alerts"
            value={settings.soundAlerts}
            onValueChange={(value) => updateSetting("soundAlerts", value)}
          />
        </View>

        {/* Data Management */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleClearCache}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="trash-outline" size={24} color="#ff6b35" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Clear Cache</Text>
                <Text style={styles.settingSubtitle}>
                  Free up storage space
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleResetSettings}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="refresh-outline" size={24} color="#007bff" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Reset Settings</Text>
                <Text style={styles.settingSubtitle}>
                  Restore default settings
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Build Number</Text>
            <Text style={styles.infoValue}>100</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>Dec 2024</Text>
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              isLoggingOut && styles.logoutButtonDisabled,
            ]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="log-out-outline" size={24} color="white" />
            )}
            <Text style={styles.logoutButtonText}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Text>
          </TouchableOpacity>
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
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
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
  driverInfoSection: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginBottom: 20,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#005A9C",
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  driverEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  driverUsername: {
    fontSize: 12,
    color: "#999",
  },
  settingsSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#333",
  },
  infoValue: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  logoutButtonDisabled: {
    backgroundColor: "#f8d7da",
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomSpacing: {
    height: 20,
  },
});

