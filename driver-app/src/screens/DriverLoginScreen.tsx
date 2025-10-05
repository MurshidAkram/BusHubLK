import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { driverAPI, storageAPI } from "../services/api";
import { locationService } from "../services/locationService";

const { width, height } = Dimensions.get("window");

export default function DriverLoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both Email and Password");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Attempting driver login...");

      const response = await driverAPI.loginDriver({
        email: email.trim(),
        password: password.trim(),
      });

      console.log("Login response:", response);

      if (response.success) {
        
        // Store the token and user data using storageAPI
        await storageAPI.storeAuthToken(response.token);

        // Fetch assigned bus and route info from daily assignment
        let userData = response.user;
        
        try {
          console.log("Fetching daily assignment for driver:", userData.driver_id);
          const assignmentResponse = await driverAPI.getDailyAssignment(userData.driver_id.toString());
          
          if (assignmentResponse && assignmentResponse.bus_id && assignmentResponse.route_id) {
            console.log("Daily assignment found:", {
              bus_id: assignmentResponse.bus_id,
              route_id: assignmentResponse.route_id,
              assignment_id: assignmentResponse.assignment_id
            });
            
            userData = { 
              ...userData, 
              busId: assignmentResponse.bus_id.toString(), 
              routeId: assignmentResponse.route_id.toString(),
              assignmentId: assignmentResponse.assignment_id,
              busRegistration: assignmentResponse.bus_registration
            };
            
            // Also set assignment data in location service
            locationService.setCurrentAssignment({
              bus_id: assignmentResponse.bus_id,
              route_id: assignmentResponse.route_id,
              driver_id: userData.driver_id,
              assignment_id: assignmentResponse.assignment_id
            });
          } else {
            console.warn("No active daily assignment found for driver:", userData.driver_id);
          }
        } catch (error) {
          console.error("Failed to fetch daily assignment:", error);
        }

        await storageAPI.storeUserData(userData);

        // Start location tracking after storing user data
        if (userData.busId && userData.routeId) {
          console.log("Starting location tracking with assignment data");
          locationService.startSmartLocationTracking(userData.busId, userData.routeId, userData.busRegistration);
        } else {
          console.warn("Bus ID or Route ID missing - no active daily assignment found");
          Alert.alert(
            "No Assignment Found", 
            "You don't have an active daily assignment. Please contact your depot manager to assign you to a bus and route.",
            [{ text: "OK" }]
          );
        }

        setIsLoading(false);
        
        Alert.alert("Success", `Welcome ${userData.first_name}!`);
      } else {
        setIsLoading(false);
        Alert.alert(
          "Error",
          response.error || "Login failed. Please check your credentials."
        );
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Login error:", error);
      
      let errorMessage = "Network error. Please check your connection and try again.";
      
      if (error.message) {
        errorMessage = `Error: ${error.message}\n\nPlease ensure:\n1. You're on the same WiFi\n2. Backend is running\n3. Firewall allows connections`;
      }
      
      Alert.alert("Connection Error", errorMessage);
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
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/logowithoutbg_white.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.tagline}>Driver Portal</Text>
              <Text style={styles.subtitle}>
                Manage Your Routes Efficiently
              </Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <View style={styles.card}>
                <View style={styles.headerContainer}>
                  <Ionicons name="bus-outline" size={32} color="#3b82f6" />
                  <Text style={styles.welcomeText}>Driver Login</Text>
                </View>
                <Text style={styles.loginSubtitle}>
                  Enter your credentials to access the portal
                </Text>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color="#6b7280"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="Email"
                      placeholderTextColor="#9ca3af"
                      value={email}
                      onChangeText={setEmail}
                      style={styles.input}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                    />
                  </View>
                </View>
                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#6b7280"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="#9ca3af"
                      value={password}
                      onChangeText={setPassword}
                      style={[styles.input, styles.passwordInput]}
                      secureTextEntry={!showPassword}
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Login Button */}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    isLoading && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#3b82f6", "#1d4ed8"]}
                    style={styles.loginButtonGradient}
                  >
                    <View style={styles.loginButtonContent}>
                      <Ionicons
                        name="log-in-outline"
                        size={20}
                        color="#ffffff"
                      />
                      <Text style={styles.loginButtonText}>
                        {isLoading ? "Signing In..." : "Sign In"}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
                {/* Forgot Password */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("ForgotPassword")}
                  style={styles.forgotPasswordContainer}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

// ... continuing from where we left off

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 35,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: -8,
    marginTop: 20,
  },

  tagline: {
    fontSize: 25,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    fontWeight: "800",
    marginBottom: 4,
    marginTop: -8,
  },
  subtitle: {
    fontSize: 19,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  formContainer: {
    flex: 1,
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
  headerContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
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
  loginButton: {
    marginTop: 8,
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
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  forgotPasswordContainer: {
    alignItems: "center",
  },
  forgotPasswordText: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "600",
  },
  
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dividerText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginHorizontal: 16,
  },
  
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  socialButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
