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
  Platform,
  StatusBar,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDriver } from "../context/DriverContext";

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

// Enhanced Header component with gradient
const Header = () => (
  <LinearGradient
    colors={[AppColors.primary, "#0076e3"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.header}
  >
    <View style={styles.headerContent}>
      <Ionicons
        name="settings-outline"
        size={24}
        color="#FFFFFF"
        style={{ marginRight: 8 }}
      />
      <Text style={styles.headerTitle}>Settings</Text>
    </View>
  </LinearGradient>
);

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  showArrow?: boolean;
}

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen = ({ navigation }: SettingsScreenProps) => {
  const { driverData } = useDriver();
  const [autoSync, setAutoSync] = useState(true);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // Clear all authentication data
            await AsyncStorage.removeItem("driverToken");
            await AsyncStorage.removeItem("driverData");
            
            // The RootNavigator checks auth status every second,
            // so it will automatically redirect to login screen
            Alert.alert("Success", "You have been logged out successfully.");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const handleChangePassword = () => {
    navigation.navigate("ForgotPassword");
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
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("driverData");
              Alert.alert("Success", "Cache cleared successfully!");
            } catch (error) {
              Alert.alert("Error", "Failed to clear cache");
            }
          },
        },
      ]
    );
  };

  const handleEmergencyCall = (number: string) => {
    Alert.alert(
      "Emergency Call", 
      `Call ${number}?`, 
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Call", 
          onPress: () => Linking.openURL(`tel:${number}`) 
        }
      ]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      "Help & Support",
      "• Check your daily assignments in the Schedule tab\n• Track your bus location in real-time\n• Report any bus issues immediately\n• Contact your depot manager for operational queries\n• Use emergency contacts for urgent situations\n\nFor technical support, contact your depot manager.",
      [{ text: "OK" }]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent, 
    showArrow = true 
  }: SettingItemProps) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress} 
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: AppColors.primaryMuted }]}>
          <Ionicons name={icon as any} size={20} color={AppColors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Ionicons name="chevron-forward-outline" size={20} color={AppColors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />
      <Header />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="sync-outline"
              title="Auto Sync Data"
              subtitle="Automatically sync your data when connected"
              rightComponent={
                <Switch
                  value={autoSync}
                  onValueChange={setAutoSync}
                  trackColor={{ false: AppColors.border, true: AppColors.primaryMuted }}
                  thumbColor={autoSync ? AppColors.primary : AppColors.textSecondary}
                />
              }
              showArrow={false}
            />
            <SettingItem
              icon="trash-outline"
              title="Clear Cache"
              subtitle="Clear cached data and files"
              onPress={handleClearCache}
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
              subtitle="Update your password for security"
              onPress={handleChangePassword}
            />
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="call-outline"
              title="Depot Manager"
              subtitle="Contact your depot manager"
              onPress={() => handleEmergencyCall("0112-345-678")}
            />
            <SettingItem
              icon="medical-outline"
              title="Emergency Services"
              subtitle="Police, Fire, Ambulance"
              onPress={() => handleEmergencyCall("119")}
            />
            <SettingItem
              icon="bus-outline"
              title="Transport Authority"
              subtitle="SLTB Head Office"
              onPress={() => handleEmergencyCall("0112-421-251")}
            />
          </View>
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="help-circle-outline"
              title="Driver Guidelines"
              subtitle="Important guidelines for drivers"
              onPress={handleHelp}
            />
            <SettingItem
              icon="information-circle-outline"
              title="About BusHubLK"
              subtitle="Version 1.0.0"
              onPress={() => Alert.alert(
                "About BusHubLK", 
                "BusHubLK Driver App\nVersion 1.0.0\n\nDeveloped for Sri Lanka Transport Board\n\nFor technical support, contact your depot manager."
              )}
            />
            <SettingItem
              icon="flask-outline"
              title="Test Notifications"
              subtitle="Test the notification system"
              onPress={() => navigation.navigate("NotificationTest")}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={AppColors.red} />
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
    backgroundColor: AppColors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === "ios" ? 20 : 22,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 21 : 20,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    letterSpacing: 0.6,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scrollView: {
    backgroundColor: AppColors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: 12,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  sectionContent: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  driverDetail: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    color: AppColors.text,
    marginBottom: 2,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  settingSubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
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
    color: AppColors.red,
    marginLeft: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
});

export default SettingsScreen;