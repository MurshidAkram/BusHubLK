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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from '@react-navigation/native';
import { driverAPI } from "../services/api";

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = route.params as { token: string };

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    try {
      const response = await driverAPI.validateResetToken(token);
      if (response.success) {
        setUserEmail(response.email);
      } else {
        Alert.alert(
          "Invalid Link",
          "This password reset link is invalid or has expired. Please request a new one.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("DriverLogin"),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Token validation error:", error);
      Alert.alert("Error", "Unable to validate reset link. Please try again.", [
        {
          text: "OK",
          onPress: () => navigation.navigate("DriverLogin"),
        },
      ]);
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      Alert.alert(
        "Error",
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await driverAPI.resetPassword(token, newPassword);

      if (response.success) {
        Alert.alert(
          "Success",
          "Your password has been reset successfully. You can now login with your new password.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("DriverLogin"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          response.error || "Failed to reset password. Please try again."
        );
      }
    } catch (error) {
      console.error("Password reset error:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <LinearGradient
        colors={["#1e3a8a", "#3b82f6", "#60a5fa"]}
        style={styles.gradient}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Validating reset link...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <LinearGradient
        colors={["#1e3a8a", "#3b82f6", "#60a5fa"]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.headerContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate("DriverLogin")}
              >
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Reset Password</Text>
            </View>

            {/* Main Content */}
            <View style={styles.contentContainer}>
              <View style={styles.card}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={48}
                    color="#3b82f6"
                  />
                </View>

                <Text style={styles.title}>Create New Password</Text>
                <Text style={styles.subtitle}>
                  Enter a new password for {userEmail}
                </Text>

                {/* New Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#6b7280"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="New Password"
                      placeholderTextColor="#9ca3af"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      style={[styles.input, styles.passwordInput]}
                      secureTextEntry={!showNewPassword}
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={
                          showNewPassword ? "eye-outline" : "eye-off-outline"
                        }
                        size={20}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#6b7280"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="Confirm New Password"
                      placeholderTextColor="#9ca3af"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      style={[styles.input, styles.passwordInput]}
                      secureTextEntry={!showConfirmPassword}
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-outline"
                            : "eye-off-outline"
                        }
                        size={20}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Password Requirements */}
                <View style={styles.requirementsContainer}>
                  <Text style={styles.requirementsTitle}>
                    Password must contain:
                  </Text>
                  <Text style={styles.requirementItem}>
                    • At least 6 characters
                  </Text>
                  <Text style={styles.requirementItem}>
                    • One uppercase letter
                  </Text>
                  <Text style={styles.requirementItem}>
                    • One lowercase letter
                  </Text>
                  <Text style={styles.requirementItem}>• One number</Text>
                </View>

                {/* Reset Password Button */}
                <TouchableOpacity
                  style={[
                    styles.resetButton,
                    isLoading && styles.resetButtonDisabled,
                  ]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#3b82f6", "#1d4ed8"]}
                    style={styles.resetButtonGradient}
                  >
                    <View style={styles.resetButtonContent}>
                      <Ionicons
                        name="checkmark-outline"
                        size={20}
                        color="#ffffff"
                      />
                      <Text style={styles.resetButtonText}>
                        {isLoading ? "Resetting..." : "Reset Password"}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Back to Login */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("DriverLogin")}
                  style={styles.backToLoginContainer}
                >
                  <Ionicons
                    name="arrow-back-outline"
                    size={16}
                    color="#3b82f6"
                  />
                  <Text style={styles.backToLoginText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    height: "100%",
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  requirementsContainer: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },
  resetButton: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#3b82f6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resetButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  backToLoginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  backToLoginText: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "600",
  },
});

