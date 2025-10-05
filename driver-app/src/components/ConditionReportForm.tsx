"use client";

import React, { useState, useEffect } from "react";
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
import { conditionReportAPI, fetchBuses, storageAPI } from "../services/api";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ConditionReportForm = () => {
  const [issueDescription, setIssueDescription] = useState("");
  const [buses, setBuses] = useState<any[]>([]);
  const [selectedBus, setSelectedBus] = useState("");
  const [conditionStatus, setConditionStatus] = useState("Good");
  const [driverId, setDriverId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Dropdown states
  const [busDropdownOpen, setBusDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

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

      await conditionReportAPI.submitReport(reportData);

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

  // Close dropdowns when scrolling or touching outside
  const closeDropdowns = () => {
    setBusDropdownOpen(false);
    setStatusDropdownOpen(false);
  };

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
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
        onScrollBeginDrag={closeDropdowns}
        keyboardShouldPersistTaps="handled"
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
              {selectedBus && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedText}>✓</Text>
                </View>
              )}
            </View>
            
            {/* Custom Bus Dropdown */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  busDropdownOpen && styles.dropdownButtonOpen,
                  loading && styles.dropdownDisabled
                ]}
                onPress={() => !loading && setBusDropdownOpen(!busDropdownOpen)}
                disabled={loading}
              >
                <Text style={[
                  styles.dropdownButtonText,
                  !selectedBus && styles.dropdownPlaceholderText
                ]}>
                  {selectedBus 
                    ? (() => {
                        const selectedBusDetails = buses.find(b => b.bus_id.toString() === selectedBus);
                        return selectedBusDetails 
                          ? `${selectedBusDetails.registration_number || `Bus ${selectedBusDetails.bus_id}`} - ${selectedBusDetails.manufacturer} ${selectedBusDetails.model}`
                          : "Choose a bus...";
                      })()
                    : "Choose a bus..."
                  }
                </Text>
                <Text style={[
                  styles.dropdownArrow,
                  busDropdownOpen && styles.dropdownArrowOpen
                ]}>
                  ▼
                </Text>
              </TouchableOpacity>
              
              {busDropdownOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView 
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                  >
                    {buses.length === 0 ? (
                      <TouchableOpacity style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemTextDisabled}>No buses assigned</Text>
                      </TouchableOpacity>
                    ) : (
                      buses.map((bus) => (
                        <TouchableOpacity
                          key={bus.bus_id}
                          style={[
                            styles.dropdownItem,
                            selectedBus === bus.bus_id.toString() && styles.dropdownItemSelected
                          ]}
                          onPress={() => {
                            setSelectedBus(bus.bus_id.toString());
                            setBusDropdownOpen(false);
                          }}
                        >
                          <View style={styles.dropdownItemContent}>
                            <View style={styles.dropdownItemMain}>
                              <Text style={[
                                styles.dropdownItemText,
                                selectedBus === bus.bus_id.toString() && styles.dropdownItemTextSelected
                              ]}>
                                {bus.registration_number || `Bus ${bus.bus_id}`}
                              </Text>
                              <Text style={styles.dropdownItemSubtext}>
                                {bus.manufacturer} {bus.model}
                              </Text>
                            </View>
                            <View style={[
                              styles.dropdownItemStatus,
                              { backgroundColor: bus.status === 'Active' ? '#10B981' : '#F59E0B' }
                            ]}>
                              <Text style={styles.dropdownItemStatusText}>{bus.status}</Text>
                            </View>
                            {selectedBus === bus.bus_id.toString() && (
                              <Text style={styles.dropdownItemCheck}>✓</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
            
            {/* Display selected bus details */}
            {selectedBus && buses.find(b => b.bus_id.toString() === selectedBus) && (
              <View style={styles.selectedBusDetails}>
                {(() => {
                  const selectedBusDetails = buses.find(b => b.bus_id.toString() === selectedBus);
                  return (
                    <View style={styles.busDetailsContainer}>
                      <View style={styles.busDetailRow}>
                        <Text style={styles.busDetailLabel}>Registration:</Text>
                        <Text style={styles.busDetailValue}>{selectedBusDetails.registration_number}</Text>
                      </View>
                      <View style={styles.busDetailRow}>
                        <Text style={styles.busDetailLabel}>Vehicle:</Text>
                        <Text style={styles.busDetailValue}>{selectedBusDetails.manufacturer} {selectedBusDetails.model}</Text>
                      </View>
                      <View style={styles.busDetailRow}>
                        <Text style={styles.busDetailLabel}>Class:</Text>
                        <Text style={styles.busDetailValue}>Class {selectedBusDetails.class}</Text>
                      </View>
                      <View style={styles.busDetailRow}>
                        <Text style={styles.busDetailLabel}>Status:</Text>
                        <View style={[styles.statusBadge, { backgroundColor: selectedBusDetails.status === 'Active' ? '#10B981' : '#F59E0B' }]}>
                          <Text style={styles.statusBadgeText}>{selectedBusDetails.status}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}
          </View>

          {/* Condition Status Card */}
          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputIcon}>📊</Text>
              <Text style={styles.label}>Condition Status</Text>
              <View style={[styles.selectedIndicator, { backgroundColor: getStatusColor(conditionStatus) }]}>
                <Text style={styles.selectedText}>{getStatusIcon(conditionStatus)}</Text>
              </View>
            </View>
            
            {/* Custom Status Dropdown */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  statusDropdownOpen && styles.dropdownButtonOpen,
                  loading && styles.dropdownDisabled
                ]}
                onPress={() => !loading && setStatusDropdownOpen(!statusDropdownOpen)}
                disabled={loading}
              >
                <Text style={styles.dropdownButtonText}>
                  {getStatusIcon(conditionStatus)} {conditionStatus}
                </Text>
                <Text style={[
                  styles.dropdownArrow,
                  statusDropdownOpen && styles.dropdownArrowOpen
                ]}>
                  ▼
                </Text>
              </TouchableOpacity>
              
              {statusDropdownOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView 
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {[
                      { label: "Good", value: "Good", icon: "✅", color: "#10B981" },
                      { label: "Minor Issues", value: "Minor Issues", icon: "⚠️", color: "#F59E0B" },
                      { label: "Major Issues", value: "Major Issues", icon: "🔧", color: "#EF4444" },
                      { label: "Out of Service", value: "Out of Service", icon: "❌", color: "#DC2626" }
                    ].map((status) => (
                      <TouchableOpacity
                        key={status.value}
                        style={[
                          styles.dropdownItem,
                          conditionStatus === status.value && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          setConditionStatus(status.value);
                          setStatusDropdownOpen(false);
                        }}
                      >
                        <View style={styles.dropdownItemContent}>
                          <View style={styles.dropdownItemMain}>
                            <Text style={[
                              styles.dropdownItemText,
                              conditionStatus === status.value && styles.dropdownItemTextSelected
                            ]}>
                              {status.icon} {status.label}
                            </Text>
                          </View>
                          <View style={[
                            styles.dropdownItemStatus,
                            { backgroundColor: status.color }
                          ]}>
                            <Text style={styles.dropdownItemStatusText}>{status.label}</Text>
                          </View>
                          {conditionStatus === status.value && (
                            <Text style={styles.dropdownItemCheck}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            
            {/* Enhanced Status Indicator */}
            <View style={styles.selectedBusDetails}>
              <View style={styles.busDetailsContainer}>
                <View style={styles.busDetailRow}>
                  <Text style={styles.busDetailLabel}>Selected Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(conditionStatus) }]}>
                    <Text style={styles.statusBadgeText}>
                      {getStatusIcon(conditionStatus)} {conditionStatus}
                    </Text>
                  </View>
                </View>
                <View style={styles.busDetailRow}>
                  <Text style={styles.busDetailLabel}>Description Required:</Text>
                  <Text style={styles.busDetailValue}>
                    {conditionStatus === 'Good' ? 'Optional' : 'Recommended'}
                  </Text>
                </View>
              </View>
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
    backgroundColor: "#0076e3",
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
    backgroundColor: "#0076e3",
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
    backgroundColor: "#0076e3",
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

  // Bus Selection Enhancement Styles
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  selectedText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  selectedBusDetails: {
    marginTop: screenHeight * 0.02,
    padding: screenWidth * 0.04,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  busDetailsContainer: {
    gap: 8,
  },
  busDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  busDetailLabel: {
    fontSize: screenWidth * 0.035,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  busDetailValue: {
    fontSize: screenWidth * 0.035,
    color: "#374151",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-end",
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: screenWidth * 0.03,
    fontWeight: "600",
  },

  // Custom Dropdown Styles
  dropdownContainer: {
    position: "relative",
    zIndex: 1000,
  },
  dropdownButton: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.018,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 50,
  },
  dropdownButtonOpen: {
    borderColor: "#4F46E5",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownDisabled: {
    opacity: 0.6,
    backgroundColor: "#F3F4F6",
  },
  dropdownButtonText: {
    fontSize: screenWidth * 0.04,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  dropdownPlaceholderText: {
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  dropdownArrow: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
    transform: [{ rotate: "0deg" }],
  },
  dropdownArrowOpen: {
    transform: [{ rotate: "180deg" }],
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#4F46E5",
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    zIndex: 1001,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: {
    backgroundColor: "#EFF6FF",
  },
  dropdownItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownItemMain: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: screenWidth * 0.04,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 2,
  },
  dropdownItemTextSelected: {
    color: "#4F46E5",
  },
  dropdownItemTextDisabled: {
    fontSize: screenWidth * 0.04,
    color: "#9CA3AF",
    fontStyle: "italic",
    textAlign: "center",
  },
  dropdownItemSubtext: {
    fontSize: screenWidth * 0.035,
    color: "#6B7280",
    fontWeight: "400",
  },
  dropdownItemStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  dropdownItemStatusText: {
    color: "#fff",
    fontSize: screenWidth * 0.03,
    fontWeight: "600",
  },
  dropdownItemCheck: {
    fontSize: 16,
    color: "#4F46E5",
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default ConditionReportForm;
