import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  StatusBar,
  Linking,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDriver } from "../context/DriverContext";
import { driverAPI, storageAPI } from "../services/api";

// App Color Palette (matching TrackingScreen)
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
  success: "#198754",
  danger: "#dc3545",
};

// Enhanced Header component with gradient (matching TrackingScreen style)
const Header = ({ navigation }: { navigation: any }) => (
  <LinearGradient
    colors={['#0056b3', '#1976d2', '#42a5f5']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.headerGradient}
  >
    <View style={styles.headerContent}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Settings</Text>
      <View style={styles.headerSpacer} />
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
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      "🚪 Logout",
      "Are you sure you want to logout from BusHubLK Driver App?\n\nYou will need to login again to access the app.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Call API logout to blacklist token
              const result = await driverAPI.logout();

              // Clear local storage to force logout
              await storageAPI.clearStorage();

              if (result.success) {
                Alert.alert(
                  "✅ Success",
                  "You have been logged out successfully.\n\nThank you for using BusHubLK!"
                );
              } else {
                Alert.alert(
                  "⚠️ Warning",
                  "Logged out locally, but could not reach server.\n\nPlease check your internet connection."
                );
              }

              console.log("✅ User logged out successfully");
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert(
                "❌ Error",
                "Failed to logout. Please try again.\n\nIf the problem persists, contact your depot manager."
              );
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const handleClearCache = async () => {
    Alert.alert(
      "🗑️ Clear Cache",
      "This will clear all cached data including:\n\n• Temporary files\n• Cached images\n• Offline data\n\nAre you sure you want to continue?",
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              // Use the proper storageAPI.clearCache method
              await storageAPI.clearCache();
              Alert.alert(
                "✅ Success", 
                "Cache cleared successfully!\n\nThe app may run faster now."
              );
            } catch (error) {
              Alert.alert(
                "❌ Error", 
                "Failed to clear cache.\n\nPlease try again later."
              );
            }
          },
        },
      ]
    );
  };

  const handleEmergencyCall = (number: string) => {
    Alert.alert(
      "📞 Emergency Call", 
      `Are you sure you want to call ${number}?\n\nThis will open your phone's dialer.`, 
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        { 
          text: "Call Now", 
          style: "default",
          onPress: () => Linking.openURL(`tel:${number}`) 
        }
      ]
    );
  };

  const handleHelp = () => {
    const depotManagerInfo = driverData?.depot_manager_name 
      ? `${driverData.depot_manager_name} (${driverData.depot_manager_phone})`
      : "your depot manager";
    
    Alert.alert(
      "📖 Driver Guidelines",
      `Welcome to BusHubLK Driver App!\n\n` +
      `✅ Daily Assignments\n` +
      `Check your daily assignments in the Schedule tab\n\n` +
      `📍 Real-Time Tracking\n` +
      `Track your bus location in real-time during trips\n\n` +
      `🚨 Report Issues\n` +
      `Report any bus issues immediately through the app\n\n` +
      `📞 Operational Queries\n` +
      `Contact ${depotManagerInfo} for operational queries\n\n` +
      `🆘 Emergency Situations\n` +
      `Use emergency contacts for urgent situations\n\n` +
      `💡 Technical Support\n` +
      `For technical support, contact ${depotManagerInfo}`,
      [
        { 
          text: "Got it!", 
          style: "default"
        }
      ]
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
          <Ionicons name={icon as any} size={22} color={AppColors.primary} />
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

  const EmergencyContactItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress 
  }: SettingItemProps) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: 'rgba(220, 53, 69, 0.1)' }]}>
          <Ionicons name={icon as any} size={22} color={AppColors.danger} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        <Ionicons name="call" size={20} color={AppColors.danger} />
      </View>
    </TouchableOpacity>
  );

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
        <Header navigation={navigation} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        

        {/* App Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cog-outline" size={20} color={AppColors.primary} />
            <Text style={styles.sectionTitle}>App Settings</Text>
          </View>
          <View style={styles.card}>
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
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-outline" size={20} color={AppColors.primary} />
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <View style={styles.card}>
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
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="phone-alert" size={20} color={AppColors.danger} />
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          </View>
          <View style={styles.card}>
            <EmergencyContactItem
              icon="call-outline"
              title={driverData?.depot_manager_name ? `${driverData.depot_manager_name} (Depot Manager)` : "Depot Manager"}
              subtitle={driverData?.depot_name ? `${driverData.depot_name} Depot` : "Contact your depot manager"}
              onPress={() => handleEmergencyCall(driverData?.depot_manager_phone || "0112-345-678")}
            />
            <EmergencyContactItem
              icon="medical-outline"
              title="Emergency Services"
              subtitle="Police, Fire, Ambulance"
              onPress={() => handleEmergencyCall("119")}
            />
            <EmergencyContactItem
              icon="bus-outline"
              title="Transport Authority"
              subtitle="SLTB Head Office"
              onPress={() => handleEmergencyCall("0112-421-251")}
            />
          </View>
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="help-circle-outline" size={20} color={AppColors.primary} />
            <Text style={styles.sectionTitle}>Help & Support</Text>
          </View>
          <View style={styles.card}>
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
                "ℹ️ About BusHubLK", 
                `🚍 BusHubLK Driver App\n` +
                `📱 Version 1.0.0\n\n` +
                `Developed for Sri Lanka Transport Board (SLTB)\n\n` +
                `This application helps drivers manage their daily assignments, track routes, and communicate effectively with depot managers.\n\n` +
                `🔧 Technical Support\n` +
                `For technical support and queries, please contact your depot manager.\n\n` +
                `© 2025 BusHubLK. All rights reserved.`,
                [
                  { 
                    text: "Close", 
                    style: "cancel"
                  }
                ]
              )}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutButtonContainer} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.logoutButton}>
              <View style={styles.logoutContent}>
                <View style={styles.logoutIconContainer}>
                  <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.logoutText}>Logout from Account</Text>
              </View>
            </View>
          </TouchableOpacity>
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    letterSpacing: 0.6,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.text,
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 0,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutButtonContainer: {
    marginHorizontal: 4,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  logoutButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: AppColors.primary,
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default SettingsScreen;