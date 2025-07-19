"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { submitConditionReport, fetchBuses, storageAPI } from "../services/api";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ConditionReportForm = () => {
  const [issueDescription, setIssueDescription] = useState("");
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState("");
  const [conditionStatus, setConditionStatus] = useState("Good");
  const [driverId, setDriverId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeForm();
  }, []);

  const initializeForm = async () => {
    try {
      setLoading(true);

      // Get driver ID from stored user data
      const userData = await storageAPI.getUserData();

      if (userData && userData.driver_id) {
        setDriverId(userData.driver_id);
      } else {
        Alert.alert(
          "Error",
          "Driver information not found. Please log in again."
        );
        return;
      }

      // Fetch buses using your API service
      const busData = await fetchBuses();
      setBuses(busData);
      if (busData.length > 0) {
        setSelectedBus(busData[0].bus_id.toString());
      }
    } catch (error) {
      console.error("❌ Error initializing form:", error);
      Alert.alert("Error", "Failed to load form data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedBus) {
      Alert.alert("Validation Error", "Please select a bus.");
      return;
    }
    if (!conditionStatus) {
      Alert.alert("Validation Error", "Please select a condition status.");
      return;
    }
    if (!issueDescription.trim()) {
      Alert.alert(
        "Validation Error",
        "Please provide a description of the issue."
      );
      return;
    }
    if (!driverId) {
      Alert.alert(
        "Error",
        "Driver information not found. Please log in again."
      );
      return;
    }

    const reportData = {
      busId: Number.parseInt(selectedBus),
      driverId: driverId,
      conditionStatus,
      description: issueDescription,
      reportTime: new Date().toISOString(),
    };

    try {
      setLoading(true);

      await submitConditionReport(reportData);

      Alert.alert("Success", "Report submitted successfully.");

      // Reset form
      setIssueDescription("");
      setConditionStatus("Good");
      if (buses.length > 0) {
        setSelectedBus(buses[0].bus_id.toString());
      }
    } catch (error) {
      console.error("❌ Error submitting report:", error);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Good":
        return "#10B981";
      case "Minor Issues":
        return "#F59E0B";
      case "Major Issues":
        return "#EF4444";
      case "Out of Service":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Good":
        return "✅";
      case "Minor Issues":
        return "⚠️";
      case "Major Issues":
        return "🔧";
      case "Out of Service":
        return "❌";
      default:
        return "📋";
    }
  };

  if (loading && buses.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading buses...</Text>
          <View style={styles.loadingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Enhanced Header with Gradient Effect */}
        <View style={styles.headerContainer}>
          <View style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Text style={styles.headerIconText}>🚌</Text>
              </View>
              <Text style={styles.title}>Bus Condition Report</Text>
              <Text style={styles.subtitle}>
                Report any issues with your assigned bus
              </Text>
              <View style={styles.headerDecoration} />
            </View>
          </View>
        </View>

        {/* Enhanced Form Container */}
        <View style={styles.formContainer}>
          {/* Bus Selection Card */}
          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputIcon}>🚍</Text>
              <Text style={styles.label}>Select Bus</Text>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedBus}
                onValueChange={(itemValue) => setSelectedBus(itemValue)}
                style={styles.picker}
                enabled={!loading}
                mode="dropdown"
              >
                <Picker.Item label="Choose a bus..." value="" />
                {buses.map((bus) => (
                  <Picker.Item
                    key={bus.bus_id}
                    label={`${
                      bus.registration_number || `Bus ${bus.bus_id}`
                    } (${bus.status})`}
                    value={bus.bus_id.toString()}
                  />
                ))}
              </Picker>
              <View style={styles.pickerArrow}>
                <Text style={styles.arrowText}>▼</Text>
              </View>
            </View>
          </View>

          {/* Condition Status Card */}
          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputIcon}>📊</Text>
              <Text style={styles.label}>Condition Status</Text>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={conditionStatus}
                onValueChange={(itemValue) => setConditionStatus(itemValue)}
                style={styles.picker}
                enabled={!loading}
                mode="dropdown"
              >
                <Picker.Item label="✅ Good" value="Good" />
                <Picker.Item label="⚠️ Minor Issues" value="Minor Issues" />
                <Picker.Item label="🔧 Major Issues" value="Major Issues" />
                <Picker.Item label="❌ Out of Service" value="Out of Service" />
              </Picker>
              <View style={styles.pickerArrow}>
                <Text style={styles.arrowText}>▼</Text>
              </View>
            </View>
            {/* Status Indicator */}
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(conditionStatus) + "20" },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusIcon(conditionStatus)} Current Status:{" "}
                {conditionStatus}
              </Text>
            </View>
          </View>

          {/* Issue Description Card */}
          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputIcon}>📝</Text>
              <Text style={styles.label}>Issue Description</Text>
            </View>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Describe the issue in detail (e.g., engine noise, faulty lights, brake problems)"
                value={issueDescription}
                onChangeText={setIssueDescription}
                multiline
                numberOfLines={Platform.OS === "ios" ? 4 : undefined}
                editable={!loading}
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
              />
              <View style={styles.textAreaFooter}>
                <Text style={styles.characterCount}>
                  {issueDescription.length} characters
                </Text>
              </View>
            </View>
          </View>

          {/* Enhanced Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.buttonGradient}>
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.buttonText}>Submitting Report...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonIcon}>📤</Text>
                  <Text style={styles.buttonText}>Submit Report</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Footer Info */}
          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>
              💡 Your report helps maintain bus safety and reliability
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },

  // Enhanced Loading Styles
  loadingContainer: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: screenWidth * 0.045,
    color: "#6B7280",
    fontWeight: "600",
  },
  loadingDots: {
    flexDirection: "row",
    marginTop: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4F46E5",
    marginHorizontal: 3,
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.7 },
  dot3: { opacity: 1 },

  // Enhanced Header Styles
  headerContainer: {
    marginTop: Platform.OS === "ios" ? 40 : 20,
  },
  headerGradient: {
    backgroundColor: "#4F46E5",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: screenHeight * 0.05,
    paddingHorizontal: screenWidth * 0.05,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: "relative",
    overflow: "hidden",
  },
  headerContent: {
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  headerIconText: {
    fontSize: 40,
  },
  title: {
    fontSize: screenWidth * 0.07,
    fontWeight: Platform.OS === "ios" ? "700" : "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: screenWidth * 0.04,
    color: "#E0E7FF",
    textAlign: "center",
    opacity: 0.9,
    lineHeight: screenWidth * 0.05,
    maxWidth: "80%",
  },
  headerDecoration: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },

  // Enhanced Form Styles
  formContainer: {
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: screenHeight * 0.03,
    paddingBottom: screenHeight * 0.03,
  },
  inputCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: screenHeight * 0.025,
    padding: screenWidth * 0.05,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: screenHeight * 0.015,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  label: {
    fontSize: screenWidth * 0.045,
    fontWeight: Platform.OS === "ios" ? "600" : "bold",
    color: "#1F2937",
    flex: 1,
  },

  // Enhanced Picker Styles
  pickerContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
    overflow: "hidden",
  },
  picker: {
    height: Platform.OS === "ios" ? 55 : 50,
    color: "#374151",
    fontSize: screenWidth * 0.04,
  },
  pickerArrow: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -10 }],
    pointerEvents: "none",
  },
  arrowText: {
    color: "#9CA3AF",
    fontSize: 12,
  },

  // Status Indicator
  statusIndicator: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  statusText: {
    fontSize: screenWidth * 0.035,
    color: "#374151",
    fontWeight: "500",
  },

  // Enhanced Text Area Styles
  textAreaContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  textArea: {
    padding: screenWidth * 0.04,
    fontSize: screenWidth * 0.04,
    color: "#374151",
    minHeight: screenHeight * 0.15,
    maxHeight: screenHeight * 0.25,
    lineHeight: screenWidth * 0.05,
    textAlignVertical: "top",
  },
  textAreaFooter: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  characterCount: {
    fontSize: screenWidth * 0.03,
    color: "#6B7280",
    textAlign: "right",
  },

  // Enhanced Button Styles
  submitButton: {
    borderRadius: 16,
    marginTop: screenHeight * 0.03,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonGradient: {
    backgroundColor: "#4F46E5",
    paddingVertical: screenHeight * 0.022,
    paddingHorizontal: screenWidth * 0.05,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: screenWidth * 0.045,
    fontWeight: Platform.OS === "ios" ? "600" : "bold",
    textAlign: "center",
  },

  // Footer Styles
  footerInfo: {
    marginTop: screenHeight * 0.03,
    padding: screenWidth * 0.04,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  footerText: {
    fontSize: screenWidth * 0.035,
    color: "#1E40AF",
    textAlign: "center",
    fontWeight: "500",
  },
});

export default ConditionReportForm;
