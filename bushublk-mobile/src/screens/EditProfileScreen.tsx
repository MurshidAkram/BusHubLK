import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { authAPI, storageAPI } from "../services/api";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

type AppStackParamList = {
  EditProfile: {
    profile?: any;
  } | undefined;
};

type EditProfileRouteParams = RouteProp<AppStackParamList, "EditProfile">;
type EditProfileNavigation = StackNavigationProp<AppStackParamList>;

type ProfileFormState = {
  first_name: string;
  last_name: string;
  phone: string;
};

type ProfileMetaState = {
  email: string;
  role: string;
};

const AppColors = {
  background: "#F8FAFF",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryDark: "#003d82",
  primaryLight: "#0076e3",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  text: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  borderLight: "rgba(222, 226, 230, 0.4)",
  soft: "#EFF4FF",
  info: "#E8F2FF",
  indigo: "#6366F1",
  success: "#10B981",
};

const createInitialState = (profile?: any): ProfileFormState => ({
  first_name: profile?.first_name ?? "",
  last_name: profile?.last_name ?? "",
  phone: profile?.phone ?? "",
});

const createMetaState = (profile?: any): ProfileMetaState => ({
  email: profile?.email ?? "",
  role: profile?.role ?? "",
});

export default function EditProfileScreen() {
  const navigation = useNavigation<EditProfileNavigation>();
  const route = useRoute<EditProfileRouteParams>();
  const initialProfile = useMemo(() => route.params?.profile, [route.params]);

  const [form, setForm] = useState<ProfileFormState>(() => createInitialState(initialProfile));
  const [meta, setMeta] = useState<ProfileMetaState>(() => createMetaState(initialProfile));
  const [isLoading, setIsLoading] = useState<boolean>(!initialProfile);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = useCallback(<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const populateFromProfile = useCallback((profile: any | null) => {
    setForm(createInitialState(profile));
    setMeta(createMetaState(profile));
  }, []);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authAPI.getPassengerProfile();
      const fetchedProfile = response?.user ?? response?.data?.user ?? null;
      if (fetchedProfile) {
        populateFromProfile(fetchedProfile);
      }
    } catch (error) {
      console.error("Error loading profile for edit:", error);
      Alert.alert("Unable to Load", "We couldn't fetch your profile details right now. Please pull to refresh or try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [populateFromProfile]);

  useEffect(() => {
    if (!initialProfile) {
      fetchProfile();
    }
  }, [initialProfile, fetchProfile]);

  useFocusEffect(
    useCallback(() => {
      if (initialProfile) {
        populateFromProfile(initialProfile);
      }
    }, [initialProfile, populateFromProfile])
  );

  const handleSave = useCallback(async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      Alert.alert("Missing Details", "Please enter both your first and last name.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || null,
      };

      await authAPI.updatePassengerProfile(payload);

      const refreshed = await authAPI.getPassengerProfile();
      const updatedProfile = refreshed?.user ?? refreshed?.data?.user ?? null;

      if (updatedProfile) {
        await storageAPI.storeUserData(updatedProfile);
        setMeta(createMetaState(updatedProfile));
      }

      Alert.alert("Profile Updated", "Your changes have been saved successfully.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      const message = error?.response?.data?.error || error?.message || "We couldn't update your profile. Please try again.";
      Alert.alert("Update Failed", message);
    } finally {
      setIsSaving(false);
    }
  }, [form.first_name, form.last_name, form.phone, navigation]);

  const displayName = useMemo(() => {
    const name = `${form.first_name ?? ""} ${form.last_name ?? ""}`.trim();
    if (name.length > 0) {
      return name;
    }
    if (meta.email) {
      return meta.email.split("@")[0];
    }
    return "Passenger";
  }, [form.first_name, form.last_name, meta.email]);

  const initials = useMemo(() => {
    const source = displayName.trim();
    if (!source) {
      return "P";
    }
    const segments = source.split(/\s+/).slice(0, 2);
    return segments
      .map((segment) => segment.charAt(0).toUpperCase())
      .join("")
      .padEnd(2, "P");
  }, [displayName]);

  const displayEmail = meta.email || "Add your contact email to keep alerts flowing.";
  const roleLabel = useMemo(() => {
    const normalised = meta.role ? meta.role.replace(/_/g, " ") : "Passenger";
    return normalised.replace(/\b\w/g, (char) => char.toUpperCase());
  }, [meta.role]);
  const headerTitle = isLoading ? "Loading" : "Edit Profile";
  const phoneDisplay = form.phone.trim() || "Add your phone number";
  const emailHelper = meta.email ? "Receives ride receipts and announcements" : "Reach support to connect your email";
  const phoneHelper = form.phone.trim()
    ? "Primary contact for urgent updates"
    : "Add a number so we can reach you if services change";

  return (
    <LinearGradient
      colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Enhanced Header */}
        <LinearGradient
          colors={['#0056b3', '#1976d2', '#42a5f5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back-outline" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <View style={styles.headerRightPlaceholder} />
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={AppColors.primary} />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Personal Information Card */}
              <View style={styles.card}>
                <View style={styles.cardHeaderContainer}>
                  <View style={styles.cardIconContainer}>
                    <Ionicons name="person" size={24} color={AppColors.primary} />
                  </View>
                  <View>
                    <Text style={styles.cardHeader}>Personal Information</Text>
                    <Text style={styles.cardSubheader}>Update your profile details</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={styles.enhancedInputContainer}>
                    <Ionicons name="person-outline" size={20} color={AppColors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputText}
                      placeholder="Enter your first name"
                      value={form.first_name}
                      onChangeText={(text) => handleChange("first_name", text)}
                      autoCapitalize="words"
                      returnKeyType="next"
                      placeholderTextColor={AppColors.textSecondary}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Last Name</Text>
                  <View style={styles.enhancedInputContainer}>
                    <Ionicons name="person-circle-outline" size={20} color={AppColors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputText}
                      placeholder="Enter your last name"
                      value={form.last_name}
                      onChangeText={(text) => handleChange("last_name", text)}
                      autoCapitalize="words"
                      returnKeyType="next"
                      placeholderTextColor={AppColors.textSecondary}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.enhancedInputContainer}>
                    <Ionicons name="call-outline" size={20} color={AppColors.indigo} style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputText}
                      placeholder="07X XXX XXXX"
                      value={form.phone}
                      onChangeText={(text) => handleChange("phone", text)}
                      keyboardType="phone-pad"
                      returnKeyType="done"
                      placeholderTextColor={AppColors.textSecondary}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    {phoneHelper}
                  </Text>
                </View>
              </View>

              {/* Account Information Card */}
              <View style={styles.card}>
                <View style={styles.cardHeaderContainer}>
                  <View style={styles.cardIconContainer}>
                    <Ionicons name="shield-checkmark" size={24} color={AppColors.success} />
                  </View>
                  <View>
                    <Text style={styles.cardHeader}>Account Information</Text>
                    <Text style={styles.cardSubheader}>Your account details</Text>
                  </View>
                </View>

                <View style={styles.readOnlyField}>
                  <View style={styles.readOnlyIconWrapper}>
                    <Ionicons name="mail-outline" size={20} color={AppColors.success} />
                  </View>
                  <View style={styles.readOnlyContent}>
                    <Text style={styles.readOnlyLabel}>Email Address</Text>
                    <Text style={styles.readOnlyValue}>{displayEmail}</Text>
                    <Text style={styles.readOnlyHelper}>{emailHelper}</Text>
                  </View>
                </View>

                <View style={styles.readOnlyField}>
                  <View style={styles.readOnlyIconWrapper}>
                    <Ionicons name="shield-outline" size={20} color={AppColors.indigo} />
                  </View>
                  <View style={styles.readOnlyContent}>
                    <Text style={styles.readOnlyLabel}>Account Role</Text>
                    <Text style={styles.readOnlyValue}>{roleLabel}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          {!isLoading ? (
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.disabledButton]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={22} color="#FFFFFF" style={styles.saveIcon} />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  headerGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 40,
    height: 40,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 86, 179, 0.08)',
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: 'rgba(0, 86, 179, 0.15)',
        shadowOpacity: 1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
  cardHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 86, 179, 0.08)',
  },
  cardIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 86, 179, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.text,
    letterSpacing: 0.3,
  },
  cardSubheader: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  enhancedInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    height: 58,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 86, 179, 0.15)',
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: 'rgba(0, 86, 179, 0.08)',
        shadowOpacity: 1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  inputIcon: {
    marginRight: 14,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 16,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 86, 179, 0.04)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 86, 179, 0.08)',
  },
  readOnlyIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  readOnlyContent: {
    flex: 1,
  },
  readOnlyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  readOnlyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 4,
  },
  readOnlyHelper: {
    fontSize: 12,
    color: AppColors.textSecondary,
    lineHeight: 16,
  },
  actionBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    backgroundColor: AppColors.card,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0056b3',
    borderRadius: 16,
    paddingVertical: 20,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#0056b3',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
    }),
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveIcon: {
    marginRight: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: AppColors.textMuted,
  },
});
