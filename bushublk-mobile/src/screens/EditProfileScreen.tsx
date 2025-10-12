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
  text: "#1F2937",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  soft: "#EFF4FF",
  info: "#E8F2FF",
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
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[AppColors.primary, AppColors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            {!isLoading ? <Text style={styles.headerSubtitle}>{roleLabel}</Text> : null}
          </View>

          <View style={styles.iconButtonPlaceholder} />
        </View>

        {!isLoading ? (
          <View style={styles.headerHero}>
            <Text style={styles.heroTitle}>Keep your details up to date</Text>
            <Text style={styles.heroSubtitle}>
              Accurate information helps us personalise alerts and keep your rides running smoothly.
            </Text>
          </View>
        ) : null}
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Personal information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>First name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#64748B" />
                  <TextInput
                    style={styles.input}
                    placeholder="John"
                    value={form.first_name}
                    onChangeText={(text) => handleChange("first_name", text)}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-circle-outline" size={20} color="#64748B" />
                  <TextInput
                    style={styles.input}
                    placeholder="Doe"
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
                  <Ionicons name="call-outline" size={20} color="#64748B" />
                  <TextInput
                    style={styles.input}
                    placeholder="07X XXX XXXX"
                    value={form.phone}
                    onChangeText={(text) => handleChange("phone", text)}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {!isLoading ? (
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[styles.saveButton, (isSaving) && styles.disabledButton]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={22} color="#FFFFFF" style={styles.saveIcon} />
                  <Text style={styles.saveButtonText}>Save changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 28,
    paddingTop: Platform.OS === "ios" ? 20 : 10,
    elevation: 6,
    shadowColor: AppColors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerHero: {
    marginTop: 18,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: AppColors.card,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#E0ECFF",
    fontWeight: "500",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.card,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.8)",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  iconButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  sectionCard: {
    backgroundColor: AppColors.card,
    borderRadius: 20,
    padding: 22,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.soft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: AppColors.text,
  },
  actionBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveIcon: {
    marginRight: 10,
  },
  saveButtonText: {
    color: AppColors.card,
    fontSize: 16,
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
    marginTop: 12,
    fontSize: 15,
    color: AppColors.textMuted,
  },
});
