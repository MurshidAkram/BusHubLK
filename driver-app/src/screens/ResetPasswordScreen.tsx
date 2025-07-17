import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { driverAPI } from "../services/api";

const ResetPasswordScreen = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [tokenValid, setTokenValid] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);

  const navigation = useNavigation();
  const route = useRoute();

  // Add this to the beginning of your ResetPasswordScreen component
  useEffect(() => {
    // Show a brief loading message when the screen first loads
    const tokenFromParams = route.params?.token;

    if (tokenFromParams) {
      console.log("🔑 ResetPasswordScreen received token:", tokenFromParams);
      setToken(tokenFromParams);

      // Add a small delay to make the transition smoother
      setTimeout(() => {
        validateToken(tokenFromParams);
      }, 500);
    } else {
      console.error("❌ No token provided to ResetPasswordScreen");
      Alert.alert(
        "Error",
        "Invalid reset link. Please request a new password reset.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    }
  }, [route.params]);

  const validateToken = async (resetToken) => {
    try {
      setValidatingToken(true);
      console.log("🔍 Validating token:", resetToken);

      const response = await driverAPI.validateResetToken(resetToken);
      console.log("✅ Token validation response:", response);

      if (response.success) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        Alert.alert(
          "Error",
          response.error || "Invalid or expired reset link."
        );
        navigation.navigate("Login");
      }
    } catch (error) {
      console.error("❌ Token validation error:", error);
      setTokenValid(false);
      Alert.alert("Error", "Failed to validate reset link. Please try again.");
      navigation.navigate("Login");
    } finally {
      setValidatingToken(false);
    }
  };

  const validatePassword = () => {
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return false;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      Alert.alert(
        "Error",
        "Password must contain at least one uppercase letter, one lowercase letter, and one number."
      );
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;

    try {
      setLoading(true);
      console.log("🔄 Resetting password with token:", token);

      const response = await driverAPI.resetPassword(token, newPassword);
      console.log("✅ Password reset response:", response);

      if (response.success) {
        Alert.alert(
          "Success",
          "Password reset successfully! You can now login with your new password.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
      } else {
        Alert.alert("Error", response.error || "Failed to reset password.");
      }
    } catch (error) {
      console.error("❌ Password reset error:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.title}>🚌 BusHubLK</Text>
          <Text style={styles.loadingText}>Validating reset link...</Text>
        </View>
      </View>
    );
  }

  if (!tokenValid) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.title}>🚌 BusHubLK</Text>
          <Text style={styles.errorText}>Invalid or expired reset link</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.buttonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>🚌 BusHubLK</Text>
          <Text style={styles.subtitle}>Reset Your Password</Text>

          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <Text style={styles.requirementText}>
              • At least 6 characters long
            </Text>
            <Text style={styles.requirementText}>• One uppercase letter</Text>
            <Text style={styles.requirementText}>• One lowercase letter</Text>
            <Text style={styles.requirementText}>• One number</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Enter new password"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Confirm new password"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Resetting..." : "Reset Password"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#1e3a8a",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 30,
    color: "#374151",
  },
  requirementsContainer: {
    backgroundColor: "#f3f4f6",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
  },
  requirementText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    alignItems: "center",
    padding: 10,
  },
  backButtonText: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 20,
  },
});

export default ResetPasswordScreen;
