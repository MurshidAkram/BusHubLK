import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { storageAPI } from "../services/api";

// --- App Color Palette ---
const AppColors = {
  background: "#F8F9FA",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  text: "#212529",
  textSecondary: "#6C757D",
  border: "#DEE2E6",
  red: "#dc3545",
  yellow: "#ffc107",
  green: "#198754",
};

export default function ComplaintHistoryScreen() {
  const navigation = useNavigation();
  const [complaints, setComplaints] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Function to fetch user complaints
  const fetchUserComplaints = async () => {
    setRefreshing(true); // Start refreshing state
    try {
      // --- THIS IS THE FIX ---
      // Get the token directly instead of from the userData object
      const token = await storageAPI.getAuthToken();
      if (!token) {
        Alert.alert("Authentication Error", "Please log in to view your complaints.");
        // No need to setRefreshing to false here, finally block will handle it
        return;
      }
      // --- END OF FIX ---

      const baseURL = "http://192.168.43.114:5000";
      const response = await fetch(`${baseURL}/api/complaints/my-complaints`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      const result = await response.json();

      if (response.ok) {
        setComplaints(result.complaints);
      } else {
        Alert.alert("Error", result.message || "Failed to fetch complaints");
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
      Alert.alert("Error", "Failed to fetch complaints. Please try again.");
    } finally {
      setRefreshing(false); // Stop refreshing state in all cases
    }
  };

  // useFocusEffect will re-fetch data every time the screen comes into view
  useFocusEffect(
    useCallback(() => {
      fetchUserComplaints();
    }, [])
  );

  // Function to handle manual refresh
  const onRefresh = useCallback(() => {
    fetchUserComplaints();
  }, []);


  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options as Intl.DateTimeFormatOptions);
  };

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return AppColors.yellow;
      case "In Progress":
        return AppColors.primary;
      case "Resolved":
        return AppColors.green;
      case "Rejected":
        return AppColors.red;
      default:
        return AppColors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconContainer}
        >
          <Ionicons name="arrow-back-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Complaints</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {complaints.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={60}
              color={AppColors.textSecondary}
            />
            <Text style={styles.emptyTitle}>No complaints yet</Text>
            <Text style={styles.emptyText}>
              Your submitted complaints will appear here.
            </Text>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => navigation.navigate("Complaints" as never)}
            >
              <Text style={styles.submitButtonText}>Submit a New Complaint</Text>
            </TouchableOpacity>
          </View>
        ) : (
          complaints.map((complaint: any) => (
            <View key={complaint.id} style={styles.complaintCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.complaintType}>
                  {complaint.complaint_type.replace(/_/g, " ")}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(complaint.status) },
                  ]}
                >
                  <Text style={styles.statusText}>{complaint.status}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="bus-outline"
                    size={18}
                    color={AppColors.textSecondary}
                  />
                  <Text style={styles.infoText}>
                    Route {complaint.route_number}
                  </Text>
                </View>

                {complaint.bus_number && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color={AppColors.textSecondary}
                    />
                    <Text style={styles.infoText}>
                      Bus {complaint.bus_number}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={AppColors.textSecondary}
                  />
                  <Text style={styles.infoText}>{complaint.location}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={AppColors.textSecondary}
                  />
                  <Text style={styles.infoText}>
                    {formatDate(complaint.incident_date)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.submittedText}>
                  Submitted on {formatDate(complaint.created_at)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: 60,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  headerIconContainer: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.text,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
    paddingHorizontal: 30,
  },
  submitButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  complaintCard: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  complaintType: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.text,
    textTransform: "capitalize",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cardBody: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.text,
    marginLeft: 10,
  },
  cardFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  submittedText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: "right",
  },
});