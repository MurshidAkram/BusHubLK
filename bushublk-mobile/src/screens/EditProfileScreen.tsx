import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  StatusBar,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
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
  textMuted: "#6B7280",
  border: "#E5E7EB",
  soft: "#EFF4FF",
  info: "#E8F2FF",
  shadow: "rgba(0, 0, 0, 0.1)",
  green: "#10B981",
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
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
              {/* Avatar Display Card */}
              <View style={styles.avatarCardWrapper}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarCardGradient}
                >
                  <View style={styles.avatarCard}>
                    <LinearGradient
                      colors={['#0056b3', '#1976d2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatarCircle}
                    >
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    </LinearGradient>
                    <View style={styles.avatarInfo}>
                      <Text style={styles.avatarName}>{displayName}</Text>
                      <Text style={styles.avatarEmail}>{displayEmail}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Personal Information Card */}
              <View style={styles.sectionCardWrapper}>
                <View style={styles.sectionCard}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="person" size={22} color={AppColors.primary} />
                    <Text style={styles.sectionTitle}>Personal information</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>First name *</Text>
                    <View style={styles.inputWrapper}>
                      <LinearGradient
                        colors={['#E7F1FF', '#F0F8FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.inputIconWrapper}
                      >
                        <Ionicons name="person-outline" size={20} color={AppColors.primary} />
                      </LinearGradient>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your first name"
                        placeholderTextColor={AppColors.textMuted}
                        value={form.first_name}
                        onChangeText={(text) => handleChange("first_name", text)}
                        autoCapitalize="words"
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Last name *</Text>
                    <View style={styles.inputWrapper}>
                      <LinearGradient
                        colors={['#E7F1FF', '#F0F8FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.inputIconWrapper}
                      >
                        <Ionicons name="person-circle-outline" size={20} color={AppColors.primary} />
                      </LinearGradient>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your last name"
                        placeholderTextColor={AppColors.textMuted}
                        value={form.last_name}
                        onChangeText={(text) => handleChange("last_name", text)}
                        autoCapitalize="words"
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone number</Text>
                    <View style={styles.inputWrapper}>
                      <LinearGradient
                        colors={['#E7F1FF', '#F0F8FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.inputIconWrapper}
                      >
                        <Ionicons name="call-outline" size={20} color={AppColors.primary} />
                      </LinearGradient>
                      <TextInput
                        style={styles.input}
                        placeholder="07X XXX XXXX"
                        placeholderTextColor={AppColors.textMuted}
                        value={form.phone}
                        onChangeText={(text) => handleChange("phone", text)}
                        keyboardType="phone-pad"
                        returnKeyType="done"
                      />
                    </View>
                    <Text style={styles.inputHelper}>{phoneHelper}</Text>
                  </View>
                </View>
              </View>

              {/* Read-Only Information Card */}
              <View style={styles.infoCardWrapper}>
                <LinearGradient
                  colors={['#E7F1FF', '#F0F8FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.infoCardGradient}
                >
                  <View style={styles.infoCard}>
                    <View style={styles.infoIconWrapper}>
                      <Ionicons name="information-circle" size={24} color={AppColors.primary} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoTitle}>Email address</Text>
                      <Text style={styles.infoText}>{displayEmail}</Text>
                      <Text style={styles.infoHelper}>{emailHelper}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </ScrollView>
          )}

          {!isLoading ? (
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={[styles.saveButtonWrapper, (isSaving) && styles.disabledButton]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isSaving ? ['#6B7280', '#9CA3AF'] : ['#0056b3', '#1976d2', '#42a5f5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButton}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" style={styles.saveIcon} />
                      <Text style={styles.saveButtonText}>Save changes</Text>
                    </>
                  )}
                </LinearGradient>
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
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // Enhanced Header Styles
  headerGradient: {
    paddingBottom: 20,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 40,
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
    paddingBottom: 90,
  },
  
  // Avatar Card
  avatarCardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: AppColors.shadow,
        shadowOpacity: 0.7,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  avatarCardGradient: {
    borderRadius: 16,
  },
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '700',
    color: 'white',
  },
  avatarInfo: {
    flex: 1,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 4,
  },
  avatarEmail: {
    fontSize: 13,
    color: AppColors.textMuted,
    fontWeight: '500',
  },
  
  // Section Card
  sectionCardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: AppColors.shadow,
        shadowOpacity: 0.7,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  sectionCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.text,
    marginLeft: 10,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    paddingRight: 14,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: AppColors.shadow,
        shadowOpacity: 0.3,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
      },
    }),
  },
  inputIconWrapper: {
    width: 42,
    height: 50,
    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: AppColors.text,
    fontWeight: '500',
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
  },
  inputHelper: {
    marginTop: 6,
    fontSize: 12,
    color: AppColors.textMuted,
    fontWeight: '500',
    lineHeight: 16,
  },
  
  // Info Card (Read-only)
  infoCardWrapper: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  infoCardGradient: {
    borderRadius: 14,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 4,
  },
  infoHelper: {
    fontSize: 11,
    color: AppColors.textMuted,
    fontWeight: '500',
    lineHeight: 15,
  },
  
  // Action Bar
  actionBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 22 : 16,
    backgroundColor: 'transparent',
  },
  saveButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 5,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveIcon: {
    marginRight: 10,
  },
  saveButtonText: {
    color: AppColors.card,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
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
    fontWeight: '600',
  },
});
