import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from "@react-navigation/native";
import { authAPI, storageAPI, complaintAPI } from "../services/api";

const AppColors = {
  background: "#F8FAFF",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryDark: "#003d82",
  primaryLight: "#0076e3",
  primaryMuted: "rgba(0, 86, 179, 0.08)",
  text: "#1F2937",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  danger: "#DC3545",
  green: "#10B981",
  shadow: "rgba(0, 0, 0, 0.1)",
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export default function ProfileScreen({ navigation }: any) {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Starting API call to getPassengerProfile...");
      const response = await authAPI.getPassengerProfile();
      console.log("✅ Full API Response:", JSON.stringify(response, null, 2));
      
      const rawProfile = response?.user ?? response?.data?.user ?? null;
      console.log("📋 Extracted Profile:", JSON.stringify(rawProfile, null, 2));

      if (rawProfile) {
        let phoneValue =
          rawProfile?.phone ??
          rawProfile?.phone_number ??
          rawProfile?.phoneNumber ??
          rawProfile?.contact_phone ??
          rawProfile?.mobile ??
          null;

        if (!phoneValue) {
          try {
            console.log("📞 Phone missing in profile, attempting fallback lookup...");
            const contactInfo = await complaintAPI.getMyContactInfo();
            phoneValue =
              contactInfo?.data?.phone ??
              contactInfo?.phone ??
              contactInfo?.data?.contact_phone ??
              null;
            console.log("📞 Fallback lookup result:", phoneValue);
          } catch (contactError) {
            console.warn("⚠️ Fallback contact lookup failed:", contactError);
          }
        }

        const normalisedProfile = {
          ...rawProfile,
          phone: phoneValue,
        };

        console.log("📞 Normalised phone value:", normalisedProfile.phone);
        console.log("💾 Storing profile data...");
        setUserData(normalisedProfile);
        await storageAPI.storeUserData(normalisedProfile);
        console.log("✅ Profile data stored successfully");
        return;
      }

      console.log("⚠️ No profile from API, trying storage fallback...");
      const fallback = await storageAPI.getUserData();
      console.log("📁 Fallback data:", JSON.stringify(fallback, null, 2));
      let fallbackPhone =
        fallback?.phone ??
        fallback?.phone_number ??
        fallback?.phoneNumber ??
        fallback?.contact_phone ??
        fallback?.mobile ??
        null;

      if (!fallbackPhone) {
        try {
          console.log("📞 Fallback data missing phone, attempting contact lookup...");
          const contactInfo = await complaintAPI.getMyContactInfo();
          fallbackPhone =
            contactInfo?.data?.phone ??
            contactInfo?.phone ??
            contactInfo?.data?.contact_phone ??
            null;
          console.log("📞 Contact lookup result:", fallbackPhone);
        } catch (contactError) {
          console.warn("⚠️ Fallback contact lookup failed:", contactError);
        }
      }

      const normalisedFallback = fallback
        ? {
            ...fallback,
            phone: fallbackPhone,
          }
        : fallbackPhone
          ? { phone: fallbackPhone }
          : null;
      console.log("📞 Fallback phone:", normalisedFallback?.phone);
      setUserData(normalisedFallback);
    } catch (error) {
      console.error("❌ Error loading user data:", error);
      console.log("🔄 Trying storage fallback after error...");
      const fallback = await storageAPI.getUserData();
      console.log("📁 Error fallback data:", JSON.stringify(fallback, null, 2));
      let fallbackPhone =
        fallback?.phone ??
        fallback?.phone_number ??
        fallback?.phoneNumber ??
        fallback?.contact_phone ??
        fallback?.mobile ??
        null;

      if (!fallbackPhone) {
        try {
          console.log("📞 Error fallback missing phone, attempting contact lookup...");
          const contactInfo = await complaintAPI.getMyContactInfo();
          fallbackPhone =
            contactInfo?.data?.phone ??
            contactInfo?.phone ??
            contactInfo?.data?.contact_phone ??
            null;
          console.log("📞 Contact lookup result:", fallbackPhone);
        } catch (contactError) {
          console.warn("⚠️ Error fallback contact lookup failed:", contactError);
        }
      }

      const normalisedFallback = fallback
        ? {
            ...fallback,
            phone: fallbackPhone,
          }
        : fallbackPhone
          ? { phone: fallbackPhone }
          : null;
      console.log("📞 Error fallback phone:", normalisedFallback?.phone);
      setUserData(normalisedFallback);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  const getRootNavigation = useCallback(() => navigation?.getParent?.() ?? navigation, [navigation]);

  const handleEditProfile = useCallback(() => {
    getRootNavigation()?.navigate?.("EditProfile", { profile: userData });
  }, [getRootNavigation, userData]);

  const handleViewNotifications = useCallback(() => {
    getRootNavigation()?.navigate?.("Notifications");
  }, [getRootNavigation]);

  const handleOpenSupport = useCallback(() => {
    Alert.alert("Help & Support", "How would you like to reach us?", [
      {
        text: "Call Hotline",
        onPress: () => Linking.openURL("tel:+94112345678").catch(() => {}),
      },
      {
        text: "Email",
        onPress: () => Linking.openURL("mailto:support@bushublk.lk").catch(() => {}),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, []);

  const displayName = useMemo(() => {
    if (!userData) {
      return "Passenger";
    }
    const first = userData?.first_name ?? "";
    const last = userData?.last_name ?? "";
    const full = `${first} ${last}`.trim();
    if (full.length) {
      return full;
    }
    if (userData?.email) {
      return userData.email.split("@")[0];
    }
    return "Passenger";
  }, [userData]);

  const initials = useMemo(() => {
    return displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part.charAt(0).toUpperCase())
      .join("")
      .padEnd(2, "P");
  }, [displayName]);

  const displayRole = useMemo(() => {
    if (!userData?.role) {
      return "Passenger";
    }
    return String(userData.role)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, [userData?.role]);

  const profileOptions = useMemo(
    () => [
      {
        key: "edit",
        title: "Edit profile",
        subtitle: "Update your personal details",
        icon: "create-outline" as IconName,
        onPress: handleEditProfile,
      },
      {
        key: "notifications",
        title: "Notifications",
        subtitle: "Review alerts and updates",
        icon: "notifications-outline" as IconName,
        onPress: handleViewNotifications,
      },
    ], [handleEditProfile, handleViewNotifications]
  );

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={styles.loadingText}>Loading your profile...</Text>
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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0056b3" />
        
        {/* Enhanced Header with Gradient */}
        <LinearGradient
          colors={['#0056b3', '#1976d2', '#42a5f5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerLabel}>Your profile</Text>
              <Text style={styles.headerTitle}>{displayName}</Text>
              <View style={styles.roleChip}>
                <Ionicons name="shield-checkmark" size={14} color="white" />
                <Text style={styles.roleChipText}>{displayRole}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Summary Card */}
          <View style={styles.summaryCardWrapper}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCardGradient}
            >
              <View style={styles.summaryCard}>
                <LinearGradient
                  colors={['#0056b3', '#1976d2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarCircle}
                >
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </LinearGradient>
                <View style={styles.summaryDetails}>
                  <Text style={styles.summaryName}>{displayName}</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={AppColors.green} />
                    <Text style={styles.verifiedText}>Verified account</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Contact Information Card */}
          <View style={styles.sectionCardWrapper}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="information-circle" size={22} color={AppColors.primary} />
                <Text style={styles.sectionTitle}>Contact information</Text>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="mail" size={20} color={AppColors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email address</Text>
                  <Text style={styles.infoValue}>{userData?.email || "Add your email"}</Text>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="call" size={20} color={AppColors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone number</Text>
                  <Text style={styles.infoValue}>{userData?.phone || "Add your phone number"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Account Actions Card */}
          <View style={styles.sectionCardWrapper}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="settings" size={22} color={AppColors.primary} />
                <Text style={styles.sectionTitle}>Account actions</Text>
              </View>
              
              {profileOptions.map((option, index) => (
                <React.Fragment key={option.key}>
                  {index > 0 && <View style={styles.optionDivider} />}
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={option.onPress}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#E7F1FF', '#F0F8FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.optionIconWrapper}
                    >
                      <Ionicons name={option.icon} size={22} color={AppColors.primary} />
                    </LinearGradient>
                    <View style={styles.optionBody}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={AppColors.textMuted} />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Support Banner */}
          <View style={styles.supportBannerWrapper}>
            <LinearGradient
              colors={['#0056b3', '#1976d2', '#42a5f5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.supportBannerGradient}
            >
              <TouchableOpacity 
                style={styles.supportBanner} 
                onPress={handleOpenSupport} 
                activeOpacity={0.8}
              >
                <View style={styles.supportIconWrapper}>
                  <Ionicons name="headset" size={26} color="white" />
                </View>
                <View style={styles.supportContent}>
                  <Text style={styles.supportTitle}>Need help?</Text>
                  <Text style={styles.supportText}>
                    Our support team is ready to assist you with any questions
                  </Text>
                  <View style={styles.supportActionRow}>
                    <Text style={styles.supportAction}>Contact support</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  </View>
                </View>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <Text style={styles.versionText}>BusHubLK v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // Enhanced Header Styles
  headerGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  headerLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  headerTitle: {
    color: AppColors.card,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  roleChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.textMuted,
    fontWeight: "600",
  },
  
  // Profile Summary Card
  summaryCardWrapper: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: AppColors.shadow,
        shadowOpacity: 1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  summaryCardGradient: {
    borderRadius: 20,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "700",
    color: AppColors.card,
  },
  summaryDetails: {
    flex: 1,
  },
  summaryName: {
    fontSize: 22,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.green,
  },
  
  // Section Card Styles
  sectionCardWrapper: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: AppColors.shadow,
        shadowOpacity: 1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  sectionCard: {
    backgroundColor: AppColors.card,
    borderRadius: 20,
    padding: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.text,
    marginLeft: 10,
  },
  
  // Info Rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: AppColors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text,
  },
  infoDivider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginVertical: 4,
  },
  
  // Option Rows
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  optionDivider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginVertical: 4,
  },
  optionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  optionBody: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: AppColors.textMuted,
    fontWeight: '500',
  },
  
  // Support Banner
  supportBannerWrapper: {
    marginBottom: 24,
    borderRadius: 20,
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
  supportBannerGradient: {
    borderRadius: 20,
  },
  supportBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  supportIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: 'white',
    marginBottom: 6,
  },
  supportText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    marginBottom: 10,
  },
  supportActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportAction: {
    fontSize: 14,
    fontWeight: "700",
    color: 'white',
    marginRight: 6,
  },
  
  versionText: {
    textAlign: "center",
    fontSize: 13,
    color: AppColors.textMuted,
    marginTop: 12,
    fontWeight: '500',
  },
});
