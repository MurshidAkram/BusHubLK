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
import { useNavigation } from "@react-navigation/native";
import { driverAPI } from "../services/api";
import { useDriver } from "../context/DriverContext";

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
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await driverAPI.requestPasswordReset(email.trim());

      if (response.success) {
        Alert.alert(
          "Email Sent",
          "A password reset link has been sent to your email address. Please check your inbox and follow the instructions.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          response.error || "Failed to send reset email. Please try again."
        );
      }
    } catch (error) {
      console.error("Password reset request error:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

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
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Reset Password</Text>
            </View>

            {/* Main Content */}
            <View style={styles.contentContainer}>
              <View style={styles.card}>
                <View style={styles.iconContainer}>
                  <Ionicons name="mail-outline" size={48} color="#3b82f6" />
                </View>

                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  Enter your email address and we'll send you a link to reset
                  your password.
                </Text>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <View style={[
                    styles.inputWrapper,
                    driverData && styles.inputWrapperReadonly
                  ]}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={driverData ? "#9ca3af" : "#6b7280"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder={driverData ? "Your registered email address" : "Enter your email address"}
                      placeholderTextColor="#9ca3af"
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
                        name="lock-closed-outline"
                        size={16}
                        color="#9ca3af"
                        style={styles.lockIcon}
                      />
                    )}
                  </View>
                  {driverData && (
                    <Text style={styles.readonlyText}>
                      Email cannot be changed while logged in
                    </Text>
                  )}
                </View>

                {/* Send Reset Link Button */}
                <TouchableOpacity
                  style={[
                    styles.resetButton,
                    isLoading && styles.resetButtonDisabled,
                  ]}
                  onPress={handleResetRequest}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#3b82f6", "#1d4ed8"]}
                    style={styles.resetButtonGradient}
                  >
                    <View style={styles.resetButtonContent}>
                      <Ionicons name="send-outline" size={20} color="#ffffff" />
                      <Text style={styles.resetButtonText}>
                        {isLoading ? "Sending..." : "Send Reset Link"}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Back to Login */}
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
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

              {/* Help Text */}
              <View style={styles.helpContainer}>
                <Text style={styles.helpText}>
                  Having trouble? Contact your depot administrator for
                  assistance.
                </Text>
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
    marginBottom: 24,
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
    marginBottom: 24,
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
  helpContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
  },
  helpText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  inputWrapperReadonly: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  inputReadonly: {
    color: "#000000",
  },
  lockIcon: {
    marginLeft: 8,
  },
  readonlyText: {
    color: "#000000",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "500",
  },
});
