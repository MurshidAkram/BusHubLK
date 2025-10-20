import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { driverAPI } from "../services/api";
import { useDriver } from "../context/DriverContext";

// App Color Palette (matching TrackingScreen)
const AppColors = {
  background: "#F8F9FA",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  text: "#212529",
  textSecondary: "#6C757D",
  border: "#DEE2E6",
  success: "#198754",
  danger: "#dc3545",
};

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { driverData } = useDriver();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-fill email if user is logged in
  useEffect(() => {
    if (driverData?.email) {
      setEmail(driverData.email);
    }
  }, [driverData]);

  const handleResetRequest = async () => {
    if (!email.trim()) {
      Alert.alert(
        "⚠️ Error", 
        "Please enter your email address to continue."
      );
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(
        "⚠️ Invalid Email", 
        "Please enter a valid email address.\n\nExample: driver@sltb.lk"
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await driverAPI.requestPasswordReset(email.trim());

      if (response.success) {
        Alert.alert(
          "✅ Email Sent Successfully",
          "A password reset link has been sent to your email address.\n\n📧 Please check your inbox and spam folder, then follow the instructions to reset your password.",
          [
            {
              text: "Got it!",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          "❌ Error",
          response.error || "Failed to send reset email. Please try again.\n\nIf the problem persists, contact your depot manager."
        );
      }
    } catch (error) {
      console.error("Password reset request error:", error);
      Alert.alert(
        "❌ Network Error",
        "Unable to connect to the server. Please check your internet connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

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
        
        {/* Enhanced Header with Gradient (matching TrackingScreen) */}
        <LinearGradient
          colors={['#0056b3', '#1976d2', '#42a5f5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reset Password</Text>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Main Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="lock-reset"
                  size={28}
                  color={AppColors.primary}
                />
                <Text style={styles.cardTitle}>Password Reset</Text>
              </View>

              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons 
                    name="email-lock" 
                    size={60} 
                    color={AppColors.primary} 
                  />
                </View>
              </View>

              <Text style={styles.infoTitle}>Forgot Your Password?</Text>
              <Text style={styles.infoDescription}>
                Enter your email address and we'll send you a secure link to reset your password.
              </Text>

              {/* Email Input Section */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={[
                  styles.inputWrapper,
                  driverData && styles.inputWrapperReadonly
                ]}>
                  <Ionicons
                    name="mail"
                    size={20}
                    color={driverData ? AppColors.textSecondary : AppColors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder={driverData ? "Your registered email" : "driver@sltb.lk"}
                    placeholderTextColor={AppColors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    style={[
                      styles.input,
                      driverData && styles.inputReadonly
                    ]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!isLoading && !driverData}
                  />
                  {driverData && (
                    <Ionicons
                      name="lock-closed"
                      size={18}
                      color={AppColors.textSecondary}
                      style={styles.lockIcon}
                    />
                  )}
                </View>
              </View>

              {/* Button Row - Side by Side */}
              <View style={styles.buttonRow}>
                {/* Back to Login Button */}
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backToLoginButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="arrow-back-circle"
                    size={22}
                    color={AppColors.primary}
                  />
                  <Text style={styles.backToLoginText}>Back to Login</Text>
                </TouchableOpacity>

                {/* Send Reset Link Button */}
                <TouchableOpacity
                  style={[
                    styles.sendButtonContainer,
                    isLoading && styles.sendButtonDisabled,
                  ]}
                  onPress={handleResetRequest}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#0056b3', '#1976d2', '#42a5f5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.sendButton}
                  >
                    <View style={styles.sendButtonContent}>
                      <Ionicons 
                        name={isLoading ? "hourglass" : "send"} 
                        size={20} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.sendButtonText}>
                        {isLoading ? "Sending..." : "Send Link"}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Help Section */}
            <View style={styles.helpCard}>
              <View style={styles.helpHeader}>
                <MaterialCommunityIcons
                  name="help-circle"
                  size={24}
                  color={AppColors.primary}
                />
                <Text style={styles.helpTitle}>Need Help?</Text>
              </View>
              
              <Text style={styles.helpText}>
                If you're having trouble resetting your password, please contact your depot administrator or manager for assistance.
              </Text>
            </View>
          </ScrollView>
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
  },
  headerGradient: {
    paddingTop: Platform.OS === "android" ? 10 : 0,
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
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
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 12,
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 16,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: AppColors.text,
    marginLeft: 10,
  },
  iconContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  iconCircle: {
    backgroundColor: "#E3F2FD",
    borderRadius: 65,
    width: 130,
    height: 130,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: AppColors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 15,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E3F2FD",
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperReadonly: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
    height: "100%",
  },
  inputReadonly: {
    color: AppColors.textSecondary,
  },
  lockIcon: {
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  backToLoginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#F8FAFF",
    borderWidth: 1.5,
    borderColor: "#E3F2FD",
    flex: 1,
  },
  backToLoginText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.primary,
    marginLeft: 8,
  },
  sendButtonContainer: {
    borderRadius: 14,
    overflow: "hidden",
    flex: 1,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButton: {
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  sendButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  helpCard: {
    backgroundColor: "#F8FAFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#E3F2FD",
  },
  helpHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: AppColors.text,
    marginLeft: 10,
  },
  helpText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 22,
  },
});
