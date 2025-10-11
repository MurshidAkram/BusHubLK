import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0056b3" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Your profile</Text>
          <Text style={styles.headerTitle}>{displayName}</Text>
          <Text style={styles.headerSubtitle}>{displayRole}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.summaryDetails}>
            <Text style={styles.summaryName}>{displayName}</Text>
            <View style={styles.metaChip}>
              <Ionicons name="shield-checkmark" size={16} color={AppColors.primary} />
              <Text style={styles.metaChipText}>Verified account details</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Ionicons name="mail-outline" size={18} color={AppColors.textMuted} />
                <Text style={styles.infoText}>{userData?.email || "Add your email"}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={18} color={AppColors.textMuted} />
                <Text style={styles.infoText}>{(() => {
                  console.log("🎯 Rendering phone number:", userData?.phone);
                  console.log("🎯 User data keys:", userData ? Object.keys(userData) : "No userData");
                  return userData?.phone || "Add your phone number";
                })()}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account actions</Text>
          {profileOptions.map((option, index) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.optionRow, index === profileOptions.length - 1 && styles.optionRowLast]}
              onPress={option.onPress}
              activeOpacity={0.85}
            >
              <View style={styles.optionIconWrapper}>
                <Ionicons name={option.icon} size={22} color={AppColors.primary} />
              </View>
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={AppColors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.helpBanner} onPress={handleOpenSupport} activeOpacity={0.85}>
            <View style={styles.helpIconWrapper}>
              <Ionicons name="headset-outline" size={22} color={AppColors.card} />
            </View>
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Need a hand?</Text>
              <Text style={styles.helpText}>Our team is ready to help with routes, payments, or technical issues.</Text>
              <Text style={styles.helpAction}>Contact support</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>BusHubLK v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  headerTitle: {
    marginTop: 6,
    color: AppColors.card,
    fontSize: 24,
    fontWeight: "700",
  },
  headerSubtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: AppColors.textMuted,
    fontWeight: "500",
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.card,
    borderRadius: 24,
    padding: 22,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: "700",
    color: AppColors.primary,
  },
  summaryDetails: {
    flex: 1,
  },
  summaryName: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.text,
  },
  metaChip: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: AppColors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaChipText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.primary,
  },
  infoGrid: {
    marginTop: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: AppColors.textMuted,
  },
  sectionCard: {
    backgroundColor: AppColors.card,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  optionRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  optionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: AppColors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionBody: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.text,
  },
  optionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: AppColors.textMuted,
  },
  helpBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primaryMuted,
    borderRadius: 18,
    padding: 18,
    paddingRight: 22,
  },
  helpIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  helpContent: {
    flex: 1,
    marginLeft: 16,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.primaryDark,
    marginBottom: 6,
  },
  helpText: {
    fontSize: 13,
    color: AppColors.textMuted,
    lineHeight: 18,
    marginBottom: 6,
  },
  helpAction: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.primary,
  },
  versionText: {
    textAlign: "center",
    fontSize: 13,
    color: AppColors.textMuted,
    marginBottom: 12,
  },
});
